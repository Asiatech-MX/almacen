import type { Dialect } from 'kysely-codegen'

const config: Dialect = {
  dialect: 'postgres',
  connectionString: process.env.DATABASE_URL,
}

export default config