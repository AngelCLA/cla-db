// CLA-DB: verify the internal documentation contract and execute its displayed examples.
// From web/: node --import ./scripts/register-css-stub.mjs --import tsx scripts/check-docs.tsx
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { DocumentationPage } from '../src/docs/DocumentationPage';

const html = renderToStaticMarkup(<DocumentationPage />);
assert.equal((html.match(/<h1\b/g) ?? []).length, 1, 'documentation must have one real H1');
assert.match(html, /<main\b/, 'documentation must expose its main content landmark');
assert.match(html, /<h3 id="dexie">Dexie<\/h3>/, 'direct #dexie links must target the storage heading');
assert.ok(!/<header\b|<footer\b/.test(html), 'the parent owns the site header and footer');
const sidebar = html.match(/<nav\b[^>]*aria-label="En esta guía"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? '';
const destinations = ['instalacion', 'quickstart', 'esquemas', 'colecciones', 'consultas', 'almacenamiento', 'compatibilidad', 'referencias'];
assert.deepEqual([...sidebar.matchAll(/href="#([^"]+)"/g)].map(match => match[1]), destinations);
for (const id of destinations) {
    assert.equal((html.match(new RegExp(`id="${id}"`, 'g')) ?? []).length, 1, `unique destination #${id}`);
    assert.match(html, new RegExp(`<section\\b[^>]*id="${id}"[^>]*>[\\s\\S]*?<h2\\b`), `heading for #${id}`);
}
for (const path of ['README.md', 'release/0.1.3/COMPATIBILITY.md', 'LICENSE.txt']) {
    assert.ok(html.includes(`https://github.com/AngelCLA/cla-db/blob/master/${path}`), `exact repository link: ${path}`);
}
assert.ok(html.includes('href="/licenses/rxdb-apache-2.0.txt"'), 'link the locally served original Apache license');
assert.ok(html.includes('npm install @clatech/db rxjs') && html.includes('^7.8.2'), 'install the required peer dependency alongside CLA DB');
for (const term of ['peer dependency', '13 colecciones', 'Apache', 'Daniel Meyer', 'Premium', 'Bun', 'Deno', 'no persiste', 'IndexedDB']) {
    assert.ok(html.includes(term), `documentation must explain ${term}`);
}
assert.ok(!/from (?:&#x27;|&quot;)rxdb/.test(html), 'examples must use CLA DB imports');
const decode = (text: string) => text.replace(/&#x27;/g, '\'').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
for (const [id, output] of [['quickstart-code', 'Clientes: 1\nAlice\n'], ['dexie-code', 'Cliente guardado\n']]) {
    const encoded = html.match(new RegExp(`<pre\\b[^>]*id="${id}"[^>]*><code>([\\s\\S]*?)<\\/code><\\/pre>`))?.[1];
    assert.ok(encoded, `displayed runnable example ${id}`);
    const code = decode(encoded);
    const args = id === 'dexie-code' ? ['--import', 'fake-indexeddb/auto'] : [];
    const result = spawnSync(process.execPath, [...args, '--input-type=module', '--eval', code], {
        cwd: repoRoot, encoding: 'utf8', timeout: 20000, stdio: 'pipe'
    });
    assert.ifError(result.error);
    assert.equal(result.status, 0, `${id} must exit successfully: ${result.stderr}`);
    if (id === 'dexie-code') {
        assert.match(result.stderr, /^-+ RxDB Open Core RxStorage -+\nYou are using the free Dexie\.js based RxStorage implementation from RxDB [\s\S]+\n-+\n$/, 'Dexie must retain its upstream notice');
    } else {
        assert.equal(result.stderr, '', `${id} must not emit diagnostics`);
    }
    assert.equal(result.stdout, output, `${id} must produce its documented output`);
}
const css = readFileSync(new URL('../src/docs/DocumentationPage.module.css', import.meta.url), 'utf8');
assert.ok(css.includes('@media (max-width: 60rem)') && css.includes('grid-template-columns: minmax(0, 1fr)'), 'sidebar must stack on narrow screens');
assert.ok(css.includes(':focus-visible') && css.includes('scroll-margin-top'), 'keyboard focus and anchor offsets must remain visible');
assert.ok(!/#[0-9a-fA-F]{3,8}\b|rgba?\(|font-family\s*:|https?:|@import|url\(/.test(css), 'documentation must reuse landing tokens');
console.log('Documentation checks passed (Memory and simulated Dexie examples).');
