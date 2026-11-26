# Runtime Verification

All package claims below apply to the [local 0.1.3 tarball and SHA-256](./PACKAGE.md) on Linux x86-64. The embedded database storage compatibility version remains `17.6.0`.

## Node.js

Full detached ESM, CommonJS, NodeNext, Bundler, Vite and behavior probes passed on Node **22.23.5, 24.22.3, and 26.13.1** with npm 11.19.1. Node **20.0.0** and **20.20.2** passed the legacy npm smoke only. Vite, types, the collection-count matrix, simulated Dexie and deeper lifecycle probes were not run in the Node 20 smoke. [The Node.js project](https://nodejs.org/en/about/previous-releases) lists 20 as EOL and 22, 24, and 26 as LTS on November 26, 2026. This does not make Node 20 maintained or make all future releases verified. `engines.node: >=20` is unchanged.

## Bun

Bun **1.3.14** installed the tarball for Node and also executed it directly. The Bun runtime lane passed 11 required probes, including ESM, CommonJS, native TypeScript, RxJS, reactive CRUD, 100 collections, bidirectional replication, retry/pause/resume, conflict resolution and cleanup. Three Node-oriented declaration/bundle probes did not run in the Bun runtime lane; its Dexie checks used simulated IndexedDB. The [full inherited Bun suites](./TESTS.md) failed separately, so the passing detached lane does not certify the entire Bun suite. Bun's [`bun:sqlite`](https://bun.com/docs/runtime/sqlite) API is a potential SQLite adapter basis, not an implemented or verified CLA DB storage.

## Deno

Deno **2.8.3** passed 9 required probes (6 skipped) with the candidate's SHA-verified extracted files in a detached local package consumer. It uses explicit dependencies because direct `file:` tarball resolution did not unpack and resolve dependencies in the exploratory route. The lane covers ESM, RxJS reactive CRUD, collections, custom replication, cleanup and an in-memory deprecated DenoKV adapter smoke using `--unstable-kv`. It does not verify Deno Deploy, remote or file-backed KV, the inherited full suite, `deno check`, or a drop-in Node toolchain.

A separate npm-specifier smoke resolved `npm:@clatech/db@0.1.3`, the Memory subpath, and `npm:rxjs@7.8.2` through a loopback npm registry configured only for `@clatech`. The registry served the checked candidate bytes. The detached `deno.lock` recorded the same SHA-512 as the archive. After dependency cache population, `deno run --cached-only --no-prompt --allow-env=NODE_ENV,TMPDIR consumer.ts` passed Memory insert, reactive read, storage version and close. `TMPDIR` is needed by the Node `os.tmpdir()` compatibility path used by `broadcast-channel` on import. The successful smoke did not grant broad file, network, or process permissions. The inherited scripts still request `-A` and were not run.
