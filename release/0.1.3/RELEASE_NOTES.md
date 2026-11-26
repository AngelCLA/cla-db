# CLA DB 0.1.3 - Universal Compatibility

Status: **published November 26, 2026**, as npm `latest`, verified that day. [Hosted CI, compatibility, and staging succeeded](./CI.md) at revision `c4c06825382872af9551435cbbfeca0e661df565`. See [registry identity and provenance boundaries](./PUBLISHING.md) and the [scoped compatibility matrix](./COMPATIBILITY.md).

- One npm artifact, checked across npm, pnpm, Bun, modern Yarn, Deno, Chromium, Firefox, and WebKit. See the matrix for the exact scope of each lane.
- Local native IndexedDB coverage records 45 browser passes across Chromium, Firefox, and WebKit, including 100 simultaneous collections, reactive CRUD, restart, migrations, cleanup, offline reconnect, conflicts, and retries. This is not crash/quota durability certification.
- Forward sequential storage verification covers CLA DB 0.1.1, 0.1.2, RxDB 17.6.0, and 0.1.3 self-reopen using simulated IndexedDB. Downgrade is not claimed.
- All 56 public exports, RxJS, Apache 2.0 and RxDB attribution remain. The package still uses storage format `17.6.0`, does not add new storage adapters, and leaves `engines.node` at `>=20`.
- The site and README provide installation commands for the same published npm package. Site evidence remains local build/test evidence, not a deployment claim.
- Inherited full Bun Memory/Dexie failures, skipped targets, and development advisories remain documented; narrower passes do not resolve those limits.

[Package and SHA-256](./PACKAGE.md) · [Test evidence](./TESTS.md) · [Machine-readable results](./compatibility-results.json) · [Dependency audit and SBOM](./DEPENDENCIES.md) · [Network audit](./NETWORK_AUDIT.md) · [Local review](./REVIEW.md) · [Publishing](./PUBLISHING.md)
