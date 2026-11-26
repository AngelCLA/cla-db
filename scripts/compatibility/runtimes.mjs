/**
 * CLA-DB: Runtime discovery for the compatibility lanes.
 *
 * Tool paths are resolved through the augmented PATH only, so a lane can be
 * pointed at exact runtime binaries without enabling global tool permissions.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const runtimes = {
    node: {
        id: 'node',
        bin: 'node',
        versionArgs: ['--version'],
        label: 'Node.js'
    },
    bun: {
        id: 'bun',
        bin: 'bun',
        versionArgs: ['--version'],
        label: 'Bun'
    },
    deno: {
        id: 'deno',
        bin: 'deno',
        versionArgs: ['--version'],
        label: 'Deno'
    }
};

export function parseVersion(text) {
    const match = String(text || '').match(/(\d+)\.(\d+)\.(\d+)/);
    if (!match) {
        return null;
    }
    return {
        version: `${match[1]}.${match[2]}.${match[3]}`,
        major: Number(match[1]),
        minor: Number(match[2]),
        patch: Number(match[3])
    };
}

export function findExecutable(bin, pathValue) {
    if (bin.includes(path.sep)) {
        return fs.existsSync(bin) ? bin : null;
    }
    for (const directory of String(pathValue || '').split(path.delimiter)) {
        if (!directory) {
            continue;
        }
        const candidate = path.join(directory, bin);
        try {
            if (fs.statSync(candidate).isFile()) {
                return candidate;
            }
        } catch {
            continue;
        }
    }
    return null;
}

export function detectTool({ bin, versionArgs, env, cwd }) {
    const resolved = findExecutable(bin, env.PATH);
    if (!resolved) {
        return { available: false, bin, reason: `${bin} was not found on PATH` };
    }
    const result = spawnSync(resolved, versionArgs, {
        cwd,
        env,
        encoding: 'utf8',
        timeout: 30_000,
        maxBuffer: 1024 * 1024
    });
    if (result.error) {
        return { available: false, bin, path: resolved, reason: `${bin} ${versionArgs.join(' ')} failed: ${result.error.message}` };
    }
    if (result.status !== 0) {
        const detail = (result.stderr || result.stdout || '').trim().split(/\r?\n/)[0] || 'no output';
        return {
            available: false,
            bin,
            path: resolved,
            reason: `${bin} ${versionArgs.join(' ')} exited with ${result.status}: ${detail}`
        };
    }
    const parsed = parseVersion(result.stdout) || parseVersion(result.stderr);
    if (!parsed) {
        return {
            available: false,
            bin,
            path: resolved,
            reason: `Cannot parse a semantic version from "${bin} ${versionArgs.join(' ')}"`
        };
    }
    return { available: true, bin, path: resolved, ...parsed };
}

export function describeTool(tool, definition) {
    if (!tool.available) {
        return `${definition.label}: unavailable (${tool.reason})`;
    }
    return `${definition.label} ${tool.version} (${tool.path})`;
}
