# Local Candidate Review

Review the [compatibility matrix](./COMPATIBILITY.md) and the [JSON evidence](./compatibility-results.json) before using this candidate. The implementation revision under test is `8891dabc42f220e451223bed4ebbca55e47127ae`. The following evidence-only commit does not change package inputs or test code. Preserve the [archive SHA-256](./PACKAGE.md) when moving the tarball outside the checkout.

## Review Order

| Commit | Surface |
| --- | --- |
| `5fca1d6b3a` | Detached package/runtime matrix, reports and offline validation |
| `4b6da5f629` | Native IndexedDB and local service-worker/replication integration |
| `23ada7fdd6` | Sequential storage compatibility and portable scratch tests |
| `8a1bd58a9d` | 0.1.3 manifest, lock and protected staging guards |
| `c279ec1a56` | Read-only CI consuming the same verified tarball |
| `59e7593c88` | Website selector, installation guidance and published status |
| `8891dabc42` | Equivalent Memory workload across runtimes and browser engines |

Review the two larger integration units separately: first their runner/validation boundaries, then the scenarios and evidence. The maintainer selected a feature-branch chain as the future review shape. No pull request, publishing action, or GitHub settings change was requested by this selection.

The independent local verifier checked the staging policy, version/engine/exports invariants, the compatibility workflow's shared artifact contract, and SHA-256/SBOM agreement. It ran no publish, dispatch, OIDC exchange, install or build. Its suggestion to run the compatibility policy in automation was applied in the read-only pack job and validated by the fixture and `actionlint`. Local evidence does not clear the [hosted execution and protected staging gates](./PUBLISHING.md).

The tarball stays outside Git, while its checksum, SBOM and results are tracked. This branch is for local review, not publication. The two inherited Bun suite failures remain recorded in [Core Verification](./TESTS.md); the archive bytes do not show a new core code change.
