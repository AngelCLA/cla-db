# CLA DB 0.1.2 Storage Compatibility Evidence

**Both published baselines passed the sequential Dexie reopen check against the fresh 0.1.2 tarball.** This is public-API evidence using fake-indexeddb, not proof of real-browser disk durability or complete storage compatibility. No core changes were made.

## Reproduce

Use the already rebuilt candidate output, Node.js, npm, and access to the public npm registry:

```bash
node ./scripts/verify-storage-compat.mjs
node ./scripts/verify-storage-compat.mjs --benchmark
```

The first command is a pass/fail compatibility check. The second produces local timing samples, not a performance gate. Both commands exited `0` on their final runs. Each packs the current built output afresh without lifecycle scripts. Rebuild before running when source changes. This unit used the rebuilt output supplied by the release controller and did not rebuild or alter staged package files.

The runner follows `scripts/verify-pack-consumer.mjs` conventions: a fresh system temporary tree, independent consumer manifests, npm installation, explicit fixture copying, disabled `NODE_PATH`/`NODE_OPTIONS`, and teardown in `finally`. The npm cache and install logs also live in that tree. Installs use `--ignore-scripts --no-audit --no-fund` and `https://registry.npmjs.org`. No repository manifest, lockfile, production dependency, or package shim is changed. Upstream RxDB is installed only into its temporary baseline project, never into the candidate project or ordinary graph.

## Artifacts Actually Tested

| Artifact | Origin | Observed SHA-1 | Result |
| --- | --- | --- | --- |
| `@clatech/db@0.1.1` | Public registry tarball | `4f6152b3456e65e3aa7740ec60cd1f0f8712f70d` | PASS to candidate |
| `rxdb@17.6.0` | Public registry tarball, exact version available | `3e2b149545fc2759998971a774856a535e3dd6f9` | PASS to candidate |
| `@clatech/db@0.1.2` | Fresh local `npm pack` | `18893a8892b51b0e5b37f7d8de8786a38cec0f03` | PASS as target |

The candidate tarball contained 2,071 entries, 2,232,799 compressed bytes, and 12,774,831 unpacked bytes. The runner logs registry metadata and local integrity values. These identify this built candidate, not a future published artifact. Both old packages and the candidate report public `RXDB_VERSION === '17.6.0'`; installed package versions are checked separately. No substitute upstream version is used: only an exact registry `E404` permits a reported upstream skip; other lookup/install failures fail the command.

## What The Check Proves

For each baseline, the public consumer uses a separate fresh `IDBFactory`. Within that pair, it preserves the same factory (the simulated origin/environment), database name, collection name, schema version `0`, schema, and `IDBKeyRange` across sequential opens:

1. Open the baseline with Dexie and `multiInstance: false`. Bulk-insert 200 deterministic documents with string primary keys, Unicode labels, fractional numbers, and arrays. Patch the first label and delete the second document. Assert exact public `toJSON()` content for all 199 remaining documents.
2. Await baseline `close()`, without removal. Only then open the candidate against that same IndexedDB factory and name. Assert exact ordered content, including the old update and absence of the deleted document.
3. Insert a candidate document and patch a persisted baseline document. Await candidate `close()`, reopen with the candidate, and assert all 200 exact expected documents.
4. Await candidate `remove()`, reopen an empty collection, assert no documents, remove again, and assert IndexedDB's database listing is empty.

The check never overlaps live database handles from two package versions. Loading their modules in one Node.js process is deliberate so fake IndexedDB can retain its store; this is not guidance to mix package versions in an application bundle. All collection/database access uses public package exports. The database listing comes from the public IndexedDB implementation, not RxDB internal stores.

Persistence here means survival of awaited close/reopen in one process. Process termination, filesystem durability, crashes, eviction, quotas, workers, multi-tab leadership, encryption, attachments, replication metadata migration, schema changes across package versions, and other storage adapters are not exercised. A single schema and workload cannot establish full format compatibility.

## Inherited Replication Coverage Map

