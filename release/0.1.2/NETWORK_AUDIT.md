# CLA DB 0.1.2 Network Audit

CLA DB dev-mode registration no longer initiates the inherited marketing iframe connection. An isolated memory-storage probe performs local CRUD with selected network entry points blocked. This is evidence for that path, **not a zero-telemetry claim** for all plugins, dependencies, websites, or deployed assets.

## Scope and Decision

The original T2 privacy unit covers S2 and S7, supplies focused S12 verification, and supplies the privacy changelog entry for S15. T4 adds the website findings and resolution below and updates the root `CLA_CHANGELOG.md`. Package distribution and the full release suite remain separate units. T2 observations are retained as historical evidence and are explicitly superseded where T4 verified more.

Source inspection covered endpoint literals and network call sites in `src/`, with targeted checks of dev-mode, viewer, WebRTC/Nostr, Google Drive, OneDrive, Premium detection, and WebMCP. Website and build-script spot checks are distinguished below. Search results containing documentation links were not treated as evidence of a request. This is a family-level inventory, not an exhaustive dependency or deployed-site traffic audit.

The production change removes only the import and automatic call to `addDevModeTrackingIframe` from `src/plugins/dev-mode/index.ts`. It preserves warning text and attribution, validation hooks, plugin identity, storage compatibility, Premium code, and explicit integrations. The inherited `dev-mode-tracking.ts` implementation remains in place. Directly invoking that helper can still inject the iframe. No file or public export was deleted.

## Classification

Categories use the requested five-way distinction. A family can have different classifications at different call sites.

| ID | Category | Meaning |
| --- | --- | --- |
| 1 | Documentary reference | A link, schema identifier, example, or error hint without an automatic request at that location. |
| 2 | Original-project attribution | Upstream authorship, source, license, or support reference preserved for compatibility and attribution. |
| 3 | Consumer-requested connection | The application explicitly invokes an integration and supplies its target or client. |
| 4 | Plugin-specific external dependency | An opt-in plugin or tool needs a service, possibly using a built-in default. This is not a core requirement. |
| 5 | Automatic communication not required by the consumer | Marketing or other unsolicited communication outside the requested database operation. |

### Production Library Endpoint Families

Paths in this table are relative to the repository root. “Source” means inspected implementation, not a live service test.

