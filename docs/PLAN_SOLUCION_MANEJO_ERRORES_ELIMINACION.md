# Plan de Solución: Manejo de Errores en Eliminación de Materia Prima

## Problema Identificado

**Contexto del Problema:**
- Error original: "No se puede eliminar un material con stock disponible"
- Error mostrado al usuario: "Error al eliminar el material"
- El mensaje específico se pierde en el proceso de propagación del error

**Flujo del Error Actual:**
1. `materiaPrimaService.ts:270` - Error al eliminar materia prima: Error: No se puede eliminar un material con stock disponible
2. `useMateriaPrima.ts:124` - Error al eliminar material: Error: Error al eliminar el material
3. `GestionMateriaPrimaResponsive.tsx:312` - Mismo error genérico

## Análisis de Estrategias Evaluadas

Se evaluaron 8 estrategias diferentes usando el agente `strategy-applier`:

### Estrategias Analizadas
1. **Pattern Matching** ⭐⭐⭐⭐⭐
2. **Error Boundaries with Context** ⭐⭐⭐⭐⭐
3. **Result Pattern with Either Monad** ⭐⭐⭐⭐
4. **Observer Pattern with Error Events** ⭐⭐⭐
5. **Error Interception Pipeline** ⭐⭐⭐⭐⭐
6. **Error Monads with Promise Chains** ⭐⭐⭐⭐⭐
7. **Error Type Guards with Type Discrimination** ⭐⭐⭐⭐⭐
8. **Error Accumulator Pattern** ⭐⭐⭐⭐

## Solución Recomendada: Pattern Matching + Type Guards

Basado en el análisis, se recomienda implementar una solución híbrida que combine las mejores características de las estrategias más evaluadas.

### Arquitectura de la Solución

```typescript
// 1. Sistema de Patrones de Error
const ERROR_PATTERNS = {
  STOCK_DISPONIBLE: {
    pattern: /No se puede eliminar.*stock disponible/i,
    userMessage: "⚠️ No se puede eliminar el material porque tiene stock disponible",
    action: "Primero debe agotar el stock existente",
    severity: 'warning'
  },
  MATERIAL_NO_ENCONTRADO: {
    pattern: /no encontrado|not found/i,
    userMessage: "❌ El material no existe en el sistema",
    action: "Verifique el ID del material",
    severity: 'error'
  },
  ERROR_CONEXION: {
    pattern: /connection|database|timeout/i,
    userMessage: "🔌 Error de conexión con la base de datos",
    action: "Verifique su conexión e intente nuevamente",
    severity: 'error'
  }
}

// 2. Tipos de Error Específicos
interface StockDisponibleError extends Error {
  type: 'STOCK_DISPONIBLE'
  stockActual: number
  idMaterial: string
  nombreMaterial: string
  severidad: 'warning'
}

interface MaterialNoEncontradoError extends Error {
  type: 'MATERIAL_NO_ENCONTRADO'
  idMaterial: string
  severidad: 'error'
}

type MateriaPrimaError =
  | StockDisponibleError
  | MaterialNoEncontradoError
  | ErrorGenerico

// 3. Type Guards para Type Safety
const esStockDisponibleError = (error: unknown): error is StockDisponibleError => {
  return error instanceof Error && 'type' in error && error.type === 'STOCK_DISPONIBLE'
}

// 4. Componentes Específicos para cada Tipo de Error
const ErrorMessage: React.FC<{ error: MateriaPrimaError }> = ({ error }) => {
  if (esStockDisponibleError(error)) {
    return <StockErrorMessage {...error} />
  }

  if (esMaterialNoEncontradoError(error)) {
    return <MaterialNoEncontradoMessage {...error} />
  }

  return <GenericErrorMessage {...error} />
}
```

## Plan de Implementación

### Fase 1: Definir Tipos y Patrones

#### 1.1 Crear archivo de tipos de error
**Archivo:** `apps/electron-renderer/src/types/materiaPrimaErrors.ts`

