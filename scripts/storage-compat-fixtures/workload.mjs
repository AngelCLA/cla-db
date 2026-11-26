// CLA-DB: One public-API fixture for both compatibility and local timing samples.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

export const schema = {
    version: 0, primaryKey: 'id', type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        label: { type: 'string' },
        amount: { type: 'number' },
        tags: { type: 'array', items: { type: 'string' } }
    },
    required: ['id', 'label', 'amount', 'tags']
};
export const documents = Array.from({ length: 200 }, (_, i) => ({
    id: `item-${String(i).padStart(4, '0')}`, label: `Durable café 東京 ${i}`,
    amount: i / 10, tags: ['persisted', `${i}`]
}));
export function load(app, name, version) {
    const require = createRequire(`${app}/package.json`);
    assert.equal(require(`${name}/package.json`).version, version);
    const core = require(name);
    assert.equal(core.RXDB_VERSION, '17.6.0');
    return { ...core, ...require(`${name}/plugins/storage-dexie`) };
}
export async function open(api, indexedDB, IDBKeyRange, name) {
    const db = await api.createRxDatabase({
        name, storage: api.getRxStorageDexie({ indexedDB, IDBKeyRange }), multiInstance: false
    });
    try {
        await db.addCollections({ items: { schema } });
        return db;
    } catch (error) {
        await db.close();
        throw error;
    }
}
export async function content(db) {
    return (await db.items.find({ sort: [{ id: 'asc' }] }).exec()).map(doc => doc.toJSON());
}
export async function seed(db) {
    const result = await db.items.bulkInsert(documents);
    assert.deepEqual(result.error, []);
    assert.equal(result.success.length, documents.length);
    await (await db.items.findOne(documents[0].id).exec()).incrementalPatch({ label: 'updated before close' });
    await (await db.items.findOne(documents[1].id).exec()).remove();
}
export const expected = documents.filter((_, i) => i !== 1).map((doc, i) => i === 0 ? { ...doc, label: 'updated before close' } : doc);
