import type { Kysely } from 'kysely'
import { sql } from 'kysely'
import { z } from 'zod'
import type { Database } from '../types/database'
import { getDatabase } from '../db/pool'
import { BaseRepository } from './base/BaseRepository'
import { ProveedorMappingService } from '../services/proveedorMappingService'
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
  AuditTrail,
  MateriaPrimaEstatus,
  MateriaPrimaEstatusUpdate
} from '../../shared-types/src/index'
import {
  transformMateriaPrimaData,
  mapZodErrorToSpanish,
  transformFormDataForValidation
} from '../utils/dataTransform'

/**
 * Esquemas de validación con Zod para garantizar la integridad de datos
 */
const CreateMateriaPrimaSchema = z.object({
  codigo_barras: z.string()
    .min(13, 'El código de barras debe tener exactamente 13 dígitos')
    .max(13, 'El código de barras debe tener exactamente 13 dígitos')
    .regex(/^\d{13}$/, 'El código de barras debe contener solo números'),

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

  // Nuevos campos para soporte de IDs del frontend
  presentacion_id: z.union([z.string(), z.number()])
    .optional(),

  categoria: z.string()
    .max(100, 'La categoría no puede exceder 100 caracteres')
    .nullable()
    .optional(),

  categoria_id: z.union([z.string(), z.number()])
    .optional(),

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
    .optional()
    .or(z.string().transform((val) => {
      // Transformar strings a Date o null
      if (!val || val.trim() === '') return null
      const date = new Date(val)
      return isNaN(date.getTime()) ? null : date
    })),

  imagen_url: z.string()
    .max(500, 'La URL de imagen no puede exceder 500 caracteres')
    .nullable()
    .optional()
    .transform((val) => {
      // Transformar strings vacíos a null
      if (!val || val.trim() === '') return null
      // Validar URL si no está vacío
      try {
        new URL(val)
        return val.trim()
      } catch {
        throw new Error('URL de imagen inválida')
      }
    }),

  descripcion: z.string()
    .max(1000, 'La descripción no puede exceder 1000 caracteres')
    .trim()
    .nullable()
    .optional(),

  proveedor_id: z.union([
      z.string().uuid('ID de proveedor UUID inválido'),
      z.number().positive('ID de proveedor debe ser un número positivo')
    ])
    .nullable()
    .optional()
})

const UpdateMateriaPrimaSchema = CreateMateriaPrimaSchema.partial()

/**
 * Repository para gestión de materia prima con Kysely
 * Proporciona operaciones CRUD completas con validaciones y auditoría
 */
export class MateriaPrimaRepository extends BaseRepository<'materia_prima'> {
  private proveedorMapping: ProveedorMappingService

  constructor(database?: Kysely<Database>) {
    super(database, 'materia_prima')
    this.proveedorMapping = new ProveedorMappingService(database || getDatabase())
  }

  // ==================== CREATE OPERATIONS ====================

  /**
   * Crear un nuevo material de materia prima
   * @param data Datos del nuevo material
   * @param usuarioId ID del usuario que realiza la operación
   * @returns Material creado con información completa
   */
  async create(data: NewMateriaPrima, usuarioId?: string): Promise<MateriaPrimaDetail> {
    try {
      // 🔥 NUEVO: Transformar datos antes de validación
      const transformedData = transformMateriaPrimaData(data)

      // Validar con Zod schema mejorado
      const validatedData = CreateMateriaPrimaSchema.parse(transformedData)

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

      // Verificar que el proveedor exista si se proporciona (soporta UUID e INTEGER)
      if (validatedData.proveedor_id) {
        const proveedorValido = await this.proveedorMapping.validateProveedor(validatedData.proveedor_id)

        if (!proveedorValido || proveedorValido.estatus !== 'ACTIVO') {
          throw new Error('El proveedor especificado no existe o no está activo')
        }

        // Convertir a UUID para almacenamiento consistente
        validatedData.proveedor_id = await this.proveedorMapping.convertToUuid(validatedData.proveedor_id)
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
    } catch (error: any) {
      // 🔥 NUEVO: Enhanced error handling con traducción
      if (error instanceof z.ZodError) {
        // Mapear errores de Zod a español
        const mappedErrors = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: mapZodErrorToSpanish(issue)
        }))

        // Construir mensaje de error amigable
        const errorMessage = mappedErrors.map(err =>
          `${err.field}: ${err.message}`
        ).join('; ')

        throw new Error(`Error de validación: ${errorMessage}`)
      }

