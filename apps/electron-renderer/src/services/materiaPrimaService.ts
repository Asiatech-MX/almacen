import type {
  MateriaPrima,
  MateriaPrimaDetail,
  NewMateriaPrima,
  MateriaPrimaUpdate,
  MateriaPrimaFilters,
  LowStockItem,
  StockCheck
} from '@/types/materiaPrima'

// Importamos la interfaz existente
import type { ElectronAPI } from '@/types/electron'

// Helper para determinar si estamos en Electron
const isElectron = (): boolean => {
  return typeof window !== 'undefined' && window.electronAPI !== undefined
}

export class MateriaPrimaService {
  private api: ElectronAPI['materiaPrima'] | null = null

  constructor() {
    if (isElectron()) {
      this.api = window.electronAPI.materiaPrima
    }
  }

  // Lista todos los materiales
  async listar(filters?: MateriaPrimaFilters): Promise<MateriaPrima[]> {
    if (!this.api) {
      // Modo desarrollo: datos mock
      console.log('Modo desarrollo: usando datos mock para listar')
      return this.getMockData()
    }

    try {
      const materiales = await this.api.listar()

      // Aplicar filtros si se proporcionan
      if (filters) {
        return materiales.filter(material => {
          if (filters.nombre && !material.nombre.toLowerCase().includes(filters.nombre.toLowerCase())) {
            return false
          }
          if (filters.codigo_barras && !material.codigo_barras?.includes(filters.codigo_barras)) {
            return false
          }
          if (filters.categoria && material.categoria !== filters.categoria) {
            return false
          }
          return true
        })
      }

      return materiales
    } catch (error) {
      console.error('Error en servicio listar materia prima:', error)
      throw new Error('Error al obtener los materiales')
    }
  }

  // Obtiene un material por ID
  async obtener(id: string): Promise<MateriaPrimaDetail> {
    if (!this.api) {
      // Modo desarrollo: buscar por ID
      console.log('Modo desarrollo: buscando material por ID', id)
      const materiales = this.getMockData()
      const material = materiales.find(item => item.id === id)

      if (!material) {
        throw new Error('Material no encontrado')
      }

      return material as MateriaPrimaDetail
    }

    try {
      const materiales = await this.api.listar()
      const material = materiales.find(item => item.id === id)

      if (!material) {
        throw new Error('Material no encontrado')
      }

      return material as MateriaPrimaDetail
    } catch (error) {
      console.error('Error en servicio obtener materia prima:', error)
      throw new Error('Error al obtener el material')
    }
  }

  // Busca un material por código de barras
  async buscarPorCodigo(codigoBarras: string): Promise<MateriaPrimaDetail> {
    if (!this.api) {
      // Modo desarrollo: buscar por código de barras
      console.log('Modo desarrollo: buscando por código de barras', codigoBarras)
      const materiales = this.getMockData()
      const material = materiales.find(item => item.codigo_barras === codigoBarras)

      if (!material) {
        throw new Error('Material no encontrado con ese código de barras')
      }

      return material as MateriaPrimaDetail
    }

    try {
      const materiales = await this.api.listar()
      const material = materiales.find(item => item.codigo_barras === codigoBarras)

      if (!material) {
        throw new Error('Material no encontrado con ese código de barras')
      }

      return material as MateriaPrimaDetail
    } catch (error) {
      console.error('Error en servicio buscar por código:', error)
      throw new Error('Error al buscar material por código de barras')
    }
  }

  // Obtiene materiales con stock bajo
  async stockBajo(): Promise<LowStockItem[]> {
    if (!this.api) {
      // Modo desarrollo: datos mock de stock bajo
      console.log('Modo desarrollo: obteniendo stock bajo')
      const materiales = this.getMockData()
      return materiales
        .filter(material => material.stock_actual <= material.stock_minimo)
        .map(material => ({
          id: material.id,
          codigo_barras: material.codigo_barras || '',
          nombre: material.nombre,
          marca: material.marca || null,
          presentacion: material.presentacion || 'N/A',
          stock_actual: material.stock_actual,
          stock_minimo: material.stock_minimo,
          categoria: material.categoria || null,
          stock_ratio: material.stock_minimo > 0 ? material.stock_actual / material.stock_minimo : null
        }))
    }

    try {
      const items = await this.api.stockBajo()
      return items
    } catch (error) {
      console.error('Error al obtener stock bajo:', error)
      throw new Error('Error al obtener materiales con stock bajo')
    }
  }

  // Busca materiales por término
  async buscar(searchTerm: string, limit: number = 50): Promise<MateriaPrima[]> {
    if (!this.api) {
      // Modo desarrollo: búsqueda simulada
      console.log('Modo desarrollo: buscando materiales', searchTerm)
      const materiales = this.getMockData()
      return materiales.filter(item =>
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.codigo_barras?.includes(searchTerm) ||
        item.marca?.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, limit)
    }

    try {
      const materiales = await this.api.listar()
      const term = searchTerm.toLowerCase()

      return materiales.filter(item =>
        item.nombre.toLowerCase().includes(term) ||
        item.codigo_barras?.includes(searchTerm) ||
        item.marca?.toLowerCase().includes(term)
      ).slice(0, limit)
    } catch (error) {
      console.error('Error en servicio buscar materia prima:', error)
      throw new Error('Error al buscar materiales')
    }
  }

