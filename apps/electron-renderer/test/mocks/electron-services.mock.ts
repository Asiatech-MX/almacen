import { jest } from '@jest/globals'
import type {
  Categoria,
  NewCategoria,
  CategoriaUpdate,
  Presentacion,
  NewPresentacion,
  PresentacionUpdate
} from '@shared-types/referenceData'

// Mock data factory para generar datos consistentes en tests
export const createMockCategoria = (overrides?: Partial<Categoria>): Categoria => ({
  id: 'cat-1',
  nombre: 'Electricidad',
  nivel: 1,
  activo: true,
  id_institucion: 1,
  id_padre: null,
  fecha_creacion: '2024-01-01T00:00:00.000Z',
  fecha_actualizacion: '2024-01-01T00:00:00.000Z',
  ...overrides
})

export const createMockPresentacion = (overrides?: Partial<Presentacion>): Presentacion => ({
  id: 'pres-1',
  nombre: 'Unidad',
  abreviatura: 'Und',
  activo: true,
  es_predeterminado: true,
  id_institucion: 1,
  fecha_creacion: '2024-01-01T00:00:00.000Z',
  fecha_actualizacion: '2024-01-01T00:00:00.000Z',
  ...overrides
})

// Mock de servicio de categorías con todos los métodos
export class MockCategoriaService {
  private categorias: Categoria[] = [
    createMockCategoria(),
    createMockCategoria({
      id: 'cat-2',
      nombre: 'Plomería',
      nivel: 1
    }),
    createMockCategoria({
      id: 'cat-3',
      nombre: 'Sub Electricidad',
      nivel: 2,
      id_padre: 'cat-1'
    })
  ]

  private nextId = 4

  // Simular delays de red
  private delay(ms = 100): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async listar(idInstitucion: number, soloActivas = true): Promise<Categoria[]> {
    await this.delay()

    let filtered = this.categorias.filter(c => c.id_institucion === idInstitucion)

    if (soloActivas) {
      filtered = filtered.filter(c => c.activo)
    }

    return [...filtered]
  }

  async listarArbol(idInstitucion: number, soloActivas = true): Promise<Categoria[]> {
    await this.delay()

    const categorias = await this.listar(idInstitucion, soloActivas)
    return this.buildTree(categorias)
  }

  async obtener(id: string, includeInactive = false): Promise<Categoria> {
    await this.delay()

    const categoria = this.categorias.find(c => c.id === id)

    if (!categoria) {
      throw new Error(`Categoría con id ${id} no encontrada`)
    }

    if (!includeInactive && !categoria.activo) {
      throw new Error(`Categoría con id ${id} está inactiva`)
    }

    return { ...categoria }
  }

  async crear(categoria: NewCategoria, idPadre?: string, usuarioId?: string): Promise<Categoria> {
    await this.delay()

    const newCategoria: Categoria = {
      ...categoria,
      id: `cat-${this.nextId++}`,
      fecha_creacion: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString(),
      id_padre: idPadre || null
    }

    this.categorias.push(newCategoria)

    return { ...newCategoria }
  }

  async editar(id: string, cambios: CategoriaUpdate, usuarioId?: string): Promise<Categoria> {
    await this.delay()

    const categoriaIndex = this.categorias.findIndex(c => c.id === id)

    if (categoriaIndex === -1) {
      throw new Error(`Categoría con id ${id} no encontrada`)
    }

    this.categorias[categoriaIndex] = {
      ...this.categorias[categoriaIndex],
      ...cambios,
      fecha_actualizacion: new Date().toISOString()
    }

    return { ...this.categorias[categoriaIndex] }
  }

  async eliminar(id: string, forzar = false, usuarioId?: string): Promise<boolean> {
    await this.delay()

    const categoriaIndex = this.categorias.findIndex(c => c.id === id)

    if (categoriaIndex === -1) {
      throw new Error(`Categoría con id ${id} no encontrada`)
    }

    const categoria = this.categorias[categoriaIndex]

    // Verificar dependencias
    const tieneHijos = this.categorias.some(c => c.id_padre === id)

    if (tieneHijos && !forzar) {
      throw new Error('No se puede eliminar una categoría con subcategorías. Use force: true para forzar la eliminación.')
    }

    this.categorias.splice(categoriaIndex, 1)

    return true
  }

