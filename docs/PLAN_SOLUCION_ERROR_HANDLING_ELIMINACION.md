# Plan de Solución: Error Handling en Eliminación de Materia Prima

## 🚨 **Problema Identificado**

Cuando el usuario intenta eliminar un material con stock, la página se pone en blanco en lugar de mostrar el nuevo sistema de errores mejorado que implementa:

- Types específicos de error (`MateriaPrimaError`)
- Componente `MateriaPrimaErrorDisplay` con acciones de recuperación
- Sistema de pattern matching para clasificación automática de errores
- Mensajes contextuales y accionables

## 📊 **Análisis de Estrategias - Evaluación Completa**

Se realizó un análisis exhaustivo usando 8 instancias del agente `strategy-applier` con estrategias diferentes:

| Estrategia | Puntuación | Diagnóstico | Solución | Complejidad |
|------------|------------|-------------|------------|-------------|
| Análisis de Causas Raíz | 4/5 | Inconsistencia en imports y tipos | Corregir paths y tipos | Media |
| Error Boundaries con Context | 4.5/5 | Faltan boundaries de renderizado | Implementar Error Boundaries | Alta |
| Error Monads con Promise Chains | 3.5/5 | Propone Either Monad | Programación funcional | Alta |
| Observer Pattern con Eventos | 3/5 | Propone eventos desacoplados | Event bus centralizado | Alta |
| **Error Type Guards** | **4.5/5** | **Violación de contrato de tipos** | **Corregir consistencia** | **Baja** |
| Error Interception Pipeline | 4/5 | Propone pipeline multi-etapa | Transformación de errores | Alta |
| **Debug Log Analysis** | **5/5** | **Identifica problema exacto** | **Usar componente existente** | **Baja** |
| Error Accumulator Pattern | 3.5/5 | Propone acumulación controlada | Sistema de batch processing | Media |

## 🎯 **Solución Seleccionada (Respaldada por Mayoría)**

Basado en el análisis convergente de múltiples estrategias, se identifica la solución más efectiva:

### **Causa Raíz Principal (Debug Log Analysis - Agente 7):**

**Error Crítico Identificado:**
```typescript
// GestionMateriaPrimaResponsive.tsx:417 - PROBLEMA
{error && (
  <div className="bg-red-50 border border-red-300 text-red-600 p-4 rounded-lg mb-5 flex items-center gap-2.5">
    <span className="text-xl">⚠️</span>
    {error}  // ❌ PROBLEMA: Renderizando objeto MateriaPrimaError directamente
  </div>
)}
```

**Console Error:** `Objects are not valid as a React child (found: object with keys {type, message, userMessage, suggestedAction, ...})`

### **Solución Combinada (Type Guards + Debug Analysis):**

1. **Error Type Guards (Agente 5):** Corregir violación de contrato de tipos
2. **Debug Log Analysis (Agente 7):** Usar componente `MateriaPrimaErrorDisplay` ya implementado

## 📋 **Plan de Implementación**

### **Fase 1: Diagnóstico y Corrección Inmediata**

#### 1.1 Identificar el Archivo Problemático
**Archivo:** `apps/electron-renderer/src/modules/materiaPrima/GestionMateriaPrimaResponsive.tsx`

**Problema:** Intenta renderizar objeto `MateriaPrimaError` directamente en JSX

#### 1.2 Verificar Uso de Componente Correcto
**Archivo:** `apps/electron-renderer/src/components/MateriaPrimaErrorDisplay.tsx`
- ✅ Componente ya implementado y funcional
- ✅ Type guards funcionando correctamente
- ✅ Sistema de recuperación integrado

#### 1.3 Corregir Renderizado del Error
**Reemplazar en GestionMateriaPrimaResponsive.tsx:**
```typescript
// ❌ CÓDIGO ACTUAL (CAUSA PROBLEMA)
{error && (
  <div className="bg-red-50 border border-red-300 text-red-600 p-4 rounded-lg mb-5 flex items-center gap-2.5">
    <span className="text-xl">⚠️</span>
    {error}
  </div>
)}

// ✅ CÓDIGO CORRECTO (SOLUCIÓN)
{error && (
  <div className="mb-5">
    <MateriaPrimaErrorDisplay
      error={error}
      onDismiss={clearError}
      onRecovery={handleRecovery}
    />
  </div>
)}
```

