/**
 * CLA-DB: Execution engine for the detached compatibility lanes.
 *
 * Each lane gets a fresh consumer outside the repository and the worktree is
 * never used for module resolution. Every planned probe is reported, including
 * the ones that were skipped because an earlier probe failed.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { extractArtifact } from './artifact.mjs';
import { detectTool, describeTool, runtimes } from './runtimes.mjs';
import {
    FIXTURE_DEPENDENCIES,
    assertNoHoistingConfig,
    packageManagers,
    sanitizedEnv
} from './package-managers.mjs';
import { PROBE_LIBRARY, commandsFor, laneDependencies, lanePlan } from './lanes.mjs';

const FIXTURES_DIR = fileURLToPath(new URL('./fixtures/', import.meta.url));
const REUSED_FIXTURES_DIR = fileURLToPath(new URL('../pack-consumer-fixtures/', import.meta.url));
const OUTPUT_LIMIT = 8000;

const FIXTURE_FILES = [
    'esm.mjs',
    'commonjs.cjs',
    'peer.mjs',
    'collections.mjs',
    'replication-lifecycle.mjs',
    'cleanup.mjs',
    'vite-entry.mjs',
    'denokv.mjs',
    'typescript/check.ts',
    'typescript/check-native.ts',
    'typescript/tsconfig.nodenext.json',
    'typescript/tsconfig.bundler.json'
];

const REUSED_FIXTURE_FILES = ['verify-integrations.mjs', 'verify-vite.mjs'];

const LANE_LIMITATIONS = {
    'npm-legacy': [
        'The Node 20.0.0 floor smoke only checks artifact installation, ESM and CommonJS imports, and basic CRUD. It is not a full runtime matrix result.'
    ],
    'bun-node': [
        'Bun installs the artifact; every probe executes on the Node.js runtime of this lane.'
    ],
    'bun-bun': [
        'Dexie runs against simulated IndexedDB under Bun. This is not native persistent IndexedDB evidence.'
    ],
    'yarn-pnp': [
        'Plug\'n\'Play results apply only to the explicit modern Yarn version recorded in this report.'
    ],
    deno: [
        'Deno resolves the extracted candidate through a file: package dependency with the artifact runtime dependencies declared explicitly. npm specifier consumption of a published package is a separate check and is not covered here.',
        'DenoKV is the deprecated storage plugin. The smoke uses an in-memory Deno.openKv instance with --unstable-kv and is not evidence for Deno Deploy or file-backed KV.',
        'Deno runs with --allow-read and --allow-env only; no shell, network, or all-permissions flag is used for the fixtures.'
    ]
};

function truncate(value) {
    const text = String(value || '');
    if (text.length <= OUTPUT_LIMIT) {
        return text;
    }
    return `${text.slice(0, OUTPUT_LIMIT)}\n[output truncated at ${OUTPUT_LIMIT} characters]`;
}

function displayCommand(bin, args, cwd) {
    const displayArgs = args.map(argument => {
        if (typeof argument === 'string' && cwd && argument.startsWith(cwd + path.sep)) {
            return `<consumer>/${path.relative(cwd, argument)}`;
        }
        return argument;
    });
    return [path.basename(bin), ...displayArgs].join(' ');
}

function runCommand({ bin, args, cwd, env, timeoutMs }) {
    const started = Date.now();
    const result = spawnSync(bin, args, {
        cwd,
        env,
        encoding: 'utf8',
        timeout: timeoutMs,
        killSignal: 'SIGKILL',
        maxBuffer: 20 * 1024 * 1024
    });
    const durationMs = Date.now() - started;
    return {
        status: result.error ? 'FAIL' : result.status === 0 ? 'PASS' : 'FAIL',
        exitCode: typeof result.status === 'number' ? result.status : null,
        signal: result.signal || null,
        durationMs,
        command: displayCommand(bin, args, cwd),
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        reason: result.error
            ? result.error.code === 'ETIMEDOUT'
                ? `Command timed out after ${timeoutMs} ms`
                : `Command failed to start: ${result.error.message}`
            : result.status === 0
                ? null
                : result.signal
                    ? `Command was killed by ${result.signal}`
                    : `Command exited with code ${result.status}`
    };
}

function probeResult(planItem, fields) {
    return {
        id: planItem.id,
        description: planItem.description,
        required: planItem.required,
        status: fields.status,
        exitCode: fields.exitCode === undefined ? null : fields.exitCode,
        durationMs: fields.durationMs || 0,
        command: fields.command || null,
        reason: fields.reason || null,
        stdout: truncate(fields.stdout),
        stderr: truncate(fields.stderr)
    };
}

function skippedProbe(planItem, reason) {
    return probeResult(planItem, { status: 'SKIP', reason });
}

function planItemFor(plan, id) {
    const item = plan.find(entry => entry.id === id);
    if (!item) {
        throw new Error(`Probe "${id}" is not part of the lane plan`);
    }
    return item;
}

function probeToolchain({ lane, plan, env, cwd }) {
    const item = planItemFor(plan, 'toolchain');
    const managerDefinition = packageManagers[lane.packageManager];
    const runtimeDefinition = runtimes[lane.runtime];
    const manager = detectTool({ bin: managerDefinition.bin, versionArgs: managerDefinition.versionArgs, env, cwd });
    const runtime = detectTool({ bin: runtimeDefinition.bin, versionArgs: runtimeDefinition.versionArgs, env, cwd });
    const problems = [];
    if (!manager.available) {
        problems.push(`${managerDefinition.label}: ${manager.reason}`);
    }
    if (!runtime.available) {
        problems.push(`${runtimeDefinition.label}: ${runtime.reason}`);
    }
    if (manager.available && manager.major < managerDefinition.minimumMajor) {
        problems.push(
            `${managerDefinition.label} ${manager.version} is below the required ${managerDefinition.label} >= ${managerDefinition.minimumMajor}.0.0`
        );
    }
    if (problems.length > 0) {
        return {
            result: probeResult(item, {
                status: 'UNSUPPORTED',
                reason: problems.join('; ')
            }),
            tools: { manager, runtime, installArgs: managerDefinition.installArgs }
        };
    }
    return {
        result: probeResult(item, {
            status: 'PASS',
            stdout: [describeTool(manager, managerDefinition), describeTool(runtime, runtimeDefinition)].join('\n')
        }),
        tools: { manager, runtime, installArgs: managerDefinition.installArgs }
    };
}

function copyFixtures(consumerDir) {
    for (const relative of FIXTURE_FILES) {
        const source = path.join(FIXTURES_DIR, relative);
        const target = path.join(consumerDir, relative);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(source, target);
    }
    for (const relative of REUSED_FIXTURE_FILES) {
        // Reused read-only from the existing pack consumer fixtures.
        fs.copyFileSync(path.join(REUSED_FIXTURES_DIR, relative), path.join(consumerDir, relative));
    }
}

function stageConsumer({ scratchDir, lane, artifact, plan }) {
    const consumerDir = path.join(scratchDir, 'consumer');
    fs.mkdirSync(consumerDir, { recursive: true });
    copyFixtures(consumerDir);

    const needed = laneDependencies(lane);
    const dependencies = {
        '@clatech/db': `file:${artifact.file}`,
        rxjs: FIXTURE_DEPENDENCIES.rxjs
    };
    const devDependencies = {};
    if (needed.has('dexie')) {
        dependencies.dexie = FIXTURE_DEPENDENCIES.dexie;
    }
    if (needed.has('fake-indexeddb')) {
        devDependencies['fake-indexeddb'] = FIXTURE_DEPENDENCIES['fake-indexeddb'];
    }
    if (needed.has('typescript')) {
        devDependencies.typescript = FIXTURE_DEPENDENCIES.typescript;
    }
    if (needed.has('vite')) {
        devDependencies.vite = FIXTURE_DEPENDENCIES.vite;
    }

    let vendorDir = null;
    if (lane.packageManager === 'deno') {
        vendorDir = extractArtifact({
            file: artifact.file,
            destination: path.join(consumerDir, 'vendor')
        });
        // Deno links a file: directory instead of unpacking a tarball dependency,
        // so the artifact runtime dependencies are declared explicitly.
        for (const [name, range] of Object.entries(artifact.manifest.dependencies || {})) {
            dependencies[name] = range;
        }
        dependencies['@clatech/db'] = `file:${vendorDir}`;
    }

    const manifest = {
        name: 'cla-db-compatibility-consumer',
        private: true,
        version: '0.0.0',
        type: 'module',
        dependencies
    };
    if (Object.keys(devDependencies).length > 0) {
        manifest.devDependencies = devDependencies;
    }
    fs.writeFileSync(path.join(consumerDir, 'package.json'), JSON.stringify(manifest, null, 2) + '\n');

    const managerDefinition = packageManagers[lane.packageManager];
    for (const [name, content] of Object.entries(managerDefinition.configFiles({ linker: lane.linker }))) {
        fs.writeFileSync(path.join(consumerDir, name), content);
    }

    assertNoHoistingConfig(consumerDir);
    return { dir: consumerDir, vendorDir, plan, dependencies };
}

function probeInstall({ plan, consumer, commands, env, timeoutMs }) {
    const item = planItemFor(plan, 'install');
    if (!commands) {
        return probeResult(item, {
            status: 'SKIP',
            reason: 'The toolchain probe did not pass; the installation was not executed.'
        });
    }
    try {
        assertNoHoistingConfig(consumer.dir);
    } catch (error) {
        return probeResult(item, { status: 'FAIL', reason: error.message });
    }
    const result = runCommand({ ...commands.install, cwd: consumer.dir, env, timeoutMs });
    try {
        assertNoHoistingConfig(consumer.dir);
    } catch (error) {
        return probeResult(item, { ...result, status: 'FAIL', reason: error.message });
    }
    return probeResult(item, result);
}

function probePackageLayout({ lane, artifact, consumer, plan, commands, env, timeoutMs }) {
    const item = planItemFor(plan, 'package-layout');
    const started = Date.now();
    let location = lane.packageManager === 'deno'
        ? consumer.vendorDir
        : path.join(consumer.dir, 'node_modules', '@clatech/db');
    let installed = null;
    try {
        if (lane.linker === 'pnp') {
            if (!fs.existsSync(path.join(consumer.dir, '.pnp.cjs'))) {
                throw new Error('Yarn PnP did not create .pnp.cjs');
            }
            const resolved = runCommand({ ...commands.pnpManifest(), cwd: consumer.dir, env, timeoutMs });
            if (resolved.status !== 'PASS') {
                throw new Error(
                    `Yarn Plug'n'Play could not resolve @clatech/db: ${resolved.reason}; output: ${truncate(resolved.stdout)}`
                );
            }
            // Yarn writes its own loader warnings to stdout, so the manifest
            // is framed by sentinels instead of parsing the whole stream.
            const framed = /@@CLA_COMPAT_PNP@@([\s\S]*?)@@CLA_COMPAT_PNP@@/.exec(resolved.stdout);
            if (!framed) {
                throw new Error(`Unexpected Plug'n'Play manifest output: ${truncate(resolved.stdout)}`);
            }
            let manifestOutput;
            try {
                manifestOutput = JSON.parse(framed[1]);
            } catch (error) {
                throw new Error(`Invalid Plug'n'Play manifest JSON: ${truncate(framed[1])}`, { cause: error });
            }
            location = manifestOutput.root;
            installed = manifestOutput.manifest;
        }
        if (!installed) {
            installed = JSON.parse(fs.readFileSync(path.join(location, 'package.json'), 'utf8'));
        }
        if (installed.name !== artifact.packageName) {
            throw new Error(
                `Installed package name ${installed.name} at ${location} does not equal ${artifact.packageName}`
            );
        }
        if (installed.version !== artifact.packageVersion) {
            throw new Error(
                `Installed package version ${installed.version} does not equal the artifact version ${artifact.packageVersion}`
            );
        }
        const installedExports = installed.exports || {};
        if (JSON.stringify(installedExports) !== JSON.stringify(artifact.manifest.exports || {})) {
            throw new Error('Installed package exports do not equal the artifact exports');
        }
        if (lane.linker === 'pnpm-isolated' && !fs.existsSync(path.join(consumer.dir, 'node_modules', '.pnpm'))) {
            throw new Error('pnpm did not create the isolated .pnpm layout');
        }
        return probeResult(item, {
            status: 'PASS',
            durationMs: Date.now() - started,
            stdout: [
                `Installed package: ${path.relative(consumer.dir, location) || location}`,
                `Version: ${installed.version}`,
                `Exports: ${Object.keys(installedExports).length}`
            ].join('\n')
        });
    } catch (error) {
        return probeResult(item, {
            status: 'FAIL',
            durationMs: Date.now() - started,
            reason: error.message
        });
    }
}

function probeFixture({ id, plan, consumer, commands, env, timeoutMs }) {
    const item = planItemFor(plan, id);
    const definition = PROBE_LIBRARY[id];
    if (!definition) {
        return probeResult(item, { status: 'FAIL', reason: `No probe definition for "${id}"` });
    }
    if (!commands) {
        return probeResult(item, {
            status: 'SKIP',
            reason: 'The toolchain probe did not pass; this probe was not executed.'
        });
    }
    const command = definition.typescriptProject
        ? commands.typescript(definition.typescriptProject)
        : commands.script(definition.fixture, definition.denoFlags);
    const result = runCommand({ ...command, cwd: consumer.dir, env, timeoutMs });
    return probeResult(item, result);
}

/**
 * Runs one lane and returns its probe results. Scratch state is always
 * released, including when a probe throws.
 */
