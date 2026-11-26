// CLA-DB: TypeScript executed directly by the Bun runtime.
import assert from 'node:assert/strict';
import { createRxDatabase, RXDB_VERSION, type RxJsonSchema } from '@clatech/db';
import { getRxStorageMemory } from '@clatech/db/plugins/storage-memory';

type Item = {
    id: string;
    label: string;
};

const schema: RxJsonSchema<Item> = {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        label: { type: 'string' }
    },
    required: ['id', 'label']
};

assert.equal(RXDB_VERSION, '17.6.0');
const db = await createRxDatabase({
    name: 'lane_bun_typescript',
    storage: getRxStorageMemory(),
    multiInstance: false
});
try {
    await db.addCollections({ items: { schema } });
    await db.items.insert({ id: 'ts-1', label: 'typescript' });
    const found = await db.items.findOne('ts-1').exec();
    assert.equal(found?.label, 'typescript');
} finally {
    await db.remove();
}
console.log('Bun TypeScript runtime verification: PASS');
