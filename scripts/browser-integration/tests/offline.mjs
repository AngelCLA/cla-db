/**
 * CLA-DB: S7 offline-first scenarios.
 *
 * The app shell is cached by a minimal service worker. Replication uses
 * custom handlers against the locally controlled backend, with native
 * IndexedDB storage. Every scenario resets its own backend collection key so
 * a leftover replication can never influence another scenario.
 */
import {
    assert,
    assertEqual,
    doc,
    ensureAppShellCached,
    gotoApp,
    harness,
    pollUntil,
    uid,
    waitForApp
} from './helpers.mjs';

const PUSH_RETRY_TIME = 200;

function serverCollectionFor(name) {
    return name + ':col_1';
}

function serverStats(server) {
    return server.backend.stats();
}

function collectionStats(stats, key) {
    return stats.collections[key] || null;
}

const initialSyncScenario = {
    id: 's7-initial-sync',
    slice: 'offline',
    title: 'Initial replication converges against the controlled backend',
    timeout: 120_000,
    async run({ page, server, detail }) {
        const name = uid('sync');
        const serverCollection = serverCollectionFor(name);
        server.backend.reset(serverCollection);

        await harness(page, 'open', { name, collectionCount: 1 });
        await harness(page, 'insert', {
            collection: 'col_1',
            docs: [doc('sync-1', 1), doc('sync-2', 2)]
        });
        await harness(page, 'startReplication', {
            collection: 'col_1',
            serverCollection,
            replicationIdentifier: 'repl-' + name,
            retryTime: PUSH_RETRY_TIME
        });
        await harness(page, 'awaitInitialReplication');

        const stats = await pollUntil(
            () => serverStats(server),
            value => (collectionStats(value, serverCollection)?.docCount ?? 0) === 2,
            { label: 'server received both documents' }
        );
        const counters = collectionStats(stats, serverCollection);
        detail('server counters: ' + JSON.stringify(counters));
        assertEqual(counters.writesById['sync-1'], 1, 'first document written exactly once');
        assertEqual(counters.writesById['sync-2'], 1, 'second document written exactly once');

        const local = await harness(page, 'find', { collection: 'col_1' });
        assertEqual(local.docs.length, 2, 'client keeps both documents');

        const status = await harness(page, 'replicationStatus');
        assertEqual(status.counters.lastError, null, 'no replication error while online');

        await harness(page, 'stopReplication');
        await harness(page, 'close');
    }
};

const offlineReloadScenario = {
    id: 's7-offline-edit-reload',
    slice: 'offline',
    title: 'Offline edits survive an offline page reload served by the app shell',
    timeout: 180_000,
    async run({ page, driver, server, origin, detail }) {
        const name = uid('offline');
        const serverCollection = serverCollectionFor(name);
        server.backend.reset(serverCollection);

        await ensureAppShellCached(page);
        await harness(page, 'open', { name, collectionCount: 1 });
        await harness(page, 'insert', {
            collection: 'col_1',
            docs: [doc('off-1', 1), doc('off-2', 2)]
        });
        await harness(page, 'startReplication', {
            collection: 'col_1',
            serverCollection,
            replicationIdentifier: 'repl-' + name,
            retryTime: PUSH_RETRY_TIME
        });
        await harness(page, 'awaitInitialReplication');
        await pollUntil(
            () => serverStats(server),
            value => (collectionStats(value, serverCollection)?.docCount ?? 0) === 2,
            { label: 'initial sync reached the server' }
        );

        await driver.setOffline(true);
        await harness(page, 'update', { collection: 'col_1', id: 'off-1', patch: { count: 7 } });
        await harness(page, 'insert', { collection: 'col_1', docs: [doc('off-3', 3)] });

        const localBefore = await harness(page, 'find', { collection: 'col_1' });
        assertEqual(localBefore.docs.length, 3, 'offline insert is stored locally');
        assertEqual(
            localBefore.docs.filter(document => document.id === 'off-1')[0].count,
            7,
            'offline update is stored locally'
        );

        const status = await pollUntil(
            () => harness(page, 'replicationStatus'),
            value => value.counters.errors >= 1,
            { label: 'offline push failure surfaced on error$' }
        );
        detail('offline replication errors: ' + status.counters.errors);

        await harness(page, 'stopReplication');
        await page.reload({ waitUntil: 'load' });
        await waitForApp(page);
        const online = await page.evaluate(() => navigator.onLine);
        assertEqual(online, false, 'browser reports offline after the reload');

        await harness(page, 'open', { name, collectionCount: 1 });
        const afterReload = await harness(page, 'find', { collection: 'col_1' });
        assertEqual(afterReload.docs.length, 3, 'offline documents are available after the offline reload');
        assertEqual(
            afterReload.docs.filter(document => document.id === 'off-1')[0].count,
            7,
            'offline update survives the offline reload'
        );
        assert(
            afterReload.docs.some(document => document.id === 'off-3'),
            'offline insert survives the offline reload'
        );

        const stats = await serverStats(server);
        assertEqual(
            collectionStats(stats, serverCollection).docCount,
            2,
            'offline edits were never sent to the server'
        );

        await driver.setOffline(false);
        await harness(page, 'close');
        await gotoApp(page, origin);
    }
};

