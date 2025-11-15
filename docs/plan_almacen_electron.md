# Plan de Implementación - Aplicación de Almacén con Electron + React 19

## Objetivo
Desarrollar una aplicación de escritorio para gestión de almacén de materia prima utilizando:
- **Electron** como contenedor de escritorio
- **React 19** para la interfaz de usuario
- **Node.js** para el backend y acceso a datos
- **PostgreSQL** como base de datos definitiva (migrando desde MySQL)

## Arquitectura Propuesta

### Stack Tecnológico
```
├── Electron (Proceso Principal)
│   ├── API IPC interna para comunicación
│   ├── Gestión de seguridad y credenciales
│   └── Coordinación con backend Node.js
├── React 19 + Vite (Renderer Process)
│   ├── Componentes funcionales con hooks
│   ├── Estado global (Context API o Zustand)
│   └── Cliente de servicios IPC
├── Node.js Backend (Main Process)
│   ├── Pool de conexiones PostgreSQL
│   ├── Repositorios de datos
│   └── Lógica de negocio
└── PostgreSQL Database
    ├── Catálogos normalizados
    ├── Transacciones con integridad referencial
    └── Índices optimizados
```

### Estructura de Carpetas
```
almacen-electron/
├── docs/                          # Documentación
│   ├── plan_almacen_electron.md
│   ├── migracion_mysql_a_postgres.md
│   └── api_documentacion.md
├── db/                            # Base de datos
│   ├── schema_postgres.sql        # Esquema PostgreSQL
│   ├── docker-compose.yml         # PostgreSQL + pgAdmin
│   └── migracion_datos/           # Scripts de migración
├── electron/                      # Proceso principal
│   ├── src/
│   │   ├── main.ts               # Punto de entrada
│   │   ├── preload.ts            # Scripts de preload
│   │   ├── ipc/                  # Canales IPC
│   │   │   ├── materiaPrima.ts
│   │   │   ├── proveedor.ts
│   │   │   ├── movimientos.ts
│   │   │   └── solicitudes.ts
│   │   └── security/             # Gestión de credenciales
│   └── package.json
├── backend/                       # Acceso a datos
│   ├── db/
│   │   ├── pool.ts               # Pool PostgreSQL
│   │   └── config.ts             # Configuración DB
│   ├── repositories/
│   │   ├── materiaPrimaRepo.ts
│   │   ├── proveedorRepo.ts
│   │   ├── movimientosRepo.ts
│   │   ├── solicitudesRepo.ts
│   │   └── usuarioRepo.ts
│   └── types/
│       └── index.ts              # Tipos TypeScript
├── renderer/                      # Aplicación React
│   ├── src/
│   │   ├── components/           # Componentes genéricos
│   │   ├── modules/             # Módulos funcionales
│   │   │   ├── materiaPrima/
│   │   │   │   ├── Lista.tsx
│   │   │   │   ├── Formulario.tsx
│   │   │   │   └── index.ts
│   │   │   ├── proveedor/
│   │   │   ├── solicitudCompra/
│   │   │   ├── movimientoMaterial/
│   │   │   └── auth/
│   │   ├── services/            # Clientes IPC
│   │   │   ├── materiaPrimaService.ts
│   │   │   ├── proveedorService.ts
│   │   │   └── ...
│   │   ├── hooks/               # Hooks personalizados
│   │   ├── types/               # Tipos frontend
│   │   └── App.tsx
│   ├── public/
│   └── package.json
├── shared/                       # Código compartido
│   ├── types/                   # Tipos compartidos
│   └── constants/               # Constantes
└── package.json                 # Workspace principal
```

## Fases de Implementación

### Fase 1: Migración y Preparación de Base de Datos PostgreSQL
- Analizar y documentar mapeo MySQL → PostgreSQL
- Crear `schema_postgres.sql` con tablas normalizadas
- Configurar Docker Compose con PostgreSQL y pgAdmin
- Implementar scripts de migración de datos
- Crear índices y restricciones foreign key

### Fase 2: Infraestructura Electron + React
- Configurar proyecto monorepo con workspace
- Implementar proceso básico Electron + preload
- Configurar Vite + React 19 en renderer
- Establecer comunicación IPC básica
- Implementar sistema de routing frontend

### Fase 3: API Interna para Materia Prima
- Implementar `materiaPrimaRepo.ts` con CRUD completo
- Crear canales IPC para operaciones de materia prima
- Desarrollar módulo React con altas, bajas y consultas
- Implementar validaciones y manejo de errores
- Agregar soporte para imágenes y códigos de barras

