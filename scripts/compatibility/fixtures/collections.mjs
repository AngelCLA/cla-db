// CLA-DB: Proves the artificial collection ceiling stays removed.
import assert from 'node:assert/strict';
import { createRxDatabase } from '@clatech/db';
import { getRxStorageMemory } from '@clatech/db/plugins/storage-memory';

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

for (const count of [14, 20, 50, 100]) {
    const db = await createRxDatabase({
        name: 'lane_collections_' + count,
        storage: getRxStorageMemory(),
        multiInstance: false
    });
    try {
        const collections = {};
        for (let index = 1; index <= count; index++) {
            collections['c_' + index] = { schema };
        }
        await db.addCollections(collections);
        assert.equal(Object.keys(db.collections).length, count);

        await db.collections.c_1.insert({ id: 'first', label: 'first' });
        await db.collections['c_' + count].insert({ id: 'last', label: 'last' });
        assert.equal((await db.collections['c_' + count].findOne('last').exec()).label, 'last');

        let latest = 0;
        const subscription = db.collections.c_1.find().$.subscribe(docs => {
            latest = docs.length;
        });
        await db.collections.c_1.insert({ id: 'second', label: 'second' });
        await waitFor(() => latest === 2, `${count} collection reactive query`);
        subscription.unsubscribe();
    } finally {
        await db.remove();
    }
}

console.log('Collection count verification: PASS (14, 20, 50 and 100 simultaneous collections)');
