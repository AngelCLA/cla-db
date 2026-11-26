/**
 * Verification for the landing site.
 * Run with: node --import tsx scripts/check-render.tsx   (from web/)
 *
 * Checks Spanish copy, CTA destinations, hero artwork structure and token
 * provenance. CSS checks supplement, but do not replace, browser visual proof.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { App } from '../src/App';
import { transformSync } from 'esbuild';
import { runInNewContext } from 'node:vm';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(here, '..');
const repoRoot = resolve(webRoot, '..');

const failures: string[] = [];

const check = (condition: boolean, message: string): void => {
    if (!condition) {
        failures.push(message);
    }
};

const html = renderToStaticMarkup(<App />);
const tokensCss = readFileSync(resolve(webRoot, 'src/styles/tokens.css'), 'utf8');
const documentShell = readFileSync(resolve(webRoot, 'index.html'), 'utf8');
check(documentShell.includes('lang="es"') && documentShell.includes('name="viewport"'), 'landing must declare Spanish and responsive viewport');
check(documentShell.includes('property="og:title"') && documentShell.includes('property="og:description"') && documentShell.includes('name="twitter:card"'), 'landing must provide social metadata');
check(html.includes('npm install @clatech/db rxjs') && html.includes('0.1.2') && html.includes('tarball de evaluación'), 'installation must distinguish published package and candidate preview');
const systemDoc = readFileSync(resolve(repoRoot, 'design/system.md'), 'utf8');

// 1. Section contract from the artboard.
const requiredCopy: readonly (readonly [string, string])[] = [
    ['header brand', 'CLA'],
    ['nav link', 'Características'],
    ['nav link', 'Arquitectura'],
    ['nav link', 'Documentación'],
    ['hero badge', 'v0.1.1'],
    ['hero title lead', 'Tus datos,'],
    ['hero title accent', 'local-first.'],
    ['hero lede', 'supera el límite de 13 colecciones'],
    ['hero cta', 'Empezar ahora'],
    ['hero cta', 'Ver ejemplo'],
    ['hero caption', 'CLA DB CORE // V0.1.1'],
    ['stack bar', 'STACK NATIVO'],
    ['stack item', 'JavaScript'],
    ['stack item', 'TypeScript'],
    ['stack item', 'RxJS'],
    ['stack item', 'IndexedDB'],
    ['features kicker', '// Características'],
    ['features title', 'Dentro del motor'],
    ['feature card', 'Datos locales'],
    ['feature card', 'Consultas reactivas'],
    ['feature card', 'Más colecciones'],
    ['feature card', 'Replicación bidireccional'],
    ['feature card', 'Persistencia verificada'],
    ['feature card', 'API de RxDB intacta'],
    ['architecture title', 'Fork mínimo, marcado'],
    ['architecture delta', 'remoción del límite COL23'],
    ['docs title', 'Empieza en cinco minutos'],
    ['docs link', 'Quickstart'],
    ['code sample', '@clatech/db'],
    ['footer note', 'no está afiliado a rxdb.info']
];

for (const [label, text] of requiredCopy) {
    check(html.includes(text), `missing ${label}: expected "${text}" in markup`);
}

const requiredAnchors = ['caracteristicas', 'arquitectura', 'documentacion'];
for (const id of requiredAnchors) {
    check(html.includes(`id="${id}"`), `missing section anchor #${id}`);
}

// The example CTA must land on the code sample, not the features section.
const exampleLinks = [...html.matchAll(/<a\b[^>]*href="#ejemplo"[^>]*>([\s\S]*?)<\/a>/g)];
check(exampleLinks.some(link => link[1].includes('Ver ejemplo')), 'Ver ejemplo must link to #ejemplo');
const exampleTargets = [...html.matchAll(/<div\b[^>]*id="ejemplo"[^>]*>([\s\S]*?)<\/pre>/g)];
check(exampleTargets.length === 1, 'the example must have exactly one #ejemplo destination');
check(exampleTargets.some(target => target[1].includes('app.ts') && target[1].includes('@clatech/db')), '#ejemplo must identify the app.ts code window');
check(/<a\b[^>]*href="#documentacion"[^>]*>[\s\S]*?Empezar ahora<\/a>/.test(html), 'Empezar ahora must keep linking to documentation');

// CLA-DB: run exactly the displayed code, not a separately maintained fixture.
const displayedCode = exampleTargets[0]?.[1].match(/<code[^>]*>([\s\S]*?)<\/code>/)?.[1]
    .replace(/<[^>]+>/g, '')
    .replace(/&#x27;/g, '\'')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&') ?? '';
try {
    const output = execFileSync(process.execPath, ['--import', 'fake-indexeddb/auto', '--input-type=module', '--eval', displayedCode], {
        cwd: repoRoot, encoding: 'utf8', timeout: 20000, stdio: 'pipe'
    });
    check(output.includes('Clientes: 1'), 'displayed example must emit its inserted customer through the reactive query');
} catch (error) {
    check(false, `displayed example must execute with simulated IndexedDB: ${String(error)}`);
}

// S10: compact technical sections retain the existing page and CTA contract.
const technicalSections = [
    ['offline-first', 'La venta sigue sin señal', ['Guarda la venta', 'Consulta lo local', 'Retoma la replicación']],
    ['sync-engine', 'Tu backend, conectado por protocolo', ['push', 'pull', 'checkpoints', 'conflictHandler', 'GraphQL', 'WebSocket', 'CouchDB', 'Supabase', 'no se conecta solo']],
    ['rxstorage', 'Elige dónde viven los datos', ['RxStorage', 'Dexie', 'IndexedDB', 'Memory', 'efímero', 'Node.js', 'FoundationDB', 'MongoDB', 'DenoKV', 'Remote']],
    ['modelo-reactivo', 'Del esquema a la pantalla', ['JSON Schema', 'Mango', 'RxJS', 'migrationStrategies']]
] as const;
let previousSection = html.indexOf('id="caracteristicas"');
for (const [id, title, terms] of technicalSections) {
    const section = html.match(new RegExp(`<section\\b[^>]*id="${id}"[^>]*>([\\s\\S]*?)<\\/section>`))?.[1] ?? '';
    check(new RegExp(`<h2\\b[^>]*>${title}`).test(section), `missing technical heading: ${title}`);
    for (const term of terms) {
        check(section.includes(term), `#${id} must explain ${term}`);
    }
    const position = html.indexOf(`id="${id}"`);
    check(position > previousSection && position < html.indexOf('id="arquitectura"'), `#${id} must follow features and precede architecture in order`);
    previousSection = position;
    check(new RegExp(`<a\\b[^>]*href="#${id}"[^>]*>[^<]+<\\/a>`).test(html), `missing visible navigation to #${id}`);
}
check(/<ol\b[\s\S]*?Guarda la venta[\s\S]*?Consulta lo local[\s\S]*?Retoma la replicación[\s\S]*?<\/ol>/.test(html), 'offline-first must have an ordered local-write, local-read, recovery flow');
for (const id of requiredAnchors) {
    check(html.includes(`href="#${id}"`), `existing navigation to #${id} must remain`);
}
const documentation = html.match(/<nav\b[^>]*aria-label="Documentación"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? '';
const documentationLinks = [...documentation.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
check(documentationLinks.length === 4, 'documentation must retain four meaningful links');
const expectedDocs = [
    'https://github.com/AngelCLA/cla-db/blob/master/README.md',
    'https://rxdb.info/rx-database.html',
    'https://rxdb.info/replication.html',
    'https://github.com/AngelCLA/cla-db/blob/master/ROADMAP.md'
];
for (const destination of expectedDocs) {
    check(documentationLinks.some(link => link[1] === destination), `missing documentation destination ${destination}`);
}
for (const [, href, label] of documentationLinks) {
    check(/^https:\/\//.test(href), `documentation href must be meaningful: ${href}`);
    if (href.startsWith('https://rxdb.info/')) {
        check(label.includes('upstream'), 'RxDB documentation links must be labeled upstream');
    }
}
check(html.includes('hasta 100 colecciones') && html.includes('persistencia') && html.includes('migraciones'), 'verification copy must distinguish collection coverage from persistence and migration checks');
check(html.includes('cambia los imports') && html.includes('sin mezclar módulos'), 'compatibility copy must explain package imports and the single-module constraint');

const illustrations = html.match(/role="img"/g) ?? [];
check(illustrations.length >= 1, 'missing the isometric illustration with role="img"');
check(html.includes('<html') === false, 'App must render a fragment, not a document');
check(!/lorem ipsum/i.test(html), 'markup must not contain placeholder text');

// Technical layout guardrails supplement semantic rendering checks.
const technicalCss = readFileSync(resolve(webRoot, 'src/components/TechnicalOverview.module.css'), 'utf8');
check(technicalCss.includes('@media (max-width: 60rem)') && technicalCss.includes('grid-template-columns: minmax(0, 1fr)'), 'technical columns must stack on narrow screens');
check(technicalCss.includes(':focus-visible'), 'technical navigation must retain keyboard focus styles');
check(!/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|font-family\s*:|animation\s*:|https?:|@import|url\(/.test(technicalCss), 'technical styles must reuse tokens without new colors, fonts, motion or assets');
for (const [, target] of html.matchAll(/<a\b[^>]*href="#([^"]*)"/g)) {
    check(target.length > 0 && html.includes(`id="${target}"`), `local navigation must resolve: #${target}`);
}

// Hero-specific structural guardrails. Browser geometry needs visual review.
const heroCss = readFileSync(resolve(webRoot, 'src/components/Hero.module.css'), 'utf8');
const illustrationCss = readFileSync(resolve(webRoot, 'src/components/CoreIllustration.module.css'), 'utf8');
check(heroCss.includes('system-ui') && heroCss.includes('sans-serif'), 'hero must use scoped system sans typography');
check(heroCss.includes('font-family: var(--font-family-base)'), 'hero badge and caption must retain mono typography');
check(heroCss.includes('@media (max-width:') && heroCss.includes('minmax(0, 1fr)'), 'hero must have a narrow-screen layout');
check(heroCss.includes(':focus-visible'), 'hero actions must retain visible keyboard focus');
check(!/animation\s*:/.test(illustrationCss), 'static artwork must not introduce motion');
check((html.match(/transform="matrix\(1 .5 -1 .5 260 /g) ?? []).length === 4, 'hero must render four isometric planes');
check(html.includes('id="claDbGrid"') && html.includes('id="claDbHatching"'), 'hero must render grid and vertical hatching patterns');
check(!/https?:|@import|url\(/.test(heroCss + illustrationCss), 'hero CSS must not load external assets');
for (const color of (heroCss + illustrationCss).match(/#[0-9a-fA-F]{3,8}\b/g) ?? []) {
    check(systemDoc.toLowerCase().includes(color.toLowerCase()), `hero color ${color} is not recorded in design/system.md`);
}

// 2. Token provenance: no color outside design/system.md.
const hexInTokens = new Set((tokensCss.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).map(value => value.toLowerCase()));
const systemLower = systemDoc.toLowerCase();

check(hexInTokens.size > 0, 'tokens.css declares no color tokens');

for (const hex of hexInTokens) {
    check(systemLower.includes(hex), `token color ${hex} is not recorded in design/system.md`);
}

const artboardOnlyColors = ['#ff2e9e', '#0b0709', '#14101a', '#241b2a'];
for (const hex of artboardOnlyColors) {
    check(!hexInTokens.has(hex), `artboard-only color ${hex} leaked into the project tokens`);
}

// Font family must come from the documented monospace stack.
check(tokensCss.includes('Atkinson Hyperlegible Mono'), 'base font family must follow design/system.md');
check(!/font-family:[^;]*Inter/i.test(tokensCss), 'artboard sans-serif font must not replace the system font');
check(!/box-shadow/i.test(tokensCss), 'design system records no shadow tokens');

// Radius values must stay inside the recorded set.
const radiusValues = new Set((tokensCss.match(/--radius-[a-z-]+:\s*([^;]+);/g) ?? []).map(line => line.split(':')[1].replace(';', '').trim()));
for (const value of radiusValues) {
    check(['0px', '4px', '8px', '10px'].includes(value), `radius ${value} is not one of the recorded radii (0px, 4px, 8px, 10px)`);
}

// CLA-DB: exercise the public tracking callback with browser APIs intercepted.
// No requests are sent. Consent must not re-enable inherited conversions.
const trackingSource = readFileSync(resolve(repoRoot, 'docs-src/src/components/trigger-event.tsx'), 'utf8');
const trackingCode = transformSync(trackingSource, { loader: 'tsx', format: 'cjs' }).code;
for (const canUseDOM of [true, false]) {
    for (const beacon of [true, false]) {
        const requests: unknown[] = [];
        const stored = new Map<string, string>([['click_id', JSON.stringify({ k: 'gclid', v: 'probe', t: Date.now() })]]);
        const before = JSON.stringify([...stored]);
        const storage = {
            getItem: (key: string) => stored.get(key) ?? null,
            setItem: (key: string, value: string) => {
                stored.set(key, value);
            },
            removeItem: (key: string) => {
                stored.delete(key);
            }
        };
        const module = { exports: {} as Record<string, (...args: any[]) => void> };
        runInNewContext(trackingCode, {
            module, exports: module.exports,
            require: (id: string) => {
                if (id === 'react') return { useEffect: (effect: () => void) => effect() };
                if (id === '@docusaurus/ExecutionEnvironment') return { canUseDOM };
                if (id === '../theme/eu-consent') return { isLikelyEuUser: () => false };
                throw new Error(`Unexpected tracking dependency ${id}`);
            },
            window: { location: { hostname: 'db.claangel.site' }, gtag: (...args: unknown[]) => requests.push(args), rdt: (...args: unknown[]) => requests.push(args) },
            document: { cookie: '' }, location: { search: '' },
            navigator: beacon ? { sendBeacon: (...args: unknown[]) => requests.push(args) } : {},
            fetch: (...args: unknown[]) => {
                requests.push(args);
                return Promise.resolve();
            },
            localStorage: storage, sessionStorage: storage, URLSearchParams, console: { log() {}, dir() {} }
        });
        module.exports.setTrackingConsent(true);
        module.exports.triggerTrackingEvent('cla_probe', 1, 5, 'Lead');
        module.exports.onCopy();
        check(requests.length === 0, `CLA docs must not send conversion/analytics requests (DOM=${canUseDOM}, beacon=${beacon}); observed ${requests.length}`);
        check(JSON.stringify([...stored]) === before, 'disabled tracking must not change stored identifiers or event counters');
    }
}

if (failures.length > 0) {
    console.error(`FAIL (${failures.length})`);
    for (const failure of failures) {
        console.error(` - ${failure}`);
    }
    process.exit(1);
}

console.log(`PASS: ${requiredCopy.length} copy checks, ${requiredAnchors.length} preserved anchors, ${technicalSections.length} technical sections, ${documentationLinks.length} documentation links, ${hexInTokens.size} color tokens verified against design/system.md`);
