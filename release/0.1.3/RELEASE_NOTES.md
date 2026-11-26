# CLA DB 0.1.3 - Universal Compatibility

Status: **unpublished candidate**. `@clatech/db@0.1.2` remained npm `latest` when checked. Review the [compatibility matrix and open gates](./COMPATIBILITY.md) before any release action.

- One npm artifact, checked across npm, pnpm, Bun, modern Yarn, Deno, Chromium, Firefox, and WebKit. See the matrix for the exact scope of each lane.
- Native IndexedDB coverage includes 100 simultaneous collections, reactive CRUD, persistent browser restart, migrations, cleanup, and offline reconnect, conflict and retry scenarios.
- Forward sequential storage verification covers CLA DB 0.1.1, 0.1.2, RxDB 17.6.0, and 0.1.3 self-reopen using simulated IndexedDB. Downgrade is not claimed.
- All 56 public exports, RxJS, Apache 2.0 and RxDB attribution remain. The package still uses storage format `17.6.0`, does not add new storage adapters, and leaves `engines.node` at `>=20`.
- The site and README provide installation commands for the same npm package. The site was built and tested locally, not deployed.

[Package and SHA-256](./PACKAGE.md) · [Test evidence](./TESTS.md) · [Machine-readable results](./compatibility-results.json) · [Dependency audit and SBOM](./DEPENDENCIES.md) · [Network audit](./NETWORK_AUDIT.md) · [Local review](./REVIEW.md) · [Publishing](./PUBLISHING.md)
