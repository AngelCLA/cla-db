// CLA-DB: Cross-version proof stays outside the ordinary dependency graph.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveArtifact, sha256File } from './compatibility/artifact.mjs';
import { summarizeProbes } from './compatibility/report.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const fixtures = fileURLToPath(new URL('./storage-compat-fixtures/', import.meta.url));
// The candidate identity defaults to the manifest so a version bump cannot leave stale guards.
const packageVersion = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
const registry = 'https://registry.npmjs.org';
// Exact published baselines. `required` means the run must fail when the version is missing.
const baselines = [
    { name: '@clatech/db', version: '0.1.1', required: true },
    { name: '@clatech/db', version: '0.1.2', required: true },
    { name: 'rxdb', version: '17.6.0', required: false }
];
const USAGE = `Usage: node scripts/verify-storage-compat.mjs [options]

Sequential storage lineage: one writer at a time, then the candidate reopens the
data. Exact published ${baselines.map(entry => `${entry.name}@${entry.version}`).join(', ')} are opened by the candidate,
which also reopens its own data.

Options:
  --benchmark            Measure local samples instead of the pass/fail lineage check.
  --artifact <file.tgz>  Prebuilt candidate tarball. Requires --sha256.
  --sha256 <digest>      Expected SHA-256 of --artifact. Requires --artifact.
  --json <file>          Write structured results as JSON.
  --markdown <file>      Write a readable Markdown report.
  --help                 Print this usage.

Without --artifact, the runner packs the current built output with npm pack and
verifies that the packed version equals package.json. Exit code 0 means no step
failed. A skipped baseline is recorded as SKIP, keeps the verdict INCOMPLETE and
is never a pass. Exit code 1 means a failure or a usage error.`;
function takeValue(argv, index, option) {
    const value = argv[index];
    assert.ok(value && !value.startsWith('--'), `${option} requires a value`);
    return value;
}
function parseArgs(argv) {
    const parsed = { benchmark: false, help: false };
    for (let index = 0; index < argv.length; index++) {
        const argument = argv[index];
        switch (argument) {
            case '--help': case '-h': parsed.help = true; break;
            case '--benchmark': parsed.benchmark = true; break;
            case '--artifact': parsed.artifact = takeValue(argv, ++index, '--artifact'); break;
            case '--sha256': parsed.sha256 = takeValue(argv, ++index, '--sha256'); break;
            case '--json': parsed.json = path.resolve(takeValue(argv, ++index, '--json')); break;
            case '--markdown': parsed.markdown = path.resolve(takeValue(argv, ++index, '--markdown')); break;
            default: assert.fail(`Unknown argument "${argument}". See --help.`);
        }
    }
    if (parsed.help) return parsed;
    // A digest without an artifact, or an artifact without a digest, cannot authenticate anything.
    assert.equal(
        Boolean(parsed.artifact), Boolean(parsed.sha256),
        '--artifact and --sha256 must be provided together'
    );
    return parsed;
}
const options = parseArgs(process.argv.slice(2));
if (options.help) {
    console.log(USAGE);
    process.exit(0);
}
const mode = options.benchmark ? '--benchmark' : 'compat';
const startedAt = new Date().toISOString();
const startedMs = performance.now();
const steps = [];
const commit = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout?.trim() || 'unknown';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cla-storage-compat-'));
const env = { ...process.env, NODE_PATH: '', NODE_OPTIONS: '', npm_config_cache: path.join(tmp, 'cache') };
let candidate = null;
let published = [];
let pairs = [];
let benchmark = null;
let npmVersion = null;
function step(id, status, detail) {
    steps.push({ id, required: true, status, detail });
    console.log(`${status} ${id}${detail ? `: ${detail}` : ''}`);
}
function run(command, args, cwd = tmp, optional = false) {
    const result = spawnSync(command, args, { cwd, env, encoding: 'utf8', timeout: 240_000, maxBuffer: 20 * 1024 * 1024 });
    // npm pack's full file listing obscures later failures; retain all other stdout verbatim.
    const stdout = args[0] === 'pack' && result.status === 0
        ? JSON.stringify(JSON.parse(result.stdout).map(({ files, ...metadata }) => ({ ...metadata, fileListing: `${files.length} entries omitted` })))
        : result.stdout || '';
    fs.writeSync(1, `$ ${command} ${args.join(' ')}\nstdout:\n${stdout}\nstderr:\n${result.stderr || ''}exit: ${result.status}\n`);
    if (result.error) throw result.error;
    if (!optional) assert.equal(result.status, 0, `${command} failed`);
    return result;
}
function install(dir, dependencies) {
    const app = path.join(tmp, dir);
    fs.mkdirSync(app);
    fs.writeFileSync(path.join(app, 'package.json'), JSON.stringify({ private: true, dependencies }));
    run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--registry', registry], app);
    return app;
}
function markers(stdout, marker) {
    return (stdout || '').split('\n')
        .filter(line => line.startsWith(`${marker} `))
        .map(line => JSON.parse(line.slice(marker.length + 1)));
}
// The candidate is either the packed build output or a prebuilt artifact authenticated by its digest.
function resolveCandidate() {
    if (options.artifact) {
        const artifact = resolveArtifact({ artifact: options.artifact, sha256: options.sha256 });
        assert.equal(
            artifact.packageVersion, packageVersion,
            `Artifact version ${artifact.packageVersion} does not match package.json version ${packageVersion}`
        );
        step('artifact:identity', 'PASS', `${artifact.fileName} sha256 ${artifact.sha256} ${artifact.size} bytes version ${artifact.packageVersion}`);
        return {
            source: 'artifact', file: artifact.file, fileName: artifact.fileName, sha256: artifact.sha256,
            size: artifact.size, version: artifact.packageVersion
        };
    }
    const pack = run('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', tmp], root);
    const [packed] = JSON.parse(pack.stdout);
    assert.equal(packed.version, packageVersion, 'The candidate artifact must carry the manifest version');
    const file = path.join(tmp, packed.filename);
    const sha256 = sha256File(file);
    step('artifact:pack', 'PASS', `${packed.filename} sha256 ${sha256} ${packed.size} bytes version ${packed.version}`);
    return { source: 'packed', file, fileName: packed.filename, sha256, size: packed.size, version: packed.version };
}
// Only an exact published version may act as a baseline. A missing version is a gap, never a substitution.
function resolveBaselines() {
    const resolved = [];
    for (const entry of baselines) {
        const label = `${entry.name}@${entry.version}`;
        const view = run('npm', ['view', label, 'version', 'dist', '--json', '--registry', registry], tmp, !entry.required);
        if (view.status !== 0) {
            const error = JSON.parse(view.stdout || '{}').error;
            assert.equal(error?.code, 'E404', `Only a registry E404 may skip the ${label} baseline`);
            step(`registry:${label}`, 'SKIP', 'registry E404, not tested; a skipped baseline is not a pass');
            continue;
        }
        const publishedEntry = JSON.parse(view.stdout);
        assert.equal(publishedEntry.version, entry.version, `${label} resolved to ${publishedEntry.version}`);
        assert.match(publishedEntry.dist?.integrity || '', /^sha512-/, `${label} published no sha512 dist.integrity`);
        step(`registry:${label}`, 'PASS', `exact version, dist.integrity ${publishedEntry.dist.integrity}, dist.shasum ${publishedEntry.dist.shasum}`);
        // Timing stays inside CLA DB releases; upstream is a storage-format baseline, not a timing peer.
        const timed = !options.benchmark || entry.name === '@clatech/db';
        const dir = `baseline-${label.replace(/[^a-z0-9.]+/gi, '-')}`;
        resolved.push({
            label, name: entry.name, version: entry.version, integrity: publishedEntry.dist.integrity,
            shasum: publishedEntry.dist.shasum, timed,
            app: timed ? install(dir, { [entry.name]: entry.version, rxjs: '7.8.2' }) : null
        });
    }
    return resolved;
}
function collect(consumerRun) {
    for (const record of markers(consumerRun.stdout, 'CLA_DB_STEP')) steps.push(record);
    if (mode === '--benchmark') {
        const runs = markers(consumerRun.stdout, 'CLA_DB_RUN');
        assert.equal(runs.length, pairs.length + 1, 'Each loaded version must contribute exactly one benchmark sample set');
        benchmark = {
            storage: 'dexie over fake-indexeddb (simulated IndexedDB)',
            warmups: runs[0].warmups, iterations: runs[0].iterations, documents: runs[0].documents,
            compared: runs.map(entry => entry.label), runs,
            gate: 'none: local samples only, no ranking and no CI threshold'
        };
        step('benchmark:samples', 'PASS', `${runs.length} versions measured with ${runs[0].warmups} warm-ups and ${runs[0].iterations} iterations each, median and p95 reported`);
    } else if (consumerRun.status === 0) {
        const lineage = markers(consumerRun.stdout, 'CLA_DB_PAIRS')[0];
        assert.ok(lineage, 'The fixture printed no pair summary');
        assert.equal(lineage.completed, lineage.expected, `Only ${lineage.completed} of ${lineage.expected} sequential lineages completed`);
        step('lineage:pairs', 'PASS', `${lineage.completed} sequential lineages: ${published.map(entry => entry.label).join(', ')} then the candidate self-reopen`);
    }
}
function buildReport(failureReason) {
    const summary = summarizeProbes(steps);
    return {
        schemaVersion: 1,
        generatedBy: 'scripts/verify-storage-compat.mjs',
        mode: options.benchmark ? 'benchmark' : 'compat',
        startedAt,
        durationMs: Math.round(performance.now() - startedMs),
        verdict: summary.verdict,
        supported: summary.supported,
        commit,
        environment: {
            node: process.version,
            npm: npmVersion,
            os: `${os.type()} ${os.release()} ${os.arch()}`,
            cpu: os.cpus()[0]?.model,
            logicalCpus: os.cpus().length,
            ramGiB: Number((os.totalmem() / 1024 ** 3).toFixed(1)),
            indexedDB: 'fake-indexeddb@6.2.8 (simulated, not a browser)',
            storageVersion: '17.6.0'
        },
        candidate: candidate && {
            source: candidate.source, fileName: candidate.fileName, sha256: candidate.sha256,
            size: candidate.size, version: candidate.version, storageVersion: '17.6.0'
        },
        baselines: published.map(entry => Object.fromEntries(Object.entries(entry).filter(([key]) => key !== 'app'))),
        lineage: pairs.map(entry => entry.label).concat(`${candidate?.version ? `@clatech/db@${candidate.version}` : 'candidate'} self`),
        summary,
        steps,
        benchmark,
        backwardCompatibility: {
            status: 'NOT EVALUATED',
            reason: 'Opening 0.1.3 data with 0.1.1, 0.1.2 or RxDB 17.6.0 is a separate question. No downgrade is assumed.'
        },
        limitations: [
            'This lineage runs on fake-indexeddb, so it is simulated IndexedDB. Native browser IndexedDB lineage is a separate lane and stays pending until it is actually run.',
            'One writer at a time only. No two versions write to the same database concurrently.',
            'The migration step is a schema version 0 to 1 open in the candidate, not a migration shipped by a published release.',
            'Timing samples come from one host under uncontrolled background load. They are not a ranking or a gate.'
        ],
        failure: failureReason ? { message: failureReason.message } : null
    };
}
function renderMarkdown(report) {
    const cell = value => String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
    const table = (headers, rows) => [`| ${headers.join(' | ')} |`, `| ${headers.map(() => '---').join(' | ')} |`,
        ...rows.map(row => `| ${row.map(cell).join(' | ')} |`)].join('\n');
    const lines = ['# CLA DB storage lineage', ''];
    lines.push(`**Verdict:** ${report.verdict}`, '', `**Supported:** ${report.supported ? 'yes' : 'no'}`, '');
    lines.push('A SKIP or NOT EVALUATED entry is never counted as passed.', '');
    lines.push('## Candidate', '');
    lines.push(report.candidate
        ? table(['Field', 'Value'], [
            ['File', report.candidate.fileName], ['Source', report.candidate.source],
            ['Version', report.candidate.version], ['Storage version', report.candidate.storageVersion],
            ['SHA-256', report.candidate.sha256], ['Bytes', report.candidate.size]
        ])
        : 'No candidate artifact was resolved.', '');
    lines.push('## Environment', '');
    lines.push(table(['Field', 'Value'], Object.entries(report.environment).map(([key, value]) => [key, value])), '');
    lines.push(`Commit: ${report.commit}`, '', `Started: ${report.startedAt}`, '', `Duration: ${report.durationMs} ms`, '');
    lines.push('## Steps', '');
    lines.push(table(['Step', 'Status', 'Detail'], report.steps.map(entry => [entry.id, entry.status, entry.detail])), '');
    lines.push('## Summary', '');
    lines.push(table(['Status', 'Count'], [['PASS', report.summary.passed], ['FAIL', report.summary.failed],
        ['SKIP', report.summary.skipped], ['UNSUPPORTED', report.summary.unsupported]]), '');
    if (report.benchmark) {
        lines.push('## Benchmark samples', '');
        lines.push(`${report.benchmark.warmups} warm-ups, ${report.benchmark.iterations} iterations, ${report.benchmark.documents} documents, ${report.benchmark.storage}. ${report.benchmark.gate}.`, '');
        lines.push(table(['Version', 'initMs median', 'writeMs median', 'readMs median', 'reopenMs median', 'heapMiB median'],
            report.benchmark.runs.map(entry => [entry.label, ...['initMs', 'writeMs', 'readMs', 'reopenMs', 'heapMiB']
                .map(key => Number(entry.summary[key].median).toFixed(2))])), '');
        lines.push(table(['Version', 'initMs p95', 'writeMs p95', 'readMs p95', 'reopenMs p95', 'heapMiB p95'],
            report.benchmark.runs.map(entry => [entry.label, ...['initMs', 'writeMs', 'readMs', 'reopenMs', 'heapMiB']
                .map(key => Number(entry.summary[key].p95).toFixed(2))])), '');
    }
    lines.push('## Backward compatibility', '');
    lines.push(`**${report.backwardCompatibility.status}** ${report.backwardCompatibility.reason}`, '');
    lines.push('## Limitations', '');
    lines.push(...report.limitations.map(limitation => `- ${limitation}`), '');
    if (report.failure) lines.push('## Failure', '', report.failure.message, '');
    return lines.join('\n');
}
let failure = null;
try {
    npmVersion = run('npm', ['--version'], tmp, true).stdout?.trim() || null;
    candidate = resolveCandidate();
    published = resolveBaselines();
    const candidateApp = install('candidate', { '@clatech/db': `file:${candidate.file}`, rxjs: '7.8.2' });
    step('install:candidate', 'PASS', `installed ${candidate.fileName} into an isolated consumer`);
    const harness = install('harness', { 'fake-indexeddb': '6.2.8' });
    for (const file of ['consumer.mjs', 'workload.mjs']) fs.copyFileSync(path.join(fixtures, file), path.join(harness, file));
    pairs = published.filter(entry => entry.app).map(entry => ({ label: entry.label, app: entry.app, name: entry.name, version: entry.version }));
    fs.writeFileSync(path.join(harness, 'inputs.json'), JSON.stringify({
        candidate: { app: candidateApp, name: '@clatech/db', version: candidate.version },
        pairs
    }, null, 2));
    console.log(JSON.stringify({ runtime: process.version, npm: npmVersion, os: `${os.type()} ${os.release()} ${os.arch()}`, cpu: os.cpus()[0]?.model, logicalCpus: os.cpus().length, ramGiB: os.totalmem() / 1024 ** 3, indexedDB: 'fake-indexeddb@6.2.8' }));
    // The fixture runs unasserted first so its partial evidence survives a failing assertion.
    const consumerRun = run(process.execPath, ['--expose-gc', 'consumer.mjs', mode], harness, true);
    collect(consumerRun);
    assert.equal(consumerRun.status, 0, 'The storage lineage fixture failed');
} catch (error) {
    failure = error;
    steps.push({ id: 'runner:error', required: true, status: 'FAIL', detail: error.message });
} finally {
    const report = buildReport(failure);
    if (options.json) {
        fs.mkdirSync(path.dirname(options.json), { recursive: true });
        fs.writeFileSync(options.json, JSON.stringify(report, null, 2) + '\n');
        console.log(`Results written to ${options.json}`);
    }
    if (options.markdown) {
        fs.mkdirSync(path.dirname(options.markdown), { recursive: true });
        fs.writeFileSync(options.markdown, renderMarkdown(report));
        console.log(`Report written to ${options.markdown}`);
    }
    console.log(JSON.stringify({ verdict: report.verdict, summary: report.summary }));
    // Only the private scratch tree created above is removed, including npm cache/logs.
    fs.rmSync(tmp, { recursive: true, force: true });
    console.log('Temporary consumers and cache removed');
}
if (failure) throw failure;
