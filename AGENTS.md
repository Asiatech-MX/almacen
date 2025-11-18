# Repository Guidelines

## Project Structure & Module Organization
- `apps/electron-main/src`: Electron main-process bootstrap, windows, and IPC bridges.
- `apps/electron-renderer/src`: React UI, routes, and screens; shared UI config in `tailwind.config.js` and `components.json`.
- `backend`: database access via Kysely/pgtyped (`queries`, `repositories`, `migrations`, `utils`, `types`).
- `packages/shared-types`: cross-process TypeScript models consumed by backend and renderer.
- `scripts`: utilities for database tasks invoked by npm scripts.
- Generated output lands in `dist/`; keep it out of commits.

## Build, Test, and Development Commands
- `pnpm install`: install workspace deps (pnpm@10).
- `pnpm dev`: run electron-vite dev (main + renderer hot reload).
- `pnpm build`: production build for Electron.
- `pnpm dist`: build then package with electron-builder; artifacts go to `dist/`.
- `pnpm --filter electron-renderer lint`: ESLint for the renderer.
- `pnpm --filter electron-renderer test` | `test:accessibility`: Jest + RTL suite; the latter runs `jest-axe` checks.
- `pnpm db:generate-types`: regenerate pgtyped types from SQL.
- `pnpm db:migrate`: apply backend migrations (requires DB env vars set).
- `pnpm db:codegen`: regenerate Kysely typings from the live schema.

## Coding Style & Naming Conventions
- TypeScript strict mode; ESNext modules. Prefer arrow functions and `async/await`.
- Components in PascalCase, hooks/utilities in camelCase; align file names with exported symbols (e.g., `InventoryTable.tsx`).
- Keep shared models in `packages/shared-types`; avoid duplicating types in renderer/backend.
- Run ESLint before committing; format JSX/TSX with consistent two-space indentation (match existing files).

## Testing Guidelines
- Renderer tests live in `apps/electron-renderer/test` named `*.test.tsx`.
- Use React Testing Library for behavior-focused tests; avoid shallow mocks of fetch/IPC without asserting user-facing results.
- Add accessibility assertions with `jest-axe` for new UI surfaces.
- Run `pnpm --filter electron-renderer test` before pushing; include minimal fixtures instead of real DB calls.

## Commit & Pull Request Guidelines
- Follow Conventional Commit-style prefixes seen in history (`feat:`, `fix:`, `chore:`); keep subjects short and imperative.
- PRs should include: brief summary, testing steps/commands run, linked issue/Jira, and UI screenshots for visible changes.
- Keep changes scoped; prefer separate PRs for backend migrations vs UI tweaks.

## Security & Configuration Tips
- Copy `.env.example` to `.env`; never commit secrets or database URLs.
- Database scripts require Postgres creds; rotate tokens if accidentally logged.
- Do not edit generated files in `dist/`; instead adjust source and rerun the relevant build/test command.
