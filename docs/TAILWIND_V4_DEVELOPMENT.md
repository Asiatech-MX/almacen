# Tailwind CSS v4 Development Guide

## 🎯 Overview

This guide provides comprehensive documentation for working with **Tailwind CSS v4** in the Sistema de Almacén project. It covers the new architecture, development workflows, and best practices specific to our migration from v3 to v4.

## 🏗️ Architecture Overview

### Core Differences from v3

**v3 Architecture (PostCSS-based)**
```javascript
// tailwind.config.js (obsolete)
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: { extend: {...} },
  plugins: [...]
}

// postcss.config.js (removed)
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  }
}
```

**v4 Architecture (Vite Plugin-based)**
```css
/* src/styles/globals.css */
@import "tailwindcss";

@source './**/*.{tsx,ts,jsx,js}';
@source '../index.html';

@theme {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  /* All theme variables here */
}
```

```typescript
// vite.config.ts
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  css: { postcss: false }
});
```

## 🎨 Theme System

### CSS Variables with HSL Wrapper

The v4 theme system uses CSS custom properties with HSL color space for better color manipulation:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --sidebar: 0 0% 98%;
  --sidebar-foreground: 0 0% 9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  /* ... complete color palette */
}

@theme {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-sidebar: hsl(var(--sidebar));
  --color-sidebar-foreground: hsl(var(--sidebar-foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
}
```

### Dark Mode Support

Dark mode uses CSS cascade layers for automatic switching:

```css
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --sidebar: 222.2 84% 4.9%;
  --sidebar-foreground: 0 0% 95%;
  /* ... inverted color values */
}
```

## 🔧 Development Workflow

### 1. Starting Development

```bash
# Start the development server
pnpm dev

# Vite with @tailwindcss/vite plugin automatically:
# - Scans source files using @source directives
# - Generates utilities on-demand
# - Provides hot reload for CSS changes
# - Optimizes bundle size automatically
```

### 2. Adding Custom Styles

**Method 1: Extend Theme (Recommended)**
```css
@theme {
  --color-brand-50: #eff6ff;
  --color-brand-500: #3b82f6;
  --color-brand-900: #1e3a8a;

  --font-display: "Inter", sans-serif;
  --breakpoint-3xl: 120rem;
}
```

**Method 2: Custom Utilities**
```css
@utility tab-4 {
  tab-size: 4;
}

@utility custom-shadow {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```

### 3. Using Components

**Modern shadcn/ui Components (v4 adapted)**
```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Components already use v4 utilities:
// - ring-1 instead of ring-2
// - outline-hidden instead of outline-none
// - size-4 instead of w-4 h-4
```

## 📝 Utility Changes

### Critical Updates from v3

| v3 Utility | v4 Equivalent | Notes |
|------------|---------------|-------|
| `outline-none` | `outline-hidden` | Better accessibility semantics |
| `ring-2` | `ring-1` | Default ring width changed from 3px to 1px |
| `w-4 h-4` | `size-4` | Simplified sizing utilities |
| `flex-shrink-0` | `shrink-0` | Shorter utility names |
| `flex-grow-1` | `grow-1` | Consistent naming pattern |

### Modern v4 Features

**CSS Variables in Utilities**
```html
<div class="bg-(--brand-color) p-(--spacing-md)">
  Dynamic color and spacing from CSS variables
</div>
```

**Arbitrary Values with Spaces**
```html
<!-- v3: grid-cols-[1fr,auto,2fr] -->
<div class="grid-cols-[1fr_auto_2fr]">
  <!-- Use underscores for spaces in v4 -->
</div>
```

## 🎯 Best Practices

### 1. Theme Development

```css
/* ✅ Good: Use HSL with CSS variables */
@theme {
  --color-primary: hsl(var(--primary));
}

/* ❌ Avoid: Hard-coded colors in components */
.my-component {
  background-color: #3b82f6; /* Use theme variables instead */
}
```

### 2. Component Styling

```tsx
// ✅ Good: Use utility classes with theme colors
<button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Submit
</button>

// ✅ Good: Use CSS variables for dynamic values
<div style={{ backgroundColor: 'var(--color-primary)' }}>
  Dynamic content
</div>
```

### 3. Responsive Design

```html
<!-- v4 maintains all v3 responsive patterns -->
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  Responsive grid layout
</div>
```

### 4. Dark Mode

```tsx
// Theme hook works seamlessly with v4
import { useTheme } from '@/hooks/useTheme';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Switch to {theme === 'light' ? 'dark' : 'light'} mode
    </button>
  );
}
```

## 🔍 Troubleshooting

### Common Issues

**1. Styles Not Applying**
```bash
# Check Vite configuration
# Ensure tailwindcss() plugin is present
# Verify postcss: false is set
```

**2. Missing Utilities**
```css
/* Verify @source directives cover all file paths */
@source './**/*.{tsx,ts,jsx,js}';
@source '../index.html';
```

**3. Theme Variables Not Working**
```css
/* Ensure CSS variables are defined in :root */
:root {
  --primary: 222.2 47.4% 11.2%;
}

