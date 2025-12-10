/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    '<rootDir>/src/test-utils/setupTests.ts'
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared-types/(.*)$': '<rootDir>/../../packages/shared-types/src/$1'
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true
        }
      }
    ]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test-utils/**',
    '!src/main.tsx',
    '!src/vite-env.d.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/hooks/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  testMatch: [
    '<rootDir>/test/**/*.{test,spec}.{ts,tsx}',
    '<rootDir>/src/**/__tests__/**/*.{test,spec}.{ts,tsx}'
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/build/'
  ],
  testTimeout: 10000,
  maxWorkers: '50%',
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },
  // Configuración específica para TanStack Query
  // Deshabilita advertencias sobre act() en tests
  errorOnDeprecated: true,
  // Improve performance
  cache: true,
  maxConcurrency: 5
}