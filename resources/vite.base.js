import { defineConfig } from 'vite'

export function makeConfig(entry, name) {
    return defineConfig(({ mode }) => ({
        build: {
            outDir: 'dist',
            emptyOutDir: false,

            minify: mode === 'development' ? false : 'esbuild',

            rollupOptions: {
                input: entry,
                output: {
                    format: 'iife',
                    entryFileNames:
                        mode === 'development'
                            ? `${name}.js`
                            : `${name}.min.js`,
                    inlineDynamicImports: true
                }
            }
        }
    }))
}
