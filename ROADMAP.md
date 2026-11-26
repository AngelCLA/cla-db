# CLA DB Roadmap

CLA DB keeps its core fork minimal. New adapters and operational tooling are planned as **independent packages** using public `RxStorage`, `RxStorageInstance`, and replication interfaces. Milestones describe direction, not delivery dates or implemented capabilities.

## v0.1.2 - Consolidation (Published)

- Preserve public APIs, storage compatibility version `17.6.0`, Premium boundaries, and collection cleanup without the artificial 13-collection cap.
- Record upstream ancestry and maintenance fixes without rewriting the foundation commit.
- Validate packed distribution, cross-version reopen behavior, local operation, and documentation with bounded, reproducible evidence.
- Audit security, licenses, package contents, and safe publication procedures.

`0.1.2` is a previous published release. Earlier foundation work and its historical checks remain in [CLA_CHANGELOG.md](./CLA_CHANGELOG.md).

## v0.1.3 - Universal Compatibility (Published November 26, 2026)

- One official package, `@clatech/db`. npm, pnpm, Bun, Yarn, and Deno all install the same distribution artifact, and no duplicate package is published to another registry.
- Record package-manager, runtime, browser, framework, and storage compatibility per target, each with the exact command, tool versions, and artifact hash that produced the result.
- Extend simulated IndexedDB evidence to real-browser IndexedDB, and add an offline-first reference application outside the core.
- Keep the core surface minimal. Compatibility tooling lives in test infrastructure, not in `src/`.
- `0.1.3` is npm `latest`, verified on 2026-11-26. Hosted CI, compatibility, and staging succeeded at revision `c4c06825382872af9551435cbbfeca0e661df565`; see [CI evidence](./release/0.1.3/CI.md) and [publication evidence](./release/0.1.3/PUBLISHING.md).
- The [compatibility matrix](./release/0.1.3/COMPATIBILITY.md) records 45 local browser passes and scoped consumer/storage results. Full Bun suites, skipped targets, and crash/quota durability remain outside the verified claim.

## v0.2.0 - Cloudflare Workers And D1 (Planned)

- External replication adapter and reference backend with persistent checkpoints, conflicts, and authentication.
- Evaluate R2 attachment/blob integration without adding service dependencies to core.

## v0.3.0 - Independent SQLite Adapter (Planned)

- Separate open-source `RxStorage` implementation with an explicit driver/runtime support matrix.
- Not the inherited SQLite trial. Production suitability requires durability, migration, and concurrency validation.

## v0.4.0 - OPFS And Optimization (Planned)

- External Origin Private File System adapter with real-browser durability tests.
- Optimize only against reproducible workload measurements, preserving compatibility.

## v0.5.0 - DevTools, Diagnostics, And Backup (Planned)

- Collection inspection, resource and checkpoint diagnostics, and synchronization visibility.
- Deterministic backup/export, restore, and recovery verification.

## v1.0.0 - First Stable Release (Planned)

- Validate in real applications, document supported platforms and operational limits, and complete compatibility and recovery coverage.

## Non-Goals

- Copying or bundling proprietary RxDB Premium plugins or bypassing license checks.
- Rewriting working upstream internals or replacing RxJS.
- Claiming production readiness, platform coverage, or speed without reproducible evidence.
