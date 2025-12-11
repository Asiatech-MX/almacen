/**
 * Global setup for Playwright E2E tests
 * Sets up test environment, database connections, and test data
 */

import { FullConfig } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up E2E test environment...');

  try {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/almacen_test';

    // Ensure the Electron app is built
    console.log('📦 Building Electron application...');
    execSync('pnpm build', {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '../..')
    });

    // Setup test database (optional - if you need to create test schema)
    if (process.env.SETUP_TEST_DB === 'true') {
      console.log('🗄️ Setting up test database...');
      // Add database setup commands here if needed
      // execSync('pnpm db:migrate', { stdio: 'inherit' });
    }

    // Create test data directory if needed
    const testDataDir = path.resolve(__dirname, 'test-data');
    execSync(`mkdir -p "${testDataDir}"`, { stdio: 'ignore' });

    console.log('✅ E2E test environment setup complete');

  } catch (error) {
    console.error('❌ E2E setup failed:', error);
    process.exit(1);
  }
}

export default globalSetup;