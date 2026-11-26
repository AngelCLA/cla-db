# CLA DB System Design

## Overview

CLA DB (`@clatech/db`) is a minimal, Apache 2.0 fork of [RxDB](https://github.com/pubkey/rxdb) maintained by CLA Tech.
It provides a reactive, local-first NoSQL database engine for JavaScript and TypeScript. Browser and Node.js usage depends on the selected storage. Electron, React Native, Capacitor, Deno, and Bun remain integration targets, not a verified 0.1.3 support matrix. See [consumer and compatibility evidence](./release/0.1.2/COMPATIBILITY.md) for the published `0.1.2` release.

- **Fork repository**: `https://github.com/AngelCLA/cla-db`
- **Upstream repository**: `https://github.com/pubkey/rxdb`
- **Upstream base (v0.1.0)**: RxDB `17.6.0+522` (commit `9d5849cf4c695ffc27d60e134b2039539e77a9b0`)
- **Primary initial use case**: Field-sales credit furniture application requiring full offline operation, multi-collection domain modeling (>13 collections), local persistence across restarts, and deferred bidirectional synchronization.

## Design Principles

1. **Minimal fork, maximum compatibility**: Keep diffs against upstream RxDB small, isolated, and clearly marked with `// CLA-DB:` comments.
2. **Public API compatibility**: Preserve RxDB public APIs, plugin architecture (`addRxPlugin`), storage interfaces (`RxStorage` / `RxStorageInstance`), and replication protocol.
3. **Storage-format compatibility**: Keep on-disk internal prefixes (`_rxdb_internal`, `rxdatabase_storage_local`, `BroadcastChannel('RxDB:|...')`) and `plugin.rxdb === true` intact. Decouple `package.json#version` (`0.1.3` candidate) from `RXDB_VERSION` (`17.6.0` via `package.json#claDb.upstreamVersion`) so on-disk compatibility checks in `src/rx-database-internal-store.ts` continue to recognize RxDB 17 format databases without `DM5` errors.
4. **Clean-room open-source boundary**: Do not include, copy, or reverse-engineer proprietary RxDB Premium plugins or falsify Premium flags.
5. **External extensibility**: Build future CLA Tech adapters and tooling as separate packages over public core interfaces rather than embedding them in `src/`.

## Layered Architecture

```
+-------------------------------------------------------------------+
| Application Layer (UI / Domain Services / Offline Field Client)   |
+-------------------------------------------------------------------+
| Public Reactive API (@clatech/db, @clatech/db/plugins/core)       |
| - RxDatabase, RxCollection, RxDocument, RxQuery, RxSchema         |
| - RxJS Observables, EventReduce query cache, QueryPlanner         |
+-------------------------------------------------------------------+
| Plugin & Middleware Layer (src/plugins/*)                         |
| - Schema migration, conflict handling, validation, encryption,    |
|   key compression, attachments, local documents, CRDT, cleanup    |
+-------------------------------------------------------------------+
| Replication Engine                                                |
| - Core protocol: src/replication-protocol/                        |
|   (checkpoint, downstream, upstream, conflicts, meta-instance)    |
| - Collection plugin: src/plugins/replication/                     |
| - Transport plugins: GraphQL, WebSocket, CouchDB, Supabase, etc.  |
+-------------------------------------------------------------------+
| Storage Abstraction (RxStorage / RxStorageInstance)               |
| - Open adapters: Dexie (IndexedDB), Memory, LocalStorage,         |
|   FoundationDB, MongoDB, DenoKV, Remote, Remote WebSocket         |
| - Future external CLA adapters: D1, R2, custom SQLite, OPFS       |
+-------------------------------------------------------------------+
```

## Core Components

### Database and Collection Lifecycle
- `src/rx-database.ts`: Manages `RxDatabaseBase`, collection registration (`addCollections()`), internal metadata store (`_rxdb_internal`), multi-instance coordination, and clean shutdown (`close()`).
- `src/rx-collection.ts`: Manages `RxCollectionBase`, CRUD operations, reactive change streams, query caching, and `OPEN_COLLECTIONS` lifecycle tracking (used during `database.close()` and leak detection tests).
- **CLA DB modification**: The artificial non-premium collection limit check (`COL23` against `NON_PREMIUM_COLLECTION_LIMIT`) is removed from `RxCollectionBase.prepare()`. `OPEN_COLLECTIONS` tracking and `src/plugins/utils/utils-premium.ts` exports remain untouched so shutdown behavior and public exports stay compatible.

### Reactive Query Engine
- `src/rx-query.ts`, `src/query-planner.ts`, `src/query-cache.ts`, `src/event-reduce.ts`: Compiles Mango selectors against schema indexes and incrementally updates subscribed `RxJS` observables using `EventReduce` instead of re-running full storage scans on every write.

### Schema, Validation, and Migrations
- `src/rx-schema.ts`: Enforces JSON Schema definitions, primary keys, and indexes.
- `src/plugins/migration-schema/`: Migrates documents across schema versions using deterministic `migrationStrategies`.
- `src/plugins/validate-*`: Pluggable schema validators (`validate-ajv`, `validate-ajv-standalone`, `validate-is-my-json-valid`, `validate-z-schema`).

## Storage Layer

All storages implement `RxStorage` and `RxStorageInstance` defined in `src/types/rx-storage.interface.d.ts`.

| Storage Plugin | Path | License / Status | Recommended Use |
| --- | --- | --- | --- |
| Dexie (IndexedDB) | `@clatech/db/plugins/storage-dexie` | Apache 2.0 (open) | Default persistent browser/PWA storage (`dexie@4.4.2`) |
| Memory | `@clatech/db/plugins/storage-memory` | Apache 2.0 (open) | Unit tests, ephemeral state, benchmarks |
| LocalStorage | `@clatech/db/plugins/storage-localstorage` | Apache 2.0 (open) | Small datasets in browser/mock environments |
| FoundationDB | `@clatech/db/plugins/storage-foundationdb` | Apache 2.0 (open) | Server-side Node.js workloads |
| MongoDB | `@clatech/db/plugins/storage-mongodb` | Apache 2.0 (open) | Server-side Node.js with MongoDB backend |
| DenoKV | `@clatech/db/plugins/storage-denokv` | Apache 2.0 (open) | Deno runtime |
| Remote / Remote WebSocket | `@clatech/db/plugins/storage-remote*` | Apache 2.0 (open) | Shared storage across workers/processes |
| SQLite (Trial) | `@clatech/db/plugins/storage-sqlite` | Apache 2.0, **500 live documents (`SQL2`), 500 counted `all()` calls per instance (`SQL3`)** | Reference/testing only; not for production |

SQLite trial counters measure internal reads, not public API calls. Deleted tombstones do not count toward the live-document cap. The 501st `all()` call throws; `run()` does not increment the counter. Indexes and attachments are unavailable (`SQL1` for attachments). This is inherited evaluation code, not an unrestricted CLA Tech adapter.

### Multi-Collection Resource Considerations
Removing the artificial 13-collection cap does not eliminate physical runtime limits:
- Each open collection initializes its own storage instance, internal metadata entry, change-event stream, and query cache.
- In IndexedDB/Dexie, every collection opens an IndexedDB store/database handle, which increases initialization latency and heap usage linearly with collection count.
- Production applications should monitor heap usage and startup time as collection counts grow. Historical single-run metrics in `CLA_CHANGELOG.md` are not performance guarantees; see [bounded benchmark methodology](./release/0.1.2/COMPATIBILITY.md).

## Replication Architecture

- **Core protocol (`src/replication-protocol/`)**: Checkpoint-based pull/push synchronization with deterministic conflict resolution (`default-conflict-handler.ts` or custom per-collection `conflictHandler`) and isolated replication metadata (`meta-instance.ts`).
- **Offline-first workflow**:
  1. Local writes commit immediately to the local `RxStorage` (for example Dexie/IndexedDB) while offline.
  2. When connectivity returns, the push stream sends local revisions with assumed master state (`assumedMasterState` + `newDocumentState`).
  3. The server detects concurrent updates and returns conflicting master states, which are resolved locally by the collection conflict handler and re-pushed if needed.
  4. The pull stream fetches incremental remote batches using checkpoints and updates reactive queries automatically.

## Public Sites And Network Boundaries

- `web/` owns the neutral Spanish CLA Tech landing. `docs-src/` owns inherited technical/API reference, including upstream Premium and integration material that is not a promise of fork functionality. Generated `/docs` is not an editing surface.
- Local memory CRUD requires no configured service. Dev-mode registration no longer launches the inherited marketing iframe. The documentation marketing callback is disabled independently; inert inherited code remains for merge compatibility.
- Explicit viewer, replication, and storage integrations retain their destinations and trust requirements. This is not a zero-telemetry claim. See [network audit](./release/0.1.2/NETWORK_AUDIT.md) and [site evidence](./release/0.1.2/SITES.md).

## Packaging and Module Resolution

- Dual output built from `src/` via Babel and TypeScript:
  - CJS: `dist/cjs/` (`main`)
  - ESM: `dist/esm/` (`module`, with `{"type": "module", "sideEffects": false}`)
  - TypeScript declarations: `dist/types/` (`types`)
  - Legacy subpath shims: `plugins/<name>/` (generated by `scripts/generate-plugins-package-json.mjs`)
- Consumers import `@clatech/db` (or `@clatech/db/plugins/core`) and subpath plugins `@clatech/db/plugins/<plugin-name>`.
- **Single-instance constraint**: Consumers must not mix `rxdb` and `@clatech/db` in the same bundle, because core relies on module-level registries (`ADDED_PLUGINS`, `USED_DATABASE_NAMES`, `overwritable`, `instanceof RxDatabaseBase`).
