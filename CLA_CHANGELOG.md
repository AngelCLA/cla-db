# CLA DB Changelog

This file tracks modifications specific to the CLA DB fork (`@clatech/db`).
For upstream RxDB history, see `CHANGELOG.md`.

## [0.1.2] - Candidate, Unpublished

This section records implemented candidate work, not a publication approval. npm latest remains `0.1.1`. Final suite, package measurements, and security totals belong to the release controller's T6 verification.

### Added

- Isolated packed-consumer integration coverage and cross-version Dexie reopen evidence for published CLA DB `0.1.1` and RxDB `17.6.0`, using fake IndexedDB. See [package evidence](./release/0.1.2/PACKAGE.md) and [compatibility evidence](./release/0.1.2/COMPATIBILITY.md).

### Changed

- Public package version is `0.1.2`; storage compatibility stays `17.6.0`. The foundation remains RxDB `17.6.0+522`, commit `9d5849cf4c695ffc27d60e134b2039539e77a9b0`.
- Nine upstream commits through `d08621c7e26859e017a78a9615f5951fd4803b18` were merged via `515bb00884` / `e41bc43cfb`, not cherry-picked. [UPSTREAM.md](./UPSTREAM.md#exact-012-ancestry) lists every hash. Original RxDB history stays in `CHANGELOG.md`.

### Fixed

- **Inherited upstream fixes:** `d8ab5eb220` handles primary keys such as `constructor` and `__proto__` during replication/migration; `f53c02d937` restores Google Drive/OneDrive WebRTC reconnect after restart; `31492a4972` prevents storing documents rejected by DOC20 through DOC23; `b3fc33f42c` closes replication change streams on pause and opens new ones on start. These are upstream changes, not CLA Tech implementations.
- **Fork-specific fixes:** dev-mode registration no longer invokes the inherited marketing iframe. Public documentation tracking callbacks are inert, including the conversion-worker path that lacked a hostname guard. Validation, Premium handling, links, and explicit viewer tooling are preserved.
- Correct the landing's malformed `createRxDatabase` call and supply missing imports, schema, reactive output, and cleanup. The check executes code extracted from rendered markup.

### Documentation

- Expand the Spanish landing with offline workflows, backend replication, storage options, and reactive data modeling. Link to CLA DB and upstream RxDB documentation.
- Refine the Spanish landing page hero and link its example button to the code sample.
- Put registry installation first in the consumer README, separate the candidate tarball preview, and provide runnable JavaScript/TypeScript, reactive, persistent, and custom replication examples.
- Document exact inherited SQLite trial restrictions: 500 live documents per instance, 500 counted internal `all()` calls, no query indexes or attachments. No unrestricted CLA SQLite adapter is included.
- Qualify platform and compatibility claims, document site responsibilities and residual integrations, and align the roadmap through `1.0.0` with external adapter packages.

### Testing

- T2/T3 focused evidence remains in their linked reports; it is not a fresh full-suite result. Cross-version reopen and benchmarks use simulated IndexedDB, not browser disk I/O.
- T4 observed RED/GREEN for automatic site conversions and the malformed displayed snippet. README and rendered landing examples passed in an isolated candidate installation. Landing structural checks, production build, and lint passed; Docusaurus built with inherited broken-anchor warnings. See [exact site evidence](./release/0.1.2/SITES.md).

### Distribution

- Explicit package allowlist preserves public exports, generated shims, source-map resources, license, attribution, and original history while excluding website, design, agent, and internal development files. Final rebuilt artifact totals remain pending; interim figures are in [PACKAGE.md](./release/0.1.2/PACKAGE.md).

### Known Limitations

- This is a pre-1.0 candidate. Real-browser durability, full runtime support, credentialed service integrations, final security/license disposition, and the final required suite are not certified by T4.
- The documentation build retains an inherited smartphone iframe pointing at `http://0.0.0.0:4200/` and a LinkedIn release-note embed. The standalone viewer retains hostname-guarded upstream conversion code. No zero-telemetry or deployment-wide audit claim is made. See [NETWORK_AUDIT.md](./release/0.1.2/NETWORK_AUDIT.md).

## [0.1.1] - 2026-11-25

- Bump the npm package version because npm does not allow publishing `0.1.0` again after it was unpublished.
- Exclude local tarballs and agent work files from npm packages.
- Keep the upstream base at RxDB `17.6.0+522` (`9d5849cf4c695ffc27d60e134b2039539e77a9b0`) and the on-disk compatibility version at `17.6.0`. No database runtime behavior changes.

## [0.1.0] - 2026-11-24

### Upstream Base
- **Upstream repository**: `https://github.com/pubkey/rxdb`
- **Upstream base**: RxDB `17.6.0+522`
- **Upstream commit**: `9d5849cf4c695ffc27d60e134b2039539e77a9b0` (2026-11-25)
- **Rationale for commit over tag `17.6.0` (`9d60a86373`)**: Includes 200 `src/` bugfixes post-17.6.0 covering Dexie `remove()` (`#9843`), duplicate schema migration execution (`#9827`), paused initial-sync push batch handling (`#9591`), replication conflict attachments (`#9671`), `incrementalUpsert()` ordering (`#9699`), and `localStorage` cleanup data-loss prevention (`#9475`), with zero breaking changes in core, storages, or replication.

### Added
- Fork technical documentation: `SYSTEM_DESIGN.md`, `ROADMAP.md`, `UPSTREAM.md`, `CLA_CHANGELOG.md`, `CONTRIBUTING.md`, plus updated `README.md` and `AGENTS.md`.
- CLA DB verification and benchmark suite (`test/unit/cla-db.test.ts`) covering 14, 20, 50, and 100 simultaneous collections, CRUD, reactive queries, persistence across restarts, bidirectional replication, conflict resolution, schema migration, and Dexie storage compatibility.
- Safe CLA DB GitHub Actions CI workflow (`.github/workflows/ci.yml`) running dependency install, lint, typecheck, build, memory and Dexie test suites, packed consumer validation, and Apache 2.0 license verification.

### Changed
- **Removed artificial collection limit**: Removed the `NON_PREMIUM_COLLECTION_LIMIT` (`COL23`) enforcement block in `src/rx-collection.ts` (`RxCollectionBase.prepare()`). Preserved `OPEN_COLLECTIONS` lifecycle tracking, `src/plugins/utils/utils-premium.ts` public exports, and all Premium flag utilities untouched to prevent API breakage and avoid falsifying Premium state.
- **Package identity (`@clatech/db`)**: Updated `package.json` metadata (`name`, `version: "0.1.0"`, `author: "CLA Tech"`, `repository`, `homepage`, `publishConfig.access: "public"`, and `claDb` upstream tracking metadata) and plugin shim naming in `scripts/generate-plugins-package-json.mjs`.
- **Decoupled `RXDB_VERSION` from fork SemVer**: Updated `scripts/update-version-variable.mjs` to read `package.json#claDb.upstreamVersion` (`"17.6.0"`) for `RXDB_VERSION` so on-disk compatibility checks (`DM5` in `src/rx-database-internal-store.ts`) remain compatible with RxDB 16/17 databases and future CLA DB `0.x -> 1.0` upgrades.
- Updated `test/unit/rx-collection.test.ts` to assert that opening more than `NON_PREMIUM_COLLECTION_LIMIT` collections succeeds without throwing `COL23`.
- Disabled `automerge` in `renovate.json`.

### Removed / Disabled
- Removed inherited upstream workflows that publish to npm, push docs/tags, ping Bing IndexNow for `rxdb.info`, notify `pubkey/rxdb-server`, or run upstream automation: `release.yml`, `notify-rxdb-server.yml`, `build.yml`, `cloudflare-pages.yml`, `main.yml`, `copilot-setup-steps.yml`, `reset-npm-cache.yml`, `test-without-fix.yml` (kept `prevent-commit-to-generated.yml`).

### Verification & Benchmarks (Node v22.23.2, npm 10.9.8, `--expose-gc`)

#### Multi-Collection Initialization & Heap Usage (`test/unit/cla-db.test.ts`, Ajv-validated storages)
| Collections | Memory Init (ms) | Memory Heap Delta (MB) | Dexie (`fake-indexeddb`) Init (ms) | Dexie Heap Delta (MB) |
| --- | --- | --- | --- | --- |
| 14 | 157.24 (cold JIT) | +6.78 | 25.02 | +6.47 |
| 20 | 3.78 | +1.83 | 15.55 | +7.82 |
| 50 | 7.92 | +4.42 | 31.05 | +7.31 |
| 100 | 12.63 | +8.65 | 57.44 | +14.79 |

Notes: Removing the artificial 13-collection cap does not remove physical memory or handle limits. Dexie/IndexedDB initialization time and heap footprint scale linearly with open collection count.

#### Executed Suites (All Passing)
- `npm run lint`: PASS (0 errors, 0 warnings)
- `npm run check-types`: PASS (`tsc --noEmit`)
- `npm run build`: PASS (289 CJS files, 289 ESM files, `.d.ts` types, 55 plugin shims, dbviewer bundle)
- `npm run test:typings`: PASS
- `npm run test:circular`: PASS (0 circular dependencies in core ESM, Dexie ESM, and tests)
- `npm run test:fast:memory`: PASS (1,894 passing, 0 failing; follow-up targeted `cla-db.test.ts` run: 14/14 passing including exact `claDb.upstreamVersion` and `OPEN_COLLECTIONS` cleanup invariant)
- `npm run test:fast:dexie`: PASS (1,898 passing, 0 failing)
- `node ./scripts/verify-pack-consumer.mjs`: PASS (`clatech-db-0.1.0.tgz`, 2223.5 KB; verified ESM, CommonJS, and TypeScript `NodeNext` compilation with 15 simultaneous collections, reactive queries, and Dexie restart persistence)

#### Suites Not Executed in This Environment (Recorded Honestly)
- `test:browser:*` (Karma/Chrome): Not executed because no browser binary/display server is configured in this headless shell environment.
- `test:replication-*` (CouchDB, MongoDB, Appwrite, Firestore, Supabase, FoundationDB, NATS): Not executed because external Docker/database service containers are not running in this environment.
- `test:bun:*` / `test:deno:*`: Not executed because Bun and Deno runtimes are not installed in this environment.

