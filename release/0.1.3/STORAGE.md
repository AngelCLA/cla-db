# CLA DB 0.1.3 Sequential Storage Lineage

This page records what `scripts/verify-storage-compat.mjs` proves for 0.1.3, which parts are
simulated, and which parts stay unevaluated.

The harness extends the 0.1.2 sequential check instead of replacing it. Published
`@clatech/db@0.1.1`, `@clatech/db@0.1.2` and `rxdb@17.6.0` write a database one version at a time,
then the exact 0.1.3 candidate reopens it. The candidate also reopens its own data, so a self-reopen
result is measured and not inferred.

## Commands

```bash
# Pass/fail lineage using the current built output
node ./scripts/verify-storage-compat.mjs

# Pass/fail lineage using a prebuilt, authenticated candidate
node ./scripts/verify-storage-compat.mjs \
  --artifact ./release/0.1.3/clatech-db-0.1.3.tgz \
  --sha256 <64 character hex digest> \
  --json ./storage-results.json \
  --markdown ./STORAGE-REPORT.md

# Local timing samples with the same lineages and the same artifact
node ./scripts/verify-storage-compat.mjs --benchmark --artifact ./release/0.1.3/clatech-db-0.1.3.tgz --sha256 <digest>
```

| Option | Effect |
| --- | --- |
| none | Packs the current built output with `npm pack` and requires the packed version to equal `package.json`. |
| `--benchmark` | Measures local samples instead of the pass/fail lineage assertions. |
| `--artifact <file.tgz>` | Uses a prebuilt candidate. Requires `--sha256`. |
| `--sha256 <digest>` | Expected SHA-256 of `--artifact`. Requires `--artifact`. The optional `sha256:` prefix is accepted. |
| `--json <file>` | Writes the structured results, including the failure, as JSON. |
| `--markdown <file>` | Writes a readable Markdown report. |
| `--help` | Prints the options and the exact baseline versions. |

Exit code `0` means no step failed. Exit code `1` means a failing step, a rejected artifact or a usage
error. A missing optional baseline is recorded as `SKIP`, keeps the verdict `INCOMPLETE` and is never
counted as passed. The `supported` field is only true when every required step passed.

`--artifact` and `--sha256` must be supplied together. A digest without an artifact, an artifact
without a digest, a modified byte, a tarball that is not `@clatech/db`, and a tarball whose version is
not the `package.json` version are all rejected before any install or pack runs.

## Guards

Every run verifies the exact published versions before it installs them. A missing required version
fails the run. Only a registry `E404` may skip the optional `rxdb@17.6.0` baseline, and a skipped
baseline is never a pass. The printed `dist.integrity` and `dist.shasum` are recorded in the report.

| Baseline | Version | Registry shasum |
| --- | --- | --- |
| `@clatech/db` | `0.1.1` | `4f6152b3456e65e3aa7740ec60cd1f0f8712f70d` |
| `@clatech/db` | `0.1.2` | `a059e3547acd6160dda3baa732b9068304334580` |
| `rxdb` | `17.6.0` | `3e2b149545fc2759998971a774856a535e3dd6f9` |

A published version is never substituted, and a missing version is never replaced by the candidate.

## What one lineage asserts

Each lineage uses one IndexedDB factory, one database name and one writer at a time. The decimal
writers are closed before the candidate opens the database, so two versions never write at once.

1. `seed`: the baseline writes 200 documents with multibyte labels, patches one document, deletes `item-0001` and closes.
2. `integrity`: the candidate reads 199 documents with exact document content, exact primary keys, a revision string, the declared `amount` index in sorted order, and the deleted primary key still absent.
3. `write`: the candidate inserts one document and patches another, and both survive a close and reopen.
4. `migration`: the same database opens with schema version 1 and a migration strategy. Every field is preserved, the deletion still holds, and 200 documents remain.
5. `reopen`: the version 1 documents and the migrated schema survive another close and reopen.
6. `cleanup`: `remove()` leaves no documents, no database, and `indexedDB.databases()` is empty.

The four lineages are `@clatech/db@0.1.1`, `@clatech/db@0.1.2`, `rxdb@17.6.0` and the candidate
self-reopen. Each lineage records 6 steps. A run must report `completed` equal to `expected`, otherwise
the harness fails.

## Evidence: 0.1.3 candidate

The exact candidate `release/0.1.3/clatech-db-0.1.3.tgz` was verified and opened read only.

