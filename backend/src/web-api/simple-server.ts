#!/usr/bin/env tsx

/**
 * Simple Development Server
 * Versión simplificada para iniciar el servidor backend rápidamente
 * sin dependencias complejas de compilación
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'

console.log('🚀 Starting simple development server...')

// Crear aplicación Express básica
const app = express()
const port = process.env.WEB_API_PORT || 3015

// Middlewares básicos
app.use(helmet())
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(morgan('dev'))

// Configuración CORS para desarrollo
const corsOptions: cors.CorsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
    /^chrome-extension:\/\//,
    /^devtools:\/\//,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400,
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions))
app.options('*', cors()) // Pre-flight requests

// Health check básico
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: 'connected (mock)',
    cache: 'connected (mock)',
    environment: process.env.NODE_ENV || 'development',
    mock: true,
    port
  })
})

// API Routes básicas con respuestas mock
app.get('/api/health/ping', (req, res) => {
  res.json({
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString(),
    mock: true
  })
})

// Mock routes para materia prima

// Endpoint GET /api/materiaPrima (compatibilidad con app web)
app.get('/api/materiaPrima', (req, res) => {
  console.log('📦 Mock: GET /api/materiaPrima', req.query)
  const limit = parseInt(req.query.limit as string) || 50
  const page = parseInt(req.query.page as string) || 1
  const search = req.query.search as string || ''

  res.json({
    success: true,
    data: [
      {
        id: '1',
        nombre: 'Tornillo 8mm',
        marca: 'MarcaTest',
        presentacion: 'UNIDAD',
        stock_actual: 100,
        stock_minimo: 10,
        costo_unitario: 5.50,
        codigo_barras: '1234567890123',
        categoria: 'Tornillería',
        estatus: 'ACTIVO',
        fecha_creacion: new Date().toISOString()
      },
      {
        id: '2',
        nombre: 'Arandela 10mm',
        marca: 'MarcaTest',
        presentacion: 'UNIDAD',
        stock_actual: 200,
        stock_minimo: 20,
        costo_unitario: 1.20,
        codigo_barras: '1234567890124',
        categoria: 'Tornillería',
        estatus: 'ACTIVO',
        fecha_creacion: new Date().toISOString()
      },
      {
        id: '3',
        nombre: 'Tuerca M8',
        marca: 'MarcaTest',
        presentacion: 'BOLSA',
        stock_actual: 150,
        stock_minimo: 15,
        costo_unitario: 2.80,
        codigo_barras: '1234567890125',
        categoria: 'Tornillería',
        estatus: 'ACTIVO',
        fecha_creacion: new Date().toISOString()
      }
    ],
    pagination: {
      page: page,
      limit: limit,
      total: 3,
      totalPages: 1,
      hasNext: false,
      hasPrev: false
    },
    timestamp: new Date().toISOString(),
    mock: true
  })
})

app.post('/api/materiaPrima/listar', (req, res) => {
  console.log('📦 Mock: POST /api/materiaPrima/listar', req.body)
  res.json({
    success: true,
    data: [
      {
        id: '1',
        nombre: 'Tornillo 8mm',
        presentacion: 'UNIDAD',
        stock_actual: 100,
        estatus: 'ACTIVO',
        fecha_creacion: new Date().toISOString()
      }
    ],
    pagination: {
      page: 1,
      limit: 50,
      total: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false
    },
    timestamp: new Date().toISOString(),
    mock: true
  })
})

app.post('/api/materiaPrima/crear', (req, res) => {
  console.log('➕ Mock: POST /api/materiaPrima/crear', req.body)
  const material = {
    id: Date.now().toString(),
    ...req.body,
    estatus: 'ACTIVO',
    fecha_creacion: new Date().toISOString()
  }
  res.json({
    success: true,
    data: material,
    message: 'Material creado exitosamente',
    timestamp: new Date().toISOString(),
    mock: true
  })
})

app.get('/api/materiaPrima/stats', (req, res) => {
  console.log('📊 Mock: GET /api/materiaPrima/stats')
  res.json({
    success: true,
    data: {
      total_materiales: 150,
      activos: 120,
      inactivos: 30,
      stock_bajo: 5,
      valor_total: 45000.50
    },
    timestamp: new Date().toISOString(),
    mock: true
  })
})

app.get('/api/materiaPrima/stock-bajo', (req, res) => {
  console.log('⚠️ Mock: GET /api/materiaPrima/stock-bajo')
  res.json({
    success: true,
    data: [
      {
        id: '1',
        nombre: 'Arandela 10mm',
        stock_actual: 5,
        stock_minimo: 10,
        estatus: 'ACTIVO'
      }
    ],
    timestamp: new Date().toISOString(),
    mock: true
  })
})

// Mock routes para proveedores
app.post('/api/proveedores/listar', (req, res) => {
  console.log('🏢 Mock: POST /api/proveedores/listar', req.body)
  res.json({
    success: true,
    data: [
      {
        id: '1',
        nombre: 'Tornillería S.A.',
        ruc: '1234567890',
        direccion: 'Calle Falsa 123',
        telefono: '555-1234',
        email: 'contacto@tornilleria.com',
        estatus: 'ACTIVO'
      }
    ],
    pagination: {
      page: 1,
      limit: 50,
      total: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false
    },
    timestamp: new Date().toISOString(),
    mock: true
  })
})

// Mock routes para stock
app.post('/api/stock/actual', (req, res) => {
  console.log('📦 Mock: POST /api/stock/actual', req.body)
  res.json({
    success: true,
    data: [
      {
        id: '1',
        materia_prima_id: '1',
        materia_prima_nombre: 'Tornillo 8mm',
        cantidad: 100,
        ubicacion: 'Almacén A'
      }
    ],
    timestamp: new Date().toISOString(),
    mock: true
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    statusCode: 404,
    timestamp: new Date().toISOString(),
    mock: true
  })
})

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('🚨 Error:', err)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
    mock: true
  })
})

// Iniciar servidor
const server = app.listen(port, () => {
  console.log(`🚀 Simple Development Server running on port ${port}`)
  console.log(`📍 Health check: http://localhost:${port}/health`)
  console.log(`🔧 Mock Mode: ENABLED`)
  console.log(`🌐 CORS enabled for Chrome DevTools`)
  console.log(`📋 Available endpoints:`)
  console.log(`   • GET  /health - Health check`)
  console.log(`   • GET  /api/health/ping - Ping`)
  console.log(`   • POST /api/materiaPrima/listar - List materials`)
  console.log(`   • POST /api/materiaPrima/crear - Create material`)
  console.log(`   • GET  /api/materiaPrima/stats - Stats`)
  console.log(`   • GET  /api/materiaPrima/stock-bajo - Low stock`)
  console.log(`   • POST /api/proveedores/listar - List suppliers`)
  console.log(`   • POST /api/stock/actual - Current stock`)
})

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${port} is already in use`)
  } else {
    console.error('❌ Server error:', err)
  }
  process.exit(1)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully')
  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully')
  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})

export { app, server }