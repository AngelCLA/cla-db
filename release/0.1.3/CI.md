# Compatibility CI

[Compatibility CI](../../.github/workflows/compatibility.yml) builds and packs once per run. The `pack` job uploads `cla-package`, containing the tarball and `SHA256SUMS`. Each consumer and browser job verifies the downloaded bytes against that file and the pack job's SHA-256 output before installing the candidate. The runners verify the SHA-256 again when given the artifact.

## Review the Evidence

1. Open the run for the commit under review. Check the `pack` job's output and the SHA-256 used by the consumer jobs.
2. Download `consumer-*` and `browser-*` result artifacts. The jobs upload results on failure as well as success. If setup fails before a report exists, use the job log and record the missing report instead of treating it as a pass.
3. Check the result of each probe. `SKIP` and `UNSUPPORTED` do not extend the verified support matrix. The legacy Node 20 job uses the smoke lane, not the Vite or TypeScript integration lane.

The matrix covers the Node 20 floor and final patch, Node 22/24/26, npm, pnpm default layout, Bun as installer and runtime, Yarn with `node_modules` and PnP, Deno npm resolution, Chromium, Firefox, and WebKit. The workflow runs on pull requests, selected branch pushes, or explicit manual dispatch. It requests `contents: read` and no publishing permissions. It does not modify the protected `verify (22)`, `verify (24)`, or `site` checks. Staged publishing remains separate in `publish.yml`.

Run the local policy fixture without contacting the registry or dispatching Actions:

```sh
node scripts/release-supply-chain-fixtures/compatibility-workflow-policy.mjs
```

The `pack` job runs the same fixture before compiling. It checks artifact identity wiring, read-only permissions, exact Action references, and the expected matrix. A passing local fixture is not evidence of an executed hosted run.
