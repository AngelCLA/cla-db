# Package Manager Verification

The local matrix used the [same SHA-256 checked tarball](./PACKAGE.md) in separate Linux x86-64 consumers. Each manager generated its own lockfile outside the repository. An optional probe reported as `SKIP` is not counted as passed. npm remains the canonical installer for the CLA DB source checkout.

| Lane | Tool version | Execution | Result |
| --- | --- | --- | --- |
| `npm-node` | npm 11.19.1 | Node 22.23.5, 24.22.3, 26.13.1 | PASS, 13 required probes per runtime |
| `npm-legacy` | npm 9.6.4 and 10.8.2 | Node 20.0.0 and 20.20.2, respectively | PASS for smoke only, 6 passed and 7 skipped per runtime |
| `pnpm-node` | pnpm 11.23.0 | Node 24.22.3, isolated layout, no hoist override | PASS, 13/13 |
| `bun-node` | Bun 1.3.14 | Node 24.22.3 | PASS, 13/13 |
| `yarn-node` | Yarn 4.19.0 | Node 24.22.3, `node_modules` | PASS, 13/13 |
| `yarn-pnp` | Yarn 4.19.0 | Node 24.22.3, PnP loader | PASS, 13/13 |

The CLI checks both TypeScript configurations, ESM, CommonJS, RxJS peer resolution, Vite, Memory storage, reactive queries, 14/20/50/100 simultaneous collections, custom replication, and simulated Dexie persistence in full Node lanes. It exercises both Yarn layouts independently. The Deno package resolution and Bun runtime results are listed in [Runtime Verification](./RUNTIMES.md).

Run a lane with the selected tool on `PATH`:

```sh
artifact="$PWD/release/0.1.3/clatech-db-0.1.3.tgz"
sha=$(awk 'NR == 1 {print $1}' release/0.1.3/SHA256SUMS)
node scripts/compatibility/run.mjs --artifact "$artifact" --sha256 "$sha" --lane pnpm-node --out ./coverage/cla-pnpm
```

The runner writes `results.json` and `REPORT.md`, with executed commands, tool versions, and reasons for unexecuted probes. See the [runner guide](../../scripts/compatibility/README.md) for scratch directory options and exit codes.
