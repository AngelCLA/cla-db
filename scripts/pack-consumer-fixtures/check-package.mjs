// CLA-DB: Check npm's real payload, not only the working-tree manifest.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootFiles = new Set([
    'package.json', 'README.md', 'LICENSE.txt', 'CHANGELOG.md', 'UPSTREAM.md',
    'babel.config.js'
]);
export const publishedTools = [
    'scripts/start-cloud-signaling-server.mjs',
    'scripts/cloud-signaling-script.sh',
    'scripts/acme-challenge/.gittouch'
];

export function checkPackage(metadata, pkg, payloadPaths) {
    const files = new Set(metadata.files.map(file => file.path));
    assert.deepEqual([...files].sort(), [...payloadPaths].sort(), 'npm metadata differs from tar payload');
    const unexpected = [...files].filter(file => !rootFiles.has(file) &&
        !/^(dist\/(cjs|esm|types|dbviewer)\/|src\/|plugins\/)/.test(file) &&
        !publishedTools.includes(file) && !/^(NOTICE|COPYING|LICENSE|AUTHORS|THIRD[-_]PARTY)/i.test(file));
    assert.deepEqual(unexpected, [], 'Unexpected development/local files in npm payload');
    const forbidden = [...files].filter(file => /(^|\/)(node_modules|AGENTS\.md|CLAUDE\.md|\.env(?:\..*)?|\.codegraph)(\/|$)/.test(file));
    assert.deepEqual(forbidden, [], 'Local metadata or sensitive filenames in npm payload');
    assert.equal(pkg.claDb.upstreamVersion, '17.6.0');
    assert.equal(Object.keys(pkg.exports).length, 56);
    const destinations = value => typeof value === 'string' ? [value] :
        value && typeof value === 'object' ? Object.values(value).flatMap(destinations) : [];
    for (const target of destinations(pkg.exports)) {
        assert.ok(!target.includes('*'), `Export pattern needs explicit coverage: ${target}`);
        assert.ok(files.has(target.replace(/^\.\//, '')), `Missing export: ${target}`);
    }
    for (const target of destinations(pkg.bin)) {
        assert.ok(files.has(target.replace(/^\.\//, '')), `Missing bin: ${target}`);
    }
    for (const required of ['LICENSE.txt', 'README.md', 'CHANGELOG.md', 'UPSTREAM.md', ...publishedTools]) {
        assert.ok(files.has(required), `Missing attribution or published tool: ${required}`);
    }
    for (const subpath of Object.keys(pkg.exports).filter(key => key.startsWith('./plugins/'))) {
        const plugin = subpath.slice('./plugins/'.length);
        for (const file of ['package.json', 'index.mjs', 'index.cjs', 'index.ts', 'index.d.mts', 'index.d.cts']) {
            assert.ok(files.has(`plugins/${plugin}/${file}`), `Missing legacy shim: ${plugin}/${file}`);
        }
    }
    console.log(`Package payload verification: PASS (${files.size} files, ${metadata.size} compressed / ${metadata.unpackedSize} unpacked bytes)`);
}

export function checkSourceMaps(packageDir) {
    let mapCount = 0;
    function visit(dir) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const file = path.join(dir, entry.name);
            if (entry.isDirectory()) visit(file);
            else if (file.endsWith('.map')) {
                mapCount++;
                const map = JSON.parse(fs.readFileSync(file, 'utf8'));
                for (const [index, source] of (map.sources || []).entries()) {
                    if (map.sourcesContent?.[index] != null) continue;
                    assert.ok(fs.existsSync(path.resolve(path.dirname(file), map.sourceRoot || '', source)),
                        `Missing source-map source: ${file}: ${source}`);
                }
            }
        }
    }
    visit(path.join(packageDir, 'dist'));
    assert.ok(mapCount > 0, 'Missing source maps');
    console.log(`Source-map sources verification: PASS (${mapCount} maps)`);
}
