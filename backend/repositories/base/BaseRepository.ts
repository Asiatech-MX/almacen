import Kysely, { Transaction, sql } from 'kysely'
import type { Database } from '../../types/database'
import type { SelectQueryBuilder } from 'kysely'
import { getDatabase } from '../../db/pool'

/**
 * Repository base con funcionalidades comunes para todos los repositorios
 * Utiliza patrones modernos de Kysely con TypeScript y lazy initialization
 */
export abstract class BaseRepository<T extends keyof Database> {
  constructor(
    protected db?: Kysely<Database>,
    protected tableName?: T
  ) {}

  /**
   * Obtener instancia de base de datos con lazy initialization
   */
  protected getDatabase(): Kysely<Database> {
    if (!this.db) {
      this.db = getDatabase()
    }
    if (!this.tableName) {
      throw new Error('Table name is required')
    }
    return this.db
  }

  /**
   * Ejecuta una función dentro de una transacción
   */
  protected async transaction<R>(callback: (trx: Transaction<Database>) => Promise<R>): Promise<R> {
    return await this.getDatabase().transaction().execute(callback)
  }

  /**
   * Soft delete genérico - marca como eliminado en lugar de borrar físicamente
   */
  protected async softDelete(id: string): Promise<void> {
    await this.getDatabase()
      .updateTable(this.tableName!)
      .set({
        eliminado_en: new Date(),
        actualizado_en: new Date()
      } as any)
      .where('id', '=', id)
      .execute()
  }

  /**
   * Hard delete genérico con validaciones
   */
  protected async hardDelete(id: string): Promise<void> {
    await this.getDatabase()
      .deleteFrom(this.tableName!)
      .where('id', '=', id)
      .execute()
  }

  /**
   * Restaurar un registro eliminado (soft delete)
   */
  protected async restore(id: string): Promise<void> {
    await this.getDatabase()
      .updateTable(this.tableName!)
      .set({
        eliminado_en: null,
        actualizado_en: new Date()
      } as any)
      .where('id', '=', id)
      .execute()
  }

  /**
   * Verificar si un registro existe y está activo
   */
  protected async existsActive(id: string): Promise<boolean> {
    const result = await this.getDatabase()
      .selectFrom(this.tableName!)
      .select('id')
      .where('id', '=', id)
      .where('activo', '=', true)
      .executeTakeFirst()

    return !!result
  }

