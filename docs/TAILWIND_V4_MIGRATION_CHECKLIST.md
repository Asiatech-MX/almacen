# Tailwind CSS v4 Migration Checklist

## 🎯 Purpose

Migrar el proyecto **Sistema de Almacén** de Tailwind CSS v3 a v4 para resolver el problema crítico donde las clases de Tailwind no están siendo procesadas correctamente.

## 🔍 Current Diagnosis Baseline

- **Issue**: Tailwind CSS classes not processing (bg-red-500, bg-sidebar transparent)
- **Chrome DevTools**: `tailwindLoaded: false`
- **Location**: `apps/electron-renderer/` (monorepo structure)
- **Current Tailwind**: v3 with PostCSS configuration
- **Main Problems**:
  - Sidebar sin tema visible
  - Componentes principales sin estilos aplicados
  - Advertencia: `The content option in your Tailwind CSS configuration is missing or empty`

## ⚡ Pre-requisitos

- [ ] **Node.js v20+**: `node --version` debe mostrar 20.x o superior
- [ ] **pnpm workspace**: Verificar que funciona en monorepo
- [ ] **Git clean**: No cambios pendientes en working directory
- [ ] **Backup**: Ramas principales protegidas

---

## 📋 Fase 1: Preparación y Backup (5-10 min)

### Branch y Setup
- [ ] `git checkout -b feature/tailwind-v4-migration`
- [ ] `git add . && git commit -m "Baseline state before Tailwind v4 migration"`

### Diagnóstico Actual
- [ ] **Screenshot actual**: Tomar screenshot de interfaz actual con sidebar sin tema
- [ ] **Chrome DevTools baseline**:
  - Verificar `tailwindLoaded: false`
  - Documentar `bg-sidebar: rgba(0, 0, 0, 0)`
  - Guardar snapshot actual en `snapshot-pre-migration.txt`

### Backup de Archivos Críticos
- [ ] `cp apps/electron-renderer/tailwind.config.js apps/electron-renderer/tailwind.config.js.backup`
- [ ] `cp apps/electron-renderer/postcss.config.js apps/electron-renderer/postcss.config.js.backup`
- [ ] `cp apps/electron-renderer/vite.config.ts apps/electron-renderer/vite.config.ts.backup`
- [ ] `cp apps/electron-renderer/src/styles/globals.css apps/electron-renderer/src/styles/globals.css.backup`

---

## 📦 Fase 2: Actualización de Dependencias (10-15 min)

### Herramienta de Upgrade Oficial
- [ ] `cd apps/electron-renderer`
- [ ] `npx @tailwindcss/upgrade`
  - Expected: Output showing migration suggestions and changes
  - Verify: Se crea nuevo archivo de configuración o se actualizan los existentes

### Actualización de Dependencias shadcn/ui
- [ ] `pnpm up "@radix-ui/*" cmdk lucide-react recharts tailwind-merge clsx --latest`
- [ ] Expected: Paquetes actualizados a últimas versiones compatibles con Tailwind v4

### Nuevos Paquetes v4
- [ ] `pnpm add @tailwindcss/vite tw-animate-css`
- [ ] Expected: Nuevos paquetes agregados a package.json

### Remoción de Paquetes Obsoletos
- [ ] `pnpm remove tailwindcss postcss autoprefixer tailwindcss-animate`
- [ ] Expected: Paquetes removidos sin conflictos

---

## ⚙️ Fase 3: Migración de Configuración (15-20 min)

### Vite Configuration Update
- [ ] **Editar `apps/electron-renderer/vite.config.ts`**:
  ```typescript
  import { defineConfig } from "vite";
  import react from "@vitejs/plugin-react";
  import tailwindcss from "@tailwindcss/vite";

  export default defineConfig({
    plugins: [react(), tailwindcss()],
    // ... resto de configuración
  });
  ```
- [ ] Expected: Plugin Tailwind agregado, configuración PostCSS removida

### CSS Import Changes
- [ ] **Editar `apps/electron-renderer/src/styles/globals.css`**:
  ```css
  /* Reemplazar directivas @tailwind */
  @import "tailwindcss";

  /* Mover configuración de tema a CSS con @theme */
  @theme {
    --color-background: hsl(0 0% 100%);
    --color-foreground: hsl(0 0% 3.9%);
    --font-display: "Inter", "sans-serif";
    --radius: 0.5rem;
  }

  /* Actualizar variables con hsl() wrapper */
  :root {
    --background: hsl(0 0% 100%);
    --foreground: hsl(0 0% 3.9%);
    --sidebar: hsl(0 0% 98%);
    --sidebar-foreground: hsl(240 5.3% 26.1%);
    --sidebar-primary: hsl(240 5.9% 10%);
    --sidebar-primary-foreground: hsl(0 0% 98%);
    --sidebar-accent: hsl(240 4.8% 95.9%);
    --sidebar-accent-foreground: hsl(240 5.9% 10%);
    --sidebar-border: hsl(220 13% 91%);
    --sidebar-ring: hsl(217.2 91.2% 59.8%);
  }

  .dark {
    --background: hsl(222.2 84% 4.9%);
    --foreground: hsl(210 40% 98%);
    --sidebar: hsl(240 5.9% 10%);
    --sidebar-foreground: hsl(240 4.8% 95.9%);
    --sidebar-primary: hsl(0 0% 98%);
    --sidebar-primary-foreground: hsl(240 5.9% 10%);
    --sidebar-accent: hsl(240 3.7% 15.9%);
    --sidebar-accent-foreground: hsl(240 4.8% 95.9%);
    --sidebar-border: hsl(240 3.7% 15.9%);
    --sidebar-ring: hsl(217.2 91.2% 59.8%);
  }
  ```

