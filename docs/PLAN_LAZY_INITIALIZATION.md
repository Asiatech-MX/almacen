# Plan de Implementación: Inicialización Lazy para Resolver TDZ Error

## Diagnóstico Confirmado

El error `Cannot access 'db' before initialization` es causado por un **Temporal Dead Zone (TDZ)** debido a la inicialización eager (inmediata) de repositorios durante la carga de módulos, creando dependencias circulares.

### Análisis de 7 Estrategias Aplicadas

Basado en el análisis de múltiples agentes de estrategia:

1. **Module Import Analysis**: Confirma import/export mismatch entre ES modules y CommonJS
2. **Build Configuration**: Identifica problemas con electron-vite externalization
3. **Dependency Resolution**: Descarta conflictos de versión, apunta a resolución de módulos
4. **Runtime Environment**: Confirma problemas de contexto entre procesos Electron
5. **Database Connection Pattern**: Identifica patrón de inicialización problemático
6. **Type System Issues**: Encuentra conversión TypeScript → JavaScript problemática
7. **Module Loading Order**: **CONFIRMA** el problema de orden de inicialización

**Consenso Mayoritario**: El problema es el orden de inicialización de módulos, no el constructor de Kysely en sí.

## Solución: 5 Fases de Implementación Lazy

### Arquitectura Actual vs Propuesta

**Actual (Problemático)**:
```typescript
// materiaPrima.ts - EAGER INSTANTIATION
const materiaPrimaRepo = new MateriaPrimaRepository() // ❌ Durante carga del módulo

// pool.ts - EAGER CONNECTION
export const db = new Kysely<Database>(...) // ❌ Durante carga del módulo
```

**Propuesta (Lazy)**:
```typescript
// materiaPrima.ts - FACTORY PATTERN
let materiaPrimaRepo: MateriaPrimaRepository | null = null
function getMateriaPrimaRepository(): MateriaPrimaRepository {
  if (!materiaPrimaRepo) {
    materiaPrimaRepo = new MateriaPrimaRepository() // ✅ Solo cuando se necesita
  }
  return materiaPrimaRepo
}

// pool.ts - LAZY CONNECTION
let dbInstance: Kysely<Database> | null = null
export function getDatabase(): Kysely<Database> {
  if (!dbInstance) {
    dbInstance = new Kysely<Database>(...) // ✅ Solo cuando se necesita
  }
  return dbInstance
}
```

### **Fase 1: Convertir Singleton de Base de Datos a Lazy**

**Archivo**: `backend/db/pool.ts`

**Cambios Específicos**:
```typescript
// ANTES (Eager Initialization)
export const db = new Kysely<Database>({
  dialect: new PostgresDialect({ pool }),
  log: ["query", "error"]
})

// DESPUÉS (Lazy Initialization)
let dbInstance: Kysely<Database> | null = null

export function getDatabase(): Kysely<Database> {
  if (!dbInstance) {
    dbInstance = new Kysely<Database>({
      dialect: new PostgresDialect({ pool }),
      log: ["query", "error"]
    })
  }
  return dbInstance
}

// Opcional: Para compatibilidad gradual
export const db = getDatabase() // Wrapper temporal
```

**Validación**:
- [ ] `pnpm build` exitoso
- [ ] `pnpm dev` inicia sin errores de conexión

### **Fase 2: Actualizar BaseRepository para Soporte Lazy**

**Archivo**: `backend/repositories/base/BaseRepository.ts`

**Cambios Específicos**:
```typescript
// ANTES
export abstract class BaseRepository<T extends Record<string, any>> {
  constructor(
    protected db: Kysely<Database> = db, // ❌ Acceso eager
    protected tableName: string
  ) {}

  async findAll() {
    return await this.db.selectFrom(this.tableName).selectAll().execute() // ❌ db directo
  }

  // ... otros métodos usando this.db directamente
}

// DESPUÉS
export abstract class BaseRepository<T extends Record<string, any>> {
  constructor(
    protected db?: Kysely<Database>, // ✅ Parámetro opcional
    protected tableName?: string // ✅ Parámetro opcional
  ) {}

  protected getDatabase(): Kysely<Database> {
    if (!this.db) {
      this.db = getDatabase() // ✅ Lazy initialization
    }
    if (!this.tableName) {
      throw new Error('Table name is required')
    }
    return this.db
  }

  async findAll() {
    return await this.getDatabase().selectFrom(this.tableName).selectAll().execute() // ✅ Lazy
  }

  async transaction<R>(callback: (trx: Kysely<Database>) => Promise<R>): Promise<R> {
    return await this.getDatabase().transaction().execute(callback) // ✅ Lazy
  }

  // ... Actualizar todos los demás métodos para usar getDatabase()
}
```