  async mover(idCategoria: string, nuevoPadreId: string | null, usuarioId?: string): Promise<Categoria> {
    await this.delay()

    const categoriaIndex = this.categorias.findIndex(c => c.id === idCategoria)

    if (categoriaIndex === -1) {
      throw new Error(`Categoría con id ${idCategoria} no encontrada`)
    }

    // Verificar que no se esté moviendo a sí misma o a un descendiente
    if (nuevoPadreId && this.isDescendant(nuevoPadreId, idCategoria)) {
      throw new Error('No se puede mover una categoría a sí misma o a una subcategoría')
    }

    this.categorias[categoriaIndex].id_padre = nuevoPadreId
    this.categorias[categoriaIndex].fecha_actualizacion = new Date().toISOString()

    return { ...this.categorias[categoriaIndex] }
  }

  async toggleActivo(id: string, activar: boolean, usuarioId?: string): Promise<Categoria> {
    await this.delay()

    return this.editar(id, { activo }, usuarioId)
  }

  async buscar(idInstitucion: number, terminos: string, soloActivas = true): Promise<Categoria[]> {
    await this.delay()

    const categorias = await this.listar(idInstitucion, soloActivas)

    return categorias.filter(c =>
      c.nombre.toLowerCase().includes(terminos.toLowerCase()) ||
      c.descripcion?.toLowerCase().includes(terminos.toLowerCase())
    )
  }

  async verificarDependencias(id: string): Promise<{ tiene_hijos: boolean; tiene_materiales: boolean }> {
    await this.delay()

    const tiene_hijos = this.categorias.some(c => c.id_padre === id)
    // Simular verificación de materiales (en implementación real consultaría la BD)
    const tiene_materiales = Math.random() > 0.8 // 20% de probabilidad de tener materiales

    return { tiene_hijos, tiene_materiales }
  }

  // Métodos helpers internos
  private buildTree(categorias: Categoria[]): Categoria[] {
    const map = new Map<string, Categoria & { hijos: Categoria[] }>()
    const roots: Categoria[] = []

    // Primera pasada: crear mapa con hijos
    categorias.forEach(categoria => {
      map.set(categoria.id, { ...categoria, hijos: [] })
    })

    // Segunda pasada: construir jerarquía
    categorias.forEach(categoria => {
      const node = map.get(categoria.id)!

      if (categoria.id_padre) {
        const parent = map.get(categoria.id_padre)
        if (parent) {
          parent.hijos.push(node)
        }
      } else {
        roots.push(node)
      }
    })

    return roots
  }

  private isDescendant(potentialDescendant: string, ancestor: string): boolean {
    const category = this.categorias.find(c => c.id === potentialDescendant)

    if (!category || !category.id_padre) {
      return false
    }

    if (category.id_padre === ancestor) {
      return true
    }

    return this.isDescendant(category.id_padre, ancestor)
  }

  // Método para resetear el mock entre tests
  reset(): void {
    this.categorias = [
      createMockCategoria(),
      createMockCategoria({ id: 'cat-2', nombre: 'Plomería', nivel: 1 }),
      createMockCategoria({ id: 'cat-3', nombre: 'Sub Electricidad', nivel: 2, id_padre: 'cat-1' })
    ]
    this.nextId = 4
  }

  // Métodos para debugging en tests
  getCategorias(): Categoria[] {
    return [...this.categorias]
  }

  addCategoria(categoria: Categoria): void {
    this.categorias.push(categoria)
  }
}

// Mock de servicio de presentaciones
export class MockPresentacionService {
  private presentaciones: Presentacion[] = [
    createMockPresentacion(),
    createMockPresentacion({
      id: 'pres-2',
      nombre: 'Caja',
      abreviatura: 'Cja',
      es_predeterminado: false
    }),
    createMockPresentacion({
      id: 'pres-3',
      nombre: 'Kilogramo',
      abreviatura: 'Kg',
      es_predeterminado: false
    })
  ]

  private nextId = 4

  private delay(ms = 100): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async listar(idInstitucion: number, soloActivas = true): Promise<Presentacion[]> {
    await this.delay()

    let filtered = this.presentaciones.filter(p => p.id_institucion === idInstitucion)

    if (soloActivas) {
      filtered = filtered.filter(p => p.activo)
    }

    return [...filtered]
  }

  async obtenerPredeterminadas(idInstitucion: number): Promise<Presentacion[]> {
    await this.delay()

    return this.presentaciones.filter(p =>
      p.id_institucion === idInstitucion &&
      p.activo &&
      p.es_predeterminado
    )
  }

  async obtener(id: string, includeInactive = false): Promise<Presentacion> {
    await this.delay()

    const presentacion = this.presentaciones.find(p => p.id === id)

    if (!presentacion) {
      throw new Error(`Presentación con id ${id} no encontrada`)
    }

    if (!includeInactive && !presentacion.activo) {
      throw new Error(`Presentación con id ${id} está inactiva`)
    }

    return { ...presentacion }
  }

