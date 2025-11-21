# Phase 1.1: PGTyped State Analysis

## Current Configuration Analysis

### PGTyped Configuration (.pgtypedrc.json)
```json
{
  "transforms": [
    {
      "mode": "sql",
      "include": "**/queries/**/*.sql",
      "emitTemplate": "backend/types/generated/${name}.types.ts"
    }
  ],
  "dbUrl": "postgresql://postgres:password@localhost:5432/almacen",
  "srcDir": "./backend",
  "searchPath": ["public"],
  "camelCaseColumnNames": true
}
```

### Current SQL Queries Inventory

**Total SQL Files**: 2
1. `backend/queries/materiaPrima.sql` - 12 queries
2. `backend/queries/proveedores.sql` - 4 queries

**Total Queries**: 16

### Critical Type Inconsistencies Identified

#### 1. **CRITICAL: estatus vs activo Field Mismatch**

**Materia Prima Table Issues:**
- **Database Schema**: `estatus VARCHAR(50) NOT NULL DEFAULT 'ACTIVO'`
- **PGTyped Types**:
  - `FindAllMateriaPrimaResult` uses `estatus: string` ✅
  - `FindMateriaPrimaByIdResult` uses `activo: boolean` ❌
  - `FindMateriaPrimaByCodigoBarrasResult` uses `activo: boolean` ❌

**Proveedores Table Issues:**
- **Database Schema**: `estatus VARCHAR(50) NOT NULL DEFAULT 'ACTIVO'`
- **PGTyped Types**:
  - `FindAllProveedoresResult` no status field ❌
  - `FindProveedorByIdResult` uses `activo: boolean` ❌
  - `FindProveedorByRFCResult` uses `activo: boolean` ❌

#### 2. **Schema vs Query Field Mismatches**

**Materia Prima Issues:**
- Query references fields that don't exist in schema:
  - `proveedor_id` - NOT in database schema
  - `categoria` - NOT in database schema
  - `costo_unitario` - NOT in database schema
  - `descripcion` - NOT in database schema
  - `fecha_caducidad` - NOT in database schema

**Field Name Mismatches:**
- Query uses `stock` → PGTyped generates `stock_actual`
- Query uses `fecha_registro` → PGTyped generates `creado_en`, `actualizado_en`

#### 3. **Missing Schema Columns in Queries**

**Materia Prima Schema Fields Not Used in Queries:**
- `id_institucion` - Multi-tenant support field
- `unidad_medida` - Unit of measurement field
- `imagen_url` - Only used in some queries

**Proveedores Schema Fields Not Used in Queries:**
- `id_fiscal` - Primary identifier field
- `id_institucion` - Multi-tenant support field
- `contacto` - Contact person field
- `curp` - Mexican tax ID field

### Manual Type Editing Evidence

The presence of inconsistencies between query results and schema indicates **manual type editing has occurred**, defeating the purpose of automated code generation.

### Business Logic Issues

1. **Status Logic**: Mixed use of string ('ACTIVO'/'INACTIVO') vs boolean (true/false) for status representation
2. **Provider Relations**: Queries attempt to join with providers but schema lacks proper foreign key relationships
3. **Multi-tenant Support**: Schema has `id_institucion` fields but queries ignore them

### PGTyped Configuration Issues

1. **Camel Case Setting**: `"camelCaseColumnNames": true` but inconsistent application
2. **Template Path**: Uses `${name}.types.ts` template but generated file shows evidence of manual editing
3. **Schema Drift**: No validation that generated types match actual database schema

### Performance Concerns

1. **Inefficient Joins**: `LEFT JOIN proveedor p ON 1=1` placeholder joins
2. **Unused Fields**: Querying fields that don't exist in schema
3. **Missing Indexes**: No evidence of proper indexing for queried fields

### Recommendations for Migration

1. **Standardize Status Field**: Use consistent field naming and types across all tables
2. **Fix Schema Drift**: Align queries with actual database schema
3. **Implement Proper Relations**: Add foreign key constraints where needed
4. **Remove Manual Editing**: Allow code generation to work without manual intervention
5. **Add Type Validation**: Implement runtime validation to catch schema drift

### Migration Priority Matrix

| Issue | Severity | Impact | Priority |
|-------|----------|---------|----------|
| estatus vs activo mismatch | Critical | Type Safety | 1 |
| Non-existent schema fields | Critical | Runtime Errors | 1 |
| Manual type editing | High | Maintenance | 2 |
| Inefficient joins | Medium | Performance | 3 |
| Missing multi-tenant support | Medium | Architecture | 3 |

## Next Steps

This analysis provides the foundation for Phase 1.2: Contract Tests creation, which will validate all these inconsistencies and establish baseline functionality testing.