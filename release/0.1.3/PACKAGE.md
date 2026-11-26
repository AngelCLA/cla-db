# Package Candidate

`@clatech/db@0.1.3` is an unpublished candidate. Use the same tarball for every compatibility check. The npm package retains the Apache 2.0 license, RxDB attribution, the public export map, and `RXDB_VERSION` / storage compatibility `17.6.0`.

```sh
cd release/0.1.3
sha256sum --strict --check SHA256SUMS
```

| Measure | Published 0.1.2 | Local 0.1.3 |
| --- | ---: | ---: |
| Compressed bytes | 2,235,740 | 2,236,394 |
| Unpacked bytes | 12,782,900 | 12,784,778 |
| Entries | 2,071 | 2,071 |
| Public exports | 56 | 56 |

The compressed payload grew by 654 bytes (0.03%). The version alignment did not change the `files` allowlist, dependency declarations or engine floor. The build used Linux x86-64, Node 24.22.3 and npm 11.19.1; `npm run check-types`, `npm run build`, and `npm pack --ignore-scripts --json --pack-destination release/0.1.3` exited 0. SHA-256: `a32518f06bb9c9b5a9df54c14df47eb45381af72aae4a606f8e75d356e689cbc`. This archive is the local candidate, not a registry tarball or a trusted-publishing attestation.

The two archives have exactly the same paths. A content comparison found 2,069 byte-identical files. The only changed entries are `README.md` and `package.json`; `package.json` differs only in `version`. The tar listing matched `npm pack --json` metadata. Checks verified all 56 public export destinations, declarations, ESM and CommonJS files, legacy plugin shims, 578 source maps, and the package's license and notices. The payload excludes test tooling, fixtures, browsers, logs, internal reports and site files. See [Dependency Evidence](./DEPENDENCIES.md) for the detached audit and SBOM, [the 0.1.2 package record](../0.1.2/PACKAGE.md) for the published baseline, and [Publishing](./PUBLISHING.md) for post-publication byte verification.
