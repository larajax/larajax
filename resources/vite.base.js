import { defineConfig } from 'vite';
import { resolve } from 'path';

const entry = process.env.ENTRY || 'framework';

export function makeConfig(entry) {
    return defineConfig(({ mode }) => {
        return {
            build: {
                outDir: 'dist',
                emptyOutDir: false,
                sourcemap: false,
                minify: mode === 'development' ? false : 'esbuild',
                lib: {
                    entry: resolve(__dirname, `src/${entry}.js`),
                    name: 'jax',
                    formats: ['iife'],
                    fileName: (format, entryName) =>
                        mode === 'development'
                        ? `${entryName}.js`
                        : `${entryName}.min.js`
                },
            },
        };
    });
}
