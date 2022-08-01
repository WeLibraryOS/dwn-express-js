import { build } from 'esbuild';

const startTime = Date.now();

console.log('🎁 Bundling...');

build({
    entryPoints: ['source/index.ts'],
    platform: 'node',
    bundle: true,
    format: 'cjs',
    outdir: 'dist/index.js',
    target: 'node18',
    sourcemap: true,
    external: ['classic-level', 'leveldown']
})
    .then(() => {
        console.log(`🎁 Finished bundling in ${Date.now() - startTime}ms`);
    })
