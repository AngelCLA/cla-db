/**
 * Verification for the landing site.
 * Run with: node --import tsx scripts/check-render.tsx   (from web/)
 *
 * Checks Spanish copy, CTA destinations, hero artwork structure and token
 * provenance. CSS checks supplement, but do not replace, browser visual proof.
 */
import type { PackageManagerId } from '../src/install';
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
check(html.includes('npm install @clatech/db rxjs') && html.includes('La versión 0.1.3 está publicada en npm como latest.'), 'installation must identify 0.1.3 as the published npm latest');
const systemDoc = readFileSync(resolve(repoRoot, 'design/system.md'), 'utf8');

// 1. Section contract from the artboard.
const requiredCopy: readonly (readonly [string, string])[] = [
    ['header brand', 'CLA'],
    ['nav link', 'Características'],
    ['nav link', 'Arquitectura'],
    ['nav link', 'Documentación'],
    ['hero badge', 'v0.1.3'],
    ['hero title lead', 'Tus datos,'],
    ['hero title accent', 'local-first.'],
    ['hero lede', 'supera el límite de 13 colecciones'],
    ['hero cta', 'Empezar ahora'],
    ['hero cta', 'Ver ejemplo'],
    ['hero caption', 'CLA DB CORE // V0.1.3'],
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

// Install selector (S11): user-facing commands for the single npm package.
type InstallModule = typeof import('../src/install');
const installModule: InstallModule | null = await import('../src/install').catch(() => null);
check(installModule !== null, 'install selector logic must live in web/src/install.ts');
const installTargets = installModule?.installTargets ?? [];
const expectedCommands: readonly (readonly [PackageManagerId, string])[] = [
    ['npm', 'npm install @clatech/db rxjs'],
    ['pnpm', 'pnpm add @clatech/db rxjs'],
    ['bun', 'bun add @clatech/db rxjs'],
    ['yarn', 'yarn add @clatech/db rxjs'],
    ['deno', 'deno add npm:@clatech/db npm:rxjs']
];
check(
    installTargets.map(target => target.id).join(',') === expectedCommands.map(([id]) => id).join(','),
    'install targets must be exactly npm, pnpm, bun, yarn and deno in that order'
);
for (const [id, command] of expectedCommands) {
    const target = installTargets.find(candidate => candidate.id === id);
    check(target?.command === command, `install command for ${id} must be exactly "${command}"`);
    check(Boolean(target?.label.trim()), `install target ${id} must have a visible label`);
    check(Boolean(target?.note.trim()), `install target ${id} must explain its boundary`);
}
const unverifiedClaims = ['verificado', 'certificado', 'soportado oficialmente'];
for (const target of installTargets) {
    check(target.command.includes('@clatech/db') && target.command.includes('rxjs'), `install command for ${target.id} must use the single npm package and rxjs`);
    check(!unverifiedClaims.some(claim => target.note.includes(claim)), `install note for ${target.id} must not claim unverified support`);
}
check(installModule?.defaultInstallTargetId === 'npm', 'npm must stay the default install target');

// Keyboard behaviour of the tablist, exercised through the shared logic.
const nextInstallTargetId = installModule?.nextInstallTargetId;
check(Boolean(nextInstallTargetId), 'install selector must expose keyboard navigation logic');
if (nextInstallTargetId) {
    const keyboardCases: readonly (readonly [PackageManagerId, string, PackageManagerId | null])[] = [
        ['npm', 'ArrowRight', 'pnpm'],
        ['deno', 'ArrowRight', 'npm'],
        ['npm', 'ArrowLeft', 'deno'],
        ['yarn', 'Home', 'npm'],
        ['yarn', 'End', 'deno'],
        ['pnpm', 'Tab', null],
        ['pnpm', 'Enter', null],
        ['pnpm', ' ', null],
        ['pnpm', 'a', null]
    ];
    for (const [id, key, expected] of keyboardCases) {
        check(nextInstallTargetId(id, key) === expected, `key ${key} on ${id} must move selection to ${String(expected)}`);
    }
    check(nextInstallTargetId('unknown' as PackageManagerId, 'ArrowRight') === null, 'an unknown selected id must not move selection');
}

// Copy behaviour: the control copies the command of the selected target.
const copyInstallCommand = installModule?.copyInstallCommand;
check(Boolean(copyInstallCommand), 'install selector must expose a command copy action');
if (copyInstallCommand) {
    const written: string[] = [];
    const outcome = await copyInstallCommand('pnpm', {
        writeText(text: string) {
            written.push(text);
            return Promise.resolve();
        }
    });
    check(outcome === 'copied', `copying the selected command must report "copied"; observed ${outcome}`);
    check(written.length === 1 && written[0] === expectedCommands[1][1], `copy must write the selected command exactly once; observed ${JSON.stringify(written)}`);
    const missing = await copyInstallCommand('bun', undefined);
    check(missing === 'unavailable', `copy without a clipboard API must report "unavailable"; observed ${missing}`);
    const denied = await copyInstallCommand('bun', { writeText: () => Promise.reject(new Error('denied')) });
    check(denied === 'failed', `a rejected clipboard write must report "failed"; observed ${denied}`);
}

// Rendered selector contract: real buttons, roving tabindex, labelled panel.
const installSection = html.match(/<section\b[^>]*id="instalacion"[^>]*>([\s\S]*?)<\/section>/)?.[1] ?? '';
check(installSection.length > 0, 'missing #instalacion install section');
check(/<div\b(?=[^>]*role="tablist")(?=[^>]*aria-label="Gestor de paquetes")[^>]*>/.test(installSection), 'install selector must expose a labelled tablist');
const installTabs = [...installSection.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)];
const tabButtons = installTabs.filter(tab => /role="tab"/.test(tab[1]));
check(tabButtons.length === expectedCommands.length, `install tablist must render ${expectedCommands.length} tabs; observed ${tabButtons.length}`);
check(/<button\b(?=[^>]*type="button")/.test(installSection), 'install selector controls must be real buttons');
const selectedTabs = tabButtons.filter(tab => /aria-selected="true"/.test(tab[1]));
check(selectedTabs.length === 1, 'exactly one install tab must be selected');
check(selectedTabs[0]?.[0].includes('npm') ?? false, 'the selected install tab must be npm');
check(!/tabindex="-1"|tabIndex="-1"/.test(selectedTabs[0]?.[1] ?? ''), 'the selected tab must stay in the tab order');
for (const tab of tabButtons) {
    check(/aria-controls="install-panel-[a-z]+"/.test(tab[1]), 'every install tab must control a panel');
    check(/id="install-tab-[a-z]+"/.test(tab[1]), 'every install tab must carry a stable id');
}
check(tabButtons.filter(tab => !/aria-selected="true"/.test(tab[1])).every(tab => /tabindex="-1"/.test(tab[1])), 'unselected install tabs must be removed from the tab order');
const installPanel = installSection.match(/<div\b([^>]*role="tabpanel"[^>]*)>([\s\S]*?)<\/div>/);
check(installPanel !== null, 'install selector must render a tabpanel');
check(/aria-labelledby="install-tab-npm"/.test(installPanel?.[1] ?? '') && /id="install-panel-npm"/.test(installPanel?.[1] ?? ''), 'the rendered panel must be labelled by its tab and named by the tab aria-controls');
check((installPanel?.[2] ?? '').includes(expectedCommands[0][1]), 'the rendered panel must show the npm install command');
check(/role="status"/.test(installSection) || /aria-live="polite"/.test(installSection), 'copy feedback must be announced politely');
check(installSection.includes('Copiar'), 'install selector must offer a copy control');
check(!/<form\b/.test(installSection), 'install selector must not submit forms');

