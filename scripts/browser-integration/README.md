# Browser integration lane

Real-browser integration proof for CLA DB. The lane installs one prebuilt
candidate archive into an isolated Vite consumer, builds a test-only app and
drives it with Playwright against native IndexedDB through the Dexie storage of
the installed package. It is release tooling. Nothing here is published, and
nothing here changes the core.

## Runner contract

```bash
node scripts/browser-integration/run.mjs \
  --artifact /absolute/path/to/clatech-db-0.1.3.tgz \
  --sha256 <sha256 of that exact archive> \
  --browser <chromium|firefox|webkit> \
  --out <report directory>
```

Optional flags:

- `--slice suite|offline|all` selects the lifecycle slice, the offline-first
  slice or both. The default is `all`.
- `--scenario <id>` runs only the named scenario and can be repeated.
- `--work-dir <dir>` is the parent directory for the run scratch directory. The
  default is the operating system temp directory.
- `--playwright-dir <dir>` reuses an existing pinned Playwright installation
  instead of installing one into the isolated consumer. The version must match
  `TOOL_PINS.playwright` exactly.
- `--install-browser` runs `playwright install <browser>` in the isolated
  consumer or in `--playwright-dir`.
- `--timeout <ms>` sets the default scenario and navigation timeout.
- `--keep` keeps the run scratch directory, including browser profiles.
- `--verbose` prints the run log to stdout.

Exit codes:

| Code | Meaning |
| --- | --- |
| `0` | every selected scenario passed |
| `1` | at least one scenario failed |
| `2` | invalid arguments, or the archive hash does not match |
| `3` | the browser lane is unavailable: the pinned browser build is missing or cannot launch |

The archive is never built, packed, installed globally, modified, published or
committed by this lane. The SHA-256 is verified before any scratch directory,
install or browser launch exists, so rejected input leaves no state behind.

## Statuses

| Status | Meaning |
| --- | --- |
| `PASS` | the scenario ran and every assertion held |
| `FAIL` | the scenario ran and an assertion or setup step failed |
| `SKIP` | the scenario was deliberately not executed |
| `UNSUPPORTED` | the environment cannot execute the scenario |

`SKIP` and `UNSUPPORTED` are never counted as passes. Any result that is not
`PASS` fails the gate.

## Pinned tools

The isolated consumer pins `playwright@1.65.1`, `vite@8.4.0` and `rxjs@7.8.2`
and installs `@clatech/db` from the supplied archive. The installed version is
re-read from `node_modules` and must equal the version inside the archive. The
repository's own `node_modules` and lockfiles are never used by the consumer and
no dependency is added to the root `package.json`.

## Browser binaries

Playwright couples each release to exact browser builds. For the pinned
Playwright version those are Chromium `1255`, Firefox `1572` and WebKit `2388`.

Set `PLAYWRIGHT_BROWSERS_PATH` to a project-owned cache and preinstall the
browser in a separate step:

```bash
export PLAYWRIGHT_BROWSERS_PATH=/path/to/project-browser-cache
npx playwright@1.65.1 install --no-shell chromium firefox webkit
```

Linux OS shared libraries are a separate prerequisite. Installing them is an
explicit setup step outside this runner, for example
`npx playwright install-deps <browser>`, or an isolated library directory
exposed through `LD_LIBRARY_PATH`. The report records the value of
`PLAYWRIGHT_BROWSERS_PATH` that was in effect, or `null` for the Playwright
default cache.

Containers that run as root may need `CLA_DB_BROWSER_NO_SANDBOX=1`. It only adds
`--no-sandbox` to the Chromium arguments.

## Scratch and temporary state

Each run creates `cla-db-browser-<browser>-*` under `--work-dir` (or the system
temp directory), keeps the isolated consumer, browser profiles and Playwright
temp artifacts inside it, and removes it unless `--keep` is set. The lane sets
`TMPDIR`, `TMP` and `TEMP` to a directory inside that scratch directory, so a
small or inode-exhausted system temp directory cannot break the browser launch.

`TMPDIR` should still be usable for the initial scratch directory itself.
Nothing is written into the repository.

## S6 scenarios (`suite`)

| Scenario | Behavior under test |
| --- | --- |
| `s6-crud` | create database and collection, insert, query with a selector, update with a revision-height check, delete, close, reopen, remove |
| `s6-reactivity` | reactive query emits on insert, update and delete, and stops emitting after close |
| `s6-collections-14` | 14 collections in one database, write and read in first and last collection, remove |
| `s6-collections-20` | same for 20 collections |
| `s6-collections-50` | same for 50 collections |
| `s6-collections-100` | same for 100 collections |
| `s6-page-reload` | documents persist across a page reload at the same origin |
| `s6-browser-restart` | orderly browser close and reopen of the same persistent profile, same origin |
| `s6-schema-migration` | schema version 0 to 1 migration of stored documents, and no repeated migration on the next reopen |
| `s6-resource-cleanup` | three open/close cycles release tracked collections and subscriptions |

The storage cleanup assertions read `indexedDB.databases()` and check that no
`rxdb-dexie-<database>--<version>--<collection>` database is left behind.

## S7 scenarios (`offline`)

| Scenario | Behavior under test |
| --- | --- |
| `s7-initial-sync` | initial replication through custom handlers converges in both directions |
| `s7-offline-edit-reload` | offline insert and update survive an offline page reload served by the app-shell service worker, and never reach the server |
| `s7-reconnect-convergence` | reconnect pushes offline edits, the server converges to three documents, each stored once |
| `s7-conflict-resolution` | a second client writes the same document; the offline client converges to the master state and the server keeps exactly one document |
| `s7-retry-no-duplicates` | two induced push failures are retried and the document is stored exactly once |

The app-shell service worker caches only the app shell. It never caches `/api/`
traffic, so offline reads come from IndexedDB and replication always talks to
the network.

## Local origin and backend

`server.mjs` serves the built app and a controlled backend on `127.0.0.1` with a
random port. The origin stays the same for the whole browser run, which is what
makes IndexedDB persistence across reload and browser restart meaningful.

Backend endpoints:

- `POST /api/pull` returns documents after the given sequence checkpoint.
- `POST /api/push` accepts write rows. A write is accepted only when the client's
  assumed master state equals the current master state; otherwise the current
  master state is returned so the collection conflict handler resolves it.
- `POST /api/reset` clears one backend collection.
- `GET /api/stats` returns per-collection counters, including accepted writes per
  document id, returned conflicts, request attempts and induced failures.
- `GET /api/docs` returns the stored document states.

Custom replication exchanges document states without revisions. Conflict
detection compares the assumed master state with the stored master state.

## Reports and artifacts

`writeReports()` writes `browser-integration-<browser>.json` and
`browser-integration-<browser>.md` into `--out`, plus:

- `logs/<scenario>.log`: browser console and page errors of that scenario.
- `traces/<scenario>-<profile>.zip`: Playwright trace, written for failed
  scenarios.
- `screenshots/<scenario>.png`: full-page screenshot for failed scenarios.

The JSON report records the artifact path, SHA-256, packed name, version and
upstream storage version, the tested commit, browser, pinned tool versions,
`PLAYWRIGHT_BROWSERS_PATH`, Node.js version, platform, every scenario result and
the explicit limitations.

## Limitations

- WebKit results come from the Playwright WebKit build. They are not Safari or
  iOS certification.
- Crash recovery after an abrupt process kill is not covered. Only orderly page
  reload and browser restart are tested.
- No performance measurement is part of this lane.