```typescript
// Tipos base de error
interface BaseError {
  timestamp: Date;
  layer: 'service' | 'hook' | 'component';
  correlationId: string;
}

// Errores específicos del dominio
interface StockDisponibleError extends BaseError {
  type: 'STOCK_DISPONIBLE';
  message: string;
  userMessage: string;
  suggestedAction: string;
  stockActual: number;
  idMaterial: string;
  nombreMaterial: string;
  severity: 'warning' | 'error';
}

// Unión de tipos
type MateriaPrimaError =
  | StockDisponibleError
  | MaterialNoEncontradoError
  | ConexionDatabaseError
  | ValidacionError
  | ErrorGenerico;
```

#### 1.2 Crear sistema de patrones
**Archivo:** `apps/electron-renderer/src/utils/errorPatterns.ts`

```typescript
export const ERROR_PATTERNS = {
  STOCK_DISPONIBLE: {
    pattern: /No se puede eliminar.*stock disponible/i,
    createError: (originalError: Error, context: any) => ({
      type: 'STOCK_DISPONIBLE',
      message: originalError.message,
      userMessage: "No se puede eliminar el material porque tiene stock disponible",
      suggestedAction: "Primero debe realizar las salidas correspondientes",
      stockActual: context.stockActual || 0,
      idMaterial: context.idMaterial,
      nombreMaterial: context.nombreMaterial || 'Material sin identificar',
      severity: 'warning',
      timestamp: new Date(),
      layer: context.layer,
      correlationId: generateCorrelationId()
    })
  },

  MATERIAL_NO_ENCONTRADO: {
    pattern: /no encontrado|not found/i,
    createError: (originalError: Error, context: any) => ({
      type: 'MATERIAL_NO_ENCONTRADO',
      message: originalError.message,
      userMessage: "El material no existe en el sistema",
      suggestedAction: "Verifique el ID del material",
      idMaterial: context.idMaterial,
      severity: 'error',
      timestamp: new Date(),
      layer: context.layer,
      correlationId: generateCorrelationId()
    })
  }
};
```

### Fase 2: Implementar en Capa de Servicio

#### 2.1 Modificar materiaPrimaService
**Archivo:** `apps/electron-renderer/src/services/materiaPrimaService.ts`

```typescript
import { ERROR_PATTERNS } from '../utils/errorPatterns';
import { MateriaPrimaError } from '../types/materiaPrimaErrors';

class MateriaPrimaService {
  async eliminar(id: string): Promise<void> {
    try {
      // Verificar stock antes de eliminar
      const stockResult = await this.verificarStockAntesDeEliminar(id);

      if (stockResult.stock > 0) {
        // Crear error específico preservando contexto
        const stockError = ERROR_PATTERNS.STOCK_DISPONIBLE.createError(
          new Error(`No se puede eliminar el material con ${stockResult.stock} unidades en stock`),
          {
            layer: 'service',
            stockActual: stockResult.stock,
            idMaterial: id,
            nombreMaterial: stockResult.nombre || 'Material sin identificar'
          }
        );

        throw stockError;
      }

      // Realizar eliminación
      await window.electronAPI.materiaPrima.eliminar(id);

    } catch (error) {
      // Transformar error existente o crear uno nuevo
      if (this.esMateriaPrimaError(error)) {
        throw error;
      }

      // Intentar clasificar el error
      const errorClasificado = this.clasificarError(error);
      if (errorClasificado) {
        throw errorClasificado;
      }

      // Error genérico como fallback
      throw new Error('Error al eliminar el material');
    }
  }

  private clasificarError(error: Error): MateriaPrimaError | null {
    const mensaje = error.message.toLowerCase();

    for (const [key, pattern] of Object.entries(ERROR_PATTERNS)) {
      if (pattern.pattern.test(mensaje)) {
        return pattern.createError(error, { layer: 'service' });
      }
    }

    return null;
  }

  private esMateriaPrimaError(error: unknown): error is MateriaPrimaError {
    return error !== null && typeof error === 'object' && 'type' in error;
  }
}
```

### Fase 3: Implementar en Capa de Hook

#### 3.1 Modificar useMateriaPrima
**Archivo:** `apps/electron-renderer/src/hooks/useMateriaPrima.ts`

