import { Pool } from 'pg'
import { Kysely, PostgresDialect } from 'kysely'
import type { Database } from '../types/database'

// Configurar tipos de PostgreSQL para manejar bigint y numeric como números
const int8TypeId = 20
const numericTypeId = 1700

import pg from 'pg'
pg.types.setTypeParser(int8TypeId, (val: string) => {
  return parseInt(val, 10)
})

pg.types.setTypeParser(numericTypeId, (val: string) => {
  return parseFloat(val)
})

// Configuración del pool de conexiones
const poolConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/almacen_db',
  max: 10, // máximo número de clientes en el pool
  idleTimeoutMillis: 30000, // tiempo máximo que un cliente puede estar inactivo
  connectionTimeoutMillis: 2000, // tiempo máximo para establecer una conexión
  allowExitOnIdle: false, // no permitir que el proceso termine con conexiones inactivas
}

const pool = new Pool(poolConfig)

// Manejo de errores del pool
pool.on('error', (err) => {
  console.error('Error inesperado en el pool de conexiones PostgreSQL:', err)
})

// Variable privada para instancia de base de datos (lazy initialization)
let dbInstance: Kysely<Database> | null = null

// Función para obtener instancia de base de datos con lazy initialization
export function getDatabase(): Kysely<Database> {
  if (!dbInstance) {
    console.log('🗄️ Database connection established (lazy)')
    dbInstance = new Kysely<Database>({
      dialect: new PostgresDialect({ pool }),
      log: ['query', 'error'] // Logging para desarrollo
    })
  }
  return dbInstance
}

// Wrapper temporal eliminado en Fase 5 - usar getDatabase() en su lugar

// Función para verificar la conexión
export async function testConnection(): Promise<boolean> {
  try {
    const db = getDatabase()
    const result = await db
      .selectFrom('proveedor')
      .select('id')
      .limit(1)
      .executeTakeFirst()

    console.log('✅ Conexión a PostgreSQL establecida correctamente')
    return true
  } catch (error) {
    console.error('❌ Error al conectar a PostgreSQL:', error)
    return false
  }
}

// Función de validación de conexión para lazy initialization
export async function validateDatabaseConnection(): Promise<boolean> {
  try {
    const db = getDatabase()
    await db.selectFrom('usuario').limit(1).execute()
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}

// Función para cerrar el pool (llamar al cerrar la aplicación)
export async function closePool(): Promise<void> {
  try {
    const db = getDatabase()
    await db.destroy()
    console.log('✅ Pool de conexiones cerrado correctamente')
  } catch (error) {
    console.error('❌ Error al cerrar el pool de conexiones:', error)
  }
}

// Exportar pool para casos especiales donde se necesite acceso directo
export { pool }