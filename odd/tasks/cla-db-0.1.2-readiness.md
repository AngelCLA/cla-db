# CLA DB 0.1.2 readiness
Repository: `AngelCLA/cla-db` | branch: `chore/release-0.1.2` | base: `34196d9ab5`.
Only the review branch may be pushed. The reviewed local candidate and its backup remain available until an updated candidate is verified.

## Specs

- S1: “Corregir y validar (recomendado)”: “Buscar una corrección compatible con Firestore y validar tipos y emulador. Sin actualizaciones masivas ni cambios de producción no justificados.”
- S2: “Sí, push solo a la rama de revisión”: “Solo a AngelCLA/cla-db:chore/release-0.1.2, después de verificar los cambios. Sin force push, PR, merge, tag ni publicación.”
- S3: “pero ya quiero que este listo”
- S4: “Es que soy el unico dev” → “Modo mantenedor único (recomendado)” → “muy bien, hazlo”
- S5: “adapta el yml. adapta el workflow” → “si ya esta listo hazlo” → “Confirmo la revisión y autorizo el PR” → “Crear un issue de seguimiento (recomendado)”

## Tasks

- T1 | S1 | parent scratch prototype, read-only emulator explorer | done, no commit. Jobs 28–33: patched supplier only, clean npm ci, build/types, both SDK Firestore round trips and all 11 existing Firestore tests. Old SDK and current SDK both use gRPC 1.13.6. Job 32 hit socket path limit; using a shorter scratch path fixed it without test changes. Audit exit 1, 26 moderate, zero high/critical; the old RxDB row is now moderate via AJV, not a new advisory.
- T2 | S1, S3 | parent; maintainer review after verifier ENOSPC | done | `8c163dc652af7285b58051ee2afac9b0680641a2`. Technical checks and maintainer review passed, with the pre-commit hook active. Candidate SHA-256 `0b96c99375184786dae397b38dbbf7571bd38612a98ad4da20e9ad53e681fa56`.
- T3 | S2 | parent | done | normal review-branch push of `57301dd0360c2f56e4dba4c9f4fe5bd976c1ca83`, verified by push run `45764541063`: `verify (22)`, `verify (24)` and `site` passed. The first run `45762679615` had failed only Node 22 install; captured and corrected, not rerun.
- T4 | S2–S4 | parent | done | job 50 applied and verified both authorized remote controls. `master` requires a PR plus exact Actions checks (`15368`), no second reviewer, no administrator bypass, no force push/deletion. `npm-release` allows only branch `master`, no additional approver. Both SHAs unchanged. No PR, merge, npm settings, dispatch, tag, or publication.

- T5 | S5 | parent; maintainer diff review | done | `174a3c7032ee78df61348b64ac94e2fd4d9a478d`. Staging-only workflow, approved issue #9, PR #10 with `Refs #9`; required CI passed. No merge or dispatch.

## Log

### L1

pero ya quiero que este listo

Corregir y validar (recomendado)

Sí, push solo a la rama de revisión

Baseline: `34196d9ab5`; only root hoisted `@grpc/grpc-js@1.9.16` is subject to the high advisory, shared by both Firestore releases. The separate cloud-tool nodes use `1.14.7`. No Java executable on PATH; use isolated validation rather than changing system packages. CI supports pushes on the selected branch. No npm publication or default-branch action is authorized.

### L2

Explorer unavailable (`ENOSPC`), not retried. Job 28 proved both Firestore paths resolve `@grpc/grpc-js@1.13.6`; its broad lock reconciliation also removed eight unrelated nodes, which are excluded from the minimal prototype. Job 29 prepared checksum-verified Java 21 in ignored scratch. Job 30 installed the minimal pair but `build:types` failed with TS2883 because the copy lived inside `node_modules`. Job 32 validates in a new ignored directory outside that tree. Job 31 read official GitHub metadata: push permission is available, `master` reports `protected: false`, and the `npm-release` environment and review-branch endpoints returned 404. Do not modify those settings under S2.

### L3

Sí, usar ese directorio descartable

Scope: `/var/tmp/cla-db-grpc-release-0.1.2` only for the disposable checkout, locked install, and tests. Jobs 34–35 ran inside the outer Git working tree and ESLint failed before starting the release checks. No lint/test configuration was changed. Job 36 continues from the exact authorized external path.

### L4

Hay que hacer todo lo que falta para que quede

