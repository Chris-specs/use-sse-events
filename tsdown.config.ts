import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    minify: true,
    sourcemap: true,
    treeshake: true,
    deps: {
        neverBundle: ['react']
    }
})
