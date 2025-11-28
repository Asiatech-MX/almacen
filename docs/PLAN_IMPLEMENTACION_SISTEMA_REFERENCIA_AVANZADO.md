# 🔄 Plan de Implementación: Sistema Dinámico de Presentaciones y Categorías

## 📋 Resumen Ejecutivo

**Issue**: #8 - Dynamic Database-Driven Presentations and Categories Management
**Objetivo**: Reemplazar arrays hardcodeados en el formulario de materia prima por un sistema dinámico con base de datos que incluya jerarquía, edición inline, y capacidades avanzadas de gestión.
**Alcance**: Enfoque avanzado con categorías jerárquicas, edición inline, e interfaz de administración completa.
**Estimación**: 8-10 días de desarrollo

## 🎯 Análisis del Estado Actual

### Arrays Hardcodeados Identificados
- **Presentaciones (15 items)**: `apps/electron-renderer/src/modules/materiaPrima/Formulario.tsx:33-49`
  - 'Unidad', 'Caja', 'Paquete', 'Saco', 'Bolsa', 'Kilogramo', 'Gramo',
  - 'Litro', 'Mililitro', 'Metro', 'Centímetro', 'Rollo', 'Tubo',
  - 'Botella', 'Frasco'
- **Categorías (13 items)**: `apps/electron-renderer/src/modules/materiaPrima/Formulario.tsx:51-65`
  - 'Construcción', 'Electricidad', 'Plomería', 'Pinturas', 'Herramientas',
  - 'Ferretería', 'Limpieza', 'Oficina', 'Seguridad', 'Jardinería',
  - 'Automotriz', 'Electrónica', 'Otros'

### Estado Actual de la Base de Datos
- `materia_prima.presentacion`: VARCHAR(255) NOT NULL (texto libre)
- `materia_prima.categoria`: VARCHAR(100) (texto libre, nullable)
- Sin restricciones de integridad referencial

### Arquitectura Existente
- **Frontend**: React 19 + React Hook Form + Zod + shadcn/ui
- **Backend**: Electron IPC con patrón Repository + Kysely
- **Base de Datos**: PostgreSQL con multi-tenancy por `id_institucion`

## 🚀 Fase 1: Diseño de Base de Datos Avanzada

### 1.1 Schema de Tablas con Jerarquía

```sql
-- Tabla de Presentaciones (Mejorada)
CREATE TABLE presentacion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    abreviatura VARCHAR(20), -- Para display compacto (ej: "kg", "L", "ud")
    unidad_base VARCHAR(20), -- Unidad base para conversiones (ej: "gramo" para "Kilogramo")
    factor_conversion DECIMAL(10,4), -- Factor para convertir a unidad_base
    activo BOOLEAN DEFAULT true,
    es_predeterminado BOOLEAN DEFAULT false, -- Opción por defecto para nuevas instituciones
    id_institucion INTEGER NOT NULL REFERENCES institucion(id),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(nombre, id_institucion)
);

-- Tabla de Categorías con Jerarquía
CREATE TABLE categoria (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    categoria_padre_id INTEGER REFERENCES categoria(id), -- Auto-referencia para jerarquía
    nivel INTEGER NOT NULL DEFAULT 1, -- Nivel jerárquico (1=raíz, 2=subcategoría, etc.)
    ruta_completa TEXT, -- Path jerárquico: "Construcción > Electricidad > Cableado"
    icono VARCHAR(50), -- Icono para UI (opcional)
    color VARCHAR(7), -- Color hexadecimal para UI (opcional)
    orden INTEGER DEFAULT 0, -- Orden de visualización
    activo BOOLEAN DEFAULT true,
    es_predeterminado BOOLEAN DEFAULT false,
    id_institucion INTEGER NOT NULL REFERENCES institucion(id),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(nombre, id_institucion, categoria_padre_id)
);

-- Índices Optimizados
CREATE INDEX idx_presentaciones_institucion_activas ON presentacion(id_institucion, activo) WHERE activo = true;
CREATE INDEX idx_categorias_institucion_activas ON categoria(id_institucion, activo) WHERE activo = true;
CREATE INDEX idx_categorias_jerarquia ON categoria(categoria_padre_id, nivel);
CREATE INDEX idx_categorias_orden ON categoria(id_institucion, nivel, orden);
```

### 1.2 Actualización de Tabla Existente

```sql
-- Migración progresiva con backward compatibility
ALTER TABLE materia_prima
ADD COLUMN presentacion_id INTEGER REFERENCES presentacion(id),
ADD COLUMN categoria_id INTEGER REFERENCES categoria(id);

-- Mantener campos originales durante transición
-- ALTER TABLE materia_prima DROP COLUMN presentacion; -- (Ejecutar después de migrar datos)
-- ALTER TABLE materia_prima DROP COLUMN categoria;   -- (Ejecutar después de migrar datos)
```

### 1.3 Triggers para Integridad

```sql
-- Trigger para mantener ruta_completa actualizada
CREATE OR REPLACE FUNCTION actualizar_ruta_categoria()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.categoria_padre_id IS NULL THEN
            NEW.ruta_completa = NEW.nombre;
            NEW.nivel = 1;
        ELSE
            SELECT ruta_completa || ' > ' || NEW.nombre, nivel + 1
            INTO NEW.ruta_completa, NEW.nivel
            FROM categoria WHERE id = NEW.categoria_padre_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_ruta_categoria
    BEFORE INSERT OR UPDATE ON categoria
    FOR EACH ROW EXECUTE FUNCTION actualizar_ruta_categoria();
```

## 🚀 Fase 2: Backend Avanzado con IPC

### 2.1 Repository Layer con Jerarquía

