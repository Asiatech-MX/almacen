/**
 * Testing Infrastructure Verification
 * This script verifies that all testing components are properly configured
 */

import { existsSync, readdirSync } from 'fs';
import path from 'path';

interface CheckResult {
  success: boolean;
  message: string;
}

function checkFile(filePath: string, description: string): CheckResult {
  const exists = existsSync(filePath);
  return {
    success: exists,
    message: `${description}: ${exists ? '✅ OK' : '❌ Missing'}`
  };
}

function checkDirectory(dirPath: string, description: string, requiredFiles: string[] = []): CheckResult {
  if (!existsSync(dirPath)) {
    return {
      success: false,
      message: `${description}: ❌ Directory not found`
    };
  }

  const files = readdirSync(dirPath);
  const missingFiles = requiredFiles.filter(file => !files.includes(file));

  if (missingFiles.length > 0) {
    return {
      success: false,
      message: `${description}: ❌ Missing files: ${missingFiles.join(', ')}`
    };
  }

  return {
    success: true,
    message: `${description}: ✅ OK (${files.length} files)`
  };
}

function runInfrastructureCheck() {
  console.log('🔍 Verifying Testing Infrastructure\n');

  const checks: CheckResult[] = [];

  // Configuration files
  checks.push(checkFile('jest.config.ts', 'Jest configuration'));
  checks.push(checkFile('playwright.config.ts', 'Playwright configuration'));
  checks.push(checkFile('tests/setup.ts', 'Jest test setup'));

  // Package.json scripts
  try {
    const packageJson = JSON.parse(require('fs').readFileSync('../package.json', 'utf8'));
    const scripts = packageJson.scripts || {};

    const requiredScripts = [
      'test',
      'test:watch',
      'test:coverage',
      'test:e2e',
      'test:unit',
      'test:integration'
    ];

    const missingScripts = requiredScripts.filter(script => !scripts[script]);

    if (missingScripts.length > 0) {
      checks.push({
        success: false,
        message: `Package.json scripts: ❌ Missing ${missingScripts.join(', ')}`
      });
    } else {
      checks.push({
        success: true,
        message: 'Package.json scripts: ✅ OK (all required scripts present)'
      });
    }
  } catch (error) {
    checks.push({
      success: false,
      message: 'Package.json: ❌ Could not read package.json'
    });
  }

  // Test directories and files
  checks.push(checkDirectory('tests', 'Tests root directory'));
  checks.push(checkDirectory('tests/e2e', 'E2E tests directory', [
    'categoria-management.spec.ts',
    'materia-prima-workflow.spec.ts'
  ]));
  checks.push(checkDirectory('tests/e2e', 'E2E setup files', [
    'global-setup.ts',
    'global-teardown.ts'
  ]));

  // Component tests
  checks.push(checkDirectory('apps/electron-renderer/src/components/ui/__tests__', 'Component tests directory', [
    'DynamicSelect.test.tsx',
    'InlineEditModal.test.tsx'
  ]));

  // Hook tests
  checks.push(checkDirectory('apps/electron-renderer/src/hooks/__tests__', 'Hook tests directory', [
    'useReferenceData.test.ts'
  ]));

  // Module tests
  checks.push(checkDirectory('apps/electron-renderer/src/modules/admin/__tests__', 'Admin module tests', [
    'CategoriaManager.test.tsx'
  ]));
  checks.push(checkDirectory('apps/electron-renderer/src/modules/materiaPrima/__tests__', 'Materia Prima module tests', [
    'Formulario.test.tsx'
  ]));

  // Coverage check script
  checks.push(checkFile('scripts/check-coverage.js', 'Coverage verification script'));

  // Dependencies check
  try {
    const packageJson = JSON.parse(require('fs').readFileSync('../package.json', 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    const requiredDeps = [
      '@playwright/test',
      '@testing-library/react',
      '@testing-library/jest-dom',
      '@testing-library/user-event',
      'jest',
      'ts-jest'
    ];

    const missingDeps = requiredDeps.filter(dep => !deps[dep]);

    if (missingDeps.length > 0) {
      checks.push({
        success: false,
        message: `Testing dependencies: ❌ Missing ${missingDeps.join(', ')}`
      });
    } else {
      checks.push({
        success: true,
        message: 'Testing dependencies: ✅ OK (all required dependencies present)'
      });
    }
  } catch (error) {
    checks.push({
      success: false,
      message: 'Dependencies check: ❌ Could not verify dependencies'
    });
  }

  // Results
  const passed = checks.filter(check => check.success).length;
  const total = checks.length;

  console.log('📊 Results:\n');
  checks.forEach(check => {
    console.log(check.message);
  });

  console.log(`\n📈 Summary: ${passed}/${total} checks passed (${Math.round((passed/total) * 100)}%)`);

  if (passed === total) {
    console.log('\n🎉 All testing infrastructure components are properly configured!');
    process.exit(0);
  } else {
    console.log('\n⚠️ Some components are missing. Please review the failed checks above.');
    process.exit(1);
  }
}

runInfrastructureCheck();