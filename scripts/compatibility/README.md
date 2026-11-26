# Detached package and runtime compatibility lanes

This directory contains the runner that consumes one prebuilt CLA DB tarball
and verifies it in isolated npm, pnpm, Bun, Yarn and Deno consumers.

The runner never builds, packs, publishes, or edits the candidate. It never
writes into the repository: each lane works in a fresh directory outside the
worktree and removes it again, including when a check fails.

## Usage

```bash
node scripts/compatibility/run.mjs \
  --artifact /absolute/path/clatech-db-0.1.3.tgz \
  --sha256 <64 character SHA-256> \
  --lane npm-node \
  --out /absolute/evidence/npm-node \
  --scratch /absolute/scratch
```

Options:

| Option | Meaning |
| --- | --- |
| `--artifact <path>` | Prebuilt `@clatech/db` tarball. Required. |
| `--sha256 <digest>` | Expected SHA-256, verified before any install. Required. |
| `--lane <id>` | Lane to run. See `--list-lanes`. Required. |
| `--out <directory>` | Receives `results.json` and `REPORT.md`. Required. |
| `--scratch <directory>` | Base directory for the isolated consumer. Defaults to `$CLA_COMPAT_SCRATCH` or the system temp directory. Must be outside the repository. |
| `--path <directory>` | Prepends a directory to `PATH` for exact tool versions. Repeatable. |
| `--timeout <ms>` | Timeout for one install or one check. Default `600000`. |
| `--dry-run` | Verifies the artifact and records every planned check as `SKIP`. No package manager runs. |
| `--list-lanes` | Prints the lane registry and planned checks as JSON. |

Exit codes: `0` PASS, `1` FAIL, `2` usage or artifact error, `3` UNSUPPORTED,
`4` INCOMPLETE or dry run.

## Lanes

| Lane | Package manager | Runtime | Layout |
| --- | --- | --- | --- |
| `npm-node` | npm | Node.js | `node_modules` |
| `npm-legacy` | npm | Node.js 20.0.0 floor | `node_modules` |
| `pnpm-node` | pnpm | Node.js | isolated `node_modules` |
| `bun-node` | Bun | Node.js | `node_modules` |
| `bun-bun` | Bun | Bun | `node_modules` |
| `yarn-node` | modern Yarn | Node.js | `node_modules` |
| `yarn-pnp` | modern Yarn | Node.js | Plug'n'Play |
| `deno` | Deno | Deno | Node module directory |

`npm-legacy` is the stable interface for the declared Node.js 20.0.0 floor
smoke. It only imports the package with ESM and CommonJS, checks the RxJS peer
and runs basic CRUD. Vite, TypeScript, Dexie, migrations and the collection
matrix are reported as skipped with their reason, and the lane is not a full
runtime result.

The full Node lanes run: RxJS peer resolution, ESM, CommonJS, TypeScript
NodeNext, TypeScript Bundler, Vite bundle, Dexie-simulated IndexedDB
migrations, custom replication, 14/20/50/100 collections and resource cleanup.

The Bun runtime lane runs ESM, CommonJS, TypeScript directly, Dexie-simulated
IndexedDB, replication, collections and cleanup. Vite and TypeScript
declaration resolution are reported as skipped because they are asserted on the
Node lanes.

The Deno lane runs ESM, CommonJS, collections, replication and cleanup against
extracted candidate bytes, plus a deprecated DenoKV smoke with an in-memory
`Deno.openKv` and `--unstable-kv`.

## Result model

Every planned check is reported as one of:

- `PASS`: executed and satisfied.
- `FAIL`: executed and not satisfied.
- `SKIP`: deliberately not executed, with a reason.
- `UNSUPPORTED`: the environment cannot run the lane, for example a missing
  tool or Yarn below the modern major.

`results.json` carries the verdict, `supported` boolean, per-check exit code,
duration, command and captured output. `REPORT.md` is the readable form of the
same evidence.

The verdict is `PASS` only when every required check passed. A skipped or
unsupported required check produces `INCOMPLETE` or `UNSUPPORTED`, never
`PASS`. `supported` is `false` for every other verdict. `--dry-run` produces
`NOT_RUN`.

## Isolation and policy

- The artifact URI is a local `file:` path. No lane installs from a registry
  copy of `@clatech/db`.
- Each consumer generates its own lockfile in its own directory.
- `shamefully-hoist`, `node-linker=hoisted` and equivalent settings are
  forbidden. The runner writes an explicit isolated pnpm layout, an explicit
  Yarn linker, and rejects hoisting configuration in the staged consumer.
- Inherited `NODE_PATH`, `NODE_OPTIONS`, linker and hoisting settings are
  removed from the child environment. `TMPDIR`, `TMP` and `TEMP` point inside
  the scratch directory, so tool temp files are released with it.
- Fixture dependencies are pinned in `package-managers.mjs` and mirror the core
  tooling: RxJS `7.8.2`, Dexie `4.4.2`, `fake-indexeddb` `6.2.8`, TypeScript
  `6.0.3`, Vite `6.4.1`.
- `fixtures/verify-integrations.mjs` and `fixtures/verify-vite.mjs` are copied
  read-only from `scripts/pack-consumer-fixtures/`. Do not edit them here.

## Known limits

- Deno resolves the extracted candidate through a `file:` package dependency
  with the artifact runtime dependencies declared explicitly. npm specifier
  consumption of a published package is a separate check and is not covered.
- The DenoKV plugin is deprecated upstream. The smoke proves an in-memory
  `Deno.openKv` instance only. It is not evidence for Deno Deploy, remote KV,
  or file-backed KV, and it must not be described as generally verified.
- Yarn Plug'n'Play results apply only to the exact modern Yarn version recorded
  in the report. Yarn 1 is reported as `UNSUPPORTED` instead of being treated
  as a pass.
- Bun as a package manager is reported separately from Bun as a runtime.
- Dexie inside Bun runs against simulated IndexedDB, not native persistent
  IndexedDB. Browser and PWA evidence belongs to the browser integration suite.

## Tests

```bash
node --test scripts/compatibility/test/run.test.mjs
node_modules/.bin/eslint scripts/compatibility
```

The tests never install from a registry. They cover argument validation,
artifact identity, lane planning, dry runs, explicit skip reasons, a failing
install executed by a fake package manager, an installed package whose version
does not match the artifact, Yarn below the modern major, and the rule that a
required `SKIP` is never reported as `PASS`.