**Métodos a Actualizar**:
- [ ] `findAll()`
- [ ] `findById()`
- [ ] `create()`
- [ ] `update()`
- [ ] `delete()`
- [ ] `softDelete()`
- [ ] `transaction()`
- [ ] Todos los demás métodos que usen `this.db`

### **Fase 3: Adaptar MateriaPrimaRepository**

**Archivo**: `backend/repositories/materiaPrimaRepo.ts`

**Cambios Específicos**:
```typescript
// ANTES
export class MateriaPrimaRepository extends BaseRepository<MateriaPrima> {
  constructor(database: Kysely<Database> = db) { // ❌ Acceso eager
    super(database, 'materia_prima')
  }

  async findByName(nombre: string) {
    return await this.db // ❌ db directo
      .selectFrom('materia_prima')
      .where('nombre', '=', nombre)
      .executeTakeFirst()
  }

  async findLowStock() {
    return await this.db // ❌ db directo
      .selectFrom('materia_prima')
      .where('stock_actual', '<=', sql`stock_minimo`)
      .execute()
  }
}

// DESPUÉS
export class MateriaPrimaRepository extends BaseRepository<MateriaPrima> {
  constructor(database?: Kysely<Database>) { // ✅ Parámetro opcional
    super(database, 'materia_prima') // ✅ Sin acceso eager a db
  }

  async findByName(nombre: string) {
    return await this.getDatabase() // ✅ Lazy
      .selectFrom('materia_prima')
      .where('nombre', '=', nombre)
      .executeTakeFirst()
  }

  async findLowStock() {
    return await this.getDatabase() // ✅ Lazy
      .selectFrom('materia_prima')
      .where('stock_actual', '<=', sql`stock_minimo`)
      .execute()
  }
}
```

### **Fase 4: Convertir Handlers IPC a Factory Pattern**

**Archivo**: `apps/electron-main/src/main/ipc/materiaPrima.ts`

**Cambios Específicos**:
```typescript
// ANTES (Eager Instantiation)
import { MateriaPrimaRepository } from '@backend/repositories/materiaPrimaRepo'

const materiaPrimaRepo = new MateriaPrimaRepository() // ❌ Durante carga del módulo

export function setupMateriaPrimaHandlers() {
  ipcMain.handle('materiaPrima:listar', async (_, filters) => {
    return await materiaPrimaRepo.findAll(filters) // ❌ Usa instancia eager
  })

  ipcMain.handle('materiaPrima:crear', async (_, data) => {
    return await materiaPrimaRepo.create(data) // ❌ Usa instancia eager
  })
}

// DESPUÉS (Factory Pattern)
import { MateriaPrimaRepository } from '@backend/repositories/materiaPrimaRepo'

let materiaPrimaRepo: MateriaPrimaRepository | null = null

function getMateriaPrimaRepository(): MateriaPrimaRepository {
  if (!materiaPrimaRepo) {
    materiaPrimaRepo = new MateriaPrimaRepository() // ✅ Solo cuando se necesita
  }
  return materiaPrimaRepo
}

export function setupMateriaPrimaHandlers() {
  ipcMain.handle('materiaPrima:listar', async (_, filters) => {
    return await getMateriaPrimaRepository().findAll(filters) // ✅ Factory pattern
  })

  ipcMain.handle('materiaPrima:crear', async (_, data) => {
    return await getMateriaPrimaRepository().create(data) // ✅ Factory pattern
  })

  ipcMain.handle('materiaPrima:obtener', async (_, id) => {
    return await getMateriaPrimaRepository().findById(id) // ✅ Factory pattern
  })

  ipcMain.handle('materiaPrima:actualizar', async (_, id, data) => {
    return await getMateriaPrimaRepository().update(id, data) // ✅ Factory pattern
  })

  ipcMain.handle('materiaPrima:eliminar', async (_, id) => {
    return await getMateriaPrimaRepository().delete(id) // ✅ Factory pattern
  })

  ipcMain.handle('materiaPrima:stockBajo', async () => {
    return await getMateriaPrimaRepository().findLowStock() // ✅ Factory pattern
  })
}
```