      // Re-lanzar otros errores
      throw error
    }
  }

  // ==================== READ OPERATIONS ====================

  /**
   * Obtener todos los materiales con filtros opcionales
   * @param filters Filtros de búsqueda
   * @param options Opciones adicionales de consulta
   * @returns Lista de materiales
   */
  async findAll(
    filters?: MateriaPrimaFilters,
    options?: { includeInactive?: boolean }
  ): Promise<MateriaPrima[]> {
    const includeInactive = options?.includeInactive ?? false

    let query = this.getDatabase()
      .selectFrom('materia_prima as mp')
      .select([
        'mp.id',
        'mp.codigo_barras',
        'mp.nombre',
        'mp.marca',
        'mp.modelo',
        'mp.presentacion',
        'mp.presentacion_id', // ✅ Add reference field
        'mp.stock_actual',
        'mp.stock_minimo',
        'mp.costo_unitario',
        'mp.fecha_caducidad',
        'mp.imagen_url',
        'mp.descripcion',
        'mp.categoria',
        'mp.categoria_id',   // ✅ Add reference field
        'mp.proveedor_id',
        sql<string>`CASE
          WHEN mp.activo = true THEN 'ACTIVO'
          ELSE 'INACTIVO'
        END`.as('estatus'),
        sql<string>`NULL`.as('proveedor_nombre'), // Temporal: NULL until provider schema is fixed
        'mp.creado_en',
        'mp.actualizado_en'
      ])

    // 🔥 NUEVO: Filtrar ACTIVO por defecto, excluir INACTIVO unless explicitly requested
    if (!includeInactive) {
      query = query.where('mp.activo', '=', true)
    }

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
   * Obtener solo materiales ACTIVOs (para consultas normales)
   * @param filters Filtros de búsqueda opcionales
   * @returns Lista de materiales ACTIVOs
   */
  async findActivos(filters?: MateriaPrimaFilters): Promise<MateriaPrima[]> {
    return this.findAll(filters, { includeInactive: false })
  }

  /**
   * Obtener solo materiales INACTIVOs (para módulo de gestión)
   * @param filters Filtros de búsqueda opcionales
   * @returns Lista de materiales INACTIVOs
   */
  async findInactivos(filters?: MateriaPrimaFilters): Promise<MateriaPrima[]> {
    const todos = await this.findAll(filters, { includeInactive: true })
    return todos.filter(m => m.estatus === 'INACTIVO')
  }

  /**
   * Obtener material por ID con información completa
   * @param id UUID del material
   * @param options Opciones para controlar el comportamiento de la consulta
   * @returns Material detallado o null si no existe
   */
  async findById(
    id: string,
    options?: { includeInactive?: boolean }
  ): Promise<MateriaPrimaDetail | null> {
    return await this.getDetalleConProveedor(this.getDatabase(), id, options)
  }

  /**
   * Buscar material por código de barras
   * @param codigoBarras Código de barras único
   * @returns Material encontrado o null
   */
  async findByCodigoBarras(codigoBarras: string): Promise<MateriaPrimaDetail | null> {
    return await this.getDatabase()
      .selectFrom('materia_prima as mp')
      .select([
        'mp.id',
        'mp.codigo_barras',
        'mp.nombre',
        'mp.marca',
        'mp.modelo',
        'mp.presentacion',
        'mp.presentacion_id', // ✅ Add reference field
        'mp.stock_actual',
        'mp.stock_minimo',
        'mp.costo_unitario',
        'mp.fecha_caducidad',
        'mp.imagen_url',
        'mp.descripcion',
        'mp.categoria',
        'mp.categoria_id',   // ✅ Add reference field
        'mp.proveedor_id',
        'p.nombre as proveedor_nombre',
        sql<string>`NULL`.as('proveedor_rfc'), // Temporarily NULL since no providers exist
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
        // .leftJoin('proveedor as p', 'p.id', 'materia_prima.proveedor_id') // Disabled: type mismatch (integer vs uuid)
        .select([
          'materia_prima.id',
          'materia_prima.codigo_barras',
          'materia_prima.nombre',
          'materia_prima.marca',
          'materia_prima.presentacion',
          'materia_prima.presentacion_id', // ✅ Add reference field
          'materia_prima.stock_actual',
          'materia_prima.stock_minimo',
          'materia_prima.categoria',
          'materia_prima.categoria_id',   // ✅ Add reference field
          'materia_prima.imagen_url',
          sql<string>`NULL`.as('proveedor_nombre') // Temporal: NULL until provider schema is fixed
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
        'presentacion_id', // ✅ Add reference field
        'stock_actual',
        'stock_minimo',
        'categoria',
        'categoria_id',   // ✅ Add reference field
        sql<number | null>`CASE
          WHEN stock_minimo > 0 THEN ROUND((stock_actual::numeric / stock_minimo::numeric), 2)
          ELSE NULL
        END`.as('stock_ratio')
      ])
      .where('activo', '=', true)
      .where(sql`stock_actual <= stock_minimo`)
      .where('stock_minimo', '>', 0)
      .orderBy('stock_ratio', 'asc')
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
    try {
      // 🔥 NUEVO: Transformar datos antes de validación
      const transformedData = transformMateriaPrimaData(data)

      // Validar con Zod schema mejorado
      const validatedData = UpdateMateriaPrimaSchema.parse(transformedData)

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

      // Verificar proveedor si se actualiza (soporta UUID e INTEGER)
      if (validatedData.proveedor_id && validatedData.proveedor_id !== anterior.proveedor_id) {
        const proveedorValido = await this.proveedorMapping.validateProveedor(validatedData.proveedor_id)

        if (!proveedorValido || proveedorValido.estatus !== 'ACTIVO') {
          throw new Error('El proveedor especificado no existe o no está activo')
        }

        // Convertir a UUID para almacenamiento consistente
        validatedData.proveedor_id = await this.proveedorMapping.convertToUuid(validatedData.proveedor_id)
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
    } catch (error: any) {
      // 🔥 NUEVO: Enhanced error handling con traducción
      if (error instanceof z.ZodError) {
        // Mapear errores de Zod a español
        const mappedErrors = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: mapZodErrorToSpanish(issue)
        }))

        // Construir mensaje de error amigable
        const errorMessage = mappedErrors.map(err =>
          `${err.field}: ${err.message}`
        ).join('; ')

        throw new Error(`Error de validación: ${errorMessage}`)
      }

      // Re-lanzar otros errores
      throw error
    }
  }

  /**
   * Actualizar el estatus de un material con validaciones de negocio completas
   * @param data Datos de actualización de estatus
   * @returns Material actualizado con información completa
   */
  async updateEstatus(data: MateriaPrimaEstatusUpdate): Promise<MateriaPrimaDetail> {
    const { id, estatus, usuarioId } = data

    // Validar que el estatus sea válido
    if (!['ACTIVO', 'INACTIVO'].includes(estatus)) {
      throw new Error('Estatus no válido. Debe ser ACTIVO o INACTIVO')
    }

    return await this.transaction(async (trx) => {
      // Obtener datos actuales del material con estatus calculado
      const actual = await trx
        .selectFrom('materia_prima')
        .selectAll()
        .select((eb) => [
          sql<boolean>`COALESCE(activo, false)`.as('activo_bool'),
          sql<string>`CASE
            WHEN activo = true THEN 'ACTIVO'
            ELSE 'INACTIVO'
          END`.as('estatus')
        ])
        .where('id', '=', id)
        .executeTakeFirst()

      if (!actual) {
        throw new Error('Material no encontrado')
      }

      const estatusActual = actual.estatus as MateriaPrimaEstatus
      const stockActual = Number(actual.stock_actual || 0)

      // Validar transiciones permitidas
      if (!this._validarTransicionEstatus(estatusActual, estatus, stockActual)) {
        throw new Error(this._obtenerMensajeErrorTransicion(estatusActual, estatus, stockActual))
      }

      // Verificar proveedor activo al activar material
      if (estatus === 'ACTIVO' && actual.proveedor_id) {
        const proveedorValido = await this.proveedorMapping.validateProveedor(actual.proveedor_id)
        if (!proveedorValido || proveedorValido.estatus !== 'ACTIVO') {
          throw new Error('No se puede activar el material porque el proveedor asociado no está activo')
        }
      }

      // Determinar valor del campo activo basado en el estatus
      const nuevoActivo = estatus === 'ACTIVO'

      // Actualizar el material
      await trx
        .updateTable('materia_prima')
        .set({
          activo: nuevoActivo,
          actualizado_en: new Date()
        })
        .where('id', '=', id)
        .execute()

      // Obtener información completa actualizada
      const resultado = await this.getDetalleConProveedor(trx, id)

      // Registrar auditoría del cambio de estatus
      await this.registrarAuditoria(
        trx,
        id,
        'STATUS_UPDATE',
        {
          estatus_anterior: estatusActual,
          activo_anterior: actual.activo,
          stock_actual: stockActual
        },
        {
          estatus_nuevo: estatus,
          activo_nuevo: nuevoActivo,
          usuario_id: usuarioId,
          motivo: `Cambio de estatus: ${estatusActual} → ${estatus}`
        },
        usuarioId
      )

      return resultado
    })
  }

  // ==================== DELETE OPERATIONS ====================

   /**
    * Eliminar material (hard delete - eliminación física)
    * @param id UUID del material
    * @param usuarioId ID del usuario que realiza la operación
    */
  async delete(id: string, usuarioId?: string): Promise<void> {
    await this.transaction(async (trx) => {
      const material = await trx
        .selectFrom('materia_prima')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst()

      if (!material) {
        throw new Error('Material no encontrado')
      }

      // Verificar que el material esté INACTIVO (defensive programming)
      if (material.activo !== false) {
        throw new Error('Solo se pueden eliminar materiales con estatus "Inhabilitado". El material debe estar marcado como inhabilitado antes de poder eliminarlo.')
      }

      // Verificar que no tenga stock pendiente
      if (material.stock_actual > 0) {
        throw new Error('No se puede eliminar un material con stock disponible')
      }

      // Realizar hard delete (eliminación física)
      await trx
        .deleteFrom('materia_prima')
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
   * @param options Opciones para controlar el comportamiento de la consulta
   * @returns Detalle completo del material
   */
  private async getDetalleConProveedor(
    db: Kysely<Database> | Transaction<Database>,
    id: string,
    options?: { includeInactive?: boolean }
  ): Promise<MateriaPrimaDetail | null> {
    const includeInactive = options?.includeInactive ?? false

    let query = db
      .selectFrom('materia_prima as mp')
      // .leftJoin('proveedor as p', 'p.id', 'mp.proveedor_id') // Disabled: type mismatch (integer vs uuid)
      .select([
        'mp.id',
        'mp.codigo_barras',
        'mp.nombre',
        'mp.marca',
        'mp.modelo',
        'mp.presentacion',
        'mp.presentacion_id', // ✅ Add reference field
        'mp.stock_actual',
        'mp.stock_minimo',
        'mp.costo_unitario',
        'mp.fecha_caducidad',
        'mp.imagen_url',
        'mp.descripcion',
        'mp.categoria',
        'mp.categoria_id',   // ✅ Add reference field
        'mp.proveedor_id',
        sql<string>`NULL`.as('proveedor_nombre'), // Temporal: NULL until provider schema is fixed
        sql<string>`NULL`.as('proveedor_rfc'), // Temporal: NULL until provider schema is fixed
        sql<number>`NULL`.as('proveedor_id_legacy'), // Temporal: NULL until provider schema is fixed
        sql<string>`CASE
          WHEN mp.activo = true THEN 'ACTIVO'
          ELSE 'INACTIVO'
        END`.as('estatus'),
        'mp.creado_en',
        'mp.actualizado_en'
      ])

    query = query.where('mp.id', '=', id)

    // Apply active filter unless inactive materials should be included
    if (!includeInactive) {
      query = query.where('mp.activo', '=', true)
    }

    return await query.executeTakeFirst() as MateriaPrimaDetail | null
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
   * Validar que la transición de estatus sea permitida según las reglas de negocio
   * @param estatusActual Estatus actual del material
   * @param nuevoEstatus Nuevo estatus deseado
   * @param stockActual Stock actual del material
   * @returns true si la transición es válida, false si no
   */
  private _validarTransicionEstatus(
    estatusActual: MateriaPrimaEstatus,
    nuevoEstatus: MateriaPrimaEstatus,
    stockActual: number
  ): boolean {
    // Si no hay cambio, no permitir
    if (estatusActual === nuevoEstatus) {
      return false
    }

    // Reglas de transición permitidas
    switch (estatusActual) {
      case 'ACTIVO':
        // ACTIVO puede pasar a INACTIVO
        return nuevoEstatus === 'INACTIVO'

      case 'INACTIVO':
        // INACTIVO puede pasar a ACTIVO
        return nuevoEstatus === 'ACTIVO'

      default:
        return false
    }
  }

  /**
   * Generar mensaje de error específico para la transición no permitida
   * @param estatusActual Estatus actual del material
   * @param nuevoEstatus Nuevo estatus deseado
   * @param stockActual Stock actual del material
   * @returns Mensaje de error descriptivo
   */
  private _obtenerMensajeErrorTransicion(
    estatusActual: MateriaPrimaEstatus,
    nuevoEstatus: MateriaPrimaEstatus,
    stockActual: number
  ): string {
    if (estatusActual === nuevoEstatus) {
      return `El material ya tiene el estatus ${estatusActual}`
    }

    const stockInfo = stockActual > 0
      ? ` (stock actual: ${stockActual})`
      : ' (sin stock)'

    switch (estatusActual) {
      case 'ACTIVO':
        return `No se puede cambiar de ACTIVO a ${nuevoEstatus}`

      case 'INACTIVO':
        return `No se puede cambiar de INACTIVO a ${nuevoEstatus}`

      default:
        return `Transición no permitida: ${estatusActual} → ${nuevoEstatus}`
    }
  }

  /**
   * Validar si un string tiene formato UUID válido
   * @param uuid String a validar
   * @returns true si es UUID válido, false en caso contrario
   */
  private isValidUuid(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  /**
   * Manejar conversión de usuarioId para registros de auditoría
   * Convierte IDs legacy a null para prevenir errores de UUID
   * @param usuarioId ID del usuario a validar
   * @returns UUID válido o null
   */
  private handleUsuarioIdForAudit(usuarioId?: string): string | null {
    // Si no hay usuarioId, usar null
    if (!usuarioId) {
      return null
    }

    // Si ya es un UUID válido, usarlo
    if (this.isValidUuid(usuarioId)) {
      return usuarioId
    }

    // Si es un ID legacy (como '1', '2', etc.), convertir a null
    // Esto previene errores de validación UUID
    console.warn(`⚠️ Legacy usuarioId detectado: ${usuarioId}. Convirtiendo a null para registro de auditoría.`)
    return null
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
    // Manejar conversión de usuarioId para prevenir errores de UUID
    const validUsuarioId = this.handleUsuarioIdForAudit(usuarioId)

    await trx
      .insertInto('materia_prima_auditoria')
      .values({
        materia_prima_id: materiaPrimaId,
        materia_prima_legacy_id: -1, // Use -1 for UUID-based materials without legacy ID
        accion,
        datos_anteriores: datosAnteriores ? JSON.stringify(datosAnteriores) : null,
        datos_nuevos: datosNuevos ? JSON.stringify(datosNuevos) : null,
        usuario_id: validUsuarioId, // Ahora siempre null o UUID válido
        fecha: new Date()
      })
      .execute()
  }
}

export default MateriaPrimaRepository