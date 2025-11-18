# Plan de Corrección de Errores - Fase 3 ISO 9241

## 📋 Resumen Ejecutivo

**Documento creado:** 17 de noviembre de 2024
**Baseline:** Implementación Fase 3 ISO 9241 con shadcn/ui completada
**Problema:** Aplicación de Electron no visible después de Fase 3
**Método:** Análisis con 8 instancias de strategy-applier + Chrome DevTools

---

## 🎯 Diagnóstico Principal

### Error Crítico Identificado
```
ReferenceError: TipoAprobacion is not defined
at aprobacionesService.ts:19:13
```

**Causa Raíz:** Inconsistencia en rutas de importación entre servicios de aprobaciones y el sistema de alias configurado.

### Estado Actual Verificado
- ✅ Aplicación se inicia en `http://localhost:5173/`
- ✅ Base de datos conectada y funcional (PostgreSQL + Kysely)
- ✅ Servidor Vite corriendo correctamente
- ❌ Error JavaScript bloquea renderizado de la UI
- ❌ TailwindCSS warning: `content` option missing/empty

---

## 🚀 Plan de Acción Prioritario

### Fase 1: Corrección Inmediata (Crítica)

#### 1.1 Corregir Error de Importación Principal
**Archivo:** `apps/electron-renderer/src/services/aprobacionesService.ts`

```typescript
// LÍNEA 11 - CAMBIAR:
import type {
  Aprobacion,
  CrearAprobacionData,
  AprobacionFilters,
  TipoAprobacion  // <-- Este import está fallando
} from '../types/aprobaciones'

// A:
import type {
  Aprobacion,
  CrearAprobacionData,
  AprobacionFilters,
  TipoAprobacion
} from '@/types/aprobaciones'
```

**Verificación:** Confirmar que el archivo `apps/electron-renderer/src/types/aprobaciones.ts` existe y exporta `TipoAprobacion`.

#### 1.2 Estandarizar Imports en Servicios
**Archivos afectados:**
- `aprobacionesService.ts`
- `notificacionesService.ts`
- `enhancedMateriaPrimaService.ts`
- `movementsService.ts`
- `proveedoresService.ts`

**Patrón a seguir:**
```typescript
// Usar siempre alias @/ para imports internos
import { Component } from '@/components/ui/button'
import { Tipo } from '@/types/aprobaciones'
import { hook } from '@/hooks/useMateriaPrimaQuery'
```

### Fase 2: Configuración TailwindCSS (Importante)

#### 2.1 Corregir Configuración de Contenido
**Archivo:** `apps/electron-renderer/tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // Patrones explícitos para asegurar escaneo completo
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/modules/**/*.{js,ts,jsx,tsx}",
    "./src/lib/**/*.{js,ts}",
    "./src/hooks/**/*.{js,ts}",
    "./src/providers/**/*.{js,ts,jsx,tsx}",
    "./src/services/**/*.{js,ts}",
    "./src/types/**/*.{js,ts}",
    "./src/styles/**/*.css",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### Fase 3: Optimización React Query (Mejora)

#### 3.1 Actualizar API Obsoleta
**Archivo:** `apps/electron-renderer/src/providers/QueryProvider.tsx`

```typescript
// CAMBIAR: cacheTime → gcTime (API v5)
staleTime: 5 * 60 * 1000,     // 5 minutos
gcTime: 10 * 60 * 1000,        // 10 minutos (antes cacheTime)

// REMOVER: onError deprecated
// AGREGAR: Manejo moderno de errores
```

#### 3.2 Optimizar Hooks Personalizados
**Archivo:** `apps/electron-renderer/src/hooks/useMateriaPrimaQuery.ts`

```typescript
// Actualizar a API moderna de React Query v5
// Usar gcTime en lugar de cacheTime
// Implementar manejo de errores con error boundaries
```

### Fase 4: Seguridad Electron (Opcional pero Recomendado)

#### 4.1 Implementar CSP Básico
**Archivo:** `apps/electron-renderer/index.html`

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sistema de Almacén</title>

  <!-- CSP Restrictivo para desarrollo -->
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: blob:;
    connect-src 'self';
    object-src 'none';
  ">
</head>
```

#### 4.2 Mejorar Configuración de Ventana
**Archivo:** `apps/electron-main/src/main/index.ts`

```typescript
webPreferences: {
  preload: join(__dirname, '../preload/index.cjs'),
  nodeIntegration: false,
  contextIsolation: true,
  sandbox: false,  // Temporalmente para desarrollo
  webSecurity: true,
}
```

---

## 📊 Plan de Implementación

### Priorización por Impacto

