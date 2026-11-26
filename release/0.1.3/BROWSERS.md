# Native Browser Verification

The isolated Vite 8.4.0 integration app installed the exact [0.1.3 tarball](./PACKAGE.md) and ran with Playwright 1.65.1 on Linux x86-64. It exercised real IndexedDB through Dexie without `fake-indexeddb`.

| Playwright engine | Binary revision | Native IndexedDB | Offline and replication | Total |
| --- | ---: | ---: | ---: | ---: |
| Chromium 159.0.8154.6 | 1255 | 10/10 | 5/5 | PASS 15/15 |
| Firefox 159.0 | 1572 | 10/10 | 5/5 | PASS 15/15 |
| WebKit 27.2 | 2388 | 10/10 | 5/5 | PASS 15/15 |

Each lane passed CRUD and reactive updates, 14/20/50/100 simultaneous collections, page reload, orderly browser close and reopen with the same profile and origin, v0 to v1 migration, and database removal with subscription and open-collection checks. The browser-restart result is separate from the page-reload result. It is not abrupt-process recovery or quota exhaustion evidence.

The local WebKit run used isolated distro libraries without changing the browser executable or installing system packages. Hosted Linux CI provisions Playwright prerequisites separately. Playwright WebKit is not Safari, iOS, or an operating system certification. Cross-version browser reopening remains separate from the [simulated IndexedDB lineage](./STORAGE.md).

```sh
node scripts/browser-integration/run.mjs \
  --artifact "$PWD/release/0.1.3/clatech-db-0.1.3.tgz" \
  --sha256 "$(awk 'NR == 1 {print $1}' release/0.1.3/SHA256SUMS)" \
  --browser chromium --out ./coverage/cla-chromium
```

See the [browser runner](../../scripts/browser-integration/README.md) for pins, scenario controls, scratch locations and trace paths, and [Offline-First Evidence](./OFFLINE_FIRST.md) for the PWA scenarios.
