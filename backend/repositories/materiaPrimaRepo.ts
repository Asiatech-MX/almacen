import Kysely, { sql } from 'kysely'
import { z } from 'zod'
import type { Database } from '../types/database'
import { getDatabase } from '../db/pool'
import { BaseRepository } from './base/BaseRepository'
import type {
  MateriaPrima,
  MateriaPrimaDetail,
  NewMateriaPrima,
  MateriaPrimaUpdate,
  MateriaPrimaFilters,
  StockCheck,
  LowStockItem,
  MateriaPrimaStats,
  StockMovementData,
  AuditoriaFilters,
  AuditTrail
} from '../../shared/types/materiaPrima'

/**
 * Esquemas de validación con Zod para garantizar la integridad de datos
 */
const CreateMateriaPrimaSchema = z.object({
  codigo_barras: z.string()
    .min(1, 'El código de barras es requerido')
    .max(50, 'El código de barras no puede exceder 50 caracteres')
    .regex(/^[A-Za-z0-9\-_]+$/, 'Solo se permiten letras, números, guiones y guiones bajos'),

  nombre: z.string()
    .min(1, 'El nombre es requerido')
    .max(255, 'El nombre no puede exceder 255 caracteres')
    .trim(),

  marca: z.string()
    .max(100, 'La marca no puede exceder 100 caracteres')
    .nullable()
    .optional(),

  modelo: z.string()
    .max(100, 'El modelo no puede exceder 100 caracteres')
    .nullable()
    .optional(),

  presentacion: z.string()
    .min(1, 'La presentación es requerida')
    .max(50, 'La presentación no puede exceder 50 caracteres')
    .trim(),

  stock_actual: z.number()
    .min(0, 'El stock actual no puede ser negativo')
    .optional(),

  stock_minimo: z.number()
    .min(0, 'El stock mínimo no puede ser negativo')
    .optional(),

  costo_unitario: z.number()
    .min(0, 'El costo unitario no puede ser negativo')
    .nullable()
    .optional(),

  fecha_caducidad: z.date()
    .nullable()
    .optional(),

  imagen_url: z.string()
    .url('URL de imagen inválida')
    .max(500, 'La URL de imagen no puede exceder 500 caracteres')
    .nullable()
    .optional(),

  descripcion: z.string()
    .max(1000, 'La descripción no puede exceder 1000 caracteres')
    .trim()
    .nullable()
    .optional(),

  categoria: z.string()
    .max(100, 'La categoría no puede exceder 100 caracteres')
    .trim()
    .nullable()
    .optional(),

  proveedor_id: z.string()
    .uuid('ID de proveedor inválido')
    .nullable()
    .optional()
})

const UpdateMateriaPrimaSchema = CreateMateriaPrimaSchema.partial()

/**
 * Repository para gestión de materia prima con Kysely
 * Proporciona operaciones CRUD completas con validaciones y auditoría
 */
export class MateriaPrimaRepository extends BaseRepository<'materia_prima'> {
  constructor(database?: Kysely<Database>) {
    super(database, 'materia_prima')
  }

  // ==================== CREATE OPERATIONS ====================

  /**
   * Crear un nuevo material de materia prima
   * @param data Datos del nuevo material
   * @param usuarioId ID del usuario que realiza la operación
   * @returns Material creado con información completa
   */
  async create(data: NewMateriaPrima, usuarioId?: string): Promise<MateriaPrimaDetail> {
    // Validación con Zod
    const validatedData = CreateMateriaPrimaSchema.parse(data)

    return await this.transaction(async (trx) => {
      // Verificar unicidad del código de barras
      const codigoExistente = await this.checkUniquenessInTransaction(
        trx,
        'codigo_barras',
        validatedData.codigo_barras
      )

      if (!codigoExistente) {
        throw new Error(`El código de barras ${validatedData.codigo_barras} ya existe`)
      }

      // Verificar que el proveedor exista si se proporciona
      if (validatedData.proveedor_id) {
        const proveedorExists = await trx
          .selectFrom('proveedores')
          .select('id')
          .where('id', '=', validatedData.proveedor_id)
          .where('activo', '=', true)
          .executeTakeFirst()

        if (!proveedorExists) {
          throw new Error('El proveedor especificado no existe o no está activo')
        }
      }

      // Insertar nuevo material
      const resultado = await trx
        .insertInto('materia_prima')
        .values({
          ...validatedData,
          stock_actual: validatedData.stock_actual || 0,
          stock_minimo: validatedData.stock_minimo || 0,
          activo: true,
          creado_en: new Date(),
          actualizado_en: new Date()
        })
        .returning([
          'id',
          'codigo_barras',
          'nombre',
          'marca',
          'modelo',
          'presentacion',
          'stock_actual',
          'stock_minimo',
          'costo_unitario',
          'fecha_caducidad',
          'imagen_url',
          'descripcion',
          'categoria',
          'proveedor_id',
          'creado_en',
          'actualizado_en'
        ])
        .executeTakeFirstOrThrow()

      // Obtener información completa con proveedor
      const resultadoCompleto = await this.getDetalleConProveedor(trx, resultado.id)

      // Registrar auditoría
      await this.registrarAuditoria(
        trx,
        resultado.id,
        'INSERT',
        null,
        validatedData,
        usuarioId
      )

      return resultadoCompleto
    })
  }