### Eliminación de Configuración Obsoleta
- [ ] **Eliminar `apps/electron-renderer/postcss.config.js`**
- [ ] Expected: Archivo eliminado sin errores en build

### Configuración de Tema Actualizada
- [ ] **Actualizar `@theme inline` section**:
  ```css
  @theme inline {
    --color-background: var(--background);
    --color-foreground: var(--foreground);
    --color-card: var(--card);
    --color-card-foreground: var(--card-foreground);
    --color-popover: var(--popover);
    --color-popover-foreground: var(--popover-foreground);
    --color-primary: var(--primary);
    --color-primary-foreground: var(--primary-foreground);
    --color-secondary: var(--secondary);
    --color-secondary-foreground: var(--secondary-foreground);
    --color-muted: var(--muted);
    --color-muted-foreground: var(--muted-foreground);
    --color-accent: var(--accent);
    --color-accent-foreground: var(--accent-foreground);
    --color-destructive: var(--destructive);
    --color-destructive-foreground: var(--destructive-foreground);
    --color-border: var(--border);
    --color-input: var(--input);
    --color-ring: var(--ring);
    --color-sidebar: var(--sidebar);
    --color-sidebar-foreground: var(--sidebar-foreground);
    --color-sidebar-primary: var(--sidebar-primary);
    --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
    --color-sidebar-accent: var(--sidebar-accent);
    --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
    --color-sidebar-border: var(--sidebar-border);
    --color-sidebar-ring: var(--sidebar-ring);
  }
  ```

---

## 🧩 Fase 4: Actualización de Componentes shadcn/ui (10-15 min)

### Actualización Masiva de Componentes
- [ ] `cd apps/electron-renderer`
- [ ] `npx shadcn@latest add --overwrite`
- [ ] Expected: Todos los componentes UI actualizados a versión v4

### Actualizaciones Específicas del Sidebar
- [ ] **Verificar `apps/electron-renderer/src/components/layout/AppSidebar.tsx`**:
  ```typescript
  // Importaciones actualizadas ya deben incluir SidebarRail
  import { SidebarRail } from '@/components/ui/sidebar';

  // Verificar que se esté usando correctamente
  <SidebarRail />
  ```

### Actualización de Utilities Comunes
- [ ] **Reemplazar utilities obsoletas**:
  - `outline-none` → `outline-hidden`
  - `ring` → `ring-3`
  - `w-4 h-4` → `size-4` (donde sea apropiado)
  - `flex-shrink-0` → `shrink-0`
  - `flex-grow-1` → `grow-1`

### Verificación de Componentes Clave
- [ ] **Theme Toggle**: `src/components/ui/theme-toggle.tsx`
- [ ] **Notifications Panel**: `src/components/notificaciones/NotificacionesPanel.tsx`
- [ ] **Dialog Components**: Verificar `data-slot` attributes
- [ ] **Form Components**: Actualizar pattern sin forwardRef

---

## 🔧 Fase 5: Correcciones Específicas del Proyecto (10-15 min)

### Variables CSS del Sidebar
- [ ] **Verificar tema del sidebar**:
  ```css
  .sidebar {
    background-color: hsl(var(--sidebar));
    color: hsl(var(--sidebar-foreground));
  }
  ```

### Path Aliases Verification
- [ ] **Test imports con nueva estructura**:
  ```typescript
  import { AppSidebarContent } from '@/components/layout/AppSidebar';
  import { ThemeToggle } from '@/components/ui/theme-toggle';
  ```
- [ ] Expected: Imports funcionan sin errores

### Hook de Tema Actualizado
- [ ] **Verificar `src/hooks/useTheme.ts`**:
  ```typescript
  // Debe funcionar con nuevas variables CSS
  root.classList.add(theme);
  ```

### Responsive Layout Verification
- [ ] **Verificar `LayoutPrincipal.tsx`**:
  - SidebarProvider funcionando
  - SidebarTrigger responsive
  - Header sticky behavior

---

## ✅ Fase 6: Testing y Verificación (15-20 min)

### Chrome DevTools Verification
- [ ] **Abrir Chrome DevTools** en http://localhost:5173
- [ ] **Verificar `tailwindLoaded: true`**:
  ```javascript
  // Ejecutar en console
  document.querySelector('style[data-vite-dev-id*="tailwind"]') !== null
  ```
