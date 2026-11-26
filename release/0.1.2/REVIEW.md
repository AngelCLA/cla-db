# CLA DB 0.1.2 Candidate Review

**Ready for local review. Not cleared for publication.** The unpublished npm tarball was rebuilt from `34196d9ab5` plus the scoped Firestore gRPC override and tested on Node `24.22.3`. The [package report](PACKAGE.md) binds the evidence to its SHA-256 and npm integrity.

## Changes And Decisions

| Area | Decision and evidence |
| --- | --- |
| Upstream and storage | Keep the exact foundation and storage version `17.6.0` while publishing under fork SemVer `0.1.2`. Keep the upstream merge history, collection lifecycle, and Premium validation. See [upstream ancestry](../../UPSTREAM.md) and [compatibility evidence](COMPATIBILITY.md). |
| Privacy and sites | Remove automatic dev-mode marketing traffic and documentation conversion callbacks. Keep attribution and explicitly configured integrations. See the [network audit](NETWORK_AUDIT.md) and [site checks](SITES.md). |
| npm distribution | Keep all `56` exports and required assets. Exclude website and development files. Use a detached consumer for ESM, CommonJS, types, and runtime proof. See [package inventory](PACKAGE.md) and [test results](TESTS.md). |
| Supply chain | Lock root and landing installs separately and run them without lifecycle scripts. Audit the installed production graph separately from the development graph. See [dependency findings](DEPENDENCIES.md) and the [CycloneDX SBOM](sbom.cdx.json). |
| Release controls | Require a separate manual workflow, protected default branch with required CI, a branch-restricted `npm-release` environment under the single-maintainer policy, the exact artifact hash, and job-scoped npm OIDC. See the [publishing procedure](PUBLISHING.md). |

## Open Before Publication

1. Review and explicitly disposition the `26` moderate development audit findings and the remaining redistribution questions. Scoped development overrides removed the legacy `ws` and Firestore gRPC high findings. There were no high or critical development findings in the current audit. The audited production graph returned zero known advisories; it is not the same graph.
2. Obtain successful CI evidence on the reviewed protected revision, confirm Trusted Publisher and environment protections, and independently compare the exact bytes. A named environment is not proof that deployments are restricted to the protected branch.
3. Obtain separate authorization for publication. [GitHub release notes](RELEASE_NOTES.md) are a draft. No publication workflow was dispatched and no package, GitHub release, or tag was created.

## Limits Of This Review

- Node 20 and 22, real-browser storage durability, and external service integrations were not verified. Do not extend the passing local Node 24 and simulated IndexedDB evidence to those environments.
- The generated standalone viewer is outside the npm payload. Applicable third-party notices remain a blocker for separate viewer redistribution. Deployed sites and live network traffic were not certified.
- Preserve the original [upstream changelog](../../CHANGELOG.md), the [fork changelog](../../CLA_CHANGELOG.md), and the [roadmap](../../ROADMAP.md) as separate records.
