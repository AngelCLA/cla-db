import assert from 'node:assert/strict';

const base = process.argv[2];
assert(base, 'Usage: npm run check:routes -- <preview-origin>');
const origin = new URL(base).origin;

async function get(path, mime) {
    const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(10_000) });
    assert.equal(response.status, 200, `${path} must return HTTP 200`);
    assert.equal(new URL(response.url).origin, origin, `${path} must stay on the preview origin`);
    const contentType = response.headers.get('content-type') ?? '';
    assert.match(contentType, mime, `${path} must have the expected content type`);
    return response.text();
}

const htmlType = /^text\/html\b/;
const docs = await get('/docs', htmlType);
assert.match(docs, /<title>Documentación de CLA DB<\/title>/, '/docs must serve its own HTML, not the landing shell');
const entry = docs.match(/<script\b[^>]*type="module"[^>]*src="([^"]+)"/)?.[1];
assert(entry, '/docs must load its production entry');
assert.match(await get(entry, /^(?:application|text)\/(?:javascript|ecmascript)\b/), /Quickstart/, 'the entry must contain the docs page');
const stylesheet = docs.match(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/)?.[1];
assert(stylesheet, '/docs must load a stylesheet');
await get(stylesheet, /^text\/css\b/);
assert.match(await get('/licenses/rxdb-apache-2.0.txt', /^text\/plain\b/), /Apache License\s+Version 2\.0/);
assert.match(await get('/', htmlType), /<meta property="og:description" content="[^"\n]*0\.1\.3/, 'the landing must still serve its own HTML with current metadata');
console.log(`PASS: direct /docs, its production assets and license, and the landing at ${origin}`);