| Family and source | Category | Trigger, defaults, and verified facts |
| --- | --- | --- |
| `rxdb.info/html/dev-mode-iframe.html?version=...`, `src/plugins/dev-mode/dev-mode-tracking.ts` | 5 | Before this fix, public dev-mode registration launched a hidden iframe on an ordinary browser origin. The actual guard checks globals and the Premium flag, not localhost. RED observed the exact URL with `version=17.6.0`. The automatic call is now absent. The retained helper also adds a marketing link selected using a hash of `location.host`. |
| `rxdb.info` error, chat, dev-mode, SQLite, Dexie, and Premium links, `src/rx-error.ts`, `src/plugins/dev-mode/index.ts`, storage warning code | 1, 2 | Error strings and console warnings provide links. Printing these strings is not a network call. They remain unchanged, including upstream attribution. |
| GitHub, MDN, Stack Overflow, schema.org, json-schema.org, and other specification URLs in comments/types/schema identifiers | 1, 2 | Documentation and attribution at the inspected locations. A URL literal alone does not establish network access. No broad URL removal was performed. |
| Hosted viewer `https://rxdb.info/db-viewer/index.html`, `src/plugins/dbviewer/dbviewer.ts` | 4 | `mountRxDBViewer()` explicitly mounts an iframe. `viewerUrl` overrides the hosted default. The postMessage bridge provides database metadata, queries, and live data access, not merely a static logo. Hosting a viewer is a trust decision. It is not started by core CRUD or this fix. |
| Viewer WebRTC bridge, `src/plugins/dbviewer/dbviewer-webrtc.ts` | 3, 4 | Explicit `connectRxDBViewer()` exposes a live database and returns a pairing URL. Room knowledge grants read/write access as documented in the source. Viewer and signaling URLs are configurable. The default viewer and signaling infrastructure remain upstream-hosted. |
| `wss://signaling.rxdb.info/`, `src/plugins/replication-webrtc/connection-handler-simple-peer.ts` | 4 | Default for the explicitly selected simple-peer handler. Its creator opens a WebSocket when invoked. Override `signalingServerUrl` for self-hosted signaling. The source warns that the demonstration server is unreliable. ICE/STUN/TURN behavior from simple-peer/browser defaults was not independently audited. |
| Nostr relay WebSockets, `src/plugins/replication-webrtc/connection-handler-nostr.ts` | 3 | Requires a nonempty caller-supplied `relays` list. No hardcoded operational relay list exists in this implementation. The example `wss://relay.example.com` is documentary. Signaling messages use the specified relays; peers use WebRTC for replicated data. |
| WebTorrent trackers and p2pcf references, `src/plugins/replication-webrtc/connection-handler-webtorrent.ts`, `connection-handler-p2pcf.ts` | 1 | Inspected tracker URLs are in commented-out implementation, not active default connections. This does not establish the behavior of external WebRTC dependencies. |
| `https://www.googleapis.com`, `src/plugins/replication-google-drive/index.ts` and helper/signaling/transaction modules | 4 | Default API endpoint for explicitly configured Google Drive replication. Options override the endpoint. Authenticated requests cover files, WAL, transactions, polling/signaling, and attachment content. These are integration operations, not dev-mode telemetry. The OAuth scope URL is a scope identifier. |
| `https://graph.microsoft.com/v1.0`, `src/plugins/replication-microsoft-onedrive/index.ts` and helper/signaling/transaction modules | 4 | Default API endpoint for explicitly configured OneDrive replication. Helpers also use this fallback. Caller configuration controls the client state; content downloads can follow service-provided download URLs. No credentialed service test was run. |
| Google Drive and OneDrive attachment serialization and upstream cleanup | 3, 4 | Both plugins re-export and use shared `serializeDocAttachments`/`deserializeDocAttachments` helpers. `src/replication-protocol/helper.ts` clears `_attachments` when data serialization is disabled and removes `_attachments_data` after deserialization. Both upstream modules compare stripped attachment data and empty processed WAL content through `writeToWal`. These data-shaping/cleanup paths were inspected and left untouched, not reimplemented as privacy filtering. |
| CouchDB HTTP, GraphQL HTTP/WebSocket, replication WebSocket, NATS, Firestore, Supabase, Appwrite, MongoDB, remote storage, and Deno KV | 3, 4 | Optional transport/storage families use application URLs, clients, connection handlers, or runtime configuration. These integrations are outside the blocked-memory scenario. SDK discovery, redirects, credentials, and indirect service requests were not dynamically traced. No claim is made that selecting one of these plugins is offline. |
| Premium flag, `src/plugins/utils/utils-premium.ts` and `utils-hash.ts` | No remote endpoint in this path | `hasPremiumFlag()` compares a local flag's SHA-256 digest to `PREMIUM_FLAG_HASH`, with a cached result. `defaultHashSha256` uses `crypto.subtle.digest`. The inspected code does not contact a license server. No Premium validation or export paths were changed, bypassed, or replaced. This is not an audit of proprietary Premium packages. |
| WebMCP, `src/plugins/webmcp/webmcp.ts`, `webmcp-tools.ts` | 1, 3 | Explicit registration uses a caller-supplied `modelContext` or the document/navigator registry. The RxDB error URL is a string hint. Local targets operate through collections; a supplied target or external registry may have its own transport. No global no-network claim is made for agents or remote targets. |

### Website Runtime Is Separate

