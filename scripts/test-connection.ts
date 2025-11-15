#!/usr/bin/env node

import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import { config } from 'dotenv'

// Load environment variables
config()

const db = new Kysely({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: process.env.DATABASE_URL,
    }),
  }),
})

async function testConnection() {
  try {
    console.log('Testing database connection...')
    const result = await db.executeQuery({
      sql: 'SELECT NOW() as current_time, version() as version',
      parameters: [],
      query: {
        kind: 'RawQuery',
        sql: 'SELECT NOW() as current_time, version() as version',
        parameters: []
      }
    })

    console.log('✓ Connection successful!')
    console.log('Current time:', result.rows[0].current_time)
    console.log('PostgreSQL version:', result.rows[0].version)
  } catch (error) {
    console.error('✗ Connection failed:', error)
  } finally {
    await db.destroy()
  }
}

testConnection()