# CLA DB 0.1.2 Supply-Chain Evidence

The tested production consumer has zero known npm advisories. The locked full development graph has **31 package findings: 25 moderate, 6 high, zero critical**. Neither result certifies absence of vulnerabilities. No mass updates, audit fixes, new production dependencies, or Premium policy changes were made.

## Exact Artifact And Reproduction

Observed on November 25, 2026 with Node `24.22.3` / npm `11.19.1`, from HEAD `a6a205a9b7` and existing generated package output. This is a real local candidate, not a registry publication or the final T6 rebuilt release.

| Identity | Observed value |
| --- | --- |
| Filename / manifest | `clatech-db-0.1.2.tgz` / `@clatech/db@0.1.2` |
| SHA-256 | `617c176b7891e986f41e9f72963a829dc0f279898c2936d1bde95716ca55715b` |
| npm SHA-512 integrity | `sha512-Oojb4/ml/VoCgYZCG8goCOab9KKNbPGAC3XqUi1T1myMc8gXKozh5LyvXGczhHhUSMGJva5PInah6fTwQO2wxA==` |
| Compressed / unpacked bytes | `2,235,705` / `12,782,757` |
| Payload files | `2,071` |

Run the commands in [PUBLISHING.md](PUBLISHING.md). The artifact checker creates and removes a detached system-temporary consumer, clears module/preload overrides, installs the actual tarball plus `rxjs@7.8.2` with scripts disabled, inspects installed manifest identities and lock resolutions/integrities, runs `npm audit --json --omit=dev`, then generates `npm sbom --omit=dev --sbom-format=cyclonedx`. [sbom.cdx.json](sbom.cdx.json) is npm's CycloneDX 1.5 graph with the tarball hashes added to its CLA DB component. It includes the consumer envelope and 75 installed components, not merely a manifest dependency list. Optional plugin peers not selected by this consumer are not certified.

Validation checks the format/version fields, component count against installed lock entries, unique component references, dependency-edge reference closure, candidate identity, and actual tarball hash. This is structural graph validation, not validation against a downloaded official JSON schema. The SBOM timestamp and local distribution URL identify this observation; future resolutions and artifact bytes require new evidence. The earlier parent snapshot counted 73 production, 1 optional, and 2 peer entries. This recheck reports npm counts of 75 production, 1 optional, zero peer, total 75. npm classifications overlap; do not sum them or substitute the earlier snapshot.

## Production Licenses And Install Behavior

All 24 direct production declarations retain their exact versions. Installed license metadata is MIT except these direct identities:

| Direct identity | Declared license |
| --- | --- |
| `array-push-at-sort-position@5.0.0` | Apache-2.0 |
| `custom-idle-queue@5.0.2` | Apache-2.0 |
| `dexie@4.4.2` | Apache-2.0 |
| `js-base64@3.9.6` | BSD-3-Clause |
| `jsonschema-key-compression@1.7.0` | ISC |
| `nostr-tools@2.26.1` | Unlicense |

The SBOM records every direct/transitive name, version, license, package URL, available registry hashes, and graph edges. The 75 installed identities, including CLA DB and the selected RxJS peer, declare MIT (61), Apache-2.0 (6), ISC (3), BSD-3-Clause (3), Unlicense (1), and 0BSD (1). The checker rejects missing or unreviewed production license expressions, `rxdb-premium`, and actual installed `rxdb` identities, including aliases whose manifest names differ from their directory names. Package names alone are not the license or vulnerability decision. For example, the consumer contains both Babel runtime 8.1.2 and nested 7.29.7; the full development audit also names Babel runtime, but that does not establish an advisory on these consumer identities.

No production lock entry had an install lifecycle script. npm warned that `crypto-js@4.2.0`, `defekt@9.3.0`, and `get-graphql-from-jsonschema@8.1.0` are deprecated or unsupported. Zero advisories does not remove maintenance risk. Metadata is not a legal opinion or a line-by-line license provenance audit. Dependencies are installed separately, not vendored wholesale into this tarball; retain their license files when redistributing them or making application bundles.

## Development And Build Graph Risks

The new root lock was generated in a clean manifest directory using `npm install --package-lock-only --ignore-scripts --no-audit --no-fund`. Its full `npm audit --json` exits **1**, reproducing 31 findings across 2,090 resolved entries, including platform-specific optional entries that are not all installed on this host. The collector exits 0 when collecting that result successfully, and preserves `auditExit: 1` in its output.

