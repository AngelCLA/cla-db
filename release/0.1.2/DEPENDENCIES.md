# CLA DB 0.1.2 Supply-Chain Evidence

The tested production consumer has zero known npm advisories. The locked full development graph has **30 package findings: 25 moderate, 5 high, zero critical**. Neither result certifies absence of vulnerabilities. No mass updates, audit fixes, new production dependencies, or Premium policy changes were made.

## Exact Artifact And Reproduction

Observed with Node `24.22.3` / npm `11.19.1` in a clean locked copy of `66bf60dc4d` plus the scoped legacy test override. The adopted tarball was audited in a detached consumer. Only the packaged manifest differs from the prior audited tarball; see [PACKAGE.md](PACKAGE.md). Neither tarball was published.

| Identity | Observed value |
| --- | --- |
| Filename / manifest | `clatech-db-0.1.2.tgz` / `@clatech/db@0.1.2` |
| SHA-256 | `6bcb34477e02c14da4e54a8993716f5a72b6d309c9b6d6b7dd7a494f2c40b1ed` |
| npm SHA-512 integrity | `sha512-wxzD6ywJfK/jY6AqlX4Canvnvp57yBsltl1Qx2DXEuTqXR3/gEWhx9NgF829oCDO6xk55x0F5rY1VwXP+yGC/A==` |
| Compressed / unpacked bytes | `2,235,721` / `12,782,832` |
| Payload files | `2,071` |

Run the commands in [PUBLISHING.md](PUBLISHING.md). The artifact checker creates and removes a detached system-temporary consumer, clears module/preload overrides, installs the actual tarball plus `rxjs@7.8.2` with scripts disabled, inspects installed manifest identities and lock resolutions/integrities, runs `npm audit --json --omit=dev`, then generates `npm sbom --omit=dev --sbom-format=cyclonedx`. [sbom.cdx.json](sbom.cdx.json) is npm's CycloneDX 1.5 graph with the tarball hashes added to its CLA DB component. It includes the consumer envelope and 75 installed components, not merely a manifest dependency list. Optional plugin peers not selected by this consumer are not certified.

Validation checks the format/version fields, component count against installed lock entries, unique component references, dependency-edge reference closure, candidate identity, and actual tarball hash. This is structural graph validation, not validation against a downloaded official JSON schema. The checked-in SBOM records the SHA-256 of the adopted tarball, 75 installed components, and 76 dependency records. Its timestamp and local distribution URL identify the detached run that produced it. Future resolutions and artifact bytes require new evidence. The earlier parent snapshot counted 73 production, 1 optional, and 2 peer entries. This recheck reports npm counts of 75 production, 1 optional, zero peer, total 75. npm classifications overlap; do not sum them or substitute the earlier snapshot.

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

The original lock audit found 31 issues, including 6 high. After removing the legacy nested `ws@8.18.3` resolution, `npm audit --package-lock-only --ignore-scripts --json` still exits **1**, with 30 issues, including 5 high. The collector exits 0 when collection succeeds and preserves `auditExit: 1` in its output.

