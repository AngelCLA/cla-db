# CLA DB Changelog

This file tracks modifications specific to the CLA DB fork (`@clatech/db`).
For upstream RxDB history, see `CHANGELOG.md`.

## [0.1.3] - 2026-11-26 (Published)

Version `0.1.3` ("Universal Compatibility") is published as npm `latest`, verified on 2026-11-26. See [registry identity and historical local archive](./release/0.1.3/PACKAGE.md) and [publication evidence](./release/0.1.3/PUBLISHING.md).

### Verification

- Hosted CI, compatibility, and staging succeeded at revision `c4c06825382872af9551435cbbfeca0e661df565`; [run links](./release/0.1.3/CI.md). Earlier staging failures remain historical evidence.
- Local candidate reports record 123 consumer passes, 23 skips, 45 browser passes, and 30 simulated storage passes. These historical counts do not certify registry bytes, full Bun support, or crash/quota durability. See the [scoped matrix](./release/0.1.3/COMPATIBILITY.md).

### Added

- Package manager selector on the landing site (`web/src/components/Install.tsx`): npm, pnpm, Bun, modern Yarn, and Deno install commands for the single `@clatech/db` package, keyboard operable as a tablist with a copy control for the selected command. The section reuses the existing layout, tokens, and focus styles. Compatibility, runtime, and browser results are not claimed there; each target is reported only with its own evidence.

### Changed

- Align README, roadmap, release records, landing copy, and documentation version display with published `0.1.3`. The five manager commands remain install instructions, not per-manager support certification.
- Record the canonical repository/homepage as `https://github.com/AngelCLA/cla-db` and the independent-fork description. The GitHub description and homepage were applied separately and read back on 2026-11-26; topics were not changed.

## [0.1.2] - Published

Version `0.1.2` is a previous published release, superseded as npm `latest` by `0.1.3`. An earlier revision described it as an unpublished candidate before that state was corrected against the registry. Historical release evidence remains in `release/0.1.2/`.

### Added

- Isolated packed-consumer integration coverage and cross-version Dexie reopen evidence for published CLA DB `0.1.1` and RxDB `17.6.0`, using fake IndexedDB. See [package evidence](./release/0.1.2/PACKAGE.md) and [compatibility evidence](./release/0.1.2/COMPATIBILITY.md).

### Changed

- Public package version is `0.1.2`; storage compatibility stays `17.6.0`. The foundation remains RxDB `17.6.0+522`, commit `9d5849cf4c695ffc27d60e134b2039539e77a9b0`.
- Nine upstream commits through `d08621c7e26859e017a78a9615f5951fd4803b18` were merged via `515bb00884` / `e41bc43cfb`, not cherry-picked. [UPSTREAM.md](./UPSTREAM.md#exact-012-ancestry) lists every hash. Original RxDB history stays in `CHANGELOG.md`.
- Root and landing installs now use separate committed lockfiles. The Node 22 and 24 CI jobs use npm `11.19.1` for the root lockfile and check a packed consumer. The separate manual release workflow stages the vetted tarball; the maintainer approves public release in npm with 2FA.

### Fixed

- **Inherited upstream fixes:** `d8ab5eb220` handles primary keys such as `constructor` and `__proto__` during replication/migration; `f53c02d937` restores Google Drive/OneDrive WebRTC reconnect after restart; `31492a4972` prevents storing documents rejected by DOC20 through DOC23; `b3fc33f42c` closes replication change streams on pause and opens new ones on start. These are upstream changes, not CLA Tech implementations.
- **Fork-specific fixes:** dev-mode registration no longer invokes the inherited marketing iframe. Public documentation tracking callbacks are inert, including the conversion-worker path that lacked a hostname guard. Validation, Premium handling, links, and explicit viewer tooling are preserved.
- Correct the landing's malformed `createRxDatabase` call and supply missing imports, schema, reactive output, and cleanup. The check executes code extracted from rendered markup.

### Security

- Add the [security reporting policy](SECURITY.md) and a [manual publishing procedure](./release/0.1.2/PUBLISHING.md) using artifact hash verification, npm Trusted Publishing, and provenance. Only the staging job receives OIDC permission. It does not publish directly.
- Keep `rxdb-old@16.21.1` for migration tests while resolving its nested `ws` dependency to the existing root `8.23.0`. Remove the affected `ws@8.18.3` resolution without changing production dependencies.
- Resolve the development Firestore SDKs to `@grpc/grpc-js@1.13.6` without changing either Firebase version. Both SDKs passed loopback emulator checks and the Firestore replication suite passed all 11 tests.
- The separate development audit reports 26 moderate findings, zero high and zero critical, down from 31 findings before the two scoped fixes. The remaining issues require maintainer disposition before release. See the [dependency report](./release/0.1.2/DEPENDENCIES.md) and [CycloneDX SBOM](./release/0.1.2/sbom.cdx.json).

### Documentation

- Expand the Spanish landing with offline workflows, backend replication, storage options, and reactive data modeling. Link to CLA DB and upstream RxDB documentation.
- Refine the Spanish landing page hero and link its example button to the code sample.
- Put registry installation first in the consumer README, separate the candidate tarball preview, and provide runnable JavaScript/TypeScript, reactive, persistent, and custom replication examples.
- Document exact inherited SQLite trial restrictions: 500 live documents per instance, 500 counted internal `all()` calls, no query indexes or attachments. No unrestricted CLA SQLite adapter is included.
- Qualify platform and compatibility claims, document site responsibilities and residual integrations, and align the roadmap through `1.0.0` with external adapter packages.

### Testing

- The required local checks passed in clean locked copies on Node 24, including `1,918` Memory and `1,922` Dexie tests. The detached packed consumer passed its export, module, type, persistence, migration, and replication checks. See the [test report](./release/0.1.2/TESTS.md).
- Cross-version reopen and benchmarks use simulated IndexedDB, not browser disk I/O.
- T4 observed RED/GREEN for automatic site conversions and the malformed displayed snippet. README and rendered landing examples passed in an isolated candidate installation. Landing structural checks, production build, and lint passed; Docusaurus built with inherited broken-anchor warnings. See [exact site evidence](./release/0.1.2/SITES.md).

### Distribution

- Explicit package allowlist preserves public exports, generated shims, source-map resources, license, attribution, and original history while excluding website, design, agent, and internal development files. The [rebuilt tarball](./release/0.1.2/PACKAGE.md) contains `2,071` files, at `2,235,721` compressed and `12,782,832` unpacked bytes.

### Known Limitations

- This is a pre-1.0 candidate. Real-browser durability, the full Node engine range, and credentialed service integrations are not certified. The standalone viewer is not in the npm candidate; verify its third-party notices before separate redistribution.
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