Read-only GitHub preflight (job 37): public repository; authenticated account has admin and push; Actions enabled; ruleset list empty; environment list has no `npm-release`. The earlier exact master read reported `protected: false`. Configuration, PR/merge, npm settings, and publication were not authorized by the explicit review-branch push choice.

### L5

mi mismo usuario AngelCLA

Owner nominated `AngelCLA` as environment reviewer. With self-review prevented, the workflow must be initiated by another authorized person. No second actor was identified and no remote settings were changed. This does not delay the already authorized review-branch push once the candidate passes verification.

### L6

Es que soy el unico dev

Modo mantenedor único (recomendado)

Selected policy: protect `master` with mandatory CI; restrict `npm-release` to `master` without a required reviewer; keep manual dispatch, explicit confirmation, and the expected SHA-256. Policy selection is not permission to change remote settings or publish. Exact required check names still need evidence from the authorized review-branch CI run.

### L7

muy bien, hazlo

Updated `release/0.1.2/PUBLISHING.md` for the selected policy. No workflow edits or remote mutations. `git diff --check` and the workflow policy probes passed. Any live rules must use the effective check names verified on the review branch; do not infer authorization to merge, dispatch or publish.

### L8

haz lo necesario ya, no des muchas vueltas

Job 36 passed locked install, lint, build, type checks, typings, circular checks, and both resolution fixtures. Memory got a GraphQL `Upgrade Required` response where it expected JSON, and its runner remained stuck for over six hours. Stopped job 36 without treating it as a pass. Job 38 verifies the exact new tarball, detached audit/SBOM and storage/consumer checks, then rechecks the failing case and runs both suites with a deadline and reduced concurrency. Scoped independent verification started as `mwx42wgy-k-2pvz`. No push, settings change, or publication.

Independent verifier `mwx42wgy-k-2pvz` did not start: ENOSPC while loading the toolchain under `/tmp`. Do not retry or claim independent approval. Native assessment could not enumerate the diff due to existing untracked paths; explicit item 5 escalation still required independent verification.

Job 38 passed artifact identity, production audit, detached consumer and both 199-document simulated IndexedDB reopens, then the filtered GraphQL test failed due to missing initialization. Job 39 ran full Memory/Dexie with two workers and passed the GraphQL case, with 1833/1837 passes respectively. The exact new tarball is `release/0.1.2/clatech-db-0.1.2.grpc-0b96c9937518.tgz`, with the new 75-component SBOM. Earlier tarballs were left byte-identical. The detached root audit exited 0; development audit exited 1 with 26 moderates. The only other identity drift across detached SBOMs was `@types/node` 26.6.10 to 26.6.11. No commit, push, dispatch, or publication at that point.

### L9

confirmo

The maintainer confirmed the scoped diff and tarball/SBOM hash review. Job 40 failed in the active pre-commit lint hook: all 754 errors were from the task-created prior scratch checkout in `coverage/.grpc-release-check.EUWq8N`. Job 41 preserves precisely that folder in the ignored task cache, then re-runs the commit with the hook active. No files were deleted and no hook was disabled.

### L10

Jobs 42–44: normal push of `8c163dc652` succeeded. Push run `45762679615` passed `site` and `verify (24)`; `verify (22)` hit `EUSAGE`, `Missing: typescript@5.9.3 from lock file`. Job 45 reproduced on the official, checksum-verified Node `22.23.5` with bundled npm `10.9.9`, then npm `11.19.1` passed `npm ci`, build, typecheck, both dependency probes, Memory and Dexie without changing package declarations or locks. The CI correction pins npm only in the verify matrix, in `RUNNER_TEMP`, with scripts disabled; static probe RED and GREEN observed. Job 46 executed the exact new step on Node `22.23.5` and `24.22.3`, confirmed `npm ci` in Node 22, and checked the fixture. No publication workflow, site job, package bytes, or dependencies changed. Assessment requires independent item 5 review; the configured verifier is unavailable (prior ENOSPC and `/tmp` at 100% inodes), not retried. Awaited maintainer review of the CI-only diff, not another authorization for the already agreed branch push.

### L11

si, confirmo

Maintainer confirmed review of the scoped CI fix. Job 47 committed `57301dd0360c2f56e4dba4c9f4fe5bd976c1ca83` with the hook enabled, pushed it only to the approved review branch, and observed a successful GitHub Actions push run `45764541063` on the exact commit. Hosted annotation: checkout/setup-node v4 actions target Node 20 but ran on Node 24; this did not fail a job. It does not change the independently selected Node 22/24 application matrix. Job 48 confirmed the exact Actions check contexts and the still-unprotected default branch, and rechecked the archived local tarball hash. The queried CI log did not expose a tarball digest, so passing CI does not prove the hosted build produced byte-identical output.

