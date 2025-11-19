import type {
  MateriaPrima,
  MateriaPrimaDetail,
  NewMateriaPrima,
  MateriaPrimaUpdate,
  MateriaPrimaFilters,
  MateriaPrimaSearchCriteria,
  LowStockItem,
  StockCheck
} from '../../../../shared/types/materiaPrima'

// Importamos la interfaz existente
import type { ElectronAPI } from '../types/electron'

// Importamos sistema de errores mejorado
import {
  MateriaPrimaError,
  esMateriaPrimaError,
  procesarError
} from '../types/materiaPrimaErrors'

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

  /**
   * Verifica el stock antes de eliminar un material
   */
  private async verificarStockAntesDeEliminar(id: string): Promise<{ stock: number; nombre?: string }> {
    if (!this.api) {
      // Modo desarrollo: mock verification
      console.log('Modo desarrollo: verificando stock antes de eliminar', id)
      return { stock: 25, nombre: 'Material de prueba' } // Simular material con stock
    }

    try {
      const materiales = await this.api.listar()
      const material = materiales.find(item => item.id === id)

      if (!material) {
        throw new Error(`Material con ID ${id} no encontrado`)
      }

      return {
        stock: material.stock_actual,
        nombre: material.nombre
      }
    } catch (error) {
      console.error('Error al verificar stock antes de eliminar:', error)
      // Re-lanzar el error para que sea procesado por el método eliminar
      throw error
    }
  }

  /**
   * Clasifica y procesa errores específicos del servicio
   */
  private procesarErrorServicio(error: unknown, contexto?: { idMaterial?: string; nombreMaterial?: string }): MateriaPrimaError {
    if (esMateriaPrimaError(error)) {
      // Si ya es un MateriaPrimaError, solo actualizar la capa si es necesario
      if (error.layer !== 'service') {
        return {
          ...error,
          layer: 'service',
          timestamp: new Date(),
          correlationId: error.correlationId // Mantener el mismo correlation ID
        }
      }
      return error
    }

    // Convertir Error genérico a MateriaPrimaError
    if (error instanceof Error) {
      const contextoProcesamiento = contexto ? {
        layer: 'service' as const,
        idMaterial: contexto.idMaterial,
        nombreMaterial: contexto.nombreMaterial
      } : { layer: 'service' as const }

      return procesarError(error, contextoProcesamiento.layer)
    }

    // Error desconocido
    return {
      type: 'ERROR_GENERICO',
      message: 'Error desconocido en el servicio',
      userMessage: 'Ha ocurrido un error inesperado',
      suggestedAction: 'Intente nuevamente o contacte soporte técnico',
      severity: 'error',
      timestamp: new Date(),
      layer: 'service',
      correlationId: `serv_err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  // Lista todos los materiales
  async listar(filters?: MateriaPrimaFilters): Promise<MateriaPrima[]> {
    if (!this.api) {
      // Modo desarrollo: datos mock con filtering
      console.log('Modo desarrollo: usando datos mock para listar con filtros', filters)
      return this.applyFiltersToMockData(filters)
    }

    try {
      const materiales = await this.api.listar()

      // Apply comprehensive filtering
      if (filters) {
        return this.filterMateriales(materiales, filters)
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

  // Search by multiple criteria (new method)
  async buscarPorCriterios(criterios: MateriaPrimaSearchCriteria): Promise<MateriaPrima[]> {
    if (!this.api) {
      // Modo desarrollo: búsqueda por criterios mock
      console.log('Modo desarrollo: búsqueda por criterios', criterios)
      return this.filterMateriales(this.getMockData(), {
        nombre: criterios.nombre,
        categoria: criterios.categoria,
        proveedorId: criterios.proveedorId,
        bajoStock: criterios.bajoStock,
        rangoStock: criterios.rangoStock
      })
    }

    try {
      const materiales = await this.api.listar()
      return this.filterMateriales(materiales, {
        nombre: criterios.nombre,
        categoria: criterios.categoria,
        proveedorId: criterios.proveedorId,
        bajoStock: criterios.bajoStock,
        rangoStock: criterios.rangoStock
      })
    } catch (error) {
      console.error('Error en búsqueda por criterios:', error)
      throw new Error('Error al buscar materiales por criterios')
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
      // Modo desarrollo: simular verificación y eliminación
      console.log('Modo desarrollo: intentando eliminar material', id)

      try {
        // Verificar stock antes de eliminar
        const stockResult = await this.verificarStockAntesDeEliminar(id)

        if (stockResult.stock > 0) {
          // Crear error específico de stock disponible
          const error = this.procesarErrorServicio(
            new Error(`No se puede eliminar el material con ${stockResult.stock} unidades en stock`),
            {
              idMaterial: id,
              nombreMaterial: stockResult.nombre
            }
          )
          throw error
        }

        // Simular eliminación exitosa
        return true
      } catch (error) {
        // Procesar y lanzar error específico
        const errorProcesado = this.procesarErrorServicio(error, {
          idMaterial: id,
          nombreMaterial: 'Material de prueba'
        })
        throw errorProcesado
      }
    }

    try {
      // Verificar stock antes de eliminar en producción
      const stockResult = await this.verificarStockAntesDeEliminar(id)

      if (stockResult.stock > 0) {
        // Crear error específico preservando contexto
        const stockError = this.procesarErrorServicio(
          new Error(`No se puede eliminar el material con ${stockResult.stock} unidades en stock`),
          {
            idMaterial: id,
            nombreMaterial: stockResult.nombre
          }
        )
        throw stockError
      }

      // Realizar eliminación
      await this.api.eliminar(id)
      return true

    } catch (error) {
      console.error('Error al eliminar materia prima:', error)

      // Transformar error existente o crear uno nuevo
      if (esMateriaPrimaError(error)) {
        // Si ya es un MateriaPrimaError, asegurarse que esté en la capa correcta
        if (error.layer !== 'service') {
          const errorActualizado = {
            ...error,
            layer: 'service' as const,
            timestamp: new Date()
          }
          throw errorActualizado
        }
        throw error
      }

      // Clasificar y procesar error genérico
      const errorProcesado = this.procesarErrorServicio(error, {
        idMaterial: id,
        nombreMaterial: 'Material desconocido'
      })

      throw errorProcesado
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

  // Add new method for comprehensive filtering
  private filterMateriales(materiales: MateriaPrima[], filters: MateriaPrimaFilters): MateriaPrima[] {
    return materiales.filter(material => {
      // Name filter
      if (filters.nombre && !material.nombre.toLowerCase().includes(filters.nombre.toLowerCase())) {
        return false
      }

      // Barcode filter
      if (filters.codigo_barras && !material.codigo_barras?.includes(filters.codigo_barras)) {
        return false
      }

      // Category filter
      if (filters.categoria && material.categoria !== filters.categoria) {
        return false
      }

      // Provider filter
      if (filters.proveedorId && material.proveedor_id !== filters.proveedorId) {
        return false
      }

      // Low stock filter
      if (filters.bajoStock) {
        const isLowStock = material.stock_actual <= material.stock_minimo
        if (!isLowStock) return false
      }

      // No stock filter
      if (filters.sinStock && material.stock_actual !== 0) {
        return false
      }

      // Stock range filter
      if (filters.rangoStock) {
        if (filters.rangoStock.min !== undefined && material.stock_actual < filters.rangoStock.min) {
          return false
        }
        if (filters.rangoStock.max !== undefined && material.stock_actual > filters.rangoStock.max) {
          return false
        }
      }

      return true
    })
  }

  // Add new method for mock data filtering
  private applyFiltersToMockData(filters?: MateriaPrimaFilters): MateriaPrima[] {
    const mockData = this.getMockData()
    if (!filters) return mockData

    return this.filterMateriales(mockData, filters)
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
      },
      // Add more test data for better filtering validation
      {
        id: '4',
        nombre: 'Alambre de Acero',
        marca: 'AceroStrong',
        modelo: 'Calibre 12',
        categoria: 'Herramientas',
        presentacion: 'Rollo 100m',
        stock_actual: 5,
        stock_minimo: 20,
        codigo_barras: '4567890123456',
        costo_unitario: 15.30,
        fecha_caducidad: null,
        descripcion: 'Alambre de acero para construcción',
        proveedor_id: 'prov-001',
        imagen_url: '',
        creado_en: '2024-01-01T00:00:00Z',
        actualizado_en: '2024-01-01T00:00:00Z'
      },
      {
        id: '5',
        nombre: 'Clavos para Madera',
        marca: 'FixFast',
        modelo: '3 pulgadas',
        categoria: 'Herramientas',
        presentacion: 'Caja 1kg',
        stock_actual: 0,
        stock_minimo: 50,
        codigo_barras: '5678901234567',
        costo_unitario: 12.80,
        fecha_caducidad: null,
        descripcion: 'Clavos galvanizados para madera',
        proveedor_id: 'prov-002',
        imagen_url: '',
        creado_en: '2024-01-01T00:00:00Z',
        actualizado_en: '2024-01-01T00:00:00Z'
      },
      {
        id: '6',
        nombre: 'Pintura Azul Marino',
        marca: 'Sika',
        modelo: 'Latex Exterior',
        categoria: 'Pinturas',
        presentacion: 'Galón 3.78L',
        stock_actual: 8,
        stock_minimo: 15,
        codigo_barras: '6789012345678',
        costo_unitario: 48.50,
        fecha_caducidad: '2025-10-20',
        descripcion: 'Pintura látex exterior color azul marino',
        proveedor_id: 'prov-003',
        imagen_url: '',
        creado_en: '2024-01-01T00:00:00Z',
        actualizado_en: '2024-01-01T00:00:00Z'
      },
      {
        id: '7',
        nombre: 'Tubo PVC',
        marca: 'Pipesol',
        modelo: 'Schedule 40',
        categoria: 'Construcción',
        presentacion: 'Barril 3m',
        stock_actual: 75,
        stock_minimo: 30,
        codigo_barras: '7890123456789',
        costo_unitario: 25.90,
        fecha_caducidad: null,
        descripcion: 'Tubo de PVC para instalaciones sanitarias',
        proveedor_id: 'prov-001',
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