No additional lifecycle testcase was added: `test/unit/replication.test.ts` already covers repeated pause/restart and the surrounding checkpoint/conflict cases. These are source-inspection findings, not claims that this unit executed that suite.

| Behavior | Existing cases in `test/unit/replication.test.ts` |
| --- | --- |
| Repeated pause/restart | `should sync again after pause->restart` pauses twice, first for a local write and then for a remote write, and verifies synchronization after each restart |
| Checkpoint preservation | `should respect the initial push checkpoint`; `should respect the initial pull checkpoint`; invalid-schema push and pull cases ensure failed writes do not advance checkpoints |
| Conflict behavior | Pull modifier on returned push conflicts; conflict-handler throw then successful retry; `conflict$` input/output; attachment and deleted-master conflicts |
| Cancellation and cleanup | Start after cancel/remove rejects; close while waiting for leadership; canceled replication never resolves initial replication; failing non-live handler does not block cancel/close; state removal after cancel |
| Interrupted streams/batches | Initial pull paused during a stream event; multi-batch push paused/restarted in flight; stream event from a pushed restart; async modifier stream ordering; queued RESYNC |
| Offline writes/retries | `should push documents written during pause after resume`; pause during push retry; resume while another batch is running |

`test/unit/cla-db.test.ts` additionally already checks `OPEN_COLLECTIONS` cleanup above 13 collections, version/Premium invariants, custom-handler bidirectional conflicts, same-version Dexie restart, and schema migration. This unit did not duplicate those tests or change Premium handling, collection limits, or upstream metadata. The new external compatibility test has its own schema-shaped changelog entry. There was no meaningful RED for compatibility that already passed, and no demonstrable candidate behavior regression requiring a RED/GREEN core fix. Production code and shared command parsers were not changed, so no sibling-command differential check applies.

## Local Benchmark Samples

The previous multi-collection metrics in `cla-db.test.ts` measure initialization and heap once per collection count. They mix cold and warm execution, use fake IndexedDB, and do not separately time writes and reads or compare installed releases. They are not a sound basis for a broad speed claim.

This runner uses one identical workload and schema for published CLA DB 0.1.1 and the local 0.1.2 tarball: one Dexie collection, 200 documents in one `bulkInsert`, then a first sorted read of every document. Each package runs in its own Node.js process, with two discarded warm-ups and nine measured iterations. Every iteration gets a fresh factory and the same database name, with awaited removal afterward. Module import time is excluded. Initialization includes database creation and `addCollections`; write timing covers the awaited bulk insert; read timing includes the first query and public JSON materialization. Assertions verify contents but timings are not thresholds.

Before each iteration, `--expose-gc` allows an explicit GC. Heap is sampled after read, before cleanup, relative to before initialization. It is a transient `heapUsed` delta across initialization/write/read, not retained heap, peak RSS, or a leak measurement. Timings and heap are reported separately. Median is the fifth sorted sample; nearest-rank p95 is the ninth (maximum) with this small sample size.

Environment: Linux `7.0.0-43-generic`, x64, Intel Core i7-11800H at 2.30 GHz (16 logical CPUs), 61.54 GiB system RAM, Node.js `v24.22.3`, npm `11.19.1`, `fake-indexeddb@6.2.8`, explicit `rxjs@7.8.2`. No real IndexedDB I/O is measured. Published baseline runs before candidate, without CPU pinning or system-load control. Package transitive dependencies follow their registry constraints in fresh installs; the runner does not claim a fully frozen dependency environment.

| Package | Init ms median / p95 | Write ms median / p95 | Read ms median / p95 | Heap MiB median / p95 |
| --- | --- | --- | --- | --- |
| CLA DB 0.1.1 | 2.043 / 2.469 | 4.578 / 5.252 | 15.782 / 17.309 | 3.832 / 5.069 |
| CLA DB 0.1.2 local | 2.080 / 2.571 | 4.474 / 5.117 | 15.657 / 17.395 | 3.888 / 5.242 |

Raw final-run samples, rounded to three decimals. Full-precision samples are emitted by the runner:

