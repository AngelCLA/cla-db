/**
 * CLA-DB: locally controlled test origin for the browser integration app.
 *
 * Serves the Vite app shell from disk and a controlled backend used by the
 * custom replication handlers: pull, push, conflict detection, induced
 * failures, retry counters and duplicate detection.
 *
 * Nothing here is part of the published package.
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const MIME_TYPES = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webmanifest': 'application/manifest+json',
    '.woff2': 'font/woff2'
};

const MAX_BODY_BYTES = 8 * 1024 * 1024;

export function createBackend({ log = () => { } } = {}) {
    const collections = new Map();
    const induced = { push: 0, pull: 0, failedRequests: 0 };
    const attempts = { push: 0, pull: 0 };

    function collectionState(name) {
        let state = collections.get(name);
        if (!state) {
            state = {
                name,
                seq: 0,
                docs: new Map(),
                stats: {
                    pullRequests: 0,
                    pushRequests: 0,
                    pushesAccepted: 0,
                    conflictsReturned: 0,
                    writesById: new Map()
                }
            };
            collections.set(name, state);
        }
        return state;
    }

    function armFailures({ push: pushCount = 0, pull: pullCount = 0 } = {}) {
        induced.push = Math.max(0, pushCount | 0);
        induced.pull = Math.max(0, pullCount | 0);
        return { ...induced };
    }

    function consumeFailure(kind) {
        if (induced[kind] > 0) {
            induced[kind] = induced[kind] - 1;
            induced.failedRequests = induced.failedRequests + 1;
            log(`induced ${kind} failure, ${induced[kind]} remaining`);
            return true;
        }
        return false;
    }

    function pull({ collection, checkpoint, batchSize }) {
        const state = collectionState(collection);
        state.stats.pullRequests = state.stats.pullRequests + 1;
        const from = typeof checkpoint === 'number' ? checkpoint : 0;
        const limit = Math.max(1, Math.min(1000, Number(batchSize) || 100));
        const rows = Array.from(state.docs.values())
            .filter(entry => entry.seq > from)
            .sort((a, b) => a.seq - b.seq)
            .slice(0, limit);
        const nextCheckpoint = rows.length > 0 ? rows[rows.length - 1].seq : from;
        return {
            documents: rows.map(entry => entry.doc),
            checkpoint: nextCheckpoint
        };
    }

    function push({ collection, rows }) {
        const state = collectionState(collection);
        state.stats.pushRequests = state.stats.pushRequests + 1;
        const masterStates = [];
        const accepted = [];

        for (const row of rows) {
            const incoming = row.newDocumentState;
            const assumed = row.assumedMasterState ?? null;
            const current = state.docs.get(incoming.id);
            if (!incoming || typeof incoming.id !== 'string') {
                throw new Error('push row without a primary key');
            }
            /**
             * Custom replication exchanges document *states* without
             * revisions. A write is only accepted when the client's assumed
             * master state is exactly the current master state. Otherwise the
             * current master state is returned so the collection conflict
             * handler resolves it.
             */
            const assumedMatchesCurrent = current === undefined
                ? true
                : assumed !== null && docsEqual(assumed, current.doc);
            if (assumedMatchesCurrent) {
                accepted.push(incoming);
                continue;
            }
            log('conflict id=' + incoming.id + ' pending master state returned to the client');
            state.stats.conflictsReturned = state.stats.conflictsReturned + 1;
            masterStates.push(current.doc);
        }

        for (const doc of accepted) {
            state.seq = state.seq + 1;
            state.docs.set(doc.id, { doc, seq: state.seq });
            state.stats.pushesAccepted = state.stats.pushesAccepted + 1;
            state.stats.writesById.set(doc.id, (state.stats.writesById.get(doc.id) || 0) + 1);
        }

        return { masterStates, accepted: accepted.length };
    }

    function reset(collection) {
        if (collection) {
            collections.delete(collection);
        } else {
            collections.clear();
        }
    }

    function stats() {
        const result = {};
        for (const [name, state] of collections.entries()) {
            result[name] = {
                docCount: state.docs.size,
                pullRequests: state.stats.pullRequests,
                pushRequests: state.stats.pushRequests,
                pushesAccepted: state.stats.pushesAccepted,
                conflictsReturned: state.stats.conflictsReturned,
                writesById: Object.fromEntries(state.stats.writesById)
            };
        }
        return { induced: { ...induced }, attempts: { ...attempts }, collections: result };
    }

    function docs(collection) {
        const state = collections.get(collection);
        if (!state) {
            return [];
        }
        return Array.from(state.docs.values())
            .sort((a, b) => a.seq - b.seq)
            .map(entry => entry.doc);
    }

    function countAttempt(kind) {
        attempts[kind] = attempts[kind] + 1;
    }

    return { armFailures, consumeFailure, countAttempt, pull, push, reset, stats, docs };
}

