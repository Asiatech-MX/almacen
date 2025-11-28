import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Categoria,
  CategoriaArbol,
  Presentacion,
  NewCategoria,
  NewPresentacion,
  CategoriaUpdate,
  PresentacionUpdate
} from '../../../../packages/shared-types/src/referenceData';

export interface ReferenceDataState {
  categorias: Categoria[];
  categoriasArbol: CategoriaArbol[];
  presentaciones: Presentacion[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

export interface ReferenceDataActions {
  // Categorías
  crearCategoria: (categoria: NewCategoria, idPadre?: string) => Promise<{ success: boolean; data?: Categoria; error?: string }>;
  moverCategoria: (idCategoria: string, nuevoPadreId?: string) => Promise<{ success: boolean; data?: Categoria; error?: string }>;
  editarCategoria: (id: string, cambios: CategoriaUpdate) => Promise<{ success: boolean; data?: Categoria; error?: string }>;
  eliminarCategoria: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Presentaciones
  crearPresentacion: (presentacion: NewPresentacion) => Promise<{ success: boolean; data?: Presentacion; error?: string }>;
  editarPresentacion: (id: string, cambios: PresentacionUpdate) => Promise<{ success: boolean; data?: Presentacion; error?: string }>;
  eliminarPresentacion: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Utilidades
  refrescar: () => Promise<void>;
  getNivelCategoria: (idCategoria: string) => number;
  getCategoriasFlat: (nodos: CategoriaArbol[]) => Categoria[];
}

interface UseReferenceDataOptions {
  idInstitucion: number;
  autoLoad?: boolean;
}

export const useReferenceData = ({
  idInstitucion,
  autoLoad = true
}: UseReferenceDataOptions): ReferenceDataState & { actions: ReferenceDataActions } => {
  const [state, setState] = useState<ReferenceDataState>({
    categorias: [],
    categoriasArbol: [],
    presentaciones: [],
    loading: false,
    error: null,
    initialized: false
  });

  // Cargar datos iniciales
  useEffect(() => {
    if (autoLoad && idInstitucion && !state.initialized) {
      cargarDatosIniciales();
    }
  }, [idInstitucion, autoLoad, state.initialized]);

  const cargarDatosIniciales = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const [categoriasRes, arbolRes, presentacionesRes] = await Promise.all([
        window.electronAPI.categoria.listar(idInstitucion, true),
        window.electronAPI.categoria.listarArbol(idInstitucion, true),
        window.electronAPI.presentacion.listar(idInstitucion, true)
      ]);

      setState(prev => ({
        ...prev,
        categorias: Array.isArray(categoriasRes) ? categoriasRes : [],
        categoriasArbol: Array.isArray(arbolRes) ? arbolRes : [],
        presentaciones: Array.isArray(presentacionesRes) ? presentacionesRes : [],
        loading: false,
        initialized: true
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }));
    }
  };

