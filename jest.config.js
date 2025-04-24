// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    // Map the alias '@rzf/' to the actual 'src/' directory
    // This tells Jest how to handle imports starting with '@rzf/'
    '^@rzf/(.*)$': '<rootDir>/src/$1',
  },
};