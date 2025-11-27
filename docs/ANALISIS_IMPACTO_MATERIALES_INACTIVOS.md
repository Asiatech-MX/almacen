# 📊 Análisis de Impacto - Materiales INACTIVO en Estadísticas y Reportes

## 🎯 Resumen Ejecutivo

Los materiales con estatus **INACTIVO** están contaminando todas las estadísticas y reportes del sistema, generando datos incorrectos que impactan directamente en las decisiones de negocio. Se ha identificado un **impacto crítico** en las métricas del Dashboard y en todos los módulos de consulta de materiales.

---

## 📈 Impacto Cuantificable Actual

### Dashboard - Métricas Principales

#### 🔴 **Impacto Crítico: Total de Materiales**
- **Estado Actual:** Incluye materiales ACTIVO + INACTIVO
- **Fórmula Incorrecta:** `COUNT(*)` sobre todos los registros
- **Fórmula Correcta:** `COUNT(*) WHERE activo = true`
- **Impacto:** Sobreestimación del inventario total

#### 🔴 **Impacto Crítico: Valor Total del Inventario**
- **Estado Actual:** Incluye costo de materiales INACTIVO
- **Fórmula Incorrecta:** `SUM(stock_actual * costo_unitario)` sin filtro
- **Fórmula Correcta:** `SUM(stock_actual * costo_unitario) WHERE activo = true`
- **Impacto:** Inflación artificial del valor del inventario

#### 🔴 **Impacto Crítico: Materiales con Stock Bajo**
- **Estado Actual:** Ya está filtrado correctamente ✅
- **Fórmula:** `COUNT(*) WHERE activo = true AND stock_actual <= stock_minimo`
- **Impacto:** Sin impacto (comportamiento correcto)

#### 🔴 **Impacto Crítico: Materiales sin Stock**
- **Estado Actual:** Incluye materiales INACTIVO sin stock
- **Fórmula Incorrecta:** `COUNT(*) WHERE stock_actual = 0`
- **Fórmula Correcta:** `COUNT(*) WHERE activo = true AND stock_actual = 0`
- **Impacto:** Reporte falso de faltantes

### Estadísticas por Categoría

#### 🔴 **Impacto Alto: Análisis por Categoría**
- **Estado Actual:** Todas las categorías incluyen materiales INACTIVO
- **Problema:** Las categorías muestran conteos y valores inflados
- **Ejemplo:**
  - Categoría "Herramientas": 15 materiales (reales: 12)
  - Valor categoría: $5,000 (real: $4,200)

---

## 🖥️ Impacto por Módulo

### 1. Dashboard Principal
**Archivo:** `apps/electron-renderer/src/modules/dashboard/DashboardPage.tsx:55-59`

**Problemas Identificados:**
```typescript
// Líneas 57-59: Cálculos incorrectos
const estadisticas = useMemo(() => {
  const total = materiales.length  // ❌ Incluye INACTIVO
  const bajoStock = materiales.filter(m => m.stock_actual <= m.stock_minimo).length  // ❌ Incluye INACTIVO
  const sinStock = materiales.filter(m => m.stock_actual === 0).length  // ❌ Incluye INACTIVO
  const valorTotal = materiales.reduce((sum, m) => sum + (m.stock_actual * (m.costo_unitario || 0)), 0)  // ❌ Incluye INACTIVO

  return { total, bajoStock, sinStock, valorTotal }
}, [materiales])
```

**Impacto:**
- Tarjetas informativas con datos incorrectos
- Toma de decisiones basada en métricas falsas
- Pérdida de confianza en el sistema

### 2. Gestión de Materiales
**Archivo:** `apps/electron-renderer/src/modules/materiaPrima/GestionMateriaPrimaResponsive.tsx:315`

**Problemas Identificados:**
```typescript
// Línea 315: Hook sin filtro por defecto
const { materiales, loading, error } = useMateriaPrima({ autoLoad: true })
```

**Impacto:**
- Listado principal incluye materiales deshabilitados
- Confusión en los usuarios sobre qué materiales están disponibles
- Acciones incorrectas permitidas

### 3. Consultas Avanzadas
**Archivo:** `apps/electron-renderer/src/modules/materiaPrima/ConsultasAvanzadas.tsx:93`

**Problemas Identificados:**
```typescript
// Línea 93: Todas las consultas incluyen INACTIVO
const { materiales } = useMateriaPrima({ autoLoad: true })
```

