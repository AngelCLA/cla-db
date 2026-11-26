# CLA DB 0.1.2 Site And Consumer Documentation Evidence

**The local landing and documentation production builds succeeded.** This is T4 evidence, not approval to publish or deploy. npm latest remains `0.1.1`; `0.1.2` is a candidate tarball preview. No performance, complete platform-support, zero-telemetry, or release-readiness claim follows from these checks.

## Responsibilities And Scope

| Surface | Responsibility | Boundary |
| --- | --- | --- |
| `web/` | Official CLA Tech landing, neutral Spanish | Consumer entry point and links, not a second API reference |
| `docs-src/` | Inherited technical documentation and API reference | Includes upstream experimental, commercial, and Premium material not shipped as CLA functionality |
| Root README | English consumer installation and runnable examples | Registry first, candidate preview separate, evidence linked |
| Generated `/docs` | Generated documentation only | Never edited by this unit |

CLA Tech identity, colors, typography, illustration, existing navigation, and Docusaurus SVG favicon are preserved. The landing's HTML had no explicit favicon declaration; none was invented. No social image asset was invented. Summary-card/Open Graph text was added to the landing. Docusaurus emits Open Graph title/description; its own social image remains pending. No visual redesign, cloud deployment, or publication was performed.

## Behavior-Level Reproductions

### Inherited Conversions

The public `triggerTrackingEvent()` path was still called by legacy pages even though Root no longer loaded the old analytics stack. It had no hostname guard. The regression in `web/scripts/check-render.tsx` mocks browser APIs and calls the exported event function and copy callback with consent enabled.

- RED: `npm --prefix web run check`, exit **1**, four failures. Each browser case (beacon or fetch fallback) recorded eight outgoing callback calls and storage mutations. The count includes mocked worker, gtag, and Reddit calls, not eight traced HTTP requests.
- GREEN: same command, exit **0**, after an early CLA-site gate. No outgoing callback calls or identifier/counter mutations, including SSR. Inert inherited implementation remains; links and click handlers were not rewritten.
- Preservation: an isolated intercepted viewer probe called `trackFirstViewerOpen()` twice per hostname. It observed zero beacons on `db.claangel.site` and localhost, and one capped beacon on rxdb.info under non-EU conditions. This explicit viewer tool was not changed.

### Displayed Landing Example

The new public check extracts text from the rendered `#ejemplo` code element, decodes HTML entities, and executes that exact module with Node.js and `fake-indexeddb/auto` against existing built package outputs.

- RED: `npm --prefix web run check`, exit **1**, `SyntaxError: missing ) after argument list` at `name: 'clientes'`. The displayed `createRxDatabase(` lacked `{`; imports, schema, and render implementation were also missing.
- GREEN: same command, exit **0**, after adding the missing imports/schema, correcting the object argument, using a repeatable upsert, printing the reactive result, unsubscribing, and awaiting close. The test asserts `Clientes: 1` and requires child exit 0 within 20 seconds.
- The component retains the existing token renderer, code window, anchors, and CSS. It now shows a longer self-contained example; browser geometry and real IndexedDB are not proven by the Node check.

## Isolated Installed Consumer

The following exact command was run from the repository after the repair. It packs current built outputs, installs into a fresh system temp tree, extracts all five README JS/TS blocks and the actual rendered landing snippet, then compiles/runs them. It does not publish, rebuild core, or use repository module resolution for consumer execution. Child `NODE_PATH`/`NODE_OPTIONS` are cleared. The package, npm cache, and scratch files are removed in `finally`.

