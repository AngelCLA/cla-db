// CLA-DB: One public-API fixture for both compatibility and local timing samples.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const baseSchema = {
    version: 0, primaryKey: 'id', type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        label: { type: 'string' },
        amount: { type: 'number' },
        tags: { type: 'array', items: { type: 'string' } }
    },
    required: ['id', 'label', 'amount', 'tags'],
    // A declared index proves the reader uses the same index definition as the writer.
    indexes: ['amount']
};
export const schema = baseSchema;
// The migration target is declared before the first write so one build opens version 0 and version 1.
export const migratedSchema = {
    ...baseSchema,
    version: 1,
    properties: { ...baseSchema.properties, migrated: { type: 'boolean' } }
};
export const migrationStrategies = {
    1: oldDocument => ({ ...oldDocument, migrated: true })
};
export const documents = Array.from({ length: 200 }, (_, i) => ({
    id: `item-${String(i).padStart(4, '0')}`, label: `Durable café 東京 ${i}`,
    amount: i / 10, tags: ['persisted', `${i}`]
}));
export function load(app, name, version, options = {}) {
    const require = createRequire(`${app}/package.json`);
    // The caller passes the asserted artifact version, never a literal, so a stale pin cannot pass.
    assert.equal(require(`${name}/package.json`).version, version, `${name} installed in ${app} must be ${version}`);
    const core = { ...require(name), ...require(`${name}/plugins/storage-dexie`) };
    assert.equal(core.RXDB_VERSION, '17.6.0', 'The storage compatibility version must stay 17.6.0');
    // Only the reader needs the migration plugin, so a baseline without it is not a gap.
    if (options.migration) core.addRxPlugin(require(`${name}/plugins/migration-schema`).RxDBMigrationSchemaPlugin);
    return core;
}
export async function open(api, indexedDB, IDBKeyRange, name, options = {}) {
    const collection = options.migrated
        ? { schema: migratedSchema, migrationStrategies }
        : { schema };
    const db = await api.createRxDatabase({
        name, storage: api.getRxStorageDexie({ indexedDB, IDBKeyRange }), multiInstance: false
    });
    try {
        await db.addCollections({ items: collection });
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
// An index-backed query is measurable evidence that the declared index is readable after the open.
export async function amounts(db, minimum) {
    const found = await db.items.find({ selector: { amount: { $gt: minimum } }, sort: [{ amount: 'asc' }] }).exec();
    return found.map(doc => doc.amount);
}
export const deletedId = documents[1].id;
export const expected = documents.filter((_, i) => i !== 1).map((doc, i) => i === 0 ? { ...doc, label: 'updated before close' } : doc);
