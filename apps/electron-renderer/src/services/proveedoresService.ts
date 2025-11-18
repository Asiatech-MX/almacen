// Tipos para proveedores
export interface Proveedor {
  id: string
  nombre: string
  rfc: string
  telefono: string
  email: string
  direccion: string
  ciudad: string
  estado: string
  codigo_postal: string
  contacto_nombre: string
  contacto_telefono: string
  contacto_email: string
  estatus: 'activo' | 'inactivo'
  creado_en: string
  actualizado_en: string
  institucion_id: string
}

export interface NewProveedor {
  nombre: string
  rfc: string
  telefono: string
  email: string
  direccion: string
  ciudad: string
  estado: string
  codigo_postal: string
  contacto_nombre: string
  contacto_telefono: string
  contacto_email: string
  estatus?: 'activo' | 'inactivo'
}

export interface ProveedorUpdate {
  nombre?: string
  rfc?: string
  telefono?: string
  email?: string
  direccion?: string
  ciudad?: string
  estado?: string
  codigo_postal?: string
  contacto_nombre?: string
  contacto_telefono?: string
  contacto_email?: string
  estatus?: 'activo' | 'inactivo'
}

export interface ProveedorFilters {
  nombre?: string
  rfc?: string
  estatus?: 'activo' | 'inactivo'
  ciudad?: string
  estado?: string
}

// Helper para determinar si estamos en Electron
const isElectron = (): boolean => {
  return typeof window !== 'undefined' && window.electronAPI !== undefined
}

export class ProveedoresService {
  constructor() {
    // Inicialización
  }

  // Lista todos los proveedores
  async listar(filters?: ProveedorFilters): Promise<Proveedor[]> {
    if (!isElectron()) {
      // Modo desarrollo: datos mock
      console.log('Modo desarrollo: usando datos mock para proveedores')
      return this.getMockData(filters)
    }

    try {
      // Por ahora, datos mock hasta implementar IPC handlers
      console.log('Modo desarrollo: usando datos mock para proveedores (IPC handler pendiente)')
      return this.getMockData(filters)
    } catch (error) {
      console.error('Error en servicio listar proveedores:', error)
      throw new Error('Error al obtener los proveedores')
    }
  }

  // Obtiene un proveedor por ID
  async obtener(id: string): Promise<Proveedor> {
    if (!isElectron()) {
      // Modo desarrollo: buscar por ID
      console.log('Modo desarrollo: buscando proveedor por ID', id)
      const proveedores = this.getMockData()
      const proveedor = proveedores.find(item => item.id === id)

      if (!proveedor) {
        throw new Error('Proveedor no encontrado')
      }

      return proveedor
    }

    try {
      // Por ahora, datos mock hasta implementar IPC handlers
      const proveedores = this.getMockData()
      const proveedor = proveedores.find(item => item.id === id)

      if (!proveedor) {
        throw new Error('Proveedor no encontrado')
      }

      return proveedor
    } catch (error) {
      console.error('Error en servicio obtener proveedor:', error)
      throw new Error('Error al obtener el proveedor')
    }
  }

  // Busca proveedores por término
  async buscar(searchTerm: string, limit: number = 50): Promise<Proveedor[]> {
    if (!isElectron()) {
      // Modo desarrollo: búsqueda simulada
      console.log('Modo desarrollo: buscando proveedores', searchTerm)
      const proveedores = this.getMockData()
      return proveedores.filter(item =>
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.rfc?.includes(searchTerm) ||
        item.ciudad.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.contacto_nombre.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, limit)
    }

    try {
      const proveedores = await this.listar()
      const term = searchTerm.toLowerCase()

      return proveedores.filter(item =>
        item.nombre.toLowerCase().includes(term) ||
        item.rfc?.includes(searchTerm) ||
        item.ciudad.toLowerCase().includes(term) ||
        item.contacto_nombre.toLowerCase().includes(term)
      ).slice(0, limit)
    } catch (error) {
      console.error('Error en servicio buscar proveedores:', error)
      throw new Error('Error al buscar proveedores')
    }
  }

