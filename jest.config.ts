import type { Config } from 'jest';

const config: Config = {
  projects: [
    {
      displayName: 'unit',
      testMatch: ['**/__tests__/unit/**/*.test.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
    },
    {
      displayName: 'integration',
      testMatch: ['**/__tests__/integration/**/*.test.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
    },
    {
      displayName: 'e2e',
      testMatch: ['**/__tests__/e2e/**/*.test.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
    },
  ],
};

export default config;
