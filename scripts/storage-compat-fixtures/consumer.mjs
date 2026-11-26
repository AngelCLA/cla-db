// CLA-DB: Versions may be loaded together, but never have overlapping live databases.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { content, documents, expected, load, open, seed } from './workload.mjs';

const { candidate, pairs } = JSON.parse(fs.readFileSync('inputs.json', 'utf8'));
async function compat(pair) {
    const previous = load(pair.app, pair.name, pair.version);
    const current = load(candidate, '@clatech/db', '0.1.2');
    // One factory is the same origin/environment across all sequential opens in this pair.
    const indexedDB = new IDBFactory();
    const name = 'cross_version_storage';
    let db = await open(previous, indexedDB, IDBKeyRange, name);
    try {
        await seed(db);
        assert.deepEqual(await content(db), expected);
    } finally {
        await db.close();
    }
    db = await open(current, indexedDB, IDBKeyRange, name);
    const added = { id: 'candidate', label: 'written by 0.1.2', amount: 42, tags: [] };
    const updated = expected.map((doc, i) => i === 0 ? { ...doc, amount: 123.5 } : doc);
    try {
        assert.deepEqual(await content(db), expected, 'Exact baseline durable content, including updates and deletion');
        await db.items.insert(added);
        await (await db.items.findOne(expected[0].id).exec()).incrementalPatch({ amount: 123.5 });
    } finally {
        await db.close();
    }
    db = await open(current, indexedDB, IDBKeyRange, name);
    try {
        assert.deepEqual(await content(db), [added, ...updated], 'Candidate writes survive another close/reopen');
    } finally {
        await db.remove();
    }
    db = await open(current, indexedDB, IDBKeyRange, name);
    try {
        assert.deepEqual(await content(db), [], 'Final removal leaves no documents');
    } finally {
        await db.remove();
    }
    assert.deepEqual(await indexedDB.databases(), [], 'No remaining IndexedDB databases after removal');
    console.log(`${pair.label} -> @clatech/db@0.1.2: PASS (199 exact documents, candidate insert/update, reopen, clean removal)`);
}
function stats(values) {
    const sorted = [...values].sort((a, b) => a - b);
    return { median: sorted[Math.floor(sorted.length / 2)], p95: sorted[Math.ceil(sorted.length * 0.95) - 1] };
}
async function benchmark(api, label) {
    const samples = [];
    // Two discarded warm-ups followed by nine measured iterations per package.
    for (let i = 0; i < 11; i++) {
        global.gc();
        const before = process.memoryUsage().heapUsed;
        const indexedDB = new IDBFactory();
        const start = performance.now();
        const db = await open(api, indexedDB, IDBKeyRange, 'benchmark');
        try {
            const init = performance.now();
            const inserted = await db.items.bulkInsert(documents);
            const written = performance.now();
            assert.deepEqual(inserted.error, []);
            const found = await content(db);
            const read = performance.now();
            assert.deepEqual(found, documents);
            const heapMiB = (process.memoryUsage().heapUsed - before) / 1024 ** 2;
            if (i >= 2) samples.push({ initMs: init - start, writeMs: written - init, readMs: read - written, heapMiB });
        } finally {
            await db.remove();
        }
        assert.deepEqual(await indexedDB.databases(), []);
    }
    console.log(JSON.stringify({ label, warmups: 2, iterations: 9, documents: documents.length, samples,
        summary: Object.fromEntries(Object.keys(samples[0]).map(key => [key, stats(samples.map(sample => sample[key]))])) }));
}
if (process.argv[2] === '--benchmark') {
    // Separate processes for each version avoid cross-version module/JIT/heap retention in samples.
    const { spawnSync } = await import('node:child_process');
    for (let i = 0; i <= pairs.length; i++) {
        const result = spawnSync(process.execPath, ['--expose-gc', 'consumer.mjs', `sample-${i}`], { encoding: 'utf8', timeout: 120_000 });
        console.log(`stdout:\n${result.stdout}stderr:\n${result.stderr}exit: ${result.status}`);
        assert.equal(result.status, 0);
    }
} else if (process.argv[2]?.startsWith('sample-')) {
    const i = Number(process.argv[2].slice(7));
    if (i < pairs.length) {
        const pair = pairs[i];
        await benchmark(load(pair.app, pair.name, pair.version), pair.label);
    } else await benchmark(load(candidate, '@clatech/db', '0.1.2'), '@clatech/db@0.1.2');
} else {
    for (const pair of pairs) await compat(pair);
}
