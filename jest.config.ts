import type { Config } from 'jest';

const config: Config = {
  projects: [
    // Frontend Tests (React Components)
    {
      displayName: 'frontend',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      roots: ['<rootDir>/apps/electron-renderer/src'],
      testMatch: [
        '**/__tests__/**/*.(ts|tsx|js)',
        '**/*.(test|spec).(ts|tsx|js)'
      ],
      transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest'
      },

      // Configuración de módulos para frontend
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/apps/electron-renderer/src/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/tests/__mocks__/fileMock.js'
      },

      // Setup files para frontend
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

      // Global configurations para frontend
      globals: {
        'ts-jest': {
          tsconfig: 'apps/electron-renderer/tsconfig.json'
        }
      },

      // Mocks para Electron y APIs del navegador
      clearMocks: true,
      resetMocks: true,
      restoreMocks: true,

      // Timeout para tests asíncronos
      testTimeout: 10000,

      // Exclude E2E tests from Jest
      testPathIgnorePatterns: [
        'tests/e2e'
      ]
    },

    // Backend Tests (Node.js)
    {
      displayName: 'backend',
      preset: 'ts-jest/presets/default-esm',
      testEnvironment: 'node',
      roots: ['<rootDir>/backend', '<rootDir>/tests/integration'],
      testMatch: [
        '**/__tests__/**/*.ts',
        '**/?(*.)+(spec|test).ts'
      ],
      testPathIgnorePatterns: [
        'tests/e2e',
        'tests/integration/materiaPrima.elimination.integration.test.ts'
      ],
      extensionsToTreatAsEsm: ['.ts'],
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
      },
      transform: {
        '^.+\\.tsx?$': [
          'ts-jest',
          {
            useESM: true,
            tsconfig: {
              isolatedModules: true,
            },
          },
        ],
      },
      moduleFileExtensions: ['ts', 'js', 'json'],
      testTimeout: 30000
    }
  ],

  // Global coverage configuration
  collectCoverageFrom: [
    'apps/electron-renderer/src/**/*.(ts|tsx)',
    'backend/**/*.ts',
    '!**/*.d.ts',
    '!**/*.types.ts',
    '!**/*.stories.tsx',
    '!**/index.ts',
    '!**/node_modules/**',
    '!tests/e2e/**'
  ],

  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },

  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],

  // Extender matchers
  setupFilesAfterEnv: ['jest-extended/all'],

  // Global reporters
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test-results',
        outputName: 'junit.xml'
      }
    ]
  ],

  // Global ignore patterns
  testPathIgnorePatterns: [
    'node_modules',
    'dist',
    'build',
    'tests/e2e'
  ]
};

export default config;