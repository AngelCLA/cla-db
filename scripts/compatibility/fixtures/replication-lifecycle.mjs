// CLA-DB: Bidirectional handler replication, conflict resolution, pause/resume and close.
import assert from 'node:assert/strict';
import { createRxDatabase } from '@clatech/db';
import { getRxStorageMemory } from '@clatech/db/plugins/storage-memory';
import { replicateRxCollection } from '@clatech/db/plugins/replication';

const schema = {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        label: { type: 'string' },
        rev: { type: 'number' }
    },
    required: ['id', 'label', 'rev']
};

async function waitFor(predicate, label, timeoutMs = 10_000) {
    const started = Date.now();
    while (!predicate()) {
        if (Date.now() - started > timeoutMs) {
            throw new Error(`Timed out waiting for ${label}`);
        }
        await new Promise(resolve => setTimeout(resolve, 20));
    }
}

let conflictCalls = 0;
const mergeConflictHandler = {
    isEqual(first, second) {
        return first.id === second.id && first.label === second.label && first.rev === second.rev;
    },
    resolve(input) {
        conflictCalls++;
        return Promise.resolve({
            ...input.newDocumentState,
            label: `${input.newDocumentState.label}+${input.realMasterState.label}`,
            rev: Math.max(input.newDocumentState.rev, input.realMasterState.rev)
        });
    }
};

const db = await createRxDatabase({
    name: 'lane_replication',
    storage: getRxStorageMemory(),
    multiInstance: false
});
let replication = null;
try {
    await db.addCollections({ items: { schema, conflictHandler: mergeConflictHandler } });
    await db.items.insert({ id: 'local-1', label: 'local', rev: 1 });

    const pushedIds = [];
    const conflictServed = new Set();
    const errors = [];

    replication = replicateRxCollection({
        collection: db.items,
        replicationIdentifier: 'lane-local-handlers',
        live: true,
        waitForLeadership: false,
        pull: {
            handler: lastCheckpoint => Promise.resolve(lastCheckpoint
                ? { documents: [], checkpoint: lastCheckpoint }
                : {
                    documents: [{ id: 'remote-1', label: 'remote', rev: 1, _deleted: false }],
                    checkpoint: { id: 'remote-1' }
                })
        },
        push: {
            handler: rows => {
                const conflicts = [];
                for (const row of rows) {
                    const document = row.newDocumentState;
                    pushedIds.push(document.id);
                    if (document.id === 'local-1' && !conflictServed.has(document.id)) {
                        // The fake master already holds a newer state for this document.
                        conflictServed.add(document.id);
                        conflicts.push({
                            ...document,
                            label: 'master:' + document.label,
                            rev: document.rev + 10,
                            _deleted: false,
                            _attachments: {}
                        });
                    }
                }
                return Promise.resolve(conflicts);
            }
        }
    });

    let reportedConflicts = 0;
    const conflictSubscription = replication.conflict$.subscribe(() => {
        reportedConflicts++;
    });
    const errorSubscription = replication.error$.subscribe(error => {
        errors.push(error);
    });

    await replication.awaitInitialReplication();
    await replication.awaitInSync();

    assert.equal((await db.items.findOne('remote-1').exec()).label, 'remote');
    assert.equal(conflictCalls, 1, 'the custom conflict handler must resolve the pushed conflict');
    assert.equal(reportedConflicts, 1, 'the conflict must be reported on conflict$');
    assert.equal((await db.items.findOne('local-1').exec()).label, 'local+master:local');
    assert.ok(pushedIds.includes('local-1'));

    // Pause: new local writes must not reach the master.
    await replication.pause();
    assert.equal(replication.isPaused(), true);
    const pushedWhilePaused = pushedIds.length;
    await db.items.insert({ id: 'local-2', label: 'paused', rev: 1 });
    await new Promise(resolve => setTimeout(resolve, 250));
    assert.equal(pushedIds.length, pushedWhilePaused, 'no push may happen while paused');

    // Resume: the deferred write reaches the master.
    await replication.start();
    assert.equal(replication.isPaused(), false);
    await waitFor(() => pushedIds.includes('local-2'), 'resumed push');
    await replication.awaitInSync();

    assert.deepEqual(errors, []);
    conflictSubscription.unsubscribe();
    errorSubscription.unsubscribe();

    await replication.cancel();
    replication = null;
} finally {
    if (replication) {
        await replication.cancel();
    }
    await db.remove();
}

// A second database with the same name reopens empty after removal.
const reopened = await createRxDatabase({
    name: 'lane_replication',
    storage: getRxStorageMemory(),
    multiInstance: false
});
try {
    await reopened.addCollections({ items: { schema } });
    assert.equal((await reopened.items.find().exec()).length, 0);
} finally {
    await reopened.remove();
}
console.log('Replication lifecycle, conflict resolution and close verification: PASS');