  // ==================== READ OPERATIONS ====================

  /**
   * Obtener todos los materiales con filtros opcionales
   * @param filters Filtros de búsqueda
   * @returns Lista de materiales
   */
  async findAll(filters?: MateriaPrimaFilters): Promise<MateriaPrima[]> {
    let query = this.getDatabase()
      .selectFrom('materia_prima as mp')
      .leftJoin('proveedores as p', 'mp.proveedor_id', 'p.id')
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
        'mp.actualizado_en'
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

    return await query.orderBy('mp.nombre').execute() as MateriaPrima[]
  }

  /**
   * Obtener material por ID con información completa
   * @param id UUID del material
   * @returns Material detallado o null si no existe
   */
  async findById(id: string): Promise<MateriaPrimaDetail | null> {
    return await this.getDetalleConProveedor(this.getDatabase(), id)
  }

  /**
   * Buscar material por código de barras
   * @param codigoBarras Código de barras único
   * @returns Material encontrado o null
   */
  async findByCodigoBarras(codigoBarras: string): Promise<MateriaPrimaDetail | null> {
    return await this.getDatabase()
      .selectFrom('materia_prima as mp')
      .leftJoin('proveedores as p', 'mp.proveedor_id', 'p.id')
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

  /**
   * Búsqueda de texto en múltiples campos
   * @param searchTerm Término de búsqueda
   * @param limit Límite de resultados
   * @return Lista de materiales que coinciden
   */
  async search(searchTerm: string, limit: number = 50): Promise<MateriaPrima[]> {
    const searchFields = [
      'nombre',
      'marca',
      'codigo_barras',
      'categoria',
      'presentacion'
    ] as const

    return await this.searchByText(
      searchFields,
      searchTerm,
      (query) => query
        .leftJoin('proveedores as p', 'materia_prima.proveedor_id', 'p.id')
        .select([
          'materia_prima.id',
          'materia_prima.codigo_barras',
          'materia_prima.nombre',
          'materia_prima.marca',
          'materia_prima.presentacion',
          'materia_prima.stock_actual',
          'materia_prima.stock_minimo',
          'materia_prima.categoria',
          'materia_prima.imagen_url',
          sql<string>`p.nombre`.as('proveedor_nombre')
        ])
        .limit(limit)
        .orderBy('materia_prima.nombre')
    ) as MateriaPrima[]
  }

  /**
   * Obtener materiales con stock bajo
   * @returns Lista de materiales que necesitan reabastecimiento
   */
  async getLowStockItems(): Promise<LowStockItem[]> {
    return await this.getDatabase()
      .selectFrom('materia_prima')
      .select([
        'id',
        'codigo_barras',
        'nombre',
        'marca',
        'presentacion',
        'stock_actual',
        'stock_minimo',
        'categoria'
      ])
      .where('activo', '=', true)
      .where(sql`stock_actual <= stock_minimo`, '=', true)
      .where('stock_minimo', '>', 0)
      .orderBy(sql`stock_actual / NULLIF(stock_minimo, 0)`, 'asc')
      .execute() as LowStockItem[]
  }

  // ==================== UPDATE OPERATIONS ====================

  /**
   * Actualizar material existente
   * @param id UUID del material
   * @param data Datos a actualizar
   * @param usuarioId ID del usuario que realiza la operación
   * @returns Material actualizado
   */
  async update(id: string, data: MateriaPrimaUpdate, usuarioId?: string): Promise<MateriaPrimaDetail> {
    // Validación con Zod
    const validatedData = UpdateMateriaPrimaSchema.parse(data)

    return await this.transaction(async (trx) => {
      // Obtener datos anteriores para auditoría
      const anterior = await trx
        .selectFrom('materia_prima')
        .selectAll()
        .where('id', '=', id)
        .where('activo', '=', true)
        .executeTakeFirst()

      if (!anterior) {
        throw new Error('Material no encontrado')
      }

      // Verificar unicidad del código de barras si se actualiza
      if (validatedData.codigo_barras && validatedData.codigo_barras !== anterior.codigo_barras) {
        const codigoUnico = await this.checkUniquenessInTransaction(
          trx,
          'codigo_barras',
          validatedData.codigo_barras,
          id
        )

        if (!codigoUnico) {
          throw new Error(`El código de barras ${validatedData.codigo_barras} ya existe`)
        }
      }

      // Verificar proveedor si se actualiza
      if (validatedData.proveedor_id && validatedData.proveedor_id !== anterior.proveedor_id) {
        const proveedorExists = await trx
          .selectFrom('proveedores')
          .select('id')
          .where('id', '=', validatedData.proveedor_id)
          .where('activo', '=', true)
          .executeTakeFirst()

        if (!proveedorExists) {
          throw new Error('El proveedor especificado no existe o no está activo')
        }
      }

      // Actualizar registro
      await trx
        .updateTable('materia_prima')
        .set({
          ...validatedData,
          actualizado_en: new Date()
        })
        .where('id', '=', id)
        .where('activo', '=', true)
        .execute()

      // Obtener información completa actualizada
      const resultado = await this.getDetalleConProveedor(trx, id)

      // Registrar auditoría
      await this.registrarAuditoria(
        trx,
        id,
        'UPDATE',
        anterior,
        validatedData,
        usuarioId
      )

      return resultado
    })
  }

  // ==================== DELETE OPERATIONS ====================

  /**
   * Eliminar material (soft delete)
   * @param id UUID del material
   * @param usuarioId ID del usuario que realiza la operación
   */
  async delete(id: string, usuarioId?: string): Promise<void> {
    await this.transaction(async (trx) => {
      const material = await trx
        .selectFrom('materia_prima')
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
        .updateTable('materia_prima')
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
        'DELETE',
        material,
        null,
        usuarioId
      )
    })
  }