### **Fase 2: Asegurar Importaciones**

#### 2.1 Verificar Importaciones en GestionMateriaPrimaResponsive
```typescript
// Verificar que existan estos imports:
import { MateriaPrimaErrorDisplay } from '../../components/MateriaPrimaErrorDisplay';
import { MateriaPrimaErrorText } from '../../components/MateriaPrimaErrorDisplay';
```

#### 2.2 Asegurar Handlers de Recuperación
```typescript
const handleRecovery = useCallback((action: string) => {
  // Lógica de recuperación ya implementada en GestionMateriaPrima.tsx
  // Asegurar que esté disponible en GestionMateriaPrimaResponsive.tsx
}, [error]);
```

### **Fase 3: Corrección de Tipos en Hook (Type Guards - Agente 5)**

#### 3.1 Revisar useMateriaPrima Hook
**Archivo:** `apps/electron-renderer/src/hooks/useMateriaPrima.ts`

**Problema:** Violación de contrato de tipos
```typescript
// ❌ PROBLEMA (líneas 49, 67, 87, etc.)
const [error, setError] = useState<MateriaPrimaError | null>(null)
// Pero en catch blocks:
const errorMsg = err instanceof Error ? err.message : 'Error desconocido'
setError(errorMsg) // ❌ String a estado tipado como MateriaPrimaError

// ✅ SOLUCIÓN CORRECTA
const [error, setError] = useState<MateriaPrimaError | null>(null)

// En catch blocks:
if (esMateriaPrimaError(err)) {
  setError(err); // ✅ Mantener tipo correcto
} else if (err instanceof Error) {
  setError(procesarError(err)); // ✅ Convertir usando función existente
} else {
  setError(crearErrorGenerico('Error desconocido')); // ✅ Crear error tipado
}
```

#### 3.2 Verificar Función procesarError
**Archivo:** `apps/electron-renderer/src/utils/errorPatterns.ts`

**Asegurar que exista:**
```typescript
export const procesarError = (error: Error): MateriaPrimaError => {
  return clasificarErrorConFallback(error, 'service');
};
```

### **Fase 4: Validación y Testing**

#### 4.1 Testing del Flujo de Eliminación
1. **Navegar a gestión de materia prima**
2. **Seleccionar material con stock** (ej: "Alambre de Acero" con 5 unidades)
3. **Intentar eliminar material**
4. **Verificar que aparezca componente MateriaPrimaErrorDisplay**
5. **Confirmar mensaje específico:** "No se puede eliminar el material porque tiene stock disponible"
6. **Verificar acciones de recuperación:** "📦 Gestionar Stock", "🚫 Desactivar"

#### 4.2 Testing de Componente
```typescript
// Verificar que el error se muestre correctamente:
expect(error).toBeInstanceOf(StockDisponibleError);
expect(error.stockActual).toBeGreaterThan(0);
expect(error.nombreMaterial).toBe('Alambre de Acero');
```

### **Fase 5: Validación de TypeScript**

#### 5.1 Verificar Consistencia de Tipos
```bash
# Ejecutar para verificar tipos
pnpm type-check

# Buscar errores de tipo específicos
grep -r "setError.*string" apps/electron-renderer/src/
```

#### 5.2 Verificar Imports Relativos
```bash
# Verificar que no haya imports rotos
pnpm build 2>&1 | grep -i "cannot find"
```

### **Fase 6: Testing en Producción**

#### 6.1 Test con Diferentes Escenarios
- **Material sin stock:** Debería permitir eliminación
- **Material con stock:** Debería mostrar error con acciones
- **Material no encontrado:** Debería mostrar error específico
- **Error de conexión:** Debería mostrar error de database

#### 6.2 Testing con Chrome DevTools
- **Network tab:** Verificar que no haya requests fallidos
- **Console:** Verificar que no haya errores no manejados
- **React DevTools:** Verificar que no haya componentes con errores