```typescript
// backend/repositories/categoriaRepo.ts
export class CategoriaRepository extends BaseRepository<Categoria> {
  // Listar categorías con jerarquía completa
  async listarArbol(idInstitucion: number): Promise<CategoriaArbol[]> {
    // Implementar consulta recursiva con CTE
    const query = this.db
      .withRecursive('categoria_arbol', (qb) => {
        return qb
          .selectFrom('categoria')
          .where('categoria.id_institucion', '=', idInstitucion)
          .where('categoria.activo', '=', true)
          .where('categoria.categoria_padre_id', 'is', null)
          .selectAll('categoria')
          .union((eb) =>
            eb
              .selectFrom('categoria as c')
              .innerJoin('categoria_arbol as ca', 'c.categoria_padre_id', 'ca.id')
              .where('c.activo', '=', true)
              .selectAll('c')
          );
      })
      .selectFrom('categoria_arbol')
      .selectAll();

    return query.execute();
  }

  // Crear categoría con validación de jerarquía
  async crearConJerarquia(categoria: NewCategoria, idPadre?: number): Promise<Categoria> {
    // Validar límite de niveles (máximo 4)
    if (idPadre) {
      const padre = await this.findById(idPadre);
      if (padre && padre.nivel >= 4) {
        throw new Error('No se pueden crear subcategorías de nivel 4 o superior');
      }
    }

    return this.crear({
      ...categoria,
      categoria_padre_id: idPadre,
      nivel: idPadre ? (await this.getNivelPadre(idPadre)) + 1 : 1
    });
  }

  // Mover categoría en jerarquía
  async moverCategoria(id: number, nuevoPadreId?: number): Promise<Categoria> {
    // Validar que no se mueva a sí misma o a sus descendientes
    if (nuevoPadreId && await this.esDescendiente(nuevoPadreId, id)) {
      throw new Error('No se puede mover una categoría a sí misma o a sus descendientes');
    }

    return this.actualizar(id, { categoria_padre_id: nuevoPadreId });
  }
}
```

### 2.2 IPC Handlers Avanzados

```typescript
// apps/electron-main/src/main/ipc/categoria.ts
export const setupCategoriaHandlers = () => {
  ipcMain.handle('categoria:listar', async (_, { idInstitucion, soloActivas = true }) => {
    try {
      const categorias = await categoriaRepository.listarPorInstitucion(
        idInstitucion,
        soloActivas
      );
      return { success: true, data: categorias };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('categoria:listarArbol', async (_, { idInstitucion }) => {
    try {
      const arbol = await categoriaRepository.listarArbol(idInstitucion);
      return { success: true, data: arbol };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('categoria:crear', async (_, { categoria, idPadre }) => {
    try {
      const nuevaCategoria = await categoriaRepository.crearConJerarquia(
        categoria,
        idPadre
      );

      // Log de auditoría
      logAuditoria('categoria_creada', {
        id: nuevaCategoria.id,
        nombre: nuevaCategoria.nombre,
        idPadre
      });

      return { success: true, data: nuevaCategoria };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('categoria:mover', async (_, { idCategoria, nuevoPadreId }) => {
    try {
      const categoriaActualizada = await categoriaRepository.moverCategoria(
        idCategoria,
        nuevoPadreId
      );

      logAuditoria('categoria_movida', {
        id: idCategoria,
        nuevoPadreId
      });

      return { success: true, data: categoriaActualizada };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('categoria:editar', async (_, { id, cambios }) => {
    try {
      const categoriaActualizada = await categoriaRepository.actualizar(id, cambios);

      logAuditoria('categoria_editada', {
        id,
        cambios
      });

      return { success: true, data: categoriaActualizada };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
};
```

### 2.3 Preload API Extendida

```typescript
// apps/electron-main/src/preload/index.ts
contextBridge.exposeInMainWorld('electronAPI', {
  // APIs existentes...

  // APIs avanzadas de categorías con jerarquía
  categoria: {
    listar: (idInstitucion: number, soloActivas?: boolean) =>
      ipcRenderer.invoke('categoria:listar', { idInstitucion, soloActivas }),

    listarArbol: (idInstitucion: number) =>
      ipcRenderer.invoke('categoria:listarArbol', { idInstitucion }),

    crear: (categoria: NewCategoria, idPadre?: number) =>
      ipcRenderer.invoke('categoria:crear', { categoria, idPadre }),

    mover: (idCategoria: number, nuevoPadreId?: number) =>
      ipcRenderer.invoke('categoria:mover', { idCategoria, nuevoPadreId }),

    editar: (id: number, cambios: CategoriaUpdate) =>
      ipcRenderer.invoke('categoria:editar', { id, cambios }),

    eliminar: (id: number) =>
      ipcRenderer.invoke('categoria:eliminar', id)
  },

  // APIs avanzadas de presentaciones
  presentacion: {
    listar: (idInstitucion: number, soloActivas?: boolean) =>
      ipcRenderer.invoke('presentacion:listar', { idInstitucion, soloActivas }),

    crear: (presentacion: NewPresentacion) =>
      ipcRenderer.invoke('presentacion:crear', { presentacion }),

    editar: (id: number, cambios: PresentacionUpdate) =>
      ipcRenderer.invoke('presentacion:editar', { id, cambios }),

    eliminar: (id: number) =>
      ipcRenderer.invoke('presentacion:eliminar', id),

    obtenerPredeterminadas: () =>
      ipcRenderer.invoke('presentacion:obtenerPredeterminadas')
  }
});
```

## 🚀 Fase 3: Tipos Compartidos Avanzados

### 3.1 TypeScript Interfaces

```typescript
// packages/shared-types/src/referenceData.ts
export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
  categoria_padre_id?: string;
  nivel: number;
  ruta_completa: string;
  icono?: string;
  color?: string;
  orden: number;
  activo: boolean;
  es_predeterminado: boolean;
  id_institucion: number;
  creado_en: string;
  actualizado_en: string;
  hijos?: Categoria[]; // Para renderizado de árbol
}

export interface CategoriaArbol extends Categoria {
  hijos: CategoriaArbol[];
  profundidad: number;
}

export interface Presentacion {
  id: string;
  nombre: string;
  descripcion?: string;
  abreviatura?: string;
  unidad_base?: string;
  factor_conversion?: number;
  activo: boolean;
  es_predeterminado: boolean;
  id_institucion: number;
  creado_en: string;
  actualizado_en: string;
}

export interface NewCategoria {
  nombre: string;
  descripcion?: string;
  icono?: string;
  color?: string;
  orden?: number;
  id_institucion: number;
}

export interface NewPresentacion {
  nombre: string;
  descripcion?: string;
  abreviatura?: string;
  unidad_base?: string;
  factor_conversion?: number;
  id_institucion: number;
}

// Tipos para operaciones de jerarquía
export interface OperacionMoverCategoria {
  idCategoria: string;
  nuevoPadreId?: string;
}

export interface OperacionReordenarCategorias {
  categorias: Array<{ id: string; orden: number }>;
}
```

### 3.2 Esquemas Zod Avanzados