- [ ] **Test Tailwind classes**:
  ```javascript
  // Crear elemento de prueba
  const test = document.createElement('div');
  test.className = 'bg-red-500 text-white p-4';
  document.body.appendChild(test);
  console.log(getComputedStyle(test).backgroundColor); // Debe ser rgb(239 68 68)
  document.body.removeChild(test);
  ```

### Sidebar Theme Testing
- [ ] **Verificar sidebar background**:
  ```javascript
  const sidebar = document.querySelector('.group/sidebar-wrapper');
  console.log(getComputedStyle(sidebar).backgroundColor); // Debe ser color válido
  ```
- [ ] **Expected**: `hsl(var(--sidebar))` aplicando color visible

### Theme Toggle Functionality
- [ ] **Test theme toggle button**
- [ ] **Verify dark mode transitions**
- [ ] **Check localStorage theme persistence**

### Componentes UI Testing
- [ ] **Buttons**: Hover, focus, active states
- [ ] **Forms**: Input styling, validation states
- [ ] **Cards**: Background colors, borders
- [ ] **Navigation**: Active states, responsive behavior

### Build Verification
- [ ] `cd apps/electron-renderer`
- [ ] `pnpm build`
- [ ] Expected: Build exitoso sin errores de Tailwind

### Electron Distribution Test
- [ ] `pnpm pack`
- [ ] Expected: Empaquetado exitoso
- [ ] **Test application**: Verificar que estilos funcionen en app empaquetada

### Performance Metrics
- [ ] **Load time**: Medir tiempo de carga inicial
- [ ] **CSS bundle size**: Verificar optimización
- [ ] **Hot reload**: Testear en modo desarrollo

---

## 🧹 Fase 7: Limpieza y Documentación (5-10 min)

### Remover Archivos Obsoletos
- [ ] **Eliminar `apps/electron-renderer/tailwind.config.js`**
- [ ] **Verificar que no existan referencias**:
  ```bash
  grep -r "tailwind.config" apps/electron-renderer/
  ```

### Actualización de Documentación
- [ ] **Actualizar `CLAUDE.md`**:
  - Nueva configuración de Tailwind v4
  - Comandos de desarrollo actualizados
  - Estructura de archivos modificada

### Crear Guía de Desarrollo
- [ ] **Crear `docs/TAILWIND_V4_DEVELOPMENT.md`**:
  - Nuevo workflow de estilos
  - Uso de @theme directive
  - Best practices para componentes

### Commit Final
- [ ] `git add .`
- [ ] `git commit -m "feat: migrate to Tailwind CSS v4 with shadcn/ui

- Upgrade to @tailwindcss/vite plugin
- Move theme configuration to CSS @theme
- Update all shadcn/ui components to v4
- Fix sidebar styling issues
- Improve performance and developer experience

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"`

---

## 🚨 Troubleshooting

### Common Issues

1. **Tailwind still not loading**:
   ```bash
   # Clear Vite cache
   pnpm dev --force
   # Check @theme syntax in CSS
   # Verify vite.config.ts plugin order
   ```

2. **Sidebar still transparent**:
   ```css
   /* Verificar que las variables existan */
   console.log(getComputedStyle(document.documentElement).getPropertyValue('--sidebar'));
   /* Check @theme inline mapping */
   ```

3. **Build errors**:
   ```bash
   # Reinstall dependencies
   pnpm install
   # Check Node.js version
   node --version # Should be 20+
   ```

4. **shadcn component errors**:
   ```bash
   # Reinstall components
   npx shadcn@latest add button card input --overwrite
   ```

### Rollback Steps

If critical issues occur:
```bash
git checkout main
git branch -D feature/tailwind-v4-migration
# Restore from backup files if needed
```

---

## 📊 Expected Results

### ✅ Success Criteria
- [ ] `tailwindLoaded: true` in Chrome DevTools
- [ ] Sidebar showing proper theme colors
- [ ] All Tailwind classes working (bg-red-500, etc.)
- [ ] Dark mode toggle functioning
- [ ] Build successful without errors
- [ ] Performance improvements measurable

### 📈 Performance Improvements
- Faster CSS processing with Vite plugin
- Smaller CSS bundle size
- Improved hot reload times
- Better tree-shaking of unused styles

### 🎨 Visual Improvements
- Sidebar with visible theme
- Proper color application
- Smooth dark mode transitions
- Consistent component styling

---

## 📝 Notes

### Project-Specific Considerations
- **Monorepo Structure**: Focus on `apps/electron-renderer/`
- **Electron Context**: Ensure styles work in desktop environment
- **Existing Issues**: Leverage current Chrome DevTools diagnosis for verification
- **shadcn/ui Components**: All components should work seamlessly after upgrade

### Migration Duration
- **Estimated Total**: 1.5 - 2 hours
- **Critical Path**: Fases 3-4 (Configuration + Components)
- **Testing Time**: Allow extra time for thorough verification

### Post-Migration Benefits
- Future-proof CSS architecture
- Better developer experience
- Improved performance
- Access to modern CSS features
- Easier maintenance going forward