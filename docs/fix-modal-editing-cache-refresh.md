# Plan: Fix Modal Editing Cache Refresh Issue

## Objetivo
Solucionar el problema donde los nombres editados en categorías y presentaciones no se actualizan en el dropdown inmediatamente después de editar, requiriendo reiniciar el servidor de desarrollo para ver los cambios.

## Estado Actual
- ✅ Modal cierra correctamente después de editar
- ✅ Dropdown mantiene la selección del item editado
- ❌ Los nombres actualizados no se muestran (se ven los nombres antiguos)

## Fase 1: Actualizar Hooks de Mutación con Gestión de Cache Inmediata
**Archivo**: `apps/electron-renderer/src/hooks/useReferenceDataQuery.ts`

### Tareas:
- [ ] 1.1. Modificar `useEditarPresentacionMutation` para actualizar cache in `onSuccess`
  - Usar `queryClient.setQueryData()` con la respuesta del servidor
  - Usar `queryClient.refetchQueries()` para asegurar datos frescos
- [ ] 1.2. Modificar `useEditarCategoriaMutation` para actualizar cache en `onSuccess`
  - Actualizar caché de categorías con respuesta del servidor
  - Actualizar caché del árbol de categorías
  - Refrescar queries de categorías y árbol

### Código de Referencia:
```typescript
// En onSuccess de las mutaciones:
onSuccess: async (data, variables) => {
  // Actualizar cache inmediatamente
  queryClient.setQueryData(
    referenceDataKeys.presentacionesList(variables.idInstitucion),
    (old) => old.map(p => p.id === variables.id.toString() ? { ...p, ...data } : p)
  );

  // Refrescar para asegurar datos frescos
  await queryClient.refetchQueries({
    queryKey: referenceDataKeys.presentacionesList(variables.idInstitucion)
  });
}
```

## Fase 2: Añadir Patrón de Refresh Key a DynamicSelect
**Archivo**: `apps/electron-renderer/src/components/ui/DynamicSelect.tsx` y `apps/electron-renderer/src/hooks/useDynamicSelectOptions.ts`

### Tareas:
- [ ] 2.1. Añadir prop `refreshKey` a la interfaz de DynamicSelect
- [ ] 2.2. Modificar `DynamicSelect` para aceptar y pasar `refreshKey`
- [ ] 2.3. Actualizar `useDynamicSelectOptions` para incluir `refreshKey` en las claves de query
- [ ] 2.4. Asegurar que cambios en `refreshKey` disparen un nuevo query

### Código de Referencia:
```typescript
// En DynamicSelect props:
interface DynamicSelectProps {
  refreshKey?: number;
}

// En query keys:
queryKey: [
  ...referenceDataKeys.categoriasList(idInstitucion, includeInactive),
  refreshKey // Forzar nuevo query cuando se incremente
]
```

## Fase 3: Actualizar Formulario para Disparar Refresh
**Archivo**: `apps/electron-renderer/src/modules/materiaPrima/Formulario.tsx`

### Tareas:
- [ ] 3.1. Añadir estado para refresh keys
  - `useState` para `presentacionesRefreshKey`
  - `useState` para `categoriasRefreshKey`
- [ ] 3.2. Modificar `handleGuardarPresentacion` para incrementar refresh key
  - `setPresentacionesRefreshKey(prev => prev + 1)` después de éxito
- [ ] 3.3. Modificar `handleGuardarCategoria` para incrementar refresh key
  - `setCategoriasRefreshKey(prev => prev + 1)` después de éxito
- [ ] 3.4. Pasar refresh keys a los componentes DynamicSelect
  - En el JSX donde se renderizan los selects

### Código de Referencia:
```typescript
// Estado para refresh keys:
const [presentacionesRefreshKey, setPresentacionesRefreshKey] = useState(0);
const [categoriasRefreshKey, setCategoriasRefreshKey] = useState(0);

// En handleGuardarPresentación:
if (result) {
  setPresentacionesRefreshKey(prev => prev + 1);
  // ... resto del código
}

// En JSX:
<MemoizedDynamicSelect
  refreshKey={categoriasRefreshKey}
  type="categoria"
  // ... otros props
/>
```

## Validación
### Pruebas a Realizar:
- [ ] 4.1. Editar una presentación y verificar que el nombre se actualiza inmediatamente
- [ ] 4.2. Editar una categoría y verificar que el nombre se actualiza inmediatamente
- [ ] 4.3. Verificar que no se necesita reiniciar el servidor de desarrollo
- [ ] 4.4. Confirmar que los mensajes de éxito siguen apareciendo

### Criterios de Éxito:
- El dropdown muestra el nombre actualizado inmediatamente después de cerrar el modal
- No se requiere reiniciar el servidor de desarrollo
- El performance se mantiene aceptable
- No hay errores en la consola

## Notas Adicionales:
- Los cambios son compatibles con la arquitectura existente
- Se mantiene el patrón de optimistic updates
- El código sigue las mejores prácticas de TanStack Query