/**
 * CLA-DB: page-side automation surface for the browser integration suite.
 *
 * Every function returns JSON serializable data so the Playwright side can
 * assert public package behavior (documents, revisions, cleanup counters)
 * without reading internal storage structures.
 */
import { addRxPlugin, createRxDatabase } from '@clatech/db';
import { getRxStorageDexie } from '@clatech/db/plugins/storage-dexie';
import { RxDBMigrationSchemaPlugin } from '@clatech/db/plugins/migration-schema';
import {
    openCollectionsCount,
    requireCollection,
    resetState,
    state,
    toJson
} from './state.js';

addRxPlugin(RxDBMigrationSchemaPlugin);

const storage = getRxStorageDexie();

export function docSchema(version) {
    const properties = {
        id: { type: 'string', maxLength: 100 },
        title: { type: 'string' },
        count: { type: 'number' },
        updatedAt: { type: 'number', minimum: 0, maximum: 9999999999999, multipleOf: 1 }
    };
    const required = ['id', 'title', 'count', 'updatedAt'];
    if (version >= 1) {
        properties.tag = { type: 'string', maxLength: 50 };
        required.push('tag');
    }
    return {
        version,
        primaryKey: 'id',
        type: 'object',
        properties,
        required,
        indexes: ['updatedAt']
    };
}

export function collectionNames(collectionCount) {
    const names = [];
    for (let index = 1; index <= collectionCount; index++) {
        names.push('col_' + index);
    }
    return names;
}

function collectionDefinitions(collectionCount, schemaVersion) {
    const definitions = {};
    for (const name of collectionNames(collectionCount)) {
        definitions[name] = {
            schema: docSchema(schemaVersion),
            migrationStrategies: schemaVersion >= 1
                ? {
                    1: doc => Object.assign({}, doc, { tag: 'migrated' })
                }
                : undefined
        };
    }
    return definitions;
}

function parseRevisionHeight(revision) {
    if (typeof revision !== 'string') {
        return -1;
    }
    const dash = revision.indexOf('-');
    return dash > 0 ? Number(revision.slice(0, dash)) : -1;
}

export function createHarness() {
    return {
        async open({ name, collectionCount = 1, schemaVersion = 0 }) {
            if (state.db) {
                throw new Error('a database is already open: ' + state.dbName);
            }
            const db = await createRxDatabase({
                name,
                storage,
                multiInstance: true,
                closeDuplicates: true
            });
            await db.addCollections(collectionDefinitions(collectionCount, schemaVersion));
            resetState(db, name);
            return {
                dbName: name,
                schemaVersion,
                collections: collectionNames(collectionCount),
                openCollections: openCollectionsCount()
            };
        },

        async insert({ collection, docs }) {
            const result = await requireCollection(collection).bulkInsert(docs);
            if (result.error.length > 0) {
                throw new Error('insert failed: ' + JSON.stringify(result.error[0]));
            }
            return { inserted: result.success.length, ids: result.success.map(document => document.primary) };
        },

        async find({ collection, selector = {} }) {
            const docs = await requireCollection(collection)
                .find({ selector, sort: [{ id: 'asc' }] })
                .exec();
            return { docs: docs.map(toJson) };
        },

        async count({ collection, selector = {} }) {
            /**
             * `count()` takes a selector, not a query object. `.exec()` returns
             * the number for count queries in this version.
             */
            const result = await requireCollection(collection).count(selector).exec();
            const count = typeof result === 'number' ? result : result && result.count;
            if (typeof count !== 'number') {
                throw new Error('unexpected count result type: ' + typeof result);
            }
            return { count };
        },

        async update({ collection, id, patch }) {
            const collectionInstance = requireCollection(collection);
            const document = await collectionInstance.findOne(id).exec();
            if (!document) {
                throw new Error('document not found: ' + id);
            }
            const previousRevision = document.revision;
            const updated = await document.incrementalPatch(patch);
            return {
                doc: toJson(updated),
                previousRevision,
                revisionHeightIncreased:
                    parseRevisionHeight(updated.revision) > parseRevisionHeight(previousRevision)
            };
        },

        async remove({ collection, id }) {
            const document = await requireCollection(collection).findOne(id).exec();
            if (!document) {
                throw new Error('document not found: ' + id);
            }
            await document.remove();
            return { removed: true };
        },

        subscribe({ collection, selector = {} }) {
            const query = requireCollection(collection).find({ selector, sort: [{ id: 'asc' }] });
            const subscription = query.$.subscribe(docs => {
                state.emissions.push({
                    at: Date.now(),
                    count: docs.length,
                    ids: docs.map(document => document.primary)
                });
            });
            state.subscriptions.push(subscription);
            return { subscriptions: state.subscriptions.length };
        },

        emissions() {
            return state.emissions.slice();
        },

        clearEmissions() {
            state.emissions.length = 0;
            return { cleared: true };
        },

        openCollections() {
            return { count: openCollectionsCount() };
        },

        async indexedDbNames() {
            if (typeof indexedDB.databases !== 'function') {
                return { supported: false, names: null };
            }
            const databases = await indexedDB.databases();
            const names = databases.map(database => database.name).filter(Boolean).sort();
            return { supported: true, names };
        },

        databaseState() {
            return {
                name: state.dbName,
                closed: state.db ? state.db.closed : null,
                subscriptions: state.subscriptions.length
            };
        },

        async close() {
            for (const subscription of state.subscriptions) {
                subscription.unsubscribe();
            }
            state.subscriptions = [];
            if (state.db) {
                const db = state.db;
                state.db = null;
                await db.close();
                return { closed: db.closed, openCollections: openCollectionsCount() };
            }
            return { closed: true, openCollections: openCollectionsCount() };
        },

        async removeDatabase() {
            if (!state.db) {
                throw new Error('no database is open');
            }
            const db = state.db;
            resetState(null, null);
            const removed = await db.remove();
            return { removed, openCollections: openCollectionsCount() };
        },

        async serviceWorkerState() {
            if (!('serviceWorker' in navigator)) {
                return { supported: false };
            }
            const registration = await navigator.serviceWorker.ready;
            return {
                supported: true,
                scope: registration.scope,
                active: Boolean(registration.active),
                controlled: Boolean(navigator.serviceWorker.controller)
            };
        }
    };
}
