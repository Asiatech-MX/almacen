import type {
  MateriaPrima,
  MateriaPrimaDetail,
  NewMateriaPrima,
  MateriaPrimaUpdate,
  MateriaPrimaFilters
} from '@/types/materiaPrima'

import { materiaPrimaService } from './materiaPrimaService'

// Helper para determinar si estamos en Electron
const isElectron = (): boolean => {
  return typeof window !== 'undefined' && window.electronAPI !== undefined
}

// Tipos para operaciones optimistas
export interface OptimisticUpdate<T> {
  id: string
  operation: 'create' | 'update' | 'delete'
  data?: T
  previousData?: T
  timestamp: number
  pending: boolean
  error?: string
}

// Interfaz para caché
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live en milisegundos
}

export class EnhancedMateriaPrimaService {
  private cache = new Map<string, CacheEntry<any>>()
  private optimisticUpdates = new Map<string, OptimisticUpdate<any>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutos

  constructor() {
    // Limpiar cache expirado cada minuto
    setInterval(() => this.cleanExpiredCache(), 60 * 1000)
  }

  // Lista todos los materiales con caché y optimistic updates (excluye INACTIVO por defecto)
  async listar(filters?: MateriaPrimaFilters, options?: { includeInactive?: boolean }): Promise<MateriaPrima[]> {
    const cacheKey = `materia_prima_listar_${JSON.stringify(filters || {})}_${options?.includeInactive ? 'all' : 'activos'}`

    // Intentar obtener del cache
    const cachedData = this.getFromCache<MateriaPrima[]>(cacheKey)
    if (cachedData && !this.hasPendingUpdates()) {
      console.log('Datos obtenidos desde cache')
      return this.applyOptimisticUpdates(cachedData)
    }

    try {
      const materiales = await materiaPrimaService.listar(filters, options)

      // Guardar en cache
      this.setCache(cacheKey, materiales)

      return this.applyOptimisticUpdates(materiales)
    } catch (error) {
      console.error('Error en servicio listar materia prima:', error)

      // Fallback a cache si existe
      const fallbackData = this.getFromCache<MateriaPrima[]>(cacheKey)
      if (fallbackData) {
        console.log('Usando cache como fallback')
        return this.applyOptimisticUpdates(fallbackData)
      }

      throw new Error('Error al obtener los materiales. Por favor, intente nuevamente.')
    }
  }

  // Lista solo materiales ACTIVOS (para consultas normales)
  async listarSoloActivos(filters?: MateriaPrimaFilters): Promise<MateriaPrima[]> {
    return this.listar(filters, { includeInactive: false })
  }

  // Lista solo materiales INACTIVOS (para módulo de gestión)
  async listarInactivos(filters?: MateriaPrimaFilters): Promise<MateriaPrima[]> {
    const cacheKey = `materia_prima_inactivos_${JSON.stringify(filters || {})}`

    // Intentar obtener del cache
    const cachedData = this.getFromCache<MateriaPrima[]>(cacheKey)
    if (cachedData && !this.hasPendingUpdates()) {
      console.log('Datos inactivos obtenidos desde cache')
      return this.applyOptimisticUpdates(cachedData)
    }

    try {
      const materiales = await materiaPrimaService.listarInactivos(filters)
      this.setCache(cacheKey, materiales)
      return this.applyOptimisticUpdates(materiales)
    } catch (error) {
      console.error('Error al listar materiales inactivos:', error)

      // Fallback a cache si existe
      const fallbackData = this.getFromCache<MateriaPrima[]>(cacheKey)
      if (fallbackData) {
        console.log('Usando cache inactivos como fallback')
        return this.applyOptimisticUpdates(fallbackData)
      }

      throw new Error('Error al obtener materiales inactivos')
    }
  }

