# BarcodeGenerator Component

## Overview

El componente `BarcodeGenerator` es un componente de React para generar y gestionar códigos de barras en la aplicación de almacén. Soporta múltiples formatos de código de barras y genera vistas previas en tiempo real.

## Props

```typescript
interface BarcodeGeneratorProps {
  materialData: {
    codigo: string;
    nombre: string;
    descripcion?: string;
    unidad?: string;
    presentacion?: string;
  };
  initialBarcode?: string;
  initialFormat?: BarcodeFormat;
  onBarcodeChange?: (barcode: string) => void;
  onPrint?: (job: PrintJob) => void;
  showPreview?: boolean;
  showPrint?: boolean;
  disabled?: boolean;
}
```

## Características

- **Múltiples formatos**: CODE128, CODE39, EAN13, UPC, SKU
- **Vista previa en tiempo real**: Genera preview del código de barras
- **Validación**: Valida el formato del código ingresado
- **Integración con React Hook Form**: Controlado con `onBarcodeChange`
- **Impresión**: Soporta impresión con etiquetas Brother QL-810W

## Uso Básico

```tsx
<BarcodeGenerator
  materialData={{
    codigo: '12345',
    nombre: 'Material de ejemplo',
    unidad: 'kg'
  }}
  initialBarcode="1234567890128"
  onBarcodeChange={(barcode) => {
    console.log('Código actualizado:', barcode);
  }}
  showPreview={true}
  showPrint={true}
/>
```

## Problemas Resueltos

### Bucle Infinito "Maximum update depth exceeded"

**Problema**: El componente causaba un bucle infinito debido a la interacción entre `setValue` con `shouldValidate: true` y el efecto `useEffect` que escuchaba cambios.

**Solución Implementada**:
1. **useRef para callbacks**: Se usa `useRef` para mantener estable el callback `onBarcodeChange` entre renders.
2. **Comparación de valores**: Solo se dispara el callback si el valor realmente cambió.
3. **Dependencias optimizadas**: Se elimina `onBarcodeChange` de las dependencias del efecto principal.

```typescript
// Solución implementada para prevenir bucles
const previousBarcodeRef = useRef(barcodeValue)
const onBarcodeChangeRef = useRef(onBarcodeChange)

useEffect(() => {
  onBarcodeChangeRef.current = onBarcodeChange
}, [onBarcodeChange])

useEffect(() => {
  if (onBarcodeChangeRef.current && barcodeValue !== previousBarcodeRef.current) {
    previousBarcodeRef.current = barcodeValue
    onBarcodeChangeRef.current(barcodeValue)
  }
}, [barcodeValue]) // Sin onBarcodeChange en dependencias
```

## Patrones de Uso Recomendados

### Con React Hook Form

```tsx
// En el componente padre
const handleBarcodeChange = useCallback((barcode: string) => {
  const currentValue = form.getValues('codigo_barras');
  if (barcode !== currentValue) {
    form.setValue('codigo_barras', barcode, {
      shouldValidate: false, // 🔑 CLAVE: Prevenir bucles
      shouldDirty: true,
      shouldTouch: true
    });
    // Validación manual con debounce
    setTimeout(() => form.trigger('codigo_barras'), 150);
  }
}, [form.setValue, form.trigger]);

<BarcodeGenerator
  onBarcodeChange={handleBarcodeChange}
  // ... otras props
/>
```

## Rendimiento y Optimización

- **useCallback**: El callback `onBarcodeChange` debe estar memoizado en el componente padre.
- **Debounce**: Se recomienda usar debounce para la validación (500ms).
- **Comparación de valores**: Evita actualizaciones innecesarias.

## Formatos Soportados

| Formato | Descripción | Casos de Uso |
|---------|-------------|--------------|
| CODE128 | Alta densidad, ASCII completo | Productos con datos variables |
| CODE39 | Industrial, alfanumérico | Inventarios industriales |
| EAN13 | Retail, 13 dígitos | Productos de consumo |
| UPC | Retail EE.UU./Canadá | Productos norteamericanos |
| SKU | Personalizado para inventario | Códigos internos |

## Dependencias

- `bwip-js`: Generación de códigos de barras
- `react`: Hooks (useState, useEffect, useCallback, useRef)
- Componentes UI del proyecto (Card, Select, Input, etc.)

## Notas de Mantenimiento

1. **Evitar shouldValidate: true**: Siempre usar `shouldValidate: false` con `setValue`.
2. **Validación manual**: Usar `form.trigger()` con debounce para validación.
3. **Memoización**: Mantener callbacks memoizados para prevenir re-renders.
4. **Pruebas**: Verificar que no haya bucles infinitos al cambiar formatos rapidamente.