| Field | Value |
| --- | --- |
| Artifact | `clatech-db-0.1.3.tgz` |
| SHA-256 | `a32518f06bb9c9b5a9df54c14df47eb45381af72aae4a606f8e75d356e689cbc` |
| Compressed bytes | 2236394 |
| Package version | 0.1.3 |
| Storage version | 17.6.0 |
| Command | `node scripts/verify-storage-compat.mjs --artifact .../clatech-db-0.1.3.tgz --sha256 a32518f0... --json ... --markdown ...` |
| Result | exit 0, verdict `PASS`, 30 of 30 steps passed, 4 of 4 lineages completed |
| Commit field | `94383e9432519afb46f0185e35fb48238a7167f2` (base commit, the change was uncommitted at run time) |
| Node.js | v24.22.3 |
| npm | 11.19.1 |
| OS | Linux 7.0.0-43-generic x64 |
| CPU | 11th Gen Intel(R) Core(TM) i7-11800H, 16 logical CPUs, 61.5 GiB RAM |
| IndexedDB | `fake-indexeddb@6.2.8`, simulated |
| Reports | `/var/tmp/cla-db-0.1.3-compat/tmp/storage-lineage/final-results.json` and `FINAL.md` |

A second run without `--artifact` packed the same bytes and reported the same SHA-256, so the pack
step is deterministic for this tree.

## Evidence: local timing samples

`--benchmark` runs each version in a separate process, discards two warm-ups, then measures nine
iterations of 200 documents. Values are milliseconds except `heapMiB`. All three series use the same
storage, so the numbers are comparable to each other and to nothing else.

| Version | init median | write median | read median | reopen median | heap median | init p95 | write p95 | read p95 | reopen p95 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `@clatech/db@0.1.1` | 5.35 | 13.35 | 40.12 | 7.99 | 4.82 | 8.12 | 14.70 | 46.11 | 9.55 |
| `@clatech/db@0.1.2` | 4.99 | 11.66 | 34.96 | 8.09 | 4.79 | 7.56 | 13.42 | 44.34 | 9.78 |
| `@clatech/db@0.1.3` | 4.48 | 10.80 | 38.49 | 8.48 | 4.98 | 7.65 | 15.77 | 47.86 | 10.06 |

Run result: exit 0, verdict `PASS`, 3 series. The report records `gate: none`. These samples are not a
performance ranking, not a promise, and not a CI threshold. They come from one host with background
load, and a real IndexedDB engine in a browser is expected to differ. Two runs of the same artifact
showed this spread: `@clatech/db@0.1.3` read median was 30.76 and later 38.49, and its heap p95 was
5.66 and later 14.90 MiB. The recorded medians and p95 values describe the observed samples. They do
not order the versions.

## Simulated versus native IndexedDB

This page is simulated IndexedDB evidence. `fake-indexeddb` runs the Dexie storage in Node.js and
exercises the real storage code path and the real on-disk document format, but not a browser engine.

Native browser IndexedDB lineage across versions is a separate lane. It stays pending until it is
actually run, and this page makes no claim about it. WebKit evidence would still not certify Safari or
iOS.

## Downgrade

Backward compatibility is `NOT EVALUATED`. Opening 0.1.3 data with 0.1.1, 0.1.2 or RxDB 17.6.0 is a
different question from opening older data with 0.1.3, and no downgrade is assumed. Both reports carry
this as an explicit field. A downgrade check needs its own mapping of every schema and metadata change,
and it must not weaken the forward check.

## Test-first evidence

The deterministic guards live in `scripts/storage-compat-fixtures/verify-storage-compat.test.mjs` and
run offline with `node --test scripts/storage-compat-fixtures/verify-storage-compat.test.mjs`. They
create fake tarballs, so they need no registry, no install and no build.

- RED: against the pre-change runner the same suite reported `tests 7, pass 0, fail 7`. Every
  rejection test failed with `AssertionError: Usage: node scripts/verify-storage-compat.mjs [--benchmark]`,
  because `--help`, `--artifact` and `--sha256` did not exist.
- GREEN: after the change the suite reported `tests 7, pass 7, fail 0`, including digest mismatch,
  wrong package name, version mismatch, missing pair, unknown argument, help output, and report writing
  on a rejected artifact.
- The live lineage RED was observed earlier on the same harness: the public command failed inside
  `consumer.mjs:10` with installed version `0.1.3` against the literal `0.1.2` expected by the fixture.
  The fix passes the asserted packed or artifact version into the fixture instead of a literal, so a
  future version bump cannot leave that pin behind.

## Limitations

- Simulated IndexedDB only. Native browser lineage is pending and separate.
- One writer at a time. Concurrent mixed-version writers are not tested and are not supported by this harness.
- The migration step is a schema version 0 to 1 open performed by the candidate over baseline data. It is not a migration shipped by a published release.
- Index evidence is limited to a single declared `amount` index and its sort order. Compound and unique index parity is not covered.
- `--benchmark` measures a single host and is not a controlled environment, so no ranking is published.
- The harness installs from `https://registry.npmjs.org` and therefore needs registry access for the published baselines.
