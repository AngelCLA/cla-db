// CLA-DB: Verify the patched provider used by both development Firestore SDKs.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const root = createRequire(new URL('../../package.json', import.meta.url));
const lock = JSON.parse(readFileSync(new URL('../../package-lock.json', import.meta.url), 'utf8'));
const supplier = lock.packages['node_modules/@grpc/grpc-js'];
assert.equal(supplier.version, '1.13.6', 'Firestore must resolve the patched gRPC development supplier');
assert.equal(supplier.dev, true);
assert.equal(root('./package.json').devDependencies['rxdb-old'], 'npm:rxdb@16.21.1');
assert.equal(root('rxdb-old/package.json').version, '16.21.1');

const legacy = createRequire(root.resolve('rxdb-old'));
const rootProvider = root.resolve('@grpc/grpc-js/package.json');
for (const load of [root, legacy]) {
    const firebase = createRequire(load.resolve('firebase/firestore'));
    const firestore = createRequire(firebase.resolve('@firebase/firestore'));
    assert.equal(firestore.resolve('@grpc/grpc-js/package.json'), rootProvider);
    assert.equal(firestore('@grpc/grpc-js/package.json').version, supplier.version);
}
console.log(`Firestore gRPC resolution: PASS (both SDKs use @grpc/grpc-js@${supplier.version})`);
