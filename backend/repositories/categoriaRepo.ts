import type { Kysely, Transaction } from 'kysely'
import { sql } from 'kysely'
import { z } from 'zod'
import type { Database } from '../../types/database'
import { getDatabase } from '../../db/pool'
import { BaseRepository } from './base/BaseRepository'
import type {
  Categoria,
  CategoriaArbol,
  NewCategoria,
  CategoriaUpdate,
  OperacionMoverCategoria
} from '../../shared-types/src/referenceData'

/**
 * Esquemas de validación con Zod para garantizar la integridad de datos
 */
const CreateCategoriaSchema = z.object({
  nombre: z.string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),

  descripcion: z.string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .nullable()
    .optional(),

  categoria_padre_id: z.string()
    .uuid('ID de categoría padre inválido')
    .nullable()
    .optional(),

  icono: z.string()
    .max(50, 'El icono no puede exceder 50 caracteres')
    .nullable()
    .optional(),

  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color debe ser hexadecimal (#RRGGBB)')
    .nullable()
    .optional(),

  orden: z.number()
    .int('El orden debe ser un entero')
    .min(0, 'El orden debe ser positivo')
    .default(0),

  id_institucion: z.number()
    .positive('La institución es requerida')
})

const UpdateCategoriaSchema = CreateCategoriaSchema.partial()

/**
 * Repository para gestión de categorías con estructura jerárquica
 * Proporciona operaciones CRUD completas con manejo de jerarquía y auditoría
 */
export class CategoriaRepository extends BaseRepository<'categoria'> {
  constructor(database?: Kysely<Database>) {
    super(database, 'categoria')
  }

  // ==================== CREATE OPERATIONS ====================

