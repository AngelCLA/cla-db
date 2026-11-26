#!/usr/bin/env node
/**
 * CLA-DB: real browser integration lane.
 *
 * Verifies the SHA-256 of a prebuilt candidate archive, installs it into an
 * isolated Vite consumer, builds the test app and drives the scenarios with
 * Playwright against native IndexedDB (Dexie). The runner never builds,
 * packs, publishes or commits anything.
 *
 * Contract:
 *   node scripts/browser-integration/run.mjs \
 *     --artifact <absolute .tgz> --sha256 <hash> \
 *     --browser <chromium|firefox|webkit> --out <directory>
 *
 * Exit codes: 0 all scenarios passed, 1 at least one scenario failed,
 * 2 invalid arguments or artifact mismatch, 3 browser lane unavailable.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ArtifactError, BROWSERS, TOOL_PINS, verifyArtifact } from './artifact.mjs';
import { browserExecutable, createDriver, loadPlaywright } from './driver.mjs';
import { STATUS, LIMITATIONS, summarize, writeReports } from './report.mjs';
import { startServer } from './server.mjs';
import { suiteScenarios } from './tests/suite.mjs';
import { offlineScenarios } from './tests/offline.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appSourceDir = path.join(__dirname, 'app');
const APP_FILES = [
    'index.html',
    'main.js',
    'harness.js',
    'state.js',
    'offline.js',
    'vite.config.mjs',
    path.join('public', 'sw.js')
];

const USAGE = `CLA DB browser integration runner

Usage:
  node scripts/browser-integration/run.mjs \\
    --artifact <absolute path to the prebuilt .tgz> \\
    --sha256 <SHA-256 of that exact archive> \\
    --browser <chromium|firefox|webkit> \\
    --out <report directory> \\
    [--slice suite|offline|all] [--work-dir <dir>] [--playwright-dir <dir>] \\
    [--scenario <id>]... [--install-browser] [--timeout <ms>] [--keep] [--verbose]

The runner verifies the digest before installing anything and fails closed on
a mismatch. The archive is never rebuilt, packed, modified or published.

Scenario statuses:
  PASS        the scenario ran and every assertion held
  FAIL        the scenario ran and an assertion or setup step failed
  SKIP        the scenario was deliberately not executed
  UNSUPPORTED the environment cannot execute the scenario
  SKIP and UNSUPPORTED never count as passes and fail the gate.

Browser binaries:
  The lane needs the browser build of Playwright ${TOOL_PINS.playwright}. Point
  PLAYWRIGHT_BROWSERS_PATH at a project-owned cache, preinstall the browser in
  a separate step, or pass --install-browser to run
  "playwright install <browser>" in the isolated consumer. Linux OS
  dependencies are a separate authorized step:
  "npx playwright install-deps <browser>".

Exit codes: 0 all passed, 1 failure, 2 invalid arguments or artifact mismatch,
3 browser lane unavailable.`;

function parseArgs(argv) {
    const options = {
        artifact: null,
        sha256: null,
        browser: null,
        out: null,
        slice: 'all',
        workDir: null,
        playwrightDir: process.env.CLA_DB_PLAYWRIGHT_DIR || null,
        installBrowser: false,
        keep: false,
        scenarios: [],
        verbose: false,
        help: false,
        timeout: 120_000
    };
    for (let index = 0; index < argv.length; index++) {
        const arg = argv[index];
        const next = () => {
            const value = argv[index + 1];
            if (typeof value === 'undefined' || value.startsWith('--')) {
                throw new ArtifactError('missing value for ' + arg);
            }
            index++;
            return value;
        };
        switch (arg) {
            case '--artifact': options.artifact = next(); break;
            case '--sha256': options.sha256 = next(); break;
            case '--browser': options.browser = next(); break;
            case '--out': options.out = next(); break;
            case '--slice': options.slice = next(); break;
            case '--work-dir': options.workDir = next(); break;
            case '--playwright-dir': options.playwrightDir = next(); break;
            case '--timeout': options.timeout = Number(next()); break;
            case '--scenario': options.scenarios.push(next()); break;
            case '--install-browser': options.installBrowser = true; break;
            case '--keep': options.keep = true; break;
            case '--verbose': options.verbose = true; break;
            case '--help':
            case '-h': options.help = true; break;
            default:
                throw new ArtifactError('unknown argument: ' + arg);
        }
    }
    return options;
}

function validateOptions(options) {
    if (!options.artifact) throw new ArtifactError('--artifact is required');
    if (!options.sha256) throw new ArtifactError('--sha256 is required');
    if (!options.out) throw new ArtifactError('--out is required');
    if (!options.browser || !BROWSERS.includes(options.browser)) {
        throw new ArtifactError('--browser must be one of: ' + BROWSERS.join(', '));
    }
    if (!['suite', 'offline', 'all'].includes(options.slice)) {
        throw new ArtifactError('--slice must be one of: suite, offline, all');
    }
    if (!Number.isFinite(options.timeout) || options.timeout <= 0) {
        throw new ArtifactError('--timeout must be a positive number of milliseconds');
    }
}

function main(argv) {
    let options;
    try {
        options = parseArgs(argv);
    } catch (err) {
        console.error(err.message);
        console.error(USAGE);
        return 2;
    }
    if (options.help) {
        console.log(USAGE);
        return 0;
    }
    try {
        validateOptions(options);
    } catch (err) {
        console.error(err.message);
        console.error(USAGE);
        return 2;
    }

    /**
     * Artifact identity is checked before any scratch directory, install or
     * browser launch exists, so rejected input leaves no state behind.
     */
    let artifact;
    try {
        artifact = verifyArtifact({ artifactPath: options.artifact, sha256: options.sha256 });
    } catch (err) {
        console.error(err.message);
        return 2;
    }

    return runWithArtifact(options, artifact).catch(err => {
        console.error('browser integration run failed: ' + (err && err.stack ? err.stack : err));
        return 1;
    });
}

