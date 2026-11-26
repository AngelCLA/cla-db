/**
 * CLA-DB: structured JSON plus readable Markdown report for one browser lane.
 *
 * PASS means the scenario ran and its assertions held. SKIP and UNSUPPORTED
 * are never counted as passes and always fail the gate.
 */
import fs from 'node:fs';
import path from 'node:path';

export const STATUS = Object.freeze({
    PASS: 'PASS',
    FAIL: 'FAIL',
    SKIP: 'SKIP',
    UNSUPPORTED: 'UNSUPPORTED'
});

export const LIMITATIONS = Object.freeze([
    'WebKit is tested through the WebKit build pinned by Playwright. It is not Safari or iOS certification.',
    'SKIP and UNSUPPORTED results are not passes and fail the gate.',
    'The service worker caches only the app shell. It never caches /api/ traffic, so offline data is read from IndexedDB.',
    'Recovery after an abrupt process kill is not covered. Only orderly page reload and browser restart are tested.',
    'Performance is not measured here. This lane reports functional browser behavior only.'
]);

export function summarize(results) {
    const counts = { PASS: 0, FAIL: 0, SKIP: 0, UNSUPPORTED: 0 };
    for (const result of results) {
        counts[result.status] = (counts[result.status] || 0) + 1;
    }
    const notPassed = results.filter(result => result.status !== STATUS.PASS);
    return {
        counts,
        result: results.length > 0 && notPassed.length === 0 ? STATUS.PASS : STATUS.FAIL,
        notPassed: notPassed.map(result => result.id)
    };
}

export function writeReports({ outDir, report }) {
    fs.mkdirSync(outDir, { recursive: true });
    const jsonPath = path.join(outDir, `browser-integration-${report.browser}.json`);
    const markdownPath = path.join(outDir, `browser-integration-${report.browser}.md`);
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
    fs.writeFileSync(markdownPath, renderMarkdown(report), 'utf8');
    return { jsonPath, markdownPath };
}

function renderMarkdown(report) {
    const lines = [];
    lines.push(`# Browser integration: ${report.browser}`);
    lines.push('');
    lines.push(`Result: **${report.result}**`);
    lines.push('');
    lines.push('| Field | Value |');
    lines.push('| --- | --- |');
    lines.push(`| Artifact | \`${path.basename(report.artifact.path)}\` |`);
    lines.push(`| SHA-256 | \`${report.artifact.sha256}\` |`);
    lines.push(`| Artifact size | ${report.artifact.sizeBytes} bytes |`);
    lines.push(`| Packed version | ${report.artifact.packedManifest?.name ?? 'unknown'}@${report.artifact.packedManifest?.version ?? 'unknown'} |`);
    lines.push(`| Upstream storage version | ${report.artifact.packedManifest?.upstreamVersion ?? 'unknown'} |`);
    lines.push(`| Commit | ${report.environment.commit ?? 'unknown (not a git worktree)'} |`);
    lines.push(`| Browser | ${report.browser} |`);
    lines.push(`| Playwright | ${report.environment.toolPins.playwright} |`);
    lines.push(`| Vite pin | ${report.environment.toolPins.vite} |`);
    lines.push(`| Playwright browser path | ${report.environment.playwrightBrowsersPath ?? '(Playwright default cache)'} |`);
    lines.push(`| Node.js | ${report.environment.node} |`);
    lines.push(`| npm | ${report.environment.npm} |`);
    lines.push(`| Platform | ${report.environment.platform} ${report.environment.arch} |`);
    lines.push(`| Slice | ${report.slice} |`);
    lines.push(`| Started | ${report.startedAt} |`);
    lines.push(`| Finished | ${report.finishedAt} |`);
    lines.push('');
    lines.push('## Scenario results');
    lines.push('');
    lines.push('| Scenario | Slice | Status | Duration | Details |');
    lines.push('| --- | --- | --- | --- | --- |');
    for (const scenario of report.scenarios) {
        const details = scenario.error ? escapeCell(scenario.error) : escapeCell(scenario.details.join('; '));
        lines.push(`| \`${scenario.id}\` | ${scenario.slice} | ${scenario.status} | ${scenario.durationMs} ms | ${details || '-'} |`);
    }
    lines.push('');
    lines.push('## Counts');
    lines.push('');
    for (const [status, count] of Object.entries(report.counts)) {
        lines.push(`- ${status}: ${count}`);
    }
    lines.push('');
    lines.push('## Artifacts');
    lines.push('');
    if (report.artifacts.logs.length === 0 && report.artifacts.traces.length === 0) {
        lines.push('- No logs or traces were written.');
    }
    for (const logFile of report.artifacts.logs) {
        lines.push(`- Log: \`${logFile}\``);
    }
    for (const traceFile of report.artifacts.traces) {
        lines.push(`- Trace: \`${traceFile}\``);
    }
    lines.push('');
    lines.push('## Limitations');
    lines.push('');
    for (const limitation of report.limitations) {
        lines.push(`- ${limitation}`);
    }
    lines.push('');
    return lines.join('\n');
}

function escapeCell(value) {
    return String(value).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}