```bash
TSX_TSCONFIG_PATH=web/tsconfig.json node --import ./web/scripts/register-css-stub.mjs --import tsx --input-type=module <<'NODE'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { App } from './web/src/App.tsx';
const html = renderToStaticMarkup(createElement(App));
const section = html.match(/<div\b[^>]*id="ejemplo"[^>]*>([\s\S]*?)<\/pre>/)[1];
const displayed = section.match(/<code[^>]*>([\s\S]*?)<\/code>/)[1]
    .replace(/<[^>]+>/g, '').replace(/&#x27;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const temp = mkdtempSync(join(tmpdir(), 'cla-readme-'));
const run = (command, args) => execFileSync(command, args, {
    cwd: temp, encoding: 'utf8', stdio: 'pipe', timeout: 180000,
    env: { ...process.env, NODE_PATH: '', NODE_OPTIONS: '' }
});
try {
    const pack = JSON.parse(execFileSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', temp], { encoding: 'utf8' }))[0];
    writeFileSync(join(temp, 'package.json'), JSON.stringify({ type: 'module', private: true }));
    console.log(run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--cache', join(temp, 'cache'), join(temp, pack.filename), 'rxjs@7.8.2', 'typescript@6.0.3', 'fake-indexeddb@6.2.8']));
    const blocks = [...readFileSync('README.md', 'utf8').matchAll(/```(js|ts)\n([\s\S]*?)```/g)].map(match => match[2]);
    assert.equal(blocks.length, 5);
    for (const [i, name] of ['database.js', 'quickstart.mjs', 'typed.mts', 'persistent.mjs', 'replication.mjs'].entries()) writeFileSync(join(temp, name), blocks[i]);
    const js = run('node', ['quickstart.mjs']);
    assert.ok(js.includes('Customers: 1') && js.includes('Alice'));
    console.log('JS/reactive: PASS');
    run('node', ['node_modules/typescript/bin/tsc', '--module', 'NodeNext', '--target', 'ES2022', '--skipLibCheck', 'typed.mts']);
    assert.equal(run('node', ['typed.mjs']).trim(), 'Bob');
    console.log('TS compile/runtime: PASS');
    assert.ok(run('node', ['--import', 'fake-indexeddb/auto', 'persistent.mjs']).includes('Saved customer'));
    console.log('Persistent (fake IndexedDB): PASS');
    assert.ok(run('node', ['replication.mjs']).includes('Remote\ntrue'));
    console.log('Custom replication: PASS');
    writeFileSync(join(temp, 'landing.mjs'), displayed);
    assert.ok(run('node', ['--import', 'fake-indexeddb/auto', 'landing.mjs']).includes('Clientes: 1'));
    console.log('Rendered landing snippet: Clientes: 1; PASS');
    console.log('PASS: README and rendered landing in installed consumer', pack.filename);
} finally {
    rmSync(temp, { recursive: true, force: true });
}
NODE
```

Observed exit **0**: 77 packages installed; JS/reactive, TS compile/runtime, persistent fake IndexedDB, custom replication, and rendered landing all PASS; artifact `clatech-db-0.1.2.tgz`. An earlier invocation without `TSX_TSCONFIG_PATH=web/tsconfig.json` exited 1 with `React is not defined` while loading JSX, before creating the temp tree. One runner correction selected the existing web TS config; no source workaround or dependency mutation was made.

The original five README examples also passed before this repair. No real browser, filesystem durability, live backend, multi-client conflict protocol, or full TypeScript API coverage is claimed. The demonstration replication master is explicitly single-client and non-production.

## Site Build And Integration Evidence

- `npm --prefix web run check`: exit **0** after both behavior fixes. Retains 30 copy checks, three section anchors, four technical sections, four documentation links, and 16 design-system color tokens. Adds installation/candidate and social metadata checks plus actual displayed-module execution.
- `npm --prefix web run build`: exit **0** before the repair and on resumption after the snippet repair. The latter transformed 38 modules and emitted a 243.24 kB JS bundle (76.22 kB gzip). TypeScript and Vite production build, no dependency changes.
- `npm run docs:build`: previously observed exit **0** after the last Docusaurus-source edits. Not repeated on resumption because those sources did not change. Full git history was already available (no fetch), 15 thumbnails were cached (zero downloads), and the standalone viewer was rebuilt. Docusaurus generated static files in `docs-src/build`.
- `npm run lint`: initial T4 run exited 1 for six brace-style errors in the new conversion probe; one correction and rerun exited **0**. The earlier T2 distribution-file lint advisory was already resolved by joint job-3. Final T4 lint is reported below.
- Changelog JSON matched `orga/changelog/schema.json` using Ajv. Original license and RxDB changelog were not edited. T2's NOTICE inventory is recorded in [PACKAGE.md](./PACKAGE.md); third-party license/security totals remain T5/T6-owned.

