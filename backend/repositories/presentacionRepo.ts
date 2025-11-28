import type { Kysely, Transaction } from 'kysely'
import { sql } from 'kysely'
import { z } from 'zod'
import type { Database } from '../../types/database'
import { getDatabase } from '../../db/pool'
import { BaseRepository } from './base/BaseRepository'
import type {
  Presentacion,
  NewPresentacion,
  PresentacionUpdate
} from '../../shared-types/src/referenceData'

/**
 * Esquemas de validación con Zod para garantizar la integridad de datos
 */
const CreatePresentacionSchema = z.object({
  nombre: z.string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),

  descripcion: z.string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .nullable()
    .optional(),

  abreviatura: z.string()
    .max(20, 'La abreviatura no puede exceder 20 caracteres')
    .nullable()
    .optional(),

  unidad_base: z.string()
    .max(20, 'La unidad base no puede exceder 20 caracteres')
    .nullable()
    .optional(),

  factor_conversion: z.number()
    .positive('El factor de conversión debe ser positivo')
    .nullable()
    .optional(),

  id_institucion: z.number()
    .positive('La institución es requerida')
})

const UpdatePresentacionSchema = CreatePresentacionSchema.partial()

/**
 * Repository para gestión de presentaciones con CRUD básico
 * Proporciona operaciones CRUD completas con validaciones y auditoría
 */
export class PresentacionRepository extends BaseRepository<'presentacion'> {
  constructor(database?: Kysely<Database>) {
    super(database, 'presentacion')
  }

  // ==================== CREATE OPERATIONS ====================

