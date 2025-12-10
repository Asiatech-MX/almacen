# Guía de Uso: Hooks de Categoría con TanStack Query

## Overview

Se ha implementado la Fase 2 del plan de TanStack Query para gestión de categorías. Esta guía muestra cómo utilizar los nuevos hooks y servicios para gestionar categorías con cache inteligente y actualizaciones optimistas.

## Archivos Implementados

### 1. **Tipos Compartidos** (`shared/types/referenceData.ts`)
- Definiciones de tipos para Categoria, Presentacion y operaciones relacionadas
- Interfaces para crear, actualizar y estructuras de árbol

### 2. **Servicio de Categorías** (`apps/electron-renderer/src/services/categoriaService.ts`)
- Capa de abstracción para comunicación IPC
- Métodos CRUD completos con manejo de errores
- Operaciones especiales: mover, reordenar, verificar dependencias

### 3. **Hooks de React Query** (`apps/electron-renderer/src/hooks/useCategoria.ts`)
- Queries para listar, obtener y buscar categorías
- Mutations con actualizaciones optimistas
- Invalidación automática de cache

## Uso de los Hooks

### 1. **Listar Categorías en Árbol**

```tsx
import { useCategoriaArbol } from '../hooks/useCategoria'

function CategoriaTree({ idInstitucion }: { idInstitucion: number }) {
  const { data: categorias, isLoading, error } = useCategoriaArbol(idInstitucion)

  if (isLoading) return <div>Cargando categorías...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <ul>
      {categorias?.map((categoria) => (
        <li key={categoria.id}>
          {categoria.nombre}
          {categoria.hijos && <CategoriaSubTree categorias={categoria.hijos} />}
        </li>
      ))}
    </ul>
  )
}
```

### 2. **Lista Plana de Categorías (para Selects)**

```tsx
import { useCategorias } from '../hooks/useCategoria'

function CategoriaSelect({ idInstitucion, onChange }: {
  idInstitucion: number
  onChange: (categoria: Categoria) => void
}) {
  const { data: categorias, isLoading } = useCategorias(idInstitucion)

  return (
    <select onChange={(e) => {
      const categoria = categorias?.find(c => c.id === e.target.value)
      if (categoria) onChange(categoria)
    }}>
      <option value="">Seleccione una categoría</option>
      {categorias?.map((categoria) => (
        <option key={categoria.id} value={categoria.id}>
          {categoria.nombre}
        </option>
      ))}
    </select>
  )
}
```

### 3. **Crear Nueva Categoría**

```tsx
import { useCrearCategoria } from '../hooks/useCategoria'

function CreateCategoriaForm({ idInstitucion }: { idInstitucion: number }) {
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const crearCategoria = useCrearCategoria()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    crearCategoria.mutate({
      categoria: {
        nombre,
        descripcion: descripcion || null,
        id_institucion: idInstitucion,
      },
      usuarioId: 'usuario-actual-id' // Obtener del contexto de autenticación
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Nombre de la categoría"
        required
      />
      <textarea
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        placeholder="Descripción (opcional)"
      />
      <button
        type="submit"
        disabled={crearCategoria.isPending}
      >
        {crearCategoria.isPending ? 'Creando...' : 'Crear Categoría'}
      </button>
      {crearCategoria.error && (
        <div>Error: {crearCategoria.error.message}</div>
      )}
      {crearCategoria.isSuccess && (
        <div>¡Categoría creada exitosamente!</div>
      )}
    </form>
  )
}
```

### 4. **Editar Categoría**

```tsx
import { useEditarCategoria } from '../hooks/useCategoria'

function EditCategoriaForm({ categoria }: { categoria: Categoria }) {
  const [nombre, setNombre] = useState(categoria.nombre)
  const [descripcion, setDescripcion] = useState(categoria.descripcion || '')
  const editarCategoria = useEditarCategoria()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    editarCategoria.mutate({
      id: categoria.id,
      cambios: {
        nombre,
        descripcion: descripcion || null,
      },
      usuarioId: 'usuario-actual-id'
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Nombre de la categoría"
        required
      />
      <textarea
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        placeholder="Descripción (opcional)"
      />
      <button
        type="submit"
        disabled={editarCategoria.isPending}
      >
        {editarCategoria.isPending ? 'Guardando...' : 'Guardar Cambios'}
      </button>
    </form>
  )
}
```

### 5. **Eliminar Categoría con Verificación**

