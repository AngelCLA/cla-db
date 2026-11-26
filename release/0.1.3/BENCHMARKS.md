# Compatibility Benchmarks

The storage lineage harness records warm-ups and per-series median and p95 for initialization, writes, indexed reads, reopen, and heap delta. It ran with two warm-up iterations and nine measured iterations per release under the same Linux x86-64, Node 24.22.3 and simulated Dexie workload. See [Storage Compatibility](./STORAGE.md) for timings and the exact checked tarball. Repeated samples shifted enough to preclude a ranking.

```sh
node scripts/verify-storage-compat.mjs --benchmark \
  --artifact release/0.1.3/clatech-db-0.1.3.tgz \
  --sha256 "$(awk 'NR == 1 {print $1}' release/0.1.3/SHA256SUMS)"
```

## Portable Memory Workload

The [isolated Memory fixture](../../scripts/compatibility-benchmarks/memory.mjs) also completed on Node 24.22.3, Bun 1.3.14, Deno 2.8.3, and pinned Playwright Chromium, Firefox and WebKit. Each target ran the same package bytes, 100-document batch, 20 extra collections, and two warm-ups plus nine measured iterations. It records database initialization, writes, reads, reactive update delivery, collection creation and push to an in-memory custom handler. The [JSON evidence](./compatibility-results.json) contains each series and its median and p95 in milliseconds.

Browser series use Vite 8.4.0 and headless Playwright 1.65.1. The server runtimes load the detached package directly. The workload is equivalent, but engine, bundling and timer behavior differ. These are one-host observations, not a controlled engine ranking or CI gate. Native IndexedDB timings across browsers and portable memory measurements remain pending. Reopen is measured only in the simulated Dexie series, not Memory. Do not compare those adapters as if they measured the same workload.