```typescript
const CategoriaSchema = z.object({
  nombre: z.string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  descripcion: z.string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .nullable()
    .optional(),
  categoria_padre_id: z.string()
    .uuid('ID de categoría padre inválido')
    .nullable()
    .optional(),
  icono: z.string()
    .max(50, 'El icono no puede exceder 50 caracteres')
    .nullable()
    .optional(),
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color debe ser hexadecimal (#RRGGBB)')
    .nullable()
    .optional(),
  orden: z.number()
    .int('El orden debe ser un entero')
    .min(0, 'El orden debe ser positivo')
    .default(0),
  id_institucion: z.number()
    .positive('La institución es requerida')
});

const PresentacionSchema = z.object({
  nombre: z.string()
    .min(1, 'El nombre es requerido')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  descripcion: z.string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .nullable()
    .optional(),
  abreviatura: z.string()
    .max(20, 'La abreviatura no puede exceder 20 caracteres')
    .nullable()
    .optional(),
  unidad_base: z.string()
    .max(20, 'La unidad base no puede exceder 20 caracteres')
    .nullable()
    .optional(),
  factor_conversion: z.number()
    .positive('El factor de conversión debe ser positivo')
    .nullable()
    .optional(),
  id_institucion: z.number()
    .positive('La institución es requerida')
});
```

## 🚀 Fase 4: Frontend Avanzado con Componentes Jerárquicos

### 4.1 Hook Personalizado Avanzado

```typescript
// apps/electron-renderer/src/hooks/useReferenceData.ts
export const useReferenceData = ({ idInstitucion, autoLoad = true }) => {
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
  }, [idInstitucion, autoLoad]);

  const cargarDatosIniciales = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const [categoriasRes, arbolRes, presentacionesRes] = await Promise.all([
        window.electronAPI.categoria.listar(idInstitucion, true),
        window.electronAPI.categoria.listarArbol(idInstitucion),
        window.electronAPI.presentacion.listar(idInstitucion, true)
      ]);

      setState(prev => ({
        ...prev,
        categorias: categoriasRes.success ? categoriasRes.data : [],
        categoriasArbol: arbolRes.success ? arbolRes.data : [],
        presentaciones: presentacionesRes.success ? presentacionesRes.data : [],
        loading: false,
        initialized: true
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  // CRUD con optimistic updates
  const crearCategoria = async (categoria: NewCategoria, idPadre?: string) => {
    try {
      // Optimistic update
      const tempCategoria = {
        ...categoria,
        id: `temp-${Date.now()}`,
        nivel: idPadre ? (getNivelCategoria(idPadre) + 1) : 1,
        categoria_padre_id: idPadre,
        activo: true,
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString()
      };

      setState(prev => ({
        ...prev,
        categorias: [...prev.categorias, tempCategoria]
      }));

      const result = await window.electronAPI.categoria.crear(categoria, idPadre);

      if (result.success) {
        // Actualizar con datos reales
        await cargarDatosIniciales();
        return { success: true, data: result.data };
      } else {
        // Rollback en error
        await cargarDatosIniciales();
        return { success: false, error: result.error };
      }
    } catch (error) {
      await cargarDatosIniciales();
      return { success: false, error: error.message };
    }
  };

  const moverCategoria = async (idCategoria: string, nuevoPadreId?: string) => {
    const result = await window.electronAPI.categoria.mover(idCategoria, nuevoPadreId);
    if (result.success) {
      await cargarDatosIniciales(); // Recargar para actualizar jerarquía
    }
    return result;
  };

  const editarCategoria = async (id: string, cambios: Partial<Categoria>) => {
    const result = await window.electronAPI.categoria.editar(id, cambios);
    if (result.success) {
      setState(prev => ({
        ...prev,
        categorias: prev.categorias.map(cat =>
          cat.id === id ? { ...cat, ...cambios } : cat
        )
      }));
    }
    return result;
  };

  // Funciones helper
  const getNivelCategoria = (idCategoria: string): number => {
    const categoria = state.categorias.find(cat => cat.id === idCategoria);
    return categoria?.nivel || 1;
  };

  const getCategoriasFlat = (nodos: CategoriaArbol[]): Categoria[] => {
    return nodos.reduce((acc, nodo) => {
      acc.push(nodo);
      if (nodo.hijos.length > 0) {
        acc.push(...getCategoriasFlat(nodo.hijos));
      }
      return acc;
    }, [] as Categoria[]);
  };

  return {
    ...state,
    actions: {
      crearCategoria,
      moverCategoria,
      editarCategoria,
      crearPresentacion,
      editarPresentacion,
      eliminarCategoria,
      eliminarPresentacion,
      refrescar: cargarDatosIniciales,
      getNivelCategoria,
      getCategoriasFlat
    }
  };
};
```

### 4.2 Componente DynamicSelect Avanzado

```typescript
// apps/electron-renderer/src/components/ui/DynamicSelect.tsx
import Select, { CreatableSelect, GroupBase } from 'react-select';
import { Controller } from 'react-hook-form';

interface DynamicSelectProps {
  control: Control<any>;
  name: string;
  label: string;
  type: 'categoria' | 'presentacion';
  placeholder?: string;
  creatable?: boolean;
  allowEdit?: boolean;
  onEdit?: (item: any) => void;
  onMove?: (id: string, nuevoPadreId?: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export const DynamicSelect: React.FC<DynamicSelectProps> = ({
  control,
  name,
  label,
  type,
  placeholder = `Seleccionar ${label}...`,
  creatable = true,
  allowEdit = false,
  onEdit,
  onMove,
  disabled = false,
  required = false,
  className
}) => {
  const { categoriasArbol, presentaciones, loading, actions } = useReferenceData({
    idInstitucion: CURRENT_INSTITUTION_ID
  });

  // Opciones con jerarquía para categorías
  const categoriasOptions = useMemo(() => {
    if (type === 'categoria') {
      return buildGroupedOptions(categoriasArbol);
    }
    return [];
  }, [type, categoriasArbol]);

  // Opciones para presentaciones
  const presentacionesOptions = useMemo(() => {
    if (type === 'presentacion') {
      return presentaciones.map(p => ({
        value: p.id,
        label: `${p.nombre}${p.abreviatura ? ` (${p.abreviatura})` : ''}`,
        data: p
      }));
    }
    return [];
  }, [type, presentaciones]);

  const options = type === 'categoria' ? categoriasOptions : presentacionesOptions;

  const handleCreateOption = async (inputValue: string) => {
    const nuevoItem = {
      nombre: inputValue.trim(),
      id_institucion: CURRENT_INSTITUTION_ID
    };

    if (type === 'categoria') {
      const result = await actions.crearCategoria(nuevoItem);
      return result.success ? result.data.id : null;
    } else {
      const result = await actions.crearPresentacion(nuevoItem);
      return result.success ? result.data.id : null;
    }
  };

  const customComponents = {
    Option: ({ children, ...props }: any) => {
      if (props.data.__isGroup__) {
        return (
          <div style={{ fontWeight: 'bold', padding: '8px 12px', backgroundColor: '#f5f5f5' }}>
            {props.data.label}
          </div>
        );
      }

      return (
        <components.Option {...props}>
          <div className="flex items-center justify-between">
            <span>{children}</span>
            {allowEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(props.data.data);
                }}
                className="ml-2 p-1 text-blue-600 hover:bg-blue-50 rounded"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </components.Option>
      );
    }
  };

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={className}>
          <FormLabel>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </FormLabel>
          <FormControl>
            {creatable ? (
              <CreatableSelect
                {...field}
                options={options}
                onCreateOption={handleCreateOption}
                components={customComponents}
                placeholder={placeholder}
                isDisabled={disabled || loading}
                isLoading={loading}
                className="react-select-container"
                classNamePrefix="react-select"
                styles={customSelectStyles}
                formatCreateLabel={(inputValue) => `Crear "${inputValue}"`}
              />
            ) : (
              <Select
                {...field}
                options={options}
                components={customComponents}
                placeholder={placeholder}
                isDisabled={disabled || loading}
                isLoading={loading}
                className="react-select-container"
                classNamePrefix="react-select"
                styles={customSelectStyles}
              />
            )}
          </FormControl>
          {fieldState.error && (
            <FormMessage>{fieldState.error.message}</FormMessage>
          )}
        </FormItem>
      )}
    />
  );
};

// Helper para construir opciones agrupadas con jerarquía
const buildGroupedOptions = (categorias: CategoriaArbol[]): GroupBase<any>[] => {
  return categorias.map(categoria => ({
    label: categoria.nombre,
    options: categoria.hijos.length > 0
      ? [
          { value: categoria.id, label: categoria.nombre, data: categoria, __isGroup__: false },
          ...buildGroupedOptions(categoria.hijos).flatMap(group =>
            typeof group === 'object' && 'options' in group
              ? group.options.map((opt: any) => ({ ...opt, __isGroup__: false, label: `  ${opt.label}` }))
              : [{ ...group, __isGroup__: false, label: `  ${group.label}` }]
          )
        ]
      : [{ value: categoria.id, label: categoria.nombre, data: categoria, __isGroup__: false }]
  }));
};
```

