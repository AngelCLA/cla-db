/**
 * CLA-DB: S6 browser scenarios on native IndexedDB through the Dexie storage
 * of the installed candidate tarball. No fake-indexeddb is involved.
 */
import {
    assert,
    assertEqual,
    doc,
    gotoApp,
    harness,
    pollUntil,
    uid
} from './helpers.mjs';

function dexiePrefix(databaseName) {
    return 'rxdb-dexie-' + databaseName + '--';
}

async function assertStorageCleaned(page, databaseName, detail) {
    const databases = await harness(page, 'indexedDbNames');
    if (!databases.supported) {
        detail('indexedDB.databases() is unavailable in this browser');
        return;
    }
    const leftovers = databases.names.filter(name => name.indexOf(dexiePrefix(databaseName)) === 0);
    assertEqual(leftovers.length, 0, 'no leftover IndexedDB databases for ' + databaseName);
}

const crudScenario = {
    id: 's6-crud',
    slice: 'suite',
    title: 'Create a database, insert, query, update and delete documents',
    timeout: 90_000,
    async run({ page, detail }) {
        const name = uid('crud');
        const opened = await harness(page, 'open', { name, collectionCount: 1 });
        detail('collections: ' + opened.collections.join(','));
        assertEqual(opened.openCollections, 1, 'one tracked open collection');

        await harness(page, 'insert', {
            collection: 'col_1',
            docs: [doc('a', 1), doc('b', 2), doc('c', 3)]
        });

        const all = await harness(page, 'find', { collection: 'col_1' });
        assertEqual(all.docs.length, 3, 'three documents after insert');
        assertEqual(all.docs.map(document => document.id).join(','), 'a,b,c', 'documents sorted by id');

        const filtered = await harness(page, 'find', {
            collection: 'col_1',
            selector: { count: { $gt: 1 } }
        });
        assertEqual(filtered.docs.length, 2, 'selector matches two documents');

        const update = await harness(page, 'update', {
            collection: 'col_1',
            id: 'a',
            patch: { count: 10 }
        });
        assertEqual(update.doc.count, 10, 'updated field is returned');
        assert(update.revisionHeightIncreased, 'update increased the revision height');

        const afterUpdate = await harness(page, 'count', {
            collection: 'col_1',
            selector: { count: { $gt: 1 } }
        });
        assertEqual(afterUpdate.count, 3, 'three documents match after the update');

        await harness(page, 'remove', { collection: 'col_1', id: 'b' });
        const afterRemove = await harness(page, 'find', { collection: 'col_1' });
        assertEqual(afterRemove.docs.length, 2, 'two documents after delete');
        assert(
            afterRemove.docs.every(document => document.id !== 'b'),
            'removed document is gone'
        );

        const closed = await harness(page, 'close');
        assertEqual(closed.closed, true, 'database is closed');
        assertEqual(closed.openCollections, 0, 'no tracked open collection after close');

        const reopened = await harness(page, 'open', { name, collectionCount: 1 });
        assertEqual(reopened.openCollections, 1, 'collection is tracked again after reopen');
        const persisted = await harness(page, 'find', { collection: 'col_1' });
        assertEqual(persisted.docs.length, 2, 'documents persist across close and reopen');
        assertEqual(
            persisted.docs.filter(document => document.id === 'a')[0].count,
            10,
            'updated value persists across close and reopen'
        );

        const removed = await harness(page, 'removeDatabase');
        assertEqual(removed.openCollections, 0, 'no tracked open collection after removal');
        await assertStorageCleaned(page, name, detail);
    }
};

