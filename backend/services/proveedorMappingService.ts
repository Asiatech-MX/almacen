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
        .select('uuid_proveedor')
        .where('idFiscal', '=', proveedorId)
        .executeTakeFirst()

      return exists?.uuid_proveedor ?? null
    }

    // Si es número, buscar el uuid_proveedor correspondiente
    if (typeof proveedorId === 'number') {
      const result = await this.db
        .selectFrom('proveedor')
        .select('uuid_proveedor')
        .where('id', '=', proveedorId)
        .executeTakeFirst()

      return result?.uuid_proveedor ?? null
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

    const rows = await this.db.selectFrom('proveedor').selectAll().execute()

    const found = rows.find(r => {
      const anyR = r as any
      if (typeof proveedorId === 'number') return Number(anyR.id) === proveedorId
      return anyR.uuid_proveedor === proveedorId || anyR.idFiscal === proveedorId
    })

    if (!found) return null

    const anyF = found as any
    return {
      id: typeof anyF.id === 'string' ? Number(anyF.id) : (anyF.id as number),
      uuid_proveedor: anyF.uuid_proveedor ?? anyF.idFiscal ?? String(anyF.id),
      nombre: anyF.nombre ?? '',
      estatus: anyF.estatus ?? (anyF.activo ? 'ACTIVO' : 'INACTIVO')
    }
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
      .selectAll()
      .execute()

    return rows
      .filter(r => {
        // table might have 'estatus' (string) or 'activo' (boolean)
        const anyR = r as any
        if (anyR.estatus != null) return anyR.estatus === 'ACTIVO'
        if (anyR.activo != null) return anyR.activo === true
        return false
      })
      .map(r => {
        const anyR = r as any
        return {
          id: typeof anyR.id === 'string' ? Number(anyR.id) : (anyR.id as number),
          nombre: anyR.nombre ?? '',
          rfc: anyR.rfc ?? null,
          estatus: anyR.estatus ?? (anyR.activo ? 'ACTIVO' : 'INACTIVO')
        }
      }) as ProveedorBasic[]
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
        // map the fields that actually exist in DB. Use as any to avoid type errors
        uuid_proveedor: data.idFiscal,
        nombre: data.nombre,
        domicilio: data.domicilio,
        telefono: data.telefono,
        email: data.email,
        contacto: data.contacto,
        rfc: data.rfc,
        curp: data.curp,
        idInstitucion: data.idInstitucion,
        estatus: 'ACTIVO'
      } as any)
      // returning uuid_proveedor may not exist in the typed schema; return id and nombre and fetch uuid if needed
      .returning(['id', 'nombre'])
      .executeTakeFirstOrThrow()

    // If the DB actually has uuid_proveedor and you need it:
    let uuid = (result as any).uuid_proveedor
    if (!uuid) {
      // attempt to read uuid from DB by id
      const row = await this.db
        .selectFrom('proveedor')
        .selectAll()
        .where('id', '=', (typeof result.id === 'string' ? Number(result.id) : result.id) as any)
        .executeTakeFirst()
      uuid = (row as any)?.uuid_proveedor ?? data.idFiscal
    }

    return {
      id: typeof result.id === 'string' ? Number(result.id) : (result.id as number),
      idFiscal: uuid,
      nombre: result.nombre
    }
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
    const rows = await this.db.selectFrom('proveedor').selectAll().execute()

    const totalProveedores = rows.length
    const conIdFiscal = rows.filter(r => (r as any).idFiscal != null || (r as any).uuid_proveedor != null).length

    const inconsistencias = rows
      .filter(r => {
        const anyR = r as any
        return !anyR.idFiscal && !anyR.uuid_proveedor || !anyR.nombre
      })
      .map(p => {
        const anyP = p as any
        return {
          id: typeof anyP.id === 'string' ? Number(anyP.id) : (anyP.id as number),
          nombre: anyP.nombre ?? '',
          issue: anyP.idFiscal || anyP.uuid_proveedor ? 'inconsistent_data' : 'missing_fiscal_id'
        }
      })

    return { totalProveedores, conIdFiscal, inconsistencias }
  }
}