| Fase | Impacto | Complejidad | Tiempo Estimado | Estado |
|------|---------|-------------|-----------------|---------|
| **Fase 1** | 🚨 Crítico | ⭐ Baja | 5 minutos | ⏳ Pendiente |
| **Fase 2** | ⚠️ Alto | ⭐ Baja | 10 minutos | ⏳ Pendiente |
| **Fase 3** | 📈 Medio | ⭐⭐ Media | 30 minutos | ⏳ Pendiente |
| **Fase 4** | 🔒 Bajo | ⭐⭐ Media | 20 minutos | ⏳ Pendiente |

### Secuencia de Ejecución

#### Paso 1: Corrección Crítica (5 min)
1. Abrir `apps/electron-renderer/src/services/aprobacionesService.ts`
2. Cambiar línea 11: `'../types/aprobaciones'` → `'@/types/aprobaciones'`
3. Guardar y verificar que la aplicación cargue
4. Probar navegación básica

#### Paso 2: Configuración TailwindCSS (10 min)
1. Abrir `apps/electron-renderer/tailwind.config.js`
2. Reemplazar configuración con la versión mejorada
3. Verificar que el warning desaparezca
4. Confirmar estilos shadcn/ui funcionen

#### Paso 3: Optimización React Query (30 min)
1. Actualizar QueryProvider con API v5
2. Revisar hooks personalizados
3. Probar caché y manejo de errores
4. Verificar rendimiento

#### Paso 4: Seguridad (20 min)
1. Implementar CSP básico
2. Configurar seguridad de ventana
3. Probar funcionalidad completa
4. Documentar cambios

---

## ✅ Criterios de Verificación

### Validación por Fase

#### Fase 1 - ✅ Verificación Crítica
- [ ] Aplicación carga sin errores en consola
- [ ] Componentes principales renderizan
- [ ] Navegación básica funcional
- [ ] Sin errores `TipoAprobacion is not defined`

#### Fase 2 - ✅ Verificación CSS
- [ ] Warning TailwindCSS desaparece
- [ ] Estilos shadcn/ui aplicados correctamente
- [ ] Tema claro/oscuro funciona
- [ ] Componentes responsive

#### Fase 3 - ✅ Verificación Estado
- [ ] React Query funciona sin warnings
- [ ] Caché funciona correctamente
- [ ] Manejo de errores implementado
- [ ] Performance aceptable

#### Fase 4 - ✅ Verificación Seguridad
- [ ] CSP implementado sin romper funcionalidad
- [ ] Warning seguridad Electron reducido
- [ ] Aplicación mantiene funcionalidad
- [ ] Best practices de seguridad aplicadas

---

## 🔧 Herramientas y Comandos

### Para Implementación

```bash
# Verificar estado actual
pnpm dev

# Ver errores en consola
# Chrome DevTools: Ctrl+Shift+I (o Cmd+Opt+I)

# Testing después de cambios
pnpm build
pnpm test
```

### Para Debugging

```bash
# Limpiar caché si es necesario
pnpm clean

# Reinstalar dependencias si hay problemas
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

## 📈 Métricas de Éxito

### Objetivos Inmediatos
- **Funcionalidad:** Aplicación visible y operativa en <10 minutos
- **Estabilidad:** Sin errores críticos en consola
- **Performance:** Tiempo de carga <5 segundos

### Objetivos de Calidad
- **WCAG Compliance:** Mantener 95%+ de accesibilidad
- **React Query:** Caché optimizado y sin warnings
- **Seguridad:** CSP implementado sin funcionalidad rota

---

## 🚨 Notas Importantes

### Consideraciones Especiales
1. **Backup Actual:** El sistema está funcional a nivel de backend
2. **Datos Integros:** Base de datos operativa sin afectación
3. **Infraestructura:** Configuración shadcn/ui correctamente instalada
4. **Progresividad:** Implementar por fases para no romper funcionalidad

### Riesgos Mitigados
- ✅ **Identificación precisa:** Error específico localizado
- ✅ **Solución simple:** Cambio de una línea de código
- ✅ **Impacto controlado:** Sin afectación a datos existentes
- ✅ **Reversibilidad:** Cambios fácilmente reversibles

---

## 📝 Post-Implementation

### Verificación Final
1. **Ejecutar checklist completo de funcionalidad**
2. **Probar todos los módulos implementados en Fase 3**
3. **Verificar sistema de aprobaciones funciona**
4. **Confirmar integración completa con shadcn/ui**

### Documentación
1. **Actualizar `CHECKLIST_IMPLEMENTACION_ISO_9241.md`**
2. **Marcar Fase 3 como 100% completada**
4. **Documentar lecciones aprendidas**

---

> **Creado por:** Claude Code Assistant
> **Metodología:** 8x strategy-applier agents + Chrome DevTools MCP
> **Fecha:** 17 de noviembre de 2024
> **Prioridad:** Crítica - Implementación Inmediata Recomendada