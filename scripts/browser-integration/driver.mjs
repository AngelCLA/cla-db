/**
 * CLA-DB: Playwright driver for the browser integration lane.
 *
 * The browser type, its executable and the browser cache come from the
 * pinned Playwright installation. PLAYWRIGHT_BROWSERS_PATH is honoured by
 * Playwright itself and is recorded in the report.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { TOOL_PINS } from './artifact.mjs';

/**
 * Resolves the pinned Playwright module. `playwrightDir` lets a caller reuse
 * an already installed pinned copy instead of installing one more time, but
 * the installed version must match the pin exactly.
 */
export function loadPlaywright({ appDir, playwrightDir }) {
    const baseDir = playwrightDir ? path.resolve(playwrightDir) : appDir;
    let requireFrom;
    let version;
    try {
        requireFrom = createRequire(path.join(baseDir, 'package.json'));
        version = requireFrom('playwright/package.json').version;
    } catch (err) {
        throw new Error(`pinned playwright is not installed in ${baseDir}: ${err.message}`, { cause: err });
    }
    if (version !== TOOL_PINS.playwright) {
        throw new Error(
            `playwright version mismatch: expected ${TOOL_PINS.playwright}, found ${version} in ${baseDir}`
        );
    }
    return { playwright: requireFrom('playwright'), version, dir: baseDir };
}

export function browserExecutable(playwright, browser) {
    const browserType = playwright[browser];
    if (!browserType) {
        return { available: false, executablePath: null, reason: `unknown browser type ${browser}` };
    }
    let executablePath;
    try {
        executablePath = browserType.executablePath();
    } catch (err) {
        return { available: false, executablePath: null, reason: err.message };
    }
    const available = typeof executablePath === 'string' && fs.existsSync(executablePath);
    const browsersPath = process.env.PLAYWRIGHT_BROWSERS_PATH;
    return {
        available,
        executablePath,
        browsersPath: browsersPath ?? null,
        reason: available
            ? null
            : [
                `the pinned Playwright ${TOOL_PINS.playwright} browser build for ${browser} is not installed`,
                `expected executable: ${executablePath}`,
                `browser cache: ${browsersPath ?? '(Playwright default cache)'}`,
                `install it with: npx playwright install --no-shell ${browser}`,
                'Linux OS dependencies are a separate, authorized setup step: npx playwright install-deps ' + browser
            ].join('; ')
    };
}

export function createDriver({ playwright, browser, workDir, log = () => { }, navigationTimeout = 60_000 }) {
    const browserType = playwright[browser];
    const profiles = new Map();
    const traces = new Map();

    /**
     * Playwright writes its temporary artifacts into the operating system temp
     * directory. The default temp directory can be small, read-only or out of
     * inodes on shared runners, so the lane keeps those artifacts inside the
     * isolated work directory that this run owns and removes.
     */
    const browserTempDir = path.join(workDir, 'tmp');
    fs.mkdirSync(browserTempDir, { recursive: true });
    process.env.TMPDIR = browserTempDir;
    process.env.TMP = browserTempDir;
    process.env.TEMP = browserTempDir;

    const profileDir = name => path.join(workDir, 'profiles', name);

    function attachLogging(context, name) {
        const entry = profiles.get(name);
        const record = (kind, text) => {
            entry.logs.push(`[${new Date().toISOString()}] ${kind} ${text}`);
            log(`${name} ${kind} ${text}`);
        };
        context.on('console', message => record('console', `${message.type()}: ${message.text()}`));
        context.on('pageerror', err => record('pageerror', err && err.message ? err.message : String(err)));
        context.on('weberror', err => record('weberror', err && err.message ? err.message : String(err)));
        context.on('page', openedPage => {
            openedPage.on('console', message => record('console', `${message.type()}: ${message.text()}`));
            openedPage.on('pageerror', err => record('pageerror', err && err.message ? err.message : String(err)));
        });
    }

    async function ensure(name = 'main') {
        const existing = profiles.get(name);
        if (existing) {
            return existing.context;
        }
        const context = await browserType.launchPersistentContext(profileDir(name), {
            headless: true,
            viewport: { width: 1280, height: 800 },
            timeout: navigationTimeout,
            args: process.env.CLA_DB_BROWSER_NO_SANDBOX === '1' ? ['--no-sandbox'] : []
        });
        context.setDefaultTimeout(navigationTimeout);
        context.setDefaultNavigationTimeout(navigationTimeout);
        profiles.set(name, { context, logs: [], traced: false });
        attachLogging(context, name);
        log(`opened persistent context ${name} at ${profileDir(name)}`);
        return context;
    }

    async function page(name = 'main') {
        const context = await ensure(name);
        const existing = context.pages();
        return existing.length > 0 ? existing[0] : context.newPage();
    }

    async function close(name = 'main') {
        const entry = profiles.get(name);
        if (!entry) {
            return;
        }
        profiles.delete(name);
        traces.delete(name);
        await entry.context.close();
        log(`closed persistent context ${name}`);
    }

    async function startTrace(name = 'main') {
        const entry = profiles.get(name);
        if (!entry || entry.traced) {
            return;
        }
        await entry.context.tracing.start({ screenshots: true, snapshots: true, sources: false });
        entry.traced = true;
    }

    async function stopTrace(name = 'main', outPath = null) {
        const entry = profiles.get(name);
        if (!entry || !entry.traced) {
            return null;
        }
        entry.traced = false;
        if (outPath) {
            fs.mkdirSync(path.dirname(outPath), { recursive: true });
            await entry.context.tracing.stop({ path: outPath });
            return outPath;
        }
        await entry.context.tracing.stop();
        return null;
    }

    async function setOffline(offline, name = 'main') {
        const entry = profiles.get(name);
        if (!entry) {
            await ensure(name);
        }
        await profiles.get(name).context.setOffline(offline);
        log(`${name} network ${offline ? 'offline' : 'online'}`);
    }

    function logs() {
        return Array.from(profiles.values()).flatMap(entry => entry.logs);
    }

    function profileNames() {
        return Array.from(profiles.keys());
    }

    async function closeAll() {
        for (const name of profileNames()) {
            try {
                await close(name);
            } catch (err) {
                log(`error while closing ${name}: ${err.message}`);
            }
        }
    }

    return {
        ensure,
        page,
        close,
        startTrace,
        stopTrace,
        setOffline,
        logs,
        profileNames,
        closeAll,
        profileDir,
        browserTempDir
    };
}
