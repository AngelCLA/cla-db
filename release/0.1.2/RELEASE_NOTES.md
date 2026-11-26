# CLA DB 0.1.2 Release Notes

CLA DB is an independent Apache 2.0 fork of RxDB maintained by CLA Tech. It is not affiliated with or endorsed by RxDB.

## Changes For Consumers

- The package version is `0.1.2`; the storage compatibility version remains RxDB `17.6.0`. The removed 13-collection enforcement stays removed. The release does not change Premium validation or collection cleanup.
- Dev-mode registration no longer opens an unsolicited upstream marketing iframe. Explicit integrations may still connect to their configured endpoints. See the [network audit](NETWORK_AUDIT.md).
- The npm package uses an allowlist for runtime files, public exports, declarations, source maps, and attribution. Site sources, design assets, and internal test and agent files stay out of the package. See the [package report](PACKAGE.md).
- The README adds examples for JavaScript, TypeScript, reactive queries, persistent storage, and custom replication. The inherited SQLite trial plugin retains its limits; this release does not add an unrestricted SQLite adapter.

## Upstream Fixes Included

The foundation stays at RxDB `17.6.0+522`, commit `9d5849cf4c695ffc27d60e134b2039539e77a9b0`. Nine additional commits were merged, including fixes for replication pause and restart (`b3fc33f42c`), special primary keys in replication and migration (`d8ab5eb220`), pre-write document validation (`31492a4972`), and reconnect behavior in Google Drive and OneDrive signaling (`f53c02d937`). See the [complete ancestry](../../UPSTREAM.md#exact-012-ancestry).

## Verification And Limits

- The required local suite passed on Node 24, including `1,918` Memory and `1,922` Dexie tests. All `56` exports passed checks in a detached packed consumer. See the [test report](TESTS.md). The protected `master` CI run for this revision passed `verify (22)`, `verify (24)`, and `site`.
- Cross-version Dexie tests reopened databases created by published CLA DB `0.1.1` and RxDB `17.6.0` using simulated IndexedDB. They do not establish browser disk durability or full compatibility. See the [compatibility report](COMPATIBILITY.md).
- The legacy migration fixture now uses the already pinned root `ws` without changing its RxDB baseline. A production consumer audit found no known advisories in the audited graph. The separate development graph still has `26` moderate findings, accepted for this release in the recorded [advisory disposition](DEPENDENCIES.md#advisory-disposition). See the [dependency report](DEPENDENCIES.md) and [CycloneDX SBOM](sbom.cdx.json).
- The standalone generated viewer is not in the npm candidate. Its third-party notices still need review before separate redistribution.
- The tarball is built from protected `master` and pinned by SHA-256 `0b96c99375184786dae397b38dbbf7571bd38612a98ad4da20e9ad53e681fa56`; see the [publishing procedure](PUBLISHING.md).
