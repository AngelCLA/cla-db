# CLA DB 0.1.2 Package Distribution

The package uses an explicit `package.json#files` allowlist. It retains all 56 export definitions and the exact storage compatibility version `17.6.0`. Public package version is `0.1.2`. Production and peer declarations are unchanged. The release adds root and web lockfiles, and a web-only development type dependency.

## Run The Consumer Check

```sh
npm pack --dry-run --json
node --check scripts/verify-pack-consumer.mjs
node ./scripts/verify-pack-consumer.mjs
```

Run from the repository with Node.js and npm available, plus the system `tar` command. The runner deliberately does **not** build. It packs existing `dist`, installs into a fresh system temporary directory, and removes that directory in `finally`, including on failure. Installation needs npm registry access. Runtime fixtures need no live database, replication server, or signaling service. Child commands have a three-minute timeout and clear `NODE_PATH` and `NODE_OPTIONS` to prevent repository module/preload leakage.

Observed runtime: Node.js `v24.22.3`, npm `11.19.1`. This is not a Node >=20 support-matrix result. Vite `6.4.1` is installed only in the disposable consumer, supports the Node 20 floor, and builds a browser-targeted library in memory without starting a server.

## Payload Decisions

| Retained | Reason |
| --- | --- |
| `dist/cjs`, `dist/esm`, `dist/types` | Existing public exports, declarations, and source maps |
| `plugins` | All generated legacy subpath shims, including CJS, ESM, and declaration variants |
| TypeScript/TSX under `src` | Source-map source files and distributed source compatibility |
| Flutter Dart `lib` and `pubspec.yaml` | Consumer-side Flutter integration resources, not its example or test project |
| `dist/dbviewer` | An allowlisted path; the audited tarball contains no viewer bundle. The build writes the standalone viewer under `docs-src/static/`. |
| `LICENSE.txt`, `README.md`, `UPSTREAM.md`, `CHANGELOG.md` | Original Apache license and copyright, fork attribution, upstream provenance, and original change history |
| Root license/NOTICE/COPYING/AUTHORS/third-party patterns | Preserve applicable notices when present |
| `babel.config.js` | Existing `.npmignore` explicitly records external package consumers of this config |
| Cloud signaling launcher, shell wrapper, and ACME placeholder | Existing published `cloud-signaling-server` command references these files and the legacy WebRTC shim |

The signaling tool is preserved, **not executed or certified operational**. It expects host-specific certificates and ports, and imports the existing development dependency `async-test-util`. No dependency promotion or behavior change was made. See the [dependency report](DEPENDENCIES.md).

Excluded: `web` and its nested dependencies, `design`, `.codegraph`, agent files, site sources, internal tests, release reports, tarballs, build/lint configs other than the documented Babel exception, and development scripts. Error-message generation, profiling, FoundationDB Docker setup, release/version automation, header generation, and documentation utilities are repository maintenance tasks, not runtime dependencies. The published `plugins/test-utils` export remains intact despite its name. There is no hard package size cap.

## Observed Measurements

All sizes are bytes, not rounded KB. Published 0.1.1 numbers were supplied by the parent from registry evidence. Local 0.1.1 is the parent's pre-change dry-run baseline, also observed leaking website content in this unit.

| Artifact | Compressed | Unpacked | Files |
| --- | ---: | ---: | ---: |
| Published 0.1.1 baseline | 2,270,333 | 12,889,867 | 2,110 |
| Local pre-change 0.1.1 baseline | 27,272,149 | 95,484,388 | 2,734 |
| Unpublished 0.1.2, clean locked build | 2,235,740 | 12,782,900 | 2,071 |
| Delta vs published | -34,593 | -106,967 | -39 |
| Delta vs local baseline | -25,036,409 | -82,701,488 | -663 |

Direct production dependencies remain **24**. A clean locked build of `34196d9ab5` plus the scoped Firestore gRPC override produced `clatech-db-0.1.2.tgz`. Its local copy is `release/0.1.2/clatech-db-0.1.2.grpc-0b96c9937518.tgz`, kept outside Git. Only `package.json` differs from the preceding package; the other `2,070` files are byte-identical. The preceding copies, `clatech-db-0.1.2.tgz` and `clatech-db-0.1.2.pre-ws-617c176b7891.tgz`, remain unchanged and are not the current candidate.

- SHA-256: `0b96c99375184786dae397b38dbbf7571bd38612a98ad4da20e9ad53e681fa56`
- npm SHA-1: `a059e3547acd6160dda3baa732b9068304334580`
- npm integrity: `sha512-v/6LZkvJ7IBE/73IFo0pM/9KcgGspaWHtgoE8lCE/l377KCUbnAuP9/sos1aIvSiIa5d7YxQelrMF6YC1kvO6A==`

The detached consumer checks and [production audit](DEPENDENCIES.md) passed against the clean build. This records the reviewed bytes; it does not establish byte-for-byte equivalence to the older published package or authorize publication.

## Proof And Limits

- **RED:** `npm pack --dry-run --json` exited 0 but exposed `web`, `design`, and `.codegraph`. The new real-tarball guard then exited 1 before installation with `Unexpected development/local files in npm payload` against the package without an allowlist.
- **GREEN:** The final focused runner exited 0. It compares real tar payload paths with npm JSON metadata, validates every literal export and any manifest `bin` destination (there is currently no `bin`), and checks required shims, attribution, tools, and forbidden local/sensitive filenames. Pattern exports intentionally fail until explicit coverage is added.
- **PRESERVE:** Existing ESM/CJS creation of 15 collections, CRUD reads/inserts, reactive query emission, Dexie close/reopen persistence, and TypeScript smoke coverage still pass. The previous TypeScript success message remains present. No shared helper is used by sibling commands, so a sibling-command baseline differential is not applicable.
- **Additional consumer proof:** NodeNext and Bundler type resolution, Vite browser bundling, installed graph without `rxdb`, schema version 0 to 1 migration on fake IndexedDB, and actual custom pull/push handlers all pass. CRUD update/delete coverage uses the returned immutable updated document snapshot. Source-map validation checked 578 maps and requires either embedded source content or an existing resolved source path.
- **Fixture corrections:** The first integration run exposed a stale-document `CONFLICT` in the new test; using the returned updated snapshot fixed it. The next run exposed Vite's array-of-bundles return shape; normalization fixed the assertion. The next complete runner passed all checks. These were fixture errors, not changes to production behavior.
- **License and content boundary:** `LICENSE.txt` retains Daniel Meyer and contributors' copyright. No separate upstream root NOTICE was found. No attribution or upstream history was rewritten. The final audit screened all payload files for specific sensitive patterns and inspected installed identities and license metadata. It is not a line-by-line proprietary-content or legal audit. See [DEPENDENCIES.md](DEPENDENCIES.md).
- **Storage boundary:** Reopening both published baselines passed in the separate [compatibility check](COMPATIBILITY.md), against a tarball with matching npm integrity. This does not prove real-browser persistence. The existing external smoke also checks the false Premium flag.
