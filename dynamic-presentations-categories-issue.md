# 🔄 **Dynamic Database-Driven Presentations and Categories Management**

## 🎯 **Objetivo**

Reemplazar los arrays hardcodeados de presentaciones y categorías en el formulario de materia prima por una funcionalidad dinámica con base de datos que permita crear y gestionar nuevas opciones desde la interfaz.

## 📋 **Problema Actual**

El formulario `apps/electron-renderer/src/modules/materiaPrima/Formulario.tsx` actualmente tiene las siguientes limitaciones:

- ❌ Array **presentaciones** hardcodeado (líneas 31-47): 'Unidad', 'Caja', 'Paquete', 'Saco', etc.
- ❌ Array **categorias** hardcodeado (líneas 49-63): 'Construcción', 'Electricidad', 'Plomería', 'Pinturas', etc.
- ❌ Sin capacidad de agregar nuevas presentaciones o categorías desde la interfaz
- ❌ Datos no persistentes entre instituciones
- ❌ Mantenimiento requires cambios en código para agregar opciones

## 💡 **Solución Propuesta**

Implementar un sistema dinámico de gestión de datos de referencia (reference data) con las siguientes características:

### **Características Principales**
- ✅ **Gestión Dinámica**: Presentaciones y categorías almacenadas en base de datos
- ✅ **Creación Inline**: Agregar nuevas opciones directamente desde el formulario
- ✅ **Multi-tenant**: Soporte para diferentes instituciones con sus propios datos
- ✅ **Auto-completado**: Búsqueda y filtrado inteligente de opciones existentes
- ✅ **Validación Robusta**: Integración con React Hook Form y Zod
- ✅ **Tipo Safe**: Full TypeScript con Kysely para seguridad de tipos

### **Funcionalidades de UI**
- **Dropdown con Creación**: Selector con opción "Agregar nueva opción"
- **Confirmación Rápida**: Modal para confirmar nueva creación
- **Loading States**: Indicadores de carga durante operaciones
- **Error Handling**: Manejo robusto de errores con mensajes amigables

## 🔧 **Implementación Técnica**

### **Dependencias a Agregar**
```json
{
  "react-select": "^5.7.7",
  "@types/react-select": "^5.0.1"
}
```

### **Arquitectura de Base de Datos**

#### **Nuevas Tablas**
```sql
-- Tabla de Presentaciones
CREATE TABLE presentaciones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    abreviatura VARCHAR(20), -- Para display en UI (ej: "kg", "L", "ud")
    activo BOOLEAN DEFAULT true,
    institucion_id INTEGER NOT NULL REFERENCES institucion(id),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Categorías
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    categoria_padre_id INTEGER REFERENCES categorias(id), -- Soporte jerárquico
    activo BOOLEAN DEFAULT true,
    institucion_id INTEGER NOT NULL REFERENCES institucion(id),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para rendimiento
CREATE INDEX idx_presentaciones_institucion ON presentaciones(institucion_id);
CREATE INDEX idx_categorias_institucion ON categorias(institucion_id);
CREATE INDEX idx_presentaciones_activas ON presentaciones(activo) WHERE activo = true;
CREATE INDEX idx_categorias_activas ON categorias(activo) WHERE activo = true;
```

#### **Modificación Tabla Existente**
```sql
-- Actualizar materia_prima para referenciar las nuevas tablas
ALTER TABLE materia_prima
ADD COLUMN presentacion_id INTEGER REFERENCES presentaciones(id),
ADD COLUMN categoria_id INTEGER REFERENCES categorias(id);
```

### **Componentes React**

#### **1. Componente Principal**
```
apps/electron-renderer/src/components/ui/DynamicSelect.tsx
```
- Selector con capacidad de creación inline
- Integración con react-select Creatable
- Manejo de loading states y errores
- Soporte para validación con React Hook Form

#### **2. Hook Personalizado**
```
apps/electron-renderer/src/hooks/useReferenceData.ts
```
- Llamadas a IPC para obtener datos
- Cacheo de opciones para rendimiento
- Creación de nuevas opciones
- Manejo de errores

#### **3. Tipos Compartidos**
```
packages/shared-types/src/referenceData.ts
```
- Tipos para presentaciones y categorías
- Interfaces para operaciones CRUD
- Tipos para comunicación IPC

### **Integración IPC**

#### **Nuevos Canales**
- `referenceData:listarPresentaciones` - Obtener presentaciones activas
- `referenceData:listarCategorias` - Obtener categorías activas
- `referenceData:crearPresentacion` - Crear nueva presentación
- `referenceData:crearCategoria` - Crear nueva categoría
- `referenceData:actualizarPresentacion` - Actualizar presentación existente
- `referenceData:actualizarCategoria` - Actualizar categoría existente

#### **Handlers IPC**
```
apps/electron-main/src/main/ipc/referenceData.ts
```

### **Modificación del Formulario**

