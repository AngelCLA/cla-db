// CLA-DB: Cross-version proof stays outside the ordinary dependency graph.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const fixtures = fileURLToPath(new URL('./storage-compat-fixtures/', import.meta.url));
const mode = process.argv[2] || 'compat';
assert.ok(['compat', '--benchmark'].includes(mode), 'Usage: node scripts/verify-storage-compat.mjs [--benchmark]');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cla-storage-compat-'));
const registry = 'https://registry.npmjs.org';
const env = { ...process.env, NODE_PATH: '', NODE_OPTIONS: '', npm_config_cache: path.join(tmp, 'cache') };
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
try {
    // A missing exact upstream version is a gap, not permission to substitute another version.
    const upstream = run('npm', ['view', 'rxdb@17.6.0', 'version', 'dist', '--json', '--registry', registry], tmp, true);
    const hasUpstream = upstream.status === 0;
    if (!hasUpstream) {
        const error = JSON.parse(upstream.stdout || '{}').error;
        assert.equal(error?.code, 'E404', 'Only a registry E404 may skip the upstream baseline');
        console.log('rxdb@17.6.0: NOT AVAILABLE (registry E404), not tested');
    }
    run('npm', ['view', '@clatech/db@0.1.1', 'version', 'dist', '--json', '--registry', registry]);
    const pack = run('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', tmp], root);
    const [packed] = JSON.parse(pack.stdout);
    assert.equal(packed.version, '0.1.2');
    const baseline = install('baseline', { '@clatech/db': '0.1.1', rxjs: '7.8.2' });
    const candidate = install('candidate', { '@clatech/db': `file:${path.join(tmp, packed.filename)}`, rxjs: '7.8.2' });
    const harness = install('harness', { 'fake-indexeddb': '6.2.8' });
    const pairs = [{ label: '@clatech/db@0.1.1', app: baseline, name: '@clatech/db', version: '0.1.1' }];
    // Timing compares the published CLA DB release to the candidate only.
    // Upstream remains an independent storage-format baseline in compatibility mode.
    if (hasUpstream && mode === 'compat') pairs.push({ label: 'rxdb@17.6.0', app: install('upstream', { rxdb: '17.6.0', rxjs: '7.8.2' }), name: 'rxdb', version: '17.6.0' });
    for (const file of ['consumer.mjs', 'workload.mjs']) fs.copyFileSync(path.join(fixtures, file), path.join(harness, file));
    fs.writeFileSync(path.join(harness, 'inputs.json'), JSON.stringify({ candidate, pairs }));
    console.log(JSON.stringify({ runtime: process.version, os: `${os.type()} ${os.release()} ${os.arch()}`, cpu: os.cpus()[0]?.model, logicalCpus: os.cpus().length, ramGiB: os.totalmem() / 1024 ** 3, indexedDB: 'fake-indexeddb@6.2.8' }));
    run(process.execPath, ['--expose-gc', 'consumer.mjs', mode], harness);
} finally {
    // Only the private scratch tree created above is removed, including npm cache/logs.
    fs.rmSync(tmp, { recursive: true, force: true });
    console.log('Temporary consumers and cache removed');
}
