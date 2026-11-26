// CLA-DB: ESM consumer checks against the installed artifact only.
import assert from 'node:assert/strict';
import { Subject } from 'rxjs';
import { addRxPlugin, createRxDatabase, hasPremiumFlag, RXDB_VERSION } from '@clatech/db';
import { getRxStorageMemory } from '@clatech/db/plugins/storage-memory';
import { RxDBMigrationSchemaPlugin } from '@clatech/db/plugins/migration-schema';
import { replicateRxCollection } from '@clatech/db/plugins/replication';

assert.equal(RXDB_VERSION, '17.6.0');
assert.equal(typeof replicateRxCollection, 'function');
assert.equal(await hasPremiumFlag(), false);
addRxPlugin(RxDBMigrationSchemaPlugin);

// RxJS must be the consumer copy resolved through the declared peer dependency.
const subject = new Subject();
let rxjsValue = 0;
const rxjsSubscription = subject.subscribe(value => {
    rxjsValue = value;
});
subject.next(7);
rxjsSubscription.unsubscribe();
assert.equal(rxjsValue, 7);

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

const db = await createRxDatabase({
    name: 'lane_esm',
    storage: getRxStorageMemory(),
    multiInstance: false
});
try {
    await db.addCollections({ items: { schema } });
    await db.items.insert({ id: 'esm-1', label: 'esm' });
    const found = await db.items.findOne('esm-1').exec();
    assert.equal(found.label, 'esm');

    let resolveReactive;
    const reactive = new Promise(resolve => {
        resolveReactive = resolve;
    });
    const subscription = db.items.find().$.subscribe(docs => {
        if (docs.length === 2) {
            resolveReactive(docs.map(doc => doc.label).sort().join(','));
        }
    });
    await db.items.insert({ id: 'esm-2', label: 'reactive' });
    assert.equal(await reactive, 'esm,reactive');
    subscription.unsubscribe();

    await db.items.findOne('esm-1').exec().then(doc => doc.incrementalPatch({ label: 'esm-updated' }));
    assert.equal((await db.items.findOne('esm-1').exec()).label, 'esm-updated');
    await db.items.findOne('esm-2').exec().then(doc => doc.remove());
    assert.equal(await db.items.findOne('esm-2').exec(), null);
} finally {
    await db.remove();
}
console.log('ESM, RxJS, CRUD and reactive query verification: PASS');
