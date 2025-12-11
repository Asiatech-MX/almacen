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

async function markMigrationAsComplete() {
  try {
    console.log('Marking migrations as complete...')

    await db
      .insertInto('kysely_migration')
      .values({ name: '000_create_materia_prima.sql' })
      .onConflict((oc) => oc.doNothing())
      .execute()

    await db
      .insertInto('kysely_migration')
      .values({ name: '001_create_reference_tables_with_hierarchy.sql' })
      .onConflict((oc) => oc.doNothing())
      .execute()

    console.log('✓ All migrations marked as complete')
  } catch (error) {
    console.error('Error marking migrations:', error)
    throw error
  } finally {
    await db.destroy()
  }
}

markMigrationAsComplete()