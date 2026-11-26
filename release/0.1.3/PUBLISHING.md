# Stage Only, Then Publish Only After Explicit Approval

Version `0.1.3` is a local candidate. It is not published, and no staging run for it has been attempted. The manual release workflow verifies and stages a tarball, and it never approves a staged package or makes a version public. A maintainer reviews the staged bytes and approves the version separately in npm with two-factor authentication (2FA). Local checks do not validate a live OpenID Connect (OIDC) submission.

## Why The 0.1.2 Staging Run Failed

The previous release attempted the manual workflow `Manually stage vetted CLA DB`. The build job passed and the staging job failed with:

```text
ENEEDAUTH
This command requires you to be logged in to https://registry.npmjs.org/
```

Reference run: [45837219576](https://github.com/AngelCLA/cla-db/actions/runs/45837219576).

Current status, verified before writing this page:

- `@clatech/db@0.1.2` is public. It was published manually by the maintainer with 2FA, not by the workflow. The registry integrity recorded for the published `0.1.2` matched the previously recorded publication evidence.
- The immutable-subject exchange failure tracked in [npm/cli#9969](https://github.com/npm/cli/issues/9969) is open, and the trusted publisher configuration for this package uses `use_immutable_subject: true`.
- `npm view @clatech/db versions` returns `0.0.0-stage`, `0.1.1`, and `0.1.2`. `npm view @clatech/db@0.1.3 version` returns `E404`, so `0.1.3` is not published, and no staging run for it exists.

`ENEEDAUTH` has more than one possible cause. Candidate causes remain the trusted publisher binding, the immutable subject for this repository and workflow, the npm CLI version used by the staging job, the `id-token: write` exchange, and the `npm-release` environment. Treat the manual 2FA publication of `0.1.2` as a fallback that worked, not as evidence that OIDC works.

Do not add a permanent npm token, disable provenance, move publication into a test workflow, or relax the protected branch guard to work around this failure.

## Version State

- Package version: `0.1.3`
- Registry latest: `0.1.2`
- Tarball name: `clatech-db-0.1.3.tgz`
- Storage compatibility version: `17.6.0`
- Staging authorization: none

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
sha256sum "$pack_dir/clatech-db-0.1.3.tgz"
node scripts/check-release-supply-chain.mjs --artifact "$pack_dir/clatech-db-0.1.3.tgz"
node scripts/check-release-supply-chain.mjs --dev-lock
npm audit --audit-level=moderate
```

`workflow-policy.mjs` keeps a deterministic offline probe of the staging version guard. It feeds four fake package manifests to the exact guard program the staging job runs and expects exit `0` for `@clatech/db@0.1.3` and exit `1` for the retired `0.1.2`, a manifest without a version, and a package named `rxdb`. The probe reads no credentials, requests no OIDC token, and contacts no registry.

The packaging and consumer checks read the version from `package.json`. `verify-pack-consumer.mjs`, `verify-storage-compat.mjs`, `check-release-supply-chain.mjs`, and the ordinary CI artifact audit therefore fail when the built artifact does not carry the manifest version, and they do not need a manual edit on the next version bump.

The development collector reports the underlying audit exit in JSON. Its own success means collection succeeded, not that the dependency graph is clean. `npm audit` currently exits 1. Review and explicitly disposition the known development advisories before any release. No automatic fixes are authorized. Preserve the vetted tarball and its SHA-256 in independent review evidence. The recorded candidate hash is evidence, not an input to reuse blindly after rebuilding.

## Settings Required Before Staging

Verify these controls for the single-maintainer release policy. The rule values below were read from the repository settings on `master` and are recorded here as observed context, not as a claim that they stay unchanged:

- The protected `master` branch requires a pull request and the `verify (22)`, `verify (24)`, and `site` checks supplied by the GitHub Actions app (`15368`). Administrator enforcement is on, force pushes and deletion are blocked, and zero additional approvals are required. If the default branch changes, review and update both workflow guards rather than weakening them.
- The `npm-release` environment allows deployments from `master` only. The approval that makes a version public happens in npm, not in GitHub.
- In npm's package settings, verify the GitHub Actions Trusted Publisher for `@clatech/db`: owner `AngelCLA`, repository `cla-db`, workflow filename `publish.yml`, and environment `npm-release`. Keep `npm stage publish` allowed and direct `npm publish` disabled. The workflow does not need `npm dist-tag` permission or a traditional npm token. Confirm this in the npm web UI or with `npm trust list @clatech/db` from a logged-in npm session. The configuration uses `use_immutable_subject: true`, which is the setting that interacts with [npm/cli#9969](https://github.com/npm/cli/issues/9969); confirm it again before staging and keep it enabled unless a maintainer approves a change.
- [Staged publishing](https://docs.npmjs.com/staged-publishing/) requires npm `>=11.15.0` and Node `>=22.14.0`. The workflow uses Node 24 on a GitHub-hosted `ubuntu-24.04` runner and grants `id-token: write` only to the staging job. The job stops if npm or Node is too old.
- The advisory disposition recorded for `0.1.2` still applies. Remaining viewer redistribution notices stay a separate blocker for viewer hosting, not for the npm payload.

## Stage, Review, And Approve Manually

1. After separate authorization to stage, review the exact protected `master` revision and its successful CI. Confirm that `0.1.3` is not already public or staged. Record the disposition of remaining dependency and license findings, and verify the artifact built from that revision.
2. In the official repository's Actions UI, select **Manually stage vetted CLA DB** on `master`. Enter `STAGE @clatech/db@0.1.3` and the vetted tarball's lowercase 64-character SHA-256. Do not dispatch on a tag, fork, or unprotected branch.
3. The build job installs without lifecycle scripts, verifies the package and consumer graph, and uploads the tarball when its hash matches. The staging job downloads that artifact from the same run and rechecks its hash, the package name, and the exact version `0.1.3`. It sends that file with `npm stage publish ./clatech-db-0.1.3.tgz --provenance --access public --ignore-scripts`. It does not check out repository code, build, install dependencies, or approve a staged package.
4. Review the staged package on npmjs.com or with `npm stage view <stage-id>`. Download its tarball with `npm stage download <stage-id>` and compare its SHA-256 with the vetted hash. Stop if it differs. After explicit approval to make this version public, the maintainer approves it in npm with 2FA. A successful Actions run alone does not make it public.
5. Verify the published integrity, provenance, version, and a fresh consumer installation. Stop on discrepancies. Git tags, GitHub releases, deployments, and upstream notifications are outside this workflow.

If the staging job fails with `ENEEDAUTH` again, record the run, the npm and Node versions, and the trusted publisher configuration. Do not retry with a token and do not approve anything. The documented fallback is a manual publication by the maintainer with 2FA from a locally vetted tarball whose SHA-256 is recorded first.

## What This Workflow Does Not Do

- It does not publish or approve `0.1.3`.
- It does not modify historical releases, tags, or the `0.1.2` evidence.
- It does not grant publication permissions to test or compatibility workflows.
- It does not prove that trusted publishing works for this repository.

## Coverage Boundary

CI selects maintained Node 22 and 24 LTS lines and pins npm `11.19.1` for the verify matrix without changing `engines.node >=20`. Node 20 is outside this matrix. See the release test evidence for observed jobs and remaining checks. No claim is made about all Node patch versions, native services, browsers, or future approval and provenance behavior. The root package and `web/` are locked separately, and this workflow does not install or deploy the separate site.
