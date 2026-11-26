# Network and Privacy Evidence

No CLA DB production source changed for 0.1.3. DevMode still does not start the inherited marketing iframe automatically. The Node 24.22.3 Memory suite passed both `dev-mode-network.test.ts` cases: the public plugin registration and repeated `init()` append no tracking iframe, and local CRUD plus DevMode validation and resource cleanup work with selected network APIs blocked. This interception covers the APIs named in [the baseline audit](../0.1.2/NETWORK_AUDIT.md), not an OS-wide packet capture or every dependency.

| Opt-in feature | Default or requirement | How to control it |
| --- | --- | --- |
| `mountRxDBViewer()` | Includes the hosted upstream viewer by default | Pass a reviewed `viewerUrl` when mounting it. |
| `connectRxDBViewer()` | Uses explicitly invoked pairing and upstream-hosted defaults | Supply a reviewed viewer URL and signaling URL, and control access to the pairing link. |
| WebRTC simple-peer handler | Explicit use may connect to `wss://signaling.rxdb.info/` | Set `signalingServerUrl`; audit your ICE/STUN/TURN settings separately. |
| Nostr handler | Requires an explicit `relays` list | Supply only relays that you trust. |
| Google Drive and OneDrive replication | Explicit opt-in with Google's or Microsoft's API defaults | Use the endpoint and client options for the selected plugin. These operations are not offline. |
| Other replication hosts and remote storage | Optional transport, URL, client, or service dependency | Configure and audit the transport. See the baseline endpoint inventory for details. |

The official landing page's built output was loaded with external requests blocked in pinned Chromium 159.0.8154.6. The local page made no observed external requests during the install selector, keyboard focus, and clipboard check. This does not certify deployment or all pages. No new runtime dependencies ship in the archive. Dependency registry calls and Playwright downloads used by verification are build/test traffic, not behavior of CLA DB at runtime. The inherited documentation site's residual embeds and standalone viewer asset notices remain documented [in 0.1.2](../0.1.2/NETWORK_AUDIT.md#website-runtime-is-separate). No blanket zero-telemetry claim is made.
