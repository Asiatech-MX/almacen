# Plan de Implementación - Sistema de Autenticación Personalizado

## Resumen Ejecutivo

Este documento describe el plan detallado para implementar un sistema de autenticación personalizado en la aplicación de gestión de almacén Electron. El enfoque utiliza la arquitectura existente (PostgreSQL + Kysely + React + TypeScript) y evita la complejidad de adaptar Better Auth para un entorno desktop.

## Contexto del Proyecto

- **Aplicación**: Gestión de almacén Electron con React 19
- **Base de datos**: PostgreSQL con Kysely type-safe queries
- **Arquitectura**: Main process (Backend) + Renderer process (Frontend)
- **Estado actual**: Sin sistema de autenticación implementado
- **Roles requeridos**: Administrador, Profesor, Estudiante

---

## 🏗️ Fase 1: Autenticación Core (2-3 días)

### Objetivo
Implementar la infraestructura fundamental de autenticación con JWT y almacenamiento seguro.

### Tareas Específicas

#### 1.1 Preparación de Base de Datos
- [ ] **Actualizar esquema tabla usuario**:
  - [ ] Agregar campos: email, telefono, fecha_expiracion, intentos_fallidos
  - [ ] Agregar campos: bloqueado_hasta, ultimo_acceso, refresh_token
  - [ ] Agregar campos: token_expiracion, creado_por, forzar_cambio_password
  - [ ] Actualizar constraint tipo_usuario para nuevos roles
- [ ] **Crear tabla sesion_usuario**:
  - [ ] Definir estructura con campos de sesión y device info
  - [ ] Configurar índices para rendimiento
  - [ ] Establecer relaciones foreign key con usuario
- [ ] **Crear tabla importacion_csv**:
  - [ ] Estructura para tracking de importaciones
  - [ ] Campos para errores JSON y estados
  - [ ] Relaciones con usuario para auditoría
- [ ] **Verificar integridad referencial**:
  - [ ] Test de constraints
  - [ ] Validación de datos migrados
  - [ ] Backup pre-migración

#### 1.2 Implementación JWT
- [ ] **Configurar librería JWT**:
  - [ ] Instalar jsonwebtoken y @types/jsonwebtoken
  - [ ] Configurar algoritmo RS256 con key rotation
  - [ ] Crear key pairs para firma y verificación
- [ ] **Definir interfaces TypeScript**:
  - [ ] JWTPayload interface con todos los campos requeridos
  - [ ] AuthResult interface para respuestas
  - [ ] SessionData interface para estado de sesión
- [ ] **Implementar token utilities**:
  - [ ] generateAccessToken() con expiración 8 horas
  - [ ] generateRefreshToken() con expiración 7 días
  - [ ] validateToken() con verificación RS256
  - [ ] refreshAccessToken() con validación

#### 1.3 Backend - Repositorio y Servicios
- [ ] **Crear AuthRepository**:
  - [ ] Extender BaseRepository<'usuario'>
  - [ ] Implementar authenticateUser() con bcrypt
  - [ ] Implementar createSession() con device tracking
  - [ ] Implementar refreshSession() con validación
  - [ ] Implementar invalidateSession() con cleanup
- [ ] **Implementar seguridad de contraseñas**:
  - [ ] Configurar bcrypt con 12 rounds mínimo
  - [ ] Crear hashPassword() function
  - [ ] Crear comparePassword() function
- [ ] **Crear AuthService**:
  - [ ] Lógica de negocio de autenticación
  - [ ] Manejo de errores específicos
  - [ ] Validación de credenciales
  - [ ] Tracking de intentos fallidos

#### 1.4 IPC Handlers
- [ ] **Crear auth.ts IPC handler**:
  - [ ] auth:login con validación completa
  - [ ] auth:logout con invalidación de sesión
  - [ ] auth:refresh con renovación automática
  - [ ] auth:validateSession para chequeo de estado
- [ ] **Integrar con patrones existentes**:
  - [ ] Seguir estructura de materiaPrima.ts
  - [ ] Implementar error handling consistente
  - [ ] Agregar logging estructurado con emojis
- [ ] **Validación de seguridad en IPC**:
  - [ ] Sanitización de inputs
  - [ ] Rate limiting básico
  - [ ] Validación de permisos