const reactivityScenario = {
    id: 's6-reactivity',
    slice: 'suite',
    title: 'Reactive queries emit on insert, update and delete',
    timeout: 90_000,
    async run({ page, detail }) {
        const name = uid('reactivity');
        await harness(page, 'open', { name, collectionCount: 1 });
        await harness(page, 'subscribe', { collection: 'col_1' });

        await pollUntil(
            () => harness(page, 'emissions'),
            value => value.length > 0 && value[0].count === 0,
            { label: 'initial emission with zero documents' }
        );

        await harness(page, 'insert', { collection: 'col_1', docs: [doc('r1', 1), doc('r2', 2)] });
        await pollUntil(
            () => harness(page, 'emissions'),
            value => value[value.length - 1].count === 2,
            { label: 'emission after two inserts' }
        );

        await harness(page, 'update', { collection: 'col_1', id: 'r1', patch: { count: 20 } });
        await harness(page, 'insert', { collection: 'col_1', docs: [doc('r3', 3)] });
        await pollUntil(
            () => harness(page, 'emissions'),
            value => value[value.length - 1].count === 3,
            { label: 'emission after an update and a third insert' }
        );

        await harness(page, 'remove', { collection: 'col_1', id: 'r2' });
        const emissions = await pollUntil(
            () => harness(page, 'emissions'),
            value => value[value.length - 1].count === 2,
            { label: 'emission after delete' }
        );
        const counts = emissions.map(emission => emission.count);
        detail('emissions: ' + counts.join(','));
        assert(counts.includes(0), 'initial emission observed');
        assert(counts.includes(3), 'three document emission observed');

        const closed = await harness(page, 'close');
        assertEqual(closed.closed, true, 'database is closed');
        const afterClose = await harness(page, 'emissions');
        await new Promise(resolve => setTimeout(resolve, 300));
        const laterEmissions = await harness(page, 'emissions');
        assertEqual(
            laterEmissions.length,
            afterClose.length,
            'no emissions after the subscription was removed on close'
        );

        await harness(page, 'open', { name, collectionCount: 1 });
        const removed = await harness(page, 'removeDatabase');
        assertEqual(removed.openCollections, 0, 'cleanup removed the tracked collection');
        await assertStorageCleaned(page, name, detail);
    }
};

function collectionsScenario(collectionCount) {
    return {
        id: 's6-collections-' + collectionCount,
        slice: 'suite',
        title: 'Open and use a database with ' + collectionCount + ' collections',
        timeout: collectionCount >= 100 ? 300_000 : 150_000,
        async run({ page, detail }) {
            const name = uid('collections' + collectionCount);
            const opened = await harness(page, 'open', { name, collectionCount });
            assertEqual(opened.collections.length, collectionCount, collectionCount + ' collections created');
            detail('tracked open collections: ' + opened.openCollections);

            const firstCollection = 'col_1';
            const lastCollection = 'col_' + collectionCount;
            await harness(page, 'insert', { collection: firstCollection, docs: [doc('first-1', 1)] });
            await harness(page, 'insert', { collection: lastCollection, docs: [doc('last-1', 2)] });

            const first = await harness(page, 'find', { collection: firstCollection });
            const last = await harness(page, 'find', { collection: lastCollection });
            assertEqual(first.docs.length, 1, 'write and read in the first collection');
            assertEqual(last.docs.length, 1, 'write and read in the last collection');

            const removed = await harness(page, 'removeDatabase');
            assertEqual(removed.openCollections, 0, 'no tracked open collection after removal');
            await assertStorageCleaned(page, name, detail);
        }
    };
}

const reloadScenario = {
    id: 's6-page-reload',
    slice: 'suite',
    title: 'Documents persist across a page reload at the same origin',
    timeout: 90_000,
    async run({ page, origin }) {
        const name = uid('reload');
        await harness(page, 'open', { name, collectionCount: 1 });
        await harness(page, 'insert', {
            collection: 'col_1',
            docs: [doc('reload-1', 1), doc('reload-2', 2)]
        });
        await harness(page, 'close');

        await page.reload({ waitUntil: 'load' });
        await gotoApp(page, origin);
        await harness(page, 'open', { name, collectionCount: 1 });
        const documents = await harness(page, 'find', { collection: 'col_1' });
        assertEqual(documents.docs.length, 2, 'documents persist across a page reload');
        assertEqual(documents.docs[0].id, 'reload-1', 'first persisted document is present');

        const removed = await harness(page, 'removeDatabase');
        assertEqual(removed.openCollections, 0, 'cleanup removed the tracked collection');
    }
};

