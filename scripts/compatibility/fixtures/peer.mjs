// CLA-DB: Verifies the declared RxJS peer dependency and a single RxJS copy.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);

function findPackageRoot(entry) {
    let directory = path.dirname(entry);
    for (;;) {
        if (fs.existsSync(path.join(directory, 'package.json'))) {
            return directory;
        }
        const parent = path.dirname(directory);
        if (parent === directory) {
            throw new Error(`Cannot locate the package root of ${entry}`);
        }
        directory = parent;
    }
}

const packageRoot = findPackageRoot(require.resolve('@clatech/db'));
const manifest = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
assert.equal(manifest.version, process.env.CLA_COMPAT_ARTIFACT_VERSION);
assert.ok(manifest.peerDependencies && manifest.peerDependencies.rxjs, 'rxjs is not a declared peer dependency');

const rxjsManifest = JSON.parse(fs.readFileSync(require.resolve('rxjs/package.json'), 'utf8'));
assert.equal(rxjsManifest.version, process.env.CLA_COMPAT_RXJS_VERSION);
assert.equal(
    fs.existsSync(path.join(packageRoot, 'node_modules', 'rxjs')),
    false,
    'the package must not ship its own rxjs copy'
);

const peerRange = manifest.peerDependencies.rxjs;
const rangeMajor = String(peerRange).replace(/^[^0-9]*/, '').split('.')[0];
assert.ok(
    rxjsManifest.version.split('.')[0] === rangeMajor,
    `rxjs ${rxjsManifest.version} does not satisfy the declared peer range ${peerRange}`
);
console.log(`RxJS peer verification: PASS (${peerRange} satisfied by ${rxjsManifest.version})`);
