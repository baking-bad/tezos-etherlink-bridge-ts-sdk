/* eslint-disable */
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, './.env'), override: true })
dotenv.config({ path: path.resolve(__dirname, './.env.local'), override: true })

/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  clearMocks: true,
  testEnvironment: 'node',
  testTimeout: Number.parseInt(process.env.JEST_TIMEOUT)
};