| Package | Iteration | Init ms | Write ms | Read ms | Heap MiB |
| --- | --- | --- | --- | --- | --- |
| 0.1.1 | 1 | 2.469 | 5.252 | 15.910 | 5.069 |
| 0.1.1 | 2 | 2.196 | 5.075 | 17.133 | 4.772 |
| 0.1.1 | 3 | 2.220 | 4.680 | 17.309 | 4.146 |
| 0.1.1 | 4 | 2.009 | 4.578 | 15.782 | 3.827 |
| 0.1.1 | 5 | 2.029 | 4.711 | 16.085 | 3.832 |
| 0.1.1 | 6 | 2.043 | 4.417 | 15.245 | 3.764 |
| 0.1.1 | 7 | 1.973 | 4.386 | 15.213 | 3.946 |
| 0.1.1 | 8 | 2.100 | 4.336 | 15.551 | 3.815 |
| 0.1.1 | 9 | 1.867 | 4.372 | 14.934 | 3.807 |
| 0.1.2 | 1 | 2.571 | 5.117 | 17.000 | 5.242 |
| 0.1.2 | 2 | 2.131 | 4.778 | 16.445 | 4.743 |
| 0.1.2 | 3 | 2.222 | 4.649 | 17.395 | 4.142 |
| 0.1.2 | 4 | 2.554 | 4.574 | 15.657 | 3.888 |
| 0.1.2 | 5 | 2.036 | 4.460 | 15.481 | 3.827 |
| 0.1.2 | 6 | 1.896 | 4.442 | 15.120 | 3.766 |
| 0.1.2 | 7 | 1.960 | 4.308 | 15.578 | 3.972 |
| 0.1.2 | 8 | 2.080 | 4.474 | 15.887 | 3.844 |
| 0.1.2 | 9 | 2.039 | 4.369 | 15.033 | 3.777 |

These local samples do not establish that CLA DB is faster than RxDB, or that 0.1.2 improves real-browser performance.

## Failures, Corrections, And Browser Limits

An initial benchmark draft also attempted to time upstream RxDB. It exited `1`: after upstream `remove()`, fake IndexedDB still listed `rxdb-dexie-benchmark--0--_rxdb_internal` and `rxdb-dexie-benchmark--0--items` (version 10), while the assertion expected `[]`. The first failure output was obscured by the full pack file listing; synchronous logging and pack-metadata summarization exposed the same failure on the next run. No candidate compatibility failure was observed and no core fix was attempted. The final benchmark is deliberately CLA DB 0.1.1 versus local 0.1.2 only. Upstream remains tested by the separate close/reopen compatibility command, where the candidate performs final removal successfully. Upstream-only removal remains an observed baseline limitation, not a passing upstream cleanup result.

| Environment | Availability | Actually executed here |
| --- | --- | --- |
| Node.js + fake IndexedDB | Available | Both compatibility pairs and CLA DB benchmark samples |
| Chromium / Chrome | No executable found by `command -v` for `chromium`, `chromium-browser`, or `google-chrome` | Not tested |
| Firefox | `/usr/bin/firefox`, `Mozilla Firefox 154.0.1` | Version probe only, no browser database tests |
| WebKit | No `WebKitWebDriver` found | Not tested |

The existing Karma configuration targets the full repository test bundle and starts helper servers. It does not provide isolated installed-version consumers. This unit uses the explicitly accepted fake-indexeddb limitation rather than add browser automation infrastructure. Firefox availability alone is not a passing browser result. Browser gaps are nonblocking for this bounded proof, but real-browser release coverage remains outstanding. No external replication services were launched or tested; their integration results remain unknown. No unresolved candidate storage failure was reproduced.

Final ordinary verification: `npm run lint` exited `0` (`eslint .`, no diagnostics); `npm run check-types` exited `0` (`tsc`, no diagnostics). No in-suite assertion was added, so the conditional transpile/Mocha command was not run. Build, typings, circular checks, full memory/Dexie suites, packed-package integration, and browser/service suites remain release-controller responsibilities under S12, not checks passed by this unit. `CLA_CHANGELOG.md` is outside this unit's edit surface; its release summary update remains parent-owned.
