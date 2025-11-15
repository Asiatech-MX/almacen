import Kysely, { sql } from 'kysely'
import type { Database } from '../types/database'
import { getDatabase } from '../db/pool'
import { BaseRepository } from './base/BaseRepository'
import { MigrationFlagService, type MigrationFlags } from '../../apps/electron-main/src/services/migrationFlags'
import type {
  MateriaPrima,
  MateriaPrimaDetail,
  NewMateriaPrima,
  MateriaPrimaUpdate,
  MateriaPrimaFilters,
  StockCheck,
  LowStockItem,
  MateriaPrimaStats,
  AuditoriaFilters,
  AuditTrail
} from '../../shared/types/materiaPrima'

/**
 * Repository para gestión de materia prima con Feature Flags
 * Soporta transición controlada entre tabla legacy y tabla migrada
 */
export class MateriaPrimaRepositoryWithMigration extends BaseRepository<'materia_prima'> {
  private migrationFlags: MigrationFlagService

  constructor(database?: Kysely<Database>) {
    super(database, 'materia_prima')
    this.migrationFlags = MigrationFlagService.getInstance()
  }

  // ==================== FEATURE FLAGS HELPERS ====================

  private async getTableName(operation: 'read' | 'write'): Promise<string> {
    const flags = await this.migrationFlags.getFlags()

    if (flags.EMERGENCY_ROLLBACK) {
      console.log('🚨 Emergency rollback active - using legacy table')
      return 'materia_prima'
    }

    if (operation === 'read') {
      return flags.USE_MIGRATED_TABLE_READS ? 'materia_prima_migration' : 'materia_prima'
    } else {
      return flags.USE_MIGRATED_TABLE_WRITES ? 'materia_prima_migration' : 'materia_prima'
    }
  }

  private async logConsistenciaValidada(
    codigoBarras: string,
    legacyData: any,
    migratedData: any
  ): Promise<void> {
    if (await this.migrationFlags.isValidationEnabled()) {
      const isConsistent = JSON.stringify(legacyData) === JSON.stringify(migratedData)

      if (!isConsistent) {
        console.warn(`⚠️ Inconsistencia detectada para ${codigoBarras}:`, {
          legacy: legacyData,
          migrated: migratedData
        })
      } else {
        console.log(`✅ Consistencia validada para ${codigoBarras}`)
      }
    }
  }

  // ==================== CREATE OPERATIONS ====================

  async create(data: NewMateriaPrima, usuarioId?: string): Promise<MateriaPrimaDetail> {
    const tableName = await this.getTableName('write')
    const db = this.getDatabase()

    console.log(`📝 Creando material en tabla: ${tableName}`)

    // Validación de datos
    if (!data.codigo_barras || !data.nombre || !data.presentacion) {
      throw new Error('Código de barras, nombre y presentación son requeridos')
    }

    return await this.transaction(async (trx) => {
      // Verificar unicidad en ambas tablas para evitar duplicados
      const existingLegacy = await trx
        .selectFrom('materia_prima')
        .select('codigo_barras')
        .where('codigo_barras', '=', data.codigo_barras)
        .where('activo', '=', true)
        .executeTakeFirst()

      const existingMigrated = await trx
        .selectFrom('materia_prima_migration')
        .select('codigo_barras')
        .where('codigo_barras', '=', data.codigo_barras)
        .where('activo', '=', true)
        .executeTakeFirst()

      if (existingLegacy || existingMigrated) {
        throw new Error(`El código de barras ${data.codigo_barras} ya existe`)
      }

      // Verificar proveedor si se proporciona
      if (data.proveedor_id) {
        const proveedorExists = await trx
          .selectFrom('proveedor')
          .select('id')
          .where('id', '=', data.proveedor_id)
          .where('activo', '=', true)
          .executeTakeFirst()

        if (!proveedorExists) {
          throw new Error('El proveedor especificado no existe o no está activo')
        }
      }

      // Insertar en la tabla correspondiente
      const insertData = {
        ...data,
        stock_actual: data.stock_actual || 0,
        stock_minimo: data.stock_minimo || 0,
        activo: true,
        creado_en: new Date(),
        actualizado_en: new Date()
      }

      let resultado: any
      let materiaPrimaId: string

      if (tableName === 'materia_prima_migration') {
        // Usar UUID para tabla migrada
        materiaPrimaId = crypto.randomUUID()
        resultado = await trx
          .insertInto('materia_prima_migration')
          .values({
            id: materiaPrimaId,
            ...insertData
          })
          .returning(['id', 'codigo_barras', 'nombre', 'marca', 'modelo', 'presentacion'])
          .executeTakeFirstOrThrow()
      } else {
        // Usar SERIAL para tabla legacy
        resultado = await trx
          .insertInto('materia_prima')
          .values(insertData)
          .returning(['id', 'codigo_barras', 'nombre', 'marca', 'modelo', 'presentacion'])
          .executeTakeFirstOrThrow()
        materiaPrimaId = resultado.id.toString()
      }

      // Obtener información completa con proveedor
      const resultadoCompleto = await this.getDetalleConProveedor(
        trx,
        materiaPrimaId,
        tableName
      )

      // Registrar auditoría
      await this.registrarAuditoria(
        trx,
        materiaPrimaId,
        tableName,
        'INSERT',
        null,
        insertData,
        usuarioId
      )

      console.log(`✅ Material creado exitosamente en ${tableName}:`, resultado.codigo_barras)
      return resultadoCompleto
    })
  }

