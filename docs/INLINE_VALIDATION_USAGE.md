# Sistema de Validación Inline - Guía de Uso

## 📋 Resumen

Esta guía explica cómo utilizar el nuevo sistema de validación inline implementado en la Fase 2 del plan de edición inline. El sistema proporciona validación en tiempo real, asíncrona y desacoplada del formulario principal.

## 🎯 Características Principales

### ✅ Validación en Tiempo Real
- **Debounced validation**: Validación con retraso configurable para mejorar la UX
- **Field-specific validation**: Validación individual por campo
- **Real-time feedback**: Retroalimentación visual inmediata

### ✅ Validación Asíncrona
- **Duplicate checking**: Verificación de duplicados en tiempo real
- **Business rule validation**: Reglas de negocio complejas con llamadas asíncronas
- **Optimistic validation**: Validación optimista con rollback si falla

### ✅ Validación Desacoplada
- **Independent from main form**: Funciona sin validar el formulario principal
- **Configurable**: Activable/desactivable por configuración
- **Extensible**: Fácil de extender con nuevas reglas de validación

## 🏗️ Arquitectura

### Componentes Clave

1. **`inlineValidation.ts`**: Sistema de validación central
   - Clases `InlineValidator` para gestión de estado
   - Schemas Zod con validación personalizada
   - Utilidades para validación asíncrona

2. **`useInlineEditor.ts`**: Hook mejorado con validación
   - Estado extendido con resultados de validación
   - Métodos para validación de campo y completa
   - Integración con sistema de validación

3. **`InlineEditor.tsx`**: Componente UI con feedback visual
   - Indicadores de estado de validación
   - Mensajes de error/warning/info por campo
   - Botones deshabilitados según estado de validación

## 🚀 Uso Básico

### 1. Configurar el Hook con Validación

```typescript
const editor = useInlineEditor({
  onSave: async (item) => {
    // Lógica de guardado
    return { success: true, data: item };
  },
  config: {
    enableRealTimeValidation: true,
    enableAsyncValidation: true,
    validationDebounceMs: 400,
    validateOnBlur: true
  },
  validationContext: {
    itemType: 'categoria',
    existingItems: categorias,
    institutionId: 1
  }
});
```

### 2. Usar en Componente

```typescript
<InlineEditor
  value={item}
  onSave={handleSave}
  type="categoria"
  config={{
    enableRealTimeValidation: true,
    enableAsyncValidation: true,
    validationDebounceMs: 400
  }}
  validationContext={{
    existingItems: categorias,
    institutionId: 1
  }}
/>
```

## 🔧 Configuración Avanzada

### Opciones de Configuración

```typescript
interface InlineEditorConfig {
  validateOnBlur?: boolean;           // Validar al perder foco (default: true)
  autoSave?: boolean;                 // Auto-guardar (default: false)
  debounceMs?: number;                // Debounce para auto-save (default: 300)
  enableKeyboardShortcuts?: boolean;   // Atajos de teclado (default: true)
  enableRealTimeValidation?: boolean; // Validación en tiempo real (default: true)
  enableAsyncValidation?: boolean;    // Validación asíncrona (default: true)
  validationDebounceMs?: number;      // Debounce para validación (default: 400)
}
```

### Contexto de Validación

```typescript
interface ValidationContext {
  itemType: 'categoria' | 'presentacion';
  existingItems: ReferenceItem[];
  institutionId?: number;
}
```

## 📊 Estados de Validación

### Resultados de Validación

```typescript
interface ValidationResult {
  isValid: boolean;           // Si la validación pasó
  errors: ValidationError[];   // Errores críticos
  warnings: ValidationError[]; // Advertencias
  info: ValidationError[];     // Información
}

interface ValidationError {
  code: string;        // Código del error
  message: string;     // Mensaje descriptivo
  path?: string[];     // Ruta del campo afectado
  type: 'error' | 'warning' | 'info';
}
```

### Estado del Editor

```typescript
interface InlineEditorState {
  isEditing: boolean;                    // Modo edición activo
  editingValue: T | null;               // Valor siendo editado
  originalValue: T | null;              // Valor original
  loading: boolean;                     // Guardando cambios
  error: string | null;                 // Error general
  hasChanges: boolean;                  // Hay cambios sin guardar
  validationResults: ValidationResult;   // Resultados validación
  fieldErrors: Record<string, ValidationError[]>; // Errores por campo
  isValidating: boolean;                // Validando asíncronamente
}
```

## 🎨 Feedback Visual

### Indicadores de Campo

