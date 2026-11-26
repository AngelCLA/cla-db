/**
 * CLA-DB: Deterministic guards for the sequential storage lineage runner.
 *
 * These tests never install from a registry and never build or pack the
 * repository. They cover the documented command surface and every rejection
 * that must happen before a consumer is created: an unauthenticated artifact,
 * a digest mismatch, an unexpected package and a version that does not match
 * package.json.
 */
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(new URL('verify-storage-compat.mjs', import.meta.url))), '../..');
const runner = path.join(repoRoot, 'scripts/verify-storage-compat.mjs');
const createdDirs = [];
const packageVersion = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8')).version;

function makeTempDir() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'storage-lineage-'));
    createdDirs.push(dir);
    return dir;
}
after(() => {
    while (createdDirs.length > 0) fs.rmSync(createdDirs.pop(), { recursive: true, force: true });
});
function sha256File(file) {
    return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}
// A minimal tarball is enough: the runner authenticates the digest and reads package/package.json.
function createArtifact(dir, { version = packageVersion, name = '@clatech/db' } = {}) {
    const parent = path.join(dir, 'payload');
    fs.mkdirSync(path.join(parent, 'package'), { recursive: true });
    fs.writeFileSync(path.join(parent, 'package/package.json'), JSON.stringify({
        name, version, claDb: { upstreamVersion: '17.6.0' }
    }));
    const file = path.join(dir, `${name.replace(/[^a-z0-9]+/gi, '-')}-${version}.tgz`);
    execFileSync('tar', ['-czf', file, '-C', parent, 'package'], { timeout: 60_000 });
    return { file, sha256: sha256File(file), size: fs.statSync(file).size };
}
function runRunner(args) {
    const tmp = makeTempDir();
    const result = spawnSync(process.execPath, [runner, ...args], {
        cwd: repoRoot,
        encoding: 'utf8',
        timeout: 180_000,
        env: { ...process.env, TMPDIR: tmp, NODE_PATH: '', NODE_OPTIONS: '' }
    });
    return { status: result.status, stdout: result.stdout || '', stderr: result.stderr || '', scratch: fs.readdirSync(tmp) };
}
// A rejection must happen before npm install or npm pack runs an isolated consumer.
function assertNoConsumerWork(output) {
    assert.ok(!output.includes('npm install'), `No consumer install may run, output was:\n${output}`);
    assert.ok(!output.includes('npm pack'), `No pack may run, output was:\n${output}`);
}
// The runner only creates scratch directories under its own prefix; Node adds its own compile cache.
function assertNoRunnerScratch(scratch, message) {
    assert.deepEqual(scratch.filter(entry => entry.startsWith('cla-storage-compat-')), [], message);
}
describe('verify-storage-compat command surface', () => {
    it('prints the documented flags for --help and exits 0', () => {
        const result = runRunner(['--help']);
        assert.equal(result.status, 0, result.stderr);
        for (const flag of ['--benchmark', '--artifact', '--sha256', '--json', '--markdown']) {
            assert.match(result.stdout, new RegExp(`${flag} `), `Help must document ${flag}`);
        }
        assert.match(result.stdout, /0\.1\.1/, 'Help must name the exact 0.1.1 baseline');
        assert.match(result.stdout, /0\.1\.2/, 'Help must name the exact 0.1.2 baseline');
        assert.match(result.stdout, /rxdb@17\.6\.0/, 'Help must name the exact RxDB baseline');
        assertNoRunnerScratch(result.scratch, 'Help must not create a scratch consumer');
    });
    it('rejects an artifact without a digest and a digest without an artifact', () => {
        const dir = makeTempDir();
        const artifact = createArtifact(dir);
        for (const args of [['--artifact', artifact.file], ['--sha256', artifact.sha256]]) {
            const result = runRunner(args);
            assert.equal(result.status, 1, `Expected exit 1 for ${args.join(' ')}`);
            assert.match(result.stderr, /--artifact and --sha256 must be provided together/);
            assertNoConsumerWork(result.stdout);
            assertNoRunnerScratch(result.scratch, 'A rejected pair leaves no consumer scratch state');
        }
    });
    it('rejects unknown arguments without touching a consumer', () => {
        const result = runRunner(['--from-registry']);
        assert.equal(result.status, 1);
        assert.match(result.stderr, /Unknown argument "--from-registry"/);
        assertNoConsumerWork(result.stdout);
    });
});

describe('verify-storage-compat artifact authentication', () => {
    it('rejects a digest that does not match the artifact', () => {
        const dir = makeTempDir();
        const artifact = createArtifact(dir);
        const result = runRunner(['--artifact', artifact.file, '--sha256', 'f'.repeat(64)]);
        assert.equal(result.status, 1);
        assert.match(result.stderr, /SHA-256 mismatch/);
        assert.match(result.stderr, new RegExp(artifact.sha256), 'The observed digest is reported');
        assertNoConsumerWork(result.stdout);
        assertNoRunnerScratch(result.scratch, 'A rejected artifact leaves no consumer scratch state');
    });
    it('rejects a tarball that does not carry @clatech/db', () => {
        const dir = makeTempDir();
        const artifact = createArtifact(dir, { name: 'rxdb-clone' });
        const result = runRunner(['--artifact', artifact.file, '--sha256', artifact.sha256]);
        assert.equal(result.status, 1);
        assert.match(result.stderr, /Artifact package is "rxdb-clone"/);
        assertNoConsumerWork(result.stdout);
    });
    it('rejects an authenticated artifact whose version is not the manifest version', () => {
        const dir = makeTempDir();
        const artifact = createArtifact(dir, { version: '9.9.9' });
        const result = runRunner(['--artifact', artifact.file, '--sha256', artifact.sha256]);
        assert.equal(result.status, 1);
        assert.match(result.stderr, new RegExp(`Artifact version 9\\.9\\.9 does not match package.json version ${packageVersion.replace(/\./g, '\\.')}`));
        assertNoConsumerWork(result.stdout);
        assertNoRunnerScratch(result.scratch, 'A rejected version leaves no consumer scratch state');
    });
    it('writes the failure into the requested reports instead of dropping the evidence', () => {
        const dir = makeTempDir();
        const artifact = createArtifact(dir, { version: '9.9.9' });
        const json = path.join(dir, 'results.json');
        const markdown = path.join(dir, 'REPORT.md');
        const result = runRunner(['--artifact', artifact.file, '--sha256', artifact.sha256, '--json', json, '--markdown', markdown]);
        assert.equal(result.status, 1);
        const report = JSON.parse(fs.readFileSync(json, 'utf8'));
        assert.equal(report.verdict, 'FAIL');
        assert.equal(report.supported, false);
        assert.deepEqual(report.candidate, null, 'A rejected artifact is not recorded as the tested candidate');
        assert.equal(report.backwardCompatibility.status, 'NOT EVALUATED');
        assert.match(report.limitations.join('\n'), /simulated IndexedDB/);
        assert.match(fs.readFileSync(markdown, 'utf8'), /\*\*Verdict:\*\* FAIL/);
    });
});
