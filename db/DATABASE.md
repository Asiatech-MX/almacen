# Database Documentation

## Overview

This document describes the database schema and structure for the Sistema de Almacén (Warehouse Management System).

## Database Connection

The application uses PostgreSQL as the primary database. The connection is configured via the `DATABASE_URL` environment variable.

```env
DATABASE_URL=postgresql://user:password@localhost:5432/database_name
```

## Schema Diagram

```mermaid
erDiagram
    institucion {
        int id PK
        string nombre UK
        text descripcion
        string estatus
        timestamp fecha_creacion
    }

    usuario {
        int id PK
        string nombre
        string apellido_paterno
        string apellido_materno
        string username UK
        string password_hash
        string tipo_usuario
        int id_institucion FK
        string estatus
        timestamp fecha_registro
        timestamp ultimo_login
    }

    proveedor {
        int id PK
        string id_fiscal UK
        string nombre
        text domicilio
        string telefono
        string email
        string contacto
        string rfc
        string curp
        string estatus
        timestamp fecha_registro
        int id_institucion FK
    }

    materia_prima {
        int id PK
        string codigo_barras UK
        string nombre
        string marca
        string modelo
        string presentacion
        decimal stock
        decimal stock_minimo
        string estatus
        timestamp fecha_registro
        int id_institucion FK
        string imagen_url
        string unidad_medida
        boolean activo
    }

    producto {
        int id PK
        string codigo_barras UK
        string nombre
        string descripcion
        decimal stock
        decimal stock_minimo
        string estatus
        timestamp fecha_registro
        int id_institucion FK
        string imagen_url
    }

    entrada_material {
        int id PK
        int id_materia_prima FK
        decimal cantidad
        decimal costo_unitario
        decimal costo_total
        timestamp fecha_entrada
        string tipo_entrada
        string referencia
        int id_institucion FK
    }

    salida_material {
        int id PK
        int id_materia_prima FK
        decimal cantidad
        string motivo_salida
        timestamp fecha_salida
        string referencia
        int id_institucion FK
    }

    solicitud_compra {
        int id PK
        int id_materia_prima FK
        decimal cantidad_solicitada
        decimal cantidad_autorizada
        string estatus
        timestamp fecha_solicitud
        timestamp fecha_autorizacion
        int id_solicitante FK
        int id_autorizador FK
        string comentarios
        int id_institucion FK
    }

    institucion ||--o{ usuario : "has"
    institucion ||--o{ proveedor : "has"
    institucion ||--o{ materia_prima : "has"
    institucion ||--o{ producto : "has"
    institucion ||--o{ entrada_material : "has"
    institucion ||--o{ salida_material : "has"
    institucion ||--o{ solicitud_compra : "has"
    usuario ||--o{ solicitud_compra : "requests"
    usuario ||--o{ solicitud_compra : "authorizes"
    proveedor ||--o{ materia_prima : "supplies"
    materia_prima ||--o{ entrada_material : "received in"
    materia_prima ||--o{ salida_material : "removed from"
    materia_prima ||--o{ solicitud_compra : "requested"
```

## Table Definitions

### Core Tables

#### institucion
Stores institution/organization data for multi-tenant support.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier |
| nombre | VARCHAR(100) | NOT NULL UNIQUE | Institution name |
| descripcion | TEXT | | Optional description |
| estatus | VARCHAR(20) | NOT NULL DEFAULT 'ACTIVO' | Status: ACTIVO/INACTIVO |
| fecha_creacion | TIMESTAMP | NOT NULL DEFAULT NOW() | Creation timestamp |

#### usuario
Stores user accounts with role-based access control.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier |
| nombre | VARCHAR(80) | NOT NULL | First name |
| apellido_paterno | VARCHAR(30) | NOT NULL | Paternal surname |
| apellido_materno | VARCHAR(30) | | Maternal surname |
| username | VARCHAR(30) | NOT NULL UNIQUE | Login username |
| password_hash | VARCHAR(255) | NOT NULL | Hashed password |
| tipo_usuario | VARCHAR(30) | NOT NULL DEFAULT 'CONSULTA' | User role |
| id_institucion | INTEGER | NOT NULL FK | Institution reference |
| estatus | VARCHAR(20) | NOT NULL DEFAULT 'ACTIVO' | User status |
| fecha_registro | TIMESTAMP | NOT NULL DEFAULT NOW() | Registration date |
| ultimo_login | TIMESTAMP | | Last login timestamp |