const browserRestartScenario = {
    id: 's6-browser-restart',
    slice: 'suite',
    title: 'Documents persist across an orderly browser restart with a persistent profile',
    timeout: 150_000,
    async run({ driver, origin, detail }) {
        const profile = 'restart';
        const name = uid('restart');

        await driver.ensure(profile);
        let page = await driver.page(profile);
        await gotoApp(page, origin);
        await harness(page, 'open', { name, collectionCount: 1 });
        await harness(page, 'insert', {
            collection: 'col_1',
            docs: [doc('restart-1', 11), doc('restart-2', 22)]
        });
        await harness(page, 'close');

        await driver.stopTrace(profile);
        await driver.close(profile);
        detail('closed the browser at ' + driver.profileDir(profile));

        await driver.ensure(profile);
        page = await driver.page(profile);
        await gotoApp(page, origin);
        await harness(page, 'open', { name, collectionCount: 1 });
        const documents = await harness(page, 'find', { collection: 'col_1' });
        assertEqual(documents.docs.length, 2, 'documents persist across a browser restart');
        assertEqual(documents.docs[1].count, 22, 'document content survives the restart');

        const removed = await harness(page, 'removeDatabase');
        assertEqual(removed.openCollections, 0, 'cleanup removed the tracked collection');
        await driver.close(profile);
    }
};

const migrationScenario = {
    id: 's6-schema-migration',
    slice: 'suite',
    title: 'Schema migration upgrades stored documents and is not repeated',
    timeout: 120_000,
    async run({ page, origin, detail }) {
        const name = uid('migration');
        await harness(page, 'open', { name, collectionCount: 2, schemaVersion: 0 });
        await harness(page, 'insert', {
            collection: 'col_1',
            docs: [doc('migrate-1', 1), doc('migrate-2', 2)]
        });
        await harness(page, 'close');

        await page.reload({ waitUntil: 'load' });
        await gotoApp(page, origin);
        const migrated = await harness(page, 'open', { name, collectionCount: 2, schemaVersion: 1 });
        assertEqual(migrated.schemaVersion, 1, 'database reopened with schema version 1');
        const documents = await harness(page, 'find', { collection: 'col_1' });
        assertEqual(documents.docs.length, 2, 'migration kept both documents');
        const tags = documents.docs.map(document => document.tag);
        detail('migrated tags: ' + JSON.stringify(tags));
        assert(
            tags.every(tag => tag === 'migrated'),
            'migration strategy ran for every stored document'
        );

        await harness(page, 'close');
        await page.reload({ waitUntil: 'load' });
        await gotoApp(page, origin);
        await harness(page, 'open', { name, collectionCount: 2, schemaVersion: 1 });
        const second = await harness(page, 'find', { collection: 'col_1' });
        assertEqual(second.docs.length, 2, 'second reopen keeps both documents');
        assert(
            second.docs.every(document => document.tag === 'migrated'),
            'migration is not repeated or corrupted on the second reopen'
        );

        const removed = await harness(page, 'removeDatabase');
        assertEqual(removed.openCollections, 0, 'cleanup removed the tracked collections');
    }
};

const cleanupScenario = {
    id: 's6-resource-cleanup',
    slice: 'suite',
    title: 'Opening and closing databases releases collections and subscriptions',
    timeout: 120_000,
    async run({ page, detail }) {
        const baseline = (await harness(page, 'openCollections')).count;
        assertEqual(baseline, 0, 'no open collections before the scenario');

        for (let cycle = 1; cycle <= 3; cycle++) {
            const name = uid('cleanup' + cycle);
            await harness(page, 'open', { name, collectionCount: 2 });
            await harness(page, 'insert', { collection: 'col_1', docs: [doc('cycle-' + cycle, cycle)] });
            await harness(page, 'subscribe', { collection: 'col_1' });
            const closed = await harness(page, 'close');
            assertEqual(closed.closed, true, 'database closed in cycle ' + cycle);
            assertEqual(closed.openCollections, baseline, 'collection tracking released in cycle ' + cycle);
            const databaseState = await harness(page, 'databaseState');
            assertEqual(databaseState.subscriptions, 0, 'subscriptions released in cycle ' + cycle);
            const removed = await harness(page, 'open', { name, collectionCount: 2 });
            assertEqual(removed.openCollections, 2, 'reopen in cycle ' + cycle + ' is tracked');
            await harness(page, 'removeDatabase');
        }

        const finalState = await harness(page, 'openCollections');
        detail('open collections after three cycles: ' + finalState.count);
        assertEqual(finalState.count, baseline, 'collection tracking returned to the baseline');
    }
};

export const suiteScenarios = [
    crudScenario,
    reactivityScenario,
    collectionsScenario(14),
    collectionsScenario(20),
    collectionsScenario(50),
    collectionsScenario(100),
    reloadScenario,
    browserRestartScenario,
    migrationScenario,
    cleanupScenario
];
