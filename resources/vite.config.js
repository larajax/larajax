import { defineConfig } from 'vite';
import { resolve } from 'path';

const entry = process.env.ENTRY || 'framework';

export default defineConfig(({ mode }) => {
    const isProd = mode === 'production';
    const suffix = isProd ? '.min' : '';

    return {
        build: {
            outDir: 'dist',
            emptyOutDir: false,
            sourcemap: false,
            minify: isProd ? 'esbuild' : false,
            lib: {
                entry: resolve(__dirname, `src/${entry}.js`),
                name: 'jax',
                formats: ['iife'],
                fileName: () => `${entry}${suffix}.js`,
            },
        },
    };
});
