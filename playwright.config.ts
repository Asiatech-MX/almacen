import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 * @type {import('playwright').PlaywrightTestConfig}
 */
const config = defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'retain-on-failure'
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against Electron */
    {
      name: 'electron',
      use: {
        ...devices['Desktop Chrome'],
        // Electron specific configuration
        electronApplicationPath: require('electron'),
        electronApplicationArgs: [
          'apps/electron-main/dist/main.js',
          '--no-sandbox'
        ]
      },
      testIgnore: [
        // Ignore tests that require web-specific APIs not available in Electron
        '**/api.test.ts',
        '**/external.test.ts'
      ]
    }
  ],

  /* Global setup and teardown */
  globalSetup: require('./tests/e2e/global-setup.ts'),

  /* Global teardown */
  globalTeardown: require('./tests/e2e/global-teardown.ts'),

  /* Test timeout */
  timeout: 30000,

  /* Expect timeout */
  expect: {
    timeout: 5000
  },

  /* Test timeout for individual actions */
  actionTimeout: 10000
});

export default config;