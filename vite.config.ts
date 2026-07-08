import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
    base: './',
    build: {
        rollupOptions: {
            output: {
                assetFileNames: '[name][extname]'
            }
        }
    }
});