- **✅ Campo válido**: Borde gris normal
- **⚠️ Campo con advertencias**: Borde amarillo, fondo amarillo claro
- **❌ Campo con error**: Borde rojo, fondo rojo claro, ícono de error
- **🔄 Validando**: Spinner de carga en la etiqueta

### Mensajes de Validación

- **🔴 Errores**: Caja roja con icono AlertCircle
- **🟡 Advertencias**: Caja amarilla con icono AlertTriangle
- **🔵 Información**: Caja azul con icono Info

### Estado del Botón Guardar

- **Deshabilitado**: Sin cambios, validando o con errores
- **Habilitado**: Con cambios y validación exitosa
- **Cargando**: "Guardando..." o "Validando..."

## 🔍 Métodos de Validación

### Métodos Disponibles en el Hook

```typescript
// Validar campo específico
const result = editor.validateField('nombre', 'Nuevo valor');

// Validar objeto completo (asíncrono)
const fullResult = await editor.validateAll();

// Limpiar validación
editor.clearValidation();

// Obtener error de campo específico
const fieldError = editor.getFieldError('nombre');

// Verificar si hay errores en campo
const hasError = editor.hasFieldError('nombre');
```

### Validación Manual

```typescript
// Validar nombre de categoría
const validationResult = editor.validateField('nombre', 'Electrónicos');

if (!validationResult.isValid) {
  console.log('Errores:', validationResult.errors);
  console.log('Warnings:', validationResult.warnings);
}
```

## 🧪 Tipos de Validación

### 1. Validación Síncrona

Se ejecuta inmediatamente para retroalimentación rápida:

- **Formato de texto**: Longitud, caracteres permitidos
- **Campos requeridos**: Presencia de valores obligatorios
- **Tipos de datos**: Validación de tipos básicos

### 2. Validación Asíncrona

Se ejecuta con debounce para operaciones más complejas:

- **Duplicados**: Verificación contra existentes
- **Reglas de negocio**: Lógica compleja que requiere datos externos
- **Validaciones de servidor**: Consultas a backend

### 3. Validación por Campo

Validación individual de campos específicos:

```typescript
// Solo validar el campo nombre
const nombreValidation = editor.validateField('nombre', categoria.nombre);

if (nombreValidation.errors.length > 0) {
  // Manejar errores del campo nombre
}
```

## 📝 Ejemplos Prácticos

### Ejemplo 1: Categoría con Validación Completa

```typescript
function CategoriaEditor({ categoria, onSave, categoriasExistentes }) {
  return (
    <InlineEditor
      value={categoria}
      onSave={onSave}
      type="categoria"
      validationContext={{
        existingItems: categoriasExistentes,
        institutionId: 1
      }}
      config={{
        enableRealTimeValidation: true,
        enableAsyncValidation: true,
        validationDebounceMs: 500,
        validateOnBlur: true
      }}
      renderDisplay={(item, onEdit) => (
        <div onClick={onEdit}>
          <h3>{item.nombre}</h3>
          <p>{item.descripcion}</p>
        </div>
      )}
    />
  );
}
```

### Ejemplo 2: Presentación con Validación Personalizada

```typescript
function PresentacionEditor() {
  const editor = useInlineEditor({
    type: 'presentacion',
    validationContext: {
      itemType: 'presentacion',
      existingItems: presentaciones,
      institutionId: 1
    },
    config: {
      enableRealTimeValidation: true,
      validationDebounceMs: 300
    }
  });

  // Validación personalizada al guardar
  const handleSave = async () => {
    // Validar unidad_medida con reglas adicionales
    const unidadValidation = editor.validateField(
      'unidad_medida',
      editor.editingValue?.unidad_medida
    );

    if (!unidadValidation.isValid) {
      return { success: false, error: 'Unidad de medida inválida' };
    }

    // Continuar con guardado normal
    return await editor.saveEditing();
  };

  return (
    <InlineEditor
      value={presentacion}
      onSave={handleSave}
      type="presentacion"
      // ... otras props
    />
  );
}
```

### Ejemplo 3: Integración con Formulario Principal

```typescript
function MateriaPrimaFormulario() {
  const [categoria, setCategoria] = useState(null);
  const [categorias, setCategorias] = useState([]);

  const handleCategoriaSave = async (nuevaCategoria) => {
    try {
      const response = await createCategoria(nuevaCategoria);
      setCategorias(prev => [...prev, response.data]);
      setCategoria(response.data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return (
    <form>
      {/* Otros campos del formulario principal */}

      <div className="mb-4">
        <label>Categoría</label>
        <InlineEditor
          value={categoria}
          onSave={handleCategoriaSave}
          type="categoria"
          validationContext={{
            existingItems: categorias,
            institutionId: 1
          }}
          config={{
            enableRealTimeValidation: true,
            enableAsyncValidation: true,
            validationDebounceMs: 400
          }}
        />
      </div>

      {/* Resto del formulario */}
    </form>
  );
}
```