  // ==================== READ OPERATIONS ====================

  async findAll(filters?: MateriaPrimaFilters): Promise<MateriaPrima[]> {
    const tableName = await this.getTableName('read')
    const db = this.getDatabase()

    console.log(`📋 Listando materiales desde tabla: ${tableName}`)

    let query = db
      .selectFrom(`${tableName} as mp`)
      .leftJoin('proveedor as p', 'mp.proveedor_id', 'p.id')
      .select([
        'mp.id',
        'mp.codigo_barras',
        'mp.nombre',
        'mp.marca',
        'mp.modelo',
        'mp.presentacion',
        'mp.stock_actual',
        'mp.stock_minimo',
        'mp.costo_unitario',
        'mp.fecha_caducidad',
        'mp.imagen_url',
        'mp.descripcion',
        'mp.categoria',
        'mp.proveedor_id',
        sql<string>`p.nombre`.as('proveedor_nombre'),
        'mp.creado_en',
        'mp.actualizado_en',
        sql<string>`'${tableName}'`.as('source_table')
      ])
      .where('mp.activo', '=', true)

    // Aplicar filtros dinámicamente
    if (filters) {
      if (filters.nombre) {
        query = query.where('mp.nombre', 'ilike', `%${filters.nombre}%`)
      }

      if (filters.codigoBarras) {
        query = query.where('mp.codigo_barras', '=', filters.codigoBarras)
      }

      if (filters.categoria) {
        query = query.where('mp.categoria', '=', filters.categoria)
      }

      if (filters.proveedorId) {
        query = query.where('mp.proveedor_id', '=', filters.proveedorId)
      }

      if (filters.bajoStock) {
        query = query.where(sql`mp.stock_actual <= mp.stock_minimo`, '=', true)
      }

      if (filters.sinStock) {
        query = query.where('mp.stock_actual', '=', 0)
      }
    }

    const results = await query.orderBy('mp.nombre').execute() as MateriaPrima[]

    // Validación cruzada si está habilitada
    if (await this.migrationFlags.isValidationEnabled()) {
      await this.validarConsistenciaCruzada(results)
    }

    return results
  }

  async findById(id: string): Promise<MateriaPrimaDetail | null> {
    const tableName = await this.getTableName('read')
    return await this.getDetalleConProveedor(this.getDatabase(), id, tableName)
  }

