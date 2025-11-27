# Buenas Prácticas de Desarrollo - Backend Almacén 2.0

**Fecha de Creación:** 2025-11-25
**Última Actualización:** 2025-11-25
**Versión:** 1.0.0

---

## Índice

1. [Patrones de Código](#patrones-de-código)
2. [Configuración TypeScript](#configuración-typescript)
3. [Imports y Módulos](#imports-y-módulos)
4. [Validación y Seguridad](#validación-y-seguridad)
5. [Manejo de Errores](#manejo-de-errores)
6. [Sistema de Mocks](#sistema-de-mocks)
7. [CORS y Comunicación Frontend-Backend](#cors-y-comunicación-frontend-backend)
8. [Testing](#testing)
9. [Documentación](#documentación)
10. [Desarrollo Local](#desarrollo-local)

---

## Patrones de Código

### ✅ Patrones Recomendados

#### 1. Estructura de Archivos
```typescript
// Estructura recomendada para nuevos endpoints
// src/web-api/routes/nuevoRecurso.routes.ts
import express from 'express'
import { body, param, validationResult } from 'express-validator'
import { runValidation } from '../middleware/validation'
import { sendErrorResponse, sendSuccessResponse, sendPaginatedResponse } from '../utils/response.util'

const router = express.Router()

// Validation chains
const nuevoRecursoValidations = {
  listar: [
    body('page').optional().isInt({ min: 1 }),
    body('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  crear: [
    body('nombre').notEmpty().withMessage('Nombre requerido'),
    body('descripcion').optional().isString(),
  ]
}

// Endpoints
router.post('/listar', nuevoRecursoValidations.listar, runValidation, async (req, res) => {
  try {
    // Implementación
  } catch (error) {
    return sendErrorResponse(res, error, 500)
  }
})

export { router as nuevoRecursoRoutes }
```

#### 2. TSDoc para Documentación
```typescript
/**
 * Obtiene una lista de materiales con paginación y filtros opcionales.
 *
 * @remarks
 * Este método utiliza el adapter de materia prima para obtener datos.
 * Soporta paginación y filtros múltiples para búsquedas avanzadas.
 *
 * @param request - Objeto de solicitud con filtros opcionales
 * @returns Promise con resultado paginado y datos de materiales
 *
 * @throws {ValidationError} Cuando los parámetros de entrada son inválidos
 * @throws {DatabaseError} Cuando hay un error en la base de datos
 *
 * @example
 * ```typescript
 * const result = await listarMateriales({
 *   page: 1,
 *   limit: 50,
 *   search: "tornillo"
 * })
 * ```
 */
export async function listarMateriales(request: ListarMaterialesRequest): Promise<MateriaPrimaAdapterResponse> {
  // Implementación
}
```

#### 3. Manejo de Respuestas Consistente
```typescript
// Usar siempre los utilitarios de respuesta
export async function crearMaterial(req: Request, res: Response) {
  try {
    const result = await materiaPrimaAdapter.create(req.body)

    if (!result.success) {
      return sendErrorResponse(res, result.error || 'Error al crear material', 400)
    }

    return sendSuccessResponse(res, result.data, 'Material creado exitosamente', 201)
  } catch (error) {
    return sendErrorResponse(res, error, 500)
  }
}
```

### ❌ Patrones a Evitar

#### 1. Imports Inconsistentes
```typescript
// ❌ EVITAR: Imports relativos inconsistentes
import { algo } from '../../utils/algo'
import { otraCosa } from '../../../shared-types/src/index'

// ✅ USAR: Alias consistentes configurados en tsconfig.json
import { algo } from '@utils/algo'
import { otraCosa } from '@shared-types/index'
```

#### 2. Tipos `any` sin Tipado
```typescript
// ❌ EVITAR: Tipos any implícitos
function processData(data: any): any {
  return data.processed
}

// ✅ USAR: Tipos específicos
interface ProcessedData {
  id: string
  result: boolean
  timestamp: Date
}

function processData(data: RawData): ProcessedData {
  return {
    id: data.id,
    result: true,
    timestamp: new Date()
  }
}
```

#### 3. Manejo Manual de Errores
```typescript
// ❌ EVITAR: Manejo manual repetitivo
try {
  const result = await operation()
  res.status(200).json({ success: true, data: result })
} catch (error) {
  res.status(500).json({ success: false, error: error.message })
}

// ✅ USAR: Utilitarios centralizados
try {
  const result = await operation()
  return sendSuccessResponse(res, result)
} catch (error) {
  return sendErrorResponse(res, error)
}
```

---

## Configuración TypeScript

### ✅ Configuración Recomendada

#### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["../packages/shared-types/src/*"],
      "@shared-types/*": ["../packages/shared-types/src/*"],
      "@adapters/*": ["./src/adapters/*"],
      "@middleware/*": ["./src/middleware/*"],
      "@routes/*": ["./src/routes/*"],
      "@utils/*": ["./src/utils/*"],
      "@types/*": ["./src/types/*"],
      "@config/*": ["./src/config/*"]
    },
    "typeRoots": ["./node_modules/@types", "./src/types", "../packages/shared-types/src"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### ⚠️ Configuraciones a Evitar

- `ignoreDeprecations`: Formato obsoleto, usar configuraciones específicas
- `baseUrl` sin `paths`: Ambos deben configurarse juntos
- `allowJs`: Evitar mezclar JavaScript y TypeScript innecesariamente

---

## Imports y Módulos

### ✅ Prácticas Correctas

#### 1. Imports Organizados
```typescript
// 1. Imports de Node.js (orden alfabético)
import express, { Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'

// 2. Imports de terceros (orden alfabético)
import { body, param, validationResult, ValidationChain } from 'express-validator'

// 3. Imports locales con alias
import { materiaPrimaAdapter } from '@adapters/materiaPrima.adapter'
import { runValidation } from '@middleware/validation'
import { sendErrorResponse, sendSuccessResponse } from '@utils/response.util'
import { CreateMateriaPrimaRequest } from '@types/materiaPrima.types'
```

#### 2. Exports Consistentes
```typescript
// ✅ Named exports con tipos
export const materiaPrimaValidations = {
  crear: [body('nombre').notEmpty()],
  listar: [body('page').optional().isInt()]
} as const

export type MateriaPrimaValidations = typeof materiaPrimaValidations

// ✅ Exportar router con nombre explícito
export { router as materiaPrimaRoutes }
```

### ❌ Prácticas a Evitar

- Imports relativos largos (`../../../shared-types/src/index`)
- Imports sin uso (unused imports)
- Exports por defecto mezclados con named exports
- Imports de tipos sin `type` keyword

---

## Validación y Seguridad

### ✅ Validaciones Recomendadas

#### 1. Express Validator
```typescript
const crearMaterialValidations: ValidationChain[] = [
  body('nombre')
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ]+$/)
    .withMessage('El nombre solo puede contener letras, números y espacios'),

  body('stock_actual')
    .isInt({ min: 0 })
    .withMessage('El stock debe ser un número entero no negativo')
    .toInt(), // Convertir a entero

  body('presentacion')
    .optional()
    .isIn(['UNIDAD', 'CAJA', 'PAQUETE', 'METRO', 'KILO'])
    .withMessage('Presentación inválida'),

  body('costo_unitario')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El costo unitario debe ser un número positivo')
    .toFloat() // Convertir a float
]
```

#### 2. Middleware de Validación
```typescript
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined
    }))

    return sendErrorResponse(res, 'Error de validación', 400, formattedErrors)
  }

  next()
}
```

### 🔐 Configuración CORS

#### Orígenes Permitidos
```typescript
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Permitir orígenes sin origin (móviles, Postman, etc.)
    if (!origin) return callback(null, true)

    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:3000',
      /^chrome-extension:\/\//,
      /^devtools:\/\//
    ]

    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin)
      }
      return allowedOrigin === origin
    })

    callback(null, isAllowed)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400
}
```

---

## Manejo de Errores

### ✅ Jerarquía de Errores

```typescript
// Clase base de error
export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }
}

// Errores específicos
export class ValidationError extends AppError {
  constructor(message: string, public details?: any[]) {
    super(message, 400)
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(message, 500)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Recurso') {
    super(`${resource} no encontrado`, 404)
  }
}
```

### ✅ Error Handler Global

```typescript
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = { ...err }
  error.message = err.message

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = 'Error de validación'
    const details = Object.values(err.errors).map((val: any) => ({
      field: val.path,
      message: val.message
    }))
    error = new ValidationError(message, details)
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Recurso duplicado'
    error = new ValidationError(message)
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    const message = 'Recurso no encontrado'
    error = new NotFoundError()
  }

  return sendErrorResponse(res, error.message, error.statusCode || 500, error.details)
}
```

---

## Sistema de Mocks

### ✅ Uso Correcto de Mocks

#### 1. Desarrollo con Mocks Automático
```typescript
// El sistema detecta automáticamente cuándo usar mocks
const services = initializeServices()

// En desarrollo usa mocks si servicios reales no están disponibles
const adapter = getMateriaPrimaAdapter()
```

#### 2. Testing con Mocks
```typescript
// Tests específicos con mocks
beforeEach(() => {
  process.env.USE_MOCKS = 'true'
  jest.clearAllMocks()
})

test('debería crear material con mocks', async () => {
  const mockData = { nombre: 'Test Material', stock_actual: 100 }
  const result = await materiaPrimaAdapter.create(mockData)

  expect(result.success).toBe(true)
  expect(result.data.nombre).toBe('Test Material')
})
```

#### 3. Configuración de Mocks
```typescript
// mockConfig en src/mocks/index.ts
export const mockConfig = {
  database: {
    useMock: USE_MOCKS,
    delay: 100, // Simular latencia de base de datos
  },
  cache: {
    useMock: USE_MOCKS,
    defaultTTL: 300,
    maxSize: 1000,
  },
  adapters: {
    useMock: USE_MOCKS,
    delay: 50,
  }
}
```

### ⚠️ Consideraciones sobre Mocks

- Los mocks no deben reemplazar completamente a servicios reales en producción
- Usar mocks solo para desarrollo y testing
- Mantener datos de mocks consistentes y realistas
- Documentar qué comportamiento simulan los mocks

---

## CORS y Comunicación Frontend-Backend

### ✅ Configuración CORS Completa

```typescript
// Configuración robusta para diferentes entornos
const getCorsOrigins = () => {
  const origins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000'
  ]

  if (process.env.NODE_ENV === 'development') {
    origins.push(/^chrome-extension:\/\//)
    origins.push(/^devtools:\/\//)
  }

  return origins
}

const corsOptions: cors.CorsOptions = {
  origin: getCorsOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400,
  optionsSuccessStatus: 200
}

// Aplicar CORS globalmente
app.use(cors(corsOptions))
app.options('*', cors()) // Pre-flight requests
```

### ✅ Requests desde Frontend

```typescript
// Cliente TypeScript correctamente configurado
const apiClient = {
  async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      credentials: 'include', // Para CORS con credenciales
      ...options
    }

    const response = await fetch(`http://localhost:3013${url}`, defaultOptions)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  },

  // Método específico para PATCH
  async patch<T>(url: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }
}

// Uso del cliente
const updateMaterialStatus = async (id: string, estatus: string) => {
  return apiClient.patch(`/api/materiaPrima/${id}/estatus`, { estatus })
}
```

### 🔧 Debugging de CORS

#### 1. Verificar Preflight Requests
```bash
# Test OPTIONS request
curl -v -X OPTIONS http://localhost:3013/api/materiaPrima/test-id/estatus \
  -H "Origin: http://localhost:5175" \
  -H "Access-Control-Request-Method: PATCH"
```

#### 2. Verificar PATCH Requests
```bash
# Test real PATCH request
curl -v -X PATCH http://localhost:3013/api/materiaPrima/real-id/estatus \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5175" \
  -d '{"estatus":"INACTIVO"}'
```

---

## Testing

### ✅ Estructura de Tests

```typescript
// tests/integration/materiaPrima.test.ts
import request from 'supertest'
import { app } from '../../src/web-api/server'

describe('Materia Prima API', () => {
  beforeEach(() => {
    process.env.USE_MOCKS = 'true'
  })

  describe('POST /api/materiaPrima/listar', () => {
    it('debería listar materiales exitosamente', async () => {
      const response = await request(app)
        .post('/api/materiaPrima/listar')
        .send({
          page: 1,
          limit: 10
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.pagination).toBeDefined()
    })

    it('debería manejar errores de validación', async () => {
      const response = await request(app)
        .post('/api/materiaPrima/listar')
        .send({
          page: 'invalid',
          limit: -1
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toBeDefined()
    })
  })
})
```

### ✅ Mocks en Tests

```typescript
// tests/unit/materiaPrimaAdapter.test.ts
import { mockMateriaPrimaAdapter } from '../../src/mocks/materiaPrima.adapter.mock'

describe('Materia Prima Adapter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('debería crear material exitosamente', async () => {
    const materialData = {
      nombre: 'Material de Test',
      stock_actual: 100,
      presentacion: 'UNIDAD'
    }

    const result = await mockMateriaPrimaAdapter.create(materialData)

    expect(result.success).toBe(true)
    expect(result.data.nombre).toBe(materialData.nombre)
    expect(result.data.estatus).toBe('ACTIVO')
  })
})
```

---

## Documentación

### ✅ Estándar TSDoc

```typescript
/**
 * Interfaz para representar un material del inventario.
 *
 * @interface MateriaPrima
 * @since v1.0.0
 */
export interface MateriaPrima {
  /** ID único del material (UUID v4) */
  id: string

  /** Nombre descriptivo del material */
  nombre: string

  /** Cantidad actual en stock */
  stock_actual: number

  /** Estado actual del material */
  estatus: 'ACTIVO' | 'INACTIVO'

  /** Fecha de creación automática */
  fecha_creacion: Date

  /** Fecha de última actualización */
  fecha_actualizacion?: Date
}

/**
 * Obtiene un material por su ID.
 *
 * @param id - UUID del material a buscar
 * @param opciones - Opciones adicionales de consulta
 * @param opciones.incluirInactivos - Si debe incluir materiales inactivos
 * @param opciones.incluirStock - Si debe incluir información de stock
 *
 * @returns Promise que resuelve con los datos del material o null si no existe
 *
 * @throws {ValidationError} Cuando el ID no es un UUID válido
 * @throws {DatabaseError} Cuando hay un error en la consulta a la base de datos
 *
 * @example
 * ```typescript
 * const material = await obtenerMaterialPorId('123e4567-e89b-12d3-a456-426614174000', {
 *   incluirInactivos: true,
 *   incluirStock: true
 * })
 * ```
 */
export async function obtenerMaterialPorId(
  id: string,
  opciones: { incluirInactivos?: boolean; incluirStock?: boolean } = {}
): Promise<MateriaPrima | null> {
  // Implementación
}
```

---

## Desarrollo Local

### ✅ Setup Recomendado

#### 1. Configuración Inicial
```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env

# 3. Iniciar PostgreSQL (Docker)
docker-compose -f ../db/docker-compose.yml up -d

# 4. Ejecutar migraciones
npm run db:migrate

# 5. Iniciar backend (con detección automática de mocks)
npm run dev
```

#### 2. Scripts de Desarrollo
```json
{
  "scripts": {
    "dev": "tsx watch src/web-api/index.ts",
    "dev:mocks": "USE_MOCKS=true tsx watch src/web-api/index.ts",
    "dev:real": "USE_MOCKS=false tsx watch src/web-api/index.ts",
    "build": "tsc && cp -r src/web-api dist/",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src --ext .ts",
    "typecheck": "tsc --noEmit"
  }
}
```

### ✅ Debugging Tips

#### 1. Verificar Estado del Servidor
```bash
# Health check
curl http://localhost:3013/health

# Verificar modo actual
curl http://localhost:3013/health | jq '.mock'

# Estadísticas de cache (si está en modo mocks)
curl http://localhost:3013/cache/stats
```

#### 2. Debugging de CORS
```typescript
// Logging middleware para debugging CORS
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin}`)
  console.log(`CORS Headers:`, res.getHeaders())
  next()
})
```

---

## Conclusión

Este documento establece las buenas prácticas para el desarrollo del backend del Sistema de Almacén 2.0. Seguir estas prácticas asegurará:

- **Calidad de código**: Consistencia y mantenibilidad
- **Seguridad**: Protección contra vulnerabilidades comunes
- **Productividad**: Desarrollo más eficiente con menos errores
- **Colaboración**: Código fácil de entender para el equipo
- **Testing**: Cobertura completa y confiable

Para preguntas o sugerencias sobre estas prácticas, consultar con el equipo de arquitectura o líder técnico.