function readInstalledVersion(appDir, packageName) {
    const manifestPath = path.join(appDir, 'node_modules', ...packageName.split('/'), 'package.json');
    try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        return { version: manifest.version, name: manifest.name };
    } catch (err) {
        return null;
    }
}

function copyApp(appDir) {
    for (const relativePath of APP_FILES) {
        const source = path.join(appSourceDir, relativePath);
        const target = path.join(appDir, relativePath);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(source, target);
    }
}

function writeAppManifest({ appDir, artifact, options }) {
    const dependencies = {
        '@clatech/db': 'file:' + artifact.artifactPath,
        rxjs: TOOL_PINS.rxjs,
        vite: TOOL_PINS.vite
    };
    if (!options.playwrightDir) {
        dependencies.playwright = TOOL_PINS.playwright;
    }
    fs.writeFileSync(
        path.join(appDir, 'package.json'),
        JSON.stringify({
            name: 'cla-db-browser-integration-app',
            private: true,
            version: '0.0.0',
            type: 'module',
            dependencies
        }, null, 2) + '\n',
        'utf8'
    );
}

function commandEnvironment() {
    return Object.assign({}, process.env, { NODE_PATH: '', NODE_OPTIONS: '' });
}

function runCommand({ command, args, cwd, timeout, label }) {
    const result = spawnSync(command, args, {
        cwd,
        encoding: 'utf8',
        timeout,
        maxBuffer: 20 * 1024 * 1024,
        env: commandEnvironment()
    });
    if (result.error) {
        throw new Error(label + ' failed: ' + result.error.message);
    }
    if (result.status !== 0) {
        throw new Error(
            label + ' failed with exit code ' + result.status + '\n' +
            (result.stdout || '') + (result.stderr || '')
        );
    }
    return result;
}

