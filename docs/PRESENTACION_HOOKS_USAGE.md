# Guía de Uso - Hooks de Presentaciones con TanStack Query

Esta guía explica cómo usar los hooks de `usePresentacion` para gestionar presentaciones con actualizaciones optimistas y cache inteligente.

## Índice

1. [Queries (Lectura de Datos)](#queries)
2. [Mutations (Escritura de Datos)](#mutations)
3. [Ejemplos Prácticos](#ejemplos-prácticos)
4. [Consideraciones para Electron](#consideraciones-para-electron)

## Queries

### `usePresentaciones`

Obtiene el listado de presentaciones de una institución.

```tsx
import { usePresentaciones } from '../hooks/usePresentacion'

function PresentacionesList({ idInstitucion }: { idInstitucion: number }) {
  const { data: presentaciones = [], isLoading, error } = usePresentaciones(idInstitucion)

  if (isLoading) return <div>Cargando presentaciones...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <ul>
      {presentaciones.map(presentacion => (
        <li key={presentacion.id}>
          {presentacion.nombre} {presentacion.es_predeterminado && '(Predeterminada)'}
        </li>
      ))}
    </ul>
  )
}
```

### `usePresentacionesPredeterminadas`

Obtiene solo las presentaciones marcadas como predeterminadas.

```tsx
import { usePresentacionesPredeterminadas } from '../hooks/usePresentacion'

function PredeterminadasSelect({ idInstitucion }: { idInstitucion: number }) {
  const { data: predeterminadas = [], isLoading } = usePresentacionesPredeterminadas(idInstitucion)

  return (
    <select disabled={isLoading}>
      <option value="">Seleccione una presentación</option>
      {predeterminadas.map(p => (
        <option key={p.id} value={p.id}>
          {p.nombre} {p.abreviatura && `(${p.abreviatura})`}
        </option>
      ))}
    </select>
  )
}
```

### `usePresentacion`

Obtiene una presentación específica por su ID.

```tsx
import { usePresentacion } from '../hooks/usePresentacion'

function PresentacionDetail({ id }: { id: string }) {
  const { data: presentacion, isLoading, error } = usePresentacion(id)

  if (isLoading) return <div>Cargando...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!presentacion) return <div>Presentación no encontrada</div>

  return (
    <div>
      <h1>{presentacion.nombre}</h1>
      <p>{presentacion.descripcion}</p>
      {presentacion.abreviatura && <p>Abreviatura: {presentacion.abreviatura}</p>}
      <p>Estado: {presentacion.activo ? 'Activa' : 'Inactiva'}</p>
    </div>
  )
}
```

### `useBuscarPresentaciones`

Busca presentaciones por término de búsqueda.

```tsx
import { useBuscarPresentaciones } from '../hooks/usePresentacion'
import { useState } from 'react'

function BuscadorPresentaciones({ idInstitucion }: { idInstitucion: number }) {
  const [termino, setTermino] = useState('')
  const { data: resultados = [], isLoading } = useBuscarPresentaciones(
    idInstitucion,
    termino
  )

  return (
    <div>
      <input
        type="text"
        placeholder="Buscar presentaciones..."
        value={termino}
        onChange={(e) => setTermino(e.target.value)}
      />
      {termino && (
        <ul>
          {isLoading ? (
            <li>Buscando...</li>
          ) : (
            resultados.map(p => (
              <li key={p.id}>{p.nombre}</li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
```

## Mutations

### `useCrearPresentacion`

Crea una nueva presentación con actualización optimista.

```tsx
import { useCrearPresentacion } from '../hooks/usePresentacion'
import { useState } from 'react'

function NuevaPresentacionForm({ idInstitucion }: { idInstitucion: number }) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    abreviatura: '',
    es_predeterminado: false
  })
  const crearPresentacion = useCrearPresentacion()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    crearPresentacion.mutate({
      presentacion: {
        ...formData,
        id_institucion: idInstitucion
      },
      usuarioId: 'user-123'
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Nombre:</label>
        <input
          required
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
        />
      </div>
      <div>
        <label>Descripción:</label>
        <textarea
          value={formData.descripcion || ''}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
        />
      </div>
      <div>
        <label>Abreviatura:</label>
        <input
          value={formData.abreviatura || ''}
          onChange={(e) => setFormData({ ...formData, abreviatura: e.target.value })}
        />
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            checked={formData.es_predeterminado}
            onChange={(e) => setFormData({ ...formData, es_predeterminado: e.target.checked })}
          />
          Es predeterminada
        </label>
      </div>
      <button type="submit" disabled={crearPresentacion.isPending}>
        {crearPresentacion.isPending ? 'Creando...' : 'Crear Presentación'}
      </button>
      {crearPresentacion.error && (
        <div>Error: {crearPresentacion.error.message}</div>
      )}
    </form>
  )
}
```

### `useEditarPresentacion`

Edita una presentación existente.

```tsx
import { useEditarPresentacion, usePresentacion } from '../hooks/usePresentacion'
import { useEffect, useState } from 'react'

function EditarPresentacionForm({ id }: { id: string }) {
  const { data: presentacion, isLoading } = usePresentacion(id)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    abreviatura: ''
  })
  const editarPresentacion = useEditarPresentacion()

  useEffect(() => {
    if (presentacion) {
      setFormData({
        nombre: presentacion.nombre,
        descripcion: presentacion.descripcion || '',
        abreviatura: presentacion.abreviatura || ''
      })
    }
  }, [presentacion])

  if (isLoading) return <div>Cargando...</div>

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    editarPresentacion.mutate({
      id,
      cambios: formData,
      usuarioId: 'user-123'
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Nombre:</label>
        <input
          required
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
        />
      </div>
      <div>
        <label>Descripción:</label>
        <textarea
          value={formData.descripcion}
          onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
        />
      </div>
      <div>
        <label>Abreviatura:</label>
        <input
          value={formData.abreviatura}
          onChange={(e) => setFormData({ ...formData, abreviatura: e.target.value })}
        />
      </div>
      <button type="submit" disabled={editarPresentacion.isPending}>
        {editarPresentacion.isPending ? 'Guardando...' : 'Guardar Cambios'}
      </button>
    </form>
  )
}
```

### `useEliminarPresentacion`

Elimina una presentación (soft delete).

```tsx
import { useEliminarPresentacion } from '../hooks/usePresentacion'

function PresentacionItem({ presentacion }: { presentacion: Presentacion }) {
  const eliminarPresentacion = useEliminarPresentacion()

  const handleEliminar = () => {
    if (window.confirm(`¿Está seguro de eliminar "${presentacion.nombre}"?`)) {
      eliminarPresentacion.mutate({
        id: presentacion.id,
        usuarioId: 'user-123'
      })
    }
  }

  return (
    <div className="flex justify-between items-center p-2 border">
      <span>{presentacion.nombre}</span>
      <button
        onClick={handleEliminar}
        disabled={eliminarPresentacion.isPending}
        className="text-red-600 hover:text-red-800"
      >
        {eliminarPresentacion.isPending ? 'Eliminando...' : 'Eliminar'}
      </button>
    </div>
  )
}
```

### `useEstablecerPredeterminada`

Establece una presentación como predeterminada para la institución.

```tsx
import { useEstablecerPredeterminada } from '../hooks/usePresentacion'

function PresentacionConPredeterminada({ presentacion }: { presentacion: Presentacion }) {
  const establecerPredeterminada = useEstablecerPredeterminada()

  const handleHacerPredeterminada = () => {
    establecerPredeterminada.mutate({
      id: presentacion.id,
      idInstitucion: presentacion.id_institucion,
      usuarioId: 'user-123'
    })
  }

  return (
    <div className="flex items-center gap-2">
      <span>{presentacion.nombre}</span>
      {presentacion.es_predeterminado ? (
        <span className="text-green-600 font-semibold">★ Predeterminada</span>
      ) : (
        <button
          onClick={handleHacerPredeterminada}
          disabled={establecerPredeterminada.isPending}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Hacer predeterminada
        </button>
      )}
    </div>
  )
}
```

### `useToggleActivoPresentacion`

Activa o desactiva una presentación.

```tsx
import { useToggleActivoPresentacion } from '../hooks/usePresentacion'

function PresentacionConToggle({ presentacion }: { presentacion: Presentacion }) {
  const toggleActivo = useToggleActivoPresentacion()

  const handleToggleActivo = () => {
    toggleActivo.mutate({
      id: presentacion.id,
      activar: !presentacion.activo,
      usuarioId: 'user-123'
    })
  }

  return (
    <div className="flex items-center gap-2">
      <span>{presentacion.nombre}</span>
      <button
        onClick={handleToggleActivo}
        disabled={toggleActivo.isPending}
        className={`px-2 py-1 text-sm rounded ${
          presentacion.activo
            ? 'bg-green-100 text-green-800 hover:bg-green-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        {presentacion.activo ? 'Activa' : 'Inactiva'}
      </button>
    </div>
  )
}
```

## Ejemplos Prácticos

### Dropdown con "Agregar Nueva"

```tsx
import { usePresentaciones, useCrearPresentacion } from '../hooks/usePresentacion'
import { useState } from 'react'

function PresentacionDropdown({ idInstitucion }: { idInstitucion: number }) {
  const { data: presentaciones = [] } = usePresentaciones(idInstitucion)
  const crearPresentacion = useCrearPresentacion()
  const [mostrarForm, setMostrarForm] = useState(false)

  const handleCrearRapida = (nombre: string) => {
    crearPresentacion.mutate({
      presentacion: {
        nombre,
        id_institucion: idInstitucion
      }
    })
    setMostrarForm(false)
  }

  return (
    <div>
      <select>
        <option value="">Seleccione...</option>
        {presentaciones.map(p => (
          <option key={p.id} value={p.id}>
            {p.nombre}
          </option>
        ))}
      </select>
      <button
        onClick={() => setMostrarForm(true)}
        className="ml-2 text-blue-600 hover:text-blue-800"
      >
        + Agregar Nueva
      </button>

      {mostrarForm && (
        <div className="mt-2 p-2 border">
          <input
            type="text"
            placeholder="Nombre de la presentación"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCrearRapida((e.target as HTMLInputElement).value)
              }
            }}
          />
          <button
            onClick={() => setMostrarForm(false)}
            className="ml-2 text-gray-600"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}
```

### Lista con Búsqueda y Filtros

```tsx
import {
  usePresentaciones,
  useBuscarPresentaciones,
  useEliminarPresentacion,
  useToggleActivoPresentacion
} from '../hooks/usePresentacion'
import { useState } from 'react'

function PresentacionesManager({ idInstitucion }: { idInstitucion: number }) {
  const [termino, setTermino] = useState('')
  const [mostrarInactivas, setMostrarInactivas] = useState(false)

  const { data: todas } = usePresentaciones(idInstitucion, !mostrarInactivas)
  const { data: resultados } = useBuscarPresentaciones(idInstitucion, termino, !mostrarInactivas)
  const eliminarPresentacion = useEliminarPresentacion()
  const toggleActivo = useToggleActivoPresentacion()

  const presentaciones = termino ? resultados : todas

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Buscar presentaciones..."
          value={termino}
          onChange={(e) => setTermino(e.target.value)}
          className="flex-1"
        />
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={mostrarInactivas}
            onChange={(e) => setMostrarInactivas(e.target.checked)}
          />
          Mostrar inactivas
        </label>
      </div>

      <div className="space-y-2">
        {presentaciones?.map(p => (
          <div key={p.id} className="flex justify-between items-center p-2 border">
            <div>
              <span className="font-medium">{p.nombre}</span>
              {p.abreviatura && <span className="text-gray-500 ml-2">({p.abreviatura})</span>}
              {p.es_predeterminado && <span className="text-green-600 ml-2">★</span>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => toggleActivo.mutate({
                  id: p.id,
                  activar: !p.activo
                })}
                className={`text-sm ${p.activo ? 'text-gray-600' : 'text-green-600'}`}
              >
                {p.activo ? 'Desactivar' : 'Activar'}
              </button>
              <button
                onClick={() => eliminarPresentacion.mutate({ id: p.id })}
                className="text-red-600 text-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## Consideraciones para Electron

### 1. **Manejo de IPC**
Los hooks usan `window.electronAPI` para comunicarse con el main process. Asegúrate de que el preload script exponga los canales IPC necesarios:

```typescript
// apps/electron-main/src/preload/index.ts
contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel: string, data: any) => ipcRenderer.invoke(channel, data),
  // ... otros métodos
})
```

### 2. **Cache para Desktop App**
Las queries están configuradas con tiempos de cache apropiados para una aplicación de escritorio:
- `staleTime: 5 min` para listas dinámicas
- `gcTime: 10 min` para balance memoria/frescura
- `staleTime: 15 min` para datos predeterminados

### 3. **Actualizaciones Optimistas**
Todas las mutations incluyen actualizaciones optimistas para una UX instantánea:
- La UI se actualiza inmediatamente
- Rollback automático si hay errores
- Invalidación final para sincronización

### 4. **Manejo de Errores**
Las mutations incluyen manejo robusto de errores con mensajes descriptivos. Considera mostrar notificaciones toast para feedback al usuario.

### 5. **Multi-institución**
Todos los hooks requieren `idInstitucion` para asegurar aislamiento de datos en un entorno multi-tenant.

## Patrones Recomendados

### 1. **Formularios con Validación**
```tsx
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const presentacionSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  abreviatura: z.string().optional()
})

type PresentacionFormData = z.infer<typeof presentacionSchema>

function ValidatedPresentacionForm({ idInstitucion }: { idInstitucion: number }) {
  const { register, handleSubmit, formState: { errors } } = useForm<PresentacionFormData>({
    resolver: zodResolver(presentacionSchema)
  })
  const crearPresentacion = useCrearPresentacion()

  return (
    <form onSubmit={handleSubmit(data => {
      crearPresentacion.mutate({
        presentacion: { ...data, id_institucion: idInstitucion }
      })
    })}>
      {/* Campos del formulario con validación */}
    </form>
  )
}
```

### 2. **Componente Selector Reutilizable**
```tsx
function PresentacionSelector({
  idInstitucion,
  value,
  onChange,
  allowCreate = false,
  soloActivas = true
}: {
  idInstitucion: number
  value?: string
  onChange: (id: string) => void
  allowCreate?: boolean
  soloActivas?: boolean
}) {
  const { data: presentaciones = [] } = usePresentaciones(idInstitucion, soloActivas)
  const crearPresentacion = useCrearPresentacion()

  return (
    <div>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Seleccione...</option>
        {presentaciones.map(p => (
          <option key={p.id} value={p.id}>{p.nombre}</option>
        ))}
        {allowCreate && (
          <option value="__CREATE_NEW__">+ Crear nueva...</option>
        )}
      </select>
    </div>
  )
}
```

Esta guía proporciona una referencia completa para usar los hooks de presentaciones con TanStack Query en tu aplicación Electron.