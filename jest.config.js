/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
var esmModules = ['key-id-resolver'];

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[jt]sx?$': ['esbuild-jest', { sourcemap: true, target: 'es2020' }],
},
  transformIgnorePatterns: [
  ],
};