export function runLane({ lane, artifact, options }) {
    const plan = lanePlan(lane);
    const startedAt = new Date().toISOString();
    const started = process.hrtime.bigint();
    const results = new Map();
    const tools = {};
    const limitations = [...(LANE_LIMITATIONS[lane.id] || [])];
    const baseEnv = sanitizedEnv(Object.assign({}, options.env, {
        CLA_COMPAT_ARTIFACT_VERSION: artifact.packageVersion,
        CLA_COMPAT_RXJS_VERSION: FIXTURE_DEPENDENCIES.rxjs
    }));
    let scratchDir = null;

    const record = result => results.set(result.id, result);
    const skipRemaining = reason => {
        for (const item of plan) {
            if (item.planned === 'run' && !results.has(item.id)) {
                record(skippedProbe(item, reason));
            }
        }
    };

    try {
        if (options.dryRun) {
            for (const item of plan.filter(entry => entry.planned === 'run')) {
                record(skippedProbe(item, 'Dry run: the probe was planned but not executed.'));
            }
        } else {
            const toolchain = probeToolchain({ lane, plan, env: baseEnv, cwd: process.cwd() });
            record(toolchain.result);
            Object.assign(tools, toolchain.tools);
            if (toolchain.result.status !== 'PASS') {
                skipRemaining('The toolchain probe did not pass; this probe was not executed.');
            } else {
                // A fresh scratch directory keeps every consumer isolated from the repository.
                const scratchBase = path.resolve(options.scratch);
                fs.mkdirSync(scratchBase, { recursive: true });
                scratchDir = fs.mkdtempSync(path.join(scratchBase, `cla-db-compat-${lane.id}-`));
                // Tool internal temp files stay inside the released scratch directory.
                const toolTemp = path.join(scratchDir, 'tmp');
                fs.mkdirSync(toolTemp, { recursive: true });
                const toolEnv = Object.assign({}, baseEnv, {
                    TMPDIR: toolTemp,
                    TMP: toolTemp,
                    TEMP: toolTemp
                });
                let consumer = null;
                try {
                    consumer = stageConsumer({ scratchDir, lane, artifact, plan });
                } catch (error) {
                    record(skippedProbe(planItemFor(plan, 'install'), `Consumer staging failed: ${error.message}`));
                    skipRemaining('Consumer staging failed; this probe was not executed.');
                }
                if (consumer) {
                    const commands = commandsFor({ lane, tools });
                    const install = probeInstall({
                        plan,
                        consumer,
                        commands,
                        env: toolEnv,
                        timeoutMs: options.timeoutMs
                    });
                    record(install);
                    if (install.status === 'PASS') {
                        const layout = probePackageLayout({
                            lane,
                            artifact,
                            consumer,
                            plan,
                            commands,
                            env: toolEnv,
                            timeoutMs: options.timeoutMs
                        });
                        record(layout);
                        if (layout.status === 'PASS') {
                            const runnable = plan.filter(item => item.planned === 'run'
                                && item.id !== 'toolchain'
                                && item.id !== 'install'
                                && item.id !== 'package-layout');
                            for (const item of runnable) {
                                record(probeFixture({
                                    id: item.id,
                                    plan,
                                    consumer,
                                    commands,
                                    env: toolEnv,
                                    timeoutMs: options.timeoutMs
                                }));
                            }
                        } else {
                            skipRemaining('The package-layout probe did not pass; this probe was not executed.');
                        }
                    } else {
                        skipRemaining('The install probe did not pass; this probe was not executed.');
                    }
                }
            }
        }
    } finally {
        if (scratchDir) {
            try {
                fs.rmSync(scratchDir, { recursive: true, force: true, maxRetries: 3 });
            } catch (error) {
                limitations.push(`Scratch directory could not be removed: ${error.message}`);
            }
        }
    }

    // Every planned probe is reported in plan order. A skipped plan entry keeps
    // its explicit reason and is never treated as a passing check.
    const probes = plan.map(item => results.get(item.id)
        || skippedProbe(item, item.reason || 'Probe was not executed.'));
    return {
        probes,
        tools,
        limitations,
        startedAt,
        durationMs: Number((process.hrtime.bigint() - started) / 1_000_000n)
    };
}
