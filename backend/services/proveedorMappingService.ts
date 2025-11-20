import type { Kysely } from 'kysely'
import type { Database } from '../types/database'

/**
 * Servicio para manejar la conversión y compatibilidad entre IDs UUID e INTEGER de proveedores
 * Implementa la estrategia de Dual Keys para mantener compatibilidad durante la migración
 */
export class ProveedorMappingService {
  constructor(private db: Kysely<Database>) {}

  /**
   * Convierte un ID de proveedor a UUID (si es necesario)
   * @param proveedorId - ID del proveedor (puede ser number o string UUID)
   * @returns UUID del proveedor
   */
  async convertToUuid(proveedorId: number | string | null | undefined): Promise<string | null> {
    if (!proveedorId) return null

    // Si ya es UUID, validar y retornar
    if (typeof proveedorId === 'string') {
      const exists = await this.db
        .selectFrom('proveedor')
        .select('uuid_proveedor')
        .where('uuid_proveedor', '=', proveedorId)
        .executeTakeFirst()

      return exists?.uuid_proveedor || null
    }

    // Si es número, buscar el UUID correspondiente
    if (typeof proveedorId === 'number') {
      const result = await this.db
        .selectFrom('proveedor')
        .select('uuid_proveedor')
        .where('id', '=', proveedorId)
        .executeTakeFirst()

      return result?.uuid_proveedor || null
    }

    return null
  }

  /**
   * Verifica si un proveedor existe (por ID o UUID)
   * @param proveedorId - ID del proveedor (number o UUID string)
   * @returns Información básica del proveedor
   */
  async validateProveedor(proveedorId: number | string | null | undefined): Promise<{
    id: number
    uuid_proveedor: string
    nombre: string
    estatus: string
  } | null> {
    if (!proveedorId) return null

    let query = this.db.selectFrom('proveedor')

    if (typeof proveedorId === 'number') {
      query = query.where('id', '=', proveedorId)
    } else if (typeof proveedorId === 'string') {
      query = query.where('uuid_proveedor', '=', proveedorId)
    } else {
      return null
    }

    const result = await query
      .select(['id', 'uuid_proveedor', 'nombre', 'estatus'])
      .executeTakeFirst()

    return result || null
  }

  /**
   * Obtiene UUID de proveedor por ID numérico
   */
  async getUuidByProveedorId(proveedorId: number): Promise<string | null> {
    const result = await this.db
      .selectFrom('proveedor')
      .select('uuid_proveedor')
      .where('id', '=', proveedorId)
      .executeTakeFirst()

    return result?.uuid_proveedor || null
  }

  /**
   * Obtiene ID numérico de proveedor por UUID
   */
  async getProveedorIdByUuid(uuid: string): Promise<number | null> {
    const result = await this.db
      .selectFrom('proveedor')
      .select('id')
      .where('uuid_proveedor', '=', uuid)
      .executeTakeFirst()

    return result?.id || null
  }

  /**
   * Lista todos los proveedores con ambos IDs para compatibilidad
   */
  async listProveedoresCompatibles(): Promise<Array<{
    id: number
    uuid_proveedor: string
    nombre: string
    rfc: string
    estatus: string
  }>> {
    return await this.db
      .selectFrom('proveedor')
      .select(['id', 'uuid_proveedor', 'nombre', 'rfc', 'estatus'])
      .where('estatus', '=', 'ACTIVO')
      .execute()
  }

  /**
   * Crea un nuevo proveedor con ambos IDs (UUID e INTEGER)
   */
  async createWithDualKeys(data: {
    id_fiscal: string
    nombre: string
    domicilio?: string
    telefono?: string
    email?: string
    contacto?: string
    rfc?: string
    curp?: string
    id_institucion: number
  }): Promise<{
    id: number
    uuid_proveedor: string
    nombre: string
  }> {
    const result = await this.db
      .insertInto('proveedor')
      .values({
        ...data,
        estatus: 'ACTIVO'
      })
      .returning(['id', 'uuid_proveedor', 'nombre'])
      .executeTakeFirstOrThrow()

    return result
  }

  /**
   * Verifica la consistencia de los datos de mapeo
   */
  async checkConsistency(): Promise<{
    totalProveedores: number
    conUuid: number
    inconsistencias: Array<{
      id: number
      nombre: string
      issue: string
    }>
  }> {
    const total = await this.db
      .selectFrom('proveedor')
      .select(eb => eb.fn.count('id').as('total'))
      .executeTakeFirst()

    const conUuid = await this.db
      .selectFrom('proveedor')
      .select(eb => eb.fn.count('id').as('con_uuid'))
      .where('uuid_proveedor', 'is not', null)
      .executeTakeFirst()

    const inconsistencias = await this.db
      .selectFrom('proveedor')
      .select(['id', 'nombre'])
      .where(eb => eb.or([
        eb('uuid_proveedor', 'is', null),
        eb('id_fiscal', 'is', null),
        eb('nombre', 'is', null)
      ]))
      .execute()

    return {
      totalProveedores: Number(total?.total || 0),
      conUuid: Number(conUuid?.con_uuid || 0),
      inconsistencias: inconsistencias.map(p => ({
        ...p,
        issue: p.uuid_proveedor ? 'missing_data' : 'missing_uuid'
      }))
    }
  }
}