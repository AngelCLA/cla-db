# Stage First, Publish Only After Explicit Approval

The manual release workflow verifies and stages a tarball. It does not approve the staged package or make `0.1.2` public. A maintainer reviews the staged bytes and approves the version separately in npm with two-factor authentication (2FA). Local checks do not validate a live OIDC submission.

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

## Settings Required Before Staging

Verify these controls for the single-maintainer release policy:

- The protected `master` branch requires a pull request and the `verify (22)`, `verify (24)`, and `site` checks. It blocks force pushes, deletion, and bypass. If the default branch changes, review and update both workflow guards rather than weakening them.
- The `npm-release` environment allows deployments from `master` only, without a GitHub reviewer requirement. The approval that makes a version public happens in npm, not in GitHub.
- In npm's package settings, verify the GitHub Actions Trusted Publisher for `@clatech/db`: owner `AngelCLA`, repository `cla-db`, workflow filename `publish.yml`, and environment `npm-release`. Keep `npm stage publish` allowed and direct `npm publish` disabled. This workflow does not need `npm dist-tag` permission or a traditional npm token. Confirm this in the npm web UI or with `npm trust list @clatech/db` from a logged-in npm session. A new configuration expires if it does not complete its first successful publish within two days.
- The advisory disposition in [DEPENDENCIES.md](DEPENDENCIES.md#advisory-disposition) is recorded. Remaining viewer redistribution notices are a separate blocker for viewer hosting, not for this npm payload.
- [Staged publishing](https://docs.npmjs.com/staged-publishing/) requires npm `>=11.15.0` and Node `>=22.14.0`. The workflow uses Node 24 on a GitHub-hosted `ubuntu-24.04` runner and grants `id-token: write` only to the staging job. The job stops if npm or Node is too old.

## Stage, Review, And Approve Manually

1. After separate authorization to stage, review the exact protected `master` revision and its successful CI. Confirm the version is not already public or staged. Record the disposition of remaining dependency and license findings, and verify the artifact built from that revision.
2. In the official repository's Actions UI, select **Manually stage vetted CLA DB** on `master`. Enter `STAGE @clatech/db@0.1.2` and the vetted tarball's lowercase 64-character SHA-256. Do not dispatch on a tag, fork, or unprotected branch.
3. The build job installs without lifecycle scripts, verifies the package and consumer graph, and uploads the tarball when its hash matches. The staging job downloads that artifact from the same run and rechecks its hash, package name, and version. It sends that file with `npm stage publish` and provenance. It does not check out repository code, build, install dependencies, or approve a staged package.
4. Review the staged package on npmjs.com or with `npm stage view <stage-id>`. Download its tarball with `npm stage download <stage-id>` and compare its SHA-256 with the vetted hash. Stop if it differs. After explicit approval to make this version public, the maintainer approves it in npm with 2FA. A successful Actions run alone does not make it public.
5. Verify the published integrity, provenance, version, and a fresh consumer installation. Stop on discrepancies. Git tags, GitHub releases, deployments, and upstream notifications are outside this workflow.

## Coverage Boundary

CI selects maintained Node 22/24 LTS lines and pins npm `11.19.1` for the verify matrix without changing `engines.node >=20`. Node 20 is outside this matrix. Local checks used Node `22.23.5` and `24.22.3` with npm `11.19.1`. See [CI evidence](TESTS.md) for observed jobs and remaining checks. No claim is made about all Node patch versions, native services, browsers, or future approval/provenance behavior. The root package and `web/` are locked separately; this workflow does not install or deploy the separate Docusaurus site.
