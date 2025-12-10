import { chromium, FullConfig } from '@playwright/test'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'

const execAsync = promisify(exec)

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up E2E test environment for Electron...')

  // 1. Build the application for testing
  console.log('📦 Building application...')
  try {
    await execAsync('bun run build', {
      cwd: path.resolve(__dirname, '../../..')
    })
    console.log('✅ Application built successfully')
  } catch (error) {
    console.error('❌ Failed to build application:', error)
    throw error
  }

  // 2. Setup test database (if needed)
  console.log('🗄️ Setting up test database...')
  try {
    // Reset test database
    await execAsync('bun run db:reset:test', {
      cwd: path.resolve(__dirname, '../../..')
    })
    console.log('✅ Test database setup complete')
  } catch (error) {
    console.warn('⚠️ Could not setup test database:', error)
    // Continue without database setup for now
  }

  // 3. Create test data seeds
  console.log('🌱 Seeding test data...')
  try {
    await seedTestData()
    console.log('✅ Test data seeded successfully')
  } catch (error) {
    console.error('❌ Failed to seed test data:', error)
    throw error
  }

  // 4. Launch Electron app in background
  console.log('🖥️ Launching Electron app for testing...')
  const electronAppPath = path.resolve(__dirname, '../../../dist/electron-renderer/main.js')

  if (fs.existsSync(electronAppPath)) {
    // Store app path for tests to use
    process.env.ELECTRON_APP_PATH = electronAppPath
    console.log('✅ Electron app path configured:', electronAppPath)
  } else {
    console.warn('⚠️ Electron app not found at expected path. Tests will run in dev mode.')
    process.env.ELECTRON_DEV_MODE = 'true'
  }

  // 5. Setup test environment variables
  process.env.NODE_ENV = 'test'
  process.env.E2E_TEST_MODE = 'true'
  process.env.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5433/almacen_test'

  console.log('✅ E2E test environment ready!')
}

async function seedTestData() {
  // This would connect to your test database and insert test data
  // For now, we'll just create a simple seed file
  const testSeedData = {
    categorias: [
      {
        id: 'cat-test-1',
        nombre: 'Electricidad Test',
        nivel: 1,
        activo: true,
        id_institucion: 1
      },
      {
        id: 'cat-test-2',
        nombre: 'Plomería Test',
        nivel: 1,
        activo: true,
        id_institucion: 1
      }
    ],
    presentaciones: [
      {
        id: 'pres-test-1',
        nombre: 'Unidad Test',
        abreviatura: 'Und',
        activo: true,
        es_predeterminado: true,
        id_institucion: 1
      },
      {
        id: 'pres-test-2',
        nombre: 'Caja Test',
        abreviatura: 'Cja',
        activo: true,
        es_predeterminado: false,
        id_institucion: 1
      }
    ],
    proveedores: [
      {
        id: 'prov-test-1',
        nombre: 'Proveedor Test 1',
        ruc: '12345678901',
        telefono: '999999999',
        email: 'test1@proveedor.com',
        activo: true
      }
    ]
  }

  // Write seed data to a temp file that tests can read
  const seedFilePath = path.resolve(__dirname, '../test-seed-data.json')
  fs.writeFileSync(seedFilePath, JSON.stringify(testSeedData, null, 2))

  console.log('📝 Test seed data written to:', seedFilePath)
}

export default globalSetup