## 🚀 Mejores Prácticas

### 1. Configuración Recomendada

```typescript
const recommendedConfig = {
  enableRealTimeValidation: true,  // Para feedback inmediato
  enableAsyncValidation: true,     // Para detección de duplicados
  validationDebounceMs: 400,       // Balance entre UX y rendimiento
  validateOnBlur: true,            // Para validación final del campo
  enableKeyboardShortcuts: true    // Para accesibilidad
};
```

### 2. Manejo de Errores

```typescript
// Manejar errores de validación de forma user-friendly
const handleValidationError = (validationResult) => {
  if (!validationResult.isValid) {
    // Mostrar el primer error de forma prominente
    const mainError = validationResult.errors[0];
    showNotification(`Error: ${mainError.message}`, 'error');

    // Hacer scroll al primer campo con error
    const firstErrorField = mainError.path?.[0];
    if (firstErrorField) {
      document.querySelector(`[name="${firstErrorField}"]`)?.scrollIntoView();
    }
  }
};
```

### 3. Optimización de Rendimiento

```typescript
// Evitar validaciones excesivas con debounce adecuado
const performanceConfig = {
  validationDebounceMs: 600,  // Mayor debounce para listas grandes
  enableAsyncValidation: true, // Cache de validaciones asíncronas
};

// Limpiar caché de validación cuando cambie el contexto
useEffect(() => {
  if (validatorRef.current) {
    validatorRef.current.clearCache();
  }
}, [categorias, presentaciones]);
```

### 4. Accesibilidad

```typescript
// Proporcionar feedback accesible
const accessibleConfig = {
  enableKeyboardShortcuts: true,
  validateOnBlur: true,  // Importante para lectores de pantalla
};

// Estados ARIA para validación
const validationAriaProps = {
  'aria-invalid': !validationResult.isValid,
  'aria-describedby': validationResult.errors.length > 0
    ? 'validation-errors'
    : undefined,
  'aria-busy': isValidating
};
```

## 🔧 Extensiones y Personalización

### Agregar Nuevas Reglas de Validación

```typescript
// Extender schemas en inlineValidation.ts
const customSchema = baseSchema.superRefine((data, ctx) => {
  // Validación personalizada para categorías
  if (data.nombre?.includes('prohibido')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El nombre contiene palabras no permitidas',
      path: ['nombre']
    });
  }
});
```

### Validadores Personalizados

```typescript
// Crear validadores reutilizables
const createCustomValidator = (customRules) => {
  return new InlineValidator({
    ...defaultContext,
    customRules
  });
};
```

## 🐈‍⬛ Troubleshooting

### Problemas Comunes

1. **Validación no se ejecuta**:
   - Verificar que `enableRealTimeValidation` esté en `true`
   - Comprobar que el `validationContext` esté configurado correctamente

2. **Detección de duplicados no funciona**:
   - Asegurar que `enableAsyncValidation` esté en `true`
   - Verificar que `existingItems` incluya todos los items relevantes

3. **Rendimiento lento**:
   - Aumentar `validationDebounceMs`
   - Revisar tamaño de `existingItems` (considerar paginación)

4. **Estado de validación incorrecto**:
   - Llamar a `clearValidation()` cuando cambie el contexto
   - Verificar que `originalItem` se configure en `startEditing`

### Debug Mode

```typescript
// Habilitar modo debug para validación
const debugConfig = {
  enableRealTimeValidation: true,
  debug: true  // Si se implementa modo debug
};

// Console logging de resultados de validación
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Validation results:', editor.validationResults);
    console.log('Field errors:', editor.fieldErrors);
  }
}, [editor.validationResults, editor.fieldErrors]);
```

## 📚 Referencias

- **Documentación Zod**: [https://zod.dev](https://zod.dev)
- **React Hook Form**: [https://react-hook-form.com](https://react-hook-form.com)
- **Plan de Implementación**: [PLAN_IMPLEMENTACION_EDICION_INLINE.md](./PLAN_IMPLEMENTACION_EDICION_INLINE.md)

---

**Fecha de Creación**: 2 de Diciembre de 2024
**Versión**: 2.0
**Estado**: Implementación Completada - Fase 2
**Próximo Paso**: Testing y Optimización (Fase 4)