  // CRUD con optimistic updates
  const crearCategoria = async (categoria: NewCategoria, idPadre?: string) => {
    try {
      // Optimistic update
      const tempCategoria: Categoria = {
        ...categoria,
        id: `temp-${Date.now()}`,
        categoria_padre_id: idPadre,
        nivel: idPadre ? getNivelCategoria(idPadre) + 1 : 1,
        ruta_completa: idPadre ? `${getRutaCategoria(idPadre)} > ${categoria.nombre}` : categoria.nombre,
        activo: true,
        es_predeterminado: false,
        orden: 0,
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString()
      };

      setState(prev => ({
        ...prev,
        categorias: [...prev.categorias, tempCategoria]
      }));

      const result = await window.electronAPI.categoria.crear(categoria, idPadre);

      if (result) {
        // Actualizar con datos reales
        await cargarDatosIniciales();
        return { success: true, data: result };
      } else {
        // Rollback en error
        await cargarDatosIniciales();
        return { success: false, error: 'Error al crear categoría' };
      }
    } catch (error) {
      await cargarDatosIniciales();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  };

  const moverCategoria = async (idCategoria: string, nuevoPadreId?: string) => {
    try {
      const result = await window.electronAPI.categoria.mover(idCategoria, nuevoPadreId);
      if (result) {
        await cargarDatosIniciales(); // Recargar para actualizar jerarquía
        return { success: true, data: result };
      }
      return { success: false, error: 'Error al mover categoría' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  };

  const editarCategoria = async (id: string, cambios: CategoriaUpdate) => {
    try {
      const result = await window.electronAPI.categoria.editar(id, cambios);
      if (result) {
        setState(prev => ({
          ...prev,
          categorias: prev.categorias.map(cat =>
            cat.id === id ? { ...cat, ...cambios, actualizado_en: new Date().toISOString() } : cat
          )
        }));
        return { success: true, data: result };
      }
      return { success: false, error: 'Error al editar categoría' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  };

  const eliminarCategoria = async (id: string) => {
    try {
      const result = await window.electronAPI.categoria.eliminar(id);
      if (result.success) {
        await cargarDatosIniciales(); // Recargar para actualizar jerarquía
      }
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  };

  const crearPresentacion = async (presentacion: NewPresentacion) => {
    try {
      // Optimistic update
      const tempPresentacion: Presentacion = {
        ...presentacion,
        id: `temp-${Date.now()}`,
        activo: true,
        es_predeterminado: false,
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString()
      };

      setState(prev => ({
        ...prev,
        presentaciones: [...prev.presentaciones, tempPresentacion]
      }));

      const result = await window.electronAPI.presentacion.crear(presentacion);

      if (result) {
        // Actualizar con datos reales
        await cargarDatosIniciales();
        return { success: true, data: result };
      } else {
        // Rollback en error
        await cargarDatosIniciales();
        return { success: false, error: 'Error al crear presentación' };
      }
    } catch (error) {
      await cargarDatosIniciales();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  };

  const editarPresentacion = async (id: string, cambios: PresentacionUpdate) => {
    try {
      const result = await window.electronAPI.presentacion.editar(id, cambios);
      if (result) {
        setState(prev => ({
          ...prev,
          presentaciones: prev.presentaciones.map(presentacion =>
            presentacion.id === id ? { ...presentacion, ...cambios, actualizado_en: new Date().toISOString() } : presentacion
          )
        }));
        return { success: true, data: result };
      }
      return { success: false, error: 'Error al editar presentación' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  };

  const eliminarPresentacion = async (id: string) => {
    try {
      const result = await window.electronAPI.presentacion.eliminar(id);
      if (result.success) {
        setState(prev => ({
          ...prev,
          presentaciones: prev.presentaciones.filter(p => p.id !== id)
        }));
      }
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  };

  // Funciones helper
  const getNivelCategoria = useCallback((idCategoria: string): number => {
    const categoria = state.categorias.find(cat => cat.id === idCategoria);
    return categoria?.nivel || 1;
  }, [state.categorias]);

  const getRutaCategoria = useCallback((idCategoria: string): string => {
    const categoria = state.categorias.find(cat => cat.id === idCategoria);
    return categoria?.ruta_completa || '';
  }, [state.categorias]);

  const getCategoriasFlat = useCallback((nodos: CategoriaArbol[]): Categoria[] => {
    return nodos.reduce((acc, nodo) => {
      acc.push(nodo);
      if (nodo.hijos.length > 0) {
        acc.push(...getCategoriasFlat(nodo.hijos));
      }
      return acc;
    }, [] as Categoria[]);
  }, []);

  // Memoizar opciones para optimizar rendimiento
  const categoriasOptions = useMemo(() => {
    return buildGroupedOptions(state.categoriasArbol);
  }, [state.categoriasArbol]);

  // Crear una versión plana de las categorías para value matching
  const categoriasFlatOptions = useMemo(() => {
    return flattenCategories(state.categoriasArbol);
  }, [state.categoriasArbol]);

  const presentacionesOptions = useMemo(() => {
    return state.presentaciones.map(p => ({
      value: p.id.toString(),
      label: `${p.nombre}${p.abreviatura ? ` (${p.abreviatura})` : ''}`,
      data: p,
      searchTerms: [p.nombre, p.abreviatura, p.descripcion].filter(Boolean).join(' ').toLowerCase()
    }));
  }, [state.presentaciones]);

  const actions: ReferenceDataActions = {
    crearCategoria,
    moverCategoria,
    editarCategoria,
    eliminarCategoria,
    crearPresentacion,
    editarPresentacion,
    eliminarPresentacion,
    refrescar: cargarDatosIniciales,
    getNivelCategoria,
    getCategoriasFlat
  };

  return {
    ...state,
    actions,
    // Exponer opciones memorizadas
    categoriasOptions,
    categoriasFlatOptions,
    presentacionesOptions
  };
};

// Helper para construir opciones agrupadas con jerarquía
function buildGroupedOptions(categorias: CategoriaArbol[]): Array<{ label: string; options: Array<{ value: string; label: string; data: Categoria }> }> {
  return categorias.map(categoria => ({
    label: categoria.nombre,
    options: categoria.hijos.length > 0
      ? [
          { value: categoria.id.toString(), label: categoria.nombre, data: categoria },
          ...buildGroupedOptions(categoria.hijos).flatMap(group =>
            group.options.map((opt: any) => ({ ...opt, label: `  ${opt.label}` }))
          )
        ]
      : [{ value: categoria.id.toString(), label: categoria.nombre, data: categoria }]
  }));
}

// Helper para aplanar categorías para value matching
function flattenCategories(categorias: CategoriaArbol[]): Array<{ value: string; label: string; data: Categoria }> {
  return categorias.reduce((acc, categoria) => {
    // Agregar la categoría actual
    acc.push({
      value: categoria.id.toString(),
      label: categoria.nombre,
      data: categoria
    });

    // Recursivamente agregar los hijos
    if (categoria.hijos.length > 0) {
      acc.push(...flattenCategories(categoria.hijos));
    }

    return acc;
  }, [] as Array<{ value: string; label: string; data: Categoria }>);
}

export default useReferenceData;