  // Obtiene un material por ID con caché
  async obtener(id: string, options?: { includeInactive?: boolean }): Promise<MateriaPrimaDetail> {
    const cacheKey = `materia_prima_obtener_${id}`

    // Intentar obtener del cache
    const cachedData = this.getFromCache<MateriaPrimaDetail>(cacheKey)
    if (cachedData) {
      // Aplicar actualizaciones optimistas si existen
      const optimisticUpdate = this.optimisticUpdates.get(id)
      if (optimisticUpdate && optimisticUpdate.operation === 'update' && optimisticUpdate.data) {
        console.log('Aplicando actualización optimista desde cache')
        return { ...cachedData, ...optimisticUpdate.data }
      }

      console.log('Datos obtenidos desde cache')
      return cachedData
    }

    try {
      const material = await materiaPrimaService.obtener(id, options)
      this.setCache(cacheKey, material)
      return material
    } catch (error) {
      console.error('Error en servicio obtener materia prima:', error)

      // Fallback a cache si existe
      const fallbackData = this.getFromCache<MateriaPrimaDetail>(cacheKey)
      if (fallbackData) {
        console.log('Usando cache como fallback')
        return fallbackData
      }

      throw new Error('Error al obtener el material. Verifique su conexión.')
    }
  }

  // Crear con optimistic update
  async crear(data: NewMateriaPrima, usuarioId?: string): Promise<MateriaPrimaDetail> {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`

    // Crear datos optimistas
    const optimisticData: MateriaPrimaDetail = {
      id: tempId,
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

    // Agregar actualización optimista
    const optimisticUpdate: OptimisticUpdate<MateriaPrimaDetail> = {
      id: tempId,
      operation: 'create',
      data: optimisticData,
      timestamp: Date.now(),
      pending: true
    }

    this.optimisticUpdates.set(tempId, optimisticUpdate)

    // Invalidar cache de lista
    this.invalidateCache('materia_prima_listar_')

    try {
      const result = await materiaPrimaService.crear(data, usuarioId)

      // Remover actualización optimista temporal
      this.optimisticUpdates.delete(tempId)

      // Agregar actualización optimista con ID real
      const realUpdate: OptimisticUpdate<MateriaPrimaDetail> = {
        id: result.id,
        operation: 'create',
        data: result,
        timestamp: Date.now(),
        pending: false
      }

      this.optimisticUpdates.set(result.id, realUpdate)

      // Limpiar cache después de un tiempo
      setTimeout(() => {
        this.optimisticUpdates.delete(result.id)
      }, 2000)

      return result
    } catch (error) {
      console.error('Error al crear materia prima:', error)

      // Marcar error en actualización optimista
      const errorUpdate = this.optimisticUpdates.get(tempId)
      if (errorUpdate) {
        errorUpdate.error = 'Error al crear el material'
        errorUpdate.pending = false
      }

      throw new Error('No se pudo crear el material. Verifique los datos e intente nuevamente.')
    }
  }

  // Actualizar con optimistic update
  async actualizar(id: string, data: MateriaPrimaUpdate, usuarioId?: string): Promise<MateriaPrimaDetail> {
    // Obtener datos anteriores para rollback
    const previousData = await this.obtener(id).catch(() => null)

    // Agregar actualización optimista
    const optimisticUpdate: OptimisticUpdate<MateriaPrimaUpdate> = {
      id,
      operation: 'update',
      data,
      previousData,
      timestamp: Date.now(),
      pending: true
    }

    this.optimisticUpdates.set(id, optimisticUpdate)

    // Invalidar caches
    this.invalidateCache('materia_prima_listar_')
    this.invalidateCache(`materia_prima_obtener_${id}`)

    try {
      const result = await materiaPrimaService.actualizar(id, data, usuarioId)

      // Actualizar estado optimista
      optimisticUpdate.pending = false

      // Limpiar después de un tiempo
      setTimeout(() => {
        this.optimisticUpdates.delete(id)
      }, 2000)

      return result
    } catch (error) {
      console.error('Error al actualizar materia prima:', error)

      // Marcar error
      optimisticUpdate.error = 'Error al actualizar el material'
      optimisticUpdate.pending = false

      throw new Error('No se pudo actualizar el material. Verifique los datos e intente nuevamente.')
    }
  }

  // Eliminar con optimistic update
  async eliminar(id: string, usuarioId?: string): Promise<boolean> {
    // Obtener datos anteriores para rollback
    const previousData = await this.obtener(id).catch(() => null)

    // Agregar actualización optimista
    const optimisticUpdate: OptimisticUpdate<MateriaPrimaDetail> = {
      id,
      operation: 'delete',
      previousData,
      timestamp: Date.now(),
      pending: true
    }

    this.optimisticUpdates.set(id, optimisticUpdate)

    // Invalidar caches
    this.invalidateCache('materia_prima_listar_')
    this.invalidateCache(`materia_prima_obtener_${id}`)
    // Add cache invalidation patterns for inactive materials
    this.invalidateCache('materia_prima_inactivos_') // For inactive materials list
    this.invalidateCache('materia_prima_buscar_')   // For search results containing inactive materials

    try {
      const result = await materiaPrimaService.eliminar(id, usuarioId)

      // Actualizar estado optimista
      optimisticUpdate.pending = false

      // Limpiar después de un tiempo
      setTimeout(() => {
        this.optimisticUpdates.delete(id)
      }, 2000)

      return result
    } catch (error) {
      console.error('Error al eliminar materia prima:', error)

      // Marcar error
      optimisticUpdate.error = 'Error al eliminar el material'
      optimisticUpdate.pending = false

      throw new Error('No se pudo eliminar el material. Intente nuevamente.')
    }
  }

  // Buscar con caché
  async buscar(searchTerm: string, limit: number = 50): Promise<MateriaPrima[]> {
    const cacheKey = `materia_prima_buscar_${searchTerm}_${limit}`

    // Intentar obtener del cache
    const cachedData = this.getFromCache<MateriaPrima[]>(cacheKey)
    if (cachedData) {
      console.log('Búsqueda obtenida desde cache')
      return this.applyOptimisticUpdates(cachedData)
    }

    try {
      const materiales = await materiaPrimaService.buscar(searchTerm, limit)
      this.setCache(cacheKey, materiales)
      return this.applyOptimisticUpdates(materiales)
    } catch (error) {
      console.error('Error en servicio buscar materia prima:', error)

      // Fallback a cache si existe
      const fallbackData = this.getFromCache<MateriaPrima[]>(cacheKey)
      if (fallbackData) {
        console.log('Usando cache como fallback para búsqueda')
        return this.applyOptimisticUpdates(fallbackData)
      }

      throw new Error('Error al buscar materiales. Verifique su conexión.')
    }
  }

  // Obtener materiales con stock bajo
  async getStockBajo(): Promise<MateriaPrima[]> {
    const cacheKey = 'materia_prima_stock_bajo'

    // Intentar obtener del cache (corta duración para datos críticos)
    const cachedData = this.getFromCache<MateriaPrima[]>(cacheKey, 30 * 1000) // 30 segundos
    if (cachedData) {
      console.log('Stock bajo obtenido desde cache')
      return this.applyOptimisticUpdates(cachedData)
    }

    try {
      // Simular llamada al API hasta implementar en materiaPrimaService
      const allMateriales = await this.listar()
      const stockBajo = allMateriales.filter(m => m.stock_actual <= m.stock_minimo)

      this.setCache(cacheKey, stockBajo, 30 * 1000) // Cache corto para datos críticos
      return stockBajo
    } catch (error) {
      console.error('Error al obtener stock bajo:', error)
      throw new Error('Error al verificar stock bajo')
    }
  }

  // Obtener estadísticas (excluye materiales INACTIVO)
  async getEstadisticas(): Promise<{
    total_materiales: number
    valor_total_inventario: number
    materiales_bajo_stock: number
    materiales_agotados: number
    categorias_count: number
    ultimos_movimientos: Array<{
      id: string
      tipo: 'entrada' | 'salida'
      material: string
      cantidad: number
      fecha: string
    }>
  }> {
    try {
      // 🔥 CAMBIO CLAVE: Usar solo materiales ACTIVOS para estadísticas
      const materiales = await this.listarSoloActivos()

      const total_materiales = materiales.length
      const valor_total_inventario = materiales.reduce((sum, m) =>
        sum + ((m.costo_unitario || 0) * m.stock_actual), 0
      )
      const materiales_bajo_stock = materiales.filter(m =>
        m.stock_actual <= m.stock_minimo && m.stock_actual > 0
      ).length
      const materiales_agotados = materiales.filter(m => m.stock_actual === 0).length
      const categorias_count = [...new Set(materiales.map(m => m.categoria))].length

      // Mock de movimientos recientes (hasta implementar servicio de movimientos)
      const ultimos_movimientos = [
        {
          id: '1',
          tipo: 'entrada' as const,
          material: 'Cemento Gris',
          cantidad: 100,
          fecha: new Date().toISOString()
        },
        {
          id: '2',
          tipo: 'salida' as const,
          material: 'Ladrillo Rojo',
          cantidad: 50,
          fecha: new Date(Date.now() - 3600000).toISOString()
        }
      ]

      console.log('📊 Estadísticas calculadas con materiales ACTIVOS:', {
        total_materiales,
        materiales_excluidos: 'INACTIVO',
        valor_total_inventario
      })

      return {
        total_materiales,
        valor_total_inventario,
        materiales_bajo_stock,
        materiales_agotados,
        categorias_count,
        ultimos_movimientos
      }
    } catch (error) {
      console.error('Error al obtener estadísticas:', error)
      throw new Error('Error al obtener estadísticas del inventario')
    }
  }

  // Método de ayuda para aplicar actualizaciones optimistas
  private applyOptimisticUpdates(materiales: MateriaPrima[]): MateriaPrima[] {
    let result = [...materiales]

    this.optimisticUpdates.forEach((update, id) => {
      switch (update.operation) {
        case 'create':
          if (update.data && update.pending) {
            result.push(update.data as MateriaPrima)
          }
          break
        case 'update':
          if (update.data) {
            result = result.map(item =>
              item.id === id ? { ...item, ...update.data } : item
            )
          }
          break
        case 'delete':
          if (update.pending) {
            result = result.filter(item => item.id !== id)
          }
          break
      }
    })

    return result
  }

  // Métodos de caché
  private setCache<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL
    })
  }

  private getFromCache<T>(key: string, customTtl?: number): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    const age = now - entry.timestamp
    const ttl = customTtl || entry.ttl

    if (age > ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  private invalidateCache(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  private cleanExpiredCache(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  private hasPendingUpdates(): boolean {
    for (const update of this.optimisticUpdates.values()) {
      if (update.pending) {
        return true
      }
    }
    return false
  }

  // Retraer todas las actualizaciones optimistas pendientes
  async rollbackPendingUpdates(): Promise<void> {
    const pendingUpdates = Array.from(this.optimisticUpdates.entries())
      .filter(([_, update]) => update.pending)

    for (const [id, update] of pendingUpdates) {
      update.error = 'Operación cancelada'
      update.pending = false

      // Limpiar después de un tiempo
      setTimeout(() => {
        this.optimisticUpdates.delete(id)
      }, 1000)
    }
  }

  // Limpiar cache manualmente
  clearCache(): void {
    this.cache.clear()
  }

  // Invalidar caché contaminado con datos incorrectos (llamar después de cambios en filtros)
  invalidateContaminatedCache(): void {
    console.log('🗑️ Invalidando caché contaminado con materiales INACTIVO...')

    // Invalidar todas las claves que podrían contener datos incorrectos
    const patternsToInvalidate = [
      'materia_prima_listar_', // Listados generales
      'materia_prima_buscar_', // Búsquedas
      'materia_prima_stock_bajo', // Stock bajo
      'materia_prima_obtener_', // Detalles
      'materia_prima_filter_' // Filtros antiguos
    ]

    patternsToInvalidate.forEach(pattern => {
      this.invalidateCache(pattern)
    })

    console.log('✅ Caché invalidado exitosamente')
  }

  // Método de migración forzada para asegurar consistencia
  async migrateToActiveOnlyMode(): Promise<void> {
    console.log('🔄 Migrando a modo SOLO ACTIVOS...')

    // 1. Invalidar caché existente
    this.invalidateContaminatedCache()

    // 2. Forzar recarga de datos activos
    try {
      await this.listarSoloActivos()
      console.log('✅ Migración a modo SOLO ACTIVOS completada')
    } catch (error) {
      console.error('❌ Error en migración:', error)
      throw error
    }
  }

  // Obtener estado del cache y actualizaciones optimistas
  getCacheStatus(): {
    cacheSize: number
    pendingUpdates: number
    cacheKeys: string[]
  } {
    return {
      cacheSize: this.cache.size,
      pendingUpdates: Array.from(this.optimisticUpdates.values())
        .filter(u => u.pending).length,
      cacheKeys: Array.from(this.cache.keys())
    }
  }
}

// Exportar instancia por defecto
export const enhancedMateriaPrimaService = new EnhancedMateriaPrimaService()
export default enhancedMateriaPrimaService