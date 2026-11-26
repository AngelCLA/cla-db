/**
 * CLA-DB: One artifact identity for every compatibility lane.
 *
 * The runner never builds or packs. It receives an already built tarball and
 * verifies its SHA-256 before any install is executed.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const COMPATIBILITY_PACKAGE_NAME = '@clatech/db';

export class CompatibilityError extends Error {
    constructor(code, message, exitCode = 2) {
        super(message);
        this.name = 'CompatibilityError';
        this.code = code;
        this.exitCode = exitCode;
    }
}

export function sha256File(file) {
    const hash = createHash('sha256');
    hash.update(fs.readFileSync(file));
    return hash.digest('hex');
}

export function readTarballPackageJson(file) {
    let output;
    try {
        output = execFileSync('tar', ['-xOzf', file, 'package/package.json'], {
            encoding: 'utf8',
            timeout: 60_000,
            maxBuffer: 20 * 1024 * 1024
        });
    } catch (error) {
        throw new CompatibilityError(
            'E_ARTIFACT_READ',
            `Cannot read package/package.json from "${file}": ${error.message}`
        );
    }
    try {
        return JSON.parse(output);
    } catch (error) {
        throw new CompatibilityError(
            'E_ARTIFACT_JSON',
            `package/package.json in "${file}" is not valid JSON: ${error.message}`
        );
    }
}

export function normalizeSha256(value) {
    const normalized = String(value || '').trim().replace(/^sha256:/i, '').toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(normalized)) {
        throw new CompatibilityError(
            'E_SHA256_FORMAT',
            `--sha256 must be a 64 character hex SHA-256 digest, received "${value}"`
        );
    }
    return normalized;
}

export function resolveArtifact({ artifact, sha256, cwd = process.cwd() }) {
    if (!artifact) {
        throw new CompatibilityError('E_ARTIFACT_REQUIRED', '--artifact <path to the prebuilt .tgz> is required');
    }
    const expected = normalizeSha256(sha256);
    const file = path.resolve(cwd, artifact);
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
        throw new CompatibilityError('E_ARTIFACT_NOT_FOUND', `Artifact does not exist: ${file}`);
    }
    const actual = sha256File(file);
    if (actual !== expected) {
        throw new CompatibilityError(
            'E_SHA256_MISMATCH',
            `SHA-256 mismatch for "${file}": expected ${expected}, received ${actual}`
        );
    }
    const manifest = readTarballPackageJson(file);
    if (manifest.name !== COMPATIBILITY_PACKAGE_NAME) {
        throw new CompatibilityError(
            'E_ARTIFACT_PACKAGE',
            `Artifact package is "${manifest.name}"; every lane requires "${COMPATIBILITY_PACKAGE_NAME}"`
        );
    }
    if (!manifest.version) {
        throw new CompatibilityError('E_ARTIFACT_VERSION', 'Artifact package.json has no version');
    }
    return {
        file,
        fileName: path.basename(file),
        sha256: actual,
        size: fs.statSync(file).size,
        packageName: manifest.name,
        packageVersion: manifest.version,
        storageVersion: manifest.claDb && manifest.claDb.upstreamVersion ? manifest.claDb.upstreamVersion : null,
        exportCount: Object.keys(manifest.exports || {}).length,
        manifest
    };
}

export function extractArtifact({ file, destination }) {
    fs.mkdirSync(destination, { recursive: true });
    execFileSync('tar', ['-xzf', file, '-C', destination], {
        encoding: 'utf8',
        timeout: 120_000,
        maxBuffer: 20 * 1024 * 1024
    });
    const packageDir = path.join(destination, 'package');
    if (!fs.existsSync(path.join(packageDir, 'package.json'))) {
        throw new CompatibilityError(
            'E_ARTIFACT_LAYOUT',
            `Extracted artifact has no package/package.json at ${destination}`
        );
    }
    return packageDir;
}
