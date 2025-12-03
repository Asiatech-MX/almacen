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
      console.log('🔄 Recargando datos de referencia...', { idInstitucion, timestamp: new Date().toISOString() });

      const [categoriasRes, arbolRes, presentacionesRes] = await Promise.all([
        window.electronAPI.categoria.listar(idInstitucion, true),
        window.electronAPI.categoria.listarArbol(idInstitucion, true),
        window.electronAPI.presentacion.listar(idInstitucion, true)
      ]);

      console.log('📊 Datos recargados:', {
        categorias: Array.isArray(categoriasRes) ? categoriasRes.length : 0,
        arbol: Array.isArray(arbolRes) ? arbolRes.length : 0,
        presentaciones: Array.isArray(presentacionesRes) ? presentacionesRes.length : 0
      });

      setState(prev => ({
        ...prev,
        categorias: Array.isArray(categoriasRes) ? categoriasRes : [],
        categoriasArbol: Array.isArray(arbolRes) ? arbolRes : [],
        presentaciones: Array.isArray(presentacionesRes) ? presentacionesRes : [],
        loading: false,
        initialized: true
      }));
    } catch (error) {
      console.error('❌ Error al recargar datos de referencia:', error);
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
      const tempId = `temp-${Date.now()}`;
      const tempCategoria: Categoria = {
        ...categoria,
        id: tempId,
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
        // Actualizar el elemento temporal con el ID real
        setState(prev => ({
          ...prev,
          categorias: prev.categorias.map(cat =>
            cat.id === tempId ? { ...result, actualizado_en: new Date().toISOString() } : cat
          )
        }));

        // Recargar datos para actualizar jerarquía y árbol
        await cargarDatosIniciales();
        return { success: true, data: result };
      } else {
        // Rollback en error - remover el elemento temporal
        setState(prev => ({
          ...prev,
          categorias: prev.categorias.filter(cat => cat.id !== tempId)
        }));
        return { success: false, error: 'Error al crear categoría' };
      }
    } catch (error) {
      // Rollback en error - remover el elemento temporal
      setState(prev => ({
        ...prev,
        categorias: prev.categorias.filter(cat => !cat.id.startsWith('temp-'))
      }));
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
      // Logging detallado para debugging
      console.log('🔍 DEBUG editarCategoria:', {
        id,
        idType: typeof id,
        idValue: String(id),
        cambios,
        cambiosKeys: Object.keys(cambios),
        cambiosValues: Object.values(cambios)
      });

      // Asegurar que el ID sea string válido
      const idStr = String(id).trim();
      if (!idStr || idStr === 'undefined' || idStr === 'null') {
        console.error('❌ ID inválido en editarCategoria:', { id, idStr });
        return { success: false, error: 'ID de categoría inválido' };
      }

      console.log('📡 Llamando a window.electronAPI.categoria.editar con:', {
        id: idStr,
        cambios: JSON.parse(JSON.stringify(cambios)), // Deep copy para logging
        timestamp: new Date().toISOString()
      });

      const result = await window.electronAPI.categoria.editar(idStr, cambios);

      console.log('📋 Respuesta de electronAPI.categoria.editar:', {
        result,
        resultType: typeof result,
        timestamp: new Date().toISOString()
      });

      if (result) {
        setState(prev => ({
          ...prev,
          categorias: prev.categorias.map(cat =>
            cat.id === idStr ? { ...cat, ...cambios, actualizado_en: new Date().toISOString() } : cat
          ),
          categoriasArbol: updateCategoriaInTree(prev.categoriasArbol, idStr, cambios)
        }));
        console.log('✅ Estado actualizado exitosamente para categoría:', idStr);
        return { success: true, data: result };
      }
      console.error('❌ El resultado de editar categoría es null/undefined');
      return { success: false, error: 'Error al editar categoría' };
    } catch (error) {
      console.error('💥 Error completo en editarCategoria:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Error desconocido',
        errorStack: error instanceof Error ? error.stack : undefined,
        id,
        cambios,
        timestamp: new Date().toISOString()
      });
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
      const tempId = `temp-${Date.now()}`;
      const tempPresentacion: Presentacion = {
        ...presentacion,
        id: tempId,
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
        // Actualizar el elemento temporal con el ID real
        setState(prev => ({
          ...prev,
          presentaciones: prev.presentaciones.map(p =>
            p.id === tempId ? { ...result, actualizado_en: new Date().toISOString() } : p
          )
        }));
        return { success: true, data: result };
      } else {
        // Rollback en error - remover el elemento temporal
        setState(prev => ({
          ...prev,
          presentaciones: prev.presentaciones.filter(p => p.id !== tempId)
        }));
        return { success: false, error: 'Error al crear presentación' };
      }
    } catch (error) {
      // Rollback en error - remover el elemento temporal
      setState(prev => ({
        ...prev,
        presentaciones: prev.presentaciones.filter(p => !p.id.startsWith('temp-'))
      }));
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  };

  const editarPresentacion = async (id: string, cambios: PresentacionUpdate) => {
    try {
      // Logging para debugging del problema de ID
      console.log('🔍 DEBUG editarPresentacion:', {
        id,
        idType: typeof id,
        idValue: String(id),
        cambios,
        cambiosKeys: Object.keys(cambios)
      });

      // Asegurar que el ID sea string válido
      const idStr = String(id).trim();
      if (!idStr || idStr === 'undefined' || idStr === 'null') {
        console.error('❌ ID inválido en editarPresentacion:', { id, idStr });
        return { success: false, error: 'ID de presentación inválido' };
      }

      const result = await window.electronAPI.presentacion.editar(idStr, cambios);
      if (result) {
        setState(prev => ({
          ...prev,
          presentaciones: prev.presentaciones.map(presentacion =>
            presentacion.id === idStr ? { ...presentacion, ...cambios, actualizado_en: new Date().toISOString() } : presentacion
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

// Helper para actualizar recursivamente una categoría en el árbol
function updateCategoriaInTree(categorias: CategoriaArbol[], targetId: string, cambios: CategoriaUpdate): CategoriaArbol[] {
  return categorias.map(categoria => {
    if (categoria.id === targetId) {
      // Actualizar la categoría encontrada
      return {
        ...categoria,
        ...cambios,
        actualizado_en: new Date().toISOString()
      };
    } else if (categoria.hijos && categoria.hijos.length > 0) {
      // Recursivamente buscar en los hijos
      return {
        ...categoria,
        hijos: updateCategoriaInTree(categoria.hijos, targetId, cambios)
      };
    }
    // Si no es la categoría y no tiene hijos, devolver sin cambios
    return categoria;
  });
}

export default useReferenceData;