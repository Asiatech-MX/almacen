#!/usr/bin/env node

import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'

// Load environment variables
config()

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface Database {
  [key: string]: any
}

const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: process.env.DATABASE_URL,
    }),
  }),
})

async function executeRollback() {
  try {
    console.log('🔄 Testing rollback procedure...')

    // Read the rollback SQL file
    const rollbackSql = fs.readFileSync(
      path.join(__dirname, '../backend/migrations/rollback_001_reference_tables.sql'),
      'utf-8'
    )

    console.log('📝 Executing rollback SQL...')

    // Execute rollback SQL
    await db.executeQuery({
      sql: rollbackSql,
      parameters: [],
      query: {
        kind: 'RawQuery',
        sql: rollbackSql,
        parameters: []
      }
    })

    console.log('✅ Rollback executed successfully!')
    console.log('🗑️  Reference tables and functions have been removed')
    console.log('🔙 materia_prima table has been restored to original state')

  } catch (error) {
    console.error('❌ Rollback failed:', error)
    throw error
  } finally {
    await db.destroy()
  }
}

async function verifyRollback() {
  // Create a new connection for verification
  const verifyDb = new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: process.env.DATABASE_URL,
      }),
    }),
  })

  try {
    console.log('🔍 Verifying rollback results...')

    // Check that reference tables no longer exist
    const presentacionCheck = await verifyDb.executeQuery({
      sql: 'SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = \'presentacion\') as exists',
      parameters: [],
      query: {
        kind: 'RawQuery',
        sql: 'SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = \'presentacion\') as exists',
        parameters: []
      }
    })

    const categoriaCheck = await verifyDb.executeQuery({
      sql: 'SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = \'categoria\') as exists',
      parameters: [],
      query: {
        kind: 'RawQuery',
        sql: 'SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = \'categoria\') as exists',
        parameters: []
      }
    })

    const presentacionResult = presentacionCheck.rows[0]
    const categoriaResult = categoriaCheck.rows[0]

    console.log(`📊 presentacion table exists: ${presentacionResult.exists}`)
    console.log(`📊 categoria table exists: ${categoriaResult.exists}`)

    // Check that materia_prima still exists
    const materiaPrimaCheck = await verifyDb.executeQuery({
      sql: 'SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = \'materia_prima\') as exists',
      parameters: [],
      query: {
        kind: 'RawQuery',
        sql: 'SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = \'materia_prima\') as exists',
        parameters: []
      }
    })

    const materiaPrimaResult = materiaPrimaCheck.rows[0]
    console.log(`📊 materia_prima table exists: ${materiaPrimaResult.exists}`)

    if (!presentacionResult.exists && !categoriaResult.exists && materiaPrimaResult.exists) {
      console.log('✅ Rollback verification successful!')
      return true
    } else {
      console.log('❌ Rollback verification failed!')
      return false
    }

  } catch (error) {
    console.error('❌ Verification failed:', error)
    return false
  } finally {
    await verifyDb.destroy()
  }
}

async function main() {
  console.log('🧪 Starting rollback test procedure...\n')

  try {
    await executeRollback()
    console.log()

    const success = await verifyRollback()
    console.log()

    if (success) {
      console.log('🎉 Rollback test completed successfully!')
      console.log('💡 The rollback procedure is ready for production use.')
    } else {
      console.log('⚠️  Rollback test completed with issues.')
      console.log('💡 Please review the rollback script before production use.')
    }

  } catch (error) {
    console.error('\n💥 Rollback test failed:', error)
    process.exit(1)
  }
}

main()