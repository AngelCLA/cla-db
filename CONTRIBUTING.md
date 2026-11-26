# Contributing to CLA DB

Thank you for contributing to CLA DB (`@clatech/db`).
CLA DB is an Apache 2.0 fork of [RxDB](https://github.com/pubkey/rxdb) maintained by CLA Tech. Every contribution must preserve minimal-fork discipline, original licenses, and public API compatibility.

## Core Contribution Rules

1. **Minimal fork surface**: Keep changes tightly scoped. Do not refactor unrelated upstream files. Mark every core modification in `src/` with a short `// CLA-DB:` comment explaining why it diverges from upstream.
2. **No proprietary code**: Never copy, port, or derive code from RxDB Premium. Never falsify Premium flags or bypass license validation mechanisms.
3. **Separate extensions from core**: New adapters (Cloudflare D1/R2, custom SQLite, custom OPFS, diagnostics, visual tools) belong in independent external packages consuming CLA DB's public interfaces, not inside `src/`.
4. **Preserve attributions and license**: Retain Apache 2.0 headers, `LICENSE.txt`, and upstream RxDB credits.
5. **Commit hygiene**: Use small, atomic [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `test:`, `ci:`, `chore:`). Never use force push on shared branches.

## Prerequisites

- The package retains Node.js `>=20`; use Node 24 and npm 11 for the locked development toolchain.
- Protected CI selects Node 22 and 24 LTS lines. The [0.1.3 CI record](release/0.1.3/CI.md) links successful hosted runs; the separate [compatibility matrix](release/0.1.3/COMPATIBILITY.md) scopes Node 20 smoke and other target evidence. Local Node 24 checks alone do not prove the engine range.

Install dependencies:

```sh
npm ci --ignore-scripts --no-audit --no-fund
```

## Development Workflow

Run these checks locally before opening a pull request:

```sh
# 1. Lint TypeScript/JavaScript files
npm run lint

# 2. Build CJS, ESM, TypeScript declarations, and plugin shims
npm run build

# 3. Type-check against the generated declarations
npm run check-types

# 4. Run fast unit test suites
npm run test:fast:memory
npm run test:fast:dexie
```

### Additional Verification Commands

- **Type declarations test**: `npm run test:typings`
- **Circular dependency check**: `npm run test:circular`
- **Dependency check**: `npm run test:deps`
- **Single test file (memory)**:
  ```sh
  npm run transpile && NODE_ENV=fast DEFAULT_STORAGE=memory npx mocha --config ./config/.mocharc.cjs ./test_tmp/unit/cla-db.test.js
  ```
- **External package consumption test**:
  ```sh
  npm run build
  npm pack --pack-destination /tmp/cla-db-pack
  ```
  Install the generated `.tgz` tarball in a clean temporary directory and verify ESM imports, CommonJS `require`, subpath plugin imports (`@clatech/db/plugins/storage-dexie`), and TypeScript compilation (`tsc --noEmit`).

## Code Style and Patterns

Preserved from upstream RxDB guidelines:
- **Language**: TypeScript with ES modules (`import`/`export`).
- **Formatting**: ESLint (`npm run lint` / `npm run lint:fix`).
- **TypeScript conventions**: Do not use `enum`; prefer `type` over `interface` where consistent with surrounding files.
- **Error handling**: Do not use `throw new Error()` in core runtime code. Use `throw newRxError('CODE', { ... })` from `src/rx-error.ts`.
- **Generated directories**: Never edit `/docs`, `/dist`, or `/plugins` directly; they are generated artifacts.
- **Documentation**: Use clear, plain English without em dashes.

## Changelog Updates

- Record every CLA DB fork change in `CLA_CHANGELOG.md` under the target release section.
- Do not publish npm packages or GitHub releases automatically from pull requests.

## Supply-Chain And Release Checks

Commit root and `web/` npm locks when their manifests change. Generate locks with ordinary npm tooling and `--ignore-scripts`; do not hand-edit resolutions or run automatic audit fixes. Install in a disposable checkout when verifying locks so that shared `node_modules` is not replaced. Suppressed lifecycle scripts can affect native integration tests; do not enable them indiscriminately.

For the landing site, build the root first, then run `npm ci --ignore-scripts --no-audit --no-fund`, `npm run build`, and `npm run check` in `web/`. Its check executes the displayed root-library example and verifies the install selector contract.

User-facing install guidance lives in `README.md` and `web/src/install.ts`; the latter feeds the landing selector. When changing an install command or publication state, sync those files, the version copy in `web/src/content.ts`, and the display in `docs-src/docusaurus.config.ts`, then run `npm run check` in `web/`. Verify registry state first: `0.1.3` was npm `latest` on 2026-11-26. Commands are install instructions for the single npm package, never a per-manager support claim.

See [dependency audit commands and limitations](release/0.1.3/DEPENDENCIES.md) and the [publication evidence and manual procedure](release/0.1.3/PUBLISHING.md). Never dispatch publication as a validation step. Security reports follow [SECURITY.md](SECURITY.md), not the public bug template.

## Reporting Bugs

Before opening an issue, check `orga/bug-checklist.md` and include:
- CLA DB version and upstream base commit (from `package.json#claDb`).
- Runtime environment (Node.js/browser version) and storage engine used.
- Minimal reproducible test case.
