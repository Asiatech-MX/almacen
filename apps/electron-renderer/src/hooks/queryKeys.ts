export const queryKeys = {
  categorias: ['categorias'] as const,
  categoria: (id: string) => ['categorias', id] as const,
  categoriaArbol: (idInstitucion: number) => ['categorias', 'arbol', idInstitucion] as const,
  categoriasPorInstitucion: (idInstitucion: number, soloActivas: boolean) =>
    ['categorias', 'institucion', idInstitucion, soloActivas] as const,
  categoriasPorNivel: ['categorias', 'por-nivel'] as const,
  categoriasBuscar: ['categorias', 'buscar'] as const,
  categoriaRuta: ['categorias', 'ruta'] as const,

  presentaciones: ['presentaciones'] as const,
  presentacion: (id: string) => ['presentaciones', id] as const,
  presentacionesPorInstitucion: (idInstitucion: number, soloActivas: boolean) =>
    ['presentaciones', 'institucion', idInstitucion, soloActivas] as const,
  presentacionPredeterminadas: (idInstitucion: number) => ['presentaciones', 'predeterminadas', idInstitucion] as const,
  presentacionesBuscar: ['presentaciones', 'buscar'] as const,
  presentacionPorNombre: ['presentaciones', 'por-nombre'] as const,
  presentacionesTodas: ['presentaciones', 'todas'] as const,

  materiales: ['materiales'] as const,
  material: (id: string) => ['materiales', id] as const,
  materialesPorInstitucion: (idInstitucion: number) => ['materiales', 'institucion', idInstitucion] as const,
  materialesBajoStock: (idInstitucion: number) => ['materiales', 'bajo-stock', idInstitucion] as const,

  proveedores: ['proveedores'] as const,
  proveedor: (id: string) => ['proveedores', id] as const,

  movimientos: ['movimientos'] as const,
  movimientosPorMaterial: (idMaterial: string) => ['movimientos', 'material', idMaterial] as const,

  solicitudes: ['solicitudes'] as const,
  solicitud: (id: string) => ['solicitudes', id] as const,
  solicitudesPorUsuario: (idUsuario: string) => ['solicitudes', 'usuario', idUsuario] as const,

  usuarios: ['usuarios'] as const,
  usuario: (id: string) => ['usuarios', id] as const,

  instituciones: ['instituciones'] as const,
  institucion: (id: string) => ['instituciones', id] as const,

  aprobaciones: ['aprobaciones'] as const,
  aprobacionesPendientes: (idInstitucion: number) => ['aprobaciones', 'pendientes', idInstitucion] as const,
} as const

// Type helpers para query keys
export type CategoriaQueryKey = ReturnType<
  typeof queryKeys.categoria |
  typeof queryKeys.categoriaArbol |
  typeof queryKeys.categoriasPorNivel |
  typeof queryKeys.categoriasBuscar |
  typeof queryKeys.categoriaRuta
>
export type PresentacionQueryKey = ReturnType<
  typeof queryKeys.presentacion |
  typeof queryKeys.presentacionesPorInstitucion |
  typeof queryKeys.presentacionPredeterminadas |
  typeof queryKeys.presentacionesBuscar |
  typeof queryKeys.presentacionPorNombre |
  typeof queryKeys.presentacionesTodas
>
export type MaterialQueryKey = ReturnType<typeof queryKeys.material | typeof queryKeys.materialesPorInstitucion>
export type ProveedorQueryKey = ReturnType<typeof queryKeys.proveedor>
export type MovimientoQueryKey = ReturnType<typeof queryKeys.movimientosPorMaterial>
export type SolicitudQueryKey = ReturnType<typeof queryKeys.solicitud | typeof queryKeys.solicitudesPorUsuario>
export type UsuarioQueryKey = ReturnType<typeof queryKeys.usuario>
export type InstitucionQueryKey = ReturnType<typeof queryKeys.institucion>
export type AprobacionQueryKey = ReturnType<typeof queryKeys.aprobacionesPendientes>

// Utilidades para invalidar queries relacionadas
export const queryInvalidationPatterns = {
  categorias: (idInstitucion?: number) => {
    const baseQueries = [
      queryKeys.categorias,
      queryKeys.categoriasPorNivel,
      queryKeys.categoriasBuscar,
      queryKeys.categoriaRuta
    ]

    if (idInstitucion) {
      return [
        ...baseQueries,
        queryKeys.categoriasPorInstitucion(idInstitucion, true),
        queryKeys.categoriasPorInstitucion(idInstitucion, false),
        queryKeys.categoriaArbol(idInstitucion)
      ]
    }

    return baseQueries
  },
  categoriaArbol: (idInstitucion: number) => [queryKeys.categoriaArbol(idInstitucion)],
  presentaciones: (idInstitucion?: number) => {
    const baseQueries = [
      queryKeys.presentaciones,
      queryKeys.presentacionesBuscar,
      queryKeys.presentacionPorNombre,
      queryKeys.presentacionesTodas
    ]

    if (idInstitucion) {
      return [
        ...baseQueries,
        queryKeys.presentacionesPorInstitucion(idInstitucion, true),
        queryKeys.presentacionesPorInstitucion(idInstitucion, false),
        queryKeys.presentacionPredeterminadas(idInstitucion)
      ]
    }

    return baseQueries
  },
  materiales: (idInstitucion?: number) => idInstitucion
    ? [queryKeys.materiales, queryKeys.materialesPorInstitucion(idInstitucion)]
    : [queryKeys.materiales],
  proveedores: () => [queryKeys.proveedores],
  movimientos: () => [queryKeys.movimientos],
  solicitudes: () => [queryKeys.solicitudes],
  aprobaciones: (idInstitucion: number) => [queryKeys.aprobaciones, queryKeys.aprobacionesPendientes(idInstitucion)],
} as const