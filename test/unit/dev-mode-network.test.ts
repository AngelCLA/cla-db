import assert from 'assert';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

// CLA-DB: Fresh processes avoid the global plugin registry and Premium cache
// hiding the first registration path, including under parallel test setup.
function runIsolatedProbe(body: string) {
    const root = pathToFileURL(path.resolve(process.cwd()) + path.sep).href;
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', `
        import assert from 'node:assert/strict';
        import net from 'node:net';
        import tls from 'node:tls';
        import http from 'node:http';
        import https from 'node:https';
        import dgram from 'node:dgram';
        import dns from 'node:dns';
        const networkAttempts = [];
        const block = (kind) => (...args) => {
            networkAttempts.push(kind);
            throw new Error('Network blocked: ' + kind);
        };
        globalThis.fetch = block('fetch');
        globalThis.WebSocket = class { constructor() { block('WebSocket')(); } };
        globalThis.XMLHttpRequest = class { constructor() { block('XMLHttpRequest')(); } };
        net.Socket.prototype.connect = block('net.connect');
        tls.connect = block('tls.connect');
        http.request = block('http.request');
        http.get = block('http.get');
        https.request = block('https.request');
        https.get = block('https.get');
        dgram.createSocket = block('dgram.createSocket');
        dns.lookup = block('dns.lookup');
        dns.promises.lookup = block('dns.promises.lookup');
        const core = await import(${JSON.stringify(root + 'plugins/core/index.mjs')});
        const { RxDBDevModePlugin } = await import(${JSON.stringify(root + 'plugins/dev-mode/index.mjs')});
        const { getRxStorageMemory } = await import(${JSON.stringify(root + 'plugins/storage-memory/index.mjs')});
        const { wrappedValidateAjvStorage } = await import(${JSON.stringify(root + 'plugins/validate-ajv/index.mjs')});
        ${body}
        assert.deepEqual(networkAttempts, []);
    `], { encoding: 'utf8', timeout: 15000 });
    assert.ifError(result.error);
    assert.strictEqual(result.status, 0, result.stdout + result.stderr);
    assert.strictEqual(result.stderr, '');
    return result.stdout.trim();
}

describe('dev-mode-network.test.ts', () => {
    it('does not navigate a tracking iframe on public plugin registration or repeated init', () => {
        const output = runIsolatedProbe(`
            const navigations = [];
            const appended = [];
            const warnings = [];
            console.warn = (message) => warnings.push(message);
            globalThis.window = {};
            globalThis.location = { host: 'ordinary.example', hostname: 'ordinary.example' };
            globalThis.document = {
                createElement(tag) {
                    return {
                        style: {},
                        set src(url) { navigations.push({ tag, url }); },
                        appendChild() {}
                    };
                },
                body: { appendChild(node) { appended.push(node); } }
            };
            core.addRxPlugin(RxDBDevModePlugin);
            await new Promise(resolve => setImmediate(resolve));
            assert.deepEqual(navigations, [], 'Unsolicited browser navigation');
            assert.deepEqual(appended, []);
            assert.equal(warnings.length, 1);
            assert.ok(warnings[0].includes('RxDB dev-mode warning'));
            RxDBDevModePlugin.init();
            await new Promise(resolve => setImmediate(resolve));
            assert.deepEqual(navigations, []);
            assert.deepEqual(appended, []);
            assert.equal(warnings.length, 2);
            console.log('registration/init: no iframe navigation; warning preserved');
        `);
        assert.strictEqual(output, 'registration/init: no iframe navigation; warning preserved');
    });

    it('preserves dev-mode validation and local CRUD with network entry points blocked', () => {
        const output = runIsolatedProbe(`
            const { disableWarnings } = await import(${JSON.stringify(pathToFileURL(path.resolve('plugins/dev-mode/index.mjs')).href)});
            disableWarnings();
            core.addRxPlugin(RxDBDevModePlugin);
            assert.equal(RxDBDevModePlugin.rxdb, true);
            assert.equal(await core.hasPremiumFlag(), false);
            const memory = getRxStorageMemory();
            assert.throws(() => core.createRxDatabase({
                name: 'offline_unvalidated', storage: memory, multiInstance: false
            }), error => error.code === 'DVM1');
            const db = await core.createRxDatabase({
                name: 'offline_validated',
                storage: wrappedValidateAjvStorage({ storage: memory }),
                multiInstance: false
            });
            let collection;
            try {
                await db.addCollections({ items: { schema: {
                    version: 0, primaryKey: 'id', type: 'object',
                    properties: { id: { type: 'string', maxLength: 100 }, value: { type: 'string' } },
                    required: ['id', 'value']
                } } });
                collection = db.items;
                assert.equal(core.OPEN_COLLECTIONS.has(collection), true);
                await assert.rejects(db.items.insert({ id: 'invalid' }), error => error.code === 'VD2');
                assert.equal((await db.items.find().exec()).length, 0);
                const doc = await db.items.insert({ id: 'local', value: 'before' });
                const updated = await doc.incrementalPatch({ value: 'after' });
                assert.equal((await db.items.findOne('local').exec()).value, 'after');
                await updated.remove();
                assert.equal((await db.items.find().exec()).length, 0);
            } finally {
                await db.remove();
            }
            assert.equal(core.OPEN_COLLECTIONS.has(collection), false);
            console.log('offline core: CRUD, DVM1, VD2, Premium=false, OPEN_COLLECTIONS cleanup; network attempts=0');
        `);
        assert.strictEqual(output, 'offline core: CRUD, DVM1, VD2, Premium=false, OPEN_COLLECTIONS cleanup; network attempts=0');
    });
});
