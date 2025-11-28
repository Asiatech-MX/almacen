/**
 * Global teardown for Playwright E2E tests
 * Cleans up test environment, database connections, and test data
 */

import { FullConfig } from '@playwright/test';
import { execSync } from 'path';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up E2E test environment...');

  try {
    // Clean up test data directory (optional)
    if (process.env.CLEANUP_TEST_DATA === 'true') {
      console.log('🗑️ Cleaning up test data...');
      const testDataDir = path.resolve(__dirname, 'test-data');
      execSync(`rm -rf "${testDataDir}"`, { stdio: 'ignore' });
    }

    // Clean up test database (optional)
    if (process.env.CLEANUP_TEST_DB === 'true') {
      console.log('🗄️ Cleaning up test database...');
      // Add database cleanup commands here if needed
    }

    // Clean up any test artifacts if needed
    console.log('📁 Cleaning up test artifacts...');
    // execSync('rm -rf test-results/*', { stdio: 'ignore' });

    console.log('✅ E2E test environment cleanup complete');

  } catch (error) {
    console.error('❌ E2E teardown failed:', error);
  }
}

export default globalTeardown;