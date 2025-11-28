#!/usr/bin/env node

import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import { config } from 'dotenv'

// Load environment variables
config()

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

async function resetMigrations() {
  try {
    console.log('Resetting migration records...')

    // Clean up problematic migrations
    await db
      .deleteFrom('kysely_migration')
      .where('name', 'in', [
        '001_create_materia_prima_fixed.sql',
        '001_create_materia_prima.sql'
      ])
      .execute()

    console.log('✓ Migration records cleaned up')
  } catch (error) {
    console.error('Error resetting migrations:', error)
    throw error
  } finally {
    await db.destroy()
  }
}

resetMigrations()