function withTimeout(promise, milliseconds, label) {
    let timer;
    const timeout = new Promise((_resolve, reject) => {
        timer = setTimeout(
            () => reject(new Error('scenario ' + label + ' exceeded ' + milliseconds + 'ms')),
            milliseconds
        );
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function captureFailure({ page, dirs, scenarioId }) {
    if (!page) {
        return null;
    }
    try {
        const screenshotPath = path.join(dirs.screenshots, scenarioId + '.png');
        await page.screenshot({ path: screenshotPath, fullPage: true });
        return screenshotPath;
    } catch (err) {
        return null;
    }
}

async function runScenarios({ scenarios, driver, deps, dirs, artifacts, logBuffer }) {
    const results = [];
    for (const scenario of scenarios) {
        const startedAt = Date.now();
        const logStart = logBuffer.length;
        const record = {
            id: scenario.id,
            slice: scenario.slice,
            title: scenario.title,
            status: STATUS.FAIL,
            durationMs: 0,
            details: [],
            error: null
        };
        let page = null;
        let failed = true;
        try {
            page = await driver.page();
            await page.goto(deps.origin + '/', { waitUntil: 'load' });
            await page.waitForFunction(() => Boolean(window.__claDbHarness));
            await driver.startTrace('main');
            await withTimeout(
                scenario.run(Object.assign({}, deps, {
                    page,
                    detail: message => record.details.push(String(message))
                })),
                scenario.timeout ?? deps.timeout,
                scenario.id
            );
            record.status = STATUS.PASS;
            failed = false;
        } catch (err) {
            record.error = err && err.message ? err.message : String(err);
            const screenshot = await captureFailure({ page, dirs, scenarioId: scenario.id });
            if (screenshot) {
                record.details.push('screenshot: ' + screenshot);
                artifacts.screenshots.push(screenshot);
            }
        } finally {
            for (const profileName of driver.profileNames()) {
                try {
                    const tracePath = await driver.stopTrace(
                        profileName,
                        failed ? path.join(dirs.traces, scenario.id + '-' + profileName + '.zip') : null
                    );
                    if (tracePath) {
                        artifacts.traces.push(tracePath);
                        record.details.push('trace: ' + tracePath);
                    }
                } catch (err) {
                    logBuffer.push('trace stop failed for ' + profileName + ': ' + err.message);
                }
            }
            /**
             * The page is intentionally kept open between scenarios. Some
             * browsers tear down the window of a persistent context when its
             * last page closes, and the next newPage() would fail. The next
             * scenario navigates again, which gives it a fresh JS context.
             */
            const logPath = path.join(dirs.logs, scenario.id + '.log');
            const lines = logBuffer.slice(logStart);
            fs.writeFileSync(logPath, lines.join('\n') + '\n', 'utf8');
            artifacts.logs.push(logPath);
            record.durationMs = Date.now() - startedAt;
        }
        results.push(record);
    }
    return results;
}

function gitCommit() {
    const result = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', timeout: 30_000 });
    return result.status === 0 ? result.stdout.trim() : null;
}

async function runWithArtifact(options, artifact) {
    const logBuffer = [];
    const log = line => {
        logBuffer.push(line);
        if (options.verbose) {
            console.log(line);
        }
    };

    const startedAt = new Date().toISOString();
    const outDir = path.resolve(options.out);
    const dirs = {
        logs: path.join(outDir, 'logs'),
        traces: path.join(outDir, 'traces'),
        screenshots: path.join(outDir, 'screenshots')
    };
    const artifacts = { logs: [], traces: [], screenshots: [] };
    for (const directory of Object.values(dirs)) {
        fs.mkdirSync(directory, { recursive: true });
    }

    const baseWorkDir = options.workDir ? path.resolve(options.workDir) : os.tmpdir();
    fs.mkdirSync(baseWorkDir, { recursive: true });
    const workDir = fs.mkdtempSync(path.join(baseWorkDir, 'cla-db-browser-' + options.browser + '-'));
    const appDir = path.join(workDir, 'app');
    fs.mkdirSync(appDir, { recursive: true });
    log('work directory: ' + workDir);

    const reportBase = {
        tool: 'cla-db-browser-integration',
        version: 1,
        browser: options.browser,
        slice: options.slice,
        startedAt,
        artifact: {
            path: artifact.artifactPath,
            sha256: artifact.sha256,
            sizeBytes: artifact.sizeBytes,
            packedManifest: artifact.packedManifest
        },
        environment: {
            commit: gitCommit(),
            node: process.version,
            npm: process.env.npm_config_user_agent || null,
            platform: process.platform,
            arch: process.arch,
            toolPins: TOOL_PINS,
            playwrightBrowsersPath: process.env.PLAYWRIGHT_BROWSERS_PATH || null,
            installed: {}
        },
        limitations: LIMITATIONS
    };

    const finish = ({ scenarios, exitCode: resultCode, writeReport = true }) => {
        const summary = summarize(scenarios);
        const report = Object.assign({}, reportBase, {
            finishedAt: new Date().toISOString(),
            result: summary.result,
            counts: summary.counts,
            notPassed: summary.notPassed,
            scenarios,
            artifacts: {
                directories: dirs,
                logs: artifacts.logs,
                traces: artifacts.traces,
                screenshots: artifacts.screenshots
            }
        });
        if (writeReport) {
            const written = writeReports({ outDir, report });
            log('report: ' + written.jsonPath);
            log('report: ' + written.markdownPath);
        }
        console.log(
            'browser integration ' + options.browser + ': ' + summary.result +
            ' (' + Object.entries(summary.counts).map(([key, value]) => key + '=' + value).join(' ') + ')'
        );
        return resultCode;
    };

    let server = null;
    let driver = null;
    try {
        copyApp(appDir);
        writeAppManifest({ appDir, artifact, options });

        log('installing the candidate archive and pinned tools into ' + appDir);
        runCommand({
            command: 'npm',
            args: ['install', '--no-audit', '--no-fund', '--no-save'],
            cwd: appDir,
            timeout: 900_000,
            label: 'npm install'
        });

        reportBase.environment.installed = {
            claDb: readInstalledVersion(appDir, '@clatech/db'),
            vite: readInstalledVersion(appDir, 'vite'),
            rxjs: readInstalledVersion(appDir, 'rxjs')
        };
        const installedClaDb = reportBase.environment.installed.claDb;
        if (!installedClaDb) {
            throw new Error('the candidate package was not installed into the isolated consumer');
        }
        if (artifact.packedManifest && installedClaDb.version !== artifact.packedManifest.version) {
            throw new Error(
                'installed version ' + installedClaDb.version +
                ' does not match the archive version ' + artifact.packedManifest.version
            );
        }
        if (reportBase.environment.installed.vite?.version !== TOOL_PINS.vite) {
            throw new Error('vite pin mismatch in the isolated consumer');
        }

        log('building the Vite app against the installed archive');
        runCommand({
            command: process.execPath,
            args: [path.join(appDir, 'node_modules', 'vite', 'bin', 'vite.js'), 'build'],
            cwd: appDir,
            timeout: 600_000,
            label: 'vite build'
        });

        if (options.installBrowser) {
            const playwrightCli = options.playwrightDir
                ? path.join(path.resolve(options.playwrightDir), 'node_modules', 'playwright', 'cli.js')
                : path.join(appDir, 'node_modules', 'playwright', 'cli.js');
            log('installing the pinned ' + options.browser + ' browser build');
            runCommand({
                command: process.execPath,
                args: [playwrightCli, 'install', options.browser],
                cwd: appDir,
                timeout: 900_000,
                label: 'playwright install ' + options.browser
            });
        }

        const { playwright, version, dir } = loadPlaywright({
            appDir,
            playwrightDir: options.playwrightDir
        });
        reportBase.environment.installed.playwright = { version, dir };
        reportBase.environment.playwrightBrowsersPath =
            process.env.PLAYWRIGHT_BROWSERS_PATH || null;

        const browser = browserExecutable(playwright, options.browser);
        log('browser executable: ' + browser.executablePath);
        if (!browser.available) {
            const scenario = {
                id: 'browser-preflight',
                slice: options.slice,
                title: 'Pinned browser build is available',
                status: STATUS.UNSUPPORTED,
                durationMs: 0,
                details: [browser.reason],
                error: browser.reason
            };
            return finish({ scenarios: [scenario], exitCode: 3 });
        }

        server = await startServer({
            distDir: path.join(appDir, 'dist'),
            log: line => log('server ' + line)
        });

        driver = createDriver({
            playwright,
            browser: options.browser,
            workDir,
            log,
            navigationTimeout: options.timeout
        });

        try {
            await driver.ensure('main');
        } catch (err) {
            const reason = 'the pinned ' + options.browser + ' browser could not launch: ' +
                (err && err.message ? err.message : String(err));
            log(reason);
            const scenario = {
                id: 'browser-preflight',
                slice: options.slice,
                title: 'Pinned browser build launches',
                status: STATUS.UNSUPPORTED,
                durationMs: 0,
                details: [reason],
                error: reason
            };
            return finish({ scenarios: [scenario], exitCode: 3 });
        }

        const selected = options.slice === 'suite'
            ? suiteScenarios
            : options.slice === 'offline'
                ? offlineScenarios
                : suiteScenarios.concat(offlineScenarios);
        const scenarios = options.scenarios.length > 0
            ? selected.filter(scenario => options.scenarios.includes(scenario.id))
            : selected;
        if (scenarios.length === 0) {
            throw new Error('no scenario matched: ' + options.scenarios.join(', '));
        }

        const results = await runScenarios({
            scenarios,
            driver,
            deps: {
                driver,
                server,
                origin: server.origin,
                timeout: options.timeout,
                log
            },
            dirs,
            artifacts,
            logBuffer
        });

        const failed = results.some(result => result.status !== STATUS.PASS);
        const outcome = finish({ scenarios: results, exitCode: failed ? 1 : 0 });
        if (options.keep) {
            log('keeping the work directory at ' + workDir);
        }
        return outcome;
    } catch (err) {
        log('run failed: ' + (err && err.stack ? err.stack : String(err)));
        const scenario = {
            id: 'runner-error',
            slice: options.slice,
            title: 'Runner setup completed',
            status: STATUS.FAIL,
            durationMs: 0,
            details: [],
            error: err && err.message ? err.message : String(err)
        };
        return finish({ scenarios: [scenario], exitCode: 1 });
    } finally {
        if (driver) {
            await driver.closeAll().catch(() => { });
        }
        if (server) {
            await server.close().catch(() => { });
        }
        if (!options.keep) {
            try {
                fs.rmSync(workDir, { recursive: true, force: true });
            } catch (err) {
                console.error('could not remove the work directory ' + workDir + ': ' + err.message);
            }
        }
    }
}

Promise.resolve(main(process.argv.slice(2)))
    .then(code => {
        process.exitCode = code;
    })
    .catch(err => {
        console.error('browser integration runner crashed: ' + (err && err.stack ? err.stack : err));
        process.exitCode = 1;
    });
