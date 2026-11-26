import { defineConfig } from 'vite';

/**
 * CLA-DB: test-only Vite application.
 *
 * The app imports `@clatech/db` from the installed candidate tarball and runs
 * against native IndexedDB through the Dexie storage plugin.
 */
export default defineConfig({
    base: '/',
    logLevel: 'error',
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        target: 'es2022',
        sourcemap: false
    }
});
