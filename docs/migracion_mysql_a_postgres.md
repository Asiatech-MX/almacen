# Migración de MySQL/MariaDB a PostgreSQL

## Análisis de Tablas Relevantes

### Catálogos Principales

#### 1. materiaPrima
**Campos MySQL:**
- `id` int(11) NOT NULL AUTO_INCREMENT
- `codBarra` varchar(255) NOT NULL
- `nombre` varchar(255) NOT NULL
- `marca` varchar(255) NOT NULL
- `modelo` varchar(255) NOT NULL
- `presentacion` varchar(255) NOT NULL
- `stock` float NOT NULL
- `estatus` varchar(255) NOT NULL
- `fecha_registro` varchar(255) NOT NULL
- `institucion` varchar(100) NOT NULL
- `img` longblob DEFAULT NULL

**Mapeo a PostgreSQL:**
```sql
CREATE TABLE materia_prima (
    id SERIAL PRIMARY KEY,
    codigo_barras VARCHAR(255) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    marca VARCHAR(255) NOT NULL,
    modelo VARCHAR(255) NOT NULL,
    presentacion VARCHAR(255) NOT NULL,
    stock DECIMAL(10,2) NOT NULL DEFAULT 0,
    estatus VARCHAR(50) NOT NULL DEFAULT 'ACTIVO',
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    institucion VARCHAR(100) NOT NULL,
    imagen_url VARCHAR(500) -- Reemplazar longblob por referencia a archivo
);
```

#### 2. producto
**Campos MySQL:**
- `id` int(11) NOT NULL AUTO_INCREMENT
- `codBarra` varchar(255) NOT NULL
- `nombre` varchar(255) NOT NULL
- `marca` varchar(255) NOT NULL
- `modelo` varchar(255) NOT NULL
- `cant` float NOT NULL
- `sku` varchar(255) NOT NULL
- `descripcion` varchar(255) NOT NULL
- `unidad_medida` varchar(255) NOT NULL
- `tiempo` float NOT NULL
- `unidad_medida2` varchar(255) NOT NULL
- `img` longblob DEFAULT NULL
- `stock` float NOT NULL
- `estatus` varchar(255) NOT NULL
- `fecha_registro` varchar(255) NOT NULL
- `institucion` varchar(100) NOT NULL

**Mapeo a PostgreSQL:**
```sql
CREATE TABLE producto (
    id SERIAL PRIMARY KEY,
    codigo_barras VARCHAR(255) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    marca VARCHAR(255) NOT NULL,
    modelo VARCHAR(255) NOT NULL,
    cantidad DECIMAL(10,2) NOT NULL DEFAULT 0,
    sku VARCHAR(255) NOT NULL UNIQUE,
    descripcion TEXT,
    unidad_medida VARCHAR(50) NOT NULL,
    tiempo_produccion DECIMAL(8,2) NOT NULL DEFAULT 0,
    unidad_medida_secundaria VARCHAR(50),
    imagen_url VARCHAR(500),
    stock DECIMAL(10,2) NOT NULL DEFAULT 0,
    estatus VARCHAR(50) NOT NULL DEFAULT 'ACTIVO',
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    institucion VARCHAR(100) NOT NULL
);
```

#### 3. proveedores
**Campos MySQL:**
- `id` int(11) NOT NULL
- `idFiscal` varchar(255) DEFAULT NULL
- `nombre` varchar(255) DEFAULT NULL
- `domicilio` varchar(255) DEFAULT NULL

**Mapeo a PostgreSQL:**
```sql
CREATE TABLE proveedor (
    id SERIAL PRIMARY KEY,
    id_fiscal VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    domicilio TEXT,
    telefono VARCHAR(50),
    email VARCHAR(255),
    contacto VARCHAR(255),
    estatus VARCHAR(50) NOT NULL DEFAULT 'ACTIVO',
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    institucion VARCHAR(100) NOT NULL
);
```

