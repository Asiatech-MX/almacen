# Diagnóstico: Formulario Proveedores/Altas vs Base de Datos

## 📋 Campos del Formulario (Identificados en la imagen)

### Información General
- **Lista de Empresas** (dropdown)
- **Nombre de Empresa**
- **Disponibilidad**

### Contacto
- **Nombre de Contacto**
- **RFC**
- **Teléfono**
- **Correo**

### Dirección
- **Calle**
- **No. Ext**
- **No. Int**
- **Colonia**
- **Estado**
- **País**

### Condiciones Comerciales
- **Condición de Pago** (dropdown)
- **Condición de Entrega**
- **Clasificación** (dropdown)

---

## 🗃️ Estructura Actual de la Base de Datos

### Tabla `proveedor`
```sql
- ✅ id (PK, SERIAL)
- ✅ id_fiscal (VARCHAR, NOT NULL, UNIQUE)
- ✅ nombre (VARCHAR, NOT NULL)
- ✅ domicilio (TEXT)
- ✅ telefono (VARCHAR)
- ✅ email (VARCHAR)
- ✅ contacto (VARCHAR)
- ✅ rfc (VARCHAR)
- ✅ estatus (VARCHAR, DEFAULT 'ACTIVO')
- ✅ fecha_registro (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- ✅ id_institucion (INTEGER, FK)
- ➕ curp (VARCHAR, opcional)
```

**Constraints:**
- PRIMARY KEY (id)
- UNIQUE (id_fiscal)
- FOREIGN KEY (id_institucion)
- CHECK (estatus = 'ACTIVO' | 'INACTIVO')

**Indexes:**
- idx_proveedor_id_fiscal
- idx_proveedor_nombre
- idx_proveedor_rfc
- idx_proveedor_estatus

### Tabla `empresa_proveedora`
```sql
- ✅ id_fiscal (VARCHAR, PK, FK a proveedor)
- ✅ nombre (VARCHAR, NOT NULL)
- ✅ domicilio (VARCHAR, NOT NULL)
- ✅ numero_interior (VARCHAR)
- ✅ numero_exterior (VARCHAR)
- ✅ colonia (VARCHAR)
- ✅ ciudad (VARCHAR)
- ✅ pais (VARCHAR)
- ✅ codigo_postal (INTEGER)
- ✅ telefono (VARCHAR)
- ✅ email (VARCHAR)
- ✅ contacto (VARCHAR)
- ✅ condicion_pago (VARCHAR)
- ✅ condicion_entrega (VARCHAR)
- ✅ fecha_registro (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
```

**Constraints:**
- PRIMARY KEY (id_fiscal)
- Relación implícita con proveedor.id_fiscal

---

## 🎯 Diagnóstico de Correspondencia

### ✅ Campos Completamente Cubiertos

| Campo Formulario | Tabla BD | Campo BD | Estado |
|------------------|----------|----------|--------|
| Nombre de Empresa | proveedor | nombre | ✅ Completo |
| RFC | proveedor | rfc | ✅ Completo |
| Teléfono | proveedor, empresa_proveedora | telefono | ✅ Completo |
| Correo | proveedor, empresa_proveedora | email | ✅ Completo |
| Nombre de Contacto | proveedor, empresa_proveedora | contacto | ✅ Completo |
| Calle | empresa_proveedora | domicilio | ✅ Completo |
| No. Ext | empresa_proveedora | numero_exterior | ✅ Completo |
| No. Int | empresa_proveedora | numero_interior | ✅ Completo |
| Colonia | empresa_proveedora | colonia | ✅ Completo |
| País | empresa_proveedora | pais | ✅ Completo |
| Condición de Pago | empresa_proveedora | condicion_pago | ✅ Completo |
| Condición de Entrega | empresa_proveedora | condicion_entrega | ✅ Completo |

### ⚠️ Campos Parcialmente Cubiertos

| Campo Formulario | Tabla BD | Campo BD | Observación |
|------------------|----------|----------|-------------|
| Estado | empresa_proveedora | ciudad | Podría usarse `ciudad` como sustituto, pero no es equivalente |

### ❌ Campos Faltantes

