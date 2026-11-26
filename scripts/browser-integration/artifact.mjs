/**
 * CLA-DB: browser integration artifact identity.
 *
 * The harness never builds or packs the candidate. It only verifies the
 * SHA-256 of the archive the caller supplies, so every package manager,
 * runtime and browser lane consumes exactly the same bytes.
 */
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Exact tool pins from the release design. They are written into the
 * isolated fixture manifest and re-checked after installation.
 */
export const TOOL_PINS = Object.freeze({
    playwright: '1.65.1',
    vite: '8.4.0',
    rxjs: '7.8.2'
});

export const BROWSERS = Object.freeze(['chromium', 'firefox', 'webkit']);

export class ArtifactError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ArtifactError';
    }
}

export function sha256File(filePath) {
    const hash = createHash('sha256');
    const buffer = Buffer.allocUnsafe(1024 * 1024);
    const fd = fs.openSync(filePath, 'r');
    try {
        let read;
        while ((read = fs.readSync(fd, buffer, 0, buffer.length, null)) > 0) {
            hash.update(buffer.subarray(0, read));
        }
    } finally {
        fs.closeSync(fd);
    }
    return hash.digest('hex');
}

/**
 * Fail closed before any scratch directory, install or browser launch exists.
 * The returned identity is the only artifact evidence written into reports.
 */
export function verifyArtifact({ artifactPath, sha256 }) {
    if (typeof artifactPath !== 'string' || artifactPath.length === 0 || !path.isAbsolute(artifactPath)) {
        throw new ArtifactError('--artifact must be an absolute path to the prebuilt .tgz archive');
    }
    if (!artifactPath.endsWith('.tgz')) {
        throw new ArtifactError('--artifact must point to a .tgz archive');
    }
    if (typeof sha256 !== 'string' || !/^[0-9a-f]{64}$/i.test(sha256)) {
        throw new ArtifactError('--sha256 must be a 64 character hex SHA-256 digest');
    }

    let stat;
    try {
        stat = fs.statSync(artifactPath);
    } catch (err) {
        throw new ArtifactError(`artifact does not exist: ${artifactPath}`);
    }
    if (!stat.isFile()) {
        throw new ArtifactError(`artifact is not a regular file: ${artifactPath}`);
    }

    const actualSha256 = sha256File(artifactPath);
    if (actualSha256 !== sha256.toLowerCase()) {
        throw new ArtifactError(
            `artifact SHA-256 mismatch: expected ${sha256.toLowerCase()} but the archive is ${actualSha256}`
        );
    }

    return {
        artifactPath,
        sha256: actualSha256,
        sizeBytes: stat.size,
        packedManifest: readPackedManifest(artifactPath)
    };
}

/**
 * Reads package/package.json out of the archive for report evidence.
 * A missing `tar` only drops this evidence. It never fails the run.
 */
function readPackedManifest(artifactPath) {
    const result = spawnSync('tar', ['-xOf', artifactPath, 'package/package.json'], {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
        timeout: 60_000
    });
    if (result.status !== 0 || !result.stdout) {
        return null;
    }
    try {
        const pkg = JSON.parse(result.stdout);
        return {
            name: pkg.name,
            version: pkg.version,
            license: pkg.license ?? null,
            upstreamVersion: pkg.claDb?.upstreamVersion ?? null
        };
    } catch (err) {
        return null;
    }
}