#### 4. empresasproveedoras
**Campos MySQL:**
- `ID fiscal` varchar(100) NOT NULL
- `Nombre` varchar(200) NOT NULL
- `Domicilio` varchar(200) NOT NULL
- `Inte` varchar(20) NOT NULL
- `Ext` varchar(50) NOT NULL
- `Colonia` varchar(100) NOT NULL
- `Ciudad` varchar(100) NOT NULL
- `Pais` varchar(100) NOT NULL
- `CP` int(11) NOT NULL
- `Telefono` varchar(100) NOT NULL
- `email` varchar(100) NOT NULL
- `Contacto` varchar(100) NOT NULL

**Mapeo a PostgreSQL:**
```sql
CREATE TABLE empresa_proveedora (
    id_fiscal VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    domicilio VARCHAR(200) NOT NULL,
    numero_interior VARCHAR(20),
    numero_exterior VARCHAR(50),
    colonia VARCHAR(100),
    ciudad VARCHAR(100),
    pais VARCHAR(100),
    codigo_postal INTEGER,
    telefono VARCHAR(100),
    email VARCHAR(100),
    contacto VARCHAR(100)
);
```

#### 5. usuario
**Campos MySQL:**
- `ID` int(11) NOT NULL AUTO_INCREMENT
- `Nombre` varchar(80) NOT NULL
- `ApellidoP` varchar(30) NOT NULL
- `ApellidoM` varchar(30) NOT NULL
- `User` varchar(30) NOT NULL
- `Pass` varchar(30) NOT NULL
- `Tipo` varchar(30) NOT NULL
- `Institucion` varchar(30) NOT NULL

**Mapeo a PostgreSQL:**
```sql
CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    apellido_paterno VARCHAR(30) NOT NULL,
    apellido_materno VARCHAR(30),
    username VARCHAR(30) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- Hash en lugar de texto plano
    tipo_usuario VARCHAR(30) NOT NULL DEFAULT 'CONSULTA',
    institucion VARCHAR(30) NOT NULL,
    estatus VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultimo_login TIMESTAMP
);
```

### Tablas Transaccionales

#### 1. entradaMaterial
**Campos MySQL:**
- `id` int(11) NOT NULL AUTO_INCREMENT
- `id_material` int(11) NOT NULL
- `id_proveedor` int(11) NOT NULL
- `cant_ante` float NOT NULL
- `cant_entrante` float NOT NULL
- `cant_actual` float NOT NULL
- `precio` double NOT NULL
- `tipo_moneda` varchar(30) NOT NULL
- `estado_material` varchar(100) NOT NULL
- `id_usuario` int(11) NOT NULL
- `fecha_mov` varchar(100) NOT NULL
- `institucion` varchar(100) NOT NULL

**Mapeo a PostgreSQL:**
```sql
CREATE TABLE entrada_material (
    id SERIAL PRIMARY KEY,
    id_material INTEGER NOT NULL REFERENCES materia_prima(id),
    id_proveedor INTEGER NOT NULL REFERENCES proveedor(id),
    cantidad_anterior DECIMAL(10,2) NOT NULL,
    cantidad_entrante DECIMAL(10,2) NOT NULL,
    cantidad_actual DECIMAL(10,2) NOT NULL,
    precio_unitario DECIMAL(12,4) NOT NULL,
    tipo_moneda VARCHAR(10) NOT NULL DEFAULT 'MXN',
    estado_material VARCHAR(100) NOT NULL,
    id_usuario INTEGER NOT NULL REFERENCES usuario(id),
    fecha_movimiento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    institucion VARCHAR(100) NOT NULL,
    numero_factura VARCHAR(100),
    comentarios TEXT
);
```

#### 2. salidaMaterial
**Campos MySQL:**
- `id` int(11) NOT NULL AUTO_INCREMENT
- `id_material` int(11) NOT NULL
- `cant_Anterior` float NOT NULL
- `cant_Saliente` float NOT NULL
- `cant_posterior` float NOT NULL
- `estado_material` varchar(250) NOT NULL
- `solicitante` varchar(250) NOT NULL
- `id_usuario` int(11) NOT NULL
- `razon_uso` varchar(100) NOT NULL
- `orden_produccion` varchar(250) DEFAULT NULL
- `fecha_movimiento` varchar(100) NOT NULL
- `institucion` varchar(100) NOT NULL