const reconnectScenario = {
    id: 's7-reconnect-convergence',
    slice: 'offline',
    title: 'Replication converges after reconnect without duplicates',
    timeout: 180_000,
    async run({ page, driver, server, detail }) {
        const name = uid('reconnect');
        const serverCollection = serverCollectionFor(name);
        server.backend.reset(serverCollection);

        await ensureAppShellCached(page);
        await harness(page, 'open', { name, collectionCount: 1 });
        await harness(page, 'insert', {
            collection: 'col_1',
            docs: [doc('rec-1', 1), doc('rec-2', 2)]
        });
        const replicationOptions = {
            collection: 'col_1',
            serverCollection,
            replicationIdentifier: 'repl-' + name,
            retryTime: PUSH_RETRY_TIME
        };
        await harness(page, 'startReplication', replicationOptions);
        await harness(page, 'awaitInitialReplication');
        await pollUntil(
            () => serverStats(server),
            value => (collectionStats(value, serverCollection)?.docCount ?? 0) === 2,
            { label: 'initial sync reached the server' }
        );

        await driver.setOffline(true);
        await harness(page, 'update', { collection: 'col_1', id: 'rec-1', patch: { count: 7 } });
        await harness(page, 'insert', { collection: 'col_1', docs: [doc('rec-3', 3)] });
        await pollUntil(
            () => harness(page, 'replicationStatus'),
            value => value.counters.errors >= 1,
            { label: 'offline replication error observed' }
        );
        await harness(page, 'stopReplication');

        await page.reload({ waitUntil: 'load' });
        await waitForApp(page);
        await harness(page, 'open', { name, collectionCount: 1 });
        const offlineDocs = await harness(page, 'find', { collection: 'col_1' });
        assertEqual(offlineDocs.docs.length, 3, 'offline documents survive the offline reload');

        await driver.setOffline(false);
        await harness(page, 'startReplication', replicationOptions);
        await harness(page, 'awaitInitialReplication');
        await harness(page, 'resync');

        const stats = await pollUntil(
            () => serverStats(server),
            value => (collectionStats(value, serverCollection)?.docCount ?? 0) === 3,
            { label: 'server converged to three documents' }
        );
        const counters = collectionStats(stats, serverCollection);
        detail('server counters after reconnect: ' + JSON.stringify(counters));
        assert(counters.writesById['rec-1'] >= 2, 'edited document was pushed again after reconnect');
        assertEqual(counters.writesById['rec-3'], 1, 'offline insert was pushed exactly once');

        const converged = await pollUntil(
            () => harness(page, 'find', { collection: 'col_1' }),
            value => value.docs.length === 3 &&
                value.docs.filter(document => document.id === 'rec-1')[0].count === 7,
            { label: 'client converged with its own offline edits' }
        );
        assertEqual(converged.docs.length, 3, 'client has three documents after reconnect');

        const serverDocuments = server.backend.docs(serverCollection);
        const ids = serverDocuments.map(document => document.id);
        assertEqual(new Set(ids).size, ids.length, 'no duplicate documents on the server');
        assertEqual(
            serverDocuments.filter(document => document.id === 'rec-1')[0].count,
            7,
            'server stores the reconnected edit'
        );

        await harness(page, 'stopReplication');
        await harness(page, 'close');
    }
};