  /**
   * Contar registros activos con filtros opcionales
   */
  protected async countActive(filters?: Record<string, any>): Promise<number> {
    let query = this.getDatabase()
      .selectFrom(this.tableName!)
      .select(sql<number>`COUNT(*)`.as('count'))
      .where('activo', '=', true)

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            query = query.where(key as any, 'in', value)
          } else {
            query = query.where(key as any, '=', value)
          }
        }
      })
    }

    const result = await query.executeTakeFirst()
    return result?.count || 0
  }

  /**
   * Paginación genérica
   */
  protected async paginate<R extends keyof Database>(
    selectQuery: SelectQueryBuilder<Database, Database[R], never[]>,
    page: number,
    limit: number
  ) {
    const offset = (page - 1) * limit

    const [data, totalCount] = await Promise.all([
      selectQuery.limit(limit).offset(offset).execute(),
      selectQuery.clearSelect().clearOrderBy().select(sql<number>`COUNT(*)`.as('count')).executeTakeFirst()
    ])

    const total = totalCount?.count || 0
    const totalPages = Math.ceil(total / limit)

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  }

  /**
   * Buscar por texto en múltiples campos (búsqueda genérica)
   */
  protected async searchByText(
    fields: (keyof Database[T])[],
    searchTerm: string,
    additionalConditions?: (qb: any) => any
  ) {
    let query = this.getDatabase()
      .selectFrom(this.tableName!)
      .selectAll()

    // Aplicar condiciones de búsqueda de texto
    if (searchTerm) {
      query = query.where((eb) =>
        eb.or(
          fields.map(field =>
            eb(field as any, 'ilike', `%${searchTerm}%`)
          )
        )
      )
    }

    // Aplicar condiciones adicionales
    if (additionalConditions) {
      query = additionalConditions(query)
    }

    return await query.execute()
  }

  /**
   * Obtener por UUID con validación
   */
  protected async findById(id: string): Promise<Database[T] | null> {
    if (!this.isValidUUID(id)) {
      throw new Error(`ID inválido: ${id}`)
    }

    return await this.getDatabase()
      .selectFrom(this.tableName!)
      .selectAll()
      .where('id', '=', id)
      .where('activo', '=', true)
      .executeTakeFirst() || null
  }

  /**
   * Validar formato UUID
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  /**
   * Actualizar timestamp de actualización
   */
  protected async touch(id: string): Promise<void> {
    await this.getDatabase()
      .updateTable(this.tableName!)
      .set({ actualizado_en: new Date() } as any)
      .where('id', '=', id)
      .execute()
  }

  /**
   * Obtener registros modificados recientemente
   */
  protected async getRecentlyModified(
    hours: number = 24,
    limit: number = 50
  ): Promise<Database[T][]> {
    return await this.getDatabase()
      .selectFrom(this.tableName!)
      .selectAll()
      .where('activo', '=', true)
      .where('actualizado_en', '>=', sql`CURRENT_TIMESTAMP - INTERVAL '${hours} hours'`)
      .orderBy('actualizado_en', 'desc')
      .limit(limit)
      .execute()
  }

  /**
   * Bloquear registro para actualización (FOR UPDATE)
   */
  protected async lockForUpdate(id: string): Promise<Database[T] | null> {
    return await this.getDatabase()
      .selectFrom(this.tableName!)
      .selectAll()
      .where('id', '=', id)
      .where('activo', '=', true)
      .forUpdate()
      .executeTakeFirst() || null
  }

  /**
   * Verificar unicidad de un campo (excepto para el registro actual)
   */
  protected async checkUniqueness(
    field: keyof Database[T],
    value: any,
    excludeId?: string
  ): Promise<boolean> {
    let query = this.getDatabase()
      .selectFrom(this.tableName!)
      .select('id')
      .where(field as any, '=', value)
      .where('activo', '=', true)

    if (excludeId) {
      query = query.where('id', '!=', excludeId)
    }

    const existing = await query.executeTakeFirst()
    return !existing
  }

  /**
   * Insert con retornos específicos
   */
  protected async insertAndSelect<R>(
    data: Partial<Database[T]>,
    selectFields: (keyof Database[T])[]
  ): Promise<R> {
    const result = await this.getDatabase()
      .insertInto(this.tableName!)
      .values(data as any)
      .returning(selectFields as any[])
      .executeTakeFirstOrThrow()

    return result as R
  }

  /**
   * Bulk insert con validación
   */
  protected async bulkInsert(data: Partial<Database[T]>[]): Promise<void> {
    if (!data || data.length === 0) {
      return
    }

    await this.transaction(async (trx) => {
      for (const item of data) {
        await trx.insertInto(this.tableName!).values(item as any).execute()
      }
    })
  }

  /**
   * Obtener estadísticas básicas de la tabla
   */
  protected async getTableStats(): Promise<{
    total: number
    activos: number
    inactivos: number
    eliminados: number
    creadosHoy: number
    actualizadosHoy: number
  }> {
    const [total, activos, eliminados, creadosHoy, actualizadosHoy] = await Promise.all([
      this.getDatabase().selectFrom(this.tableName!).select(sql<number>`COUNT(*)`.as('count')).executeTakeFirst(),
      this.getDatabase().selectFrom(this.tableName!).select(sql<number>`COUNT(*)`.as('count')).where('activo', '=', true).executeTakeFirst(),
      this.getDatabase().selectFrom(this.tableName!).select(sql<number>`COUNT(*)`.as('count')).where('eliminado_en', 'is not', null).executeTakeFirst(),
      this.getDatabase().selectFrom(this.tableName!).select(sql<number>`COUNT(*)`.as('count')).where(sql`DATE(creado_en)`, '=', sql`CURRENT_DATE`).executeTakeFirst(),
      this.getDatabase().selectFrom(this.tableName!).select(sql<number>`COUNT(*)`.as('count')).where(sql`DATE(actualizado_en)`, '=', sql`CURRENT_DATE`).executeTakeFirst()
    ])

    return {
      total: total?.count || 0,
      activos: activos?.count || 0,
      inactivos: (total?.count || 0) - (activos?.count || 0) - (eliminados?.count || 0),
      eliminados: eliminados?.count || 0,
      creadosHoy: creadosHoy?.count || 0,
      actualizadosHoy: actualizadosHoy?.count || 0
    }
  }
}