#### 1.5 Frontend - Context y Hooks
- [ ] **Crear AuthContext**:
  - [ ] Definir AuthContextType interface
  - [ ] Implementar provider con estado global
  - [ ] Manejar estado de carga y errores
  - [ ] Integrar con tema existente
- [ ] **Crear useAuth hook**:
  - [ ] Exponer estado y métodos de auth
  - [ ] Manejar persistencia de estado
  - [ ] Implementar auto-refresh
- [ ] **Crear ProtectedRoute component**:
  - [ ] HOC para proteger rutas
  - [ ] Validación de roles específicos
  - [ ] Redirect a login si no autenticado
  - [ ] Loading states para mejor UX

#### 1.6 Almacenamiento Seguro
- [ ] **Implementar safeStorage integration**:
  - [ ] Guardar refresh token en safeStorage
  - [ ] Recuperar token al iniciar aplicación
  - [ ] Manejar errores de safeStorage
  - [ ] Fallback seguro si no disponible
- [ ] **Implementar refresh automático**:
  - [ ] Detectar expiración de access token
  - [ ] Refrescar antes de expiración (5 min antes)
  - [ ] Manejar errores de refresh
  - [ ] Logout forzado si refresh falla
- [ ] **Manejo de expiración**:
  - [ ] Detectar tokens expirados
  - [ ] Forzar relogin si es necesario
  - [ ] Limpiar almacenamiento local

### Archivos Críticos
- `db/schema_postgres.sql` - Actualización de esquema
- `backend/repositories/authRepo.ts` - Nuevo repositorio
- `apps/electron-main/src/main/ipc/auth.ts` - Nuevo IPC handler
- `apps/electron-main/src/preload/index.ts` - Actualización para auth APIs
- `apps/electron-renderer/src/contexts/AuthContext.tsx` - Nuevo context
- `packages/shared-types/src/auth.ts` - Tipos compartidos

### Criterios de Aceptación
- [ ] Login/logout funcional con credenciales correctas
- [ ] Tokens JWT generados y validados correctamente
- [ ] Refresh tokens almacenados de forma segura
- [ ] Rutas protegidas redirigen a login
- [ ] Sesión persiste al reiniciar aplicación
- [ ] Error handling funciona para casos inválidos

---

## 👥 Fase 2: Gestión de Usuarios (3-4 días)

### Objetivo
Implementar CRUD completo de usuarios con control de acceso basado en roles.

### Tareas Específicas

#### 2.1 Backend - CRUD Operations
- [ ] **Crear UserRepository**:
  - [ ] Extender BaseRepository<'usuario'>
  - [ ] Implementar createUser() con validaciones
  - [ ] Implementar getUsers() con paginación y filtros
  - [ ] Implementar updateUser() con validación de cambios
  - [ ] Implementar deleteUser() con soft delete
- [ ] **Implementar validaciones de negocio**:
  - [ ] Validar email único por institución
  - [ ] Validar username único global
  - [ ] Validar reglas de expiración por rol
  - [ ] Validar límites de creación por rol
- [ ] **Manejo de relaciones**:
  - [ ] Tracking de creado_por
  - [ ] Validación de jerarquía de roles
  - [ ] Consultas con joins a institución

#### 2.2 Role-Based Access Control
- [ ] **Definir sistema de permisos**:
  - [ ] Crear enum con permisos específicos
  - [ ] Mapear permisos a roles (ADMINISTRADOR, PROFESOR, ESTUDIANTE)
  - [ ] Crear función hasPermission()
- [ ] **Implementar middleware de validación**:
  - [ ] validateRolePermission middleware
  - [ ] checkInstitutionAccess middleware
  - [ ] validateUserHierarchy middleware
- [ ] **Crear helpers de permisos**:
  - [ ] canCreateUsers() por rol
  - [ ] canManageRole() validación
  - [ ] canAccessInstitution() validación
  - [ ] getAccessibleRoles() por rol actual

#### 2.3 IPC Handlers para Usuarios
- [ ] **Crear users.ts IPC handler**:
  - [ ] users:create con validación de permisos
  - [ ] users:list con filtros y paginación
  - [ ] users:update con validación de cambios
  - [ ] users:delete con soft delete
  - [ ] users:getById para detalle
  - [ ] users:checkPermissions para validación UI
