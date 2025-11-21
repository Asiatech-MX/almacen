# Essential Commands for Development

## Setup & Installation
```bash
pnpm install                    # Install workspace dependencies
```

## Development
```bash
pnpm dev                        # Run electron-vite dev (main + renderer hot reload)
```

## Building & Distribution
```bash
pnpm build                      # Production build for Electron
pnpm dist                       # Build then package with electron-builder
pnpm pack                       # Package with electron-builder only
```

## Database Operations
```bash
pnpm db:migrate                 # Apply backend migrations (requires DB env vars)
pnpm db:codegen                 # Regenerate Kysely typings from live schema
pnpm db:generate-types          # Regenerate pgtyped types from SQL
```

## Testing
```bash
pnpm test                       # Run Jest tests
pnpm test:watch                 # Run tests in watch mode
pnpm test:coverage              # Run tests with coverage report
pnpm test:contract              # Run contract tests only
pnpm test:contract:watch        # Run contract tests in watch mode
```

## Renderer-Specific Commands
```bash
pnpm --filter electron-renderer lint        # ESLint for renderer
pnpm --filter electron-renderer test        # Jest + RTL suite
pnpm --filter electron-renderer test:accessibility  # jest-axe checks
```

## Code Quality
```bash
pnpm --filter electron-renderer lint        # Check linting before commits
```

## Git & Version Control
```bash
git status                     # Check working tree status
git add .                      # Stage all changes
git commit -m "feat: description"  # Commit with conventional style
git push                       # Push to remote
```

## File System (Windows)
```bash
dir                            # List directory contents
cd path\to\directory          # Change directory
type filename.txt              # View file contents
copy source.txt dest.txt       # Copy file
del filename.txt               # Delete file
```

## Environment Setup
```bash
copy .env.example .env         # Copy environment template
# Then edit .env with your database credentials
```

## Troubleshooting
```bash
pnpm --force install           # Force reinstall if dependency issues
pnpm store prune               # Clean pnpm store
rmdir /s dist                  # Clean build artifacts (Windows)
```

## Development Workflow
1. `pnpm install` - Setup dependencies
2. `copy .env.example .env` - Configure environment
3. `pnpm dev` - Start development server
4. Make changes
5. `pnpm --filter electron-renderer lint` - Check code quality
6. `pnpm test` - Run tests
7. `git commit` - Commit changes