export async function startServer({ distDir, log = () => { } }) {
    const backend = createBackend({ log });
    const server = http.createServer((request, response) => {
        Promise.resolve()
            .then(() => route({ request, response, distDir, backend, log }))
            .catch(err => {
                log(`request error: ${err && err.message ? err.message : String(err)}`);
                if (response.headersSent) {
                    response.end();
                    return;
                }
                sendJson(response, 500, { error: err && err.message ? err.message : String(err) });
            });
    });

    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address();
    const origin = `http://127.0.0.1:${address.port}`;
    log(`serving ${distDir} at ${origin}`);

    return {
        origin,
        backend,
        close: () => new Promise((resolve, reject) => {
            server.close(err => err ? reject(err) : resolve());
        })
    };
}

function route({ request, response, distDir, backend, log }) {
    const url = new URL(request.url, 'http://127.0.0.1');
    if (url.pathname === '/api/health') {
        return sendJson(response, 200, { ok: true });
    }
    if (url.pathname.startsWith('/api/')) {
        return routeApi({ request, response, url, backend, log });
    }
    return serveStatic({ request, response, url, distDir });
}

async function routeApi({ request, response, url, backend, log }) {
    if (request.method === 'GET' && url.pathname === '/api/stats') {
        return sendJson(response, 200, backend.stats());
    }
    if (request.method === 'GET' && url.pathname === '/api/docs') {
        return sendJson(response, 200, { documents: backend.docs(url.searchParams.get('collection')) });
    }
    if (request.method !== 'POST') {
        return sendJson(response, 405, { error: 'method not allowed' });
    }

    let body;
    try {
        body = await readJsonBody(request);
    } catch (err) {
        return sendJson(response, 400, { error: err.message });
    }

    log(`api ${url.pathname} collection=${body.collection ?? '-'}`);

    if (url.pathname === '/api/pull') {
        backend.countAttempt('pull');
        if (backend.consumeFailure('pull')) {
            return sendJson(response, 500, { error: 'induced pull failure' });
        }
        return sendJson(response, 200, backend.pull(body));
    }
    if (url.pathname === '/api/push') {
        backend.countAttempt('push');
        /**
         * An induced failure happens before any row is applied, so a retried
         * request can never write a document twice.
         */
        if (backend.consumeFailure('push')) {
            return sendJson(response, 500, { error: 'induced push failure' });
        }
        return sendJson(response, 200, backend.push(body));
    }
    if (url.pathname === '/api/reset') {
        backend.reset(body.collection);
        return sendJson(response, 200, { ok: true });
    }

    return sendJson(response, 404, { error: 'unknown api route' });
}

function serveStatic({ request, response, url, distDir }) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        return sendJson(response, 405, { error: 'method not allowed' });
    }
    let pathname;
    try {
        pathname = decodeURIComponent(url.pathname);
    } catch (err) {
        return sendJson(response, 400, { error: 'invalid path' });
    }
    if (pathname === '/') {
        pathname = '/index.html';
    }

    const root = path.resolve(distDir);
    const filePath = path.resolve(root, '.' + pathname);
    if (filePath !== root && !filePath.startsWith(root + path.sep)) {
        return sendJson(response, 403, { error: 'forbidden' });
    }

    const serveFile = target => {
        const stat = fs.statSync(target);
        const extension = path.extname(target).toLowerCase();
        response.writeHead(200, {
            'Content-Type': MIME_TYPES[extension] || 'application/octet-stream',
            'Content-Length': stat.size,
            'Cache-Control': 'no-cache'
        });
        if (request.method === 'HEAD') {
            return response.end();
        }
        fs.createReadStream(target).pipe(response);
    };

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        return serveFile(filePath);
    }
    const shell = path.join(root, 'index.html');
    if (fs.existsSync(shell)) {
        return serveFile(shell);
    }
    return sendJson(response, 404, { error: 'not found' });
}

function readJsonBody(request) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let size = 0;
        request.on('data', chunk => {
            size += chunk.length;
            if (size > MAX_BODY_BYTES) {
                reject(new Error('request body too large'));
                request.destroy();
                return;
            }
            chunks.push(chunk);
        });
        request.on('end', () => {
            if (chunks.length === 0) {
                return resolve({});
            }
            try {
                resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
            } catch (err) {
                reject(new Error('invalid JSON body'));
            }
        });
        request.on('error', reject);
    });
}

/**
 * Stable deep equality for document states, ignoring key order.
 */
function docsEqual(a, b) {
    return stableStringify(a) === stableStringify(b);
}

function stableStringify(value) {
    if (value === null || typeof value !== 'object') {
        return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
        return '[' + value.map(stableStringify).join(',') + ']';
    }
    const keys = Object.keys(value).sort();
    return '{' + keys.map(key => JSON.stringify(key) + ':' + stableStringify(value[key])).join(',') + '}';
}

function sendJson(response, statusCode, payload) {
    const body = JSON.stringify(payload);
    response.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(body),
        'Cache-Control': 'no-store'
    });
    response.end(body);
}