**Impacto:**
- Búsquedas retornan resultados no relevantes
- Filtros por categoría/proveedor incluyen materiales no disponibles
- Exportación de datos con información incorrecta

### 4. Formularios y Autocompletado
**Archivos:** Varios formularios de selección de materiales

**Problemas Identificados:**
```typescript
// Todos los selects/autocompletes incluyen INACTIVO
<MateriaPrimaSelect materiales={materiales} />  // ❌ Incluye INACTIVO
```

**Impacto:**
- Usuarios pueden seleccionar materiales no disponibles
- Errores en transacciones de inventario
- Frustación en la experiencia de usuario

---

## 📋 Reportes Específicos Afectados

### 1. Reporte de Inventario General
**Estado:** ❌ **CRÍTICAMENTE AFECTADO**
- Total de artículos: Inflado
- Valor total: Inflado
- Categorías: Todas con datos incorrectos

### 2. Reporte de Stock Bajo
**Estado:** ✅ **CORRECTO**
- Ya implementa filtro `activo = true`
- No requiere cambios

### 3. Reporte de Movimientos
**Estado:** ⚠️ **PARCIALMENTE AFECTADO**
- Los movimientos existentes son válidos
- Las consultas de materiales para nuevos movimientos incluyen INACTIVO

### 4. Reporte de Valor de Inventario
**Estado:** ❌ **CRÍTICAMENTE AFECTADO**
- Valor total inflado
- Valor por categoría incorrecto

---

## 💰 Impacto Económico Estimado

### Escenario de Ejemplo
Asumiendo los siguientes datos:
- 100 materiales ACTIVO con valor total de $50,000
- 20 materiales INACTIVO con valor total de $15,000

**Distorsión Actual:**
- **Total reportado:** $65,000 (30% de inflación)
- **Total real:** $50,000
- **Distorsión:** +$15,000 (+30%)

### Impacto en Decisiones de Negocio
1. **Compras:** Sobreestimación de necesidades de stock
2. **Presupuesto:** Asignación incorrecta de recursos
3. **Auditoría:** Dificultad para reconciliar inventario físico
4. **Reportes Financieros:** Valor de activos inflado

---

## 🎯 Criterios de Aceptación por Módulo

### Dashboard
- ✅ Total de materiales: Solo ACTIVO
- ✅ Valor total: Solo materiales ACTIVO
- ✅ Stock bajo: Mantener comportamiento correcto
- ✅ Sin stock: Solo materiales ACTIVO

### Gestión de Materiales
- ✅ Listado principal: Excluir INACTIVO por defecto
- ✅ Opción para ver INACTIVO (con switch explícito)
- ✅ Acciones restringidas para INACTIVO

### Consultas Avanzadas
- ✅ Búsquedas: Excluir INACTIVO por defecto
- ✅ Filtros: Aplicar después del filtro de estatus
- ✅ Exportación: Datos consistentes con vista

### Formularios
- ✅ Autocompletado: Solo materiales ACTIVO
- ✅ Selección: Validar disponibilidad antes de permitir
- ✅ Mensajes claros sobre disponibilidad

---

## 📊 Métricas de Éxito Post-Corrección

### KPIs a Medir
1. **Precisión de Datos:** 100% de consistencia entre datos mostrados y disponibles
2. **Performance:** Sin degradación (>5% impacto en tiempo de respuesta)
3. **Usuario Satisfacción:** Reducción de quejas por "materiales no encontrados"
4. **Auditoría:** Facilidad para reconciliar inventario físico vs sistema

### Métricas Técnicas
- **Queries findAll:** Deben incluir `WHERE activo = true` por defecto
- **Caché:** Separar caché para ACTIVO vs INACTIVO
- **Índices:** Asegurar uso de índice en campo `activo`

---

## 🚨 Plan de Mitigación Inmediata

### Mientras se implementa la solución:
1. **Comunicación a Usuarios:** Informar sobre discrepancias en reportes
2. **Reportes Manuales:** Generar reportes corregidos vía SQL directo
3. **Validación Manual:** Revisar críticamente las cifras del dashboard
4. **Documentación:** Guía temporal para identificar datos correctos

---

## 🔄 Próximos Pasos

1. **Implementación Backend:** Modificar repositorio con filtros por defecto
2. **Actualización Frontend:** Modificar componentes para manejar nuevo comportamiento
3. **Testing:** Ejecutar tests de regresión
4. **Despliegue:** Implementar cambios en producción
5. **Comunicación:** Notificar a usuarios sobre mejoras
6. **Monitoreo:** Verificar correctitud de métricas post-cambio