### 4.3 Componente de Administración

```typescript
// apps/electron-renderer/src/modules/admin/CategoriaManager.tsx
export const CategoriaManager: React.FC = () => {
  const { categoriasArbol, loading, actions } = useReferenceData({
    idInstitucion: CURRENT_INSTITUTION_ID
  });

  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null);
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [draggedItem, setDraggedItem] = useState<Categoria | null>(null);

  const handleDragStart = (categoria: Categoria) => {
    setDraggedItem(categoria);
  };

  const handleDrop = async (targetCategoria: Categoria) => {
    if (draggedItem && draggedItem.id !== targetCategoria.id) {
      await actions.moverCategoria(draggedItem.id, targetCategoria.id);
    }
    setDraggedItem(null);
  };

  const handleCrearCategoria = async (categoria: NewCategoria, idPadre?: string) => {
    const result = await actions.crearCategoria(categoria, idPadre);
    if (result.success) {
      setMostrarModalCrear(false);
      toast.success('Categoría creada exitosamente');
    } else {
      toast.error(result.error);
    }
  };

  const renderCategoriaNode = (categoria: CategoriaArbol, nivel: number = 0) => {
    const isDragging = draggedItem?.id === categoria.id;

    return (
      <div
        key={categoria.id}
        className={cn(
          "border rounded-lg p-3 mb-2 bg-white",
          "hover:shadow-md transition-shadow",
          isDragging && "opacity-50",
          nivel > 0 && "ml-6"
        )}
        draggable
        onDragStart={() => handleDragStart(categoria)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => handleDrop(categoria)}
        style={{ marginLeft: `${nivel * 24}px` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
            {categoria.icono && <span>{categoria.icono}</span>}
            <span className="font-medium">{categoria.nombre}</span>
            <span className="text-sm text-gray-500">
              ({categoria.hijos.length} subcategorías)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCategoriaEditando(categoria)}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMostrarModalCrear({ idPadre: categoria.id })}
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={() => handleEliminarCategoria(categoria.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {categoria.descripcion && (
          <p className="text-sm text-gray-600 mt-1">{categoria.descripcion}</p>
        )}

        {categoria.hijos.length > 0 && (
          <div className="mt-3">
            {categoria.hijos.map(hijo => renderCategoriaNode(hijo, nivel + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Categorías</h1>
        <Button onClick={() => setMostrarModalCrear(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Categoría
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estructura Jerárquica</CardTitle>
          <CardDescription>
            Arrastra y suelta categorías para reorganizar la jerarquía.
            Las categorías se anidan visualmente según su nivel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categoriasArbol.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay categorías configuradas.
              <Button
                variant="link"
                onClick={() => setMostrarModalCrear(true)}
              >
                Crear primera categoría
              </Button>
            </div>
          ) : (
            categoriasArbol.map(categoria => renderCategoriaNode(categoria))
          )}
        </CardContent>
      </Card>

      {/* Modales */}
      {mostrarModalCrear && (
        <CategoriaCrearModal
          categoriasPadre={categoriasArbol}
          onClose={() => setMostrarModalCrear(false)}
          onCrear={handleCrearCategoria}
          idPadrePreseleccionado={typeof mostrarModalCrear === 'object' ? mostrarModalCrear.idPadre : undefined}
        />
      )}

      {categoriaEditando && (
        <CategoriaEditarModal
          categoria={categoriaEditando}
          onClose={() => setCategoriaEditando(null)}
          onEditar={async (cambios) => {
            const result = await actions.editarCategoria(categoriaEditando.id, cambios);
            if (result.success) {
              setCategoriaEditando(null);
              toast.success('Categoría actualizada');
            } else {
              toast.error(result.error);
            }
          }}
        />
      )}
    </div>
  );
};
```

## 🚀 Fase 5: Integración del Formulario Materia Prima

### 5.1 Actualización del Schema Zod

```typescript
// apps/electron-renderer/src/modules/materiaPrima/Formulario.tsx
const materiaPrimaSchema = z.object({
  // ... otros campos existentes

  // Reemplazar campos de texto por IDs
  presentacion_id: z.string()
    .min(1, 'La presentación es requerida')
    .uuid('ID de presentación inválido'),

  categoria_id: z.string()
    .uuid('ID de categoría inválido')
    .optional(),

  // Mantener compatibilidad durante migración
  presentacion: z.string().optional(), // Para backward compatibility
  categoria: z.string().optional()      // Para backward compatibility
});

// Lógica de validación personalizada
const materiaPrimaSchemaConMigracion = materiaPrimaSchema.superRefine((data, ctx) => {
  // Durante la migración, aceptar texto o ID
  if (!data.presentacion_id && !data.presentacion) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'La presentación es requerida',
      path: ['presentacion_id']
    });
  }
});
```

