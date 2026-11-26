// CLA-DB: This fixture is copied into a detached consumer of the verified tarball.
import { createRxDatabase } from '@clatech/db/plugins/core';
import { getRxStorageMemory } from '@clatech/db/plugins/storage-memory';
import { replicateRxCollection } from '@clatech/db/plugins/replication';
import { filter, firstValueFrom } from 'rxjs';

const schemas = {
    title: 'benchmark document',
    version: 0,
    type: 'object',
    primaryKey: 'id',
    properties: {
        id: { type: 'string', maxLength: 64 },
        value: { type: 'integer' }
    },
    required: ['id', 'value']
};
const documentCount = 100;
const collectionCount = 20;
const warmups = 2;
const iterations = 9;
const rows = Array.from({ length: documentCount }, (_, value) => ({ id: `doc${value}`, value }));
const collectionSet = Object.fromEntries(Array.from({ length: collectionCount }, (_, i) => [`extra${i}`, { schema: schemas }]));

async function measure(fixture, metrics, name) {
    const start = performance.now();
    const result = await fixture();
    metrics[name] = performance.now() - start;
    return result;
}

async function iteration(sequence) {
    const metrics = {};
    const db = await measure(() => createRxDatabase({
        name: `benchmark_${sequence}`,
        storage: getRxStorageMemory(),
        multiInstance: false
    }), metrics, 'openMs');
    try {
        const { docs } = await db.addCollections({ docs: { schema: schemas } });
        const inserted = await measure(() => docs.bulkInsert(rows), metrics, 'writeMs');
        if (inserted.success.length !== documentCount || inserted.error.length) {
            throw new TypeError('Incomplete benchmark insert');
        }
        const read = await measure(() => docs.find().exec(), metrics, 'readMs');
        if (read.length !== documentCount) {
            throw new TypeError('Incomplete benchmark read');
        }
        await measure(async () => {
            const next = firstValueFrom(docs.findOne('doc0').$.pipe(filter(doc => doc?.value === documentCount)));
            await inserted.success[0].incrementalPatch({ value: documentCount });
            await next;
        }, metrics, 'reactiveMs');
        const extra = await measure(() => db.addCollections(collectionSet), metrics, 'collectionsMs');
        if (Object.keys(extra).length !== collectionCount) {
            throw new TypeError('Incomplete benchmark collection set');
        }
        const pushed = new Map();
        await measure(async () => {
            const state = replicateRxCollection({
                replicationIdentifier: `benchmark_${sequence}`,
                collection: docs,
                live: false,
                waitForLeadership: false,
                push: {
                    handler(batch) {
                        for (const row of batch) {
                            pushed.set(row.newDocumentState.id, row.newDocumentState);
                        }
                        return Promise.resolve([]);
                    }
                }
            });
            try {
                await state.awaitInitialReplication();
            } finally {
                await state.cancel();
            }
        }, metrics, 'pushMs');
        if (pushed.size !== documentCount || pushed.get('doc0')?.value !== documentCount) {
            throw new TypeError('Incomplete benchmark replication');
        }
        return metrics;
    } finally {
        await db.close();
    }
}

export async function runMemoryBenchmark() {
    const series = [];
    for (let i = 0; i < warmups + iterations; i++) {
        const sample = await iteration(i);
        if (i >= warmups) {
            series.push(sample);
        }
    }
    const timings = Object.fromEntries(Object.keys(series[0]).map(metric => {
        const samples = series.map(row => row[metric]).sort((a, b) => a - b);
        return [metric, { median: samples[(iterations - 1) / 2], p95: samples[Math.ceil(iterations * 0.95) - 1] }];
    }));
    return { storage: 'Memory', warmups, iterations, documentCount, collectionCount, series, timings, gate: 'none' };
}
