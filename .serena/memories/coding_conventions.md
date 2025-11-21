# Coding Conventions & Style Guide

## TypeScript & General
- **Strict mode**: TypeScript strict mode enabled
- **Modules**: ESNext modules con import/export
- **Functions**: Prefer arrow functions y async/await
- **Type hints**: Tipado estricto en todas las variables y parámetros

## Naming Conventions
- **Components**: PascalCase (ej: `InventoryTable.tsx`)
- **Files**: Align file names con exported symbols
- **Hooks/Utilities**: camelCase
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Types/Interfaces**: PascalCase con prefijo descriptivo

## Code Organization
- **Shared models**: Mantener en `packages/shared-types`
- **Avoid duplication**: No duplicar tipos entre renderer/backend
- **Imports**: Usar aliases configurados (@backend, @shared-types, @renderer)

## React Components
- **Functional components**: Solo componentes funcionales con hooks
- **Props**: TypeScript interfaces para props
- **Styling**: Tailwind CSS + Radix UI components
- **State**: React hooks o React Query para estado global

## Database & Backend
- **Queries**: Kysely query builder con type safety
- **Repositories**: Pattern de repositorio para acceso a datos
- **Transactions**: Usar transacciones para operaciones críticas
- **Validation**: Zod schemas para validación de datos

## Formatting
- **Indentation**: 2 espacios consistentes
- **Semicolons**: Required
- **Quotes**: Single quotes para strings, double quotes para JSX
- **Trailing commas**: Required en objetos y arrays multilínea

## Error Handling
- **Custom errors**: Clases de error específicas del dominio
- **Logging**: Electron-log para logging en main process
- **User messages**: Mensajes claros y útiles en español

## Testing
- **Unit tests**: Jest + React Testing Library
- **Accessibility**: jest-axe para pruebas de accesibilidad
- **Coverage**: Mantener cobertura alta en backend
- **Test files**: `*.test.tsx` en directorio test/

## Security
- **Environment**: Variables en .env, nunca commitear secrets
- **SQL**: Kysely previene SQL injection
- **Validation**: Validar inputs en frontend y backend
- **Audit trail**: Registrar todas las operaciones críticas