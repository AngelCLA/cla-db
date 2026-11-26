// CLA-DB: Static policy probes never dispatch workflows or request credentials.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { spawnSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { parse } = require('yaml');
const load = file => parse(fs.readFileSync(file, 'utf8'));
// The release version comes from the manifest so the policy cannot drift from the package.
const version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
assert.equal(version, '0.1.3', 'This policy fixture describes the 0.1.3 release only');
// The retired release must stay unreachable through the current policy and workflow.
const retiredVersion = '0.1.2';
const tarball = `clatech-db-${version}.tgz`;
const confirmation = `STAGE @clatech/db@${version}`;
const stageCommand = `npm stage publish ./${tarball} --provenance --access public --ignore-scripts`;
const ciArtifactName = 'tgz="$pack_dir/clatech-db-$(node -p "require(\'./package.json\').version").tgz"';
// The exact program the staging job runs to reject a differently versioned artifact.
const versionGuard = expected => `let s=""; process.stdin.on("data", c => s+=c).on("end", () => {
              const p=JSON.parse(s); if(p.name!=="@clatech/db" || p.version!=="${expected}") process.exit(1);
            });`;
const normalize = text => String(text).replace(/\s+/g, ' ').trim();
export function checkWorkflows(ci, publish) {
    assert.deepEqual(ci.permissions, { contents: 'read' });
    assert.ok(publish.jobs.stage, 'The release workflow must stage the vetted tarball instead of publishing it');
    assert.deepEqual(Object.keys(publish.jobs), ['build', 'stage']);
    for (const input of ['sha256', 'confirmation']) {
        assert.equal(publish.on.workflow_dispatch.inputs[input].required, true);
        assert.equal(publish.on.workflow_dispatch.inputs[input].type, 'string');
    }
    assert.ok(JSON.stringify(ci).includes('npm ci --ignore-scripts'));
    const verifySteps = ci.jobs.verify.steps;
    const pin = verifySteps.findIndex(step => step.name === 'Install pinned npm for the lockfile');
    const install = verifySteps.findIndex(step => step.run === 'npm ci --ignore-scripts --no-audit --no-fund');
    assert.ok(pin >= 0 && pin < install, 'Verify must install the pinned npm CLI before npm ci');
    assert.equal(verifySteps[pin].run, [
        'npm install --prefix "$RUNNER_TEMP/cla-ci-npm" --ignore-scripts --no-audit --no-fund --no-save --package-lock=false npm@11.19.1',
        'test "$("$RUNNER_TEMP/cla-ci-npm/node_modules/.bin/npm" --version)" = 11.19.1',
        'printf "%s\\n" "$RUNNER_TEMP/cla-ci-npm/node_modules/.bin" >> "$GITHUB_PATH"',
        ''
    ].join('\n'));
    const projectCi = structuredClone(ci);
    projectCi.jobs.verify.steps.splice(pin, 1);
    assert.ok(!JSON.stringify(projectCi).includes('npm install'));
    // The ordinary CI audits whatever version the manifest declares, not a retired artifact path.
    const artifactAudit = verifySteps.find(step => step.name === 'Audit actual production artifact and dependency licenses');
    assert.ok(artifactAudit, 'CI must audit the packed production artifact');
    assert.ok(artifactAudit.run.includes(ciArtifactName), 'CI must derive the artifact name from the manifest version');
    assert.ok(artifactAudit.run.includes('node scripts/check-release-supply-chain.mjs --artifact "$tgz"'));
    assert.ok(!/clatech-db-\d+\.\d+\.\d+\.tgz/.test(JSON.stringify(ci)), 'CI must not pin a single release tarball path');
    assert.deepEqual(Object.keys(publish.on), ['workflow_dispatch']);
    assert.deepEqual(publish.permissions, { contents: 'read' });
    assert.deepEqual(publish.jobs.build.permissions, { contents: 'read' });
    const job = publish.jobs.stage;
    assert.equal(job.environment, 'npm-release');
    assert.equal(job['runs-on'], 'ubuntu-24.04');
    assert.deepEqual(job.permissions, { contents: 'read', 'id-token': 'write' });
    assert.equal(job.needs, 'build');
    const guard = normalize(job.if);
    assert.equal(guard, `github.repository == 'AngelCLA/cla-db' && github.ref == 'refs/heads/master' && github.ref_protected && inputs.confirmation == '${confirmation}'`);
    assert.equal(normalize(publish.jobs.build.if), guard);
    const context = { github: { repository: 'AngelCLA/cla-db', ref: 'refs/heads/master', ref_protected: true }, inputs: { confirmation } };
    assert.equal(runInNewContext(guard, context), true);
    for (const [key, value] of [['repository', 'fork/cla-db'], ['ref', `refs/tags/${version}`], ['ref_protected', false]]) {
        assert.equal(runInNewContext(guard, { ...context, github: { ...context.github, [key]: value } }), false);
    }
    for (const confirmationInput of ['no', `PUBLISH @clatech/db@${version}`, `STAGE @clatech/db@${retiredVersion}`]) {
        assert.equal(runInNewContext(guard, { ...context, inputs: { confirmation: confirmationInput } }), false);
    }
    for (const value of ['a'.repeat(64), '', 'A'.repeat(64), 'a'.repeat(63), '$(exit 0)']) {
        const probe = spawnSync('bash', ['-c', '[[ "$EXPECTED_SHA256" =~ ^[a-f0-9]{64}$ ]]'], { env: { EXPECTED_SHA256: value } });
        assert.equal(probe.status, value === 'a'.repeat(64) ? 0 : 1);
        assert.equal(probe.stdout.length + probe.stderr.length, 0);
    }
    const steps = JSON.stringify(job.steps);
    assert.ok(!/checkout@|npm ci|npm install|npm run|node .*scripts\//.test(steps));
    assert.ok(steps.includes('sha256sum --check'));
    assert.ok(steps.includes('11.15.0'));
    assert.ok(job.steps.some(step => step.run?.split('\n').includes(stageCommand)));
    assert.ok(!JSON.stringify(publish).includes(`clatech-db-${retiredVersion}.tgz`), 'Staging must not reference a retired tarball');
    assert.ok(!JSON.stringify(publish).includes(`STAGE @clatech/db@${retiredVersion}`), 'The confirmation must name the candidate');
    assert.ok(!/\bnpm\s+(?:publish|stage\s+approve)\b/.test(JSON.stringify(publish)));
    assert.ok(!/secrets\.|NODE_AUTH_TOKEN/.test(JSON.stringify(publish)));
    // Offline negative probe: the guard program rejects every artifact but the exact candidate.
    const stageStep = job.steps.find(step => step.name === 'Verify toolchain and stage the exact tarball');
    assert.ok(stageStep, 'Staging must verify the downloaded artifact before submitting it');
    assert.ok(normalize(stageStep.run).includes(normalize(versionGuard(version))), 'The staged manifest must match the release version exactly');
    for (const { manifest, status } of [
        { manifest: { name: '@clatech/db', version }, status: 0 },
        { manifest: { name: '@clatech/db', version: retiredVersion }, status: 1 },
        { manifest: { name: '@clatech/db' }, status: 1 },
        { manifest: { name: 'rxdb', version }, status: 1 }
    ]) {
        const probe = spawnSync(process.execPath, ['-e', versionGuard(version)], { input: JSON.stringify(manifest), encoding: 'utf8' });
        assert.equal(probe.status, status, `The version guard must exit ${status} for ${JSON.stringify(manifest)}`);
        assert.equal(probe.stdout.length + probe.stderr.length, 0);
    }
}
export function testWorkflows() {
    const ci = load('.github/workflows/ci.yml');
    const publish = load('.github/workflows/publish.yml');
    checkWorkflows(ci, publish);
    for (const mutate of [
        w => {
            w.on.push = {};
        },
        w => {
            w.permissions['id-token'] = 'write';
        },
        w => {
            w.jobs.stage.if = 'true';
        },
        w => {
            w.jobs.build.permissions['id-token'] = 'write';
        },
        w => {
            w.jobs.stage.steps.push({ run: 'npm ci' });
        },
        w => {
            w.jobs.stage.environment = 'unprotected';
        },
        w => {
            w.jobs.stage.steps.push({ run: `npm publish ./${tarball}` });
        },
        w => {
            w.jobs.stage.steps.push({ run: 'npm stage approve 1' });
        },
        w => {
            w.jobs.stage.if = w.jobs.stage.if.replace(confirmation, `STAGE @clatech/db@${retiredVersion}`);
        },
        w => {
            w.jobs.stage.steps.push({ run: `npm stage publish ./clatech-db-${retiredVersion}.tgz --provenance --access public --ignore-scripts` });
        }
    ]) {
        const candidate = structuredClone(publish);
        mutate(candidate);
        assert.throws(() => checkWorkflows(ci, candidate));
    }
    const legacyCi = structuredClone(ci);
    legacyCi.jobs.verify.steps.find(step => step.name === 'Audit actual production artifact and dependency licenses').run = [
        'pack_dir=$(mktemp -d)',
        'npm pack --ignore-scripts --pack-destination "$pack_dir"',
        `node scripts/check-release-supply-chain.mjs --artifact "$pack_dir/clatech-db-${retiredVersion}.tgz"`,
        ''
    ].join('\n');
    assert.throws(() => checkWorkflows(legacyCi, structuredClone(publish)));
    console.log('Workflow syntax, positive policy, ten negative mutation probes and one offline version-guard probe: PASS');
}
testWorkflows();
