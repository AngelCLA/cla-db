# CLA DB 0.1.2 Verification Report

The current tarball was verified in a disposable copy of `34196d9ab5` plus the scoped Firestore gRPC manifest and lock change, with fresh `npm ci --ignore-scripts --no-audit --no-fund` and no shared `node_modules`. The web results come from the earlier clean locked run at `17169c81a5`; no web sources or lockfiles changed. The runner used Linux, Node `24.22.3`, and npm `11.19.1`. This is local evidence, not GitHub Actions or publication evidence.

## Required Commands

| Check | Observed result |
| --- | --- |
| `npm run lint` | Exit 0 |
| `npm run build` | Exit 0; CommonJS, ESM, declarations, plugin shims, and standalone viewer build |
| `npm run check-types` | Exit 0 after `npm run build` in a fresh locked copy. Initial exit 2 was caused by running before declarations existed. |
| `npm run test:typings` | Exit 0 |
| `npm run test:circular` | Exit 0 |
| `npm run test:fast:memory -- --jobs 2` | Exit 0; `1,833` passing |
| `npm run test:fast:dexie -- --jobs 2` | Exit 0; `1,837` passing with simulated IndexedDB |
| `node ./scripts/verify-pack-consumer.mjs` | Exit 0; detached installation, all `56` exports, legacy shims, source maps, ESM/CJS, NodeNext/Bundler/Vite, CRUD, reactive queries, migration, and custom replication |

Before this run, archive extraction failed with exit 2 because `/tmp` had no free inodes. No install or test ran in that attempt. The clean verification used a disposable directory on a filesystem with free inodes. The failed `check-types` command used the wrong order for a clean checkout: tests import plugin shims that refer to generated `dist/types`. The corrected run confirmed the workflow's build-before-typecheck ordering without any source or test change.

The first full run for the gRPC candidate was stopped after the GraphQL suite received `Upgrade Required` instead of JSON and the runner hung. A filtered run failed before exercising the case because it skipped the test's initialization. Both full suite commands completed with two workers and passed the previously failing case without source or test changes. The previous candidate had `1,918` Memory and `1,922` Dexie passes under its run configuration. Do not treat the counts as interchangeable.

## Targeted Evidence

- **Firestore development provider:** `node scripts/release-supply-chain-fixtures/firestore-grpc-resolution.mjs` failed on `1.9.16` and passed after a clean locked install of `1.13.6`. The current and legacy Firebase SDKs each wrote, read from the server, and deleted a document against the loopback emulator. The existing Firestore replication suite passed `11` tests with the same lock, Java `21.0.13.1`, an isolated CLI home, and a `demo-cla-db` project ID. A long temporary path caused a Unix socket `EINVAL` in the first run; shortening that path passed without changing code or tests. Build and type checking passed when the disposable checkout was outside `node_modules`.
- **Legacy migration resolution:** `node scripts/release-supply-chain-fixtures/legacy-ws-resolution.mjs` failed against the old lock (`8.18.3` instead of `8.23.0`) and passed with the updated clean install. It checks both the locked graph and actual module resolution. `rxdb-old@16.21.1` and the root `ws@8.23.0` stay fixed.
- **Storage and replication:** The fast suites include existing coverage for `14`, `20`, `50`, and `100` collections, lifecycle cleanup, reopen, persistence, reactivity, bidirectional replication, conflicts, migration, and repeated pause/restart. The [compatibility report](COMPATIBILITY.md) records the registry baselines and benchmark method. A final rerun with the same npm integrity passed both baseline-to-candidate cases, each verifying `199` documents before candidate writes, reopen, and removal. None of the Dexie runs uses real browser disk I/O.
- **Privacy:** The dev-mode regression test ran in the Memory suite. Its deterministic browser-like fixture rejects the unsolicited connection path without changing Premium or validation. The [network audit](NETWORK_AUDIT.md) records explicit integrations and residual site embeds.
- **Sites:** Fresh web locked install, `npm --prefix web run check`, and `npm --prefix web run build` returned exit 0. Five README examples, the rendered landing example, and the Docusaurus production build were separately checked; the documentation build emitted inherited broken-anchor warnings. See [site evidence](SITES.md).
- **CI:** [The first review-branch run](https://github.com/AngelCLA/cla-db/actions/runs/45762679615) passed the site and Node 24 jobs. Node 22 failed before tests: npm `10.9.9` reported `EUSAGE` and expected `typescript@5.9.3` in the lockfile. Node `22.23.5` reproduced the error locally. With npm `11.19.1` and unchanged manifest and lockfile, installation, build, type checks, both resolution probes, Memory and Dexie passed. The verify matrix now pins that npm version; the site and publication workflows are unchanged. The exact pin step passed on both local Node versions. The workflow policy fixture checks the pin and passed its publication probes. `actionlint` and the configured independent verifier were unavailable; the maintainer confirmed review of the CI-only diff before the corrective push.
- **Supply chain and bytes:** See [package inventory](PACKAGE.md), [SBOM](sbom.cdx.json), and [separate production and development audit results](DEPENDENCIES.md). The development audit is not a passing check.
- **Independent review of the development overrides:** The legacy `ws` verifier stopped with `ENOSPC`. The maintainer reviewed that diff and confirmed its artifact hash against the SBOM. The Firestore gRPC verifier also failed to start with `ENOSPC` and returned no verdict. It was not retried. The maintainer confirmed review of the scoped gRPC diff and the candidate tarball hash against the SBOM before the review-branch push.

## Not Run Or Not Established

| Scope | Why it is open | Release disposition |
| --- | --- | --- |
| Node 20 engine floor and GitHub-hosted Node 22/24 matrix on the final revision | Local Node 22 and 24 runs passed with npm 11. The first review-branch run failed at the Node 22 install with npm 10. | Confirm the corrective CI run and obtain CI evidence on the reviewed protected revision before publication. |
| Real Chromium, Firefox, and WebKit IndexedDB and deployed site checks | No real-browser suite was run; a Firefox version probe is not a test | Not required for this local candidate review. Do not claim real-browser durability or deployed visual, accessibility, and traffic verification. |
| Full Node, alternate runtime, and credentialed service integration suites | No isolated native/service setup or credentials for those suites were exercised | Not part of the minimum local suite. Do not claim service or platform certification. |
| Viewer third-party notices | Generated viewer is absent from the npm payload; bundled notices and font terms remain unverified | Blocks separate viewer redistribution. Does not by itself block review of the npm candidate. |
| Development audit and license disposition; protected environment and npm publisher configuration | Known findings remain; read-only checks found `master` unprotected and no `npm-release` environment, and npm Trusted Publishing is unverified | Outstanding before dispatch or publication. See [publishing procedure](PUBLISHING.md). |