```tsx
import { useEliminarCategoria, useCategoria } from '../hooks/useCategoria'

function DeleteCategoriaButton({ idCategoria }: { idCategoria: string }) {
  const eliminarCategoria = useEliminarCategoria()
  const { data: categoria } = useCategoria(idCategoria)

  const handleDelete = () => {
    if (!window.confirm('¿Está seguro de eliminar esta categoría?')) return

    eliminarCategoria.mutate({
      id: idCategoria,
      forzar: false,
      usuarioId: 'usuario-actual-id'
    })
  }

  return (
    <div>
      <button
        onClick={handleDelete}
        disabled={eliminarCategoria.isPending}
      >
        {eliminarCategoria.isPending ? 'Eliminando...' : 'Eliminar Categoría'}
      </button>

      {eliminarCategoria.error && (
        <div>
          Error: {eliminarCategoria.error.message}
          {eliminarCategoria.error.message.includes('dependencias') && (
            <button onClick={() => {
              eliminarCategoria.mutate({
                id: idCategoria,
                forzar: true,
                usuarioId: 'usuario-actual-id'
              })
            }}>
              Forzar Eliminación
            </button>
          )}
        </div>
      )}
    </div>
  )
}
```

### 6. **Mover Categoría de Padre**

```tsx
import { useMoverCategoria, useCategorias } from '../hooks/useCategoria'

function MoverCategoriaForm({ categoria, idInstitucion }: {
  categoria: Categoria
  idInstitucion: number
}) {
  const moverCategoria = useMoverCategoria()
  const { data: categorias } = useCategorias(idInstitucion)

  const [nuevoPadreId, setNuevoPadreId] = useState<string>('')

  const handleMover = () => {
    moverCategoria.mutate({
      idCategoria: categoria.id,
      nuevoPadreId: nuevoPadreId || null,
      usuarioId: 'usuario-actual-id'
    })
  }

  return (
    <div>
      <h3>Mover: {categoria.nombre}</h3>
      <select
        value={nuevoPadreId}
        onChange={(e) => setNuevoPadreId(e.target.value)}
      >
        <option value="">Raíz (sin padre)</option>
        {categorias?.map((cat) => (
          cat.id !== categoria.id && cat.nivel < 4 && (
            <option key={cat.id} value={cat.id}>
              {'  '.repeat(cat.nivel)}{cat.nombre}
            </option>
          )
        ))}
      </select>
      <button onClick={handleMover} disabled={moverCategoria.isPending}>
        {moverCategoria.isPending ? 'Moviendo...' : 'Mover'}
      </button>
    </div>
  )
}
```

### 7. **Búsqueda de Categorías**

```tsx
import { useBuscarCategorias } from '../hooks/useCategoria'
import { useDebounce } from '../hooks/useDebounce'

function CategoriaSearch({ idInstitucion }: { idInstitucion: number }) {
  const [termino, setTermino] = useState('')
  const terminoDebounced = useDebounce(termino, 300)

  const { data: resultados, isLoading } = useBuscarCategorias(
    idInstitucion,
    terminoDebounced
  )

  return (
    <div>
      <input
        type="text"
        value={termino}
        onChange={(e) => setTermino(e.target.value)}
        placeholder="Buscar categorías..."
      />
      {isLoading && <div>Buscando...</div>}
      {resultados && (
        <ul>
          {resultados.map((categoria) => (
            <li key={categoria.id}>
              {categoria.nombre} - Nivel {categoria.nivel}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

### 8. **Toggle Activar/Desactivar**

```tsx
import { useToggleCategoriaActiva } from '../hooks/useCategoria'

function CategoriaToggle({ categoria }: { categoria: Categoria }) {
  const toggleActiva = useToggleCategoriaActiva()

  const handleToggle = () => {
    toggleActiva.mutate({
      id: categoria.id,
      activar: !categoria.activo,
      usuarioId: 'usuario-actual-id'
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={toggleActiva.isPending}
      className={categoria.activo ? 'btn-danger' : 'btn-success'}
    >
      {toggleActiva.isPending
        ? 'Procesando...'
        : categoria.activo
          ? 'Desactivar'
          : 'Activar'
      }
    </button>
  )
}
```

## Actualizaciones Optimistas

Los mutations implementan actualizaciones optimistas que:

1. **Cancelan queries salientes** para evitar sobreescrituras
2. **Actualizan el cache inmediatamente** para respuesta instantánea
3. **Mantienen snapshot anterior** para rollback si hay error
4. **Invalidan queries relacionadas** para sincronización final

Ejemplo de como se ve en acción:

```tsx
// La UI se actualiza inmediatamente
crearCategoria.mutate({
  categoria: { nombre: 'Nueva Categoría', id_institucion: 1 }
})

// Si hay error, la UI revierte automáticamente
// Si tiene éxito, el cache se sincroniza con el servidor
```

## Configuración de Cache

- **Stale Time**: 5 minutos para listas, 10 minutos para individuales
- **GC Time**: 10 minutos para listas, 15 minutos para individuales
- **Refetch on Window Focus**: Desactivado para app de escritorio

## Próximos Pasos (Fase 3)

1. Crear servicio y hook para Presentaciones
2. Actualizar MaterialForm para usar datos dinámicos
3. Agregar modales para creación en línea
4. Implementar botones "Agregar nueva" en dropdowns

## Consideraciones

- Todos los hooks requieren `idInstitucion` para soporte multi-tenant
- Las actualizaciones optimistas mejoran la UX significativamente
- El manejo de errores incluye rollback automático
- Las invalidaciones aseguran consistencia de datos