### 5.2 Integración de DynamicSelect

```typescript
// apps/electron-renderer/src/modules/materiaPrima/Formulario.tsx
export const FormularioMateriaPrima: React.FC<FormularioProps> = ({
  material,
  onSubmit,
  isLoading = false
}) => {
  const form = useForm<MateriaPrimaFormData>({
    resolver: zodResolver(materiaPrimaSchemaConMigracion),
    defaultValues: {
      ...material,
      presentacion_id: material?.presentacion_id || '',
      categoria_id: material?.categoria_id || '',
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FieldSet>
          <Legend className="text-base font-medium">Información Básica</Legend>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* ... otros campos existentes */}

            {/* Reemplazar Select de presentación hardcoded */}
            <DynamicSelect
              control={form.control}
              name="presentacion_id"
              label="Presentación"
              type="presentacion"
              creatable={true}
              allowEdit={true}
              required={true}
              onEdit={(presentacion) => {
                // Abrir modal de edición inline
                setPresentacionEditando(presentacion);
              }}
            />

            {/* Reemplazar Select de categoría hardcoded */}
            <DynamicSelect
              control={form.control}
              name="categoria_id"
              label="Categoría"
              type="categoria"
              creatable={true}
              allowEdit={true}
              placeholder="Seleccionar categoría..."
              onEdit={(categoria) => {
                // Abrir modal de edición inline
                setCategoriaEditando(categoria);
              }}
              onMove={async (idCategoria, nuevoPadreId) => {
                // Mover categoría en jerarquía
                const result = await moveCategoriaEnJerarquia(idCategoria, nuevoPadreId);
                if (result.success) {
                  toast.success('Categoría movida exitosamente');
                  // Refrescar opciones del select
                  refrescarCategorias();
                } else {
                  toast.error(result.error);
                }
              }}
            />
          </div>
        </FieldSet>

        {/* ... resto del formulario */}
      </form>
    </Form>
  );
};
```

### 5.3 Componente de Edición Inline

```typescript
// apps/electron-renderer/src/components/ui/InlineEditModal.tsx
export const InlineEditModal: React.FC<InlineEditModalProps> = ({
  isOpen,
  onClose,
  item,
  type,
  onSave
}) => {
  const [formData, setFormData] = useState(item || {});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await onSave(formData);
      if (result.success) {
        onClose();
        toast.success(`${type === 'categoria' ? 'Categoría' : 'Presentación'} actualizada`);
      } else {
        toast.error(result.error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Editar {type === 'categoria' ? 'Categoría' : 'Presentación'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              required
            />
          </div>

          {type === 'presentacion' && (
            <>
              <div>
                <Label htmlFor="abreviatura">Abreviatura</Label>
                <Input
                  id="abreviatura"
                  value={formData.abreviatura || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, abreviatura: e.target.value }))}
                  placeholder="Ej: kg, L, ud"
                  maxLength={20}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="unidad_base">Unidad Base</Label>
                  <Input
                    id="unidad_base"
                    value={formData.unidad_base || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, unidad_base: e.target.value }))}
                    placeholder="Ej: gramo"
                  />
                </div>

                <div>
                  <Label htmlFor="factor_conversion">Factor Conversión</Label>
                  <Input
                    id="factor_conversion"
                    type="number"
                    step="0.001"
                    value={formData.factor_conversion || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      factor_conversion: e.target.value ? parseFloat(e.target.value) : undefined
                    }))}
                    placeholder="1000"
                  />
                </div>
              </div>
            </>
          )}

          {type === 'categoria' && (
            <>
              <div>
                <Label htmlFor="icono">Icono</Label>
                <Input
                  id="icono"
                  value={formData.icono || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, icono: e.target.value }))}
                  placeholder="🔧"
                  maxLength={50}
                />
              </div>

              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  type="color"
                  value={formData.color || '#000000'}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
```

## 🚀 Fase 6: Estilos y Optimización

### 6.1 Estilos para react-select + Tailwind v4

```css
/* apps/electron-renderer/src/styles/globals.css */

/* Importar react-select base styles */
@import "react-select/dist/react-select.css";

/* Integración con Tailwind CSS v4 theme */
.react-select-container {
  /* Contenedor principal */
}

.react-select-container .react-select__control {
  @apply border border-input bg-background text-foreground rounded-md shadow-sm;
  @apply hover:border-primary/50 transition-colors;
  min-height: 2.5rem;
}

.react-select-container .react-select__control--is-focused {
  @apply border-primary ring-2 ring-primary/20;
}

.react-select-container .react-select__control--menu-is-open {
  @apply border-primary;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.react-select-container .react-select__value-container {
  @apply px-3 py-1;
}

.react-select-container .react-select__placeholder {
  @apply text-muted-foreground;
  @apply px-3;
}

.react-select-container .react-select__single-value {
  @apply text-foreground;
  @apply px-3;
}

.react-select-container .react-select__input-container {
  @apply px-3;
}

.react-select-container .react-select__menu {
  @apply bg-background border border-input rounded-md rounded-tl-none rounded-tr-none shadow-lg;
  @apply mt-1 z-50;
}

.react-select-container .react-select__menu-list {
  @apply py-1;
}

.react-select-container .react-select__option {
  @apply px-3 py-2 cursor-pointer transition-colors;
  @apply hover:bg-accent hover:text-accent-foreground;
}

.react-select-container .react-select__option--is-selected {
  @apply bg-primary text-primary-foreground;
}

.react-select-container .react-select__option--is-focused {
  @apply bg-accent text-accent-foreground;
}

.react-select-container .react-select__group {
  @apply text-sm font-semibold;
}

.react-select-container .react-select__group-heading {
  @apply px-3 py-2 text-muted-foreground bg-muted/50;
  @apply uppercase tracking-wide text-xs;
}

/* Creatable option styles */
.react-select-container .react-select__creatable-option {
  @apply border-l-4 border-primary bg-primary/5;
}

.react-select-container .react-select__creatable-option:hover {
  @apply bg-primary/10;
}

/* Loading state */
.react-select-container .react-select__loading-indicator {
  @apply text-muted-foreground;
}

/* Error state */
.react-select-container.error .react-select__control {
  @apply border-destructive focus:ring-destructive/20;
}

/* Disabled state */
.react-select-container .react-select__control--is-disabled {
  @apply bg-muted text-muted-foreground cursor-not-allowed;
}

/* Dropdown indicator */
.react-select-container .react-select__dropdown-indicator {
  @apply text-muted-foreground;
  @apply hover:text-foreground;
}

/* Clear indicator */
.react-select-container .react-select__clear-indicator {
  @apply text-muted-foreground;
  @apply hover:text-destructive;
}

/* Multi-select */
.react-select-container .react-select__multi-value {
  @apply bg-muted border border-input rounded-md text-sm;
}

.react-select-container .react-select__multi-value__label {
  @apply px-2 py-1;
}

.react-select-container .react-select__multi-value__remove {
  @apply text-muted-foreground hover:text-destructive hover:bg-destructive/10;
}

/* Drag and drop styles for hierarchy */
.dragging {
  @apply opacity-50 cursor-grabbing;
}

.drop-target {
  @apply border-2 border-dashed border-primary bg-primary/5;
}

.drop-target-valid {
  @apply border-green-500 bg-green-50;
}

.drop-target-invalid {
  @apply border-red-500 bg-red-50;
}
```

