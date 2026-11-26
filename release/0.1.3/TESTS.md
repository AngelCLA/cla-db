# Core Verification

This log distinguishes inherited full suites from detached candidate evidence. All local commands below used Linux x86-64, Node 24.22.3 and npm 11.19.1 except the explicitly named Bun suite. The [package identity](./PACKAGE.md) and the compatibility results bind the detached tests to the exact tarball.

| Command or check | Result | Evidence and limits |
| --- | --- | --- |
| `npm run lint` | PASS | Exit 0 after scoped fixture corrections. The first partial-workspace run failed and did not reach types/build. |
| `npm run check-types` | PASS | Exit 0. |
| `npm run build` | PASS | Exit 0; generated declarations, ESM, CommonJS and viewer build. Existing Babel warnings. |
| `npm run test:typings` | PASS | Exit 0. |
| `npm run test:fast:memory -- --jobs 2` | PASS | 1,833 passing, including the blocked network and no-iframe tests. |
| `npm run test:fast:dexie -- --jobs 2` | PASS | 1,837 passing using simulated IndexedDB. Not a browser durability claim. |
| `madge --circular` on the core ESM entry, Dexie entry, and transpiled tests | PASS | Three checks reported no cycles; existing warnings. Ran the final stages of `test:circular` against existing build/test outputs to avoid rebuilding the candidate. |
| `npm run test:bun:memory` | FAIL | Bun 1.3.14, exit 1. Mocha CLI could not `require()` the async `lib/cli/unparse-args.js` module. This is a failure to start the inherited suite, not a detached consumer result. |
| `npm run test:bun:dexie` | FAIL | Bun 1.3.14, 455 passing, one failed nested property access assertion. The process returned 0 despite Mocha reporting the failure; the lane is not a pass. |
| `npm run test:deno:{memory,dexie,denokv}` | SKIP | Inherited scripts grant `-A`; no blanket permission was granted for the detached evaluation. Deno 2.8.3 accepted the legacy flags in a no-permission preflight and its in-memory KV API opened, wrote, read, and closed. Neither observation verifies the CLA DB adapter by itself. The separate detached Deno lane passed an in-memory adapter smoke; see [Runtime Verification](./RUNTIMES.md). |
| Detached package and storage CLI `node --test` fixtures | PASS | 25 passed, no failures or skips. |
| `node scripts/release-supply-chain-fixtures/workflow-policy.mjs` | PASS | Protected-master staging policy, ten mutation probes and one offline package version guard probe. No registry write. |
| `node scripts/release-supply-chain-fixtures/compatibility-workflow-policy.mjs` and `actionlint` 1.7.9 | PASS | Local policy, matrix and immutable archive wiring; not hosted evidence. |
| `npm --prefix web run check` and `npm --prefix web run build` | PASS | Five install tabs and commands, site styles, TypeScript, and Vite. A separate Playwright 1.65.1 Chromium check passed real focus, clipboard and expected Spanish release-state metadata. |

No CI run for the 0.1.3 work was executed as part of this local review. Do not conflate 0.1.2's verified protected-master status with the 0.1.3 branch. See [Compatibility CI](./CI.md) and [Dependency Evidence](./DEPENDENCIES.md).
