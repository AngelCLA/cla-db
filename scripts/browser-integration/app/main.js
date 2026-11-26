/**
 * CLA-DB: integration app entry.
 *
 * The app is built by Vite from the installed candidate tarball and exposes
 * an automation surface on `window.__claDbHarness`. Playwright drives it and
 * asserts the public behavior of the published package.
 */
import { createHarness } from './harness.js';
import { createOfflineHarness } from './offline.js';

const harness = Object.assign({}, createHarness(), createOfflineHarness());
window.__claDbHarness = harness;

const statusElement = document.getElementById('status');
if (statusElement) {
    statusElement.textContent = 'ready';
}

/**
 * Minimal app-shell service worker. It is registered by the app, never by
 * the database package. `navigator.serviceWorker.ready` is exposed so a test
 * can wait until the shell is available for offline navigations.
 */
if ('serviceWorker' in navigator) {
    window.__claDbServiceWorker = navigator.serviceWorker
        .register('./sw.js')
        .then(registration => registration.scope)
        .catch(err => 'error: ' + err.message);
} else {
    window.__claDbServiceWorker = Promise.resolve('unsupported');
}