/* And mapped in @theme */
@theme {
  --color-primary: hsl(var(--primary));
}
```

### Chrome DevTools Debugging

```javascript
// Check if Tailwind is loaded
console.log(document.querySelector('style[data-vite-dev-id*="tailwind"]'));

// Test utility application
const test = document.createElement('div');
test.className = 'bg-green-500 text-white p-4';
console.log(getComputedStyle(test).backgroundColor); // Should show color, not transparent
```

## 📚 Advanced Features

### 1. Container Queries

```css
/* Define custom container sizes */
@theme {
  --container-sm: 640px;
  --container-md: 768px;
  --container-lg: 1024px;
}
```

```html
<div className="@container">
  <div className="text-sm @lg:text-base">
    Responsive text within container
  </div>
</div>
```

### 2. Custom Animations

```css
@theme {
  --animate-fade-in: fadeIn 0.5s ease-in-out;
  --animate-slide-up: slideUp 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

### 3. Extended Theme Configuration

```css
/* Complete theme example */
@theme {
  /* Colors */
  --color-brand-50: #eff6ff;
  --color-brand-500: #3b82f6;
  --color-brand-900: #1e3a8a;

  /* Typography */
  --font-display: "Inter", sans-serif;
  --font-body: "Inter", sans-serif;

  /* Spacing */
  --spacing-section: 4rem;
  --spacing-gutter: 1.5rem;

  /* Breakpoints */
  --breakpoint-xs: 475px;
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;

  /* Animation */
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --duration-fast: 150ms;
  --duration-normal: 300ms;
}
```

## 🚀 Performance Optimizations

### 1. Bundle Size

- **JIT Compilation**: Only generates utilities you actually use
- **Tree Shaking**: Automatically removes unused CSS
- **Content Scanning**: @source directives ensure efficient file scanning

### 2. Development Speed

- **Hot Reload**: Instant CSS updates without full page reload
- **Vite Integration**: Leverages Vite's optimized build pipeline
- **PostCSS Elimination**: Direct plugin integration reduces build overhead

### 3. Runtime Performance

- **CSS Variables**: Faster color calculations in browser
- **Modern CSS**: Takes advantage of latest CSS engine optimizations
- **Reduced Parse Time**: Smaller CSS bundles load faster

## 📖 Additional Resources

- [Official Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Migration Guide from v3 to v4](https://tailwindcss.com/docs/upgrade-guide)
- [Vite Plugin Documentation](https://tailwindcss.com/docs/installation/using-vite)
- [shadcn/ui Components](https://ui.shadcn.com)

## 🔄 Migration Summary

This project successfully migrated from Tailwind CSS v3 to v4 with the following key changes:

- ✅ **Vite Plugin**: Replaced PostCSS with @tailwindcss/vite
- ✅ **CSS Configuration**: Moved from tailwind.config.js to CSS @theme directives
- ✅ **Utility Updates**: Updated all obsolete utilities to v4 equivalents
- ✅ **Theme Variables**: Implemented CSS variable-based theming with HSL
- ✅ **Components**: Updated all shadcn/ui components for v4 compatibility
- ✅ **Performance**: Achieved better build times and smaller bundles

The migration provides a modern, maintainable CSS architecture with improved developer experience and performance.