  async findByCodigoBarras(codigoBarras: string): Promise<MateriaPrimaDetail | null> {
    const tableName = await this.getTableName('read')
    const db = this.getDatabase()

    return await db
      .selectFrom(`${tableName} as mp`)
      .leftJoin('proveedor as p', 'mp.proveedor_id', 'p.id')
      .select([
        'mp.id',
        'mp.codigo_barras',
        'mp.nombre',
        'mp.marca',
        'mp.modelo',
        'mp.presentacion',
        'mp.stock_actual',
        'mp.stock_minimo',
        'mp.costo_unitario',
        'mp.fecha_caducidad',
        'mp.imagen_url',
        'mp.descripcion',
        'mp.categoria',
        'mp.proveedor_id',
        sql<string>`p.nombre`.as('proveedor_nombre'),
        sql<string>`p.rfc`.as('proveedor_rfc'),
        'mp.creado_en',
        'mp.actualizado_en'
      ])
      .where('mp.codigo_barras', '=', codigoBarras)
      .where('mp.activo', '=', true)
      .executeTakeFirst() as MateriaPrimaDetail | null
  }

  // ==================== UPDATE OPERATIONS ====================

  async update(id: string, data: MateriaPrimaUpdate, usuarioId?: string): Promise<MateriaPrimaDetail> {
    const tableName = await this.getTableName('write')
    console.log(`🔄 Actualizando material en tabla: ${tableName}`)

    return await this.transaction(async (trx) => {
      // Obtener datos anteriores
      const anterior = await trx
        .selectFrom(`${tableName} as mp`)
        .selectAll()
        .where('mp.id', '=', id)
        .where('mp.activo', '=', true)
        .executeTakeFirst()

      if (!anterior) {
        throw new Error('Material no encontrado')
      }

      // Verificar unicidad del código de barras si se actualiza
      if (data.codigo_barras && data.codigo_barras !== anterior.codigo_barras) {
        const existingLegacy = await trx
          .selectFrom('materia_prima')
          .select('codigo_barras')
          .where('codigo_barras', '=', data.codigo_barras)
          .where('activo', '=', true)
          .where('id', '!=', id)
          .executeTakeFirst()

        const existingMigrated = await trx
          .selectFrom('materia_prima_migration')
          .select('codigo_barras')
          .where('codigo_barras', '=', data.codigo_barras)
          .where('activo', '=', true)
          .where('id', '!=', id)
          .executeTakeFirst()

        if (existingLegacy || existingMigrated) {
          throw new Error(`El código de barras ${data.codigo_barras} ya existe`)
        }
      }

      // Actualizar registro
      await trx
        .updateTable(tableName)
        .set({
          ...data,
          actualizado_en: new Date()
        })
        .where('id', '=', id)
        .where('activo', '=', true)
        .execute()

      // Obtener información completa actualizada
      const resultado = await this.getDetalleConProveedor(trx, id, tableName)

      // Registrar auditoría
      await this.registrarAuditoria(
        trx,
        id,
        tableName,
        'UPDATE',
        anterior,
        data,
        usuarioId
      )

      console.log(`✅ Material actualizado exitosamente en ${tableName}`)
      return resultado
    })
  }

  // ==================== DELETE OPERATIONS ====================

  async delete(id: string, usuarioId?: string): Promise<void> {
    const tableName = await this.getTableName('write')
    console.log(`🗑️ Eliminando material en tabla: ${tableName}`)

    await this.transaction(async (trx) => {
      const material = await trx
        .selectFrom(tableName)
        .selectAll()
        .where('id', '=', id)
        .where('activo', '=', true)
        .executeTakeFirst()

      if (!material) {
        throw new Error('Material no encontrado')
      }

      // Verificar que no tenga stock pendiente
      if (material.stock_actual > 0) {
        throw new Error('No se puede eliminar un material con stock disponible')
      }

      // Realizar soft delete
      await trx
        .updateTable(tableName)
        .set({
          activo: false,
          eliminado_en: new Date(),
          actualizado_en: new Date()
        })
        .where('id', '=', id)
        .execute()

      // Registrar auditoría
      await this.registrarAuditoria(
        trx,
        id,
        tableName,
        'DELETE',
        material,
        null,
        usuarioId
      )

      console.log(`✅ Material eliminado exitosamente en ${tableName}`)
    })
  }