const conflictScenario = {
    id: 's7-conflict-resolution',
    slice: 'offline',
    title: 'A concurrent offline edit resolves deterministically to the master state',
    timeout: 180_000,
    async run({ page, driver, server, origin, detail }) {
        const nameA = uid('conflictA');
        const nameB = uid('conflictB');
        const serverCollection = uid('conflict') + ':col_1';
        server.backend.reset(serverCollection);

        await harness(page, 'open', { name: nameA, collectionCount: 1 });
        await harness(page, 'insert', { collection: 'col_1', docs: [doc('conflict-1', 1)] });
        await harness(page, 'startReplication', {
            collection: 'col_1',
            serverCollection,
            replicationIdentifier: 'repl-' + nameA,
            retryTime: PUSH_RETRY_TIME
        });
        await harness(page, 'awaitInitialReplication');
        await pollUntil(
            () => serverStats(server),
            value => collectionStats(value, serverCollection)?.writesById?.['conflict-1'] === 1,
            { label: 'client A pushed the first revision' }
        );

        await driver.ensure('client-b');
        const pageB = await driver.page('client-b');
        await gotoApp(pageB, origin);
        await harness(pageB, 'open', { name: nameB, collectionCount: 1 });
        await harness(pageB, 'startReplication', {
            collection: 'col_1',
            serverCollection,
            replicationIdentifier: 'repl-' + nameB,
            retryTime: PUSH_RETRY_TIME
        });
        await harness(pageB, 'awaitInitialReplication');
        await pollUntil(
            () => harness(pageB, 'find', { collection: 'col_1' }),
            value => value.docs.length === 1 && value.docs[0].count === 1,
            { label: 'client B pulled the shared document' }
        );

        await harness(pageB, 'update', {
            collection: 'col_1',
            id: 'conflict-1',
            patch: { count: 99 }
        });
        await pollUntil(
            () => serverStats(server),
            value => collectionStats(value, serverCollection)?.writesById?.['conflict-1'] === 2,
            { label: 'client B pushed the second revision' }
        );

        await driver.setOffline(true);
        await harness(page, 'update', {
            collection: 'col_1',
            id: 'conflict-1',
            patch: { count: 42 }
        });
        const localOffline = await harness(page, 'find', { collection: 'col_1' });
        assertEqual(localOffline.docs[0].count, 42, 'client A stored its offline edit');
        assertEqual(
            server.backend.docs(serverCollection)[0].count,
            99,
            'offline edit of client A did not reach the server'
        );

        await driver.setOffline(false);
        detail('server before convergence: ' + JSON.stringify(await serverStats(server)));
        await harness(page, 'resync');
        const converged = await pollUntil(
            () => harness(page, 'find', { collection: 'col_1' }),
            value => value.docs.length === 1 && value.docs[0].count === 99,
            { label: 'client A converged to the master state' }
        ).catch(async err => {
            detail('client A status: ' + JSON.stringify(await harness(page, 'replicationStatus')));
            detail('server after timeout: ' + JSON.stringify(await serverStats(server)));
            throw err;
        });
        detail('client A document: ' + JSON.stringify(converged.docs[0]));

        const status = await harness(page, 'replicationStatus');
        detail('client A replication counters: ' + JSON.stringify(status.counters));
        assert(status.counters.conflicts >= 1, 'client A observed a conflict');

        const counters = collectionStats(await serverStats(server), serverCollection);
        detail('server counters: ' + JSON.stringify(counters));
        assert(counters.conflictsReturned >= 1, 'server reported the conflict to client A');
        const serverDocuments = server.backend.docs(serverCollection);
        assertEqual(serverDocuments.length, 1, 'server keeps exactly one document');
        assertEqual(serverDocuments[0].count, 99, 'server master state is unchanged');

        const documentB = await harness(pageB, 'find', { collection: 'col_1' });
        assertEqual(documentB.docs[0].count, 99, 'client B keeps the master value');

        await harness(pageB, 'stopReplication');
        await harness(pageB, 'close');
        await driver.close('client-b');

        await harness(page, 'stopReplication');
        await harness(page, 'close');
    }
};

const retryScenario = {
    id: 's7-retry-no-duplicates',
    slice: 'offline',
    title: 'Failed pushes are retried and the document is stored exactly once',
    timeout: 120_000,
    async run({ page, server, detail }) {
        const name = uid('retry');
        const serverCollection = serverCollectionFor(name);
        server.backend.reset(serverCollection);

        await harness(page, 'open', { name, collectionCount: 1 });
        await harness(page, 'startReplication', {
            collection: 'col_1',
            serverCollection,
            replicationIdentifier: 'repl-' + name,
            retryTime: PUSH_RETRY_TIME
        });
        await harness(page, 'awaitInitialReplication');

        server.backend.armFailures({ push: 2 });
        await harness(page, 'insert', { collection: 'col_1', docs: [doc('retry-1', 1)] });

        const stats = await pollUntil(
            () => serverStats(server),
            value => collectionStats(value, serverCollection)?.writesById?.['retry-1'] === 1,
            { label: 'document stored exactly once after the retries' }
        );
        const counters = collectionStats(stats, serverCollection);
        detail('server counters: ' + JSON.stringify(counters));
        detail('induced failures: ' + JSON.stringify(stats.induced));
        assert(stats.attempts.push >= 3, 'the push was retried after two induced failures');
        assert(stats.induced.failedRequests >= 2, 'the induced failures were served');
        assertEqual(counters.docCount, 1, 'server stores one document');
        assertEqual(counters.writesById['retry-1'], 1, 'server stored the document exactly once');

        const status = await harness(page, 'replicationStatus');
        assert(status.counters.errors >= 1, 'the failed pushes were emitted on error$');

        const local = await harness(page, 'find', { collection: 'col_1' });
        assertEqual(local.docs.length, 1, 'client keeps exactly one document');

        await harness(page, 'stopReplication');
        await harness(page, 'close');
    }
};

export const offlineScenarios = [
    initialSyncScenario,
    offlineReloadScenario,
    reconnectScenario,
    conflictScenario,
    retryScenario
];

export { waitForApp };
