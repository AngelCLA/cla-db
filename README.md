# CLA DB (`@clatech/db`)

**CLA DB** is an independent Apache 2.0 fork of [RxDB](https://github.com/pubkey/rxdb), maintained by **CLA Tech**. It stores JSON documents locally, queries them with MongoDB-style (Mango) selectors, and exposes reactive results through RxJS. Applications can keep working offline and replicate through explicitly configured handlers when connectivity returns.

## Install

```bash
npm install @clatech/db rxjs
```

The latest published registry version is **0.1.1**. This branch prepares **0.1.2**, an unpublished preview, not a release declared ready. To evaluate that candidate, build and pack the checkout, then install its tarball in a separate application:

```bash
# In the fork checkout
npm install
npm run build
npm pack
# In your application, replacing /path/to/checkout with its actual location
npm install /path/to/checkout/clatech-db-0.1.2.tgz rxjs
```

See [package evidence](./release/0.1.2/PACKAGE.md), [compatibility evidence](./release/0.1.2/COMPATIBILITY.md), and [network audit](./release/0.1.2/NETWORK_AUDIT.md). These are bounded observations, not final release certification.

## Quick Start With JavaScript

Use ESM (`"type": "module"` in your application package.json). Save this reusable setup as `database.js`. Memory storage needs no server but does not persist across restarts.

```js
import { createRxDatabase } from '@clatech/db';
import { getRxStorageMemory } from '@clatech/db/plugins/storage-memory';

export async function openCustomers(storage = getRxStorageMemory()) {
    const db = await createRxDatabase({ name: 'customersdb', storage, multiInstance: false });
    await db.addCollections({ customers: { schema: {
        version: 0, primaryKey: 'id', type: 'object',
        properties: {
            id: { type: 'string', maxLength: 100 },
            name: { type: 'string' }
        },
        required: ['id', 'name']
    } } });
    return db;
}
```

Save this as `quickstart.mjs` and run `node quickstart.mjs`:

```js
import { firstValueFrom, filter } from 'rxjs';
import { openCustomers } from './database.js';

const db = await openCustomers();
const query = db.customers.find();
const subscription = query.$.subscribe(docs => console.log('Customers:', docs.length));
await db.customers.insert({ id: 'alice', name: 'Alice' });
await firstValueFrom(query.$.pipe(filter(docs => docs.length === 1)));
console.log((await db.customers.findOne('alice').exec()).name); // Alice
subscription.unsubscribe();
await db.close();
```

`.$` emits query results when matching documents change. Unsubscribe and await `close()` when the application no longer needs the database. Do not mix `rxdb` and `@clatech/db` modules in one application bundle.

## TypeScript

Save as `typed.mts`. Compile with your application's TypeScript compiler using `--module NodeNext --target ES2022 --skipLibCheck`, then run the emitted `typed.mjs` with Node.js.

```ts
import { createRxDatabase } from '@clatech/db';
import type { RxCollection, RxJsonSchema } from '@clatech/db';
import { getRxStorageMemory } from '@clatech/db/plugins/storage-memory';

type Customer = { id: string; name: string };
const schema: RxJsonSchema<Customer> = {
    version: 0, primaryKey: 'id', type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        name: { type: 'string' }
    },
    required: ['id', 'name']
};
const db = await createRxDatabase<{ customers: RxCollection<Customer> }>({
    name: 'typedcustomers', storage: getRxStorageMemory(), multiInstance: false
});
await db.addCollections({ customers: { schema } });
const customer = await db.customers.insert({ id: 'bob', name: 'Bob' });
console.log(customer.name); // Bob, inferred as string
await db.close();
```

## Persistent Browser Storage

Bundle the following module with `database.js` in a browser application. Dexie uses the browser's IndexedDB; Node.js does not supply that API. Keep the database name and schema unchanged to reopen existing data.

```js
import { getRxStorageDexie } from '@clatech/db/plugins/storage-dexie';
import { openCustomers } from './database.js';

let db = await openCustomers(getRxStorageDexie());
await db.customers.upsert({ id: 'saved', name: 'Saved customer' });
await db.close();
db = await openCustomers(getRxStorageDexie());
console.log((await db.customers.findOne('saved').exec()).name); // Saved customer
await db.close();
```

Browser quotas, eviction, private browsing, and crashes affect durability. Candidate reopen tests use **fake-indexeddb in Node.js**, not real browser disk I/O. See the [exact compatibility boundaries](./release/0.1.2/COMPATIBILITY.md).

## Custom Replication

This runnable `replication.mjs` uses the same `database.js` and an in-process demonstration master. Run `node replication.mjs`. It exercises pull, push, and checkpoints without contacting a service. It is deliberately single-client and not a production server: a real backend must persist ordered checkpoints, handle deletions, authenticate requests, and compare `assumedMasterState` atomically before accepting writes. Return conflicting master documents from push instead of overwriting them.

```js
import { replicateRxCollection } from '@clatech/db/plugins/replication';
import { openCustomers } from './database.js';

const db = await openCustomers();
let sequence = 1;
const changes = [{ sequence, doc: { id: 'remote', name: 'Remote', _deleted: false } }];
const replication = replicateRxCollection({
    collection: db.customers,
    replicationIdentifier: 'demo-master-v1',
    live: false,
    waitForLeadership: false,
    pull: {
        batchSize: 10,
        async handler(checkpoint, batchSize) {
            const batch = changes.filter(row => row.sequence > (checkpoint?.sequence ?? 0)).slice(0, batchSize);
            return {
                documents: batch.map(row => row.doc),
                checkpoint: { sequence: batch.at(-1)?.sequence ?? checkpoint?.sequence ?? 0 }
            };
        }
    },
    push: {
        batchSize: 10,
        async handler(rows) {
            for (const row of rows) {
                changes.push({ sequence: ++sequence, doc: row.newDocumentState });
            }
            return []; // No conflicts in this single-client demo.
        }
    }
});
await db.customers.insert({ id: 'local', name: 'Local' });
await replication.awaitInitialReplication();
console.log((await db.customers.findOne('remote').exec()).name); // Remote
console.log(changes.some(row => row.doc.id === 'local')); // true
await replication.cancel();
await db.close();
```

For live synchronization, supply a suitable pull stream or resync trigger and design conflict handling for your backend. [Upstream replication documentation](https://rxdb.info/replication.html) explains the inherited protocol. No backend is contacted just by creating a local memory database.

## Available Storage And Feature Boundaries

| Status | Storage / feature | Boundary |
| --- | --- | --- |
| Inherited, included | Memory (`plugins/storage-memory`) | Ephemeral state and tests |
| Inherited, included | Dexie (`plugins/storage-dexie`) | Persistent browser IndexedDB; candidate proof is simulated |
| Inherited, included | localStorage (`plugins/storage-localstorage`) | Requires browser localStorage; limited by browser quotas |
| Inherited, included | FoundationDB, MongoDB, DenoKV | Require their respective runtime, drivers, and services; not certified by this release's memory checks |
| Inherited, included | Remote / remote WebSocket | Bridges to explicitly configured storage, not a standalone persistence engine |
| Inherited trial | SQLite (`plugins/storage-sqlite`) | Evaluation only, restrictions below |
| Inherited, experimental | Google Drive / Microsoft OneDrive replication | Requires explicit service configuration; no credentialed service validation in this candidate evidence |
| Planned external packages | Cloudflare Workers + D1, independent SQLite, OPFS, DevTools | Not implemented in this release; see [roadmap](./ROADMAP.md) |
| Premium, not included | Proprietary RxDB Premium plugins | Removing the collection cap does not unlock Premium or alter license validation |

The inherited SQLite trial is **not CLA DB's own production adapter**. Source limits in `src/plugins/storage-sqlite/sqlite-storage-instance.ts` are 500 live documents per storage instance (`SQL2` above 500; deleted tombstones do not count) and 500 counted `all()` operations per instance (`SQL3` on the 501st). This counts internal SQL reads, not public CRUD calls; writes can consume the budget too. `run()` does not increment that counter. There are no query indexes, and attachments are rejected (`SQL1`). Trial database names use `_trial_`. These restrictions remain unchanged.

## Compatibility And Project Status

The public package version is decoupled from storage compatibility version **17.6.0**. CLA DB preserves the RxDB public interfaces and internal storage prefixes; this is an intended compatibility boundary, not a blanket guarantee for every plugin or runtime. The fork removes the artificial 13-collection limit and preserves `OPEN_COLLECTIONS` cleanup tracking. Physical memory, handles, and initialization costs still limit workloads.

The package declares Node.js `>=20`. Current isolated consumer evidence used Node.js 24, ESM, CommonJS, TypeScript, Vite, memory, and simulated IndexedDB. Browser applications can use Dexie where IndexedDB exists. Electron, React Native, Capacitor, Deno, and Bun are inherited integration targets, not a tested platform matrix for 0.1.2. Choose storage and platform dependencies explicitly. No comparative speed claim is made.

## Documentation And Contribution

- [System design](./SYSTEM_DESIGN.md): architecture and compatibility constraints.
- [Upstream maintenance](./UPSTREAM.md): exact foundation, merged ancestry, and sync procedure.
- [Fork changelog](./CLA_CHANGELOG.md) and original [RxDB changelog](./CHANGELOG.md).
- [Contributing](./CONTRIBUTING.md): workflow and verification commands.
- [Site evidence](./release/0.1.2/SITES.md): `web/` is the Spanish CLA Tech landing; `docs-src/` is inherited technical/API reference, including upstream-only material, not a second marketing implementation.
- [Upstream API reference](https://rxdb.info/): examples may use `rxdb` imports or Premium features not supplied here.

## License And Attribution

Derived from RxDB by Daniel Meyer (`pubkey`) and contributors. The original [Apache License 2.0](./LICENSE.txt), copyrights, and upstream history are preserved. Fork modifications are recorded separately by CLA Tech. CLA DB is independent and is not affiliated with or endorsed by RxDB or RxDB Premium. See [package evidence](./release/0.1.2/PACKAGE.md) for the inspected NOTICE boundary; final third-party license and security disposition belongs to the release audit.