### Fase 4: API Interna para Proveedores
- Implementar `proveedorRepo.ts` con CRUD completo
- Crear canales IPC para gestión de proveedores
- Desarrollar módulo React con altas, bajas y consultas
- Implementar búsquedas por RFC, nombre, etc.
- Integrar con empresasproveedoras y datosproveedor

### Fase 5: API Interna para Movimientos de Material
- Implementar `movimientosRepo.ts` con transacciones
- Crear módulos para entradas y salidas de material
- Implementar actualización automática de stock
- Desarrollar historial consolidado de movimientos
- Agregar validaciones de stock y autorizaciones

### Fase 6: API Interna para Solicitudes de Compra
- Implementar `solicitudesRepo.ts` con ciclo completo
- Crear formulario de solicitud de compra
- Implementar historial con filtros avanzados
- Integrar con materia prima y proveedores
- Agregar gestión de estatus de solicitudes

### Fase 7: Autenticación y Roles
- Implementar módulo de autenticación
- Gestionar roles de usuario (administrador/consulta)
- Propagar usuario en transacciones
- Implementar seguridad de canales IPC
- Agregar auditoría de acciones

### Fase 8: Refinamientos y Optimización
- Implementar reportes y estadísticas
- Agregar exportación de datos (CSV/PDF)
- Optimizar consultas con índices
- Implementar caché local
- Agregar tema y personalización

## Mapeo de Menús a Módulos

### Materia Prima
- **Altas**: Formulario con código de barras, nombre, marca, modelo, presentación, stock inicial
- **Bajas**: Baja lógica con confirmación y motivo
- **Consultas**: Tabla filtrable con búsqueda avanzada

### Proveedor
- **Altas**: Formulario completo con datos fiscales y contacto
- **Bajas**: Baja lógica o física según relación
- **Consultas**: Búsqueda por RFC, nombre, ubicación

### Solicitud de Compra
- **Nueva Solicitud**: Selección de material/proveedor con cantidades
- **Historial**: Seguimiento de estatus y filtros temporales

### Movimiento de Material
- **Entradas**: Formulario con proveedor, cantidad, validación de stock
- **Salidas**: Validación de disponibilidad y autorización
- **Historial**: Vista consolidada con filtros múltiples

## Comunicación Renderer ↔ Backend

### Canales IPC Propuestos
```typescript
// Materia Prima
'materiaPrima:listar' → Array<MateriaPrima>
'materiaPrima:crear' → MateriaPrima
'materiaPrima:actualizar' → MateriaPrima
'materiaPrima:darBaja' → boolean

// Proveedores
'proveedor:listar' → Array<Proveedor>
'proveedor:crear' → Proveedor
'proveedor:actualizar' → Proveedor

// Movimientos
'movimiento:registrarEntrada' → EntradaMaterial
'movimiento:registrarSalida' → SalidaMaterial
'movimiento:historial' → Array<Movimiento>

// Solicitudes
'solicitud:crear' → SolicitudCompra
'solicitud:listar' → Array<SolicitudCompra>
'solicitud:actualizarEstatus' → boolean
```

## Tablas Críticas a Migrar

### Catálogos Principales
1. `materiaPrima` - Materias primas con stock
2. `producto` - Productos terminados
3. `proveedores` - Proveedores básicos
4. `empresa` - Clientes/proveedores extendidos
5. `usuario` - Usuarios del sistema

### Transaccionales
1. `entradaMaterial` - Entradas de materia prima
2. `salidaMaterial` - Salidas de materia prima
3. `solicitudMaterial` - Solicitudes de compra

## Consideraciones Técnicas

### Seguridad
- Nunca exponer credenciales PostgreSQL al renderer
- Usar consultas parametrizadas para evitar SQL injection
- Validar datos en backend antes de persistir
- Implementar sanitización de inputs

### Performance
- Pool de conexiones PostgreSQL configurado
- Índices en campos de búsqueda frecuentes
- Paginación en listados grandes
- Caché local para catálogos estáticos

### Validaciones Clave
- Unicidad de código de barras en materia prima
- Unicidad de RFC en proveedores
- Stock disponible antes de registrar salidas
- Validación de fechas de caducidad

Este plan establece las bases para una aplicación robusta, escalable y segura que migrará exitosamente el sistema actual a una arquitectura moderna con Electron + React 19 + PostgreSQL.