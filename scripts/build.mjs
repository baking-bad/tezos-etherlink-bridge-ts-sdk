/* eslint-disable no-await-in-loop */
/* eslint-env node */
const startTime = process.hrtime.bigint();
import { spawnSync } from 'child_process';

import { build } from 'esbuild';

let lastTime = startTime;
/**
 * @type {import('esbuild').Plugin}
 */
const makeAllPackagesExternalPlugin = {
  name: 'make-all-packages-external',
  setup: build => build.onResolve(
    { filter: /^[^./]|^\.[^./]|^\.\.[^/]/ },
    args => ({ external: true, path: args.path })
  )
};

/**
 * @type {import('esbuild').BuildOptions}
 */
const baseOptions = {
  entryPoints: ['./src/index.ts'],
  target: 'es2020',
  bundle: true,
  treeShaking: true,
  sourcemap: true,
  minify: false,
  plugins: [
    makeAllPackagesExternalPlugin
  ]
};

/**
 * @returns {import('esbuild').BuildOptions}
 */
const getNodeJsOptions = () => ({
  ...baseOptions,
  outdir: './dist/node',
  platform: 'node',
});

/**
 * @returns {import('esbuild').BuildOptions}
 */
const getBrowserJsOptions = () => ({
  ...baseOptions,
  outdir: './dist/browser',
  platform: 'browser',
});

const getElapsedTimeMs = (useLastTime = true) => {
  const newLastTime = process.hrtime.bigint();
  const result = (newLastTime - (useLastTime ? lastTime : startTime)) / 1000000n;

  lastTime = newLastTime;
  return result;
};

const fail = error => {
  console.error('\x1b[31mFailed!\x1b[0m Reason:', error);
  process.exit(1);
};

try {
  console.info('Type checking and generating declarations...');
  const typeCheckingResult = spawnSync('npm', ['run', 'build:types'], { shell: true, stdio: 'inherit' });
  if (typeCheckingResult.status > 0)
    fail('Type checking failed');

  console.info(`Type checking is completed (${getElapsedTimeMs()}ms)`);
  console.info('Building...');

  const buildPromises = [['cjs', '.cjs'], ['cjs', '.js'], ['esm', '.mjs']]
    .map(([format, outExtension]) => build({
      ...getNodeJsOptions(),
      format,
      outExtension: { '.js': outExtension }
    }));
  buildPromises.push(build({
    ...getBrowserJsOptions(),
    format: 'esm'
  }));

  await Promise.all(buildPromises);

  console.info(`Building is completed (${getElapsedTimeMs()}ms)`);
  console.info(`\n\x1b[32mDone in ${getElapsedTimeMs(false)}ms\x1b[0m`);
} catch (error) {
  fail(error);
}