Docusaurus's passing build still warned about inherited anchors: `/alternatives.html` to `/#reviews`; Angular IndexedDB localStorage/IndexedDB headings; db-viewer framework headings; install bundler headings; React Native CLI/Expo headings; reactivity framework headings; MongoDB shell/Docker/Atlas headings; SQLite trial/Premium headings. It also warned about SWC with a Babel config and an 803-character inherited article description. These are not silently treated as fixed, and denied source pages/configuration were not changed to suppress warnings.

A separate emitted-output probe inspected 603 docs HTML/JS files and two landing HTML/JS files, excluding maps. The conversion-worker URL remained only in `docs-src/build/db-viewer/index.html`. The docs homepage's install command, candidate metadata, Open Graph title/description, and existing SVG favicon were asserted. No external script/iframe sources or conversion-worker URL appeared in `web/dist` at that inspection. This is not a claim that string scanning detects every possible request.

### Residual Exposure

| Built artifact | Actual retained integration | Disposition |
| --- | --- | --- |
| `docs-src/build/db-viewer/index.html` | Conversion worker URL in viewer code | Explicit viewer tool unchanged; guarded to upstream hostnames; not a guarantee about a remotely hosted viewer |
| `docs-src/build/files/smartphone/index.html` | iframe `http://0.0.0.0:4200/` | Inherited demo artifact, not a production CLA backend; broken/mixed-content exposure possible |
| `docs-src/build/releases/17.0.0.html` | iframe `https://www.linkedin.com/embed/feed/update/urn:li:share:7434623645857046528?collapsed=1` | Third-party automatic embed on that page; its traffic/tracking was not audited |

The latter two source surfaces are not authorized for editing. They remain a **deployment review gap**, not grounds for a zero-telemetry statement. Other inherited forms, redirects, images, links, and dynamically built integrations may remain. See [NETWORK_AUDIT.md](./NETWORK_AUDIT.md). No deployed browser packet trace was performed.

## Functional And Structural Fallback

- Prose has no meaningful RED. Source cross-checks, exact runnable examples, schema validation, metadata assertions, and builds provide ordinary verification instead.
- All local landing hash links resolve in rendered markup. Four documentation destinations remain exact and upstream links are labeled. External HTTP availability and every legacy documentation URL were not tested.
- Spanish language and viewport metadata, semantic headings/navigation, image role, focus-visible styles, and narrow-screen CSS guardrails are checked. These do not replace screen-reader, keyboard, contrast, or mobile-browser testing. No new CSS or branding asset was introduced.
- S1: unrelated `.aiexclude` and ODD edits preserved. S3: merged ancestry and four notable fixes documented separately from fork changes. S4: candidate versus registry and storage version distinguished; T3 compatibility limits linked. S8: consumer examples run, SQLite limits sourced. S9: site responsibilities, metadata, conversions, builds, and residual exposure recorded. S11: license/history/attribution preserved, final license inventory deferred. S12: only observed commands claimed, final suite remains T6. S15: roadmap and fork changelog updated without replacing original RxDB history.

## Final Resumption Checks

Final command outcomes are recorded in the implementation handoff. The first resumption lint found eight single-quote style errors in the snippet/probe; one correction escaped embedded quotes without changing the displayed code. Required landing checks/build, lint, and scoped diff checks are rerun after that correction. Docusaurus was not repeated, nor were the full core build, types, typings, circular, memory/Dexie suites, or standard packed-consumer suite. Those release-wide checks remain T6-owned. No staging, commit, publication, deployment, or remote mutation occurred.
