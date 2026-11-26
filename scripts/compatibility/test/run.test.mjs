/**
 * CLA-DB: Deterministic tests for the detached package and runtime runner.
 *
 * These tests never install from a registry. They cover argument validation,
 * artifact identity, lane planning, explicit SKIP/UNSUPPORTED handling and the
 * failure path of an install that is executed by a fake package manager.
 */
import assert from 'node:assert/strict';
import { spawnSync, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import { summarizeProbes } from '../report.mjs';

const compatibilityDir = path.dirname(fileURLToPath(new URL('../run.mjs', import.meta.url)));
const repoRoot = path.resolve(compatibilityDir, '../..');
const runScript = path.join(compatibilityDir, 'run.mjs');
const authorizedScratchRoot = '/var/tmp/cla-db-0.1.3-compat';
const createdDirs = [];

const expectedLanes = [
    'npm-node',
    'npm-legacy',
    'pnpm-node',
    'bun-node',
    'bun-bun',
    'yarn-node',
    'yarn-pnp',
    'deno'
];

function scratchRoot() {
    for (const candidate of [authorizedScratchRoot, os.tmpdir()]) {
        try {
            fs.mkdirSync(candidate, { recursive: true });
            fs.accessSync(candidate, fs.constants.W_OK);
            return candidate;
        } catch {
            continue;
        }
    }
    throw new Error('No writable scratch root available');
}

function makeTempDir(prefix) {
    const dir = fs.mkdtempSync(path.join(scratchRoot(), prefix));
    createdDirs.push(dir);
    return dir;
}

function cleanupAll() {
    while (createdDirs.length > 0) {
        const dir = createdDirs.pop();
        try {
            fs.rmSync(dir, { recursive: true, force: true });
        } catch {
            // A leftover scratch directory is reported through the test output.
        }
    }
}

function sha256File(file) {
    return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function createFakeArtifact(dir, { version = '0.1.3', name = '@clatech/db' } = {}) {
    const payload = path.join(dir, 'package');
    fs.mkdirSync(path.join(payload, 'dist/esm'), { recursive: true });
    fs.writeFileSync(path.join(payload, 'dist/esm/index.js'), 'export const RXDB_VERSION = "17.6.0";\n');
    const exports = { '.': './dist/esm/index.js', './plugins/storage-memory': './dist/esm/index.js' };
    fs.writeFileSync(path.join(payload, 'package.json'), JSON.stringify({
        name,
        version,
        exports,
        dependencies: { rxjs: '7.8.2' },
        peerDependencies: { rxjs: '^7.8.2' },
        claDb: { upstreamVersion: '17.6.0' }
    }, null, 2));
    const file = path.join(dir, `clatech-db-${version}.tgz`);
    execFileSync('tar', ['-czf', file, '-C', dir, 'package']);
    return { file, sha256: sha256File(file), version, name, exports };
}

function writeFakeTool(binDir, name, source) {
    fs.mkdirSync(binDir, { recursive: true });
    const file = path.join(binDir, name);
    fs.writeFileSync(file, `#!/usr/bin/env node\n${source}`);
    fs.chmodSync(file, 0o755);
    return file;
}

function runCli(args, { env = {} } = {}) {
    const result = spawnSync(process.execPath, [runScript, ...args], {
        cwd: repoRoot,
        encoding: 'utf8',
        timeout: 120_000,
        maxBuffer: 20 * 1024 * 1024,
        env: { ...process.env, ...env }
    });
    return result;
}

function readJson(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function runLane(args) {
    const out = makeTempDir('out-');
    const scratch = makeTempDir('scratch-');
    const result = runCli([...args, '--out', out, '--scratch', scratch]);
    const resultsFile = path.join(out, 'results.json');
    const markdownFile = path.join(out, 'REPORT.md');
    const results = fs.existsSync(resultsFile) ? readJson(resultsFile) : null;
    const markdown = fs.existsSync(markdownFile) ? fs.readFileSync(markdownFile, 'utf8') : null;
    return { result, out, scratch, results, markdown };
}

describe('lane registry', () => {
    it('lists the detached lanes in a stable order', () => {
        const { result } = runLane([]);
        // --list-lanes does not need an artifact or an output directory.
        const listed = runCli(['--list-lanes']);
        assert.equal(listed.status, 0, listed.stderr);
        const lanes = JSON.parse(listed.stdout);
        assert.deepEqual(lanes.map(lane => lane.id), expectedLanes);
        for (const lane of lanes) {
            assert.ok(lane.packageManager);
            assert.ok(lane.runtime);
            assert.ok(lane.linker);
            assert.ok(Array.isArray(lane.probes) && lane.probes.length > 0);
        }
        assert.equal(result.status, 2, 'a lane run without arguments must be rejected');
    });

    it('keeps the Node 20 floor smoke smaller than the full npm lane', () => {
        const lanes = JSON.parse(runCli(['--list-lanes']).stdout);
        const byId = id => lanes.find(lane => lane.id === id);
        const plannedToRun = lane => lane.probes.filter(probe => probe.planned === 'run').map(probe => probe.id);
        const legacy = plannedToRun(byId('npm-legacy'));
        const full = plannedToRun(byId('npm-node'));
        assert.ok(!legacy.includes('vite'));
        assert.ok(!legacy.includes('typescript-nodenext'));
        assert.ok(!legacy.includes('typescript-bundler'));
        assert.ok(full.includes('vite'));
        assert.ok(full.includes('typescript-nodenext'));
        assert.ok(full.includes('typescript-bundler'));
        for (const probe of byId('npm-legacy').probes.filter(entry => entry.planned === 'skip')) {
            assert.ok(probe.reason, `skip ${probe.id} needs a reason`);
        }
    });

    it('never declares a hoisted node_modules linker', () => {
        const lanes = JSON.parse(runCli(['--list-lanes']).stdout);
        for (const lane of lanes) {
            assert.notEqual(lane.linker, 'hoisted');
            assert.ok(!JSON.stringify(lane).includes('shamefully-hoist'));
        }
    });
});

describe('argument and artifact validation', () => {
    it('rejects a missing artifact before running anything', () => {
        const result = runCli(['--lane', 'npm-node', '--sha256', '0'.repeat(64), '--out', makeTempDir('out-')]);
        assert.equal(result.status, 2);
        assert.match(result.stderr, /--artifact/);
    });

    it('rejects an unknown lane and names the known ones', () => {
        const dir = makeTempDir('artifact-');
        const { file, sha256 } = createFakeArtifact(dir);
        const result = runCli([
            '--artifact', file,
            '--sha256', sha256,
            '--lane', 'nope',
            '--out', makeTempDir('out-')
        ]);
        assert.equal(result.status, 2);
        assert.match(result.stderr, /npm-legacy/);
    });

    it('requires an output directory', () => {
        const dir = makeTempDir('artifact-');
        const { file, sha256 } = createFakeArtifact(dir);
        const result = runCli(['--artifact', file, '--sha256', sha256, '--lane', 'npm-node']);
        assert.equal(result.status, 2);
        assert.match(result.stderr, /--out/);
    });

    it('rejects a sha256 that does not match the artifact bytes', () => {
        const dir = makeTempDir('artifact-');
        const { file } = createFakeArtifact(dir);
        const out = makeTempDir('out-');
        const scratch = makeTempDir('scratch-');
        const result = runCli([
            '--artifact', file,
            '--sha256', 'a'.repeat(64),
            '--lane', 'npm-node',
            '--out', out,
            '--scratch', scratch
        ]);
        assert.equal(result.status, 2);
        assert.match(result.stderr, /sha-?256/i);
        assert.equal(fs.existsSync(path.join(out, 'results.json')), false);
        assert.equal(fs.existsSync(path.join(out, 'REPORT.md')), false);
    });

    it('rejects an artifact that is not the CLA DB package', () => {
        const dir = makeTempDir('artifact-');
        const { file, sha256 } = createFakeArtifact(dir, { name: 'other-package' });
        const result = runCli([
            '--artifact', file, '--sha256', sha256, '--lane', 'npm-node', '--out', makeTempDir('out-')
        ]);
        assert.equal(result.status, 2);
        assert.match(result.stderr, /@clatech\/db/);
    });

    it('rejects a malformed sha256 value', () => {
        const dir = makeTempDir('artifact-');
        const { file } = createFakeArtifact(dir);
        const result = runCli([
            '--artifact', file, '--sha256', 'not-a-hash', '--lane', 'npm-node', '--out', makeTempDir('out-')
        ]);
        assert.equal(result.status, 2);
        assert.match(result.stderr, /sha-?256/i);
    });
});

describe('dry runs', () => {
    it('records every planned probe as skipped and never as passed', () => {
        const dir = makeTempDir('artifact-');
        const { file, sha256 } = createFakeArtifact(dir);
        const fakeBin = path.join(makeTempDir('bin-'), 'bin');
        const marker = path.join(makeTempDir('marker-'), 'calls.log');
        writeFakeTool(fakeBin, 'npm', `
const fs = require('node:fs');
fs.appendFileSync(${JSON.stringify(marker)}, process.argv.slice(2).join(' ') + '\\n');
if (process.argv.includes('--version')) { console.log('11.19.1'); process.exit(0); }
process.exit(9);
`);
        const { result, results, markdown, scratch } = runLane([
            '--artifact', file, '--sha256', sha256, '--lane', 'npm-node', '--dry-run', '--path', fakeBin
        ]);
        assert.equal(result.status, 4);
        assert.ok(results, 'dry run must write results.json');
        assert.equal(results.verdict, 'NOT_RUN');
        assert.equal(results.supported, false);
        assert.equal(results.summary.passed, 0);
        assert.equal(results.summary.skipped, results.probes.length);
        assert.ok(results.probes.every(probe => probe.status === 'SKIP'));
        assert.equal(results.artifact.packageVersion, '0.1.3');
        assert.equal(fs.existsSync(marker), false, 'dry run must not call a package manager');
        assert.match(markdown, /never counted as passed/);
        assert.equal(fs.readdirSync(scratch).length, 0, 'scratch must be released');
    });

    it('plans every lane without executing a package manager', () => {
        const dir = makeTempDir('artifact-');
        const { file, sha256 } = createFakeArtifact(dir);
        const fakeBin = path.join(makeTempDir('bin-'), 'bin');
        const marker = path.join(makeTempDir('marker-'), 'calls.log');
        for (const name of ['npm', 'pnpm', 'bun', 'yarn', 'deno']) {
            writeFakeTool(fakeBin, name, `
const fs = require('node:fs');
fs.appendFileSync(${JSON.stringify(marker)}, '${name} ' + process.argv.slice(2).join(' ') + '\\n');
console.log('${name === 'yarn' ? '4.19.0' : '1.0.0'}');
process.exit(0);
`);
        }
        for (const lane of expectedLanes) {
            const run = runLane([
                '--artifact', file, '--sha256', sha256, '--lane', lane, '--dry-run', '--path', fakeBin
            ]);
            assert.equal(run.result.status, 4, `${lane}: ${run.result.stderr}`);
            assert.equal(run.results.verdict, 'NOT_RUN', lane);
            assert.equal(run.results.supported, false, lane);
            for (const probe of run.results.probes) {
                assert.equal(probe.status, 'SKIP', `${lane}/${probe.id}`);
                assert.ok(probe.reason, `${lane}/${probe.id} needs a skip reason`);
            }
        }
        assert.equal(fs.existsSync(marker), false, 'dry runs must not call a package manager');
    });
});

describe('executed lanes', () => {
    it('reports a failing install as FAIL and skips the dependent probes', () => {
        const dir = makeTempDir('artifact-');
        const { file, sha256 } = createFakeArtifact(dir);
        const bin = path.join(makeTempDir('bin-'), 'bin');
        writeFakeTool(bin, 'npm', `
if (process.argv.includes('--version')) { console.log('11.19.1'); process.exit(0); }
console.error('fake install failure');
process.exit(7);
`);
        const { result, results, markdown, scratch } = runLane([
            '--artifact', file, '--sha256', sha256, '--lane', 'npm-node', '--path', bin
        ]);
        assert.equal(result.status, 1);
        assert.equal(results.verdict, 'FAIL');
        assert.equal(results.supported, false);
        const install = results.probes.find(probe => probe.id === 'install');
        assert.equal(install.status, 'FAIL');
        assert.equal(install.exitCode, 7);
        assert.match(install.stderr, /fake install failure/);
        assert.deepEqual(
            results.probes.filter(probe => probe.status === 'PASS').map(probe => probe.id),
            ['toolchain'],
            'only the toolchain probe may pass before the install'
        );
        for (const probe of results.probes.filter(entry => entry.required && entry.id !== 'install' && entry.id !== 'toolchain')) {
            assert.equal(probe.status, 'SKIP', probe.id);
            assert.match(probe.reason, /install/);
        }
        assert.match(markdown, /never counted as passed/);
        assert.equal(fs.readdirSync(scratch).length, 0, 'scratch must be released on failure');
    });

    it('reports a mismatched installed package as FAIL instead of PASS', () => {
        const dir = makeTempDir('artifact-');
        const { file, sha256, exports } = createFakeArtifact(dir);
        const bin = path.join(makeTempDir('bin-'), 'bin');
        writeFakeTool(bin, 'npm', `
const fs = require('node:fs');
const path = require('node:path');
if (process.argv.includes('--version')) { console.log('11.19.1'); process.exit(0); }
const target = path.join(process.cwd(), 'node_modules/@clatech/db');
fs.mkdirSync(target, { recursive: true });
fs.writeFileSync(path.join(target, 'package.json'), JSON.stringify({
  name: '@clatech/db',
  version: '0.0.0',
  exports: ${JSON.stringify(exports)}
}));
fs.writeFileSync('package-lock.json', '{}');
process.exit(0);
`);
        const { result, results, scratch } = runLane([
            '--artifact', file, '--sha256', sha256, '--lane', 'npm-node', '--path', bin
        ]);
        assert.equal(result.status, 1);
        assert.equal(results.verdict, 'FAIL');
        assert.equal(results.supported, false);
        const install = results.probes.find(probe => probe.id === 'install');
        assert.equal(install.status, 'PASS');
        const layout = results.probes.find(probe => probe.id === 'package-layout');
        assert.equal(layout.status, 'FAIL');
        assert.match(layout.reason, /0\.0\.0/);
        assert.equal(results.probes.some(probe => probe.status === 'PASS' && probe.id !== 'install' && probe.id !== 'toolchain'), false);
        assert.equal(fs.readdirSync(scratch).length, 0, 'scratch must be released on failure');
    });

    it('reports Yarn below the modern major as UNSUPPORTED without installing', () => {
        const dir = makeTempDir('artifact-');
        const { file, sha256 } = createFakeArtifact(dir);
        const bin = path.join(makeTempDir('bin-'), 'bin');
        const marker = path.join(makeTempDir('marker-'), 'calls.log');
        writeFakeTool(bin, 'yarn', `
const fs = require('node:fs');
fs.appendFileSync(${JSON.stringify(marker)}, process.argv.slice(2).join(' ') + '\\n');
if (process.argv.includes('--version')) { console.log('1.22.22'); process.exit(0); }
process.exit(0);
`);
        const { result, results, scratch } = runLane([
            '--artifact', file, '--sha256', sha256, '--lane', 'yarn-node', '--path', bin
        ]);
        assert.equal(result.status, 3);
        assert.equal(results.verdict, 'UNSUPPORTED');
        assert.equal(results.supported, false);
        const toolchain = results.probes.find(probe => probe.id === 'toolchain');
        assert.equal(toolchain.status, 'UNSUPPORTED');
        assert.match(toolchain.reason, /Yarn >= 4/);
        assert.equal(results.summary.passed, 0);
        assert.equal(fs.existsSync(marker), true, 'the toolchain probe may read --version');
        const calls = fs.readFileSync(marker, 'utf8');
        assert.ok(!calls.includes('install'), `install must not run: ${calls}`);
        assert.equal(fs.readdirSync(scratch).length, 0, 'scratch must be released');
    });
});

describe('report summarisation', () => {
    it('keeps a required skip out of PASS', () => {
        const summary = summarizeProbes([
            { id: 'a', status: 'PASS', required: true },
            { id: 'b', status: 'SKIP', required: true }
        ]);
        assert.equal(summary.verdict, 'INCOMPLETE');
        assert.equal(summary.supported, false);
    });

    it('treats an optional skip as coverage loss without masking PASS', () => {
        const summary = summarizeProbes([
            { id: 'a', status: 'PASS', required: true },
            { id: 'b', status: 'SKIP', required: false }
        ]);
        assert.equal(summary.verdict, 'PASS');
        assert.equal(summary.supported, true);
        assert.equal(summary.skipped, 1);
    });

    it('never reports PASS with a failure, skip or unsupported required probe', () => {
        for (const status of ['FAIL', 'SKIP', 'UNSUPPORTED']) {
            const summary = summarizeProbes([
                { id: 'a', status: 'PASS', required: true },
                { id: 'b', status, required: true }
            ]);
            assert.notEqual(summary.verdict, 'PASS', status);
            assert.equal(summary.supported, false, status);
        }
    });

    it('reports NOT_RUN when nothing was executed', () => {
        const summary = summarizeProbes([{ id: 'a', status: 'SKIP', required: true }], { dryRun: true });
        assert.equal(summary.verdict, 'NOT_RUN');
        assert.equal(summary.supported, false);
    });
});

// Always release the scratch directories this file created.
process.on('exit', cleanupAll);
