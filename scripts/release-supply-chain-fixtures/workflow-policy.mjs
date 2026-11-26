// CLA-DB: Static policy probes never dispatch workflows or request credentials.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { spawnSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { parse } = require('yaml');
const load = file => parse(fs.readFileSync(file, 'utf8'));
const stageCommand = 'npm stage publish ./clatech-db-0.1.2.tgz --provenance --access public --ignore-scripts';
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
    assert.deepEqual(Object.keys(publish.on), ['workflow_dispatch']);
    assert.deepEqual(publish.permissions, { contents: 'read' });
    assert.deepEqual(publish.jobs.build.permissions, { contents: 'read' });
    const job = publish.jobs.stage;
    assert.equal(job.environment, 'npm-release');
    assert.equal(job['runs-on'], 'ubuntu-24.04');
    assert.deepEqual(job.permissions, { contents: 'read', 'id-token': 'write' });
    assert.equal(job.needs, 'build');
    const guard = job.if.replace(/\s+/g, ' ').trim();
    assert.equal(guard, 'github.repository == \'AngelCLA/cla-db\' && github.ref == \'refs/heads/master\' && github.ref_protected && inputs.confirmation == \'STAGE @clatech/db@0.1.2\'');
    assert.equal(publish.jobs.build.if.replace(/\s+/g, ' ').trim(), guard);
    const context = { github: { repository: 'AngelCLA/cla-db', ref: 'refs/heads/master', ref_protected: true }, inputs: { confirmation: 'STAGE @clatech/db@0.1.2' } };
    assert.equal(runInNewContext(guard, context), true);
    for (const [key, value] of [['repository', 'fork/cla-db'], ['ref', 'refs/tags/0.1.2'], ['ref_protected', false]]) {
        assert.equal(runInNewContext(guard, { ...context, github: { ...context.github, [key]: value } }), false);
    }
    for (const confirmation of ['no', 'PUBLISH @clatech/db@0.1.2']) {
        assert.equal(runInNewContext(guard, { ...context, inputs: { confirmation } }), false);
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
    assert.ok(!/\bnpm\s+(?:publish|stage\s+approve)\b/.test(JSON.stringify(publish)));
    assert.ok(!/secrets\.|NODE_AUTH_TOKEN/.test(JSON.stringify(publish)));
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
            w.jobs.stage.steps.push({ run: 'npm publish ./clatech-db-0.1.2.tgz' });
        },
        w => {
            w.jobs.stage.steps.push({ run: 'npm stage approve 1' });
        }
    ]) {
        const candidate = structuredClone(publish);
        mutate(candidate);
        assert.throws(() => checkWorkflows(ci, candidate));
    }
    console.log('Workflow syntax, positive policy and eight negative mutation probes: PASS');
}
testWorkflows();
