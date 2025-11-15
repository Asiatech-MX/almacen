# Plan de Implementación - Botones de Editar en Gestión de Almacén

## Resumen Ejecutivo

Este documento detalla el plan para resolver el problema identificado donde los botones de editar (✏️) en la sección de gestión de almacén no responden al hacer clic. El análisis fue realizado por 8 agentes de estrategia diferentes, los cuales llegaron a una conclusión unánime sobre la causa raíz y solución.

## Diagnóstico Completo

### Problema Identificado
Los botones de editar en la tabla de materia prima (`GestionMateriaPrima.tsx`) no responden porque **falta la prop `onEdit`** que debería manejar la navegación al formulario de edición.

### Análisis por Agentes de Estrategia

1. **DOM Event Analysis**: Identificó falta de callback prop en línea 656
2. **React Router Navigation**: Confirmó rutas configuradas, falta navegación programática
3. **Component Props Analysis**: Detectó inconsistencia en flujo de props padre-hijo
4. **IPC Communication Flow**: Verificó IPC funcional, problema en navegación
5. **JavaScript Exception Handling**: Identificó fallo silencioso por optional chaining
6. **Component Lifecycle**: Confirmó prop no proporcionada durante montaje
7. **Accessibility Testing**: Verificó estructura semántica correcta
8. **CSS Styling Analysis**: Confirmó estilos no bloquean interacción

**Consenso unánime (8/8)**: Implementar navegación programática con `useNavigate`.

## Análisis Técnico del Código Actual

### Archivo: `apps/electron-renderer/src/modules/materiaPrima/GestionMateriaPrima.tsx`

**Problema en línea 656:**
```typescript
// Actual (no funcional)
<IconButton
  variant="edit"
  onClick={() => onEdit?.(material)}  // onEdit es undefined
  title="Editar"
>
  ✏️
</IconButton>
```

**Problema en línea 574 y 691:**
```typescript
// Actual (con objeto vacío)
onClick={() => onEdit?.({} as MateriaPrima)}  // Sin ID válido
```

**Configuración de rutas en App.tsx (línea 43):**
```typescript
// Faltante: no se pasa prop onEdit
<Route path="materia-prima/gestion" element={<GestionMateriaPrima />} />
```

**Ruta destino ya configurada (App.tsx línea 40):**
```typescript
// ✅ Correctamente configurada
<Route path="materia-prima/editar/:id" element={<MateriaPrimaFormulario />} />
```

## Plan de Implementación

### Cambios Requeridos

#### 1. Importar useNavigate
**Ubicación**: Líneas 2-3 de `GestionMateriaPrima.tsx`
```typescript
// Agregar:
import { useNavigate } from 'react-router-dom'
```

#### 2. Agregar Hook useNavigate
**Ubicación**: Después de la línea 404
```typescript
// Agregar dentro del componente:
const navigate = useNavigate()
```

#### 3. Reemplazar Manejadores de Clic
**Ubicación**: Líneas 656, 574 y 691
```typescript
// Reemplazar:
onClick={() => onEdit?.(material)}

// Por:
onClick={() => navigate(`/materia-prima/editar/${material.id}`)}
```

### Verificación de Componentes Dependientes

#### MateriaPrimaFormulario.tsx ✅ Confirmado
- Usa `useParams()` para extraer ID de URL (línea 359)
- Detecta modo edición vs creación (línea 360)
- Carga datos automáticamente cuando hay ID
- Lista para recibir parámetros de navegación

#### Sistema IPC ✅ Confirmado
- Comunicación funciona correctamente
- Handler `materiaPrima:obtener` implementado
- Tipos TypeScript definidos
- Preload script configurado

## Código Completo de Implementación

### Antes (Código Actual)
```typescript
// imports...
export const GestionMateriaPrima: React.FC<GestionMateriaPrimaProps> = ({
  onEdit
}) => {
  // componente...

  // En botón de editar (línea 656):
  <IconButton
    variant="edit"
    onClick={() => onEdit?.(material)}
    title="Editar"
  >
    ✏️
  </IconButton>
}
```