  // Crea un nuevo proveedor
  async crear(data: NewProveedor): Promise<Proveedor> {
    if (!isElectron()) {
      // Modo desarrollo: crear mock
      console.log('Modo desarrollo: creando proveedor', data)
      const nuevoProveedor: Proveedor = {
        id: Math.random().toString(36).substring(7),
        nombre: data.nombre,
        rfc: data.rfc,
        telefono: data.telefono,
        email: data.email,
        direccion: data.direccion,
        ciudad: data.ciudad,
        estado: data.estado,
        codigo_postal: data.codigo_postal,
        contacto_nombre: data.contacto_nombre,
        contacto_telefono: data.contacto_telefono,
        contacto_email: data.contacto_email,
        estatus: data.estatus || 'activo',
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString(),
        institucion_id: 'inst-001' // Mock
      }
      return nuevoProveedor
    }

    try {
      // Por ahora, datos mock hasta implementar IPC handlers
      console.log('Modo desarrollo: creando proveedor (IPC handler pendiente)', data)
      const nuevoProveedor: Proveedor = {
        id: Math.random().toString(36).substring(7),
        nombre: data.nombre,
        rfc: data.rfc,
        telefono: data.telefono,
        email: data.email,
        direccion: data.direccion,
        ciudad: data.ciudad,
        estado: data.estado,
        codigo_postal: data.codigo_postal,
        contacto_nombre: data.contacto_nombre,
        contacto_telefono: data.contacto_telefono,
        contacto_email: data.contacto_email,
        estatus: data.estatus || 'activo',
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString(),
        institucion_id: 'inst-001' // Mock
      }
      return nuevoProveedor
    } catch (error) {
      console.error('Error al crear proveedor:', error)
      throw new Error('Error al crear el proveedor')
    }
  }

  // Actualiza un proveedor existente
  async actualizar(id: string, data: ProveedorUpdate): Promise<Proveedor> {
    if (!isElectron()) {
      // Modo desarrollo: actualizar mock
      console.log('Modo desarrollo: actualizando proveedor', id, data)
      const proveedores = this.getMockData()
      const index = proveedores.findIndex(item => item.id === id)

      if (index === -1) {
        throw new Error('Proveedor no encontrado')
      }

      const actualizado = { ...proveedores[index], ...data, actualizado_en: new Date().toISOString() }
      return actualizado
    }

    try {
      // Por ahora, datos mock hasta implementar IPC handlers
      const proveedores = this.getMockData()
      const index = proveedores.findIndex(item => item.id === id)

      if (index === -1) {
        throw new Error('Proveedor no encontrado')
      }

      const actualizado = { ...proveedores[index], ...data, actualizado_en: new Date().toISOString() }
      return actualizado
    } catch (error) {
      console.error('Error al actualizar proveedor:', error)
      throw new Error('Error al actualizar el proveedor')
    }
  }

  // Elimina un proveedor
  async eliminar(id: string): Promise<boolean> {
    if (!isElectron()) {
      // Modo desarrollo: eliminar mock
      console.log('Modo desarrollo: eliminando proveedor', id)
      return true
    }

    try {
      // Por ahora, datos mock hasta implementar IPC handlers
      console.log('Modo desarrollo: eliminando proveedor (IPC handler pendiente)', id)
      return true
    } catch (error) {
      console.error('Error al eliminar proveedor:', error)
      throw new Error('Error al eliminar el proveedor')
    }
  }

  // Obtiene estadísticas de proveedores
  async getEstadisticas(): Promise<{
    total_proveedores: number
    proveedores_activos: number
    proveedores_inactivos: number
    proveedores_por_estado: Array<{
      estado: string
      count: number
    }>
  }> {
    try {
      const proveedores = await this.listar()

      const total_proveedores = proveedores.length
      const proveedores_activos = proveedores.filter(p => p.estatus === 'activo').length
      const proveedores_inactivos = proveedores.filter(p => p.estatus === 'inactivo').length

      // Agrupar por estado
      const estados_count = new Map<string, number>()
      proveedores.forEach(proveedor => {
        const current = estados_count.get(proveedor.estado) || 0
        estados_count.set(proveedor.estado, current + 1)
      })

      const proveedores_por_estado = Array.from(estados_count.entries())
        .map(([estado, count]) => ({
          estado,
          count
        }))
        .sort((a, b) => b.count - a.count)

      return {
        total_proveedores,
        proveedores_activos,
        proveedores_inactivos,
        proveedores_por_estado
      }
    } catch (error) {
      console.error('Error al obtener estadísticas:', error)
      throw new Error('Error al obtener las estadísticas de proveedores')
    }
  }

