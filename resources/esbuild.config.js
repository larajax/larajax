import * as esbuild from 'esbuild';

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name) => {
    const arg = args.find(a => a.startsWith(`--${name}=`));
    return arg ? arg.split('=')[1] : null;
};

const entry = getArg('entry') || 'framework';
const mode = getArg('mode') || 'development';
const isProduction = mode === 'production';

await esbuild.build({
    entryPoints: [`src/${entry}.js`],
    bundle: true,
    format: 'iife',
    outfile: `dist/${entry}${isProduction ? '.min' : ''}.js`,
    minify: isProduction,
    treeShaking: false,
    sourcemap: false,
    target: ['es2020'],
});

console.log(`Built: dist/${entry}${isProduction ? '.min' : ''}.js`);