**Mapeo a PostgreSQL:**
```sql
CREATE TABLE salida_material (
    id SERIAL PRIMARY KEY,
    id_material INTEGER NOT NULL REFERENCES materia_prima(id),
    cantidad_anterior DECIMAL(10,2) NOT NULL,
    cantidad_saliente DECIMAL(10,2) NOT NULL,
    cantidad_posterior DECIMAL(10,2) NOT NULL,
    estado_material VARCHAR(100) NOT NULL,
    solicitante VARCHAR(250) NOT NULL,
    id_usuario INTEGER NOT NULL REFERENCES usuario(id),
    razon_uso TEXT NOT NULL,
    orden_produccion VARCHAR(250),
    fecha_movimiento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    institucion VARCHAR(100) NOT NULL,
    autorizado_por INTEGER REFERENCES usuario(id)
);
```

#### 3. solicitudMaterial
**Campos MySQL:**
- `ID_pedimento` int(11) NOT NULL AUTO_INCREMENT
- `id_folio` varchar(100) NOT NULL
- `empresa` varchar(255) NOT NULL
- `nom_Solicita` varchar(255) NOT NULL
- `direccion` varchar(255) NOT NULL
- `rfc` varchar(50) NOT NULL
- `telefono` varchar(50) NOT NULL
- `correo` varchar(100) NOT NULL
- `uso_CFDI` varchar(100) NOT NULL
- `forma_pago` varchar(100) NOT NULL
- `departamento_solicita` varchar(100) NOT NULL
- `fecha_solicitud` varchar(100) NOT NULL
- `id_material` int(11) NOT NULL
- `modelo` varchar(255) NOT NULL
- `marca` varchar(255) NOT NULL
- `cantidad` varchar(100) NOT NULL
- `unidad_medida` varchar(100) NOT NULL
- `id_proveedor` int(11) NOT NULL
- `id_usuario` int(11) NOT NULL
- `lugarEntrega` varchar(255) NOT NULL
- `fecha_espera_max` varchar(100) NOT NULL
- `institucion` varchar(100) NOT NULL
- `statusPedido` varchar(100) NOT NULL

**Mapeo a PostgreSQL:**
```sql
CREATE TABLE solicitud_compra (
    id SERIAL PRIMARY KEY,
    folio VARCHAR(100) NOT NULL UNIQUE,
    empresa_solicitante VARCHAR(255) NOT NULL,
    nombre_solicitante VARCHAR(255) NOT NULL,
    direccion_solicitante TEXT,
    rfc_solicitante VARCHAR(50),
    telefono_solicitante VARCHAR(50),
    correo_solicitante VARCHAR(100),
    uso_cfdi VARCHAR(100),
    forma_pago VARCHAR(100),
    departamento_solicitante VARCHAR(100),
    fecha_solicitud DATE NOT NULL,
    id_material INTEGER NOT NULL REFERENCES materia_prima(id),
    modelo_material VARCHAR(255),
    marca_material VARCHAR(255),
    cantidad_solicitada DECIMAL(10,2) NOT NULL,
    unidad_medida VARCHAR(50) NOT NULL,
    id_proveedor INTEGER REFERENCES proveedor(id),
    id_usuario_solicitante INTEGER NOT NULL REFERENCES usuario(id),
    lugar_entrega TEXT,
    fecha_esperada DATE,
    institucion VARCHAR(100) NOT NULL,
    estatus VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP,
    id_usuario_autorizo INTEGER REFERENCES usuario(id),
    comentarios TEXT
);
```

## Mapeo de Tipos de Datos

### MySQL → PostgreSQL

| MySQL | PostgreSQL | Notas |
|-------|------------|-------|
| `int(11) AUTO_INCREMENT` | `SERIAL` o `INTEGER GENERATED ALWAYS AS IDENTITY` | PostgreSQL usa SERIAL |
| `varchar(n)` | `VARCHAR(n)` | Directo |
| `text` | `TEXT` | Directo |
| `float` | `DECIMAL(10,2)` | Mayor precisión |
| `double` | `DECIMAL(12,4)` | Mayor precisión |
| `datetime` | `TIMESTAMP` | Directo |
| `date` | `DATE` | Directo |
| `longblob` | `BYTEA` o `VARCHAR` (para URLs) | Preferible guardar referencia |
| `tinyint(1)` | `BOOLEAN` | Para valores booleanos |
| `enum('a','b')` | `VARCHAR(20)` + CHECK constraint | |

