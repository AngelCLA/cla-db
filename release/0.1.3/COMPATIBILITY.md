# CLA DB 0.1.3 Compatibility Matrix

`0.1.3` is published as npm `latest`, verified on 2026-11-26. [Hosted CI, compatibility, and staging succeeded](./CI.md) at revision `c4c06825382872af9551435cbbfeca0e661df565`, superseding the missing-run and staging blockers.

The detailed counts below remain historical local candidate evidence, not newly measured registry results. All detached candidate checks use the [same local npm archive and hash](./PACKAGE.md), whose SHA-256 was not compared with registry bytes in this documentation task. The [JSON evidence](./compatibility-results.json) records 123 passes and 23 explicit skips across 11 consumer lanes, 45 browser passes, and 30 simulated storage passes at implementation revision `8891dabc42`. PASS applies only to executed probes in the stated lane; SKIP and UNSUPPORTED are not approvals.

| Area | Locally verified | Outside the verified claim |
| --- | --- | --- |
| Installation | npm, pnpm default isolated layout, Bun, Yarn `node_modules`, Yarn PnP | Other tool versions and lockfile layouts |
| Node | 22.23.5, 24.22.3 and 26.13.1 full consumer lanes; 20.0.0 and 20.20.2 legacy smoke | Full Node 20 integration and upstream EOL support |
| Bun | 1.3.14 as installer and runtime, with artifact probes for storage, CRUD, ESM/CJS, native TS and replication | Inherited full Memory and Dexie suites failed; native IndexedDB and SQLite storage not certified |
| Deno | 2.8.3 detached Memory, reactive CRUD, collections, replication, cleanup, scoped npm specifiers, and a deprecated in-memory DenoKV smoke | Broad-permission inherited suites, Deno Deploy, file or remote DenoKV, full type check |
| Browsers | Playwright 1.65.1 Chromium, Firefox, WebKit: 15/15 each | Safari/iOS, abrupt recovery, quota faults, broad multi-tab/concurrency certification |
| Frameworks | Vanilla JS, TypeScript NodeNext/Bundler, Vite, React 19.3.1 + Vite 8.4.0 | Vue, Svelte, Angular, Electron and Capacitor remain inherited or unverified targets |
| Storage | Memory, simulated Dexie, native browser Dexie; forward 0.1.1/0.1.2/RxDB 17.6.0 lineage and 0.1.3 self-reopen on simulated IndexedDB | Native cross-version lineage, downgrade, external storage adapters |
| Offline and replication | Local handlers and app shell across all three engines; conflict, retry and no duplicates | Credentialed services, abrupt interruption, other protocols and backends |

The detached React + Vite probe loaded the exact archive with Memory and verified initial render, reactive update and collection cleanup in Chromium. Its emitted modules included React and Memory, but not the checked Dexie, SQLite, WebSocket/Firestore or alternative framework imports. This is scoped tree-shaking evidence, not a guarantee about every import combination.

## Remaining Limits And Historical Gates

| Classification | Gap | Reason |
| --- | --- | --- |
| Satisfied hosted gate | Current protected-master CI and compatibility | Both succeeded at the revision linked above; local report counts remain separate. |
| Blocking claim of full Bun support | Inherited Bun Memory/Dexie failures | Detached evidence passes its narrower scope; do not claim the failing suites passed. No production code changed. |
| Satisfied staging gate | Protected staging succeeded | Build and stage succeeded in run 45879171228; earlier failures remain historical in [Publishing](./PUBLISHING.md). This is not a guarantee of future OIDC behavior. |
| Outside scoped verified claims | Native forward-lineage, downgrade, optional frameworks, crash/quota checks, benchmark breadth | Document the separate limits. Neither native durability nor simulated forward lineage implies those outcomes. |
| Remaining development audit findings | 26 moderate development-only advisories | The exact detached production audit returned zero at audit time; prior advisory dispositions remain applicable to the unchanged development graph. |

See [package managers](./PACKAGE_MANAGERS.md), [runtimes](./RUNTIMES.md), [browsers](./BROWSERS.md), [storage](./STORAGE.md), and [test evidence](./TESTS.md) for details.
