/**
 * CLA-DB: shared helpers for the browser integration scenarios.
 *
 * Assertions run on the public behavior of the installed package and on the
 * locally controlled backend. Nothing reads internal storage structures.
 */

export function assert(condition, message) {
    if (!condition) {
        throw new Error('assertion failed: ' + message);
    }
}

export function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(
            'assertion failed: ' + message +
            ' (expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual) + ')'
        );
    }
}

export function assertDeepEqual(actual, expected, message) {
    const actualJson = JSON.stringify(actual);
    const expectedJson = JSON.stringify(expected);
    if (actualJson !== expectedJson) {
        throw new Error(
            'assertion failed: ' + message +
            ' (expected ' + expectedJson + ', got ' + actualJson + ')'
        );
    }
}

export function uid(prefix) {
    return prefix + '_' + Math.random().toString(36).slice(2, 10);
}

export function doc(id, count, overrides = {}) {
    return Object.assign({
        id,
        title: 'title ' + id,
        count,
        updatedAt: 1000 + count
    }, overrides);
}

const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

export function formatValue(value) {
    try {
        const json = JSON.stringify(value);
        return json && json.length > 400 ? json.slice(0, 400) + '...' : json;
    } catch (err) {
        return String(value);
    }
}

export async function pollUntil(fn, predicate, { timeout = 30_000, interval = 100, label = 'condition' } = {}) {
    const startedAt = Date.now();
    let lastValue;
    let lastError = null;
    while (Date.now() - startedAt < timeout) {
        try {
            lastValue = await fn();
            if (predicate(lastValue)) {
                return lastValue;
            }
        } catch (err) {
            lastError = err;
        }
        await sleep(interval);
    }
    throw new Error(
        'timed out after ' + timeout + 'ms waiting for ' + label +
        '; last value: ' + formatValue(lastValue) +
        (lastError ? '; last error: ' + lastError.message : '')
    );
}

export function harness(page, method, argument = {}) {
    return page
        .evaluate(async ([methodName, methodArgument]) => {
            const api = window.__claDbHarness;
            if (!api || typeof api[methodName] !== 'function') {
                throw new Error('harness method is missing: ' + methodName);
            }
            try {
                return await api[methodName](methodArgument);
            } catch (err) {
                /**
                 * Package errors can carry circular references, which the
                 * page bridge cannot serialize. Re-throw a plain error that
                 * keeps the message readable across the bridge.
                 */
                throw new Error(
                    err && err.message ? String(err.message) : String(err),
                    { cause: err }
                );
            }
        }, [method, argument])
        .catch(err => {
            throw new Error('harness method ' + method + ' failed: ' + err.message);
        });
}

export async function waitForApp(page, timeout = 30_000) {
    await page.waitForFunction(() => Boolean(window.__claDbHarness), null, { timeout });
}

export async function gotoApp(page, origin) {
    await page.goto(origin + '/', { waitUntil: 'load' });
    await waitForApp(page);
}

/**
 * Waits until the app shell service worker is active and controls the page,
 * then reloads once while online so every shell asset passes through the
 * service worker cache. Only afterwards can an offline reload succeed.
 */
export async function ensureAppShellCached(page, timeout = 30_000) {
    await pollUntil(
        () => harness(page, 'serviceWorkerState'),
        state => state.supported === true && state.active === true && state.controlled === true,
        { timeout, label: 'app-shell service worker control' }
    );
    await page.reload({ waitUntil: 'load' });
    await waitForApp(page);
}

export function serverCollectionStats(server, collection) {
    return server.backend.stats().collections[collection] || null;
}