#### materia_prima
**Updated 2025-12-09**: Now includes both `estatus` and `activo` columns for compatibility.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier |
| codigo_barras | VARCHAR(255) | NOT NULL UNIQUE | Barcode |
| nombre | VARCHAR(255) | NOT NULL | Material name |
| marca | VARCHAR(255) | NOT NULL | Brand |
| modelo | VARCHAR(255) | NOT NULL | Model |
| presentacion | VARCHAR(255) | NOT NULL | Presentation |
| stock | DECIMAL(10,2) | NOT NULL DEFAULT 0 CHECK >= 0 | Current stock |
| stock_minimo | DECIMAL(10,2) | DEFAULT 0 CHECK >= 0 | Minimum stock threshold |
| estatus | VARCHAR(50) | NOT NULL DEFAULT 'ACTIVO' CHECK IN ('ACTIVO','INACTIVO','SUSPENDIDO') | **NEW** - Status column |
| fecha_registro | TIMESTAMP | NOT NULL DEFAULT NOW() | Registration date |
| id_institucion | INTEGER | NOT NULL FK | Institution reference |
| imagen_url | VARCHAR(500) | | Product image URL |
| unidad_medida | VARCHAR(50) | NOT NULL DEFAULT 'PIEZA' | Unit of measure |
| activo | BOOLEAN | NOT NULL DEFAULT true | **LEGACY** - Boolean active flag |

**Important Notes**:
- The `estatus` column was added on 2025-12-09 to fix the Stock Bajo query issue
- Both `estatus` and `activo` columns are maintained for backward compatibility
- `estatus` accepts: 'ACTIVO', 'INACTIVO', 'SUSPENDIDO'
- `activo` is maintained for legacy queries and will be deprecated in future versions

#### proveedor
Stores supplier information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique identifier |
| id_fiscal | VARCHAR(50) | NOT NULL UNIQUE | Fiscal ID |
| nombre | VARCHAR(255) | NOT NULL | Supplier name |
| domicilio | TEXT | | Address |
| telefono | VARCHAR(50) | | Phone number |
| email | VARCHAR(255) | | Email address |
| contacto | VARCHAR(255) | | Contact person |
| rfc | VARCHAR(20) | | Tax ID (Mexico) |
| curp | VARCHAR(20) | | Population ID (Mexico) |
| estatus | VARCHAR(50) | NOT NULL DEFAULT 'ACTIVO' | Status |
| fecha_registro | TIMESTAMP | NOT NULL DEFAULT NOW() | Registration date |
| id_institucion | INTEGER | NOT NULL FK | Institution reference |

## Indexes

### Performance Indexes

| Index Name | Table | Columns | Purpose |
|------------|-------|---------|---------|
| idx_materia_prima_estatus | materia_prima | estatus | Optimize status filtering |
| idx_materia_prima_stock_bajo | materia_prima | stock, stock_minimo, estatus | Low stock queries |
| idx_proveedor_estatus | proveedor | estatus, id_institucion | Supplier listing |
| idx_usuario_institucion | usuario | id_institucion, estatus | User authentication |

## Constraints

### Check Constraints

```sql
-- usuario.tipo_usuario
CHECK (tipo_usuario IN ('ADMIN', 'PROFESOR', 'CONSULTA'))

-- usuario.estatus
CHECK (estatus IN ('ACTIVO', 'INACTIVO'))

-- materia_prima.estatus
CHECK (estatus IN ('ACTIVO', 'INACTIVO', 'SUSPENDIDO'))

-- proveedor.estatus
CHECK (estatus IN ('ACTIVO', 'INACTIVO'))

-- Stock validation
CHECK (stock >= 0)
CHECK (stock_minimo >= 0)
```

## Recent Changes

### 2025-12-09 - Fix Columna Estatus
- Added `estatus` column to `materia_prima` table
- Implemented CHECK constraint for allowed values
- Created index for query optimization
- All existing records populated with 'ACTIVO'
- Maintained backward compatibility with `activo` column

## Migration Strategy

The database uses the following migration approach:
1. Schema changes are documented in `db/schema_postgres.sql`
2. Backups are created before any structural changes
3. Gradual migration with compatibility periods for deprecated columns
4. Automated validation scripts ensure schema consistency

## Data Isolation

All tables reference `institucion` to provide multi-tenant data isolation:
- Each institution sees only its own data
- Foreign key constraints ensure data integrity
- Queries automatically filter by institution context

## Audit Trail

The system maintains audit trails through:
- `fecha_registro` timestamps on all records
- `ultimo_login` tracking for users
- Transaction logs in movement tables (entrada/salida)
- Change history through application-level logging