/**
 * CLA-DB: Package manager policy for detached consumers.
 *
 * Every manager installs the same local tarball into its own fresh directory
 * and generates its own lockfile. Hoisting that hides undeclared dependencies
 * is forbidden, and inherited Node module settings are removed from the child
 * environment before any install runs.
 */
import fs from 'node:fs';
import path from 'node:path';

/**
 * Exact fixture pins. They mirror the versions used by the core tooling and
 * must be updated together with it. Consumers never read the repository
 * node_modules tree.
 */
export const FIXTURE_DEPENDENCIES = {
    rxjs: '7.8.2',
    dexie: '4.4.2',
    'fake-indexeddb': '6.2.8',
    typescript: '6.0.3',
    vite: '6.4.1'
};

const SCRUBBED_ENVIRONMENT = [
    /^node_path$/i,
    /^node_options$/i,
    /^npm_config_node[-_]?linker$/i,
    /^npm_config_(shamefully[-_]?hoist|hoist|hoist[-_]pattern|public[-_]hoist[-_]pattern|strict[-_]peer[-_]dependencies)$/i,
    /^yarn_node_linker$/i,
    /^yarn_global_folder$/i,
    /^yarn_enable_global_cache$/i,
    /^npm_config_prefix$/i
];

/**
 * Returns a child environment without inherited module resolution settings.
 * It keeps the user's registry configuration, so a mirror or proxy still works.
 */
export function sanitizedEnv(extra = {}) {
    const env = {};
    for (const [key, value] of Object.entries(process.env)) {
        if (SCRUBBED_ENVIRONMENT.some(pattern => pattern.test(key))) {
            continue;
        }
        env[key] = value;
    }
    return Object.assign(env, {
        CI: 'true',
        NO_COLOR: '1',
        FORCE_COLOR: '0',
        COREPACK_ENABLE_DOWNLOAD_PROMPT: '0',
        npm_config_update_notifier: 'false'
    }, extra);
}

export const packageManagers = {
    npm: {
        id: 'npm',
        bin: 'npm',
        label: 'npm',
        versionArgs: ['--version'],
        minimumMajor: 0,
        installArgs: ['install', '--ignore-scripts', '--no-audit', '--no-fund'],
        layout: 'node-modules',
        configFiles: () => ({
            '.npmrc': [
                'fund=false',
                'audit=false',
                'update-notifier=false',
                'ignore-scripts=true',
                ''
            ].join('\n')
        })
    },
    pnpm: {
        id: 'pnpm',
        bin: 'pnpm',
        label: 'pnpm',
        versionArgs: ['--version'],
        minimumMajor: 0,
        installArgs: ['install', '--ignore-scripts', '--reporter=append-only'],
        layout: 'pnpm-isolated',
        configFiles: () => ({
            // Explicit isolated layout. Never node-linker=hoisted or shamefully-hoist.
            '.npmrc': [
                'node-linker=isolated',
                'ignore-scripts=true',
                'fund=false',
                'audit=false',
                ''
            ].join('\n')
        })
    },
    bun: {
        id: 'bun',
        bin: 'bun',
        label: 'Bun',
        versionArgs: ['--version'],
        minimumMajor: 0,
        installArgs: ['install', '--ignore-scripts'],
        layout: 'node-modules',
        configFiles: () => ({})
    },
    yarn: {
        id: 'yarn',
        bin: 'yarn',
        label: 'Yarn',
        versionArgs: ['--version'],
        // Only modern Yarn is evaluated. Yarn 1 is reported as UNSUPPORTED.
        minimumMajor: 4,
        installArgs: ['install', '--no-immutable'],
        layout: 'yarn',
        configFiles: ({ linker }) => ({
            '.yarnrc.yml': [
                `nodeLinker: ${linker === 'pnp' ? 'pnp' : 'node-modules'}`,
                'enableGlobalCache: false',
                'enableTelemetry: false',
                ''
            ].join('\n')
        })
    },
    deno: {
        id: 'deno',
        bin: 'deno',
        label: 'Deno',
        versionArgs: ['--version'],
        minimumMajor: 0,
        installArgs: ['install'],
        layout: 'deno-node-modules',
        configFiles: () => ({})
    }
};

const FORBIDDEN_HOISTING = [
    /shamefully[-_]hoist/i,
    /node[-_]linker\s*[:=]\s*hoisted/i,
    /nodeLinker:\s*hoisted/i,
    /public[-_]hoist[-_]pattern/i
];

/**
 * Guards the staged consumer against hoisting configuration that could make
 * undeclared dependencies resolve. Failing here is a lane failure, not a pass.
 */
export function assertNoHoistingConfig(consumerDir) {
    const files = ['.npmrc', '.yarnrc.yml', 'package.json', 'pnpm-workspace.yaml'];
    for (const name of files) {
        const file = path.join(consumerDir, name);
        if (!fs.existsSync(file)) {
            continue;
        }
        const content = fs.readFileSync(file, 'utf8');
        for (const pattern of FORBIDDEN_HOISTING) {
            if (pattern.test(content)) {
                throw new Error(`Forbidden hoisting configuration in ${name}: ${pattern}`);
            }
        }
    }
}