### 6.2 Optimización de Performance

```typescript
// apps/electron-renderer/src/hooks/useReferenceDataOptimized.ts
export const useReferenceDataOptimized = ({ idInstitucion }) => {
  const cacheRef = useRef(new Map());
  const [state, setState] = useState({
    categorias: [],
    presentaciones: [],
    loading: false,
    initialized: false
  });

  // Memoizar opciones para react-select
  const presentacionesOptions = useMemo(() =>
    state.presentaciones.map(p => ({
      value: p.id,
      label: `${p.nombre}${p.abreviatura ? ` (${p.abreviatura})` : ''}`,
      searchTerms: [p.nombre, p.abreviatura, p.descripcion].filter(Boolean).join(' ').toLowerCase()
    })), [state.presentaciones]
  );

  const categoriasOptions = useMemo(() =>
    buildOptimizedCategoriasOptions(state.categorias), [state.categorias]
  );

  // Filtrado local optimizado
  const filterOptions = useCallback((inputValue: string, options: any[]) => {
    if (!inputValue) return options;

    const searchLower = inputValue.toLowerCase();
    return options.filter(option =>
      option.searchTerms?.includes(searchLower) ||
      option.label.toLowerCase().includes(searchLower)
    );
  }, []);

  // Cache LRU para consultas frecuentes
  const getCachedData = useCallback((key: string) => {
    const cached = cacheRef.current.get(key);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 minutos
      return cached.data;
    }
    return null;
  }, []);

  const setCachedData = useCallback((key: string, data: any) => {
    // Limitar cache a 50 items
    if (cacheRef.current.size >= 50) {
      const firstKey = cacheRef.current.keys().next().value;
      cacheRef.current.delete(firstKey);
    }

    cacheRef.current.set(key, {
      data,
      timestamp: Date.now()
    });
  }, []);

  return {
    ...state,
    presentacionesOptions,
    categoriasOptions,
    filterOptions,
    getCachedData,
    setCachedData
  };
};
```

## 🚀 Fase 7: Testing Avanzado

### 7.1 Tests Unitarios

```typescript
// apps/electron-renderer/src/__tests__/DynamicSelect.test.tsx
describe('DynamicSelect Component', () => {
  it('debe renderizar opciones de categorías con jerarquía', () => {
    const mockCategorias = [
      { id: '1', nombre: 'Construcción', nivel: 1, hijos: [
        { id: '2', nombre: 'Electricidad', nivel: 2, hijos: [] }
      ]}
    ];

    render(
      <DynamicSelect
        control={mockControl}
        name="categoria_id"
        label="Categoría"
        type="categoria"
      />
    );

    expect(screen.getByText('Construcción')).toBeInTheDocument();
    expect(screen.getByText('  Electricidad')).toBeInTheDocument(); // Indented
  });

  it('debe permitir crear nuevas opciones', async () => {
    const mockCrear = jest.fn().mockResolvedValue({ success: true, data: { id: 'new' } });

    render(
      <DynamicSelect
        control={mockControl}
        name="presentacion_id"
        label="Presentación"
        type="presentacion"
        creatable={true}
      />
    );

    // Simular typing "Nueva Presentación"
    const input = screen.getByPlaceholderText(/Seleccionar/i);
    fireEvent.change(input, { target: { value: 'Nueva Presentación' } });

    // Simular selecting the create option
    const createOption = screen.getByText(/Crear "Nueva Presentación"/);
    fireEvent.click(createOption);

    await waitFor(() => {
      expect(mockCrear).toHaveBeenCalledWith({
        nombre: 'Nueva Presentación',
        id_institucion: CURRENT_INSTITUTION_ID
      });
    });
  });
});
```

### 7.2 Tests de Integración

```typescript
// apps/electron-renderer/src/__tests__/FormularioMateriaPrima.integration.test.tsx
describe('Formulario Materia Prima - Integración Categorías', () => {
  it('debe cargar y mostrar categorías dinámicamente', async () => {
    // Mock IPC responses
    window.electronAPI.categoria.listarArbol.mockResolvedValue({
      success: true,
      data: mockCategoriaArbol
    });

    render(<FormularioMateriaPrima />);

    await waitFor(() => {
      expect(screen.getByText('Construcción')).toBeInTheDocument();
      expect(screen.getByText('Electricidad')).toBeInTheDocument();
    });
  });

  it('debe crear nueva categoría desde formulario', async () => {
    render(<FormularioMateriaPrima />);

    const categoriaSelect = screen.getByPlaceholderText(/Seleccionar categoría/i);
    fireEvent.change(categoriaSelect, { target: { value: 'Nueva Categoría Test' } });

    const createOption = screen.getByText(/Crear "Nueva Categoría Test"/);
    fireEvent.click(createOption);

    await waitFor(() => {
      expect(window.electronAPI.categoria.crear).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Nueva Categoría Test',
          id_institucion: CURRENT_INSTITUTION_ID
        }),
        undefined
      );
    });
  });
});
```

### 7.3 Tests E2E con Playwright