#### **Reemplazo de Arrays Hardcodeados**
```typescript
// ELIMINAR (líneas 31-47):
const presentaciones = [
  'Unidad', 'Caja', 'Paquete', 'Saco', 'Bolsa',
  'Kilogramo', 'Gramo', 'Litro', 'Mililitro',
  'Metro', 'Centímetro', 'Rollo', 'Tubo', 'Botella', 'Frasco'
]

// ELIMINAR (líneas 49-63):
const categorias = [
  'Construcción', 'Electricidad', 'Plomería', 'Pinturas',
  'Herramientas', 'Ferretería', 'Limpieza', 'Oficina',
  'Seguridad', 'Jardinería', 'Automotriz', 'Electrónica', 'Otros'
]

// REEMPLAZAR CON:
<FormField
  control={form.control}
  name="presentacion_id"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Presentación</FormLabel>
      <FormControl>
        <DynamicSelect
          tableName="presentaciones"
          value={field.value}
          onChange={field.onChange}
          placeholder="Seleccionar o crear presentación"
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

#### **Actualización Schema Zod**
```typescript
const materiaPrimaSchema = z.object({
  presentacion_id: z.string().min(1, 'La presentación es requerida'),
  categoria_id: z.string().min(1, 'La categoría es requerida'),
  // ... otros campos
})
```

## 📅 **Fases de Implementación**

### **Phase 1: Base de Datos (1 día)**
- [ ] Crear tablas `presentaciones` y `categorias`
- [ ] Migrar datos existentes de arrays a tablas
- [ ] Actualizar tabla `materia_prima` con foreign keys
- [ ] Generar tipos de Kysely con `pnpm db:codegen`

### **Phase 2: Backend IPC (1-2 días)**
- [ ] Crear handler `referenceData.ts` en main process
- [ ] Implementar operaciones CRUD básicas
- [ ] Agregar canales IPC al preload script
- [ ] Crear repository con Kysely

### **Phase 3: Hook y Componentes (2 días)**
- [ ] Instalar react-select con types
- [ ] Crear hook `useReferenceData`
- [ ] Implementar componente `DynamicSelect`
- [ ] Agregar manejo de errores y loading states

### **Phase 4: Integración Formulario (1 día)**
- [ ] Reemplazar arrays hardcodeados en Formulario.tsx
- [ ] Actualizar validación Zod
- [ ] Integrar DynamicSelect en campos existentes
- [ ] Probar creación inline de nuevas opciones

### **Phase 5: Testing y Optimización (1 día)**
- [ ] Testing unitario de componentes
- [ ] Testing de integración IPC
- [ ] Optimización de caché y rendimiento
- [ ] Documentación de uso

## 🎨 **UI/UX Consideraciones**

### **Diseño de Interfaz**
- **Select Consistente**: Seguir patrones de shadcn/ui existentes
- **Indicadores Visuales**: Iconos para opciones existentes vs nuevas
- **Confirmación Modal**: Para evitar creaciones accidentales
- **Loading States**: Spinners durante operaciones asíncronas
- **Error Messages**: Mensajes claros y accionables

### **Experiencia de Usuario**
- **Búsqueda Inteligente**: Filtrado mientras se escribe
- **Keyboard Navigation**: Soporte completo de teclado
- **Mobile Responsive**: Funcionalidad completa en móviles
- **Accessibility**: Cumplimiento de WCAG 2.1 AA

## 📋 **Criterios de Aceptancia**

### **Mínimo Viable**
- ✅ Cargar presentaciones y categorías desde base de datos
- ✅ Reemplazar arrays hardcodeados en formulario
- ✅ Crear nuevas presentaciones y categorías inline
- ✅ Persistencia entre sesiones

### **Completo**
- ✅ Soporte multi-institución
- ✅ Validación robusta con mensajes claros
- ✅ Manejo de errores con feedback al usuario
- ✅ Performance optimizada con caché
- ✅ Full TypeScript type safety

### **Extras**
- ✅ Soporte jerárquico para categorías
- ✅ Edición inline de opciones existentes
- ✅ Desactivación de opciones (soft delete)
- ✅ Importación/Exportación masiva

## 📚 **Referencias y Recursos**

### **Patrones de Referencia**
- [React-Select Creatable](https://react-select.com/creatable)
- [React Hook Form Dynamic Fields](https://react-hook-form.com/advanced-usage#field-arrays)
- [Shadcn/ui Select Component](https://ui.shadcn.com/docs/components/select)

### **Implementaciones Similares**
- Grafana - Variable management with inline creation
- Discourse - Category and tag management
- Shopify - Product variants and categories

### **Documentación del Proyecto**
- [CLAUDE.md](CLAUDE.md) - Arquitectura y patrones del proyecto
- [TAILWIND_V4_DEVELOPMENT.md](docs/TAILWIND_V4_DEVELOPMENT.md) - Guía de estilos

## 🚀 **Impacto Esperado**

### **Mejoras de Usabilidad**
- Eliminación de despliegues requeridos para agregar opciones
- Auto-servicio para usuarios con creación inline
- Mejor experiencia con búsqueda y autocompletado
- Datos consistentes y validados

### **Beneficios Técnicos**
- Base de datos única de verdad para categorías
- Multi-tenancy con aislamiento de datos
- Type safety con TypeScript y Kysely
- Cacheo para mejor rendimiento

### **Ventajas de Negocio**
- Agilización del proceso de registro de materiales
- Flexibilidad para adaptarse a necesidades específicas
- Reducción de errores con validación automática
- Escalabilidad para crecimiento futuro

---

**Etiquetas:** feature, enhancement, dynamic-forms, database, react-select, type-safe, multi-tenant
**Prioridad:** Alta
**Estimación:** 6-8 días
**Módulos afectados:** materia-prima, ui-components, ipc-handlers, database-schema