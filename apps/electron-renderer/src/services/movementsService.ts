// Tipos para movimientos
export interface Movement {
  id: string
  tipo: 'entrada' | 'salida'
  material_id: string
  material_nombre: string
  cantidad: number
  motivo: string
  usuario_id: string
  usuario_nombre: string
  fecha_movimiento: string
  creado_en: string
  referencia_id?: string
  lote?: string
  fecha_caducidad?: string
}

export interface NewMovement {
  tipo: 'entrada' | 'salida'
  material_id: string
  cantidad: number
  motivo: string
  usuario_id: string
  referencia_id?: string
  lote?: string
  fecha_caducidad?: string
}

export interface MovementFilters {
  tipo?: 'entrada' | 'salida'
  material_id?: string
  fecha_inicio?: string
  fecha_fin?: string
  usuario_id?: string
}

// Helper para determinar si estamos en Electron
const isElectron = (): boolean => {
  return typeof window !== 'undefined' && window.electronAPI !== undefined
}

export class MovementsService {
  constructor() {
    // Inicialización
  }

  // Lista todos los movimientos
  async listar(filters?: MovementFilters): Promise<Movement[]> {
    if (!isElectron()) {
      // Modo desarrollo: datos mock
      console.log('Modo desarrollo: usando datos mock para movimientos')
      return this.getMockData(filters)
    }

    try {
      // Por ahora, datos mock hasta implementar IPC handlers
      console.log('Modo desarrollo: usando datos mock para movimientos (IPC handler pendiente)')
      return this.getMockData(filters)
    } catch (error) {
      console.error('Error en servicio listar movimientos:', error)
      throw new Error('Error al obtener los movimientos')
    }
  }

  // Obtiene un movimiento por ID
  async obtener(id: string): Promise<Movement> {
    if (!isElectron()) {
      // Modo desarrollo: buscar por ID
      console.log('Modo desarrollo: buscando movimiento por ID', id)
      const movimientos = this.getMockData()
      const movimiento = movimientos.find(item => item.id === id)

      if (!movimiento) {
        throw new Error('Movimiento no encontrado')
      }

      return movimiento
    }

    try {
      // Por ahora, datos mock hasta implementar IPC handlers
      const movimientos = this.getMockData()
      const movimiento = movimientos.find(item => item.id === id)

      if (!movimiento) {
        throw new Error('Movimiento no encontrado')
      }

      return movimiento
    } catch (error) {
      console.error('Error en servicio obtener movimiento:', error)
      throw new Error('Error al obtener el movimiento')
    }
  }

  // Crea un nuevo movimiento
  async crear(data: NewMovement): Promise<Movement> {
    if (!isElectron()) {
      // Modo desarrollo: crear mock
      console.log('Modo desarrollo: creando movimiento', data)
      const nuevoMovimiento: Movement = {
        id: Math.random().toString(36).substring(7),
        tipo: data.tipo,
        material_id: data.material_id,
        material_nombre: `Material ${data.material_id}`, // Mock
        cantidad: data.cantidad,
        motivo: data.motivo,
        usuario_id: data.usuario_id,
        usuario_nombre: `Usuario ${data.usuario_id}`, // Mock
        fecha_movimiento: new Date().toISOString().split('T')[0],
        creado_en: new Date().toISOString(),
        referencia_id: data.referencia_id,
        lote: data.lote,
        fecha_caducidad: data.fecha_caducidad
      }
      return nuevoMovimiento
    }

    try {
      // Por ahora, datos mock hasta implementar IPC handlers
      console.log('Modo desarrollo: creando movimiento (IPC handler pendiente)', data)
      const nuevoMovimiento: Movement = {
        id: Math.random().toString(36).substring(7),
        tipo: data.tipo,
        material_id: data.material_id,
        material_nombre: `Material ${data.material_id}`, // Mock
        cantidad: data.cantidad,
        motivo: data.motivo,
        usuario_id: data.usuario_id,
        usuario_nombre: `Usuario ${data.usuario_id}`, // Mock
        fecha_movimiento: new Date().toISOString().split('T')[0],
        creado_en: new Date().toISOString(),
        referencia_id: data.referencia_id,
        lote: data.lote,
        fecha_caducidad: data.fecha_caducidad
      }
      return nuevoMovimiento
    } catch (error) {
      console.error('Error al crear movimiento:', error)
      throw new Error('Error al crear el movimiento')
    }
  }