  // Crea un nuevo material
  async crear(data: NewMateriaPrima, usuarioId?: string): Promise<MateriaPrimaDetail> {
    if (!this.api) {
      // Modo desarrollo: crear mock
      console.log('Modo desarrollo: creando material', data)
      const nuevoMaterial: MateriaPrimaDetail = {
        id: Math.random().toString(36).substring(7),
        nombre: data.nombre || '',
        marca: data.marca || '',
        modelo: data.modelo || '',
        categoria: data.categoria || '',
        stock_actual: data.stock_actual || 0,
        stock_minimo: data.stock_minimo || 0,
        codigo_barras: data.codigo_barras || '',
        costo_unitario: data.costo_unitario || null,
        fecha_caducidad: data.fecha_caducidad || null,
        descripcion: data.descripcion || '',
        proveedor_id: data.proveedor_id || null,
        imagen_url: data.imagen_url || '',
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString()
      }
      return nuevoMaterial
    }

    try {
      const result = await this.api.crear(data)
      return result
    } catch (error) {
      console.error('Error al crear materia prima:', error)
      throw new Error('Error al crear el material')
    }
  }

  // Actualiza un material existente
  async actualizar(id: string, data: MateriaPrimaUpdate, usuarioId?: string): Promise<MateriaPrimaDetail> {
    if (!this.api) {
      // Modo desarrollo: actualizar mock
      console.log('Modo desarrollo: actualizando material', id, data)
      const materiales = this.getMockData()
      const index = materiales.findIndex(item => item.id === id)

      if (index === -1) {
        throw new Error('Material no encontrado')
      }

      const actualizado = { ...materiales[index], ...data }
      return actualizado as MateriaPrimaDetail
    }

    try {
      const result = await this.api.actualizar(id, data)
      return result
    } catch (error) {
      console.error('Error al actualizar materia prima:', error)
      throw new Error('Error al actualizar el material')
    }
  }

  // Elimina un material
  async eliminar(id: string, usuarioId?: string): Promise<boolean> {
    if (!this.api) {
      // Modo desarrollo: eliminar mock
      console.log('Modo desarrollo: eliminando material', id)
      return true
    }

    try {
      await this.api.eliminar(id)
      return true
    } catch (error) {
      console.error('Error al eliminar materia prima:', error)
      throw new Error('Error al eliminar el material')
    }
  }

  // Verifica el stock disponible
  async verificarStock(id: string, cantidad: number): Promise<StockCheck> {
    if (!this.api) {
      // Modo desarrollo: verificar stock mock
      console.log('Modo desarrollo: verificando stock', { id, cantidad })
      return { disponible: true, stock_actual: 100 } as StockCheck
    }

    try {
      const result = await this.api.verificarStock(id, cantidad)
      return result
    } catch (error) {
      console.error('Error al verificar stock:', error)
      throw new Error('Error al verificar stock del material')
    }
  }

  // Actualiza el stock de un material
  async actualizarStock(id: string, cantidad: number, motivo: string, usuarioId?: string): Promise<boolean> {
    if (!this.api) {
      // Modo desarrollo: actualizar stock mock
      console.log('Modo desarrollo: actualizando stock', { id, cantidad, motivo })
      return true
    }

    try {
      await this.api.actualizarStock(id, cantidad, motivo, usuarioId)
      return true
    } catch (error) {
      console.error('Error al actualizar stock:', error)
      throw new Error('Error al actualizar el stock del material')
    }
  }

  // Datos mock para desarrollo
  private getMockData(): MateriaPrima[] {
    return [
      {
        id: '1',
        nombre: 'Cemento Gris',
        marca: 'Holcim',
        modelo: 'Tipo Portland',
        categoria: 'Construcción',
        presentacion: 'Saco 50kg',
        stock_actual: 150,
        stock_minimo: 50,
        codigo_barras: '1234567890123',
        costo_unitario: 125.50,
        fecha_caducidad: '2025-12-31',
        descripcion: 'Cemento Portland de alta resistencia para construcción',
        proveedor_id: 'prov-001',
        imagen_url: '',
        creado_en: '2024-01-01T00:00:00Z',
        actualizado_en: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        nombre: 'Ladrillo Rojo',
        marca: 'Ladrillera',
        modelo: 'Standard',
        categoria: 'Construcción',
        presentacion: 'Pieza',
        stock_actual: 500,
        stock_minimo: 200,
        codigo_barras: '2345678901234',
        costo_unitario: 8.75,
        fecha_caducidad: '2026-06-30',
        descripcion: 'Ladrillo rojo estándar para muros',
        proveedor_id: 'prov-002',
        imagen_url: '',
        creado_en: '2024-01-01T00:00:00Z',
        actualizado_en: '2024-01-01T00:00:00Z'
      },
      {
        id: '3',
        nombre: 'Pintura Blanca',
        marca: 'Sika',
        modelo: 'Latex Interior',
        categoria: 'Pinturas',
        presentacion: 'Galón 3.78L',
        stock_actual: 25,
        stock_minimo: 10,
        codigo_barras: '3456789012345',
        costo_unitario: 45.00,
        fecha_caducidad: '2025-08-15',
        descripcion: 'Pintura látex interior color blanco mate',
        proveedor_id: 'prov-003',
        imagen_url: '',
        creado_en: '2024-01-01T00:00:00Z',
        actualizado_en: '2024-01-01T00:00:00Z'
      }
    ]
  }
}

// Exportar instancia por defecto
export const materiaPrimaService = new MateriaPrimaService()
export default materiaPrimaService