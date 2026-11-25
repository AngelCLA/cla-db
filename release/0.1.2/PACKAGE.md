# CLA DB 0.1.2 Package Distribution

The package uses an explicit `package.json#files` allowlist. It retains all 56 export definitions and the exact storage compatibility version `17.6.0`. Public package version is `0.1.2`. No production, peer, or development dependency declarations or lockfiles changed in this unit.

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
| `dist/dbviewer` | Built viewer runtime resources when generated, not website source |
| `LICENSE.txt`, `README.md`, `UPSTREAM.md`, `CHANGELOG.md` | Original Apache license and copyright, fork attribution, upstream provenance, and original change history |
| Root license/NOTICE/COPYING/AUTHORS/third-party patterns | Preserve applicable notices when present |
| `babel.config.js` | Existing `.npmignore` explicitly records external package consumers of this config |
| Cloud signaling launcher, shell wrapper, and ACME placeholder | Existing published `cloud-signaling-server` command references these files and the legacy WebRTC shim |

The signaling tool is preserved, **not executed or certified operational**. It expects host-specific certificates and ports, and imports the existing development dependency `async-test-util`. No dependency promotion or behavior change was made. T5 should assess tooling dependency/license requirements separately.

Excluded: `web` and its nested dependencies, `design`, `.codegraph`, agent files, site sources, internal tests, release reports, tarballs, build/lint configs other than the documented Babel exception, and development scripts. Error-message generation, profiling, FoundationDB Docker setup, release/version automation, header generation, and documentation utilities are repository maintenance tasks, not runtime dependencies. The published `plugins/test-utils` export remains intact despite its name. There is no hard package size cap.

## Observed Measurements

All sizes are bytes, not rounded KB. Published 0.1.1 numbers were supplied by the parent from registry evidence. Local 0.1.1 is the parent's pre-change dry-run baseline, also observed leaking website content in this unit.

| Artifact | Compressed | Unpacked | Files |
| --- | ---: | ---: | ---: |
| Published 0.1.1 baseline | 2,270,333 | 12,889,867 | 2,110 |
| Local pre-change 0.1.1 baseline | 27,272,149 | 95,484,388 | 2,734 |
| Interim 0.1.2, existing built output | 2,232,799 | 12,774,831 | 2,071 |
| Interim delta vs published | -37,534 | -115,036 | -39 |
| Interim delta vs local baseline | -25,039,350 | -82,709,557 | -663 |

Direct production dependencies remain **24**. These are **interim** measurements from the real pack used by the passing runner. Source changes are happening in parallel, so packaged source and built output can differ. T6 must rebuild, repeat the dry run and consumer runner, and replace these with final candidate measurements. This report does not certify the final release candidate or compare every byte with the published tarball.

## Proof And Limits

- **RED:** `npm pack --dry-run --json` exited 0 but exposed `web`, `design`, and `.codegraph`. The new real-tarball guard then exited 1 before installation with `Unexpected development/local files in npm payload` against the package without an allowlist.
- **GREEN:** The final focused runner exited 0. It compares real tar payload paths with npm JSON metadata, validates every literal export and any manifest `bin` destination (there is currently no `bin`), and checks required shims, attribution, tools, and forbidden local/sensitive filenames. Pattern exports intentionally fail until explicit coverage is added.
- **PRESERVE:** Existing ESM/CJS creation of 15 collections, CRUD reads/inserts, reactive query emission, Dexie close/reopen persistence, and TypeScript smoke coverage still pass. The previous TypeScript success message remains present. No shared helper is used by sibling commands, so a sibling-command baseline differential is not applicable.
- **Additional consumer proof:** NodeNext and Bundler type resolution, Vite browser bundling, installed graph without `rxdb`, schema version 0 to 1 migration on fake IndexedDB, and actual custom pull/push handlers all pass. CRUD update/delete coverage uses the returned immutable updated document snapshot. Source-map validation checked 578 maps and requires either embedded source content or an existing resolved source path.
- **Fixture corrections:** The first integration run exposed a stale-document `CONFLICT` in the new test; using the returned updated snapshot fixed it. The next run exposed Vite's array-of-bundles return shape; normalization fixed the assertion. The next complete runner passed all checks. These were fixture errors, not changes to production behavior.
- **License boundary:** `LICENSE.txt` retains Daniel Meyer and contributors' copyright. The recorded upstream base root and current tracked file inventory contain no separate NOTICE file. No attribution or upstream history was rewritten. This is not a full third-party license or proprietary-content audit; T5/T6 retain that responsibility. Filename screening is not a secret-content scan.
- **Remaining proof:** T3 owns reopening data created by published CLA DB 0.1.1 and compatible RxDB. This same-version fake IndexedDB test does not prove cross-version reopening or real-browser persistence. T6 owns the rebuilt package, full required suite, and final artifact inspection. S2 lifecycle and Premium invariants are not modified here; the existing external smoke still checks a false Premium flag.

This unit covers distribution portions of S2, S4-S6, S11-S12, and the schema-valid changelog entry portion of S15. Root `CLA_CHANGELOG.md` and roadmap changes remain parent-owned and were not edited.