| Family and source | Category | Verified fact and gap |
| --- | --- | --- |
| GitHub, npm, and upstream API documentation links in `web/src/content.ts` | 1, 2 | Source spot check found ordinary outbound links. `web/src/App.tsx` composes local components. No analytics endpoint appeared in the scoped `web/src` URL/network search. No deployed-browser trace was run. |
| `docs-src/src/theme/Root.tsx`, `docs-src/docusaurus.config.ts` | 1, 2 for retained references | Root renders children only and does not load the inherited analytics stack. Config has an empty active `scripts` list and no active gtag preset in the inspected section. Historical comments still describe removed consent/gtag behavior, so comments are not proof of runtime tracking. |
| Conversion worker `/api/glytics` and `/api/gads`, `docs-src/src/components/trigger-event.tsx` | 5 before fix; inert after | T4 reproduced automatic callbacks used by legacy pages despite Root removal. Non-EU browser conditions and a stored ad click caused intercepted beacons/fetch plus identifiers/counters to change. An unconditional CLA-site gate now returns before counters or outgoing marketing callbacks, even after consent is enabled. Implementation remains inert for merge compatibility. |
| Same worker, `docs-src/dbviewer/tracking.ts` | 4, with 5 when upstream hostname guard permits | T4 found the actual caller: `docs-src/dbviewer/main.tsx` calls `trackFirstViewerOpen()` in `boot()`. Built standalone viewer HTML retains the worker URL. This explicit viewer tool is unchanged. Its helper permits only `rxdb.info` / `www.rxdb.info`, with timezone/consent and once-per-visitor guards. An intercepted preservation probe observed zero beacons on CLA/localhost and one, capped across two calls, on rxdb.info under non-EU conditions. This corrects T2's incomplete caller search; remote forwarding was not verified. |
| Pipedrive forms/scheduler/documents, Stripe, Google Forms, eepurl, Discord, GitHub redirects, upstream images | 3 for selected navigation, 5 for automatic embeds/assets | Legacy commercial/integration material remains inherited, not a CLA offering. Complete deployed-page and external-asset traffic coverage remains unverified. This is site activity, not library core calls. |
| `http://0.0.0.0:4200/` smartphone iframe and LinkedIn embed | 5 when their pages load | T4 verified real built HTML: `docs-src/build/files/smartphone/index.html` embeds the local demo address; `docs-src/build/releases/17.0.0.html` embeds `https://www.linkedin.com/embed/feed/update/urn:li:share:7434623645857046528?collapsed=1`. These residual inherited assets are not silently removed. No deployed traffic was traced and LinkedIn tracking cannot be excluded. Source pages/static assets are outside the allowed edit surface. Deployment suitability needs a separate decision. |

A consumer opting into the hosted upstream viewer can encounter behavior controlled by that remote page, including tracking independent of the library. The library-side iframe regression does not validate or sanitize that page. Use a reviewed, self-hosted viewer and signaling service when this trust boundary matters.

### Build-Time and Maintenance Activity

| Family and source | Category | Trigger and boundary |
| --- | --- | --- |
| YouTube image CDN `i3.ytimg.com`, `scripts/docs-download-video-thumbnails.mjs` | 4 for docs tooling | `docs-src/package.json` runs it in `prestart` and `prebuild`. T4's actual docs build found 15 thumbnails already cached, downloaded 0. Future builds with missing files may download them. This is build-time traffic, not database CRUD. |
| Repository Git remote, `scripts/docs-fetch-git-history.mjs` | 3, 4 for tooling | Can run `git fetch --unshallow` for shallow checkouts. T4's docs build reported full history already available, so it fetched nothing. This is not a database runtime request. |
| `api.indexnow.org`, `scripts/notify-indexnow.mjs` | 3, 4 for deployment tooling | Explicit indexing script posts deployment URLs. Not executed in this unit. |
| Google discovery/OpenAPI sources and raw GitHub, `src/plugins/replication-google-drive/download-specs.sh` | 3, 4 for maintenance | Script downloads API specification files when run. Distinct from the plugin's authenticated runtime requests. Not executed here. |
| npm registry and package dependency hosts | 4 for installation/build tooling | Package managers may contact registries during install or tool resolution. `npx --no-install` was used for the focused runner. Install and publication operations were not run in this privacy unit. Dependency-wide network behavior remains outside this evidence. |

## Reproduction and Verification

Run the Node-only regression independently, without the suite's global dev-mode registration:

```sh
npm run transpile && NODE_ENV=fast DEFAULT_STORAGE=memory npx --no-install mocha --config ./config/.mocharc.cjs ./test_tmp/unit/dev-mode-network.test.js
```

`test/unit/dev-mode-network.test.ts` uses fresh Node processes and public plugin entry points. It is discovered by the fast suite's `*.test.js` glob, but deliberately not imported by the browser-shared aggregate because it uses Node subprocess APIs.

