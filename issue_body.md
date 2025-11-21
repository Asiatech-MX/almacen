# 🎯 **Objetivo**

Reemplazar el campo de entrada manual de código de barras (EAN-13 únicamente) en el formulario de materia prima por una funcionalidad completa de generación de códigos de barras que soporte múltiples formatos e integración con impresora Brother QL-810Wc.

## 📋 **Problema Actual**

El formulario `apps/electron-renderer/src/modules/materiaPrima/Formulario.tsx` actualmente tiene las siguientes limitaciones:

- ❌ Solo acepta códigos de barras EAN-13 mediante entrada manual
- ❌ Sin capacidad de generación automática de códigos
- ❌ Limitado a un único formato (EAN-13)
- ❌ Sin integración con impresora de etiquetas
- ❌ Validación restrictiva que impide otros formatos estándar

## 💡 **Solución Propuesta**

Implementar un sistema completo de generación de códigos de barras con las siguientes características:

### **Características Principales**
- ✅ **Generación Automática**: Crear códigos de barras desde datos del material
- ✅ **Múltiples Formatos**: Soportar CODE128, CODE39, ITF, QR codes, y más
- ✅ **Impresión Integrada**: Comunicación directa con Brother QL-810Wc
- ✅ **Vista Previa**: Preview en tiempo real del código generado
- ✅ **Impresión por Lotes**: Capacidad para imprimir múltiples etiquetas
- ✅ **Plantillas Personalizables**: Diseños de etiquetas configurables

### **Formatos Soportados**
- **Lineales**: CODE128 (recomendado), CODE39, EAN-13, ITF, UPC-A
- **2D**: QR codes
- **Futuros**: DataMatrix, PDF417 (extensibles)

## 🔧 **Implementación Técnica**

### **Dependencias a Agregar**
```json
{
  "jsbarcode": "^3.11.5",
  "react-qr-code": "^2.0.12",
  "node-brother-label-printer": "^1.0.4"
}
```

### **Arquitectura de Componentes**

#### **1. Componente Principal**
```
apps/electron-renderer/src/components/ui/BarcodeGenerator.tsx
```
- Generación de códigos de barras en tiempo real
- Selector de formatos con validación
- Preview integrado con canvas
- Integración con formulario existente

#### **2. Componentes Auxiliares**
```
apps/electron-renderer/src/components/ui/
├── BarcodePreview.tsx          # Vista previa de código
├── LabelTemplate.tsx           # Diseño de etiquetas
└── PrintQueue.tsx              # Gestión de cola de impresión
```

#### **3. Servicios de Impresión**
```
apps/electron-renderer/src/services/impresion.ts     # Cliente IPC
apps/electron-main/src/main/ipc/impresion.ts         # Handler main process
```

#### **4. Tipos Compartidos**
```
packages/shared-types/src/impresion.ts               # Tipos para impresión
```

### **Integración IPC**

#### **Canales de Comunicación**
- `impresion:generarCodigo` - Generar código de barras
- `impresion:imprimirEtiqueta` - Imprimir etiqueta individual
- `impresion:imprimirLote` - Imprimir múltiples etiquetas
- `impresion:descubrirImpresoras` - Descubrir impresoras disponibles
- `impresion:estadoImpresora` - Verificar estado de impresora

### **Modificación del Formulario Existente**

#### **Cambios en Formulario.tsx**
- Reemplazar campo `codigo_barras` (líneas 352-376)
- Agregar tab de "Código de Barras" en interfaz existente
- Mantener compatibilidad con datos existentes
- Actualizar schema Zod de validación

#### **Nueva Estructura del Formulario**
```typescript
// Reemplazar campo actual con:
<BarcodeGenerator
  value={watch('codigo_barras')}
  onChange={(value) => setValue('codigo_barras', value)}
  materialData={getValues()}
  onPrint={handlePrintLabel}
/>
```

## 📅 **Fases de Implementación**

### **Phase 1: Generación de Códigos (2-3 días)**
- [ ] Instalar dependencias (JsBarcode, react-qr-code)
- [ ] Crear componente `BarcodeGenerator.tsx`
- [ ] Implementar soporte para CODE128, CODE39, QR codes
- [ ] Integrar con formulario de materia prima
- [ ] Actualizar validaciones Zod
- [ ] Testing unitario de componentes