- [ ] **Implementar validaciones de seguridad**:
  - [ ] Verificar permisos en cada operación
  - [ ] Validar acceso a institution
  - [ ] Sanitizar todos los inputs
  - [ ] Rate limiting por usuario

#### 2.4 Frontend - Componentes de Gestión
- [ ] **Crear UserList component**:
  - [ ] Tabla paginada con sorting
  - [ ] Filtros por rol, institución, estado
  - [ ] Búsqueda en tiempo real
  - [ ] Acciones masivas (habilitar/deshabilitar)
- [ ] **Crear UserForm component**:
  - [ ] Formulario con validación React Hook Form
  - [ ] Campos condicionales por rol
  - [ ] Selector de fecha de expiración
  - [ ] Validación en tiempo real
- [ ] **Crear UserRoleSelector component**:
  - [ ] Dropdown con roles permitidos
  - [ ] Descripción de permisos por rol
  - [ ] Validación de jerarquía
- [ ] **Crear UserStatusToggle component**:
  - [ ] Switch para activar/desactivar
  - [ ] Confirmación para desactivar
  - [ ] Visual feedback inmediato

#### 2.5 Interfaz Administrativa
- [ ] **Crear Admin Dashboard**:
  - [ ] Estadísticas de usuarios
  - [ ] Acciones rápidas (crear profesor)
  - [ ] Usuarios recientes
  - [ ] Usuarios por expirar
- [ ] **Implementar creación rápida**:
  - [ ] Modal para creación express
  - [ ] Campos mínimos requeridos
  - [ ] Generación de password temporal
- [ ] **Gestión de expiraciones**:
  - [ ] Vista de cuentas por expirar
  - [ ] Extensión de fechas
  - [ ] Notificaciones automáticas
- [ ] **Filtros avanzados**:
  - [ ] Por rango de fechas
  - [ ] Por estado de cuenta
  - [ ] Por rol combinado
  - [ ] Guardado de filtros

#### 2.6 Validaciones y Reglas de Negocio
- [ ] **Implementar reglas de expiración**:
  - [ ] Estudiantes: 6 meses por defecto
  - [ ] Profesores: configurable por admin
  - [ ] Administradores: sin expiración
  - [ ] Notificación 30 días antes
- [ ] **Validar límites de creación**:
  - [ ] Profesores pueden crear hasta 50 estudiantes
  - [ ] Administradores sin límite
  - [ ] Validación por institución
- [ ] **Validar integridad de datos**:
  - [ ] Emails únicos por institución
  - [ ] Username único global
  - [ ] No eliminar usuarios con datos asociados

### Archivos Críticos
- `backend/repositories/userRepo.ts` - Nuevo repositorio
- `apps/electron-main/src/main/ipc/users.ts` - Nuevo IPC handler
- `apps/electron-renderer/src/modules/Users/` - Nuevo módulo
- `apps/electron-renderer/src/components/ProtectedRoute.tsx` - Actualización
- `packages/shared-types/src/user.ts` - Tipos de usuario

### Criterios de Aceptación
- [ ] CRUD completo de usuarios funcional
- [ ] Roles y permisos funcionando correctamente
- [ ] Validaciones de negocio implementadas
- [ ] Interfaz administrativa usable e intuitiva
- [ ] Filtros y búsqueda funcionales
- [ ] Manejo de errores en UI

---

## 📊 Fase 3: Sistema CSV (2-3 días)

### Objetivo
Implementar sistema de importación masiva de estudiantes con validación robusta.

### Tareas Específicas

#### 3.1 Parser y Validación CSV
- [ ] **Configurar librería CSV parsing**:
  - [ ] Instalar papaparse o similar
  - [ ] Configurar opciones de parsing
  - [ ] Manejar encoding y delimitadores
- [ ] **Implementar validación de estructura**:
  - [ ] Validar columnas requeridas
  - [ ] Validar orden de columnas
  - [ ] Manejar headers con espacios/capitalización
- [ ] **Validar tipos de datos**:
  - [ ] Email format validation
  - [ ] Username format validation
  - [ ] Teléfono format validation
  - [ ] Nombres con caracteres válidos