```typescript
// apps/electron-renderer/src/__tests__/e2e/categoria-jerarquia.spec.ts
test('gestión completa de jerarquía de categorías', async ({ page }) => {
  await page.goto('/materia-prima/nuevo');

  // 1. Crear categoría padre
  await page.fill('[data-testid="categoria-select"] input', 'Categoría Padre');
  await page.click('text=Crear "Categoría Padre"');

  // 2. Crear subcategoría
  await page.fill('[data-testid="categoria-select"] input', 'Subcategoría Hija');
  await page.click('[data-testid="select-option-Categoría Padre"]'); // Select as parent
  await page.click('text=Crear "Subcategoría Hija"');

  // 3. Verificar jerarquía en admin panel
  await page.goto('/admin/categorias');
  await expect(page.locator('text=Categoría Padre')).toBeVisible();
  await expect(page.locator('text=Subcategoría Hija')).toBeVisible();
  await expect(page.locator('text=Subcategoría Hija')).toHaveCSS('margin-left', '24px');

  // 4. Drag and drop para reorganizar
  await page.dragAndDrop('[data-testid="categoria-Subcategoría Hija"]', '[data-testid="category-target-root"]');
  await expect(page.locator('[data-testid="confirm-move-modal"]')).toBeVisible();
  await page.click('text=Confirmar Movimiento');

  // 5. Verificar movimiento
  await page.reload();
  await expect(page.locator('text=Subcategoría Hija')).toHaveCSS('margin-left', '0px');
});
```

## 🚀 Fase 8: Migración de Datos y Deploy

### 8.1 Script de Migración Completo

```sql
-- db/migrations/002_create_reference_tables_with_hierarchy.sql

-- 1. Crear tablas
CREATE TABLE presentacion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    abreviatura VARCHAR(20),
    unidad_base VARCHAR(20),
    factor_conversion DECIMAL(10,4),
    activo BOOLEAN DEFAULT true,
    es_predeterminado BOOLEAN DEFAULT false,
    id_institucion INTEGER NOT NULL REFERENCES institucion(id),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(nombre, id_institucion)
);

CREATE TABLE categoria (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    categoria_padre_id INTEGER REFERENCES categoria(id),
    nivel INTEGER NOT NULL DEFAULT 1,
    ruta_completa TEXT,
    icono VARCHAR(50),
    color VARCHAR(7),
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    es_predeterminado BOOLEAN DEFAULT false,
    id_institucion INTEGER NOT NULL REFERENCES institucion(id),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(nombre, id_institucion, categoria_padre_id)
);

-- 2. Crear índices
CREATE INDEX idx_presentaciones_institucion_activas ON presentacion(id_institucion, activo) WHERE activo = true;
CREATE INDEX idx_categorias_institucion_activas ON categoria(id_institucion, activo) WHERE activo = true;
CREATE INDEX idx_categorias_jerarquia ON categoria(categoria_padre_id, nivel);
CREATE INDEX idx_categorias_orden ON categoria(id_institucion, nivel, orden);

-- 3. Crear trigger para ruta_completa
CREATE OR REPLACE FUNCTION actualizar_ruta_categoria()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.categoria_padre_id IS NULL THEN
            NEW.ruta_completa = NEW.nombre;
            NEW.nivel = 1;
        ELSE
            SELECT ruta_completa || ' > ' || NEW.nombre, nivel + 1
            INTO NEW.ruta_completa, NEW.nivel
            FROM categoria WHERE id = NEW.categoria_padre_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_ruta_categoria
    BEFORE INSERT OR UPDATE ON categoria
    FOR EACH ROW EXECUTE FUNCTION actualizar_ruta_categoria();

-- 4. Migrar datos existentes
-- Presentaciones
INSERT INTO presentacion (nombre, descripcion, id_institucion)
SELECT unnest(ARRAY['Unidad', 'Caja', 'Paquete', 'Saco', 'Bolsa', 'Kilogramo', 'Gramo',
                    'Litro', 'Mililitro', 'Metro', 'Centímetro', 'Rollo', 'Tubo',
                    'Botella', 'Frasco']),
       null,
       id
FROM institucion;

-- Categorías (como categorías raíz por ahora)
INSERT INTO categoria (nombre, descripcion, id_institucion)
SELECT unnest(ARRAY['Construcción', 'Electricidad', 'Plomería', 'Pinturas', 'Herramientas',
                    'Ferretería', 'Limpieza', 'Oficina', 'Seguridad', 'Jardinería',
                    'Automotriz', 'Electrónica', 'Otros']),
       null,
       id
FROM institucion;

-- 5. Actualizar tabla materia_prima (mantener backward compatibility)
ALTER TABLE materia_prima
ADD COLUMN presentacion_id INTEGER REFERENCES presentacion(id),
ADD COLUMN categoria_id INTEGER REFERENCES categoria(id);

-- 6. Crear función para mapear textos a IDs (usada durante migración)
CREATE OR REPLACE FUNCTION mapear_texto_a_presentacion_id(texto TEXT, id_institucion INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT id FROM presentacion
            WHERE LOWER(nombre) = LOWER(texto)
            AND id_institucion = id_institucion
            LIMIT 1);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mapear_texto_a_categoria_id(texto TEXT, id_institucion INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT id FROM categoria
            WHERE LOWER(nombre) = LOWER(texto)
            AND id_institucion = id_institucion
            LIMIT 1);
END;
$$ LANGUAGE plpgsql;

-- 7. Actualizar registros existentes con mapeo
UPDATE materia_prima
SET presentacion_id = mapear_texto_a_presentacion_id(presentacion, id_institucion)
WHERE presentacion IS NOT NULL AND presentacion_id IS NULL;

UPDATE materia_prima
SET categoria_id = mapear_texto_a_categoria_id(categoria, id_institucion)
WHERE categoria IS NOT NULL AND categoria_id IS NULL;
```

### 8.2 Script de Rollback

```sql
-- db/migrations/rollback_002_reference_tables.sql

-- 1. Eliminar nuevas columnas (mantener backwards compatibility)
ALTER TABLE materia_prima
DROP COLUMN IF EXISTS presentacion_id,
DROP COLUMN IF EXISTS categoria_id;

-- 2. Eliminar tablas
DROP TABLE IF EXISTS presentacion;
DROP TABLE IF EXISTS categoria;

-- 3. Eliminar función y trigger
DROP FUNCTION IF EXISTS actualizar_ruta_categoria();
DROP TRIGGER IF EXISTS trg_actualizar_ruta_categoria ON categoria;

-- 4. Eliminar funciones de mapeo
DROP FUNCTION IF EXISTS mapear_texto_a_presentacion_id(TEXT, INTEGER);
DROP FUNCTION IF EXISTS mapear_texto_a_categoria_id(TEXT, INTEGER);
```

## ✅ Checklist de Implementación

### ✅ Fase 1: Base de Datos
- [x] Crear script de migración `002_create_reference_tables_with_hierarchy.sql`
- [x] Implementar trigger `actualizar_ruta_categoria()`
- [x] Crear índices optimizados para rendimiento
- [x] Escribir script de rollback completo
- [x] Probar migración en ambiente de desarrollo
- [x] Generar tipos Kysely actualizados con `pnpm db:codegen`

