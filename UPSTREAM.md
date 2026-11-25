# Upstream Maintenance Strategy

CLA DB is maintained as a minimal fork of [RxDB](https://github.com/pubkey/rxdb).
The goal is to pull upstream bugfixes and releases with minimal merge friction and zero history rewrites.

## Repository Topology

| Remote | URL | Purpose |
| --- | --- | --- |
| `origin` | `https://github.com/AngelCLA/cla-db.git` | CLA DB fork repository |
| `upstream` | `https://github.com/pubkey/rxdb.git` | Original RxDB repository (read-only) |

Verify remotes before syncing:

```sh
git remote -v
```

If `upstream` is missing in a fresh clone:

```sh
git remote add upstream https://github.com/pubkey/rxdb.git
git remote set-url --push upstream no_push
```

## Tracking Upstream Base

Every CLA DB release records the exact upstream version and commit in two places:
1. `package.json` under the `claDb` field (`upstreamVersion`, `upstreamCommit`, `upstreamTagOffset`).
2. `CLA_CHANGELOG.md` under the release section.

## Exact 0.1.2 Ancestry

The immutable foundation is RxDB `17.6.0+522`, `9d5849cf4c695ffc27d60e134b2039539e77a9b0`, still recorded in `package.json#claDb`. Storage compatibility remains `17.6.0`.

Nine additional upstream commits through `d08621c7e26859e017a78a9615f5951fd4803b18` were **merged**, via `515bb00884` and `e41bc43cfb`. They are not cherry-picks and do not replace the foundation metadata:

| Upstream commit | Inherited change |
| --- | --- |
| `134ee9c87724121c53dc660bbe55200eef4aeeea` | Ionic Angular dependency update |
| `4c65610b87323241bb647913bb38a685fc07d80d` | Electron dependency update |
| `d8ab5eb2207186a7de945c0c18a35862794a61b2` | Primary keys such as `constructor` and `__proto__` in replication and migration |
| `f53c02d937dc86cd7fffa28f97ca274859b90c1f` | Google Drive / OneDrive WebRTC reconnect after restart |
| `88276be6bde0fd4f934038ae85f0c731ea5dbd60` | Angular, Vue, and Svelte integration documentation |
| `31492a4972819a52cfa4d88755b4ffc358f07a77` | Prevent storing documents rejected by DOC20 through DOC23 |
| `f09241409142c178c99634fbc7e73429db89f5a2` | Documentation learning-curve guidance |
| `b3fc33f42cf4ba7ad87760f97b2cec8362ecb997` | Close replication change streams on pause and reopen on start |
| `d08621c7e26859e017a78a9615f5951fd4803b18` | Correct RxServer `startRxServer()` documentation |

Reproduce the ancestry inventory with `git log --format='%H %s' 9d5849cf4c695ffc27d60e134b2039539e77a9b0..d08621c7e2`. Fork-specific changes are recorded separately in [CLA_CHANGELOG.md](./CLA_CHANGELOG.md), not attributed to these commits. Do not rewrite the original RxDB changelog.

## CLA DB Delta Surface (Expected Conflict Points)

Keep fork modifications small. The historical conflict surface below is a guide, not a claim that later verified fixes never touch other files. The 0.1.2 candidate also changes dev-mode registration, packed-consumer/compatibility probes, site tracking, and release evidence. Review those explicitly on every sync:

| File | Reason for Fork Delta |
| --- | --- |
| `src/rx-collection.ts` | Removal of the artificial `COL23` collection limit check (marked with `// CLA-DB:`) |
| `test/unit/rx-collection.test.ts` | Updated test asserting >13 collections work without `COL23` |
| `test/unit/cla-db.test.ts` | CLA DB-specific test and benchmark suite (fork-only file) |
| `test/unit.test.ts` | Registers `test/unit/cla-db.test.ts` in the unit test entrypoint |
| `package.json` | `@clatech/db` identity, version, `publishConfig`, and `claDb` metadata |
| `scripts/update-version-variable.mjs` | Reads `packageJson.claDb.upstreamVersion` for `RXDB_VERSION` |
| `scripts/generate-plugins-package-json.mjs` | Plugin shim package naming (`cla-db-plugins-*`) |
| `scripts/verify-pack-consumer.mjs` | Fork-only `npm pack` external consumer verification script (ESM, CJS, TS) |
| `test/tutorials/package.json`, `test/tutorials/src/typescript.ts` | Updated package import from `rxdb` to `@clatech/db` |
| `eslint.config.mjs` | Ignore local agent metadata directories (`.atl/*`, `.agent/*`, `odd/*`, `skills/*`) |
| `.github/workflows/*` & `renovate.json` | CLA DB CI workflow; upstream publish/notify workflows removed; automerge disabled |
| Top-level fork docs | `README.md`, `AGENTS.md`, `SYSTEM_DESIGN.md`, `ROADMAP.md`, `UPSTREAM.md`, `CLA_CHANGELOG.md`, `CONTRIBUTING.md` |

Avoid editing files outside this surface unless fixing a verified bug required by CLA DB.

## Procedure: Syncing a New Upstream Release

Never use `git push --force` on shared branches (`master` or release branches). Always perform upstream updates on a dedicated sync branch.

### 1. Fetch upstream refs

```sh
git fetch upstream --tags
```

### 2. Create a sync branch from CLA DB `master`

```sh
git checkout master
git pull origin master
git checkout -b chore/upstream-sync-<target-tag-or-sha>
```

### 3. Inspect upstream changes before merging

```sh
# Compare current recorded upstreamCommit against target ref
git log --oneline <current-upstreamCommit>..<target-ref> -- src/
git log --oneline --grep="BREAKING" <current-upstreamCommit>..<target-ref>
```

Check specifically whether upstream changed:
- `src/rx-collection.ts` (around `RxCollectionBase.prepare()` and `OPEN_COLLECTIONS`)
- `src/rx-database-internal-store.ts` (on-disk `rxdbVersion` compatibility rules)
- `package.json` (`exports`, dependencies, or major version bump)
- `.github/workflows/` (ensure no newly added upstream publish/deploy workflows slip in)

### 4. Merge the target upstream ref

```sh
git merge --no-commit --no-ff <target-ref>
```

### 5. Resolve conflicts carefully

- **`src/rx-collection.ts`**: Keep upstream improvements to `prepare()` and `OPEN_COLLECTIONS`, while keeping the `// CLA-DB:` removal of the `COL23` limit block.
- **`package.json`**: Accept upstream dependency and `exports` updates; preserve `@clatech/db` name, author, repository, `publishConfig`, and update `claDb.upstreamVersion` / `claDb.upstreamCommit`.
- **On-disk version check**: If upstream bumped its major version (for example `17.x` -> `18.0.0`), update `claDb.upstreamVersion` to match and verify `isDatabaseStateVersionCompatibleWithDatabaseCode()` in `src/rx-database-internal-store.ts`.
- **`.github/workflows/`**: Delete any newly merged upstream publish, release, docs-deploy, or `rxdb-server` notification workflows immediately before committing.

### 6. Run full regression verification

```sh
npm install
npm run lint
npm run check-types
npm run build
npm run test:fast:memory
npm run test:fast:dexie
```

Also run the CLA DB suite and external consumer `npm pack` check (see `CONTRIBUTING.md`).

### 7. Update fork records and commit

1. Record the new upstream version, commit hash, and any resolved conflicts in `CLA_CHANGELOG.md`.
2. Complete the merge commit with a clear Conventional Commit message (`chore(upstream): merge rxdb <tag-or-sha>`).
3. Open a pull request into CLA DB `master` and wait for CI green before merging.
