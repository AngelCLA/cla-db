/**
 * CLA-DB: Detached compatibility lanes.
 *
 * A lane is one package manager plus one runtime plus one node_modules layout.
 * The runner never shares a consumer directory between lanes, so Bun as a
 * package manager (runtime Node.js) and Bun as a runtime are separate results.
 */
import path from 'node:path';

export const PROBE_LIBRARY = {
    'package-layout': {
        description: 'Installed package metadata and exports equal the verified artifact.'
    },
    'rxjs-peer': {
        fixture: 'peer.mjs',
        description: 'RxJS peer resolution and a single RxJS copy.'
    },
    esm: {
        fixture: 'esm.mjs',
        description: 'ESM imports, RxJS, Memory Storage, CRUD and a reactive query.'
    },
    commonjs: {
        fixture: 'commonjs.cjs',
        description: 'CommonJS require() of the core and a storage plugin.'
    },
    collections: {
        fixture: 'collections.mjs',
        description: '14, 20, 50 and 100 simultaneous collections.'
    },
    'replication-lifecycle': {
        fixture: 'replication-lifecycle.mjs',
        description: 'Bidirectional handler replication, conflict resolution, pause/resume and close.'
    },
    cleanup: {
        fixture: 'cleanup.mjs',
        description: 'Database removal releases tracked open collections.'
    },
    integrations: {
        fixture: 'verify-integrations.mjs',
        reused: true,
        dependencies: ['dexie', 'fake-indexeddb'],
        description: 'Schema migration, Dexie-simulated IndexedDB, custom replication and CRUD.'
    },
    vite: {
        fixture: 'verify-vite.mjs',
        reused: true,
        dependencies: ['dexie', 'vite'],
        description: 'Vite browser bundle resolution of the public exports.'
    },
    'typescript-nodenext': {
        typescriptProject: 'typescript/tsconfig.nodenext.json',
        dependencies: ['typescript'],
        description: 'TypeScript NodeNext declaration resolution.'
    },
    'typescript-bundler': {
        typescriptProject: 'typescript/tsconfig.bundler.json',
        dependencies: ['typescript'],
        description: 'TypeScript Bundler declaration resolution.'
    },
    'typescript-native': {
        fixture: 'typescript/check-native.ts',
        description: 'TypeScript executed directly by the Bun runtime.'
    },
    denokv: {
        fixture: 'denokv.mjs',
        denoFlags: ['--unstable-kv'],
        description: 'Deprecated DenoKV storage smoke against an in-memory DenoKV instance.'
    }
};

const FULL_NODE_LANE = [
    'rxjs-peer',
    'esm',
    'commonjs',
    'typescript-nodenext',
    'typescript-bundler',
    'vite',
    'integrations',
    'replication-lifecycle',
    'collections',
    'cleanup'
];

const LEGACY_SKIPS = {
    'typescript-nodenext': 'Outside the Node 20.0.0 floor smoke; declaration resolution runs on the maintained Node lanes.',
    'typescript-bundler': 'Outside the Node 20.0.0 floor smoke; declaration resolution runs on the maintained Node lanes.',
    vite: 'Vite 6 requires a newer Node.js line than the declared 20.0.0 floor, so its bundle check is not part of this smoke.',
    integrations: 'Dexie-simulated IndexedDB and migrations run on the maintained Node lanes, not in the floor smoke.',
    'replication-lifecycle': 'Replication lifecycle coverage runs on the maintained Node lanes, not in the floor smoke.',
    collections: 'Collection-count coverage runs on the maintained Node lanes, not in the floor smoke.',
    cleanup: 'Resource cleanup coverage runs on the maintained Node lanes, not in the floor smoke.'
};

const BUN_RUNTIME_SKIPS = {
    'typescript-nodenext': 'Declaration resolution is asserted on the Node lanes; the Bun runtime lane executes TypeScript directly.',
    'typescript-bundler': 'Declaration resolution is asserted on the Node lanes; the Bun runtime lane executes TypeScript directly.',
    vite: 'Vite builds are asserted on the Node lanes; Bun bundler compatibility is not part of this lane.'
};

const DENO_SKIPS = {
    'rxjs-peer': 'Single-copy peer resolution is a node_modules assertion; the Deno lane checks RxJS through the ESM fixture.',
    integrations: 'Dexie-simulated IndexedDB is not part of the Deno lane; the lane uses Memory Storage.',
    vite: 'Vite builds are asserted on the Node lanes.',
    'typescript-nodenext': 'TypeScript declaration resolution is asserted on the Node lanes.',
    'typescript-bundler': 'TypeScript declaration resolution is asserted on the Node lanes.',
    'typescript-native': 'Bun-only TypeScript execution.'
};

