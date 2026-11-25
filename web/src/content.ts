/**
 * Landing copy, in Spanish (user decision logged in odd/tasks/project-website.md, S7).
 * Facts come from UPSTREAM.md, ROADMAP.md and package.json.
 */

export type NavLink = {
    readonly label: string;
    readonly href: string;
};

export const navLinks: readonly NavLink[] = [
    { label: 'Características', href: '#caracteristicas' },
    { label: 'Arquitectura', href: '#arquitectura' },
    { label: 'Documentación', href: '#documentacion' }
];

export const repoUrl = 'https://github.com/AngelCLA/cla-db';

export const hero = {
    badge: 'v0.1.1 npm / v0.1.2 candidata',
    titleLead: 'Tus datos,',
    titleAccent: 'local-first.',
    lede: 'La base de datos NoSQL reactiva para JavaScript y TypeScript. Trabaja sin conexión y supera el límite de 13 colecciones con CLA DB.',
    primaryCta: 'Empezar ahora',
    secondaryCta: 'Ver ejemplo',
    caption: 'CLA DB CORE // V0.1.1'
} as const;

export type StackItem = {
    readonly label: string;
    readonly short: string;
};

export const stackItems: readonly StackItem[] = [
    { label: 'JavaScript', short: 'JS' },
    { label: 'TypeScript', short: 'TS' },
    { label: 'RxJS', short: 'Rx' },
    { label: 'IndexedDB', short: 'IDB' }
];

export type Feature = {
    readonly icon: 'layers' | 'pulse' | 'overlap' | 'sync' | 'check' | 'code';
    readonly title: string;
    readonly text: string;
};

export const features: readonly Feature[] = [
    {
        icon: 'layers',
        title: 'Datos locales',
        text: 'Lee y guarda datos en el dispositivo, incluso sin conexión. La app sigue funcionando completa en el bar, en el campo o en un vuelo.'
    },
    {
        icon: 'pulse',
        title: 'Consultas reactivas',
        text: 'Suscríbete con .find().$ y actualiza la interfaz en tiempo real: cada inserción, actualización o sincronización re-emite el resultado.'
    },
    {
        icon: 'overlap',
        title: 'Más colecciones',
        text: 'Organiza clientes, ventas y abonos en colecciones separadas. CLA DB elimina el límite artificial de 13 colecciones del core abierto.'
    },
    {
        icon: 'sync',
        title: 'Replicación bidireccional',
        text: 'Sincroniza con tu backend existente mediante la Sync Engine: checkpoints, reintentos y resolución de conflictos incluidos.'
    },
    {
        icon: 'check',
        title: 'Persistencia verificada',
        text: 'La suite incluye hasta 100 colecciones, CRUD y migraciones. Las pruebas de persistencia usan fake-indexeddb en Node.js; no certifican durabilidad en navegadores reales.'
    },
    {
        icon: 'code',
        title: 'API de RxDB intacta',
        text: 'Fork mínimo con base RxDB 17.6.0: cambia los imports a @clatech/db, sin mezclar módulos de rxdb y CLA DB en el mismo bundle. ESM, CJS y tipos de TypeScript listos para usar.'
    }
];

export const architecture = {
    kicker: '// Arquitectura',
    title: 'Fork mínimo, marcado',
    paragraphs: [
        'CLA DB no reescribe RxDB. Es un fork Apache 2.0 con base RxDB 17.6.0 (9d5849cf) y correcciones posteriores integradas por merge. Conserva las interfaces públicas y la versión de compatibilidad 17.6.0; consulta la evidencia y sus límites en el README.',
        'Cada modificación del fork está aislada y marcada con comentarios // CLA-DB:, así que las futuras actualizaciones de upstream se aplican con fricción mínima. Las extensiones nuevas llegan como paquetes independientes, nunca dentro del core.',
        'Sin plugins propietarios, sin flags de licencia falsificados y sin history rewrites. Solo los cambios que el fork necesita, documentados en UPSTREAM.md y CLA_CHANGELOG.md.'
    ],
    deltaTitle: '// SUPERFICIE DE DELTA',
    delta: [
        'rx-collection.ts - remoción del límite COL23',
        'cla-db.test.ts - suite de verificación del fork',
        'package.json - identidad @clatech/db + metadatos',
        'scripts/* - versionado y verificación de consumidor',
        'docs del fork - README, ROADMAP, UPSTREAM',
        '.github/* - CI propio, sin publish automático'
    ]
} as const;

export const docs = {
    kicker: '// Documentación',
    title: 'Empieza en cinco minutos',
    lede: 'npm install @clatech/db rxjs instala la versión publicada 0.1.1. La candidata 0.1.2 solo está disponible como tarball de evaluación. El README enlaza la evidencia y distingue funciones heredadas, experimentales, planificadas y Premium no incluidas.',
    links: [
        { label: 'Quickstart de CLA DB (README)', href: `${repoUrl}/blob/master/README.md` },
        { label: 'API de RxDatabase (RxDB upstream)', href: 'https://rxdb.info/rx-database.html' },
        { label: 'Replicación y Sync Engine (RxDB upstream)', href: 'https://rxdb.info/replication.html' },
        { label: 'Roadmap del fork', href: `${repoUrl}/blob/master/ROADMAP.md` }
    ],
    codeFileName: 'app.ts'
} as const;

export const footer = {
    note: 'CLA DB es un fork de RxDB. RxDB es un proyecto de su mantenedor; este sitio no está afiliado a rxdb.info.',
    links: [
        { label: 'GitHub', href: repoUrl },
        { label: 'npm', href: 'https://www.npmjs.com/package/@clatech/db' },
        { label: 'Licencia Apache 2.0', href: 'https://github.com/AngelCLA/cla-db/blob/master/LICENSE.txt' }
    ]
} as const;