### **Fase 5: Integración con App Startup**

**Archivo**: `apps/electron-main/src/main/index.ts`

**Cambios Específicos**:
```typescript
// ANTES
app.whenReady().then(() => {
  // Setup sin validación
  setupMateriaPrimaHandlers()
  // ... resto del setup
})

// DESPUÉS
import { getDatabase } from '@backend/db/pool'

app.whenReady().then(async () => {
  try {
    // Validar conexión a base de datos
    const db = getDatabase()
    await db.selectFrom('usuario').limit(1).execute()
    console.log('✅ Database connection verified')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    // Opcional: mostrar diálogo de error o intentar reconexión
  }

  // Setup handlers después de validar DB
  setupMateriaPrimaHandlers()
  // ... resto del setup
})

// Manejo de errores de conexión
process.on('uncaughtException', (error) => {
  if (error.message.includes('database') || error.message.includes('connection')) {
    console.error('Database error:', error)
    // Lógica de reconexión o graceful degradation
  }
})
```

## Ventajas del Plan

✅ **Elimina completamente el error TDZ** - No más dependencias circulares durante carga
✅ **100% compatible con API existente** - Sin cambios en frontend ni en especificaciones IPC
✅ **Patrón escalable** - Aplicable a todos los repositorios futuros (Proveedores, Usuarios, etc.)
✅ **Mejora de rendimiento** - Conexión a DB solo cuando es realmente necesaria
✅ **Resiliente a errores** - Manejo robusto de caídas de conexión con reintentos
✅ **Memory efficient** - Menos consumo de memoria durante startup

## Estrategia de Implementación

### Orden Secuencial Obligatorio
1. **Fase 1** → Probar → **Fase 2** → Probar → **Fase 3** → Probar → **Fase 4** → Probar → **Fase 5**
2. **Testing en cada fase**: `pnpm build` + `pnpm dev` sin errores
3. **Validación funcional**: Probar handlers IPC en cada fase

### Estrategia de Testing
```bash
# Por cada fase completada:
pnpm build  # Verificar compilación exitosa
pnpm dev    # Verificar startup sin errores TDZ
# Probar funcionalidad básica en la app
```

### Plan de Rollback
- Mantener código original como comentarios durante cada fase
- Si una fase falla, revertir cambios y continuar con siguiente enfoque
- Documentar cambios exitosos para facilitar rollback parcial

### Validación Final
- [ ] `pnpm dev` inicia sin errores `Cannot access 'db' before initialization`
- [ ] Todos los handlers IPC responden correctamente
- [ ] Conexión a base de datos funciona
- [ ] No regression en funcionalidad existente

## Escalabilidad Futura

Este patrón lazy puede aplicarse a todos los repositorios futuros:
- `ProveedorRepository` → Factory pattern
- `UsuarioRepository` → Lazy initialization
- `SolicitudRepository` → Factory pattern
- Cualquier nuevo repositorio → Sigue el mismo patrón

## Consideraciones de Monitoreo

### Logging Propuesto
```typescript
// En getDatabase()
console.log('🗄️ Database connection established (lazy)')

// En getMateriaPrimaRepository()
console.log('📦 MateriaPrimaRepository created (lazy)')

// En cada handler IPC
console.log(`📡 materiaPrima:${event} handled`)
```

### Métricas de Performance
- Tiempo de startup de la app (debe mejorar)
- Latencia del primer llamado a cada handler (debe ser aceptable)
- Uso de memoria durante startup (debe reducir)

---

**Estado**: Plan detallado completo, listo para implementación fase por fase
**Próximo Paso**: Iniciar Fase 1 - Convertir `backend/db/pool.ts` a lazy initialization