- [ ] **Detectar duplicados**:
  - [ ] Duplicados en mismo archivo
  - [ ] Duplicados contra base de datos
  - [ ] Reportar línea duplicada

#### 3.2 Backend - Import Service
- [ ] **Crear CsvImportService**:
  - [ ] validateCsvFile() con validación completa
  - [ ] previewImportData() con detección de errores
  - [ ] executeImport() con transacciones atómicas
  - [ ] rollbackImport() para revertir cambios
- [ ] **Implementar validaciones por lote**:
  - [ ] Validar línea por línea
  - [ ] Acumular errores por tipo
  - [ ] Permitir corrección parcial
- [ ] **Manejo de transacciones**:
  - [ ] Transaction wrapper para importación
  - [ ] Rollback automático ante errores
  - [ ] Logging de transacciones
- [ ] **Generación de reportes**:
  - [ ] Reporte de éxito/fracaso
  - [ ] Detalle de errores por línea
  - [ ] Estadísticas de importación

#### 3.3 Almacenamiento Temporal
- [ ] **Optimizar tabla importacion_csv**:
  - [ ] Estructura para errores detallados
  - [ ] JSON schema para errores estandarizados
  - [ ] Índices para consultas rápidas
- [ ] **Implementar estados de proceso**:
  - [ ] VALIDANDO, PREVIEW, CORRIGIENDO, IMPORTANDO
  - [ ] COMPLETADO, ERROR, CANCELADO
  - [ ] Transiciones de estado con validación
- [ ] **Retención de registros**:
  - [ ] Política de retención (30 días)
  - [ ] Cleanup automático
  - [ ] Archivo histórico de importaciones

#### 3.4 Frontend - Interfaz CSV
- [ ] **Crear FileUpload component**:
  - [ ] Drag & drop interface
  - [ ] Validación de tipo de archivo
  - [ ] Preview del contenido
  - [ ] Indicador de progreso
- [ ] **Crear CsvPreview component**:
  - [ ] Tabla con datos del CSV
  - [ ] Resaltado de errores
  - [ ] Navegación por páginas
  - [ ] Estadísticas de validación
- [ ] **Implementar ErrorHighlighting**:
  - [ ] Celdas con errores en rojo
  - [ ] Tooltips con descripción de error
  - [ ] Filtros para ver solo errores
  - [ ] Opción de editar inline
- [ ] **Crear ProgressBar component**:
  - [ ] Indicador de progreso real
  - [ ] Estado actual del proceso
  - [ ] Tiempo estimado restante
  - [ ] Opción de cancelar

#### 3.5 Flujo de Importación
- [ ] **Implementar paso 1 - Upload**:
  - [ ] Selección de archivo
  - [ ] Validación inicial
  - [ ] Subida al servidor
- [ ] **Implementar paso 2 - Validación**:
  - [ ] Validación completa en backend
  - [ ] Mostrar previsualización
  - [ ] Reporte de errores
- [ ] **Implementar paso 3 - Corrección**:
  - [ ] Interfaz para corregir errores
  - [ ] Validación en tiempo real
  - [ ] Re-validación después de cambios
- [ ] **Implementar paso 4 - Importación**:
  - [ ] Confirmación final
  - [ ] Ejecución de importación
  - [ ] Reporte final de resultados

#### 3.6 Manejo de Errores
- [ ] **Implementar validación detallada**:
  - [ ] Mensajes de error claros y específicos
  - [ ] Categorización de errores
  - [ ] Sugerencias de corrección
- [ ] **Opción de corrección manual**:
  - [ ] Editar celdas directamente
  - [ ] Validar cambios en tiempo real
  - [ ] Permitir saltar registros problemáticos
- [ ] **Logging completo**:
  - [ ] Log de cada paso del proceso
  - [ ] Errores con contexto completo
  - [ ] Facilidad para debugging

### Archivos Críticos
- `backend/services/csvImportService.ts` - Nuevo servicio
- `apps/electron-main/src/main/ipc/csvImport.ts` - Nuevo IPC handler
- `apps/electron-renderer/src/modules/CSVImport/` - Nuevo módulo
- `apps/electron-renderer/src/components/FileUpload.tsx` - Nuevo component
- `packages/shared-types/src/csv.ts` - Tipos CSV

