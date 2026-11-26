/**
 * Install guidance for the landing site (S11).
 *
 * Verified registry state on 2026-11-26: `@clatech/db@0.1.3` is published
 * as `latest`. The commands below are install instructions for the single npm
 * package; they are not a per-manager support certification.
 */

export type PackageManagerId = 'npm' | 'pnpm' | 'bun' | 'yarn' | 'deno';

export type InstallTarget = {
    readonly id: PackageManagerId;
    readonly label: string;
    readonly command: string;
    readonly note: string;
};

// CLA-DB: keep exactly one artifact. Every command installs the same npm package.
export const installTargets: readonly InstallTarget[] = [
    {
        id: 'npm',
        label: 'npm',
        command: 'npm install @clatech/db rxjs',
        note: 'Instala el paquete y su peer rxjs con npm.'
    },
    {
        id: 'pnpm',
        label: 'pnpm',
        command: 'pnpm add @clatech/db rxjs',
        note: 'Añade el paquete con la resolución estricta de pnpm, sin hoisting.'
    },
    {
        id: 'bun',
        label: 'Bun',
        command: 'bun add @clatech/db rxjs',
        note: 'Bun instala el mismo artefacto npm y también puede ejecutarlo.'
    },
    {
        id: 'yarn',
        label: 'Yarn',
        command: 'yarn add @clatech/db rxjs',
        note: 'Yarn moderno (4.x) con node_modules. La variante Plug and Play se evalúa por separado.'
    },
    {
        id: 'deno',
        label: 'Deno',
        command: 'deno add npm:@clatech/db npm:rxjs',
        note: 'Deno resuelve los specifiers npm: en deno.json, sin node_modules.'
    }
];

export const defaultInstallTargetId: PackageManagerId = 'npm';

export const installTargetById = (id: PackageManagerId): InstallTarget =>
    installTargets.find(candidate => candidate.id === id) ?? installTargets[0];

export const installSection = {
    kicker: '// Instalación',
    title: 'Un paquete, cinco comandos',
    lede: 'Un único paquete oficial, @clatech/db, más su peer rxjs. La versión 0.1.3 está publicada en npm como latest.',
    boundary: 'Cada comando describe cómo instala esa herramienta. No es una certificación por gestor: la evidencia y los límites de 0.1.3 se registran con la release.',
    selectorLabel: 'Gestor de paquetes',
    copyLabel: 'Copiar',
    messages: {
        copied: 'Comando copiado.',
        unavailable: 'El navegador no permite copiar: selecciona el comando.',
        failed: 'No se pudo copiar el comando.'
    }
} as const;

/**
 * Selection movement for the selector, shared by the component and the
 * headless check so the keyboard contract is verifiable without a browser.
 */
export const nextInstallTargetId = (
    currentId: PackageManagerId,
    key: string
): PackageManagerId | null => {
    const index = installTargets.findIndex(candidate => candidate.id === currentId);
    if (index === -1) {
        return null;
    }
    const last = installTargets.length - 1;
    switch (key) {
        case 'ArrowRight':
            return installTargets[index === last ? 0 : index + 1].id;
        case 'ArrowLeft':
            return installTargets[index === 0 ? last : index - 1].id;
        case 'Home':
            return installTargets[0].id;
        case 'End':
            return installTargets[last].id;
        default:
            return null;
    }
};

export type ClipboardWriter = {
    readonly writeText: (text: string) => Promise<void>;
};

export type CopyOutcome = 'copied' | 'unavailable' | 'failed';

export const copyInstallCommand = async (
    id: PackageManagerId,
    clipboard: ClipboardWriter | undefined
): Promise<CopyOutcome> => {
    if (!clipboard || typeof clipboard.writeText !== 'function') {
        return 'unavailable';
    }
    const target = installTargets.find(candidate => candidate.id === id);
    if (!target) {
        return 'failed';
    }
    try {
        await clipboard.writeText(target.command);
        return 'copied';
    } catch {
        return 'failed';
    }
};