High-severity package names are `@firebase/firestore`, `@firebase/firestore-compat`, `@grpc/grpc-js`, `firebase`, `rxdb`, and `ws`. The old `rxdb@16.21.1` identity is the declared development alias `rxdb-old`, used by migration tests, not an installed production dependency of the candidate. Old nested WebSocket graphs differ from direct production `ws@8.23.0`. The full graph also reports Babel runtime, AJV, event-reduce, Firebase CLI/service tooling, TypeScript ESLint tooling, Mocha, Karma webpack, glob/minimatch, and archive utilities. Build-service paths are **not proven safe or unreachable**. CI surfaces this audit as a nonblocking warning so the pre-existing baseline remains visible; release approval still requires a maintainer's explicit disposition.

`npm outdated --json` in the clean installed root graph exits 1 and reports 34 direct entries behind registry latest, including `firebase` 13.3.0 → 13.4.0, `firebase-tools` 15.36.0 → 15.37.0, and TypeScript 6.0.3 → 7.0.2. These are point-in-time comparisons, not upgrade recommendations. `rxdb-old` remains necessary for migration tests, `node-datachannel` for WebRTC tests, and the old Opera launcher is still referenced by Karma configuration. The `pre-commit` hook installer and older browser launchers are candidates for a separate necessity review, not proven unused packages to remove here.

The root lock flags install scripts for `@firebase/util` (1.15.3 and nested 1.12.1), `core-js@3.51.0`, `esbuild@0.28.2`, `fsevents@2.3.3`, `pre-commit@2.0.0`, `protobufjs@7.6.6`, `re2@1.27.2`, and `rxdb@16.21.1`. Clean root and web installs used `--ignore-scripts`; root and web production builds and the root-dependent web check passed without enabling these scripts. This does not prove native integration suites work with scripts suppressed.

Root lock license metadata includes LGPL-3.0-or-later and mixed expressions for Sharp/libvips platform binaries, `MPL 2.0` for node-datachannel/platform binaries, MPL-2.0 for postcss-values-parser, and CC-BY licenses for caniuse-lite and spdx-exceptions. Missing license metadata is recorded as UNKNOWN for `fuzzy@0.1.3`, `querystring-es3@0.2.1`, and `valid-url@1.0.9`, not silently approved. The lock preserves direct/transitive expressions, including noncanonical strings and OR choices; legal disposition and any redistribution duties for development binaries remain open. They are not in this production consumer SBOM.

## Content, Attribution, And Viewer Boundary

All 2,071 actual payload files were screened without printing matching contents. Checks rejected sensitive/local filenames and high-specificity private-key, npm token, GitHub token, and AWS access-key patterns. There were zero alerts. This is limited pattern screening, not proof that no secret or proprietary material can exist. The production identity check found no RxDB Premium or original RxDB package; legitimate RxDB compatibility names and attribution remain.

`LICENSE.txt` retains Apache 2.0 and Daniel Meyer/contributors' copyright. Original `CHANGELOG.md` and `UPSTREAM.md` remain in the tarball. The previously inspected upstream base and current tracked inventory have no separate NOTICE. No original history, attribution, or license was rewritten. No new NOTICE is justified merely because the dependency graph contains Apache packages.

The actual tarball contains **no `dist/dbviewer/` bundle**. The root build instead writes the viewer to `docs-src/static/db-viewer/index.html`. That separate generated HTML embeds React/ReactDOM, the simple-peer browser bundle, and an Atkinson font-face extracted from CSS; its build uses `legalComments: 'none'`. No font license file was found under the tracked docs source. Preservation of bundled MIT notices and font redistribution terms has not been demonstrated. Before hosting or adding that HTML to the npm payload, inspect the exact bundle and upstream font license and supply applicable third-party notices. This is an unresolved blocker for certifying viewer redistribution, not evidence that the inspected npm tarball needs a fabricated NOTICE. No site deployment or separate Docusaurus license audit is claimed here.

The shipped legacy signaling launcher is retained but not run: it imports development-only `async-test-util` and expects host certificates and privileged ports for `signaling.rxdb.info`. It is not operationally certified or ready for a production-only consumer installation. No dependency was promoted to hide that limitation.

## Coverage And Disposition

The approved web-only change adds development Node type declarations that a fresh standalone build lacked. Root and web locks passed disposable `npm ci`; root build, standalone web build, and web check passed on Node 24.22.3. CI now selects Node 22/24 maintained LTS lines; the retained `>=20` engine floor and remote matrix have not been validated here. Full release suites remain T6-owned. Remote release settings/provenance, production plugin peers, complete secret detection, and viewer notice compliance are unavailable proof, not passing checks.

These changes cover T5 portions of S10-S12/S14-S16. Known development findings, deprecations, and metadata gaps are documented residual risks, not permission to publish. Final release-suite evidence, root `CLA_CHANGELOG.md`/roadmap consolidation, and any scope addition for bundled viewer notices remain parent-owned.