export const LANES = [
    {
        id: 'npm-node',
        packageManager: 'npm',
        runtime: 'node',
        linker: 'node-modules',
        run: FULL_NODE_LANE
    },
    {
        id: 'npm-legacy',
        packageManager: 'npm',
        runtime: 'node',
        linker: 'node-modules',
        // Node 20.0.0 floor smoke: published-package import checks only.
        run: ['rxjs-peer', 'esm', 'commonjs'],
        skip: LEGACY_SKIPS
    },
    {
        id: 'pnpm-node',
        packageManager: 'pnpm',
        runtime: 'node',
        linker: 'isolated',
        run: FULL_NODE_LANE
    },
    {
        id: 'bun-node',
        packageManager: 'bun',
        runtime: 'node',
        linker: 'node-modules',
        run: FULL_NODE_LANE
    },
    {
        id: 'bun-bun',
        packageManager: 'bun',
        runtime: 'bun',
        linker: 'node-modules',
        run: [
            'rxjs-peer',
            'esm',
            'commonjs',
            'typescript-native',
            'integrations',
            'replication-lifecycle',
            'collections',
            'cleanup'
        ],
        skip: BUN_RUNTIME_SKIPS
    },
    {
        id: 'yarn-node',
        packageManager: 'yarn',
        runtime: 'node',
        linker: 'node-modules',
        run: FULL_NODE_LANE
    },
    {
        id: 'yarn-pnp',
        packageManager: 'yarn',
        runtime: 'node',
        linker: 'pnp',
        run: FULL_NODE_LANE
    },
    {
        id: 'deno',
        packageManager: 'deno',
        runtime: 'deno',
        linker: 'deno-node-modules',
        run: ['esm', 'commonjs', 'collections', 'replication-lifecycle', 'denokv', 'cleanup'],
        skip: DENO_SKIPS
    }
];

export function findLane(id) {
    const lane = LANES.find(entry => entry.id === id);
    if (!lane) {
        const known = LANES.map(entry => entry.id).join(', ');
        const error = new Error(`Unknown lane "${id}". Known lanes: ${known}`);
        error.exitCode = 2;
        error.code = 'E_LANE';
        throw error;
    }
    return lane;
}

export function lanePlan(lane) {
    const plan = [
        { id: 'toolchain', required: true, planned: 'run', description: 'Package manager and runtime versions.' },
        { id: 'install', required: true, planned: 'run', description: 'Installs the verified artifact into an isolated consumer.' },
        { id: 'package-layout', required: true, planned: 'run', description: PROBE_LIBRARY['package-layout'].description }
    ];
    for (const id of lane.run) {
        plan.push({
            id,
            required: true,
            planned: 'run',
            description: PROBE_LIBRARY[id].description
        });
    }
    for (const [id, reason] of Object.entries(lane.skip || {})) {
        plan.push({
            id,
            required: false,
            planned: 'skip',
            reason,
            description: PROBE_LIBRARY[id].description
        });
    }
    return plan;
}

export function listLanes() {
    return LANES.map(lane => ({
        id: lane.id,
        packageManager: lane.packageManager,
        runtime: lane.runtime,
        linker: lane.linker,
        probes: lanePlan(lane)
    }));
}

/**
 * Consumer dependencies required by the probes that a lane actually plans to
 * run. The artifact itself is always a local package URI.
 */
export function laneDependencies(lane) {
    const needed = new Set();
    for (const id of lane.run) {
        for (const dependency of PROBE_LIBRARY[id].dependencies || []) {
            needed.add(dependency);
        }
    }
    return needed;
}

/**
 * Commands for each lane. Yarn PnP runs scripts through the Yarn binary so the
 * Plug'n'Play loader is active; node-modules lanes call the runtime directly.
 */
export function commandsFor({ lane, tools }) {
    const manager = tools.manager;
    const runtime = tools.runtime;
    const isPnp = lane.linker === 'pnp';
    const isDeno = lane.packageManager === 'deno';
    return {
        install: { bin: manager.path, args: [...tools.installArgs] },
        script: (file, flags = []) => {
            if (isDeno) {
                return { bin: manager.path, args: ['run', '--allow-read', '--allow-env', ...flags, file] };
            }
            if (isPnp) {
                return { bin: manager.path, args: ['node', file] };
            }
            return { bin: runtime.path, args: [file] };
        },
        typescript: project => {
            if (isPnp) {
                return { bin: manager.path, args: ['tsc', '--noEmit', '-p', project] };
            }
            return {
                bin: runtime.path,
                args: [path.join('node_modules', 'typescript', 'bin', 'tsc'), '--noEmit', '-p', project]
            };
        },
        // Plug'n'Play has no node_modules copy and its packages live inside a
        // cache zip, so the loader must read the installed manifest itself.
        pnpManifest: () => ({
            bin: manager.path,
            args: ['node', '-e', [
                'const fs=require("node:fs"),path=require("node:path");',
                'let dir=path.dirname(require.resolve("@clatech/db"));',
                'for(;;){const file=path.join(dir,"package.json");',
                'if(fs.existsSync(file)){const manifest=JSON.parse(fs.readFileSync(file,"utf8"));',
                'if(manifest.name==="@clatech/db"){process.stdout.write("@@CLA_COMPAT_PNP@@"+JSON.stringify({root:dir,manifest})+"@@CLA_COMPAT_PNP@@");break;}}',
                'const parent=path.dirname(dir);',
                'if(parent===dir)throw new Error("@clatech/db package root not found");dir=parent;}'
            ].join('')]
        })
    };
}