  /**
   * Crear una nueva categoría con validación de jerarquía
   * @param data Datos de la nueva categoría
   * @param idPadre ID de la categoría padre (opcional)
   * @param usuarioId ID del usuario que realiza la operación
   * @returns Categoría creada con información completa
   */
  async crearConJerarquia(
    data: NewCategoria,
    idPadre?: string,
    usuarioId?: string
  ): Promise<Categoria> {
    try {
      // Validar con Zod schema
      const validatedData = CreateCategoriaSchema.parse(data)

      return await this.transaction(async (trx) => {
        // Validar límite de niveles si se especifica padre
        if (idPadre) {
          const padre = await this.findByIdInTransaction(trx, idPadre)
          if (!padre) {
            throw new Error('La categoría padre especificada no existe')
          }

          if (padre.nivel >= 4) {
            throw new Error('No se pueden crear subcategorías de nivel 4 o superior')
          }

          // Validar que el padre pertenezca a la misma institución
          if (padre.id_institucion !== validatedData.id_institucion) {
            throw new Error('La categoría padre pertenece a una institución diferente')
          }
        }

        // Verificar unicidad del nombre dentro del mismo nivel y padre
        const nombreUnico = await this.checkUniquenessInTransaction(
          trx,
          'nombre',
          validatedData.nombre,
          validatedData.id_institucion,
          idPadre
        )

        if (!nombreUnico) {
          throw new Error(`Ya existe una categoría con el nombre "${validatedData.nombre}" en este nivel`)
        }

        // Insertar nueva categoría
        const resultado = await trx
          .insertInto('categoria')
          .values({
            ...validatedData,
            categoria_padre_id: idPadre || null,
            nivel: idPadre ? (await this.getNivelPadreInTransaction(trx, idPadre)) + 1 : 1,
            activo: true,
            es_predeterminado: false,
            creado_en: new Date(),
            actualizado_en: new Date()
          })
          .returning([
            'id',
            'nombre',
            'descripcion',
            'categoria_padre_id',
            'nivel',
            'ruta_completa',
            'icono',
            'color',
            'orden',
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
          { ...resultado, categoria_padre_id: idPadre },
          usuarioId
        )

        return resultado as Categoria
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
   * Listar categorías con estructura de árbol completa
   * @param idInstitucion ID de la institución
   * @param soloActivas Filtrar solo categorías activas
   * @returns Árbol de categorías con jerarquía completa
   */
  async listarArbol(idInstitucion: number, soloActivas: boolean = true): Promise<CategoriaArbol[]> {
    // Usar CTE recursivo para construir el árbol
    const query = this.getDatabase()
      .withRecursive('categoria_arbol', (qb) => {
        // Base case: categorías raíz (sin padre)
        let baseQuery = qb
          .selectFrom('categoria')
          .where('categoria.id_institucion', '=', idInstitucion)
          .where('categoria.categoria_padre_id', 'is', null)
          .selectAll('categoria')

        if (soloActivas) {
          baseQuery = baseQuery.where('categoria.activo', '=', true)
        }

        return baseQuery.union((eb) => {
          // Recursive case: subcategorías
          let recursiveQuery = eb
            .selectFrom('categoria as c')
            .innerJoin('categoria_arbol as ca', 'c.categoria_padre_id', 'ca.id')
            .selectAll('c')

          if (soloActivas) {
            recursiveQuery = recursiveQuery.where('c.activo', '=', true)
          }

          return recursiveQuery
        })
      })
      .selectFrom('categoria_arbol')
      .selectAll()
      .orderBy('ruta_completa', 'asc')
      .orderBy('orden', 'asc')

    const flatResults = await query.execute() as Categoria[]

    // Construir estructura de árbol
    return this.buildTreeFromFlatList(flatResults)
  }

  /**
   * Listar categorías planas (sin estructura de árbol)
   * @param idInstitucion ID de la institución
   * @param soloActivas Filtrar solo categorías activas
   * @returns Lista plana de categorías
   */
  async listarPorInstitucion(
    idInstitucion: number,
    soloActivas: boolean = true
  ): Promise<Categoria[]> {
    let query = this.getDatabase()
      .selectFrom('categoria')
      .selectAll()
      .where('id_institucion', '=', idInstitucion)

    if (soloActivas) {
      query = query.where('activo', '=', true)
    }

    return await query
      .orderBy('ruta_completa', 'asc')
      .orderBy('orden', 'asc')
      .execute() as Categoria[]
  }

  /**
   * Obtener categoría por ID
   * @param id UUID de la categoría
   * @param includeInactive Incluir categorías inactivas
   * @returns Categoría encontrada o null
   */
  async findById(
    id: string,
    includeInactive: boolean = false
  ): Promise<Categoria | null> {
    return await this.findByIdInTransaction(this.getDatabase(), id, includeInactive)
  }

  /**
   * Obtener subcategorías directas de una categoría
   * @param idPadre ID de la categoría padre
   * @param soloActivas Filtrar solo categorías activas
   * @returns Lista de subcategorías directas
   */
  async obtenerHijosDirectos(
    idPadre: string,
    soloActivas: boolean = true
  ): Promise<Categoria[]> {
    let query = this.getDatabase()
      .selectFrom('categoria')
      .selectAll()
      .where('categoria_padre_id', '=', idPadre)

    if (soloActivas) {
      query = query.where('activo', '=', true)
    }

    return await query
      .orderBy('orden', 'asc')
      .orderBy('nombre', 'asc')
      .execute() as Categoria[]
  }

  /**
   * Obtener ruta completa de una categoría (ej: "Construcción > Electricidad > Cableado")
   * @param id UUID de la categoría
   * @returns Ruta completa o null
   */
  async obtenerRutaCompleta(id: string): Promise<string | null> {
    const categoria = await this.findById(id)
    return categoria?.ruta_completa || null
  }

  /**
   * Verificar si una categoría es descendiente de otra
   * @param idPosibleDescendiente ID de la posible categoría descendiente
   * @param idPosiblePadre ID de la posible categoría padre
   * @returns true si es descendiente, false si no
   */
  async esDescendiente(
    idPosibleDescendiente: string,
    idPosiblePadre: string
  ): Promise<boolean> {
    const query = this.getDatabase()
      .withRecursive('categoria_descendientes', (qb) => {
        // Base case: hijos directos
        return qb
          .selectFrom('categoria')
          .where('categoria.categoria_padre_id', '=', idPosiblePadre)
          .select(['id', 'categoria_padre_id'])
          .union((eb) => {
            // Recursive case: descendientes recursivos
            return eb
              .selectFrom('categoria as c')
              .innerJoin('categoria_descendientes as cd', 'c.categoria_padre_id', 'cd.id')
              .select(['c.id', 'c.categoria_padre_id'])
          })
      })
      .selectFrom('categoria_descendientes')
      .select('id')
      .where('id', '=', idPosibleDescendiente)

    const result = await query.executeTakeFirst()
    return !!result
  }

  // ==================== UPDATE OPERATIONS ====================

  /**
   * Actualizar categoría existente
   * @param id UUID de la categoría
   * @param data Datos a actualizar
   * @param usuarioId ID del usuario que realiza la operación
   * @returns Categoría actualizada
   */
  async actualizar(
    id: string,
    data: CategoriaUpdate,
    usuarioId?: string
  ): Promise<Categoria> {
    try {
      // Validar con Zod schema
      const validatedData = UpdateCategoriaSchema.parse(data)

      return await this.transaction(async (trx) => {
        // Obtener datos anteriores para auditoría
        const anterior = await this.findByIdInTransaction(trx, id, true)
        if (!anterior) {
          throw new Error('Categoría no encontrada')
        }

        // Validar que no se mueva a sí misma como padre
        if (validatedData.categoria_padre_id === id) {
          throw new Error('Una categoría no puede ser su propia padre')
        }

        // Validar que no se mueva a uno de sus descendientes
        if (validatedData.categoria_padre_id) {
          const esDescendiente = await this.esDescendienteEnTransaction(
            trx,
            validatedData.categoria_padre_id,
            id
          )
          if (esDescendiente) {
            throw new Error('No se puede mover una categoría a uno de sus descendientes')
          }

          // Validar límite de niveles
          const nuevoPadre = await this.findByIdInTransaction(trx, validatedData.categoria_padre_id)
          if (!nuevoPadre) {
            throw new Error('La categoría padre especificada no existe')
          }

          if (nuevoPadre.nivel >= 4) {
            throw new Error('No se puede mover a esta categoría porque excedería el límite de niveles')
          }

          // Validar que pertenezca a la misma institución
          if (nuevoPadre.id_institucion !== anterior.id_institucion) {
            throw new Error('La categoría padre pertenece a una institución diferente')
          }
        }

        // Verificar unicidad del nombre si se actualiza
        if (validatedData.nombre && validatedData.nombre !== anterior.nombre) {
          const nombreUnico = await this.checkUniquenessInTransaction(
            trx,
            'nombre',
            validatedData.nombre,
            anterior.id_institucion,
            validatedData.categoria_padre_id || anterior.categoria_padre_id,
            id
          )

          if (!nombreUnico) {
            throw new Error(`Ya existe una categoría con el nombre "${validatedData.nombre}" en este nivel`)
          }
        }

        // Actualizar registro
        await trx
          .updateTable('categoria')
          .set({
            ...validatedData,
            actualizado_en: new Date()
          })
          .where('id', '=', id)
          .execute()

        // Obtener información completa actualizada
        const resultado = await this.findByIdInTransaction(trx, id, true)
        if (!resultado) {
          throw new Error('Error al obtener la categoría actualizada')
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
   * Mover categoría en jerarquía
   * @param idCategoria ID de la categoría a mover
   * @param nuevoPadreId ID del nuevo padre (opcional)
   * @param usuarioId ID del usuario que realiza la operación
   * @returns Categoría actualizada
   */
  async moverCategoria(
    idCategoria: string,
    nuevoPadreId?: string,
    usuarioId?: string
  ): Promise<Categoria> {
    return await this.actualizar(
      idCategoria,
      { categoria_padre_id: nuevoPadreId },
      usuarioId
    )
  }

  /**
   * Reordenar categorías del mismo nivel
   * @param operaciones Lista de operaciones de reordenamiento
   * @param usuarioId ID del usuario que realiza la operación
   */
  async reordenarCategorias(
    operaciones: Array<{ id: string; orden: number }>,
    usuarioId?: string
  ): Promise<void> {
    await this.transaction(async (trx) => {
      for (const operacion of operaciones) {
        await trx
          .updateTable('categoria')
          .set({
            orden: operacion.orden,
            actualizado_en: new Date()
          })
          .where('id', '=', operacion.id)
          .execute()

        // Registrar auditoría individual
        await this.registrarAuditoria(
          trx,
          operacion.id,
          'REORDER',
          { orden_anterior: null }, // Podríamos obtener el valor anterior si fuera necesario
          { orden_nuevo: operacion.orden },
          usuarioId
        )
      }
    })
  }

  // ==================== DELETE OPERATIONS ====================

  /**
   * Eliminar categoría (soft delete)
   * @param id UUID de la categoría
   * @param forzar Forzar eliminación incluso con hijos
   * @param usuarioId ID del usuario que realiza la operación
   */
  async eliminar(
    id: string,
    forzar: boolean = false,
    usuarioId?: string
  ): Promise<void> {
    await this.transaction(async (trx) => {
      const categoria = await this.findByIdInTransaction(trx, id, true)
      if (!categoria) {
        throw new Error('Categoría no encontrada')
      }

      // Verificar si tiene hijos
      const hijos = await this.obtenerHijosDirectosEnTransaction(trx, id, true)
      if (hijos.length > 0 && !forzar) {
        throw new Error('No se puede eliminar una categoría con subcategorías. Use forzar=true para eliminar junto con sus subcategorías.')
      }

      if (forzar && hijos.length > 0) {
        // Eliminar recursivamente
        for (const hijo of hijos) {
          await this.eliminar(hijo.id, true, usuarioId)
        }
      }

      // Soft delete
      await trx
        .updateTable('categoria')
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
        categoria,
        null,
        usuarioId
      )
    })
  }

  // ==================== HELPER METHODS ====================

  /**
   * Construir estructura de árbol desde lista plana
   * @param flatList Lista plana de categorías
   * @returns Árbol de categorías
   */
  private buildTreeFromFlatList(flatList: Categoria[]): CategoriaArbol[] {
    const nodeMap = new Map<string, CategoriaArbol>()
    const roots: CategoriaArbol[] = []

    // Primera pasada: crear todos los nodos
    flatList.forEach(categoria => {
      const node: CategoriaArbol = {
        ...categoria,
        hijos: [],
        profundidad: categoria.nivel - 1
      }
      nodeMap.set(categoria.id, node)
    })

    // Segunda pasada: establecer relaciones padre-hijo
    flatList.forEach(categoria => {
      const node = nodeMap.get(categoria.id)!

      if (categoria.categoria_padre_id) {
        const parent = nodeMap.get(categoria.categoria_padre_id)
        if (parent) {
          parent.hijos.push(node)
        }
      } else {
        roots.push(node)
      }
    })

    // Ordenar hijos en cada nivel
    const sortNodes = (nodes: CategoriaArbol[]) => {
      nodes.sort((a, b) => a.orden - b.orden)
      nodes.forEach(node => sortNodes(node.hijos))
    }

    sortNodes(roots)

    return roots
  }

  /**
   * Obtener nivel de la categoría padre en transacción
   */
  private async getNivelPadreInTransaction(
    trx: Transaction<Database>,
    idPadre: string
  ): Promise<number> {
    const padre = await trx
      .selectFrom('categoria')
      .select('nivel')
      .where('id', '=', idPadre)
      .executeTakeFirst()

    return padre?.nivel || 1
  }

  /**
   * Obtener categoría por ID en transacción
   */
  private async findByIdInTransaction(
    db: Kysely<Database> | Transaction<Database>,
    id: string,
    includeInactive: boolean = false
  ): Promise<Categoria | null> {
    let query = db
      .selectFrom('categoria')
      .selectAll()
      .where('id', '=', id)

    if (!includeInactive) {
      query = query.where('activo', '=', true)
    }

    return await query.executeTakeFirst() as Categoria | null
  }

  /**
   * Obtener hijos directos en transacción
   */
  private async obtenerHijosDirectosEnTransaction(
    trx: Transaction<Database>,
    idPadre: string,
    includeInactive: boolean = false
  ): Promise<Categoria[]> {
    let query = trx
      .selectFrom('categoria')
      .selectAll()
      .where('categoria_padre_id', '=', idPadre)

    if (!includeInactive) {
      query = query.where('activo', '=', true)
    }

    return await query
      .orderBy('orden', 'asc')
      .orderBy('nombre', 'asc')
      .execute() as Categoria[]
  }

  /**
   * Verificar si es descendiente en transacción
   */
  private async esDescendienteEnTransaction(
    trx: Transaction<Database>,
    idPosibleDescendiente: string,
    idPosiblePadre: string
  ): Promise<boolean> {
    const query = trx
      .withRecursive('categoria_descendientes', (qb) => {
        return qb
          .selectFrom('categoria')
          .where('categoria.categoria_padre_id', '=', idPosiblePadre)
          .select(['id', 'categoria_padre_id'])
          .union((eb) => {
            return eb
              .selectFrom('categoria as c')
              .innerJoin('categoria_descendientes as cd', 'c.categoria_padre_id', 'cd.id')
              .select(['c.id', 'c.categoria_padre_id'])
          })
      })
      .selectFrom('categoria_descendientes')
      .select('id')
      .where('id', '=', idPosibleDescendiente)

    const result = await query.executeTakeFirst()
    return !!result
  }

  /**
   * Verificar unicidad en transacción
   */
  private async checkUniquenessInTransaction(
    trx: Transaction<Database>,
    field: 'nombre',
    value: string,
    idInstitucion: number,
    idPadre?: string | null,
    excludeId?: string
  ): Promise<boolean> {
    let query = trx
      .selectFrom('categoria')
      .select('id')
      .where(field, '=', value)
      .where('id_institucion', '=', idInstitucion)
      .where('activo', '=', true)

    // Manejar el categoria_padre_id de forma segura
    if (idPadre === null || idPadre === undefined) {
      query = query.where('categoria_padre_id', 'is', null)
    } else {
      query = query.where('categoria_padre_id', '=', idPadre)
    }

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
        return `El campo es requerido`
      case 'too_big':
        return `El campo excede la longitud máxima`
      case 'invalid_string':
        if (issue.validation === 'regex') {
          return 'El formato es inválido'
        }
        return 'El formato del texto es inválido'
      case 'invalid_type':
        return 'El tipo de dato es inválido'
      case 'invalid_uuid':
        return 'El UUID proporcionado no es válido'
      default:
        return issue.message || 'Error de validación'
    }
  }

  /**
   * Registrar auditoría
   */
  private async registrarAuditoria(
    trx: Transaction<Database>,
    categoriaId: string,
    accion: string,
    datosAnteriores?: any,
    datosNuevos?: any,
    usuarioId?: string
  ): Promise<void> {
    // TODO: Implementar tabla de auditoría para categorías si se necesita
    // Por ahora, podríamos registrar en una tabla de auditoría general
    console.log(`Auditoría categoría ${categoriaId}: ${accion}`, {
      usuarioId,
      datosAnteriores,
      datosNuevos,
      fecha: new Date()
    })
  }
}

export default CategoriaRepository