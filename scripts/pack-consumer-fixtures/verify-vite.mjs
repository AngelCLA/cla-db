// CLA-DB: Vite 6 supports the package's Node >=20 floor without a dev server.
import assert from 'node:assert/strict';
import { build } from 'vite';
const result = await build({
    configFile: false,
    logLevel: 'error',
    build: {
        write: false,
        lib: { entry: './vite-entry.mjs', formats: ['es'], fileName: 'consumer' }
    }
});
const outputs = (Array.isArray(result) ? result : [result]).flatMap(bundle => bundle.output);
for (const name of ['createRxDatabase', 'getRxStorageMemory', 'getRxStorageDexie', 'replicateRxCollection']) {
    assert.ok(outputs.some(chunk => chunk.type === 'chunk' && chunk.exports.includes(name)), `Missing bundled export: ${name}`);
}
console.log('Vite browser bundle verification: PASS');