### ✅ Fase 2: Backend IPC
- [ ] Crear `CategoriaRepository` con métodos jerárquicos
- [ ] Crear `PresentacionRepository` con CRUD básico
- [ ] Implementar IPC handlers `categoria.ts` y `presentacion.ts`
- [ ] Extender preload script con nuevas APIs
- [ ] Agregar logging de auditoría para operaciones críticas
- [ ] Implementar validaciones de negocio (límite niveles, etc.)

### ✅ Fase 3: Tipos y Validación
- [x] Definir interfaces TypeScript en `packages/shared-types/src/referenceData.ts`
- [ ] Crear esquemas Zod para validación robusta
- [x] Implementar tipos para operaciones jerárquicas
- [ ] Agregar tipos para operaciones de edición inline
- [x] Extender tipos existentes de materia prima con IDs

### ✅ Fase 4: Frontend Core
- [ ] Instalar dependencia `react-select` con tipos
- [ ] Implementar hook `useReferenceData` con optimistic updates
- [ ] Crear componente `DynamicSelect` con capacidades avanzadas
- [ ] Implementar `InlineEditModal` para edición inline
- [ ] Crear componente `CategoriaManager` para administración
- [ ] Implementar drag & drop para reorganización jerárquica

### ✅ Fase 5: Integración Formulario
- [ ] Actualizar schema Zod del formulario materia prima
- [ ] Reemplazar Select components con DynamicSelect
- [ ] Implementar manejo de backward compatibility
- [ ] Agregar soporte para creación inline desde formulario
- [ ] Implementar edición inline con confirmación
- [ ] Probar integración completa con React Hook Form

### ✅ Fase 6: Estilos y UX
- [ ] Configurar estilos react-select con Tailwind CSS v4
- [ ] Implementar indicadores visuales de jerarquía
- [ ] Agregar loading states y skeletons
- [ ] Implementar drag & drop visual feedback
- [ ] Optimizar para responsive y accessibility
- [ ] Agregar tooltips y ayuda contextual

### ✅ Fase 7: Testing
- [ ] Escribir tests unitarios para componentes principales
- [ ] Crear tests de integración para formulario completo
- [ ] Implementar tests E2E con Playwright
- [ ] Probar migración de datos backwards compatibility
- [ ] Testear rendimiento con datasets grandes
- [ ] Validar accessibility con WCAG 2.1 AA

### ✅ Fase 8: Deploy y Monitoreo
- [ ] Ejecutar migración en staging environment
- [ ] Probar rollback procedure completo
- [ ] Implementar feature flags para rollout gradual
- [ ] Configurar monitoreo de errores y performance
- [ ] Documentar proceso de administración para usuarios
- [ ] Crear guía de migración para datos existentes

## 📈 Métricas de Éxito

### Métricas Técnicas
- **Performance**: Carga de categorías < 500ms con 1000+ registros
- **Type Safety**: 100% de código TypeScript sin `any`
- **Coverage**: > 90% de código cubierto por tests
- **Bundle Size**: Incremento < 100KB sobre bundle actual

### Métricas de UX
- **Task Success Rate**: > 95% en creación de nueva categoría
- **Error Rate**: < 2% en operaciones de jerarquía
- **Learning Curve**: < 5 minutos para usuarios entender drag & drop
- **Accessibility**: Cumplimiento 100% WCAG 2.1 AA

### Métricas de Negocio
- **Agility**: Reducción 90% en tiempo para agregar nuevas categorías
- **Consistency**: Eliminación 100% de datos inconsistentes
- **Scalability**: Soporte para 10x categorías actuales sin degradación
- **Maintainability**: Reducción 80% en mantenimiento de datos de referencia

---

## 📚 Recursos y Referencias

### Documentación del Proyecto
- [CLAUDE.md](CLAUDE.md) - Arquitectura y patrones existentes
- [TAILWIND_V4_DEVELOPMENT.md](docs/TAILWIND_V4_DEVELOPMENT.md) - Guía de estilos CSS v4
- [GitHub Issue #8](https://github.com/tu-repo/issues/8) - Requirements originales

### Bibliotecas y Frameworks
- [react-select](https://react-select.com/) - Documentación oficial
- [react-hook-form](https://react-hook-form.com/) - Dynamic fields y validation
- [shadcn/ui](https://ui.shadcn.com/) - Componentes y patrones de diseño
- [Kysely](https://kysely.dev/) - Query builder type-safe

### Patrones de Referencia
- Material-UI Tree View - Para inspiración de UI jerárquica
- Notion Database - Para patrones de edición inline
- Figma Components - Para drag & drop de categorías

---

## 📊 Estado de Implementación (Actualizado: 2025-11-28)

### ✅ Fase 1 Completada - Base de Datos
**Estado**: ✅ **COMPLETADO**
**Fecha**: 2025-11-28
**Branch**: `feature/dynamic-reference-data-issue-8`

#### 📋 Tareas Completadas en Fase 1:
- ✅ **Migración 002**: Creada y ejecutada exitosamente
- ✅ **Tablas**: `presentacion` y `categoria` con jerarquía
- ✅ **Triggers**: `actualizar_ruta_categoria()` implementado
- ✅ **Índices**: Optimizados para rendimiento
- ✅ **Kysely Types**: Regenerados con nuevas tablas
- ✅ **Shared Types**: Definidos en `packages/shared-types/src/referenceData.ts`
- ✅ **Rollback**: Script completo disponible

#### 📁 Archivos Creados/Modificados:
- `db/migrations/002_create_reference_tables_with_hierarchy.sql`
- `db/migrations/rollback_002_reference_tables.sql`
- `packages/shared-types/src/referenceData.ts`
- `backend/types/generated/database.types.ts` (actualizado)

#### 🗄️ Estructura de Base de Datos:
- **15 presentaciones predeterminadas** para cada institución
- **13 categorías raíz** configuradas
- **Soporte para jerarquía ilimitada** (con trigger auto-mantenimiento)
- **Backward compatibility** con sistema actual

### 🔄 Próxima Fase: Backend IPC
**Estado**: ⏳ **PENDIENTE**
**Prioridad**: Alta
**Estimación**: 2-3 días

---

**Estado del Plan**: 🔄 **EN PROGRESO - Fase 1 Completada**
**Próximos Pasos**:
1. ✅ Fase 1: Base de Datos - COMPLETADO
2. ⏳ Iniciar Fase 2: Backend IPC (Repositorios y Handlers)
3. ⏳ Implementar Fase 3: Validación con Zod
4. ⏳ Desarrollo Frontend (Fases 4-6)