```typescript
import { MateriaPrimaError, StockDisponibleError } from '../types/materiaPrimaErrors';
import { esStockDisponibleError } from '../utils/typeGuards';

export const useMateriaPrima = () => {
  const [error, setError] = useState<MateriaPrimaError | null>(null);
  const [loading, setLoading] = useState(false);

  const eliminarMaterial = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      await materiaPrimaService.eliminar(id);
      return true;

    } catch (err) {
      // Propagar error manteniendo tipo y contexto
      if (esMateriaPrimaError(err)) {
        setError(err);

        // Enriquecer con contexto adicional del hook
        const errorEnriquecido = {
          ...err,
          layer: 'hook',
          timestamp: new Date()
        };

        setError(errorEnriquecido);
      } else {
        // Error inesperado
        setError({
          type: 'ERROR_GENERICO',
          message: err instanceof Error ? err.message : 'Error desconocido',
          userMessage: 'Error al procesar la solicitud',
          suggestedAction: 'Intente nuevamente o contacte soporte',
          severity: 'error',
          timestamp: new Date(),
          layer: 'hook',
          correlationId: generateCorrelationId()
        });
      }

      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mensaje específico para el usuario
  const obtenerMensajeUsuario = useCallback((error: MateriaPrimaError | null): string => {
    if (!error) return '';

    if (esStockDisponibleError(error)) {
      return `⚠️ ${error.userMessage}. Stock actual: ${error.stockActual} unidades. ${error.suggestedAction}`;
    }

    return error.userMessage || 'Error desconocido';
  }, []);

  return {
    eliminarMaterial,
    error,
    loading,
    obtenerMensajeUsuario,
    // Exponer type guards para uso en componentes
    esStockDisponibleError
  };
};
```

### Fase 4: Implementar Componentes de UI

#### 4.1 Crear componente de errores específicos
**Archivo:** `apps/electron-renderer/src/components/MateriaPrimaErrorDisplay.tsx`

```typescript
import React from 'react';
import { MateriaPrimaError, esStockDisponibleError, esMaterialNoEncontradoError } from '../types/materiaPrimaErrors';

interface MateriaPrimaErrorDisplayProps {
  error: MateriaPrimaError | null;
  onDismiss?: () => void;
  onRecovery?: (action: string) => void;
}

const StockErrorMessage: React.FC<StockDisponibleError> = ({ error }) => (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0">
        <span className="text-yellow-400 text-xl">⚠️</span>
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-medium text-yellow-800">
          Material con Stock Disponible
        </h3>
        <div className="mt-2 text-sm text-yellow-700">
          <p>{error.userMessage}</p>
          <div className="mt-2 bg-yellow-100 rounded p-2">
            <span className="font-semibold text-xs">Información adicional:</span>
            <ul className="mt-1 text-xs space-y-1">
              <li><strong>ID:</strong> {error.idMaterial}</li>
              <li><strong>Nombre:</strong> {error.nombreMaterial}</li>
              <li><strong>Stock:</strong> {error.stockActual} unidades</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    <div className="mt-4 flex space-x-2">
      <button
        onClick={() => {/* Navegar a gestión de stock */}}
        className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-sm hover:bg-yellow-200"
      >
        📦 Gestionar Stock
      </button>
      <button
        onClick={() => {/* Navegar a desactivar material */}}
        className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded text-sm hover:bg-yellow-200"
      >
        🚫 Desactivar
      </button>
    </div>
  </div>
);

const GenericErrorMessage: React.FC<MateriaPrimaError> = ({ error }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0">
        <span className="text-red-400 text-xl">❌</span>
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-medium text-red-800">
          Error
        </h3>
        <div className="mt-2 text-sm text-red-700">
          <p>{error.message || 'Error desconocido'}</p>
        </div>
      </div>
    </div>
  </div>
);

export const MateriaPrimaErrorDisplay: React.FC<MateriaPrimaErrorDisplayProps> = ({
  error,
  onDismiss,
  onRecovery
}) => {
  if (!error) return null;

  // Componentes específicos por tipo de error
  if (esStockDisponibleError(error)) {
    return <StockErrorMessage {...error} onRecovery={onRecovery} />;
  }

  if (esMaterialNoEncontradoError(error)) {
    return <MaterialNoEncontradoMessage {...error} onDismiss={onDismiss} />;
  }

  // Error genérico
  return <GenericErrorMessage error={error} onDismiss={onDismiss} />;
  };
};
```

### Fase 5: Integrar en Componente Principal

