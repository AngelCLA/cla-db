# Offline-First Evidence

The disposable [browser fixture](../../scripts/browser-integration/README.md) imports CLA DB from the checked tarball. It uses a Vite app, Dexie and real IndexedDB, plus a service worker that caches only the app shell. It does not cache `/api/`. The replication handlers talk to a controlled server on `127.0.0.1`. The service worker and server do not ship in `@clatech/db`.

All three Playwright engines passed these five scenarios:

1. **Initial sync**: open with the network available and reconcile local and server documents.
2. **Offline edit and reload**: edit and insert while offline, then reload from the app shell. Local data remains accessible and server state stays untouched.
3. **Reconnect**: resume replication and converge to three server documents, each present once.
4. **Conflict**: create divergent edits in two browser profiles, observe a conflict, and converge to the server's accepted value without creating a duplicate.
5. **Retry**: reject two push attempts before accepting one write. Confirm one stored document and one accepted write for its ID.

These are controlled disconnections and injected application errors. They do not simulate browser power loss, durable cloud transport, cross-engine concurrent clients, or Safari/iOS. See the [native browser matrix](./BROWSERS.md).