  // Obtiene estadísticas de movimientos
  async getEstadisticas(filtro_dias: number = 30): Promise<{
    total_entradas: number
    total_salidas: number
    movimientos_hoy: number
    materiales_mas_movidos: Array<{
      material_id: string
      material_nombre: string
      total_movimientos: number
    }>
  }> {
    try {
      const movimientos = await this.listar()
      const fecha_hoy = new Date().toISOString().split('T')[0]
      const fecha_limite = new Date()
      fecha_limite.setDate(fecha_limite.getDate() - filtro_dias)
      const fecha_limite_str = fecha_limite.toISOString().split('T')[0]

      const movimientos_filtrados = movimientos.filter(m =>
        m.fecha_movimiento >= fecha_limite_str
      )

      const total_entradas = movimientos_filtrados
        .filter(m => m.tipo === 'entrada')
        .reduce((sum, m) => sum + m.cantidad, 0)

      const total_salidas = movimientos_filtrados
        .filter(m => m.tipo === 'salida')
        .reduce((sum, m) => sum + m.cantidad, 0)

      const movimientos_hoy = movimientos.filter(m =>
        m.fecha_movimiento === fecha_hoy
      ).length

      // Materiales más movidos
      const materiales_count = new Map<string, { nombre: string; count: number }>()
      movimientos_filtrados.forEach(movimiento => {
        const current = materiales_count.get(movimiento.material_id) || {
          nombre: movimiento.material_nombre,
          count: 0
        }
        materiales_count.set(movimiento.material_id, {
          ...current,
          count: current.count + 1
        })
      })

      const materiales_mas_movidos = Array.from(materiales_count.entries())
        .map(([material_id, { nombre, count }]) => ({
          material_id,
          material_nombre: nombre,
          total_movimientos: count
        }))
        .sort((a, b) => b.total_movimientos - a.total_movimientos)
        .slice(0, 5)

      return {
        total_entradas,
        total_salidas,
        movimientos_hoy,
        materiales_mas_movidos
      }
    } catch (error) {
      console.error('Error al obtener estadísticas:', error)
      throw new Error('Error al obtener las estadísticas de movimientos')
    }
  }

  // Datos mock para desarrollo
  private getMockData(filters?: MovementFilters): Movement[] {
    const mockMovements: Movement[] = [
      {
        id: '1',
        tipo: 'entrada',
        material_id: '1',
        material_nombre: 'Cemento Gris',
        cantidad: 100,
        motivo: 'Compra a proveedor Holcim',
        usuario_id: 'user-001',
        usuario_nombre: 'Juan Pérez',
        fecha_movimiento: '2024-11-14',
        creado_en: '2024-11-14T10:30:00Z',
        referencia_id: 'PO-001',
        lote: 'LOT-001',
        fecha_caducidad: '2025-12-31'
      },
      {
        id: '2',
        tipo: 'salida',
        material_id: '2',
        material_nombre: 'Ladrillo Rojo',
        cantidad: 50,
        motivo: 'Uso en proyecto A',
        usuario_id: 'user-002',
        usuario_nombre: 'María González',
        fecha_movimiento: '2024-11-14',
        creado_en: '2024-11-14T14:15:00Z',
        referencia_id: 'PROJ-A-001'
      },
      {
        id: '3',
        tipo: 'entrada',
        material_id: '3',
        material_nombre: 'Pintura Blanca',
        cantidad: 25,
        motivo: 'Reposición de inventario',
        usuario_id: 'user-001',
        usuario_nombre: 'Juan Pérez',
        fecha_movimiento: '2024-11-13',
        creado_en: '2024-11-13T09:00:00Z',
        referencia_id: 'REP-001',
        lote: 'LOT-002',
        fecha_caducidad: '2025-08-15'
      },
      {
        id: '4',
        tipo: 'salida',
        material_id: '1',
        material_nombre: 'Cemento Gris',
        cantidad: 20,
        motivo: 'Uso en proyecto B',
        usuario_id: 'user-003',
        usuario_nombre: 'Carlos Rodríguez',
        fecha_movimiento: '2024-11-13',
        creado_en: '2024-11-13T16:45:00Z',
        referencia_id: 'PROJ-B-001'
      },
      {
        id: '5',
        tipo: 'entrada',
        material_id: '2',
        material_nombre: 'Ladrillo Rojo',
        cantidad: 200,
        motivo: 'Compra a proveedor Ladrillera',
        usuario_id: 'user-002',
        usuario_nombre: 'María González',
        fecha_movimiento: '2024-11-12',
        creado_en: '2024-11-12T11:30:00Z',
        referencia_id: 'PO-002',
        lote: 'LOT-003'
      }
    ]

    // Aplicar filtros si se proporcionan
    if (!filters) return mockMovements

    return mockMovements.filter(movimiento => {
      if (filters.tipo && movimiento.tipo !== filters.tipo) return false
      if (filters.material_id && movimiento.material_id !== filters.material_id) return false
      if (filters.usuario_id && movimiento.usuario_id !== filters.usuario_id) return false
      if (filters.fecha_inicio && movimiento.fecha_movimiento < filters.fecha_inicio) return false
      if (filters.fecha_fin && movimiento.fecha_movimiento > filters.fecha_fin) return false
      return true
    })
  }
}

// Exportar instancia por defecto
export const movementsService = new MovementsService()
export default movementsService