#### 5.1 Modificar GestionMateriaPrima.tsx
```typescript
import React from 'react';
import { useMateriaPrima } from '../hooks/useMateriaPrima';
import { MateriaPrimaErrorDisplay } from '../components/MateriaPrimaErrorDisplay';
import { esStockDisponibleError } from '../utils/typeGuards';

export const GestionMateriaPrima: React.FC = () => {
  const {
    eliminarMaterial,
    error,
    loading,
    obtenerMensajeUsuario,
    esStockDisponibleError
  } = useMateriaPrima();

  const handleEliminar = async (id: string) => {
    const success = await eliminarMaterial(id);

    if (success) {
      // Mostrar notificación de éxito
      console.log('Material eliminado exitosamente');
    }
  };

  const handleRecovery = useCallback((action: string) => {
    switch (action) {
      case 'gestionar_stock':
        // Navegar a gestión de stock
        navigate('/materia-prima/stock');
        break;
      case 'desactivar_material':
        // Navegar a desactivación
        navigate(`/materia-prima/desactivar/${error?.idMaterial}`);
        break;
      case 'reintentar':
        // Reintentar operación
        if (error?.idMaterial) {
          handleEliminar(error.idMaterial);
        }
        break;
    }
  }, [error]);

  const handleDismiss = useCallback(() => {
    // Limpiar error del estado
    setError(null);
  }, []);

  return (
    <div className="p-6">
      {/* Componente de gestión de materiales */}

      {/* Panel de errores */}
      <MateriaPrimaErrorDisplay
        error={error}
        onDismiss={handleDismiss}
        onRecovery={handleRecovery}
      />

      {/* Resto del componente con tabla y botones */}

      <div className="mt-4">
        <button
          onClick={() => selectedMaterial && handleEliminar(selectedMaterial.id)}
          disabled={loading || !selectedMaterial}
          className={`px-4 py-2 rounded text-white ${
            loading || !selectedMaterial
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {loading ? 'Eliminando...' : 'Eliminar Material'}
        </button>
      </div>

      {/* Mensaje específico como fallback */}
      {error && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            {obtenerMensajeUsuario(error)}
          </p>
        </div>
      )}
    </div>
  );
};
```

## Beneficios de la Solución

### 1. **Preservación Completa del Contexto**
- El mensaje original nunca se pierde
- Información específica (stock actual, ID material) se mantiene
- Contexto técnico (capa, timestamp, correlation ID) se preserva

### 2. **Type Safety con TypeScript**
- Type guards garantizan acceso seguro a propiedades específicas
- El compilador detecta errores en tiempo de compilación
- Autocompletado mejorado para errores específicos

### 3. **Componentes Específicos**
- Cada tipo de error tiene su propio componente visual
- Acciones contextuales específicas para cada error
- Presentación adaptada al tipo y severidad

### 4. **Extensibilidad**
- Fácil agregar nuevos patrones de error
- Nuevos componentes sin modificar código existente
- Sistema escalable para otros dominios

### 5. **Mantenibilidad**
- Separación clara de responsabilidades
- Código predecible y consistente
- Facil testing y debugging

## Resultado Final

Con esta implementación:

- **Antes**: `Error al eliminar el material` (genérico, sin contexto)
- **Después**: `⚠️ No se puede eliminar el material porque tiene 15 unidades en stock. Primero debe realizar las salidas correspondientes.` (específico, contextual, con acciones)

### Flujo de Error Mejorado:

1. **Capa de Servicio**: Detecta error específico y crea `StockDisponibleError`
2. **Capa de Hook**: Preserva el error y enriquece con contexto adicional
3. **Capa de UI**: Muestra componente específico con acciones contextuales

## Consideraciones Adicionales

### Testing
```typescript
// Pruebas unitarias para type guards
describe('Type Guards', () => {
  test('debería identificar error de stock disponible', () => {
    const error = ERROR_PATTERNS.STOCK_DISPONIBLE.createError(
      new Error('No se puede eliminar material con stock'),
      { layer: 'service' }
    );

    expect(esStockDisponibleError(error)).toBe(true);
  });
});
```

### Performance
- Patrones compilados para rendimiento
- Type guards con comparación rápida
- Memoización de mensajes específicos

### Accessibility
- Componentes con aria-labels apropiados
- Navegación por teclado
- Contraste de colores WCAG compliant

Esta solución proporciona una experiencia de usuario superior con mensajes específicos y accionables, mientras mantiene la robustez y mantenibilidad del código.