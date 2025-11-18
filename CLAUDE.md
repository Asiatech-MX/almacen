# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Electron-based desktop application for warehouse/material management (Sistema de Almacén) built with:
- **Electron 32** for desktop container
- **React 19** with Vite for the UI (renderer process)
- **TypeScript** for type safety
- **PostgreSQL** as the primary database
- **Kysely** as the query builder
- **pnpm** as package manager
- **Tailwind CSS v4** with @tailwindcss/vite plugin for styling
- **shadcn/ui** components adapted for Tailwind v4
- **Monorepo structure** with workspace configuration

## Architecture

### Electron Structure
- **Main Process** (`apps/electron-main/src/main/`): Controls application lifecycle, manages windows, handles IPC communication
- **Preload Script** (`apps/electron-main/src/preload/`): Secure bridge between main and renderer using contextBridge
- **Renderer Process** (`apps/electron-renderer/`): React 19 frontend application
- **Shared Types** (`packages/shared-types/`): TypeScript types shared between processes

### Database Architecture
- **PostgreSQL** with comprehensive schema for material management
- **Kysely Codegen** for type-safe database operations
- **PGTyped** for generating TypeScript types from SQL queries
- **Database schemas** located in `db/schema_postgres.sql`

### Key Business Domains
1. **Materia Prima** (Raw Materials): Core inventory management
2. **Proveedores** (Suppliers): Supplier management
3. **Movimientos** (Movements): Material entries/exit tracking
4. **Solicitudes** (Purchase Requests): Request management workflow
5. **Usuarios/Instituciones**: User and institution management

## Tailwind CSS v4 Configuration

**Complete Development Guide**: For comprehensive documentation on working with Tailwind CSS v4 in this project, see [`docs/TAILWIND_V4_DEVELOPMENT.md`](docs/TAILWIND_V4_DEVELOPMENT.md).

### CSS Architecture
The project uses **Tailwind CSS v4** with the modern @tailwindcss/vite plugin architecture:

```css
/* apps/electron-renderer/src/styles/globals.css */
@import "tailwindcss";

@source './**/*.{tsx,ts,jsx,js}';
@source '../index.html';
@source '../../index.html';

@theme {
  /* Theme variables defined here */
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  /* ... complete theme configuration */
}
```

### Vite Integration
```typescript
// apps/electron-renderer/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  css: { postcss: false } // PostCSS disabled for v4
});
```

### Key v4 Migration Changes
- **No PostCSS**: Direct Vite plugin integration
- **No tailwind.config.js**: Configuration moved to CSS @theme directives
- **Updated utilities**: `outline-none` → `outline-hidden`, `ring-2` → `ring-1`, `w-4 h-4` → `size-4`
- **CSS variables**: Theme uses CSS custom properties with hsl() wrapper
- **@source directives**: Replace content configuration from v3

### Additional Resources
- **[Complete Development Guide](docs/TAILWIND_V4_DEVELOPMENT.md)**: Comprehensive reference for Tailwind CSS v4
- **Migration Checklist**: [`docs/TAILWIND_V4_MIGRATION_CHECKLIST.md`](docs/TAILWIND_V4_MIGRATION_CHECKLIST.md)
- **Component Examples**: See `apps/electron-renderer/src/components/ui/` for v4-adapted shadcn/ui components

## Development Commands

### Application Development
```bash
# Start development with hot reload
pnpm dev

# Build for production
pnpm build

# Package application for distribution
pnpm pack

# Build and package (full distribution)
pnpm dist
```

### Database Operations
```bash
# Generate TypeScript types from database schema
pnpm db:codegen

# Generate types from SQL queries (PGTyped)
pnpm db:generate-types

# Run database migrations
pnpm db:migrate
```

### Database Setup
The project uses Docker for PostgreSQL development:
```bash
# Start PostgreSQL and pgAdmin
docker-compose -f db/docker-compose.yml up -d
```

## Project Structure

```
almacen-2/
├── apps/
│   ├── electron-main/           # Electron main process
│   │   └── src/
│   │       ├── main/           # Main process entry and window management
│   │       │   ├── index.ts   # Main entry point
│   │       │   └── ipc/       # IPC handlers for each domain
│   │       └── preload/       # Preload scripts for secure IPC
│   └── electron-renderer/       # React 19 frontend
│       └── src/
│           ├── App.tsx         # Main application with routing
│           ├── components/     # Reusable UI components
│           ├── modules/        # Business domain modules
│           ├── services/       # IPC client services
│           └── hooks/          # Custom React hooks
├── packages/
│   └── shared-types/           # Shared TypeScript types
├── db/
│   ├── schema_postgres.sql     # Complete PostgreSQL schema
│   └── docker-compose.yml      # PostgreSQL + pgAdmin setup
├── docs/                       # Project documentation
└── backend/                    # Database repositories (generated)
```

