# Project Overview: Almacén Electrónico

## Purpose
Sistema de gestión de almacén desarrollado con Electron para escritorio, enfocado en la gestión de materia prima y proveedores con funcionalidades CRUD completas, auditoría y control de stock.

## Tech Stack
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4 + Radix UI
- **Backend**: Node.js + TypeScript + Kysely (query builder) + PostgreSQL
- **Desktop**: Electron 32 + electron-vite
- **Testing**: Jest + React Testing Library + jest-axe (accessibility)
- **Package Manager**: pnpm 10.21.0
- **Database**: PostgreSQL con pgtyped para type generation

## Architecture
- **apps/electron-main**: Proceso principal de Electron, ventanas y puentes IPC
- **apps/electron-renderer**: UI React, rutas y pantallas
- **backend**: Acceso a base de datos via Kysely/pgtyped (queries, repositories, migrations)
- **shared/types**: Modelos TypeScript compartidos entre backend y renderer
- **scripts**: Utilidades para tareas de base de datos

## Key Features
- Gestión de materia prima con CRUD completo
- Gestión de proveedores con UUID mapping
- Control de stock y auditoría
- Soft delete con tracking de eliminación
- Validaciones de negocio (stock > 0 para eliminación)
- Interfaz accesible con componentes Radix UI
- Testing unitario y de integración

## Database Schema
- materia_prima: tabla principal con campos id, nombre, stock_actual, activo, eliminado_en
- proveedores: gestión de proveedores con UUID mapping
- Auditoría completa para todas las operaciones CRUD

## Development Environment
- Windows development environment
- UTF-8 encoding
- TypeScript strict mode
- ESNext modules
- Electron-vite para build y desarrollo