The development alias `rxdb-old` still resolves `rxdb@16.21.1` for migration tests. The scoped override makes it use the existing root `ws@8.23.0`, removing the [legacy `ws` advisory](https://github.com/advisories/GHSA-96hv-2xvq-fx4p) from the graph. The lock drops only that nested node; no other resolution or production declaration changes. A clean `npm ci` and the resolution fixture verified the installed graph.

The remaining high rows are `@firebase/firestore`, `@firebase/firestore-compat`, `@grpc/grpc-js`, `firebase`, and `rxdb`. They still trace to the [gRPC advisory](https://github.com/advisories/GHSA-m9gg-hp2v-232j) under Firestore. Firestore declares `@grpc/grpc-js ~1.9.0`, which does not admit the `1.13.6` fix. This update does not change gRPC or validate its integration path. The full graph also reports Babel runtime, AJV, event-reduce, Firebase CLI/service tooling, TypeScript ESLint tooling, Mocha, Karma webpack, glob/minimatch, and archive utilities. Build-service paths are **not proven safe or unreachable**. CI surfaces this audit as a nonblocking warning so the pre-existing baseline remains visible; release approval still requires a maintainer's explicit disposition.

`npm outdated --json` in the clean installed root graph exits 1 and reports 34 direct entries behind registry latest, including `firebase` 13.3.0 → 13.4.0, `firebase-tools` 15.36.0 → 15.37.0, and TypeScript 6.0.3 → 7.0.2. These are point-in-time comparisons, not upgrade recommendations. `rxdb-old` remains necessary for migration tests, `node-datachannel` for WebRTC tests, and the old Opera launcher is still referenced by Karma configuration. The `pre-commit` hook installer and older browser launchers are candidates for a separate necessity review, not proven unused packages to remove here.

The root lock flags install scripts for `@firebase/util` (1.15.3 and nested 1.12.1), `core-js@3.51.0`, `esbuild@0.28.2`, `fsevents@2.3.3`, `pre-commit@2.0.0`, `protobufjs@7.6.6`, `re2@1.27.2`, and `rxdb@16.21.1`. Clean root and web installs used `--ignore-scripts`; root and web production builds and the root-dependent web check passed without enabling these scripts. This does not prove native integration suites work with scripts suppressed.

Root lock license metadata includes LGPL-3.0-or-later and mixed expressions for Sharp/libvips platform binaries, `MPL 2.0` for node-datachannel/platform binaries, MPL-2.0 for postcss-values-parser, and CC-BY licenses for caniuse-lite and spdx-exceptions. The lock lacks a normalized license field for `fuzzy@0.1.3`, `querystring-es3@0.2.1`, and `valid-url@1.0.9`. Their exact registry tarballs match the lock integrity and contain MIT terms in `LICENSE-MIT`, `License.md`, and `LICENSE`, respectively. This evidence does not resolve separate redistribution duties. The lock preserves direct/transitive expressions, including noncanonical strings and OR choices; legal disposition and any redistribution duties for development binaries remain open. They are not in this production consumer SBOM.

## Content, Attribution, And Viewer Boundary

All 2,071 actual payload files were screened without printing matching contents. Checks rejected sensitive/local filenames and high-specificity private-key, npm token, GitHub token, and AWS access-key patterns. There were zero alerts. This is limited pattern screening, not proof that no secret or proprietary material can exist. The production identity check found no RxDB Premium or original RxDB package; legitimate RxDB compatibility names and attribution remain.

`LICENSE.txt` retains Apache 2.0 and Daniel Meyer/contributors' copyright. Original `CHANGELOG.md` and `UPSTREAM.md` remain in the tarball. The previously inspected upstream base and current tracked inventory have no separate NOTICE. No original history, attribution, or license was rewritten. No new NOTICE is justified merely because the dependency graph contains Apache packages.

The actual tarball contains **no `dist/dbviewer/` bundle**. The root build instead writes the viewer to `docs-src/static/db-viewer/index.html`. That separate generated HTML embeds React/ReactDOM, the simple-peer browser bundle, and an Atkinson font-face extracted from CSS; its build uses `legalComments: 'none'`. No font license file was found under the tracked docs source. Preservation of bundled MIT notices and font redistribution terms has not been demonstrated. Before hosting or adding that HTML to the npm payload, inspect the exact bundle and upstream font license and supply applicable third-party notices. This is an unresolved blocker for certifying viewer redistribution, not evidence that the inspected npm tarball needs a fabricated NOTICE. No site deployment or separate Docusaurus license audit is claimed here.

The shipped legacy signaling launcher is retained but not run: it imports development-only `async-test-util` and expects host certificates and privileged ports for `signaling.rxdb.info`. It is not operationally certified or ready for a production-only consumer installation. No dependency was promoted to hide that limitation.

## Coverage And Disposition

The approved web-only change adds development Node type declarations that a fresh standalone build lacked. Root and web locks passed disposable `npm ci`; root build, standalone web build, and web check passed on Node 24.22.3. CI now selects Node 22/24 maintained LTS lines; the retained `>=20` engine floor and remote matrix have not been validated here. The [local test report](TESTS.md) records the required suite. Remote release settings and provenance, optional production plugin peers, complete secret detection, and viewer notice compliance were not validated.

Known development findings, deprecations, and metadata gaps require maintainer disposition before publication. Viewer notices need a separate review before viewer redistribution.
