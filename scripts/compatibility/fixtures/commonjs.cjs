// CLA-DB: CommonJS consumer checks against the installed artifact only.
const assert = require('node:assert/strict');
const { Subject } = require('rxjs');
const { createRxDatabase, RXDB_VERSION } = require('@clatech/db');
const { getRxStorageMemory } = require('@clatech/db/plugins/storage-memory');

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

async function main() {
    assert.equal(RXDB_VERSION, '17.6.0');
    const subject = new Subject();
    let rxjsValue = 0;
    const subscription = subject.subscribe(value => {
        rxjsValue = value;
    });
    subject.next(11);
    subscription.unsubscribe();
    assert.equal(rxjsValue, 11);

    const db = await createRxDatabase({
        name: 'lane_commonjs',
        storage: getRxStorageMemory(),
        multiInstance: false
    });
    try {
        await db.addCollections({ items: { schema } });
        await db.items.insert({ id: 'cjs-1', label: 'commonjs' });
        assert.equal((await db.items.findOne('cjs-1').exec()).label, 'commonjs');
        await db.items.bulkInsert([
            { id: 'cjs-2', label: 'second' },
            { id: 'cjs-3', label: 'third' }
        ]);
        assert.equal((await db.items.find().exec()).length, 3);
    } finally {
        await db.remove();
    }
    console.log('CommonJS require, RxJS and CRUD verification: PASS');
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
