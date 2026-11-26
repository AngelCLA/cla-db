/**
 * CLA-DB: page-side offline-first API used by the offline slice.
 *
 * Replication runs through custom pull/push handlers against the locally
 * controlled backend of the test origin. No service, no external host and no
 * fake IndexedDB is involved.
 */
import { replicateRxCollection } from '@clatech/db/plugins/replication';
import { requireCollection } from './state.js';

let replication = null;
let counters = createCounters();

function createCounters() {
    return {
        pullCalls: 0,
        pushCalls: 0,
        received: 0,
        sent: 0,
        conflicts: 0,
        errors: 0,
        lastError: null
    };
}

function jsonRequest(url, payload) {
    return fetch(url, {
        method: 'POST',
        cache: 'no-store',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
    });
}

export function createOfflineHarness() {
    return {
        async startReplication({
            collection,
            serverCollection,
            apiBase = '/api',
            retryTime = 300,
            replicationIdentifier
        }) {
            if (replication) {
                throw new Error('a replication is already running');
            }
            const collectionInstance = requireCollection(collection);
            const remoteCollection = serverCollection || collection;
            const identifier = replicationIdentifier || 'browser-integration-' + remoteCollection;

            replication = replicateRxCollection({
                replicationIdentifier: identifier,
                collection: collectionInstance,
                live: true,
                retryTime,
                autoStart: true,
                pull: {
                    batchSize: 50,
                    handler: async (checkpoint, batchSize) => {
                        counters.pullCalls++;
                        const response = await jsonRequest(apiBase + '/pull', {
                            collection: remoteCollection,
                            checkpoint,
                            batchSize
                        });
                        if (!response.ok) {
                            throw new Error('pull failed with status ' + response.status);
                        }
                        const body = await response.json();
                        return { documents: body.documents, checkpoint: body.checkpoint };
                    }
                },
                push: {
                    batchSize: 50,
                    handler: async rows => {
                        counters.pushCalls++;
                        const response = await jsonRequest(apiBase + '/push', {
                            collection: remoteCollection,
                            rows
                        });
                        if (!response.ok) {
                            throw new Error('push failed with status ' + response.status);
                        }
                        const body = await response.json();
                        return body.masterStates;
                    }
                }
            });

            replication.received$.subscribe(() => {
                counters.received++;
            });
            replication.sent$.subscribe(() => {
                counters.sent++;
            });
            replication.conflict$.subscribe(() => {
                counters.conflicts++;
            });
            replication.error$.subscribe(error => {
                counters.errors++;
                counters.lastError = String(error && error.message ? error.message : error);
            });

            await replication.start();
            return { replicationIdentifier: identifier };
        },

        async awaitInitialReplication() {
            if (!replication) {
                throw new Error('no replication is running');
            }
            await replication.awaitInitialReplication();
            return { done: true };
        },

        resync() {
            if (!replication) {
                throw new Error('no replication is running');
            }
            replication.reSync();
            return { resynced: true };
        },

        async stopReplication() {
            if (!replication) {
                return { stopped: false };
            }
            const current = replication;
            replication = null;
            await current.cancel();
            return { stopped: true };
        },

        replicationStatus() {
            return {
                running: Boolean(replication),
                stopped: replication ? replication.isStopped() : true,
                paused: replication ? replication.isPaused() : false,
                counters: Object.assign({}, counters)
            };
        },

        resetReplicationCounters() {
            counters = createCounters();
            return { reset: true };
        },

        async awaitDocumentPushed({ collection, id }) {
            if (!replication) {
                throw new Error('no replication is running');
            }
            const document = await requireCollection(collection).findOne(id).exec();
            if (!document) {
                throw new Error('document not found: ' + id);
            }
            await replication.awaitDocumentPushed(document);
            return { pushed: true };
        }
    };
}