  // Datos mock para desarrollo
  private getMockData(filters?: ProveedorFilters): Proveedor[] {
    const mockProveedores: Proveedor[] = [
      {
        id: 'prov-001',
        nombre: 'Holcim México',
        rfc: 'HOL920101123',
        telefono: '55-1234-5678',
        email: 'contacto@holcim.com.mx',
        direccion: 'Av. Presidente Masaryk 123',
        ciudad: 'Ciudad de México',
        estado: 'CDMX',
        codigo_postal: '11580',
        contacto_nombre: 'Juan López',
        contacto_telefono: '55-8765-4321',
        contacto_email: 'juan.lopez@holcim.com.mx',
        estatus: 'activo',
        creado_en: '2024-01-01T00:00:00Z',
        actualizado_en: '2024-01-01T00:00:00Z',
        institucion_id: 'inst-001'
      },
      {
        id: 'prov-002',
        nombre: 'Ladrillera Nacional',
        rfc: 'LAN930101456',
        telefono: '55-2345-6789',
        email: 'ventas@ladrillera.com',
        direccion: 'Carretera Federal 45 km 2',
        ciudad: 'Toluca',
        estado: 'Estado de México',
        codigo_postal: '50000',
        contacto_nombre: 'María Rodríguez',
        contacto_telefono: '55-9876-5432',
        contacto_email: 'maria.rodriguez@ladrillera.com',
        estatus: 'activo',
        creado_en: '2024-01-15T00:00:00Z',
        actualizado_en: '2024-01-15T00:00:00Z',
        institucion_id: 'inst-001'
      },
      {
        id: 'prov-003',
        nombre: 'Sika México',
        rfc: 'SIK940101789',
        telefono: '55-3456-7890',
        email: 'mexico@sika.com',
        direccion: 'Blvd. Adolfo López Mateos 2001',
        ciudad: 'Tlalnepantla',
        estado: 'Estado de México',
        codigo_postal: '54090',
        contacto_nombre: 'Carlos Martínez',
        contacto_telefono: '55-1098-7654',
        contacto_email: 'carlos.martinez@sika.com',
        estatus: 'activo',
        creado_en: '2024-02-01T00:00:00Z',
        actualizado_en: '2024-02-01T00:00:00Z',
        institucion_id: 'inst-001'
      },
      {
        id: 'prov-004',
        nombre: 'Distribuidora de Construcción',
        rfc: 'DIS950101012',
        telefono: '55-4567-8901',
        email: 'info@distconst.com',
        direccion: 'Calle Principal 456',
        ciudad: 'Guadalajara',
        estado: 'Jalisco',
        codigo_postal: '44100',
        contacto_nombre: 'Ana García',
        contacto_telefono: '33-3210-9876',
        contacto_email: 'ana.garcia@distconst.com',
        estatus: 'inactivo',
        creado_en: '2024-01-20T00:00:00Z',
        actualizado_en: '2024-10-15T00:00:00Z',
        institucion_id: 'inst-001'
      },
      {
        id: 'prov-005',
        nombre: 'Ferretera del Centro',
        rfc: 'FER960101345',
        telefono: '55-5678-9012',
        email: 'ventas@ferreteracentro.com',
        direccion: 'Madero 123',
        ciudad: 'Monterrey',
        estado: 'Nuevo León',
        codigo_postal: '64000',
        contacto_nombre: 'Roberto Hernández',
        contacto_telefono: '81-4321-0987',
        contacto_email: 'roberto.hernandez@ferreteracentro.com',
        estatus: 'activo',
        creado_en: '2024-03-01T00:00:00Z',
        actualizado_en: '2024-03-01T00:00:00Z',
        institucion_id: 'inst-001'
      }
    ]

    // Aplicar filtros si se proporcionan
    if (!filters) return mockProveedores

    return mockProveedores.filter(proveedor => {
      if (filters.nombre && !proveedor.nombre.toLowerCase().includes(filters.nombre.toLowerCase())) {
        return false
      }
      if (filters.rfc && !proveedor.rfc?.includes(filters.rfc)) {
        return false
      }
      if (filters.estatus && proveedor.estatus !== filters.estatus) {
        return false
      }
      if (filters.ciudad && !proveedor.ciudad.toLowerCase().includes(filters.ciudad.toLowerCase())) {
        return false
      }
      if (filters.estado && !proveedor.estado.toLowerCase().includes(filters.estado.toLowerCase())) {
        return false
      }
      return true
    })
  }
}

// Exportar instancia por defecto
export const proveedoresService = new ProveedoresService()
export default proveedoresService