## 🔧 **Archivos a Modificar**

### **Archivos Principales:**

1. **GestionMateriaPrimaResponsive.tsx**
   - Línea ~417: Corregir renderizado de error
   - Asegurar importación de `MateriaPrimaErrorDisplay`

2. **useMateriaPrima.ts** (si aplica)
   - Corregir violaciones de contrato de tipos
   - Usar `procesarError` consistentemente

### **Archivos Verificar:**

1. **MateriaPrimaErrorDisplay.tsx** ✅ (ya implementado)
2. **errorPatterns.ts** ✅ (ya implementado)
3. **materiaPrimaErrors.ts** ✅ (ya implementado)
4. **materiaPrimaService.ts** ✅ (ya implementado)

## 📊 **Resultados Esperados**

### **Antes de la Solución:**
- ❌ Página en blanco al eliminar material con stock
- ❌ Error genérico sin contexto
- ❌ Sin acciones de recuperación
- ❌ Logs de consola con errores no manejados

### **Después de la Solución:**
- ✅ Componente `MateriaPrimaErrorDisplay` con mensaje específico
- ✅ Stock actual y nombre del material mostrados
- ✅ Acciones de recuperación contextualizadas:
  - 📦 Gestionar Stock
  - 🚫 Desactivar Material
  - 🔄 Reintentar
- ✅ Iconos apropiados según severidad
- ✅ Información técnica completa (correlation ID, timestamp)
- ✅ Logging estructurado con emojis

## 🎯 **Métricas de Éxito**

### **Métricas Funcionales:**
- [ ] Error se muestra correctamente al intentar eliminar con stock
- [ ] Componente `MateriaPrimaErrorDisplay` renderiza sin errores
- [ ] Acciones de recuperación funcionan
- [ ] No hay páginas en blanco por errores
- [ ] TypeScript sin errores de tipo

### **Métricas de Experiencia de Usuario:**
- [ ] Mensajes claros y específicos
- [ ] Acciones contextuales disponibles
- [] Información adicional útil (cantidad stock, etc.)
- [ ] Opciones de recuperación claras
- [ ] Sin spam de errores

### **Métricas Técnicas:**
- [ ] Sin errores de consola
- [ ] TypeScript compila sin advertencias
- [ ] Performance sin impacto perceptible
- [ ] Memory usage estable
- [ ] Error handling robusto

## ⚡ **Beneficios Adicionales**

1. **Sistema de Errores Extensible:** Fácil agregar nuevos patrones de error
2. **Reutilizable en Otros Módulos:** Patrón aplicable a proveedores, movimientos, etc.
3. **Mejora Continua:** Sistema habilitado para mejoras futuras
4. **Debugging Mejorado:** Correlation IDs para rastreo de errores
5. **Consistencia Visual:** shadcn/ui mantiene coherencia visual

## 📋 **Checklist de Verificación**

- [ ] Backup del código antes de cambios
- [ ] Identificar archivo exacto con problema
- [ ] Aplicar corrección de renderizado
- [ ] Verificar imports y handlers
- [ ] Corregir violaciones de tipos
- [ ] Testing con múltiples escenarios
- [ ] Verificar TypeScript sin errores
- [ ] Testing en Chrome DevTools
- [ ] Validar UX y accesibilidad
- [ ] Documentar cambios realizados

## 🔄 **Plan de Rollback**

### **Si Problemas Persisten:**
1. **Revertir cambios** en archivos modificados
2. **Verificar que aplicación original funcione**
3. **Implementar solución simplificada:**
   ```typescript
   // Fallback simple pero funcional
   {error && typeof error === 'string' && (
     <Alert variant="destructive">
       <AlertDescription>{error}</AlertDescription>
     </Alert>
   )}
   ```
4. **Investigar causa raíz adicional**

---

**Este plan combina la precisión del Debug Log Analysis con la robustez de Error Type Guards para resolver definitivamente el problema de la página en blanco y habilitar el sistema completo de manejo de errores mejorado.**