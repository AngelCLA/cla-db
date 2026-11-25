// CLA-DB: Local handlers and fake IndexedDB require no integration services.
import assert from 'node:assert/strict';
import { indexedDB, IDBKeyRange } from 'fake-indexeddb';
import { addRxPlugin, createRxDatabase, RXDB_VERSION } from '@clatech/db';
import { getRxStorageDexie } from '@clatech/db/plugins/storage-dexie';
import { getRxStorageMemory } from '@clatech/db/plugins/storage-memory';
import { RxDBMigrationSchemaPlugin } from '@clatech/db/plugins/migration-schema';
import { replicateRxCollection } from '@clatech/db/plugins/replication';

assert.equal(RXDB_VERSION, '17.6.0');
addRxPlugin(RxDBMigrationSchemaPlugin);
const schema = {
    version: 0, primaryKey: 'id', type: 'object',
    properties: { id: { type: 'string', maxLength: 100 }, label: { type: 'string' } },
    required: ['id', 'label']
};
const storage = getRxStorageDexie({ indexedDB, IDBKeyRange });
let db = await createRxDatabase({ name: 'ext_migration', storage, multiInstance: false });
try {
    await db.addCollections({ items: { schema } });
    await db.items.insert({ id: 'old', label: 'before' });
    await db.close();
    db = await createRxDatabase({ name: 'ext_migration', storage, multiInstance: false });
    await db.addCollections({ items: {
        schema: { ...schema, version: 1, properties: { ...schema.properties, migrated: { type: 'boolean' } },
            required: [...schema.required, 'migrated'] },
        migrationStrategies: { 1: doc => ({ ...doc, migrated: true }) }
    } });
    const migrated = await db.items.findOne('old').exec();
    assert.equal(migrated.label, 'before');
    assert.equal(migrated.migrated, true);
} finally {
    await db.remove();
}
console.log('Schema migration consumer verification: PASS');

db = await createRxDatabase({ name: 'ext_replication', storage: getRxStorageMemory(), multiInstance: false });
let replication;
try {
    await db.addCollections({ items: { schema } });
    await db.items.insert({ id: 'local', label: 'push-me' });
    const pushed = [];
    let pullCalls = 0;
    replication = replicateRxCollection({
        collection: db.items, replicationIdentifier: 'external-local-handlers',
        live: false, waitForLeadership: false,
        pull: { handler: checkpoint => {
            pullCalls++;
            return Promise.resolve(checkpoint ? { documents: [], checkpoint } : {
                documents: [{ id: 'remote', label: 'pulled', _deleted: false }],
                checkpoint: { id: 'remote' }
            });
        } },
        push: { handler: rows => {
            pushed.push(...rows.map(row => row.newDocumentState));
            return Promise.resolve([]);
        } }
    });
    // Fail immediately on protocol errors rather than retrying indefinitely.
    const errors = replication.error$.subscribe(error => {
        throw error;
    });
    try {
        await replication.awaitInitialReplication();
        await replication.awaitInSync();
        assert.ok(pullCalls > 0);
        assert.equal((await db.items.findOne('remote').exec()).label, 'pulled');
        assert.ok(pushed.some(doc => doc.id === 'local' && doc.label === 'push-me'));
        const local = await db.items.findOne('local').exec();
        const updated = await local.incrementalPatch({ label: 'updated' });
        assert.equal((await db.items.findOne('local').exec()).label, 'updated');
        await updated.remove();
        assert.equal(await db.items.findOne('local').exec(), null);
    } finally {
        errors.unsubscribe();
    }
} finally {
    if (replication) await replication.cancel();
    await db.remove();
}
console.log('Custom replication and CRUD consumer verification: PASS');
