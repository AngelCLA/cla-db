# Vet First, Publish Only After Explicit Approval

The workflows prepare a future manual release. This task has not configured repository settings, registered a Trusted Publisher, granted OIDC, dispatched Actions, or published anything. Static probes cannot prove those remote gates.

## Non-Publishing Vetting

Use a fresh disposable checkout of the exact reviewed revision, with Node 24 and npm 11. Keep generated state outside the shared working tree.

```sh
npm ci --ignore-scripts --no-audit --no-fund
node scripts/release-supply-chain-fixtures/legacy-ws-resolution.mjs
node scripts/release-supply-chain-fixtures/firestore-grpc-resolution.mjs
npm run lint
npm run build
npm run check-types
npm run test:typings
npm run test:circular
npm run test:fast:memory
npm run test:fast:dexie
node scripts/verify-pack-consumer.mjs
node scripts/release-supply-chain-fixtures/workflow-policy.mjs
pack_dir=$(mktemp -d)
npm pack --ignore-scripts --json --pack-destination "$pack_dir"
sha256sum "$pack_dir/clatech-db-0.1.2.tgz"
node scripts/check-release-supply-chain.mjs --artifact "$pack_dir/clatech-db-0.1.2.tgz"
node scripts/check-release-supply-chain.mjs --dev-lock
npm audit --audit-level=moderate
```

The development collector reports the underlying audit exit in JSON; its own success means collection succeeded, not that the graph is clean. `npm audit` currently exits 1. Review and explicitly disposition the [known findings](DEPENDENCIES.md) before any release. No automatic fixes are authorized. Preserve the vetted tarball and SHA-256 in independent review evidence. Refresh the SBOM with the artifact command's optional third argument `release/0.1.2/sbom.cdx.json` when the release bytes change. The recorded candidate hash is evidence, not an input to reuse blindly after rebuilding.

## Settings Required Before Enabling Publication

A read-only GitHub check reported that `master` was unprotected, the repository had no active rulesets, and `npm-release` was not listed. A passing CI run on the review branch does not configure these gates or authorize publication. The repository uses a single-maintainer release policy. Verify these controls before publication:

- Protect the official repository's default branch `master`: require a pull request and the verified CI checks, without a mandatory second-person approval. Block force pushes and branch deletion and prevent bypass where available. If the default branch changes, review and update both workflow guards rather than weakening them.
- Create `npm-release` with a deployment branch rule for `master` only and no required reviewer. This policy does not provide independent human review. It relies on protected-branch CI, manual dispatch, explicit release confirmation, the vetted artifact hash, and the job-level OIDC boundary.
- In npm's package settings, configure a GitHub Actions Trusted Publisher for package `@clatech/db`, owner `AngelCLA`, repository `cla-db`, workflow filename `publish.yml`, and environment `npm-release`. Use the environment restriction rather than a repository-only trust relationship. Review package publishing access and disallow long-lived token publishing where supported.
- Follow [npm Trusted Publishing requirements](https://docs.npmjs.com/trusted-publishers/): npm `>=11.5.1`, Node `>=22.14.0`, GitHub-hosted runner, and job-level `id-token: write`. The workflow uses Node 24 on `ubuntu-24.04` and fails closed when the installed npm/Node versions are too old. There is no token fallback.

## Later Manual Publication

1. After separate authorization, review the exact protected `master` revision and successful CI evidence. Confirm the package version is still unpublished and approve dependency/license residual risks. Retest the final artifact rather than treating this report as release approval.
2. In the official repository's Actions UI, manually select `publish.yml` on `master`. Enter `PUBLISH @clatech/db@0.1.2` and the independently vetted tarball's lowercase 64-character SHA-256. Do not dispatch on a tag, fork, or unprotected branch.
3. The build job installs without lifecycle scripts, runs verification, packs, audits the consumer graph, and checks the supplied hash. Its immutable v4 artifact is downloaded within the same run. A mismatch stops the release; investigate it rather than replacing the expected hash without review.
4. Under the single-maintainer policy there is no second approval after dispatch. The maintainer checks the exact revision, CI, hash, and release authorization before dispatching. Only the separate publish job has OIDC permission. It checks the hash again and exact manifest name/version, then publishes the tarball with `--provenance --access public --ignore-scripts`. It does not check out or build repository code, install dependencies, or execute package lifecycle scripts.
5. After publication, independently verify registry integrity, provenance association, version, and a fresh consumer installation. Stop on discrepancies. Tags, GitHub releases, deployments, and upstream notifications are not part of this workflow.

## Coverage Boundary

CI selects maintained Node 22/24 LTS lines, without changing `engines.node >=20`. Node 20 is outside current maintained LTS coverage; this matrix does not prove its engine-floor compatibility. Local checks used Node `24.22.3` / npm `11.19.1`; remote CI and both matrix entries remain unrun here. No claim is made about all Node patch versions, native services, browsers, or future approval/provenance behavior. The root package and `web/` are locked separately; this workflow does not install or deploy the separate Docusaurus site.