### **Phase 2: Integración IPC (2 días)**
- [ ] Crear handlers en main process (`impresion.ts`)
- [ ] Implementar APIs en preload script
- [ ] Crear servicio cliente en renderer
- [ ] Agregar canales IPC para comunicación
- [ ] Manejo de errores y validación

### **Phase 3: Impresión Brother (2-3 días)**
- [ ] Instalar y configurar `node-brother-label-printer`
- [ ] Implementar comunicación con QL-810Wc
- [ ] Crear plantillas de etiquetas estándar
- [ ] Implementar vista previa de impresión
- [ ] Soporte para configuración de tamaño de etiquetas

### **Phase 4: Funcionalidades Avanzadas (2 días)**
- [ ] Impresión por lotes
- [ ] Diseñador de plantillas
- [ ] Historial de impresión
- [ ] Configuración de impresoras
- [ ] Manejo de cola de impresión

### **Phase 5: Testing y Optimización (1-2 días)**
- [ ] Testing con impresora física
- [ ] Optimización de rendimiento
- [ ] Manejo robusto de errores
- [ ] Documentación de uso
- [ ] Integración con módulos existentes

## 🎨 **UI/UX Consideraciones**

### **Diseño de Interfaz**
- **Tabbed Interface**: Mantener estructura existente con nueva pestaña de códigos
- **Real-time Preview**: Canvas para vista previa instantánea
- **Format Selector**: Dropdown con iconos para cada formato
- **Print Preview**: Modal con vista previa de etiqueta antes de imprimir
- **Batch Operations**: Checkbox múltiple para impresión por lotes

### **Integración Visual**
- Seguir patrones de shadcn/ui existentes
- Utilizar Tailwind CSS v4 consistentemente
- Mantener responsividad móvil
- Iconos descriptivos para cada acción

## 📋 **Criterios de Aceptancia**

### **Mínimo Viable**
- ✅ Generar CODE128 desde datos del material
- ✅ Reemplazar campo EAN-13 en formulario
- ✅ Vista previa en tiempo real
- ✅ Impresión básica con Brother QL-810Wc

### **Completo**
- ✅ Soporte para 5+ formatos de código de barras
- ✅ Plantillas de etiquetas configurables
- ✅ Impresión por lotes funcional
- ✅ Manejo robusto de errores
- ✅ Documentación completa

### **Extras**
- ✅ Diseñador visual de plantillas
- ✅ Historial de impresiones
- ✅ Soporte offline
- ✅ Exportar a PDF/PNG

## 📚 **Referencias y Recursos**

### **Documentación Existente**
- [INTEGRACION_IMPRESORA_BROTHER_QL_810WC_CODIGOS_BARRAS.md](docs/INTEGRACION_IMPRESORA_BROTHER_QL_810WC_CODIGOS_BARRAS.md)
- [TAILWIND_V4_DEVELOPMENT.md](docs/TAILWIND_V4_DEVELOPMENT.md)

### **Librerías y Herramientas**
- [JsBarcode](https://github.com/lindell/JsBarcode) - Generación de códigos lineales
- [react-qr-code](https://github.com/zpao/qrcode.react) - Generación de QR codes
- [node-brother-label-printer](https://www.npmjs.com/package/node-brother-label-printer) - Integración Brother

### **Patrones de Arquitectura**
- IPC Communication pattern (ver `CLAUDE.md`)
- Component structure (ver `apps/electron-renderer/src/components/`)
- Form patterns (ver módulo `materiaPrima` existente)

## 🚀 **Impacto Esperado**

### **Mejoras de Usabilidad**
- Eliminación de entrada manual de códigos
- Reducción de errores en digitación
- Agilización del proceso de registro
- Soporte para múltiples formatos industriales

### **Beneficios Operativos**
- Impresión directa de etiquetas
- Estandarización de codificación
- Integración con procesos existentes
- Escalabilidad para nuevos formatos

### **Ventajas Técnicas**
- Código type-safe y mantenible
- Arquitectura consistente con proyecto
- Testing integral
- Documentación completa

---

**Etiquetas:** feature, enhancement, barcode, printing, integration, react, typescript, electron
**Prioridad:** Alta
**Estimación:** 8-12 días
**Módulos afectados:** materia-prima, ui-components, ipc-handlers