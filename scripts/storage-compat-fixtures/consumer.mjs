// CLA-DB: Versions may be loaded together, but never have overlapping live databases.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { amounts, content, deletedId, documents, expected, load, migratedSchema, open, seed } from './workload.mjs';

// The pinned candidate identity comes from the runner's asserted artifact version, never from this file.
const { candidate, pairs } = JSON.parse(fs.readFileSync('inputs.json', 'utf8'));
function step(id, detail) {
    console.log(`CLA_DB_STEP ${JSON.stringify({ id, required: true, status: 'PASS', detail })}`);
}
async function compat(pair) {
    const previous = load(pair.app, pair.name, pair.version);
    const current = load(candidate.app, candidate.name, candidate.version, { migration: true });
    // One factory is the same origin/environment across all sequential opens in this pair.
    const indexedDB = new IDBFactory();
    const name = 'cross_version_storage';
    const at = suffix => `lineage:${pair.label}:${suffix}`;
    let db = await open(previous, indexedDB, IDBKeyRange, name);
    try {
        await seed(db);
        assert.deepEqual(await content(db), expected);
        step(at('seed'), `${pair.label} wrote ${documents.length} documents one at a time, updated one and deleted ${deletedId}`);
    } finally {
        await db.close();
    }
    const added = { id: 'candidate', label: `written by ${candidate.version}`, amount: 42, tags: [] };
    const updated = expected.map((doc, i) => i === 0 ? { ...doc, amount: 123.5 } : doc);
    db = await open(current, indexedDB, IDBKeyRange, name);
    const migratedExpectation = [added, ...updated].map(doc => ({ ...doc, migrated: true }));
    try {
        assert.deepEqual(await content(db), expected, 'Exact baseline durable content, including updates and deletion');
        assert.deepEqual(await amounts(db, -1), expected.map(doc => doc.amount).sort((a, b) => a - b), 'The declared index returns every baseline amount in order');
        assert.equal(await db.items.findOne(deletedId).exec(), null, 'The deleted baseline document stays deleted');
        const baseline = await db.items.findOne(expected[0].id).exec();
        assert.equal(baseline.primary, expected[0].id, 'The baseline primary key survives');
        assert.equal(typeof baseline.revision, 'string', 'Baseline revision metadata survives');
        step(at('integrity'), `${documents.length - 1} baseline documents, primary keys, revisions, index order and the deletion are exact`);
        await db.items.insert(added);
        await (await db.items.findOne(expected[0].id).exec()).incrementalPatch({ amount: 123.5 });
    } finally {
        await db.close();
    }
    db = await open(current, indexedDB, IDBKeyRange, name);
    try {
        assert.deepEqual(await content(db), [added, ...updated], 'Candidate writes survive another close/reopen');
        step(at('write'), `${candidate.version} inserted and modified documents that survive a close and reopen`);
    } finally {
        await db.close();
    }
    db = await open(current, indexedDB, IDBKeyRange, name, { migrated: true });
    try {
        assert.deepEqual(await content(db), migratedExpectation, 'Schema version 0 data migrates to version 1 with every field preserved');
        assert.equal(await db.items.findOne(deletedId).exec(), null, 'The deletion survives the migration');
        step(at('migration'), `version 0 to ${migratedSchema.version} migration kept ${migratedExpectation.length} documents and the deletion`);
    } finally {
        await db.close();
    }
    db = await open(current, indexedDB, IDBKeyRange, name, { migrated: true });
    try {
        assert.deepEqual(await content(db), migratedExpectation, 'The migrated schema and its documents persist across a reopen');
        step(at('reopen'), 'version 1 documents and the migrated schema persist across another close and reopen');
    } finally {
        await db.close();
    }
    db = await open(current, indexedDB, IDBKeyRange, name, { migrated: true });
    await db.remove();
    db = await open(current, indexedDB, IDBKeyRange, name, { migrated: true });
    try {
        assert.deepEqual(await content(db), [], 'Final removal leaves no documents');
    } finally {
        await db.remove();
    }
    assert.deepEqual(await indexedDB.databases(), [], 'No remaining IndexedDB databases after removal');
    step(at('cleanup'), 'Removal leaves no documents and no IndexedDB databases');
}
function stats(values) {
    const sorted = [...values].sort((a, b) => a - b);
    return {
        median: sorted[Math.floor(sorted.length / 2)],
        p95: sorted[Math.ceil(sorted.length * 0.95) - 1],
        min: sorted[0],
        max: sorted[sorted.length - 1]
    };
}
async function benchmark(api, label) {
    const samples = [];
    // Two discarded warm-ups followed by nine measured iterations per package.
    for (let i = 0; i < 11; i++) {
        global.gc();
        const before = process.memoryUsage().heapUsed;
        const indexedDB = new IDBFactory();
        const start = performance.now();
        let db = await open(api, indexedDB, IDBKeyRange, 'benchmark');
        try {
            const init = performance.now();
            const inserted = await db.items.bulkInsert(documents);
            const written = performance.now();
            assert.deepEqual(inserted.error, []);
            const found = await content(db);
            const read = performance.now();
            assert.deepEqual(found, documents);
            await db.close();
            db = await open(api, indexedDB, IDBKeyRange, 'benchmark');
            const reopened = performance.now();
            assert.deepEqual(await content(db), documents);
            const heapMiB = (process.memoryUsage().heapUsed - before) / 1024 ** 2;
            if (i >= 2) samples.push({ initMs: init - start, writeMs: written - init, readMs: read - written, reopenMs: reopened - read, heapMiB });
        } finally {
            await db.remove();
        }
        assert.deepEqual(await indexedDB.databases(), []);
    }
    return {
        label, storage: 'dexie over fake-indexeddb', warmups: 2, iterations: 9, documents: documents.length, samples,
        summary: Object.fromEntries(Object.keys(samples[0]).map(key => [key, stats(samples.map(sample => sample[key]))]))
    };
}
if (process.argv[2] === '--benchmark') {
    // Separate processes for each version avoid cross-version module/JIT/heap retention in samples.
    const { spawnSync } = await import('node:child_process');
    for (let i = 0; i <= pairs.length; i++) {
        const result = spawnSync(process.execPath, ['--expose-gc', 'consumer.mjs', `sample-${i}`], { encoding: 'utf8', timeout: 120_000 });
        console.log(`stdout:\n${result.stdout}stderr:\n${result.stderr}exit: ${result.status}`);
        assert.equal(result.status, 0);
        const line = result.stdout.split('\n').find(entry => entry.startsWith('CLA_DB_RUN '));
        assert.ok(line, `Sample ${i} printed no CLA_DB_RUN record`);
    }
} else if (process.argv[2]?.startsWith('sample-')) {
    const i = Number(process.argv[2].slice(7));
    const pair = i < pairs.length ? pairs[i] : { app: candidate.app, name: candidate.name, version: candidate.version, label: `${candidate.name}@${candidate.version} self` };
    const result = await benchmark(load(pair.app, pair.name, pair.version), pair.label);
    console.log(`CLA_DB_RUN ${JSON.stringify(result)}`);
} else {
    let completed = 0;
    for (const pair of pairs) {
        await compat(pair);
        completed++;
    }
    // The candidate also creates and reopens its own data, so a self-reopen is not inferred from a baseline.
    await compat({ label: `${candidate.name}@${candidate.version} self`, app: candidate.app, name: candidate.name, version: candidate.version });
    completed++;
    console.log(`CLA_DB_PAIRS ${JSON.stringify({ expected: pairs.length + 1, completed })}`);
}