### L12

Aplicar solo esas dos protecciones

Authorized only on `AngelCLA/cla-db`: 1) require a PR and `verify (22)`, `verify (24)`, `site` from GitHub Actions on `master`, without a second reviewer, force pushes, or deletion; 2) create `npm-release` restricted to branch `master`, without a second approver. Verify both by API readback. No opening or merging a PR, no workflow dispatch, no npm settings, and no publication.

### L13

Job 49 received HTTP 422 because `contexts` and `checks` were both present in the same status check payload. No partial writes; job 50 proved that by preflight, supplied only application-bound `checks`, and verified both protections by readback. GitHub Actions app `15368` supplies `verify (22)`, `verify (24)`, and `site`. The `npm-release` deployment policy has sole rule ID `68317861` (`master`, branch). The `master` SHA is still `e41bc43cfb502c7208e3e6f21ada967f4fc292e0`. The approved review SHA remains `57301dd0360c2f56e4dba4c9f4fe5bd976c1ca83`. This completes the authorized review and GitHub settings scope. Publication remains outside scope: an authorized PR/merge, CI on exact protected master, npm Trusted Publisher, final artifact hash and residual audit/redistribution disposition are still required.

### L20 (staging dispatch diagnosis)

The maintainer authorized the staged release and the GitHub release in one step. Job 78 dispatched `publish.yml` on protected master `94383e9432519afb46f0185e35fb48238a7167f2` with `STAGE @clatech/db@0.1.2` and the vetted SHA-256. Build passed fully; the stage job failed in 7s with `npm error code ENEEDAUTH` after the pack notice. Job 79 extracted the log. Job 81 re-read the run (single failed run 45837219576) and the annotations. Job 83 re-downloaded the same artifact from the failed run and verified its SHA-256 locally, no network staging. Job 84 confirmed the workflow file on the run head has `environment: npm-release` and `id-token: write`, and environment deployment APIs 404 (no visible deployment record). Job 85 exercised the same stage command locally with npm 11.19.1, dry-run, no registry writes. Source checks surfaced npm/cli issues 9088 (misleading 404/ENEEDAUTH diagnostics) and 9969: repositories created after GitHub's 2026-07-15 cutoff always use immutable OIDC subject claims (`repo:<owner>@<id>/<repo>@<id>`), the token exchange answers 404 `package not found` even with a perfectly matching trusted publisher entry, npm then silently falls back to no auth and reports ENEEDAUTH, and the immutable claim cannot be switched off from the repository side (reported 422/201-no-effect). Job 86 read this repository's setting: created 2026-11-25, `use_immutable_subject: true`. The vetted tarball, workflow binding and environment all match; the failure matches the open upstream registry defect, not a local misconfiguration. No package was staged; npm never accepted the staging. Workarounds outside the staged OIDC path (automation token stage, direct hand publish) remain maintainer-only decisions.

### L21 (GitHub release)

