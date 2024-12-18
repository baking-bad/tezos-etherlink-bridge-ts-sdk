/* eslint-disable no-await-in-loop */
/* eslint-env node */
const startTime = process.hrtime.bigint();
import { spawnSync } from 'child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

import { build } from 'esbuild';

const ethers5TypeFilePath = 'dist/types/bridgeBlockchainService/ethersEtherlinkBridgeBlockchainService/ethersV5EtherlinkBridgeBlockchainService.d.ts';

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
 * @type {import('esbuild').Plugin}
 */
const applyPlatformModulesPlugin = {
  name: 'apply-platform-modules-plugin',
  setup: build => {
    const extensionRegEx = /\.(js|mjs)$/;
    build.onResolve(
      { filter: /index.abstract/ },
      args => {
        let updatedPath = extensionRegEx.test(args.path) ? args.path.replace(extensionRegEx, ext => ext.replace('js', 'ts')) : args.path + '.ts';
        updatedPath = updatedPath.replace('abstract', build.initialOptions.platform === 'browser' ? 'browser' : 'node');

        return { path: path.join(args.resolveDir, updatedPath) };
      }
    );
  }
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
    makeAllPackagesExternalPlugin,
    applyPlatformModulesPlugin,
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

  const typeContent = await fs.readFile(ethers5TypeFilePath, 'utf8');
  await fs.writeFile(ethers5TypeFilePath, typeContent.replaceAll('ethers-v5', 'ethers'), 'utf8');

  console.info(`Type checking is completed (${getElapsedTimeMs()}ms)`);
  console.info('Building...');

  // Node
  const buildPromises = [['cjs', '.cjs'], ['cjs', '.js'], ['esm', '.mjs']]
    .map(([format, outExtension]) => build({
      ...getNodeJsOptions(),
      format,
      outExtension: { '.js': outExtension }
    }));
  // Browser
  buildPromises.concat([['esm', '.js'], ['esm', '.mjs']]
    .map(([format, outExtension]) => build({
      ...getBrowserJsOptions(),
      format,
      outExtension: { '.js': outExtension }
    })));

  await Promise.all(buildPromises);

  console.info(`Building is completed (${getElapsedTimeMs()}ms)`);
  console.info(`\n\x1b[32mDone in ${getElapsedTimeMs(false)}ms\x1b[0m`);
} catch (error) {
  fail(error);
}