| Campo Formulario | Tipo | Recomendación |
|------------------|------|---------------|
| Disponibilidad | VARCHAR/BOOLEAN | Agregar a tabla `proveedor` o `empresa_proveedora` |
| Clasificación | VARCHAR/ENUM | Agregar a tabla `proveedor` o `empresa_proveedora` |

### 🔧 Elementos Funcionales (No requieren campos BD)

| Elemento | Tipo | Implementación |
|----------|------|---------------|
| Lista de Empresas (dropdown) | UI | Consultar tabla `proveedor` para poblar |
| Habilitar Proveedor (botón) | UI | Actualizar campo `proveedor.estatus` |

---

## 🔄 Campos Adicionales en BD (no visibles en formulario)

| Tabla | Campo | Uso Potencial |
|-------|-------|---------------|
| empresa_proveedora | ciudad | Podría usarse para "Estado" |
| empresa_proveedora | codigo_postal | Información adicional de dirección |
| proveedor | curp | Información fiscal adicional |
| proveedor | estatus | Vinculado con botón "Habilitar Proveedor" |

---

## 🔧 Recomendaciones de Migración

### Opción A: Migración Completa (Recomendada)

```sql
-- Agregar a tabla proveedor
ALTER TABLE proveedor
ADD COLUMN disponibilidad VARCHAR(20) DEFAULT 'DISPONIBLE',
ADD COLUMN clasificacion VARCHAR(50);

-- Agregar a tabla empresa_proveedora
ALTER TABLE empresa_proveedora
ADD COLUMN estado VARCHAR(100);

-- Opcional: Agregar CHECK constraints
ALTER TABLE proveedor
ADD CONSTRAINT chk_disponibilidad
CHECK (disponibilidad IN ('DISPONIBLE', 'NO DISPONIBLE', 'PENDIENTE'));

ALTER TABLE proveedor
ADD CONSTRAINT chk_clasificacion
CHECK (clasificacion IN ('PRIORITARIO', 'OCASIONAL', 'ESTRATEGICO', 'EXCLUSIVO'));
```

### Opción B: Solución sin Migración (Mapeo)

**Mapeos sugeridos:**
- `Estado` → `empresa_proveedora.ciudad`
- `Disponibilidad` → `proveedor.estatus` ('ACTIVO' = DISPONIBLE)
- `Clasificación` → Implementar con tabla adicional o valor hardcoded

---

## 📊 Resumen de Compatibilidad

| Categoría | Total Campos | Cubiertos | Parciales | Faltantes | % Compatibilidad |
|-----------|-------------|----------|-----------|-----------|-----------------|
| Información General | 3 | 2 | 0 | 1 | 67% |
| Contacto | 4 | 4 | 0 | 0 | 100% |
| Dirección | 6 | 5 | 1 | 0 | 83% |
| Condiciones Comerciales | 3 | 2 | 0 | 1 | 67% |
| **TOTAL** | **16** | **13** | **1** | **2** | **81%** |

---

## 🎯 Conclusión

La base de datos está **casi completa** para soportar el formulario de altas de proveedores:

- **81% de compatibilidad** general
- Solo **2 campos faltantes** (disponibilidad y clasificación)
- **1 campo adaptable** (estado ↔ ciudad)

**Recomendación:** Realizar una migración simple para agregar los campos faltantes, lo que llevaría la compatibilidad al **100%** con mínimo esfuerzo.

**Prioridades de implementación:**
1. 🔥 **Urgente**: Agregar campo `clasificacion` para funcionalidad completa
2. 📋 **Importante**: Agregar campo `disponibilidad` para mostrar estado actual
3. 📝 **Opcional**: Agregar campo `estado` específico para mayor precisión

---

## 📄 Documentos Relacionados

- [Proveedor-altas.png](Proveedor-altas.png) - Imagen del formulario analizado
- [PROVEEDOR_UUID_MIGRATION_COMPLETE.md](PROVEEDOR_UUID_MIGRATION_COMPLETE.md) - Documentación de migración anterior

---

*Documento generado: 2025-11-19*
*Análisis basado en imagen de formulario y estructura actual de base de datos PostgreSQL*