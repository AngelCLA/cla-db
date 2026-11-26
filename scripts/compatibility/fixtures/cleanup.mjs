// CLA-DB: Removal must release every tracked open collection.
import assert from 'node:assert/strict';
import { createRxDatabase, OPEN_COLLECTIONS } from '@clatech/db';
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

const before = OPEN_COLLECTIONS.size;
const db = await createRxDatabase({
    name: 'lane_cleanup',
    storage: getRxStorageMemory(),
    multiInstance: false
});
await db.addCollections({ alpha: { schema }, beta: { schema } });
assert.equal(OPEN_COLLECTIONS.size, before + 2);
await db.alpha.insert({ id: 'cleanup-1', label: 'value' });
await db.remove();
assert.equal(OPEN_COLLECTIONS.size, before);

// The same name can be opened again and starts empty.
const reopened = await createRxDatabase({
    name: 'lane_cleanup',
    storage: getRxStorageMemory(),
    multiInstance: false
});
try {
    await reopened.addCollections({ alpha: { schema } });
    assert.equal((await reopened.alpha.find().exec()).length, 0);
} finally {
    await reopened.remove();
}
assert.equal(OPEN_COLLECTIONS.size, before);
console.log('Resource cleanup verification: PASS');
