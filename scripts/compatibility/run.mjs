#!/usr/bin/env node
/**
 * CLA-DB: Detached package and runtime compatibility runner.
 *
 * Usage:
 *   node scripts/compatibility/run.mjs \
 *     --artifact <absolute .tgz> --sha256 <digest> --lane <id> --out <directory>
 *
 * The runner consumes one prebuilt artifact, verifies its SHA-256, installs it
 * into a fresh consumer outside the repository and reports PASS, FAIL, SKIP and
 * UNSUPPORTED per check. It never builds, packs, publishes, or edits the
 * candidate.
 */
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CompatibilityError, resolveArtifact } from './artifact.mjs';
import { findLane, listLanes } from './lanes.mjs';
import { runLane } from './probes.mjs';
import { EXIT_CODES, buildResults, writeReports } from './report.mjs';

const REPO_ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

const USAGE = `Usage: node scripts/compatibility/run.mjs --artifact <file.tgz> --sha256 <digest> --lane <id> --out <directory> [options]

Options:
  --artifact <path>      Prebuilt @clatech/db tarball. Required.
  --sha256 <digest>      Expected SHA-256 of that tarball. Required.
  --lane <id>            Lane to run. See --list-lanes.
  --out <directory>      Directory for results.json and REPORT.md. Required.
  --scratch <directory>  Base directory for the isolated consumer.
                         Defaults to $CLA_COMPAT_SCRATCH or the system temp directory.
  --path <directory>     Prepend a directory to PATH for exact tool versions. Repeatable.
  --timeout <ms>         Timeout for a single install or check. Default 600000.
  --dry-run              Verify the artifact and report the planned checks as SKIP.
  --list-lanes           Print the lane registry as JSON.
  --help                 Print this usage.

Exit codes: 0 PASS, 1 FAIL, 2 usage or artifact error, 3 UNSUPPORTED, 4 INCOMPLETE or dry run.
`;

function usageError(message) {
    return new CompatibilityError('E_USAGE', message);
}

function takeValue(argv, index, option) {
    const value = argv[index];
    if (!value || value.startsWith('--')) {
        throw usageError(`${option} requires a value`);
    }
    return value;
}

function parseArgs(argv) {
    const options = {
        pathPrefixes: [],
        timeoutMs: 600_000,
        dryRun: false,
        listLanes: false,
        help: false
    };
    for (let index = 0; index < argv.length; index++) {
        const argument = argv[index];
        switch (argument) {
            case '--help':
            case '-h':
                options.help = true;
                break;
            case '--list-lanes':
                options.listLanes = true;
                break;
            case '--dry-run':
                options.dryRun = true;
                break;
            case '--artifact':
                options.artifact = takeValue(argv, ++index, '--artifact');
                break;
            case '--sha256':
                options.sha256 = takeValue(argv, ++index, '--sha256');
                break;
            case '--lane':
                options.lane = takeValue(argv, ++index, '--lane');
                break;
            case '--out':
                options.out = takeValue(argv, ++index, '--out');
                break;
            case '--scratch':
                options.scratch = takeValue(argv, ++index, '--scratch');
                break;
            case '--path':
                options.pathPrefixes.push(path.resolve(takeValue(argv, ++index, '--path')));
                break;
            case '--timeout': {
                const value = takeValue(argv, ++index, '--timeout');
                const timeoutMs = Number(value);
                if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
                    throw usageError(`--timeout must be a positive integer in milliseconds, received "${value}"`);
                }
                options.timeoutMs = timeoutMs;
                break;
            }
            default:
                throw usageError(`Unknown argument "${argument}". See --help.`);
        }
    }
    if (options.help || options.listLanes) {
        return options;
    }
    for (const required of ['artifact', 'sha256', 'lane', 'out']) {
        if (!options[required]) {
            throw usageError(`--${required} is required`);
        }
    }
    return options;
}

function isInside(parent, child) {
    const relative = path.relative(parent, child);
    return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function run(argv) {
    const options = parseArgs(argv);
    if (options.help) {
        process.stdout.write(USAGE);
        return EXIT_CODES.PASS;
    }
    if (options.listLanes) {
        process.stdout.write(JSON.stringify(listLanes(), null, 2) + '\n');
        return EXIT_CODES.PASS;
    }

    const artifact = resolveArtifact({ artifact: options.artifact, sha256: options.sha256 });
    const lane = findLane(options.lane);
    const scratchBase = path.resolve(options.scratch || process.env.CLA_COMPAT_SCRATCH || os.tmpdir());
    if (isInside(REPO_ROOT, scratchBase)) {
        throw usageError(
            `Scratch directory must be outside the repository: ${scratchBase}. Use --scratch or CLA_COMPAT_SCRATCH.`
        );
    }
    options.scratch = scratchBase;
    options.env = Object.assign({}, process.env, {
        PATH: [...options.pathPrefixes, process.env.PATH].filter(Boolean).join(path.delimiter)
    });

    const laneResult = runLane({ lane, artifact, options });
    const results = buildResults({
        lane,
        artifact,
        options,
        probes: laneResult.probes,
        tools: laneResult.tools,
        limitations: laneResult.limitations,
        startedAt: laneResult.startedAt,
        durationMs: laneResult.durationMs
    });
    const { resultsFile, markdownFile } = writeReports({ outDir: path.resolve(options.out), results });

    const summary = results.summary;
    process.stdout.write(
        `Lane ${lane.id}: ${results.verdict} (${summary.passed} passed, ${summary.failed} failed, ` +
        `${summary.skipped} skipped, ${summary.unsupported} unsupported)\n`
    );
    process.stdout.write(`Results: ${resultsFile}\n`);
    process.stdout.write(`Report: ${markdownFile}\n`);
    if (!results.supported) {
        process.stdout.write('Not supported by this run. SKIP and UNSUPPORTED are not passes.\n');
    }
    return EXIT_CODES[results.verdict];
}

try {
    process.exitCode = run(process.argv.slice(2));
} catch (error) {
    if (error instanceof CompatibilityError) {
        process.stderr.write(`error: ${error.message}\n`);
        process.exitCode = error.exitCode;
    } else if (error && error.exitCode) {
        process.stderr.write(`error: ${error.message}\n`);
        process.exitCode = error.exitCode;
    } else {
        process.stderr.write(`${error && error.stack ? error.stack : error}\n`);
        process.exitCode = 1;
    }
}