### Criterios de Aceptación
- [ ] Importación CSV funcional con validación completa
- [ ] Manejo robusto de errores con corrección
- [ ] Experiencia de usuario fluida e intuitiva
- [ ] Transacciones atómicas con rollback
- [ ] Reportes detallados de resultados
- [ ] Performance aceptable para archivos grandes

---

## 🔒 Fase 4: Seguridad Avanzada (2-3 días)

### Objetivo
Implementar medidas de seguridad avanzadas para protección contra ataques comunes.

### Tareas Específicas

#### 4.1 Bloqueo de Cuentas
- [ ] **Implementar lógica de intentos fallidos**:
  - [ ] Contador de intentos por usuario
  - [ ] Bloqueo después de 5 intentos
  - [ ] Incremento exponencial de tiempo de bloqueo
- [ ] **Sistema de bloqueo temporal**:
  - [ ] Configurar duración de bloqueo (15 min, 1 hora, 24 horas)
  - [ ] Almacenar bloqueado_hasta timestamp
  - [ ] Validar bloqueo en cada login
- [ ] **Notificación de bloqueo**:
  - [ ] Mensajes claros al usuario
  - [ ] Información de duración del bloqueo
  - [ ] Opción de contacto de soporte
- [ ] **Sistema de unlock manual**:
  - [ ] Función para administradores
  - [ ] Log de unlock manual
  - [ ] Validación de permisos

#### 4.2 Restablecimiento de Contraseñas
- [ ] **Implementar flujo de reset**:
  - [ ] Generar token único de reset
  - [ ] Enviar notificación (integración futura)
  - [ ] Formulario de reset con validación
- [ ] **Tokens de reset seguros**:
  - [ ] Expiración de tokens (1 hora)
  - [ ] Uso único de tokens
  - [ ] Invalidación después de cambio
- [ ] **Validación por institución**:
  - [ ] Validar que usuario pertenezca a institución
  - [ ] Prevenir reset entre instituciones
- [ ] **Force password change**:
  - [ ] Campo forzar_cambio_password
  - [ ] Redirect a cambio de password
  - [ ] No permitir otras acciones hasta cambio

#### 4.3 Session Timeout
- [ ] **Detectar inactividad**:
  - [ ] Tracking de última actividad
  - [ ] Configurar timeout (30 minutos)
  - [ ] Actualizar timestamp en cada acción
- [ ] **Timeout configurable**:
  - [ ] Configuración por rol/institución
  - [ ] Opciones extendidas para administradores
  - [ ] Persistencia de configuración
- [ ] **Warning antes de expirar**:
  - [ ] Modal de advertencia (2 minutos antes)
  - [ ] Opción de extender sesión
  - [ ] Countdown visual
- [ ] **Refresco transparente**:
  - [ ] Auto-refresh antes de expiración
  - [ ] Validación de sesión activa
  - [ ] Manejo de errores de refresh

#### 4.4 Multi-Sesión Management
- [ ] **Tracking de sesiones activas**:
  - [ ] Device fingerprinting básico
  - [ ] IP address y user agent
  - [ ] Lista de sesiones por usuario
- [ ] **Invalidación remota**:
  - [ ] Función para cerrar sesiones específicas
  - [ ] "Cerrar todas las demás sesiones"
  - [ ] Invalidación masiva por admin
- [ ] **Límite de sesiones por usuario**:
  - [ ] Configurar máximo (ej: 3 por usuario)
  - [ ] Rechazar nuevas sesiones si se excede
  - [ ] Opción de cerrar sesión más antigua
- [ ] **Session audit**:
  - [ ] Log de creación/destrucción de sesiones
  - [ ] Tracking de dispositivos sospechosos
  - [ ] Alertas de actividad anómala

#### 4.5 Auditoría y Logging
- [ ] **Crear tabla actividad_usuario**:
  - [ ] Estructura para logs de auditoría
  - [ ] Campos: acción, usuario, timestamp, detalles
  - [ ] Índices para consultas de auditoría
- [ ] **Log de acciones críticas**:
  - [ ] Login/logout exitosos y fallidos
  - [ ] Creación/modificación de usuarios
  - [ ] Cambios de roles y permisos
  - [ ] Importaciones CSV