The maintainer then said “haz el release entonces”. Updated `RELEASE_NOTES.md`: removed the draft marker, corrected the development findings to 26 with the recorded disposition, and added the pinned SHA-256 and protected-master CI evidence. Job 87 preflighted no existing tag/release, verified protected master still `94383e9432519afb46f0185e35fb48238a7167f2`, created annotated tags `v0.1.2` (`9eaf21f792536f94281a4947700d728c99f80b73`) and `npm-0.1.2` (`5cdb380d7a50f5399b53ea25dccebefed150f49f`) at that commit, pushed both, and created release [CLA DB Foundation v0.1.2](https://github.com/AngelCLA/cla-db/releases/tag/v0.1.2) with the exact updated notes, non-draft, non-prerelease, targetCommitish master. npm publication remains the maintainer's 2FA step; no npm settings changed.

### L15

sigamos con el siguiente paso

El mantenedor autorizó documentar la disposición de los 26 avisos moderados y dejar marcada la verificación del Trusted Publisher como acción propia de npm. Job 69 re-auditó el lockfile revisado y confirmó 26 moderados, 6 avisos fuente, todas las sugerencias semver-major. `npm trust list` devolvió E401 sin sesión npm; no es un defecto del paquete. Se actualizaron DEPENDENCIES.md (tabla de disposición), REVIEW.md (items 1 y 2 cerrados) y PUBLISHING.md (nota sobre expiración del Trusted Publisher y session-required CLI).

### L14

The maintainer later authorized opening one PR from `chore/release-0.1.2` to `master`, without merge or publication, then explicitly authorized creating and labeling the corresponding issue and using the exact temporary submission directory. Jobs 51–54 found no duplicate or approved issue, confirmed ADMIN and both existing labels, created and read back issue #7 (`status:approved`), and opened and read back PR #8 (`type:chore`, nonclosing `Refs #7`) with head `57301dd0360c2f56e4dba4c9f4fe5bd976c1ca83` and base `master`. The private submission files were removed by the jobs. Job 55 verifies required PR checks without editing or merging the PR.

### L15

Job 55 verified the pull-request run `45766621697` at exact reviewed head `57301dd0360c2f56e4dba4c9f4fe5bd976c1ca83`. All three required checks passed independently of the earlier push run. GitHub reports PR #8 `OPEN` and `CLEAN`; `master` remains protected and at `e41bc43cfb502c7208e3e6f21ada967f4fc292e0`. The Actions runtime deprecation annotation and nonblocking advisory-audit exit did not fail required checks. The authorized issue/PR scope is complete. No merge or publication was authorized or executed.

### L16

adapta el yml. adapta el workflow

si ya esta listo hazlo

Confirmo la revisión y autorizo el PR

Crear un issue de seguimiento (recomendado)

PR #8 was merged by the maintainer; job 57 rebuilt its protected-master revision `a528df99d818b468b04fa3f2a732a6ebe331948b` and verified the reviewed tarball and SBOM. Adapted `publish.yml` to stage only. Jobs 58–59 verified the exact step with mocked npm, lint, types after plugin shim generation, build, 1,833 Memory tests, and byte-identical repack. Independent verifier unavailable; maintainer confirmed the diff. Issue #7 was closed as completed, so the maintainer approved a new follow-up. Background job 62 lacked `PI_MODEL` and exited before any write; job 63 verified no duplicate or remote branch, and job 64 used the validated foreground model identifier for the template, created approved issue #9, committed the five verified files, pushed the stage branch only, and opened PR #10 to `master` (`Refs #9`, `type:chore`). Job 65 verified `verify (22)`, `verify (24)`, and `site` in run `45775202735` for exact PR head `174a3c7032ee78df61348b64ac94e2fd4d9a478d`. PR was `OPEN` and `CLEAN`. No merge, dispatch, npm staging, settings mutation, or public release by the agent.

### L17

ya merge y todo bien

Job 66 confirmed the maintainer merged PR #10. Protected `master` is at `77a47c4c754f5aa670aec12bb96f21ad61ab060f` with the same tree as the reviewed PR head (`6f41380627c6a4a7b75ce9705e2cc8c6f4ec8709`). Push CI `45775795968` passed all three required Actions checks. This was a read-only check. Live npm Trusted Publishing remains unverified; no dispatch or staging was authorized.

### L18

sigamos con el siguiente paso

si

Job 69 re-audited the reviewed lock: 26 moderate, 6 source advisories (Babel runtime, OTel core, AJV, glob, minimatch, uuid), all fixes semver-major tooling upgrades. `npm trust list @clatech/db` returned E401 without an npm session; not a package defect. DEPENDENCIES.md gained an Advisory Disposition table, REVIEW.md closed publication-gate items 1 and 2, and PUBLISHING.md noted the Trusted Publisher two-day expiry and maintainer-only CLI verification. The maintainer then confirmed the Trusted Publisher on the npm site and authorized a documentation PR. Job 73 stopped before any write because `/tmp` had no space; job 74 replaced the temp check with an in-memory check, created approved issue #11, branch `docs/advisory-disposition`, commit `1918b5a8767e0263508bf3fefd204e4a02470182` (exactly the three docs files), and PR #12 (`Refs #11`, `type:docs`). Its PR-body readback failed on a missing `EXPECTED_TITLE` env var after the PR already existed; job 75 verified issue #11 OPEN/approved and PR #12 OPEN/docs from the branch, and job 76 completed the readback, confirmed the commit file list and whitespace, and watched [run 45778978200](https://github.com/AngelCLA/cla-db/actions/runs/45778978200) pass all three required checks. REVIEW.md now records the maintainer-confirmed Trusted Publisher. No merge, dispatch, staging, npm settings change, or publication by the agent.