  // ==================== VALIDATION METHODS ====================

  private async validarConsistenciaCruzada(results: MateriaPrima[]): Promise<void> {
    const isValidationEnabled = await this.migrationFlags.isValidationEnabled()
    if (!isValidationEnabled) return

    for (const item of results) {
      try {
        const [legacy, migrated] = await Promise.all([
          this.getDatabase()
            .selectFrom('materia_prima')
            .select(['id', 'codigo_barras', 'nombre', 'stock_actual', 'actualizado_en'])
            .where('codigo_barras', '=', item.codigo_barras)
            .where('activo', '=', true)
            .executeTakeFirst(),

          this.getDatabase()
            .selectFrom('materia_prima_migration')
            .select(['id', 'codigo_barras', 'nombre', 'stock_actual', 'actualizado_en'])
            .where('codigo_barras', '=', item.codigo_barras)
            .where('activo', '=', true)
            .executeTakeFirst()
        ])

        if (legacy && migrated) {
          await this.logConsistenciaValidada(item.codigo_barras, legacy, migrated)
        }
      } catch (error) {
        console.warn(`⚠️ Error validando consistencia para ${item.codigo_barras}:`, error)
      }
    }
  }

  // ==================== HELPER METHODS ====================

  private async getDetalleConProveedor(
    db: Kysely<Database> | any, // Permitir transacción
    id: string,
    tableName: string
  ): Promise<MateriaPrimaDetail | null> {
    return await db
      .selectFrom(`${tableName} as mp`)
      .leftJoin('proveedor as p', 'mp.proveedor_id', 'p.id')
      .select([
        'mp.id',
        'mp.codigo_barras',
        'mp.nombre',
        'mp.marca',
        'mp.modelo',
        'mp.presentacion',
        'mp.stock_actual',
        'mp.stock_minimo',
        'mp.costo_unitario',
        'mp.fecha_caducidad',
        'mp.imagen_url',
        'mp.descripcion',
        'mp.categoria',
        'mp.proveedor_id',
        sql<string>`p.nombre`.as('proveedor_nombre'),
        sql<string>`p.rfc`.as('proveedor_rfc'),
        'mp.creado_en',
        'mp.actualizado_en'
      ])
      .where('mp.id', '=', id)
      .where('mp.activo', '=', true)
      .executeTakeFirst() as MateriaPrimaDetail | null
  }

  private async registrarAuditoria(
    trx: any, // Transaction de Kysely
    materiaPrimaId: string,
    tableName: string,
    accion: string,
    datosAnteriores?: any,
    datosNuevos?: any,
    usuarioId?: string
  ): Promise<void> {
    try {
      // Usar la columna correcta según la tabla
      const legacyId = tableName === 'materia_prima' ? materiaPrimaId : null
      const uuidId = tableName === 'materia_prima_migration' ? materiaPrimaId : null

      await trx
        .insertInto('materia_prima_auditoria')
        .values({
          materia_prima_legacy_id: legacyId,
          materia_prima_id: uuidId,
          accion,
          datos_anteriores: datosAnteriores ? JSON.stringify(datosAnteriores) : null,
          datos_nuevos: datosNuevos ? JSON.stringify(datosNuevos) : null,
          usuario_id: usuarioId,
          fecha: new Date()
        })
        .execute()
    } catch (error) {
      console.error('❌ Error registrando auditoría:', error)
      // No lanzar el error para no interrumpir la operación principal
    }
  }

  // Método para emergencia: forzar rollback
  async emergencyRollback(): Promise<void> {
    console.log('🚨 Iniciando rollback de emergencia...')
    await this.migrationFlags.emergencyRollback()
  }

  // Método para obtener estado actual de migración
  async getMigrationStatus(): Promise<MigrationFlags> {
    return await this.migrationFlags.getFlags()
  }
}

export default MateriaPrimaRepositoryWithMigration