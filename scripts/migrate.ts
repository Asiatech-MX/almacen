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
  // This is a minimal interface for migration purposes
  // You can expand it as needed
  [key: string]: any
}

const migrationDir = path.join(__dirname, '../backend/migrations')

const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: process.env.DATABASE_URL,
    }),
  }),
})

async function createMigrationsTable() {
  await db.schema
    .createTable('kysely_migration')
    .ifNotExists()
    .addColumn('name', 'varchar(255)', (col) => col.primaryKey())
    .addColumn('executed_at', 'timestamp', (col) => col.notNull().defaultTo('CURRENT_TIMESTAMP'))
    .execute()
}

async function getExecutedMigrations(): Promise<string[]> {
  const result = await db
    .selectFrom('kysely_migration')
    .select('name')
    .execute()
  return result.map((row) => row.name)
}

async function markMigrationAsExecuted(name: string) {
  await db
    .insertInto('kysely_migration')
    .values({ name })
    .execute()
}

async function runMigration(fileName: string, sql: string) {
  console.log(`Running migration: ${fileName}`)

  try {
    // Execute SQL as a single batch
    await db.executeQuery({
      sql: sql,
      parameters: [],
      query: {
        kind: 'RawQuery',
        sql: sql,
        parameters: []
      }
    })

    // Mark as executed
    await markMigrationAsExecuted(fileName)
    console.log(`✓ Migration ${fileName} executed successfully`)
  } catch (error) {
    console.error(`✗ Error executing migration ${fileName}:`, error)
    console.error(`SQL preview:`, sql.substring(0, 200) + '...')
    throw error
  }
}

async function migrate() {
  try {
    console.log('Starting migration process...')

    // Create migrations table if it doesn't exist
    await createMigrationsTable()

    // Get executed migrations
    const executedMigrations = await getExecutedMigrations()

    // Get migration files
    const migrationFiles = fs.readdirSync(migrationDir)
      .filter((file) => file.endsWith('.sql'))
      .sort()

    console.log(`Found ${migrationFiles.length} migration files`)
    console.log(`Already executed migrations: ${executedMigrations.length}`)

    // Run pending migrations
    for (const file of migrationFiles) {
      if (!executedMigrations.includes(file)) {
        const sql = fs.readFileSync(path.join(migrationDir, file), 'utf-8')
        await runMigration(file, sql)
      } else {
        console.log(`Skipping ${file} (already executed)`)
      }
    }

    console.log('Migration process completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await db.destroy()
  }
}

// Run if called directly (always execute when script is run)
migrate()

export { migrate }