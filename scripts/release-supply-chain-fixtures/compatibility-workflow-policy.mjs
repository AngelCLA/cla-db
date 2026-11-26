// CLA-DB: Verify the compatibility workflow without running Actions or calling npm.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const { parse } = createRequire(import.meta.url)('yaml');
const file = '.github/workflows/compatibility.yml';
assert.ok(existsSync(file), 'Compatibility CI must have a dedicated artifact-based workflow');
const workflow = parse(readFileSync(file, 'utf8'));

function check(w) {
    assert.deepEqual(w.permissions, { contents: 'read' });
    assert.ok(Object.hasOwn(w.on, 'pull_request'));
    assert.ok(!Object.hasOwn(w.on, 'pull_request_target'));
    assert.deepEqual(Object.keys(w.jobs), ['pack', 'consumer', 'browser']);
    const { pack, consumer, browser } = w.jobs;
    for (const job of [pack, consumer, browser]) {
        assert.ok(job['timeout-minutes'] > 0);
        assert.equal(job.permissions, undefined);
        assert.equal(job['continue-on-error'], undefined);
        for (const step of job.steps.filter(s => s.uses)) {
            assert.match(step.uses, /^actions\/[\w-]+@[0-9a-f]{40}$/);
        }
    }
    const build = pack.steps.map(s => s.run ?? '').join('\n');
    assert.match(build, /^\s*node scripts\/release-supply-chain-fixtures\/compatibility-workflow-policy\.mjs$/m);
    assert.equal((build.match(/^\s*npm run build$/gm) ?? []).length, 1);
    assert.equal((build.match(/^\s*npm pack --ignore-scripts\b/gm) ?? []).length, 1);
    assert.equal(pack.outputs.sha256, '${{ steps.artifact.outputs.sha256 }}');
    const archive = pack.steps.find(s => s.uses?.startsWith('actions/upload-artifact@'));
    assert.equal(archive.with.name, 'cla-package');
    assert.match(archive.with.path, /clatech-db-\*\.tgz/);
    assert.match(archive.with.path, /SHA256SUMS/);

    for (const [job, entry] of [[consumer, 'scripts/compatibility/run.mjs'], [browser, 'scripts/browser-integration/run.mjs']]) {
        assert.equal(job.needs, 'pack');
        assert.equal(job.env.CLA_ARTIFACT_SHA, '${{ needs.pack.outputs.sha256 }}');
        const download = job.steps.findIndex(s => s.uses?.startsWith('actions/download-artifact@'));
        assert.ok(download > -1);
        assert.equal(job.steps[download].with.name, archive.with.name);
        const checksum = job.steps.findIndex(s => s.run?.includes('sha256sum --strict --check SHA256SUMS'));
        const probe = job.steps.findIndex(s => s.run?.includes(`node ${entry}`));
        assert.ok(download < checksum && checksum < probe, 'Download and verify before running the consumer');
        assert.match(job.steps[probe].run, /--sha256 "\$CLA_ARTIFACT_SHA"/);
        assert.ok(job.steps.some(s => s.uses?.startsWith('actions/upload-artifact@') && s.if === 'always()'));
        assert.ok(!job.steps.some(s => /npm run build\s*$/m.test(s.run ?? '')));
    }
    assert.deepEqual(new Set(consumer.strategy.matrix.include.map(row => row.lane)), new Set([
        'npm-legacy', 'npm-node', 'pnpm-node', 'bun-node', 'bun-bun', 'yarn-node', 'yarn-pnp', 'deno'
    ]));
    assert.deepEqual(browser.strategy.matrix.engine, ['chromium', 'firefox', 'webkit']);
}

check(workflow);
for (const mutate of [
    w => {
        w.permissions['id-token'] = 'write';
    },
    w => {
        w.jobs.pack.outputs.sha256 = 'unknown';
    },
    w => {
        w.jobs.browser.steps.find(s => s.uses?.startsWith('actions/download-artifact@')).with.name = 'other';
    },
    w => {
        w.jobs.consumer.steps.find(s => s.run?.includes('--strict --check')).run = 'true';
    }
]) {
    const copy = structuredClone(workflow);
    mutate(copy);
    assert.throws(() => check(copy), assert.AssertionError);
}
console.log('Compatibility workflow artifact, permissions, matrix, and four mutation probes: PASS');