## Consideraciones Especiales

### 1. Fechas
- MySQL usa `varchar` para fechas → Convertir a `TIMESTAMP` o `DATE`
- Formatos de fecha inconsistentes → Estandarizar a ISO 8601

### 2. Identificadores
- MySQL usa mayúsculas/minúsculas inconsistentemente → Estandarizar a snake_case
- `AUTO_INCREMENT` → `SERIAL` o `GENERATED ALWAYS AS IDENTITY`

### 3. Restricciones
- Agregar `FOREIGN KEY` constraints (no existen en el dump original)
- Agregar `CHECK` constraints para valores válidos
- Agregar `UNIQUE` constraints donde corresponda

### 4. Índices
- Crear índices en campos de búsqueda frecuentes
- Índices compuestos para consultas complejas
- Índices UNIQUE para campos que deben ser únicos

## Estrategia de Migración de Datos

### Opción 1: Script Node.js
```javascript
// migracion.js
const mysql = require('mysql2/promise');
const { Pool } = require('pg');

const mysqlConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'logistica_cargamentos'
};

const pgConfig = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'almacen_db'
};

async function migrarDatos() {
  const mysqlConn = await mysql.createConnection(mysqlConfig);
  const pgPool = new Pool(pgConfig);

  try {
    // Migrar usuarios
    const [usuarios] = await mysqlConn.execute('SELECT * FROM usuario');
    for (const usuario of usuarios) {
      await pgPool.query(`
        INSERT INTO usuario (nombre, apellido_paterno, apellido_materno, username, password_hash, tipo_usuario, institucion)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [usuario.Nombre, usuario.ApellidoP, usuario.ApellidoM, usuario.User, usuario.Pass, usuario.Tipo, usuario.Institucion]);
    }

    // Continuar con otras tablas...

  } catch (error) {
    console.error('Error en migración:', error);
  } finally {
    await mysqlConn.end();
    await pgPool.end();
  }
}
```

### Opción 2: pgloader
```bash
# Crear archivo de configuración pgloader
LOAD DATABASE
    FROM mysql://root:password@localhost/logistica_cargamentos
    INTO postgresql://postgres:password@localhost/almacen_db

WITH include drop, create tables, create indexes, reset sequences

SET work_mem to '256MB',
    maintenance_work_mem to '512MB'

CAST type varchar to text drop typemod,
     type datetime to timestamp,
     type longblob to text drop typemod;

ALTER TABLE NAMES MATCHING '~' TO '~_tmp';

MATERIALIZED VIEWS;
```

## Docker Compose para PostgreSQL

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: almacen_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./db/schema_postgres.sql:/docker-entrypoint-initdb.d/01-schema.sql
    networks:
      - almacen_network

  pgadmin:
    image: dpage/pgadmin4
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@almacen.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    depends_on:
      - postgres
    networks:
      - almacen_network

volumes:
  postgres_data:

networks:
  almacen_network:
    driver: bridge
```

## Validación Post-Migración

### Checklist de Verificación
1. ✅ Todos los datos migrados correctamente
2. ✅ Integridad referencial mantenida
3. ✅ Fechas convertidas correctamente
4. ✅ Valores nulos manejados apropiadamente
5. ✅ Índices creados y funcionando
6. ✅ Restricciones foreign key aplicadas
7. ✅ Secuencias de ID iniciadas correctamente
8. ✅ Rendimiento de consultas aceptable

### Queries de Validación
```sql
-- Verificar conteo de registros por tabla
SELECT
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables;

-- Verificar integridad referencial
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY';
```

Esta documentación proporciona una guía completa para la migración desde MySQL/MariaDB a PostgreSQL, considerando las particularidades del sistema de almacén y las mejores prácticas de PostgreSQL.