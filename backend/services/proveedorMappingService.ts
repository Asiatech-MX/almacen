import type { Kysely, Selectable } from 'kysely'
import type { Database } from '../types/database'

// Helper types using official Kysely patterns
type ProveedorRow = Selectable<Database['proveedor']>
type ProveedorBasic = Pick<ProveedorRow, 'id' | 'nombre' | 'rfc' | 'estatus'>

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

    // Si ya es string (asumimos que es idFiscal), buscar y retornar
    if (typeof proveedorId === 'string') {
      const exists = await this.db
        .selectFrom('proveedor')
        .select(['proveedor.idFiscal'])
        .where('proveedor.idFiscal', '=', proveedorId)
        .executeTakeFirst()

      return exists?.idFiscal ?? null
    }

    // Si es número, buscar el idFiscal correspondiente
    if (typeof proveedorId === 'number') {
      const result = await this.db
        .selectFrom('proveedor')
        .select(['proveedor.idFiscal'])
        .where('proveedor.id', '=', proveedorId)
        .executeTakeFirst()

      return result?.idFiscal ?? null
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
      .select(['proveedor.id'])
      .where('proveedor.idFiscal', '=', uuid)
      .executeTakeFirst()

    if (result?.id == null) return null

    // Convert to number since Database types may use ColumnType
    return typeof result.id === 'string' ? Number(result.id) : (result.id as number)
  }

  /**
   * Lista todos los proveedores con ambos IDs para compatibilidad
   */
  async listProveedoresCompatibles(): Promise<ProveedorBasic[]> {
    const rows = await this.db
      .selectFrom('proveedor')
      .select([
        'proveedor.id',
        'proveedor.nombre',
        'proveedor.rfc',
        'proveedor.estatus'
      ])
      .where('proveedor.estatus', '=', 'ACTIVO')
      .execute()

    // Normalize id if necessary (DB id may be ColumnType)
    return rows.map(r => ({
      ...r,
      id: typeof r.id === 'string' ? Number(r.id) : (r.id as number)
    })) as ProveedorBasic[]
  }

  /**
   * Crea un nuevo proveedor con ambos IDs (UUID e INTEGER)
   */
  async createWithDualKeys(data: {
    idFiscal: string
    nombre: string
    domicilio?: string
    telefono?: string
    email?: string
    contacto?: string
    rfc?: string
    curp?: string
    idInstitucion: number
  }): Promise<{
    id: number
    idFiscal: string
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
    conIdFiscal: number
    inconsistencias: Array<{
      id: number
      nombre: string
      issue: string
    }>
  }> {
    const total = await this.db
      .selectFrom('proveedor')
      .select((eb) => eb.fn.count('proveedor.id').as('total'))
      .executeTakeFirst()

    const conIdFiscal = await this.db
      .selectFrom('proveedor')
      .select((eb) => eb.fn.count('proveedor.id').as('con_id_fiscal'))
      .where('proveedor.idFiscal', 'is not', null)
      .executeTakeFirst()

    // Include idFiscal in select so mapping logic can use it
    const inconsistencias = await this.db
      .selectFrom('proveedor')
      .select([
        'proveedor.id',
        'proveedor.nombre',
        'proveedor.idFiscal'
      ])
      .where((eb) => eb.or([
        eb('proveedor.idFiscal', 'is', null),
        eb('proveedor.nombre', 'is', null)
      ]))
      .execute()

    return {
      totalProveedores: Number(total?.total ?? 0),
      conIdFiscal: Number(conIdFiscal?.con_id_fiscal ?? 0),
      inconsistencias: inconsistencias.map(p => ({
        id: typeof p.id === 'string' ? Number(p.id) : (p.id as number),
        nombre: p.nombre ?? '',
        issue: p.idFiscal ? 'inconsistent_data' : 'missing_fiscal_id'
      }))
    }
  }
}