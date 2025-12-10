import { FullConfig } from '@playwright/test'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'

const execAsync = promisify(exec)

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up E2E test environment...')

  // 1. Close any running Electron processes
  console.log('🔄 Terminating Electron processes...')
  try {
    if (process.platform === 'win32') {
      await execAsync('taskkill /F /IM electron.exe 2>nul || echo No electron processes found')
    } else {
      await execAsync('pkill -f electron 2>/dev/null || echo No electron processes found')
    }
    console.log('✅ Electron processes terminated')
  } catch (error) {
    console.warn('⚠️ Could not terminate electron processes:', error)
  }

  // 2. Cleanup test database
  console.log('🗄️ Cleaning test database...')
  try {
    await execAsync('bun run db:cleanup:test', {
      cwd: path.resolve(__dirname, '../../..')
    })
    console.log('✅ Test database cleaned')
  } catch (error) {
    console.warn('⚠️ Could not cleanup test database:', error)
  }

  // 3. Remove temporary test files
  console.log('🗑️ Removing temporary test files...')
  const tempFiles = [
    path.resolve(__dirname, '../test-seed-data.json'),
    path.resolve(__dirname, '../test-logs'),
    path.resolve(__dirname, '../test-screenshots')
  ]

  tempFiles.forEach(file => {
    try {
      if (fs.existsSync(file)) {
        if (fs.statSync(file).isDirectory()) {
          fs.rmSync(file, { recursive: true, force: true })
        } else {
          fs.unlinkSync(file)
        }
        console.log(`✅ Removed: ${file}`)
      }
    } catch (error) {
      console.warn(`⚠️ Could not remove ${file}:`, error)
    }
  })

  // 4. Generate test report summary
  console.log('📊 Generating test report summary...')
  try {
    const testResultsDir = path.resolve(__dirname, '../../playwright-report')
    if (fs.existsSync(testResultsDir)) {
      const reportData = {
        timestamp: new Date().toISOString(),
        platform: process.platform,
        nodeVersion: process.version,
        testResults: 'Available in playwright-report directory'
      }

      const summaryFile = path.join(testResultsDir, 'test-summary.json')
      fs.writeFileSync(summaryFile, JSON.stringify(reportData, null, 2))
      console.log(`✅ Test summary written to: ${summaryFile}`)
    }
  } catch (error) {
    console.warn('⚠️ Could not generate test summary:', error)
  }

  // 5. Cleanup environment variables
  delete process.env.ELECTRON_APP_PATH
  delete process.env.ELECTRON_DEV_MODE
  delete process.env.E2E_TEST_MODE
  delete process.env.TEST_DATABASE_URL

  console.log('✅ E2E test environment cleaned up successfully!')
}

export default globalTeardown