  // ==================== STOCK MANAGEMENT ====================

  /**
   * Verificar disponibilidad de stock
   * @param id UUID del material
   * @param cantidad Cantidad a verificar
   * @returns Información de disponibilidad
   */
  async checkStock(id: string, cantidad: number): Promise<StockCheck> {
    if (cantidad <= 0) {
      throw new Error('La cantidad debe ser mayor a cero')
    }

    const result = await this.getDatabase()
      .selectFrom('materia_prima')
      .select([
        sql<boolean>`stock_actual >= ${cantidad}`.as('disponible'),
        'stock_actual',
        'stock_minimo'
      ])
      .where('id', '=', id)
      .where('activo', '=', true)
      .executeTakeFirst()

    if (!result) {
      throw new Error('Material no encontrado')
    }

    return result as StockCheck
  }

  /**
   * Actualizar stock de un material
   * @param id UUID del material
   * @param cantidad Cantidad a agregar (positiva) o restar (negativa)
   * @param motivo Motivo del movimiento
   * @param usuarioId ID del usuario que realiza la operación
   */
  async updateStock(id: string, cantidad: number, motivo: string, usuarioId?: string): Promise<void> {
    if (cantidad === 0) {
      throw new Error('La cantidad no puede ser cero')
    }

    if (!motivo || motivo.trim().length === 0) {
      throw new Error('El motivo es requerido')
    }

    await this.transaction(async (trx) => {
      // Bloquear registro para evitar concurrencia
      const actual = await trx
        .selectFrom('materia_prima')
        .select(['stock_actual'])
        .where('id', '=', id)
        .where('activo', '=', true)
        .forUpdate()
        .executeTakeFirst()

      if (!actual) {
        throw new Error('Material no encontrado')
      }

      const nuevoStock = actual.stock_actual + cantidad

      if (nuevoStock < 0) {
        throw new Error('Stock insuficiente para esta operación')
      }

      // Actualizar stock
      await trx
        .updateTable('materia_prima')
        .set({
          stock_actual: nuevoStock,
          actualizado_en: new Date()
        })
        .where('id', '=', id)
        .execute()

      // Registrar movimiento en auditoría
      await this.registrarAuditoria(
        trx,
        id,
        'STOCK_UPDATE',
        { stock_anterior: actual.stock_actual },
        { stock_nuevo: nuevoStock, cantidad, motivo },
        usuarioId
      )
    })
  }

  // ==================== ANALYTICS & REPORTING ====================

