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

async function executeReferenceMigration() {
  try {
    console.log('🚀 Executing reference tables migration...')

    // Read the migration SQL file
    const migrationSql = fs.readFileSync(
      path.join(__dirname, '../backend/migrations/001_create_reference_tables_with_hierarchy.sql'),
      'utf-8'
    )

    console.log('📝 Creating presentacion and categoria tables...')

    // Execute migration SQL
    await db.executeQuery({
      sql: migrationSql,
      parameters: [],
      query: {
        kind: 'RawQuery',
        sql: migrationSql,
        parameters: []
      }
    })

    console.log('✅ Reference migration executed successfully!')
    console.log('📊 presentacion and categoria tables have been created')
    console.log('🔗 materia_prima table has been extended with reference IDs')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await db.destroy()
  }
}

executeReferenceMigration()