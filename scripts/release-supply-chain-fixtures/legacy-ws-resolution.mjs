// CLA-DB: Keep the old migration baseline without installing its flagged ws copy.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const root = createRequire(new URL('../../package.json', import.meta.url));
const manifest = root('./package.json');
const { packages } = JSON.parse(readFileSync(new URL('../../package-lock.json', import.meta.url), 'utf8'));
const rootWs = packages['node_modules/ws'].version;
const legacyWs = packages['node_modules/rxdb-old/node_modules/ws']?.version ?? rootWs;

assert.equal(manifest.devDependencies['rxdb-old'], 'npm:rxdb@16.21.1');
assert.equal(rootWs, manifest.dependencies.ws);
assert.equal(legacyWs, rootWs, 'The legacy test dependency must use the patched root ws version');
assert.equal(root('rxdb-old/package.json').version, '16.21.1');
const legacy = createRequire(root.resolve('rxdb-old'));
assert.equal(legacy.resolve('ws/package.json'), root.resolve('ws/package.json'));
assert.equal(legacy('ws/package.json').version, rootWs);
console.log(`Legacy migration resolution: PASS (rxdb-old@16.21.1 and ws@${rootWs})`);