  /**
   * Obtener estadísticas generales de materia prima
   * @returns Estadísticas completas
   */
  async getStats(): Promise<MateriaPrimaStats> {
    const [
      total,
      bajoStock,
      sinStock,
      valorTotal,
      categorias
    ] = await Promise.all([
      // Total de materiales activos
      this.getDatabase()
        .selectFrom('materia_prima')
        .select(sql<number>`COUNT(*)`.as('count'))
        .where('activo', '=', true)
        .executeTakeFirst(),

      // Materiales con stock bajo
      this.getDatabase()
        .selectFrom('materia_prima')
        .select(sql<number>`COUNT(*)`.as('count'))
        .where('activo', '=', true)
        .where(sql`stock_actual <= stock_minimo`, '=', true)
        .where('stock_minimo', '>', 0)
        .executeTakeFirst(),

      // Materiales sin stock
      this.getDatabase()
        .selectFrom('materia_prima')
        .select(sql<number>`COUNT(*)`.as('count'))
        .where('activo', '=', true)
        .where('stock_actual', '=', 0)
        .executeTakeFirst(),

      // Valor total del inventario
      this.getDatabase()
        .selectFrom('materia_prima')
        .select(sql<number>`SUM(stock_actual * COALESCE(costo_unitario, 0))`.as('total'))
        .where('activo', '=', true)
        .executeTakeFirst(),

      // Estadísticas por categoría
      this.getDatabase()
        .selectFrom('materia_prima')
        .select(['categoria'])
        .select([
          sql<number>`COUNT(*)`.as('count'),
          sql<number>`SUM(stock_actual)`.as('total_stock'),
          sql<number>`SUM(stock_actual * COALESCE(costo_unitario, 0))`.as('valor_total')
        ])
        .where('activo', '=', true)
        .where('categoria', 'is not', null)
        .groupBy('categoria')
        .orderBy('count', 'desc')
        .execute()
    ])

    return {
      total: total?.count || 0,
      bajoStock: bajoStock?.count || 0,
      sinStock: sinStock?.count || 0,
      valorTotal: valorTotal?.total || 0,
      categorias: categorias.map(cat => ({
        categoria: cat.categoria || 'Sin categoría',
        count: cat.count || 0,
        total_stock: cat.total_stock || 0,
        valor_total: cat.valor_total || 0
      }))
    }
  }

  /**
   * Obtener trail de auditoría de un material
   * @param materiaPrimaId UUID del material
   * @param limit Límite de registros
   * @returns Historial de auditoría
   */
  async getAuditTrail(materiaPrimaId: string, limit: number = 50): Promise<AuditTrail[]> {
    return await this.getDatabase()
      .selectFrom('materia_prima_auditoria')
      .selectAll()
      .where('materia_prima_id', '=', materiaPrimaId)
      .orderBy('fecha', 'desc')
      .limit(limit)
      .execute() as AuditTrail[]
  }

  // ==================== HELPER METHODS ====================

  /**
   * Obtener detalle completo con información de proveedor
   * @param db Instancia de Kysely (puede ser transacción)
   * @param id UUID del material
   * @returns Detalle completo del material
   */
  private async getDetalleConProveedor(
    db: Kysely<Database> | Transaction<Database>,
    id: string
  ): Promise<MateriaPrimaDetail | null> {
    return await db
      .selectFrom('materia_prima as mp')
      .leftJoin('proveedores as p', 'mp.proveedor_id', 'p.id')
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

  /**
   * Verificar unicidad de campo en transacción
   * @param trx Transacción de Kysely
   * @param field Campo a verificar
   * @param value Valor a verificar
   * @param excludeId ID a excluir (para updates)
   * @returns true si es único, false si ya existe
   */
  private async checkUniquenessInTransaction(
    trx: Transaction<Database>,
    field: keyof Database['materia_prima'],
    value: any,
    excludeId?: string
  ): Promise<boolean> {
    let query = trx
      .selectFrom('materia_prima')
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
   * Registrar entrada en auditoría
   * @param trx Transacción de Kysely
   * @param materiaPrimaId UUID del material
   * @param accion Acción realizada
   * @param datosAnteriores Datos anteriores
   * @param datosNuevos Datos nuevos
   * @param usuarioId ID del usuario
   */
  private async registrarAuditoria(
    trx: Transaction<Database>,
    materiaPrimaId: string,
    accion: string,
    datosAnteriores?: any,
    datosNuevos?: any,
    usuarioId?: string
  ): Promise<void> {
    await trx
      .insertInto('materia_prima_auditoria')
      .values({
        materia_prima_id: materiaPrimaId,
        accion,
        datos_anteriores: datosAnteriores ? JSON.stringify(datosAnteriores) : null,
        datos_nuevos: datosNuevos ? JSON.stringify(datosNuevos) : null,
        usuario_id: usuarioId,
        fecha: new Date()
      })
      .execute()
  }
}

export default MateriaPrimaRepository