- **RED, exit 1:** `Unsolicited browser navigation`, actual `[{ tag: 'iframe', url: 'https://rxdb.info/html/dev-mode-iframe.html?version=17.6.0' }]`, expected `[]`. This reproduces the load request observable without actually sending it.
- **GREEN, exit 0:** `2 passing`. Registration and repeated public `init()` cause no iframe URL assignment or appended node. Existing warning behavior is preserved.
- **Preservation, same passing run:** local create/read/update/delete, DVM1 for unvalidated storage, VD2 for invalid data with no document inserted, `hasPremiumFlag() === false`, and `OPEN_COLLECTIONS` membership/cleanup all pass.
- **Offline probe:** blocks fetch, WebSocket, XMLHttpRequest, Node TCP/TLS, HTTP(S), UDP socket creation, and DNS lookup before importing library entry points. The CRUD probe asserts `networkAttempts` is empty. It uses `multiInstance: false` and memory storage, with no files or scratch directories created. This is JavaScript interception, not an OS network namespace. Other DNS APIs, native addons, child processes, browser workers, and all dependency-specific transports are not exhaustively blocked. Real browser network traffic and persistent storage were not tested by this probe.
- **Fixture corrections:** the first preservation run exposed synchronous DVM1 throwing, then the next exposed removal through a stale document revision. The test now uses `assert.throws` and the document returned by `incrementalPatch`. Production required only the tracking-call removal.
- **Transpile caveat:** the first exact runner invocation detected 60 changed artifacts and internally invoked its CJS/ESM/test full-build fallback. Subsequent invocations were incremental. No separate build was launched. Distribution work must use artifacts that include this fix and avoid overlap with transpilation.
- **`npm run check-types`, exit 0:** passed.
- **`npm run lint`, exit 1:** four errors in concurrent distribution work at `scripts/pack-consumer-fixtures/verify-integrations.mjs`: `require-await` at 47:17 and 54:17, and `brace-style` at 60:58 and 60:73. Those files were outside this unit's edit surface and were not changed here.

No differential probe was required: the only production change is the dev-mode init call removal, not a shared parser, helper, or command path. The full S12 build, typings, circular checks, memory/Dexie suites, and packed consumer verification were not independently run here because the delegated contract assigns this unit only the focused test, lint, and type checks. Credentialed service tests, deployment, publishing, and generated website builds were not run. Release-wide verification remains with the parent.

## T4 Website Reproduction And Verification

`npm --prefix web run check` now exercises the public `triggerTrackingEvent()` and `onCopy()` exports under intercepted browser APIs, with consent explicitly enabled, both sendBeacon and fetch fallback, and SSR. No actual conversion requests are sent.

- **RED, exit 1:** four failures: DOM/beacon and DOM/fetch cases each observed eight outgoing callback calls (worker plus mocked gtag/Reddit), and each mutated storage. The worker path had no hostname guard. These are intercepted call counts, not eight measured HTTP packets.
- **GREEN, exit 0:** no conversion/analytics calls and no changes to identifiers or event counters across all four cases. Existing CTA links, navigation anchors, Spanish copy, and design tokens remain checked. Explicit viewer tooling is untouched and its hostname behavior was separately probed as described above.
- **Built-output evidence:** the passing `npm run docs:build` generated 603 HTML/JS files. Scanning emitted HTML/JS (excluding source maps) found the conversion-worker URL only in `db-viewer/index.html`; no such literal or external script/iframe source appeared in `web/dist`. Built docs metadata, install command, candidate distinction, and existing SVG favicon were asserted.
- **Residual integrations:** the emitted iframe sources above remain. Ordinary outbound links are not automatic requests, but embedded third-party pages/assets can make requests. This was structural output inspection, not a live browser/deployed-site network capture. Other dynamically constructed destinations or third-party behavior are not exhaustively ruled out.
- **Build outcome:** `npm --prefix web run build` and `npm run docs:build` exited 0. Docusaurus reported inherited broken anchors, an SWC/Babel warning, and an overlong inherited description. No unrelated configuration was changed to suppress them. See [SITES.md](./SITES.md) for the warnings and reproducible consumer checks.

## Remaining Gaps and Release Handoff

- **Historical lint advisory resolved:** the T2 distribution-file lint errors above were resolved by the parent's joint job-3. T3 also records passing lint. T4's initial probe introduced six brace-style errors in `web/scripts/check-render.tsx`; one correction fixed them and the rerun exited 0. The resumed snippet work separately exposed eight single-quote style errors, corrected once by escaping embedded quotes; final resumption lint is recorded in the handoff. The original T2 advisory is not an outstanding blocker; final release-wide reruns remain T6-owned.
- **Non-blocking for the local memory claim:** no real-browser packet trace, OS-level deny-network run, persistent-storage offline test, or exhaustive dependency audit was performed. These limit the claim to the tested path.
- **Separate deployment disposition required:** T4 disables inherited documentation conversions and verifies local production outputs, but residual iframes, images, links, and hosted-viewer behavior are not a zero-telemetry deployment certification. The local smartphone iframe and LinkedIn embed remain outside edit authority. See [SITES.md](./SITES.md) for exact checks and limits.
- **Compatibility boundary:** validation, Premium, explicit viewer/replication integrations, and attribution are preserved. The inherited tracking helper still exists for compatibility and is no longer invoked automatically by dev-mode registration.