// Version state: verified on the registry before correcting the copy.
for (const stale of ['v0.1.1', 'V0.1.1', 'v0.1.2', 'V0.1.2']) {
    check(!html.includes(stale), `landing must not advertise the outdated ${stale} version`);
}
check(!html.includes('sin publicar') && !html.includes('candidata 0.1.3'), 'the published 0.1.3 must not be described as unpublished');
check(html.includes('0.1.3 está publicada en npm como latest'), 'installation copy must state the published version and latest tag');
for (const overclaim of ['verificado en pnpm', 'verificado en Bun', 'verificado en Yarn', 'verificado en Deno', 'soportado en todos']) {
    check(!html.includes(overclaim), `install copy must not claim unverified support: ${overclaim}`);
}

let installCss = '';
try {
    installCss = readFileSync(resolve(webRoot, 'src/components/Install.module.css'), 'utf8');
} catch {
    check(false, 'install selector styles must live in web/src/components/Install.module.css');
}
check(installCss.includes(':focus-visible'), 'install selector must keep visible keyboard focus styles');
check(installCss.includes('@media (max-width: 60rem)'), 'install selector must have a narrow-screen layout');
check(!/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|font-family\s*:|animation\s*:|https?:|@import|url\(/.test(installCss), 'install selector styles must reuse tokens without new colors, fonts, motion or assets');

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

console.log(`PASS: ${requiredCopy.length} copy checks, ${requiredAnchors.length} preserved anchors, ${technicalSections.length} technical sections, ${documentationLinks.length} documentation links, ${tabButtons.length} install tabs and ${installTargets.length} install commands, ${hexInTokens.size} color tokens verified against design/system.md`);
