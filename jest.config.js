/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  "transform": {
    "^.+\\.tsx?$": [ 
      "esbuild-jest", 
      { 
        sourcemap: true,
        loaders: {
          '.test.ts': 'ts'
        },
        format: 'cjs',
        target: 'node18',
      } 
    ]
  }
};