  async crear(presentacion: NewPresentacion, usuarioId?: string): Promise<Presentacion> {
    await this.delay()

    const newPresentacion: Presentacion = {
      ...presentacion,
      id: `pres-${this.nextId++}`,
      fecha_creacion: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString(),
      es_predeterminado: presentacion.es_predeterminado || false
    }

    // Si se marca como predeterminada, desmarcar las otras
    if (newPresentacion.es_predeterminado) {
      this.presentaciones.forEach(p => {
        if (p.id_institucion === newPresentacion.id_institucion && p.es_predeterminado) {
          p.es_predeterminado = false
        }
      })
    }

    this.presentaciones.push(newPresentacion)

    return { ...newPresentacion }
  }

  async editar(id: string, cambios: PresentacionUpdate, usuarioId?: string): Promise<Presentacion> {
    await this.delay()

    const presentacionIndex = this.presentaciones.findIndex(p => p.id === id)

    if (presentacionIndex === -1) {
      throw new Error(`Presentación con id ${id} no encontrada`)
    }

    this.presentaciones[presentacionIndex] = {
      ...this.presentaciones[presentacionIndex],
      ...cambios,
      fecha_actualizacion: new Date().toISOString()
    }

    return { ...this.presentaciones[presentacionIndex] }
  }

  async establecerPredeterminada(id: string, idInstitucion: number, usuarioId?: string): Promise<Presentacion> {
    await this.delay()

    // Primero verificar que la presentación existe y pertenece a la institución
    const presentacion = this.presentaciones.find(p => p.id === id && p.id_institucion === idInstitucion)

    if (!presentacion) {
      throw new Error(`Presentación con id ${id} no encontrada en la institución ${idInstitucion}`)
    }

    // Desmarcar todas las demás predeterminadas
    this.presentaciones.forEach(p => {
      if (p.id_institucion === idInstitucion && p.es_predeterminado) {
        p.es_predeterminado = false
      }
    })

    // Marcar la nueva como predeterminada
    presentacion.es_predeterminado = true
    presentacion.fecha_actualizacion = new Date().toISOString()

    return { ...presentacion }
  }

  async eliminar(id: string, forzar = false, usuarioId?: string): Promise<boolean> {
    await this.delay()

    const presentacionIndex = this.presentaciones.findIndex(p => p.id === id)

    if (presentacionIndex === -1) {
      throw new Error(`Presentación con id ${id} no encontrada`)
    }

    const presentacion = this.presentaciones[presentacionIndex]

    // Verificar dependencias
    const tieneMateriales = Math.random() > 0.8 // 20% de probabilidad de tener materiales

    if (tieneMateriales && !forzar) {
      throw new Error('No se puede eliminar una presentación con materiales asociados. Use force: true para forzar la eliminación.')
    }

    this.presentaciones.splice(presentacionIndex, 1)

    return true
  }

  async toggleActivo(id: string, activar: boolean, usuarioId?: string): Promise<Presentacion> {
    await this.delay()

    return this.editar(id, { activo }, usuarioId)
  }

  async buscar(idInstitucion: number, termino: string, soloActivas = true): Promise<Presentacion[]> {
    await this.delay()

    const presentaciones = await this.listar(idInstitucion, soloActivas)

    return presentaciones.filter(p =>
      p.nombre.toLowerCase().includes(termino.toLowerCase()) ||
      p.abreviatura.toLowerCase().includes(termino.toLowerCase())
    )
  }

  async obtenerPorNombre(idInstitucion: number, nombre: string, includeInactive = false): Promise<Presentacion | null> {
    await this.delay()

    const presentacion = this.presentaciones.find(p =>
      p.id_institucion === idInstitucion &&
      p.nombre.toLowerCase() === nombre.toLowerCase()
    )

    if (!presentacion) {
      return null
    }

    if (!includeInactive && !presentacion.activo) {
      return null
    }

    return { ...presentacion }
  }

  async listarTodas(idInstitucion: number): Promise<Presentacion[]> {
    await this.delay()

    return this.presentaciones.filter(p => p.id_institucion === idInstitucion)
  }

  async restaurar(id: string, usuarioId?: string): Promise<Presentacion> {
    await this.delay()

    return this.editar(id, { activo: true }, usuarioId)
  }

  // Métodos para testing
  reset(): void {
    this.presentaciones = [
      createMockPresentacion(),
      createMockPresentacion({ id: 'pres-2', nombre: 'Caja', abreviatura: 'Cja', es_predeterminado: false }),
      createMockPresentacion({ id: 'pres-3', nombre: 'Kilogramo', abreviatura: 'Kg', es_predeterminado: false })
    ]
    this.nextId = 4
  }

