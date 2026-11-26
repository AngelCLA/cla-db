/**
 * CLA-DB: Packs @clatech/db with `npm pack` and verifies installation and
 * execution from an isolated external consumer project (ESM, CommonJS, and TypeScript).
 */
import assert from 'node:assert';
import { checkPackage, checkSourceMaps } from './pack-consumer-fixtures/check-package.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

function run(cmd, args, cwd) {
    return execFileSync(cmd, args, {
        cwd,
        stdio: 'pipe',
        encoding: 'utf8',
        timeout: 180_000,
        maxBuffer: 10 * 1024 * 1024,
        // Do not resolve modules or preload hooks from the invoking repository.
        env: { ...process.env, NODE_PATH: '', NODE_OPTIONS: '' }
    });
}

function main() {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cla-db-consumer-'));
    const packDir = path.join(tmpDir, 'pack');
    const appDir = path.join(tmpDir, 'app');
    fs.mkdirSync(packDir);
    fs.mkdirSync(appDir);

    try {
        console.log('# Packing @clatech/db...');
        const packOut = run('npm', ['pack', '--json', '--pack-destination', packDir], repoRoot).trim();
        const [metadata] = JSON.parse(packOut);
        const tgzName = metadata.filename;
        assert.ok(tgzName && tgzName.endsWith('.tgz'), `Unexpected npm pack output: ${packOut}`);
        const tgzPath = path.join(packDir, tgzName);
        const tgzStat = fs.statSync(tgzPath);
        console.log(`# Packed tarball: ${tgzName} (${(tgzStat.size / 1024).toFixed(1)} KB)`);

        const repoPkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
        const payloadPaths = run('tar', ['-tzf', tgzPath], packDir).trim().split(/\r?\n/)
            .filter(file => !file.endsWith('/')).map(file => file.replace(/^package\//, ''));
        const packedPkg = JSON.parse(run('tar', ['-xOf', tgzPath, 'package/package.json'], packDir));
        assert.equal(packedPkg.version, repoPkg.version, 'Packed artifact version must equal the manifest version');
        checkPackage(metadata, packedPkg, payloadPaths);
        const rxjsVersion = repoPkg.peerDependencies?.rxjs || repoPkg.devDependencies?.rxjs || '^7.8.2';
        const dexieVersion = repoPkg.dependencies?.dexie || '^4.0.0';
        const fakeIdbVersion = repoPkg.devDependencies?.['fake-indexeddb'] || '^6.0.0';
        const tsVersion = repoPkg.devDependencies?.typescript || '^5.9.3';

        fs.writeFileSync(
            path.join(appDir, 'package.json'),
            JSON.stringify({
                name: 'cla-db-external-consumer-test',
                private: true,
                type: 'module',
                version: '0.0.0',
                dependencies: {
                    '@clatech/db': `file:${tgzPath}`,
                    rxjs: rxjsVersion,
                    dexie: dexieVersion
                },
                devDependencies: {
                    'fake-indexeddb': fakeIdbVersion,
                    typescript: tsVersion,
                    vite: '6.4.1'
                }
            }, null, 2),
            'utf8'
        );

        console.log('# Installing packed @clatech/db into isolated consumer project...');
        run('npm', ['install', '--no-audit', '--no-fund'], appDir);
        const installedDir = path.join(appDir, 'node_modules/@clatech/db');
        const installedPkg = JSON.parse(fs.readFileSync(path.join(installedDir, 'package.json'), 'utf8'));
        assert.equal(installedPkg.version, repoPkg.version);
        assert.deepStrictEqual(installedPkg.exports, repoPkg.exports);
        checkSourceMaps(installedDir);
        const graph = JSON.parse(run('npm', ['ls', '--all', '--json'], appDir));
        function checkGraph(node) {
            for (const [name, child] of Object.entries(node.dependencies || {})) {
                assert.notStrictEqual(name, 'rxdb', 'Unexpected rxdb in installed dependency graph');
                assert.ok(!child.resolved || !/\/rxdb(?:\/|-)/.test(child.resolved), 'Unexpected rxdb alias');
                checkGraph(child);
            }
        }
        checkGraph(graph);
        console.log('Installed graph without rxdb: PASS');
        for (const fixture of ['verify-integrations.mjs', 'verify-vite.mjs']) {
            fs.copyFileSync(path.join(__dirname, 'pack-consumer-fixtures', fixture), path.join(appDir, fixture));
        }
        fs.writeFileSync(path.join(appDir, 'vite-entry.mjs'), `
export { createRxDatabase } from '@clatech/db';
export { getRxStorageMemory } from '@clatech/db/plugins/storage-memory';
export { getRxStorageDexie } from '@clatech/db/plugins/storage-dexie';
export { replicateRxCollection } from '@clatech/db/plugins/replication';
`);

        // 1. Verify ESM imports, >13 collections, reactive query, and Dexie persistence
        fs.writeFileSync(
            path.join(appDir, 'verify-esm.mjs'),
            `
import assert from 'node:assert';
import { indexedDB, IDBKeyRange } from 'fake-indexeddb';
import { createRxDatabase, RXDB_VERSION, hasPremiumFlag } from '@clatech/db';
import { getRxStorageMemory } from '@clatech/db/plugins/storage-memory';
import { getRxStorageDexie } from '@clatech/db/plugins/storage-dexie';
import { replicateRxCollection } from '@clatech/db/plugins/replication';

assert.strictEqual(typeof replicateRxCollection, 'function');
assert.strictEqual(RXDB_VERSION.startsWith('17.'), true);
assert.strictEqual(await hasPremiumFlag(), false);

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

const memDb = await createRxDatabase({
    name: 'ext_esm_mem',
    storage: getRxStorageMemory()
});
const cols = {};
for (let i = 1; i <= 15; i++) {
    cols['c_' + i] = { schema };
}
await memDb.addCollections(cols);
assert.strictEqual(Object.keys(memDb.collections).length, 15);
let resolveReactive;
const reactiveSeen = new Promise((resolve) => {
    resolveReactive = resolve;
});
const sub = memDb.collections.c_15.find().$.subscribe((docs) => {
    if (docs.length === 1) {
        resolveReactive(docs[0].label);
    }
});
await memDb.collections.c_15.insert({ id: '1', label: 'hello-esm' });
const reactiveLabel = await reactiveSeen;
assert.strictEqual(reactiveLabel, 'hello-esm');
sub.unsubscribe();
await memDb.remove();

const dexieDb = await createRxDatabase({
    name: 'ext_esm_dexie',
    storage: getRxStorageDexie({ indexedDB, IDBKeyRange }),
    multiInstance: false
});
await dexieDb.addCollections({ items: { schema } });
await dexieDb.items.insert({ id: 'd1', label: 'persisted' });
await dexieDb.close();

const dexieDb2 = await createRxDatabase({
    name: 'ext_esm_dexie',
    storage: getRxStorageDexie({ indexedDB, IDBKeyRange }),
    multiInstance: false
});
await dexieDb2.addCollections({ items: { schema } });
const loaded = await dexieDb2.items.findOne('d1').exec();
assert.ok(loaded && loaded.label === 'persisted');
await dexieDb2.remove();
console.log('ESM consumer verification: PASS');
`,
            'utf8'
        );

        // 2. Verify CommonJS require() and >13 collections
        fs.writeFileSync(
            path.join(appDir, 'verify-cjs.cjs'),
            `
const assert = require('node:assert');
const { createRxDatabase, RXDB_VERSION } = require('@clatech/db');
const { getRxStorageMemory } = require('@clatech/db/plugins/storage-memory');

async function main() {
    assert.strictEqual(RXDB_VERSION.startsWith('17.'), true);
    const db = await createRxDatabase({
        name: 'ext_cjs_mem',
        storage: getRxStorageMemory()
    });
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
    const cols = {};
    for (let i = 1; i <= 15; i++) {
        cols['cjs_' + i] = { schema };
    }
    await db.addCollections(cols);
    assert.strictEqual(Object.keys(db.collections).length, 15);
    await db.collections.cjs_15.insert({ id: 'c1', label: 'hello-cjs' });
    const found = await db.collections.cjs_15.findOne('c1').exec();
    assert.ok(found && found.label === 'hello-cjs');
    await db.remove();
    console.log('CJS consumer verification: PASS');
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
`,
            'utf8'
        );

        // 3. Verify TypeScript declaration resolution (NodeNext & Bundler)
        fs.writeFileSync(
            path.join(appDir, 'tsconfig.json'),
            JSON.stringify({
                compilerOptions: {
                    target: 'ES2022',
                    module: 'NodeNext',
                    moduleResolution: 'NodeNext',
                    strict: true,
                    noEmit: true,
                    skipLibCheck: true
                },
                include: ['verify-types.ts']
            }, null, 2),
            'utf8'
        );
        fs.writeFileSync(
            path.join(appDir, 'verify-types.ts'),
            `
import { createRxDatabase, type RxDatabase, type RxJsonSchema } from '@clatech/db';
import { getRxStorageMemory } from '@clatech/db/plugins/storage-memory';
import { getRxStorageDexie } from '@clatech/db/plugins/storage-dexie';
import { replicateRxCollection } from '@clatech/db/plugins/replication';

type Item = { id: string; label: string; };
const schema: RxJsonSchema<Item> = {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        label: { type: 'string' }
    },
    required: ['id', 'label']
};

export async function check(): Promise<RxDatabase> {
    const db = await createRxDatabase({
        name: 'ts_check',
        storage: getRxStorageMemory()
    });
    await db.addCollections({ items: { schema } });
    void getRxStorageDexie;
    void replicateRxCollection;
    return db;
}
`,
            'utf8'
        );

        console.log(run('node', ['verify-esm.mjs'], appDir).trim());
        console.log(run('node', ['verify-cjs.cjs'], appDir).trim());
        run('npx', ['tsc', '--noEmit'], appDir);
        console.log('TypeScript consumer verification: PASS');
        console.log('TypeScript NodeNext consumer verification: PASS');
        run('npx', ['tsc', '--noEmit', '--module', 'ESNext', '--moduleResolution', 'Bundler'], appDir);
        console.log('TypeScript Bundler consumer verification: PASS');
        console.log(run('node', ['verify-integrations.mjs'], appDir).trim());
        console.log(run('node', ['verify-vite.mjs'], appDir).trim());
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
}

main();
