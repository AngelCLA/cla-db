/**
 * CLA-DB: page-side module state shared by the lifecycle and offline APIs.
 */
import { OPEN_COLLECTIONS } from '@clatech/db';

export const state = {
    db: null,
    dbName: null,
    subscriptions: [],
    emissions: []
};

export function resetState(db, dbName) {
    state.db = db;
    state.dbName = dbName;
    state.subscriptions = [];
    state.emissions = [];
}

export function requireCollection(name) {
    if (!state.db) {
        throw new Error('no database is open');
    }
    const collection = state.db[name];
    if (!collection) {
        throw new Error('unknown collection: ' + name);
    }
    return collection;
}

export function openCollectionsCount() {
    return OPEN_COLLECTIONS.size;
}

export function toJson(document) {
    return document.toJSON();
}