  getPresentaciones(): Presentacion[] {
    return [...this.presentaciones]
  }
}

// Instancias globales para los mocks
export const mockCategoriaService = new MockCategoriaService()
export const mockPresentacionService = new MockPresentacionService()

// Helper para configurar los mocks en window.electronAPI
export const setupMockElectronServices = () => {
  const electronAPI = {
    categoria: {
      listar: jest.fn((idInstitucion, soloActivas) =>
        mockCategoriaService.listar(idInstitucion, soloActivas)
      ),
      listarArbol: jest.fn((idInstitucion, soloActivas) =>
        mockCategoriaService.listarArbol(idInstitucion, soloActivas)
      ),
      obtener: jest.fn((id, includeInactive) =>
        mockCategoriaService.obtener(id, includeInactive)
      ),
      crear: jest.fn((categoria, idPadre, usuarioId) =>
        mockCategoriaService.crear(categoria, idPadre, usuarioId)
      ),
      editar: jest.fn((id, cambios, usuarioId) =>
        mockCategoriaService.editar(id, cambios, usuarioId)
      ),
      eliminar: jest.fn((id, forzar, usuarioId) =>
        mockCategoriaService.eliminar(id, forzar, usuarioId)
      ),
      mover: jest.fn((idCategoria, nuevoPadreId, usuarioId) =>
        mockCategoriaService.mover(idCategoria, nuevoPadreId, usuarioId)
      ),
      toggleActivo: jest.fn((id, activar, usuarioId) =>
        mockCategoriaService.toggleActivo(id, activar, usuarioId)
      ),
      buscar: jest.fn((idInstitucion, terminos, soloActivas) =>
        mockCategoriaService.buscar(idInstitucion, terminos, soloActivas)
      ),
      verificarDependencias: jest.fn((id) =>
        mockCategoriaService.verificarDependencias(id)
      ),
    },
    presentacion: {
      listar: jest.fn((idInstitucion, soloActivas) =>
        mockPresentacionService.listar(idInstitucion, soloActivas)
      ),
      obtenerPredeterminadas: jest.fn((idInstitucion) =>
        mockPresentacionService.obtenerPredeterminadas(idInstitucion)
      ),
      obtener: jest.fn((id, includeInactive) =>
        mockPresentacionService.obtener(id, includeInactive)
      ),
      crear: jest.fn((presentacion, usuarioId) =>
        mockPresentacionService.crear(presentacion, usuarioId)
      ),
      editar: jest.fn((id, cambios, usuarioId) =>
        mockPresentacionService.editar(id, cambios, usuarioId)
      ),
      establecerPredeterminada: jest.fn((id, idInstitucion, usuarioId) =>
        mockPresentacionService.establecerPredeterminada(id, idInstitucion, usuarioId)
      ),
      eliminar: jest.fn((id, forzar, usuarioId) =>
        mockPresentacionService.eliminar(id, forzar, usuarioId)
      ),
      toggleActivo: jest.fn((id, activar, usuarioId) =>
        mockPresentacionService.toggleActivo(id, activar, usuarioId)
      ),
      buscar: jest.fn((idInstitucion, termino, soloActivas) =>
        mockPresentacionService.buscar(idInstitucion, termino, soloActivas)
      ),
      obtenerPorNombre: jest.fn((idInstitucion, nombre, includeInactive) =>
        mockPresentacionService.obtenerPorNombre(idInstitucion, nombre, includeInactive)
      ),
      listarTodas: jest.fn((idInstitucion) =>
        mockPresentacionService.listarTodas(idInstitucion)
      ),
      restaurar: jest.fn((id, usuarioId) =>
        mockPresentacionService.restaurar(id, usuarioId)
      ),
    }
  }

  Object.defineProperty(window, 'electronAPI', {
    value: electronAPI,
    writable: true,
  })

  return electronAPI
}

// Exportar datos de prueba para facilitar su uso en tests
export const mockData = {
  categorias: {
    electricidad: createMockCategoria(),
    plomeria: createMockCategoria({ id: 'cat-2', nombre: 'Plomería' }),
    subElectricidad: createMockCategoria({ id: 'cat-3', nombre: 'Sub Electricidad', nivel: 2, id_padre: 'cat-1' })
  },
  presentaciones: {
    unidad: createMockPresentacion(),
    caja: createMockPresentacion({ id: 'pres-2', nombre: 'Caja', abreviatura: 'Cja', es_predeterminado: false }),
    kilogramo: createMockPresentacion({ id: 'pres-3', nombre: 'Kilogramo', abreviatura: 'Kg', es_predeterminado: false })
  }
}