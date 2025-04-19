module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom', // Important for DOM testing
    testMatch: ['**/tests/**/*.test.ts'],
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1'
    }
};