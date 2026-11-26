/* global Deno */
// CLA-DB: Deprecated DenoKV storage smoke with an in-memory DenoKV instance.
// No blanket permission flag is used; only read and environment access.
import assert from 'node:assert/strict';
import { createRxDatabase } from '@clatech/db';
import { getRxStorageDenoKV } from '@clatech/db/plugins/storage-denokv';

const schema = {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        label: { type: 'string' }
    },
    required: ['id', 'label']
};

async function waitFor(predicate, label, timeoutMs = 5000) {
    const started = Date.now();
    while (!predicate()) {
        if (Date.now() - started > timeoutMs) {
            throw new Error(`Timed out waiting for ${label}`);
        }
        await new Promise(resolve => setTimeout(resolve, 20));
    }
}

assert.equal(typeof Deno.openKv, 'function');
const db = await createRxDatabase({
    name: 'lane_denokv',
    storage: getRxStorageDenoKV({
        consistencyLevel: 'strong',
        openKvPath: ':memory:'
    }),
    multiInstance: false
});
try {
    await db.addCollections({ items: { schema } });
    await db.items.insert({ id: 'kv-1', label: 'denokv' });
    assert.equal((await db.items.findOne('kv-1').exec()).label, 'denokv');

    let latest = 0;
    const subscription = db.items.find().$.subscribe(docs => {
        latest = docs.length;
    });
    await db.items.insert({ id: 'kv-2', label: 'reactive' });
    await waitFor(() => latest === 2, 'DenoKV reactive query');
    subscription.unsubscribe();
} finally {
    await db.remove();
}
console.log('DenoKV storage verification: PASS (in-memory Deno.openKv)');
