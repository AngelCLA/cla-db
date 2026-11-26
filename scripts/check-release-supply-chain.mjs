// CLA-DB: Detached production artifact audit; no lifecycle scripts or repository installs.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [mode, artifact, sbomOutput] = process.argv.slice(2);
assert.ok(mode === '--artifact' || mode === '--dev-lock', 'Usage: node scripts/check-release-supply-chain.mjs --artifact TARBALL [SBOM_OUTPUT] | --dev-lock');
const root = process.cwd();
// Preserve the original CI manifest policy, including development and optional peers.
const rootPackage = JSON.parse(fs.readFileSync(path.join(root, 'package.json')));
assert.equal(rootPackage.name, '@clatech/db');
assert.equal(rootPackage.license, 'Apache-2.0');
const rootLicense = fs.readFileSync(path.join(root, 'LICENSE.txt'), 'utf8');
assert.ok(rootLicense.includes('Apache License') && rootLicense.includes('Version 2.0'));
for (const group of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
    assert.ok(!Object.keys(rootPackage[group] || {}).some(name => name.includes('rxdb-premium')), 'Proprietary dependency declaration');
}
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cla-supply-audit-'));
const env = { ...process.env, NODE_PATH: '', NODE_OPTIONS: '' };
const run = (cmd, args, cwd = tmp) => execFileSync(cmd, args, { cwd, env, encoding: 'utf8', maxBuffer: 30 * 1024 * 1024 });
try {
    let identity;
    let screenedFiles = 0;
    const alerts = [];
    if (mode === '--artifact') {
        const bytes = fs.readFileSync(artifact);
        identity = { file: path.basename(artifact), sha256: createHash('sha256').update(bytes).digest('hex'), integrity: 'sha512-' + createHash('sha512').update(bytes).digest('base64') };
        const files = run('tar', ['-tzf', path.resolve(artifact)]).trim().split('\n').filter(f => !f.endsWith('/'));
        assert.ok(files.every(f => f.startsWith('package/') && !f.split('/').includes('..')), 'Unsafe archive path');
        assert.ok(!files.some(f => /(?:^|\/)(?:\.env(?:\..*)?|\.npmrc|id_rsa|node_modules|rxdb-premium)(?:\/|$)/i.test(f)), 'Forbidden archive path');
        run('tar', ['-xzf', path.resolve(artifact)]);
        const pkg = JSON.parse(fs.readFileSync(path.join(tmp, 'package/package.json')));
        assert.equal(pkg.name, '@clatech/db');
        assert.equal(pkg.version, '0.1.2');
        assert.equal(pkg.license, 'Apache-2.0');
        assert.ok(fs.readFileSync(path.join(tmp, 'package/LICENSE.txt'), 'utf8').includes('Apache License'));
        // Only flag high-specificity credential patterns. Never print matching content.
        for (const file of files) {
            const stat = fs.lstatSync(path.join(tmp, file));
            assert.ok(stat.isFile(), 'Unexpected archive link');
            const text = fs.readFileSync(path.join(tmp, file), 'utf8');
            if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{30,}\b|\bnpm_[A-Za-z0-9]{30,}\b|\bAKIA[0-9A-Z]{16}\b/.test(text)) alerts.push(file);
            screenedFiles++;
        }
        assert.equal(alerts.length, 0, `Credential-pattern alerts: ${alerts.length} (contents withheld)`);
        fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ name: 'cla-production-audit', version: '1.0.0', private: true, dependencies: { '@clatech/db': `file:${path.resolve(artifact)}`, rxjs: '7.8.2' } }));
        run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund']);
    } else {
        for (const file of ['package.json', 'package-lock.json']) fs.copyFileSync(path.join(root, file), path.join(tmp, file));
    }
    const lock = JSON.parse(fs.readFileSync(path.join(tmp, 'package-lock.json')));
    const inventory = Object.entries(lock.packages).filter(([location]) => location).map(([location, pkg]) => {
        const installed = path.join(tmp, location, 'package.json');
        const manifest = fs.existsSync(installed) ? JSON.parse(fs.readFileSync(installed)) : {};
        const name = manifest.name || pkg.name || location.split('node_modules/').at(-1);
        assert.ok(!name.includes('rxdb-premium'), 'Proprietary package identity');
        if (mode === '--artifact') assert.notEqual(name, 'rxdb', 'Unexpected upstream package identity');
        const license = manifest.license || pkg.license || 'UNKNOWN';
        if (mode === '--artifact') assert.ok(['0BSD', 'Apache-2.0', 'BSD-3-Clause', 'ISC', 'MIT', 'Unlicense'].includes(license), `Unreviewed production license: ${name}@${pkg.version}`);
        return { name, version: pkg.version, location, license, resolved: pkg.resolved, integrity: pkg.integrity, installScript: !!pkg.hasInstallScript, dev: !!pkg.dev };
    });
    const audit = spawnSync('npm', ['audit', '--json', ...(mode === '--artifact' ? ['--omit=dev'] : [])], { cwd: tmp, env, encoding: 'utf8', maxBuffer: 30 * 1024 * 1024 });
    const result = JSON.parse(audit.stdout);
    assert.ok(result.metadata?.vulnerabilities && !result.error, 'Audit unavailable');
    if (mode === '--artifact') {
        const bom = JSON.parse(run('npm', ['sbom', '--omit=dev', '--sbom-format=cyclonedx']));
        assert.equal(bom.bomFormat, 'CycloneDX');
        assert.ok(bom.specVersion && bom.components.length && bom.dependencies.length);
        const refs = new Set([bom.metadata.component['bom-ref'], ...bom.components.map(c => c['bom-ref'])]);
        assert.equal(refs.size, bom.components.length + 1, 'Duplicate BOM identity');
        for (const edge of bom.dependencies) {
            assert.ok(refs.has(edge.ref));
            for (const ref of edge.dependsOn || []) assert.ok(refs.has(ref), 'Dangling dependency');
        }
        const component = bom.components.find(c => c.name === '@clatech/db' && c.version === '0.1.2');
        assert.ok(component, 'Missing artifact component');
        assert.equal(bom.components.length, inventory.length, 'BOM must cover installed production identities');
        component.hashes = [{ alg: 'SHA-256', content: identity.sha256 }, { alg: 'SHA-512', content: createHash('sha512').update(fs.readFileSync(artifact)).digest('hex') }];
        if (sbomOutput) fs.writeFileSync(sbomOutput, JSON.stringify(bom, null, 2) + '\n');
    }
    console.log(JSON.stringify({ mode, identity, screenedFiles, credentialPatternAlerts: alerts.length, auditExit: audit.status, vulnerabilities: result.metadata.vulnerabilities, dependencies: result.metadata.dependencies, findings: Object.keys(result.vulnerabilities || {}), inventory }, null, 2));
    if (mode === '--artifact') assert.equal(audit.status, 0, 'Production audit findings');
} finally {
    fs.rmSync(tmp, { recursive: true, force: true });
}