- [ ] **Consultas de auditoría**:
  - [ ] Logs por usuario
  - [ ] Logs por rango de fechas
  - [ ] Logs por tipo de acción
  - [ ] Exportación de logs
- [ ] **Reportes de seguridad**:
  - [ ] Intentos fallidos por IP
  - [ ] Actividad fuera de horario normal
  - [ ] Cambios masivos
  - [ ] Usuarios con patrones sospechosos

#### 4.6 Hardening de Seguridad
- [ ] **Implementar rate limiting**:
  - [ ] Límite de requests por IP/minuto
  - [ ] Límite específico para endpoints de auth
  - [ ] Blacklist dinámica de IPs abusivas
- [ ] **Validación de inputs reforzada**:
  - [ ] Sanitización de todos los parámetros
  - [ ] Validación de longitud máxima
  - [ ] Prevención de inyección SQL (Kysely ya protege)
- [ ] **Headers de seguridad**:
  - [ ] Configurar CSP headers
  - [ ] X-Frame-Options
  - [ ] X-Content-Type-Options
- [ ] **Testing de penetración básico**:
  - [ ] Test de fuerza bruta
  - [ ] Test de inyección SQL
  - [ ] Test de XSS (aunque es desktop)
  - [ ] Test de escalada de privilegios

### Archivos Críticos
- `backend/repositories/securityRepo.ts` - Nuevo repositorio
- `backend/services/sessionService.ts` - Nuevo servicio
- `apps/electron-main/src/main/ipc/security.ts` - Nuevo IPC handler
- `apps/electron-renderer/src/hooks/useSessionTimeout.ts` - Nuevo hook
- `apps/electron-renderer/src/components/SessionWarning.tsx` - Nuevo component

### Criterios de Aceptación
- [ ] Sistema robusto contra ataques comunes
- [ ] Auditoría completa de todas las acciones
- [ ] Sesiones management funcional
- [ ] Sistema de recuperación de contraseñas
- [ ] Performance impact mínimo
- [ ] Experiencia de usuario segura pero usable

---

## 📋 Checklist General del Proyecto

### Pre-Implementación
- [ ] Backup completo de base de datos
- [ ] Branch dedicado para implementación
- [ ] Review de dependencias y versiones
- [ ] Setup de entorno de desarrollo

### Durante Implementación
- [ ] Testing unitario por cada componente
- [ ] Testing de integración entre capas
- [ ] Code review por cada PR
- [ ] Documentación actualizada

### Post-Implementación
- [ ] Testing completo end-to-end
- [ ] Performance testing
- [ ] Security testing básico
- [ ] User acceptance testing

### Despliegue
- [ ] Plan de rollback definido
- [ ] Migration scripts probados
- [ ] Comunicación a usuarios
- [ ] Monitorización post-lanzamiento

---

## 🎯 Criterios de Éxito del Proyecto

### Funcionales
- [ ] Usuarios pueden autenticarse correctamente
- [ ] Roles y permisos funcionan según especificación
- [ ] Importación CSV funciona con validación
- [ ] Sistema seguro contra ataques comunes

### No Funcionales
- [ ] Performance: login < 2 segundos
- [ ] Usabilidad: experiencia intuitiva
- [ ] Confiabilidad: 99.9% uptime
- [ ] Mantenibilidad: código limpio y documentado

### de Negocio
- [ ] Mejora en seguridad de la aplicación
- [ ] Gestión eficiente de usuarios
- [ ] Automatización de procesos manuales
- [ ] Cumplimiento de requisitos específicos

---

## 📝 Notas y Consideraciones

1. **Orden de implementación**: Seguir estrictamente el orden de fases
2. **Testing continuo**: Cada fase debe completar con testing completo
3. **Documentación**: Mantener READMEs actualizados por componente
4. **Performance**: Monitorear impacto en performance de consultas
5. **Seguridad**: Priorizar seguridad sobre features secundarios
6. **UX**: Mantener experiencia de usuario consistente

## 🚀 Próximos Pasos

1. **Aprobación final del plan** por stakeholders
2. **Setup del entorno** para Fase 1
3. **Comenzar implementación Fase 1**
4. **Daily syncs** para seguimiento de progreso
5. **Retrospective** al final de cada fase

---

*Este documento es una guía viva y debe actualizarse según el progreso y descubrimientos durante la implementación.*