  /**
   * Crear una nueva presentación
   * @param data Datos de la nueva presentación
   * @param usuarioId ID del usuario que realiza la operación
   * @returns Presentación creada con información completa
   */
  async crear(data: NewPresentacion, usuarioId?: string): Promise<Presentacion> {
    try {
      // Validar con Zod schema
      const validatedData = CreatePresentacionSchema.parse(data)

      return await this.transaction(async (trx) => {
        // Verificar unicidad del nombre dentro de la institución
        const nombreUnico = await this.checkUniquenessInTransaction(
          trx,
          'nombre',
          validatedData.nombre,
          validatedData.id_institucion
        )

        if (!nombreUnico) {
          throw new Error(`Ya existe una presentación con el nombre "${validatedData.nombre}" en esta institución`)
        }

        // Validar unicidad de la abreviatura si se proporciona
        if (validatedData.abreviatura) {
          const abreviaturaUnica = await this.checkUniquenessInTransaction(
            trx,
            'abreviatura',
            validatedData.abreviatura,
            validatedData.id_institucion
          )

          if (!abreviaturaUnica) {
            throw new Error(`Ya existe una presentación con la abreviatura "${validatedData.abreviatura}" en esta institución`)
          }
        }

        // Insertar nueva presentación
        const resultado = await trx
          .insertInto('presentacion')
          .values({
            ...validatedData,
            activo: true,
            es_predeterminado: false,
            creado_en: new Date(),
            actualizado_en: new Date()
          })
          .returning([
            'id',
            'nombre',
            'descripcion',
            'abreviatura',
            'unidad_base',
            'factor_conversion',
            'activo',
            'es_predeterminado',
            'id_institucion',
            'creado_en',
            'actualizado_en'
          ])
          .executeTakeFirstOrThrow()

        // Registrar auditoría
        await this.registrarAuditoria(
          trx,
          resultado.id,
          'INSERT',
          null,
          validatedData,
          usuarioId
        )

        return resultado as Presentacion
      })
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const mappedErrors = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: this.mapZodErrorToSpanish(issue)
        }))

        const errorMessage = mappedErrors.map(err =>
          `${err.field}: ${err.message}`
        ).join('; ')

        throw new Error(`Error de validación: ${errorMessage}`)
      }

      throw error
    }
  }

  // ==================== READ OPERATIONS ====================

  /**
   * Listar presentaciones por institución
   * @param idInstitucion ID de la institución
   * @param soloActivas Filtrar solo presentaciones activas
   * @returns Lista de presentaciones
   */
  async listarPorInstitucion(
    idInstitucion: number,
    soloActivas: boolean = true
  ): Promise<Presentacion[]> {
    let query = this.getDatabase()
      .selectFrom('presentacion')
      .selectAll()
      .where('id_institucion', '=', idInstitucion)

    if (soloActivas) {
      query = query.where('activo', '=', true)
    }

    return await query
      .orderBy('es_predeterminado', 'desc')
      .orderBy('nombre', 'asc')
      .execute() as Presentacion[]
  }

  /**
   * Obtener presentaciones predeterminadas para una institución nueva
   * @param idInstitucion ID de la institución
   * @returns Lista de presentaciones predeterminadas
   */
  async obtenerPredeterminadas(idInstitucion: number): Promise<Presentacion[]> {
    const presentacionesExistentes = await this.getDatabase()
      .selectFrom('presentacion')
      .selectAll()
      .where('id_institucion', '=', idInstitucion)
      .execute() as Presentacion[]

    // Si ya tiene presentaciones, retornarlas
    if (presentacionesExistentes.length > 0) {
      return presentacionesExistentes.filter(p => p.activo)
    }

    // Si no tiene, crear las predeterminadas
    const presentacionesPredeterminadas = [
      { nombre: 'Unidad', abreviatura: 'ud' },
      { nombre: 'Caja', abreviatura: 'caj' },
      { nombre: 'Paquete', abreviatura: 'paq' },
      { nombre: 'Saco', abreviatura: 'sac' },
      { nombre: 'Bolsa', abreviatura: 'bol' },
      { nombre: 'Kilogramo', abreviatura: 'kg', unidad_base: 'gramo', factor_conversion: 1000 },
      { nombre: 'Gramo', abreviatura: 'g' },
      { nombre: 'Litro', abreviatura: 'L', unidad_base: 'mililitro', factor_conversion: 1000 },
      { nombre: 'Mililitro', abreviatura: 'ml' },
      { nombre: 'Metro', abreviatura: 'm' },
      { nombre: 'Centímetro', abreviatura: 'cm' },
      { nombre: 'Rollo', abreviatura: 'rol' },
      { nombre: 'Tubo', abreviatura: 'tub' },
      { nombre: 'Botella', abreviatura: 'bot' },
      { nombre: 'Frasco', abreviatura: 'fra' }
    ]

    const nuevasPresentaciones: Presentacion[] = []

    await this.transaction(async (trx) => {
      for (const predeterminada of presentacionesPredeterminadas) {
        const resultado = await trx
          .insertInto('presentacion')
          .values({
            nombre: predeterminada.nombre,
            abreviatura: predeterminada.abreviatura,
            unidad_base: predeterminada.unidad_base,
            factor_conversion: predeterminada.factor_conversion,
            activo: true,
            es_predeterminado: true,
            id_institucion,
            creado_en: new Date(),
            actualizado_en: new Date()
          })
          .returning([
            'id',
            'nombre',
            'descripcion',
            'abreviatura',
            'unidad_base',
            'factor_conversion',
            'activo',
            'es_predeterminado',
            'id_institucion',
            'creado_en',
            'actualizado_en'
          ])
          .executeTakeFirstOrThrow()

        nuevasPresentaciones.push(resultado as Presentacion)
      }
    })

    return nuevasPresentaciones
  }

  /**
   * Obtener presentación por ID
   * @param id UUID de la presentación
   * @param includeInactive Incluir presentaciones inactivas
   * @returns Presentación encontrada o null
   */
  async findById(
    id: string,
    includeInactive: boolean = false
  ): Promise<Presentacion | null> {
    return await this.findByIdInTransaction(this.getDatabase(), id, includeInactive)
  }

  /**
   * Buscar presentación por nombre
   * @param nombre Nombre de la presentación
   * @param idInstitucion ID de la institución
   * @param soloActivas Filtrar solo presentaciones activas
   * @returns Presentación encontrada o null
   */
  async findByNombre(
    nombre: string,
    idInstitucion: number,
    soloActivas: boolean = true
  ): Promise<Presentacion | null> {
    let query = this.getDatabase()
      .selectFrom('presentacion')
      .selectAll()
      .where('nombre', '=', nombre)
      .where('id_institucion', '=', idInstitucion)

    if (soloActivas) {
      query = query.where('activo', '=', true)
    }

    return await query.executeTakeFirst() as Presentacion | null
  }

  /**
   * Buscar presentación por abreviatura
   * @param abreviatura Abreviatura de la presentación
   * @param idInstitucion ID de la institución
   * @param soloActivas Filtrar solo presentaciones activas
   * @returns Presentación encontrada o null
   */
  async findByAbreviatura(
    abreviatura: string,
    idInstitucion: number,
    soloActivas: boolean = true
  ): Promise<Presentacion | null> {
    let query = this.getDatabase()
      .selectFrom('presentacion')
      .selectAll()
      .where('abreviatura', '=', abreviatura)
      .where('id_institucion', '=', idInstitucion)

    if (soloActivas) {
      query = query.where('activo', '=', true)
    }

    return await query.executeTakeFirst() as Presentacion | null
  }

  /**
   * Búsqueda de texto en múltiples campos
   * @param searchTerm Término de búsqueda
   * @param idInstitucion ID de la institución
   * @param limit Límite de resultados
   * @returns Lista de presentaciones que coinciden
   */
  async search(
    searchTerm: string,
    idInstitucion: number,
    limit: number = 50
  ): Promise<Presentacion[]> {
    const searchFields = ['nombre', 'abreviatura', 'descripcion'] as const

    return await this.getDatabase()
      .selectFrom('presentacion')
      .selectAll()
      .where('id_institucion', '=', idInstitucion)
      .where('activo', '=', true)
      .where((eb) =>
        eb.or(
          searchFields.map(field =>
            eb(field, 'ilike', `%${searchTerm}%`)
          )
        )
      )
      .orderBy('es_predeterminado', 'desc')
      .orderBy('nombre', 'asc')
      .limit(limit)
      .execute() as Presentacion[]
  }

  // ==================== UPDATE OPERATIONS ====================

  /**
   * Actualizar presentación existente
   * @param id UUID de la presentación
   * @param data Datos a actualizar
   * @param usuarioId ID del usuario que realiza la operación
   * @returns Presentación actualizada
   */
  async actualizar(
    id: string,
    data: PresentacionUpdate,
    usuarioId?: string
  ): Promise<Presentacion> {
    try {
      // Validar con Zod schema
      const validatedData = UpdatePresentacionSchema.parse(data)

      return await this.transaction(async (trx) => {
        // Obtener datos anteriores para auditoría
        const anterior = await this.findByIdInTransaction(trx, id, true)
        if (!anterior) {
          throw new Error('Presentación no encontrada')
        }

        // Verificar unicidad del nombre si se actualiza
        if (validatedData.nombre && validatedData.nombre !== anterior.nombre) {
          const nombreUnico = await this.checkUniquenessInTransaction(
            trx,
            'nombre',
            validatedData.nombre,
            anterior.id_institucion,
            id
          )

          if (!nombreUnico) {
            throw new Error(`Ya existe una presentación con el nombre "${validatedData.nombre}" en esta institución`)
          }
        }

        // Verificar unicidad de la abreviatura si se actualiza
        if (validatedData.abreviatura && validatedData.abreviatura !== anterior.abreviatura) {
          const abreviaturaUnica = await this.checkUniquenessInTransaction(
            trx,
            'abreviatura',
            validatedData.abreviatura,
            anterior.id_institucion,
            id
          )

          if (!abreviaturaUnica) {
            throw new Error(`Ya existe una presentación con la abreviatura "${validatedData.abreviatura}" en esta institución`)
          }
        }

        // No permitir cambiar institución de presentaciones predeterminadas
        if (anterior.es_predeterminado && validatedData.id_institucion && validatedData.id_institucion !== anterior.id_institucion) {
          throw new Error('No se puede cambiar la institución de una presentación predeterminada')
        }

        // Actualizar registro
        await trx
          .updateTable('presentacion')
          .set({
            ...validatedData,
            actualizado_en: new Date()
          })
          .where('id', '=', id)
          .execute()

        // Obtener información completa actualizada
        const resultado = await this.findByIdInTransaction(trx, id, true)
        if (!resultado) {
          throw new Error('Error al obtener la presentación actualizada')
        }

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
      if (error instanceof z.ZodError) {
        const mappedErrors = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: this.mapZodErrorToSpanish(issue)
        }))

        const errorMessage = mappedErrors.map(err =>
          `${err.field}: ${err.message}`
        ).join('; ')

        throw new Error(`Error de validación: ${errorMessage}`)
      }

      throw error
    }
  }

  /**
   * Establecer como predeterminada (solo una por institución)
   * @param id UUID de la presentación
   * @param idInstitucion ID de la institución
   * @param usuarioId ID del usuario que realiza la operación
   */
  async establecerComoPredeterminada(
    id: string,
    idInstitucion: number,
    usuarioId?: string
  ): Promise<Presentacion> {
    return await this.transaction(async (trx) => {
      // Primero, quitar el estado predeterminado de todas las presentaciones de la institución
      await trx
        .updateTable('presentacion')
        .set({
          es_predeterminado: false,
          actualizado_en: new Date()
        })
        .where('id_institucion', '=', idInstitucion)
        .execute()

      // Establecer la nueva presentación como predeterminada
      await trx
        .updateTable('presentacion')
        .set({
          es_predeterminado: true,
          actualizado_en: new Date()
        })
        .where('id', '=', id)
        .execute()

      // Obtener presentación actualizada
      const resultado = await this.findByIdInTransaction(trx, id, true)
      if (!resultado) {
        throw new Error('Error al obtener la presentación actualizada')
      }

      // Registrar auditoría
      await this.registrarAuditoria(
        trx,
        id,
        'SET_PREDERMINADA',
        null,
        { es_predeterminado: true },
        usuarioId
      )

      return resultado
    })
  }

  // ==================== DELETE OPERATIONS ====================

  /**
   * Eliminar presentación (soft delete)
   * @param id UUID de la presentación
   * @param forzar Forzar eliminación incluso si está en uso
   * @param usuarioId ID del usuario que realiza la operación
   */
  async eliminar(
    id: string,
    forzar: boolean = false,
    usuarioId?: string
  ): Promise<void> {
    await this.transaction(async (trx) => {
      const presentacion = await this.findByIdInTransaction(trx, id, true)
      if (!presentacion) {
        throw new Error('Presentación no encontrada')
      }

      // Verificar si está en uso en materia prima si no se fuerza
      if (!forzar) {
        const usos = await trx
          .selectFrom('materia_prima')
          .select(sql<number>`COUNT(*)`.as('count'))
          .where('presentacion_id', '=', id)
          .executeTakeFirst()

        if (usos && usos.count > 0) {
          throw new Error('No se puede eliminar una presentación que está siendo utilizada en materiales. Use forzar=true para forzar la eliminación.')
        }
      }

      // Soft delete
      await trx
        .updateTable('presentacion')
        .set({
          activo: false,
          actualizado_en: new Date()
        })
        .where('id', '=', id)
        .execute()

      // Registrar auditoría
      await this.registrarAuditoria(
        trx,
        id,
        'DELETE',
        presentacion,
        null,
        usuarioId
      )
    })
  }

  // ==================== HELPER METHODS ====================

  /**
   * Obtener presentación por ID en transacción
   */
  private async findByIdInTransaction(
    db: Kysely<Database> | Transaction<Database>,
    id: string,
    includeInactive: boolean = false
  ): Promise<Presentacion | null> {
    let query = db
      .selectFrom('presentacion')
      .selectAll()
      .where('id', '=', id)

    if (!includeInactive) {
      query = query.where('activo', '=', true)
    }

    return await query.executeTakeFirst() as Presentacion | null
  }

  /**
   * Verificar unicidad en transacción
   */
  private async checkUniquenessInTransaction(
    trx: Transaction<Database>,
    field: 'nombre' | 'abreviatura',
    value: string,
    idInstitucion: number,
    excludeId?: string
  ): Promise<boolean> {
    let query = trx
      .selectFrom('presentacion')
      .select('id')
      .where(field, '=', value)
      .where('id_institucion', '=', idInstitucion)
      .where('activo', '=', true)

    if (excludeId) {
      query = query.where('id', '!=', excludeId)
    }

    const existing = await query.executeTakeFirst()
    return !existing
  }

  /**
   * Mapear errores de Zod a español
   */
  private mapZodErrorToSpanish(issue: any): string {
    switch (issue.code) {
      case 'too_small':
        if (issue.type === 'string') {
          return `El campo es requerido`
        }
        return `El valor debe ser mayor que ${issue.minimum}`
      case 'too_big':
        return `El campo excede la longitud máxima`
      case 'invalid_string':
        if (issue.validation === 'regex') {
          return 'El formato es inválido'
        }
        return 'El formato del texto es inválido'
      case 'invalid_type':
        return 'El tipo de dato es inválido'
      default:
        return issue.message || 'Error de validación'
    }
  }

  /**
   * Registrar auditoría
   */
  private async registrarAuditoria(
    trx: Transaction<Database>,
    presentacionId: string,
    accion: string,
    datosAnteriores?: any,
    datosNuevos?: any,
    usuarioId?: string
  ): Promise<void> {
    // TODO: Implementar tabla de auditoría para presentaciones si se necesita
    // Por ahora, podríamos registrar en una tabla de auditoría general o logs
    console.log(`Auditoría presentación ${presentacionId}: ${accion}`, {
      usuarioId,
      datosAnteriores,
      datosNuevos,
      fecha: new Date()
    })
  }
}

export default PresentacionRepository