### Después (Código Corregido)
```typescript
import { useNavigate } from 'react-router-dom'
// otros imports...

export const GestionMateriaPrima: React.FC<GestionMateriaPrimaProps> = () => {
  const navigate = useNavigate()
  // resto del componente...

  const handleEdit = (material: MateriaPrima) => {
    if (material?.id) {
      navigate(`/materia-prima/editar/${material.id}`)
    }
  }

  // En botón de editar:
  <IconButton
    variant="edit"
    onClick={() => handleEdit(material)}
    title="Editar"
  >
    ✏️
  </IconButton>
}
```

## Plan de Pruebas

### 1. Pruebas Funcionales
- **Objetivo**: Verificar navegación correcta
- **Pasos**:
  1. Abrir aplicación en gestión de materia prima
  2. Hacer clic en botón ✏️ de cualquier material
  3. Verificar redirección a `/materia-prima/editar/:id`
  4. Confirmar que formulario carga datos del material

### 2. Pruebas de UI/UX
- **Objetivo**: Confirmar experiencia de usuario fluida
- **Pasos**:
  1. Verificar indicadores de carga
  2. Confirmar que los datos del material se muestran correctamente
  3. Probar botón cancelar para volver a lista

### 3. Edge Cases
- **Objetivo**: Probar casos especiales
- **Casos**:
  - Materiales sin ID (debería mostrar error)
  - IDs con caracteres especiales
  - Navegación rápida repetida

### 4. Pruebas de Navegación
- **Objetivo**: Verificar flujo completo
- **Pasos**:
  1. Navegar a edición
  2. Realizar cambios
  3. Guardar o cancelar
  4. Verificar retorno a lista

## Consideraciones de Seguridad

### Validación de Datos
```typescript
const handleEdit = (material: MateriaPrima) => {
  // Validar ID antes de navegar
  if (!material?.id || typeof material.id !== 'string') {
    console.error('Error: Material sin ID válido', material)
    return
  }
  navigate(`/materia-prima/editar/${material.id}`)
}
```

### Manejo de Errores
- Agregar logging para depuración
- Manejar casos de navegación fallida
- Validar tipos de datos

## Impacto y Beneficios

### Cambios Mínimos
- **Líneas modificadas**: 3-4 líneas máximo
- **Archivos afectados**: 1 archivo principal
- **Riesgo**: Mínimo
- **Compatibilidad**: Total (sin breaking changes)

### Beneficios Esperados
- ✅ Resuelve problema principal de usabilidad
- ✅ Funcionalidad completa de CRUD
- ✅ Mejora experiencia de usuario
- ✅ Alinea con estándares de React Router

## Tiempo Estimado de Implementación

| Tarea | Tiempo Estimado |
|------|-----------------|
| Implementación código | 5-10 minutos |
| Pruebas funcionales | 5-10 minutos |
| Documentación | 5-10 minutos |
| **Total** | **15-30 minutos** |

## Verificación Post-Implementación

### Checklist de Validación
- [ ] Botones de editar redirigen correctamente
- [ ] Formulario carga datos del material
- [ ] Navegación back funciona
- [ ] Sin errores en consola
- [ ] Funcionalidad completa en producción

### Métricas de Éxito
- Todos los botones de editar funcionan
- Tiempo de respuesta < 1 segundo
- Sin regresiones en otras funcionalidades
- Experiencia de usuario fluida

## Conclusión

Este plan resuelve de manera definitiva el problema de los botones de editar utilizando la solución respaldada por el consenso unánime de 8 agentes de estrategia. La implementación es mínima, segura y aprovecha la infraestructura existente de React Router que ya está correctamente configurada en la aplicación.

La solución seguirá las mejores prácticas de React 19, TypeScript y mantendrá la compatibilidad total con el código existente.