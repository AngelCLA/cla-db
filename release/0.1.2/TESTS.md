# CLA DB 0.1.2 Verification Report

The final local test source was commit `17169c81a52243c652978208e74eaddffce9487f`. The root and `web/` ran in a disposable `git archive` copy, with tracked lockfiles, fresh `npm ci --ignore-scripts --no-audit --no-fund`, and no shared `node_modules`. The runner used Linux, Node `24.22.3`, and npm `11.19.1`. This is local evidence, not GitHub Actions or publication evidence.

## Required Commands

| Check | Observed result |
| --- | --- |
| `npm run lint` | Exit 0 |
| `npm run build` | Exit 0; CommonJS, ESM, declarations, plugin shims, and standalone viewer build |
| `npm run check-types` | Exit 0 after `npm run build` in a fresh locked copy. Initial exit 2 was caused by running before declarations existed. |
| `npm run test:typings` | Exit 0 |
| `npm run test:circular` | Exit 0 |
| `npm run test:fast:memory` | Exit 0; `1,918` passing |
| `npm run test:fast:dexie` | Exit 0; `1,922` passing with simulated IndexedDB |
| `node ./scripts/verify-pack-consumer.mjs` | Exit 0; detached installation, all `56` exports, legacy shims, source maps, ESM/CJS, NodeNext/Bundler/Vite, CRUD, reactive queries, migration, and custom replication |

Before this run, archive extraction failed with exit 2 because `/tmp` had no free inodes. No install or test ran in that attempt. The clean verification used a disposable directory on a filesystem with free inodes. The failed `check-types` command used the wrong order for a clean checkout: tests import plugin shims that refer to generated `dist/types`. The corrected run confirmed the workflow's build-before-typecheck ordering without any source or test change.

## Targeted Evidence

- **Storage and replication:** The fast suites include existing coverage for `14`, `20`, `50`, and `100` collections, lifecycle cleanup, reopen, persistence, reactivity, bidirectional replication, conflicts, migration, and repeated pause/restart. The [compatibility report](COMPATIBILITY.md) records the registry baselines and benchmark method. A final rerun with the same npm integrity passed both baseline-to-candidate cases, each verifying `199` documents before candidate writes, reopen, and removal. None of the Dexie runs uses real browser disk I/O.
- **Privacy:** The dev-mode regression test ran in the Memory suite. Its deterministic browser-like fixture rejects the unsolicited connection path without changing Premium or validation. The [network audit](NETWORK_AUDIT.md) records explicit integrations and residual site embeds.
- **Sites:** Fresh web locked install, `npm --prefix web run check`, and `npm --prefix web run build` returned exit 0. Five README examples, the rendered landing example, and the Docusaurus production build were separately checked; the documentation build emitted inherited broken-anchor warnings. See [site evidence](SITES.md).
- **CI:** The workflow policy fixture passed, including YAML parsing and six negative mutations. Independent inspection confirmed manual-only publication, same-run artifact download, hash/manifest gating, and job-scoped OIDC. `actionlint` was unavailable. A further independent probe batch was denied and was not executed or retried.
- **Supply chain and bytes:** See [package inventory](PACKAGE.md), [SBOM](sbom.cdx.json), and [separate production and development audit results](DEPENDENCIES.md). The development audit is not a passing check.

## Not Run Or Not Established

| Scope | Why it is open | Release disposition |
| --- | --- | --- |
| Node 20 engine floor and Node 22 runtime; GitHub-hosted Node 22/24 matrix | Local run used Node 24 only; no remote workflow was executed | Do not claim those runtimes are verified. Obtain CI evidence on the reviewed protected revision before publication. |
| Real Chromium, Firefox, and WebKit IndexedDB and deployed site checks | No real-browser suite was run; a Firefox version probe is not a test | Not required for this local candidate review. Do not claim real-browser durability or deployed visual, accessibility, and traffic verification. |
| Full Node, alternate runtime, and credentialed service integration suites | No isolated native/service setup or credentials for those suites were exercised | Not part of the minimum local suite. Do not claim service or platform certification. |
| Viewer third-party notices | Generated viewer is absent from the npm payload; bundled notices and font terms remain unverified | Blocks separate viewer redistribution. Does not by itself block review of the npm candidate. |
| Development audit and license disposition; protected environment and npm publisher configuration | Known findings remain; no settings were inspected or activated remotely | Outstanding before dispatch or publication. See [publishing procedure](PUBLISHING.md). |
