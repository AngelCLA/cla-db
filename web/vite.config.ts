import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    appType: 'mpa',
    plugins: [react()],
    build: {
        rolldownOptions: {
            input: {
                landing: fileURLToPath(new URL('./index.html', import.meta.url)),
                docs: fileURLToPath(new URL('./docs.html', import.meta.url))
            }
        }
    },
    server: {
        port: 4321
    },
    preview: {
        port: 4321
    }
});
