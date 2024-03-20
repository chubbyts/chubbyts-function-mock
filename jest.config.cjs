/* eslint-disable no-undef */
/* eslint-disable functional/immutable-data */
module.exports = {
  'preset': 'ts-jest',
  'testEnvironment': 'node',
  'collectCoverageFrom': [
    'src/**/*.ts'
  ],
  'coverageThreshold': {
    'global': {
      'lines': 100
    }
  },
  prettierPath: require.resolve('prettier-2'),
};