## Database Schema

### Core Tables
- **materia_prima**: Raw material inventory with stock tracking
- **proveedor**: Supplier information with fiscal data
- **empresa_proveedora**: Extended supplier company details
- **solicitud_compra**: Purchase request workflow
- **entrada_material**: Material inbound transactions
- **salida_material**: Material outbound transactions
- **producto**: Finished goods inventory
- **usuario**: System users with role-based access
- **institucion**: Multi-tenant institution support

### Key Features
- **Multi-institution support**: All tables reference `institucion` for data isolation
- **Audit trails**: Automatic change tracking via triggers
- **Stock management**: Real-time stock updates with low-stock alerts
- **Workflow management**: Purchase request approval process
- **Comprehensive indexing**: Optimized for common query patterns

## IPC Communication

### Architecture Pattern
The application uses a secure IPC pattern with contextBridge:

1. **Main Process Handlers** (`apps/electron-main/src/main/ipc/`):
   - `materiaPrima.ts`: Complete CRUD operations for materials
   - `fs.ts`: File system operations

2. **Preload Bridge** (`apps/electron-main/src/preload/index.ts`):
   - Exposes type-safe API to renderer via `window.electronAPI`
   - Ensures security by controlling what renderer can access

3. **Renderer Services** (`apps/electron-renderer/src/services/`):
   - Client-side services that call IPC methods
   - Type-safe interfaces matching preload definitions

### Current IPC Channels
- `materiaPrima:listar` - List materials with filters
- `materiaPrima:crear` - Create new material
- `materiaPrima:actualizar` - Update existing material
- `materiaPrima:obtener` - Get material by ID
- `materiaPrima:eliminar` - Delete material
- `materiaPrima:stockBajo` - Get low stock items
- `fs:leer` / `fs:guardar` - File operations

## Development Workflow

### Adding New Features
1. **Database First**: Start with schema changes in `db/schema_postgres.sql`
2. **Type Generation**: Run `pnpm db:generate-types` to update TypeScript types
3. **Repository Layer**: Create repository in `backend/repositories/`
4. **IPC Handler**: Add handler in `apps/electron-main/src/main/ipc/`
5. **Preload API**: Expose via contextBridge in preload script
6. **Frontend Module**: Create React module in `apps/electron-renderer/src/modules/`
7. **Service Layer**: Add IPC client service in `apps/electron-renderer/src/services/`

### Code Conventions
- **Type Safety**: All IPC communication must be fully typed
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Logging**: Structured logging with emojis for easy identification
- **Security**: Never expose database credentials or direct database access to renderer

## Environment Configuration

### Database Connection
The application expects a `DATABASE_URL` environment variable:
```
DATABASE_URL=postgresql://user:password@localhost:5432/database_name
```

### Development Tools
- **Vite**: Fast development server and HMR with @tailwindcss/vite plugin
- **Electron DevTools**: Built-in developer tools in development
- **Hot Reload**: Automatic reloading on code changes with optimized CSS processing
- **TypeScript**: Strict type checking enabled
- **Tailwind CSS v4**: Modern CSS architecture with @theme directives and CSS variables
- **shadcn/ui**: Component library adapted for Tailwind v4 with modern utilities

## Testing & Quality

### Type Safety
- Strict TypeScript configuration
- Kysely provides compile-time SQL type checking
- PGTyped generates types from SQL queries
- Shared types ensure consistency across processes

### Database Integrity
- Foreign key constraints maintain data integrity
- Check constraints validate business rules
- Triggers provide automatic audit trails
- Indexed columns optimize query performance

## Deployment

### Build Process
1. `pnpm build`: Compiles TypeScript and bundles frontend
2. `pnpm pack`: Creates Electron installer/executable
3. Supports Windows, macOS, and Linux distributions

### Production Considerations
- Database connection pooling configured for production
- Error handling optimized for user experience
- Security hardening in Electron configuration
- Performance optimizations for large datasets