/**
 * CLA-DB: Structured JSON and readable Markdown evidence for one lane.
 *
 * A lane is only supported when every required check passed. SKIP and
 * UNSUPPORTED are recorded, counted, and never converted into a pass.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const EXIT_CODES = {
    PASS: 0,
    FAIL: 1,
    USAGE: 2,
    UNSUPPORTED: 3,
    NOT_RUN: 4,
    INCOMPLETE: 4
};

export function summarizeProbes(probes, { dryRun = false } = {}) {
    const summary = {
        total: probes.length,
        passed: 0,
        failed: 0,
        skipped: 0,
        unsupported: 0,
        required: 0,
        requiredPassed: 0
    };
    for (const probe of probes) {
        if (probe.status === 'PASS') summary.passed++;
        else if (probe.status === 'FAIL') summary.failed++;
        else if (probe.status === 'SKIP') summary.skipped++;
        else if (probe.status === 'UNSUPPORTED') summary.unsupported++;
        if (probe.required) {
            summary.required++;
            if (probe.status === 'PASS') summary.requiredPassed++;
        }
    }
    const requiredProbes = probes.filter(probe => probe.required);
    const requiredNotPassed = requiredProbes.filter(probe => probe.status !== 'PASS');
    let verdict;
    if (dryRun) {
        verdict = 'NOT_RUN';
    } else if (probes.some(probe => probe.status === 'FAIL')) {
        verdict = 'FAIL';
    } else if (probes.some(probe => probe.status === 'UNSUPPORTED')) {
        verdict = 'UNSUPPORTED';
    } else if (summary.passed === 0) {
        verdict = 'NOT_RUN';
    } else if (requiredNotPassed.length > 0) {
        verdict = 'INCOMPLETE';
    } else {
        verdict = 'PASS';
    }
    return Object.assign(summary, {
        verdict,
        supported: verdict === 'PASS'
    });
}

export function buildResults({ lane, artifact, options, probes, tools, limitations, startedAt, durationMs }) {
    const summary = summarizeProbes(probes, { dryRun: Boolean(options.dryRun) });
    return {
        schemaVersion: 1,
        generatedBy: 'scripts/compatibility/run.mjs',
        lane: {
            id: lane.id,
            packageManager: lane.packageManager,
            runtime: lane.runtime,
            linker: lane.linker
        },
        artifact: {
            file: artifact.file,
            fileName: artifact.fileName,
            sha256: artifact.sha256,
            size: artifact.size,
            packageName: artifact.packageName,
            packageVersion: artifact.packageVersion,
            storageVersion: artifact.storageVersion,
            exportCount: artifact.exportCount
        },
        environment: {
            platform: process.platform,
            arch: process.arch,
            osRelease: os.release(),
            osType: os.type(),
            node: process.version,
            tools: Object.fromEntries(Object.entries(tools || {}).map(([name, tool]) => [name, {
                available: Boolean(tool.available),
                version: tool.version || null,
                major: tool.major || null,
                path: tool.path || null
            }]))
        },
        options: {
            dryRun: Boolean(options.dryRun),
            timeoutMs: options.timeoutMs,
            pathPrefixes: options.pathPrefixes || []
        },
        startedAt,
        durationMs,
        verdict: summary.verdict,
        supported: summary.supported,
        summary,
        probes,
        limitations: limits(limitations)
    };
}

function limits(limitations) {
    const list = limitations || [];
    return list.length > 0
        ? list
        : ['No additional lane limitations were recorded. This is not a claim that untested targets are supported.'];
}

function escapeCell(value) {
    return String(value === undefined || value === null ? '' : value)
        .replace(/\|/g, '\\|')
        .replace(/\r?\n/g, ' ');
}

function table(headers, rows) {
    return [
        `| ${headers.join(' | ')} |`,
        `| ${headers.map(() => '---').join(' | ')} |`,
        ...rows.map(row => `| ${row.map(escapeCell).join(' | ')} |`)
    ].join('\n');
}

export function renderMarkdown(results) {
    const lines = [];
    lines.push(`# CLA DB compatibility lane: ${results.lane.id}`, '');
    lines.push(`**Verdict:** ${results.verdict}`, '');
    lines.push(`**Supported:** ${results.supported ? 'yes' : 'no'}`, '');
    lines.push(
        `**Lane:** ${results.lane.id} (${results.lane.packageManager} installs, ` +
        `${results.lane.runtime} executes, ${results.lane.linker} layout)`,
        ''
    );
    lines.push(
        'A skipped or unsupported check is never counted as passed. ' +
        '`supported` is only true when every required check passed.',
        ''
    );
    if (results.options.dryRun) {
        lines.push('This is a dry run. No package manager or runtime was executed.', '');
    }
    lines.push('## Artifact', '');
    lines.push(table(['Field', 'Value'], [
        ['File', results.artifact.fileName],
        ['SHA-256', results.artifact.sha256],
        ['Package', results.artifact.packageName],
        ['Version', results.artifact.packageVersion],
        ['Storage version', results.artifact.storageVersion],
        ['Exports', results.artifact.exportCount],
        ['Compressed bytes', results.artifact.size]
    ]), '');
    lines.push('## Environment', '');
    const toolRows = Object.entries(results.environment.tools).map(([name, tool]) => [
        name,
        tool.available ? tool.version : 'unavailable',
        tool.path || ''
    ]);
    lines.push(table(['Tool', 'Version', 'Path'], toolRows), '');
    lines.push(table(['Field', 'Value'], [
        ['OS', `${results.environment.osType} ${results.environment.osRelease}`],
        ['Platform', `${results.environment.platform} ${results.environment.arch}`],
        ['Runner Node.js', results.environment.node],
        ['Timeout per check', `${results.options.timeoutMs} ms`],
        ['PATH prefixes', results.options.pathPrefixes.join(', ') || 'none']
    ]), '');
    lines.push(`Started: ${results.startedAt}`, '');
    lines.push(`Duration: ${results.durationMs} ms`, '');
    lines.push('## Checks', '');
    lines.push(table(
        ['Check', 'Required', 'Status', 'Exit', 'Duration', 'Reason'],
        results.probes.map(probe => [
            probe.id,
            probe.required ? 'yes' : 'no',
            probe.status,
            probe.exitCode === null ? '' : probe.exitCode,
            `${probe.durationMs} ms`,
            probe.reason || ''
        ])
    ), '');
    lines.push('## Summary', '');
    const summary = results.summary;
    lines.push(table(['Status', 'Count'], [
        ['PASS', summary.passed],
        ['FAIL', summary.failed],
        ['SKIP', summary.skipped],
        ['UNSUPPORTED', summary.unsupported],
        ['Required checks', summary.required],
        ['Required checks passed', summary.requiredPassed]
    ]), '');
    const failing = results.probes.filter(probe => probe.status === 'FAIL');
    if (failing.length > 0) {
        lines.push('## Failing output', '');
        for (const probe of failing) {
            lines.push(`### ${probe.id}`, '');
            if (probe.command) {
                lines.push(`Command: \`${probe.command}\``, '');
            }
            if (probe.reason) {
                lines.push(`Reason: ${probe.reason}`, '');
            }
            if (probe.stdout) {
                lines.push('stdout:', '', '```text', probe.stdout.trimEnd(), '```', '');
            }
            if (probe.stderr) {
                lines.push('stderr:', '', '```text', probe.stderr.trimEnd(), '```', '');
            }
        }
    }
    lines.push('## Limitations', '');
    for (const limitation of results.limitations) {
        lines.push(`- ${limitation}`);
    }
    lines.push('');
    return lines.join('\n');
}

export function writeReports({ outDir, results }) {
    fs.mkdirSync(outDir, { recursive: true });
    const resultsFile = path.join(outDir, 'results.json');
    const markdownFile = path.join(outDir, 'REPORT.md');
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2) + '\n');
    fs.writeFileSync(markdownFile, renderMarkdown(results));
    return { resultsFile, markdownFile };
}
