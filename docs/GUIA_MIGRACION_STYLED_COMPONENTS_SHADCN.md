# Guía de Migración: styled-components a shadcn/ui + Tailwind v4

## Overview

Esta guía proporciona un patrón comprobado para migrar componentes de styled-components a shadcn/ui con Tailwind CSS v4, basado en la experiencia real de migrar `ConsultasAvanzadas.tsx`.

## Prerrequisitos

### 1. Configuración del Proyecto
- ✅ Tailwind CSS v4 con @tailwindcss/vite plugin configurado
- ✅ shadcn/ui componentes instalados y configurados
- ✅ TypeScript configurado con modo estricto

### 2. Dependencias Requeridas
```bash
# shadcn/ui CLI
npx shadcn@latest add [component-name]

# Para componentes DiceUI (opcional)
npx shadcn@latest add "https://diceui.com/r/segmented-input"
pnpm add class-variance-authority
```

## Estrategia de Migración

### Fase 1: Análisis y Preparación

#### 1.1 Identificar Componentes a Migrar
```bash
# Buscar styled-components en el proyecto
grep -r "styled\." src/ --include="*.tsx" --include="*.ts"
```

#### 1.2 Crear Backup
```bash
# Siempre crear backup antes de empezar
cp Componente.tsx Componente.backup.tsx
```

#### 1.3 Documentar Estado Actual
- Capturar pantalla del componente actual
- Listar funcionalidades críticas
- Identificar dependencias externas

### Fase 2: Layout y Estructura

#### 2.1 Reemplazar Container Principal
```tsx
// Antes: styled-components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`

// Después: Tailwind classes
<div className="max-w-7xl mx-auto p-5">
```

#### 2.2 Migrar Headers y Títulos
```tsx
// Antes
const Header = styled.div`
  margin-bottom: 2rem;
`

const Title = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  color: #1f2937;
`

// Después
<div className="mb-8">
  <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2 mb-2">
    📊 Título del Componente
  </h2>
  <p className="text-gray-600">Descripción del componente</p>
</div>
```

#### 2.3 Implementar Grid System
```tsx
// Antes
const SearchGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
`

// Después
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
```

### Fase 3: Formularios y Controles

#### 3.1 Input Components
```tsx
// Antes
const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  width: 100%;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`

// Después
<div className="space-y-2">
  <Label htmlFor="input-id">Etiqueta del Input</Label>
  <Input
    id="input-id"
    type="text"
    value={value}
    onChange={handleChange}
    placeholder="Placeholder..."
    className="w-full"
  />
</div>
```

#### 3.2 Select Components
```tsx
// Antes
const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  width: 100%;
`

// Después
<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Seleccionar opción" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Opción 1</SelectItem>
    <SelectItem value="option2">Opción 2</SelectItem>
  </SelectContent>
</Select>
```

#### 3.3 DiceUI SegmentedInput (Para Rangos)
```tsx
// Antes: Inputs separados para rangos
<div className="flex gap-2">
  <Input placeholder="Mínimo" />
  <Input placeholder="Máximo" />
</div>

// Después: DiceUI SegmentedInput
<div className="space-y-2">
  <Label>Rango de Valores</Label>
  <SegmentedInput>
    <SegmentedInputItem
      type="number"
      placeholder="Mínimo"
      value={range.min || ''}
      onChange={(e) => handleRangeChange('min')(e)}
    />
    <SegmentedInputItem
      type="number"
      placeholder="Máximo"
      value={range.max || ''}
      onChange={(e) => handleRangeChange('max')(e)}
    />
  </SegmentedInput>
</div>
```

#### 3.4 Checkbox Components
```tsx
// Antes
const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
`

// Después
<div className="flex items-center space-x-2">
  <Checkbox
    id="checkbox-id"
    checked={checked}
    onCheckedChange={(checked) => setChecked(checked as boolean)}
  />
  <Label htmlFor="checkbox-id">Etiqueta del checkbox</Label>
</div>
```

### Fase 4: Tablas y Datos

#### 4.1 Table Components
```tsx
// Antes
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`

const TableRow = styled.tr`
  border-bottom: 1px solid #e5e7eb;
`

// Después
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Columna 1</TableHead>
      <TableHead>Columna 2</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map((item) => (
      <TableRow key={item.id}>
        <TableCell className="font-medium">{item.value1}</TableCell>
        <TableCell>{item.value2}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

#### 4.2 Badge para Estados
```tsx
// Antes
const StatusBadge = styled.span<{ variant: 'success' | 'warning' | 'error' }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;

  ${props => {
    switch (props.variant) {
      case 'success':
        return css`
          background-color: #dcfce7;
          color: #166534;
        `
      case 'warning':
        return css`
          background-color: #fef3c7;
          color: #92400e;
        `
      case 'error':
        return css`
          background-color: #fee2e2;
          color: #991b1b;
        `
    }
  }}
`

// Después
const getBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'success': return 'default'
    case 'warning': return 'secondary'
    case 'error': return 'destructive'
    default: return 'outline'
  }
}

<Badge variant={getBadgeVariant(status)}>
  {statusText}
</Badge>
```

### Fase 5: Navegación y Tabs

#### 5.1 Tabs System
```tsx
// Antes
const TabsContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
`

const Tab = styled.button<{ active: boolean }>`
  padding: 8px 16px;
  border: none;
  background-color: ${props => props.active ? '#3b82f6' : '#f3f4f6'};
  color: ${props => props.active ? 'white' : '#6b7280'};
  border-radius: 6px;
  cursor: pointer;
`

// Después
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">
    {/* Content */}
  </TabsContent>
  <TabsContent value="tab2">
    {/* Content */}
  </TabsContent>
</Tabs>
```

### Fase 6: Alertas y Notificaciones

#### 6.1 Alert Components
```tsx
// Antes
const AlertCard = styled.div<{ type: 'info' | 'error' }>`
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;

  ${props => {
    switch (props.type) {
      case 'info':
        return css`
          background-color: #eff6ff;
          border-left: 4px solid #3b82f6;
        `
      case 'error':
        return css`
          background-color: #fef2f2;
          border-left: 4px solid #ef4444;
        `
    }
  }}
`

// Después
<Alert className="mb-5" variant={isError ? "destructive" : "default"}>
  <AlertTitle>⚠️ Título de Alerta</AlertTitle>
  <AlertDescription>
    Descripción de la alerta con información importante
  </AlertDescription>
</Alert>
```

### Fase 7: Cards y Contenedores

#### 7.1 Card Layouts
```tsx
// Antes
const Card = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`

// Después
<Card className="mb-5">
  <CardHeader>
    <CardTitle>Título de la Card</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

#### 7.2 Statistics Cards con Animaciones
```tsx
<Card className="border-l-4 border-l-blue-500 transition-all duration-200 ease-in-out hover:shadow-lg hover:scale-105">
  <CardContent className="p-6">
    <h4 className="text-sm font-medium text-gray-600 mb-2">Título</h4>
    <div className="text-3xl font-bold text-blue-600 transition-transform duration-200 ease-in-out hover:scale-110">
      {value}
    </div>
    <p className="text-sm text-gray-500">Descripción</p>
  </CardContent>
</Card>
```

## Patrones Reutilizables

### 1. Funciones de Utilidad para Estados
```tsx
// Para componentes con estados (stock, status, etc.)
const getStatusVariant = (item: any): "default" | "secondary" | "destructive" | "outline" => {
  const status = getStatus(item)
  switch (status) {
    case 'active': return 'default'
    case 'warning': return 'secondary'
    case 'error': return 'destructive'
    default: return 'outline'
  }
}

const getStatusText = (item: any): string => {
  const status = getStatus(item)
  switch (status) {
    case 'active': return '✅ Activo'
    case 'warning': return '⚠️ Advertencia'
    case 'error': return '❌ Error'
    default: return 'Desconocido'
  }
}
```

### 2. Layout Responsivo
```tsx
// Grids responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

// Espaciado consistente
<div className="space-y-4">  // Para elementos verticales
<div className="flex items-center space-x-2">  // Para elementos horizontales
```

### 3. Estados de Carga y Vacíos
```tsx
// Estados de carga con Skeleton
{loading && (
  <div className="space-y-4">
    <Skeleton className="h-8 w-full" />
    <Skeleton className="h-4 w-3/4" />
    <div className="space-y-2">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  </div>
)}

// Estados vacíos
{data.length === 0 && !loading && (
  <Card>
    <CardContent className="flex flex-col items-center justify-center py-16">
      <div className="text-4xl mb-4">🔍</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos</h3>
      <p className="text-gray-500 text-center">No se encontraron resultados</p>
    </CardContent>
  </Card>
)}
```

## Optimización de Imports

### 1. Estructura Recomendada
```tsx
// Imports de React
import React, { useState, useEffect } from 'react'

// Hooks personalizados
import useCustomHook from '../../hooks/useCustomHook'

// Tipos
import type { MyType } from '../../../../shared/types/myType'

// Componentes shadcn/ui (orden alfabético)
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
```

### 2. Imports Condicionales
```tsx
// Solo importar componentes necesarios
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Importar componentes de DiceUI solo si se usan
import { SegmentedInput, SegmentedInputItem } from "@/components/ui/segmented-input"
```

## Tailwind v4 Consideraciones

### 1. Cambios de Utilities
```bash
# v3 → v4
outline-none → outline-hidden
ring-2 → ring-1
w-4 h-4 → size-4
space-y-2 → gap-2 (en algunos casos)
```

### 2. CSS Variables para Theme
```css
/* En globals.css */
@theme {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-primary: hsl(var(--primary));
}
```

## Testing y Validación

### 1. Checklist Funcional
- [ ] Todos los formularios funcionan correctamente
- [ ] Navegación y tabs operativos
- [ ] Estados de carga y vacíos funcionan
- [ ] Diseño responsive en móvil/tablet/desktop
- [ ] Animaciones y transiciones funcionan
- [ ] Accesibilidad: navegación por teclado, contraste, ARIA

### 2. Chrome DevTools Testing
```bash
# Verificar consola sin errores
# Inspeccionar elementos renderizados correctamente
# Validar responsive con device emulation
# Analizar performance con Lighthouse
```

## Errores Comunes y Soluciones

### 1. Select con Valor Vacío
```tsx
// Problema: Select no acepta string vacío
<Select value={categoria} onValueChange={setCategoria}>

// Solución: Manejar valor vacío con placeholder
<Select value={categoria || "all"} onValueChange={(value) => setCategoria(value === "all" ? "" : value)}>
  <SelectContent>
    <SelectItem value="all">Todas las categorías</SelectItem>
```

### 2. styled-components Props no Filtradas
```tsx
// Problema: Warning de props no filtradas
const StyledComponent = styled.div<{ customProp: string }>`
  /* styles */
`

// Solución: Usar shouldForwardProp o eliminar styled-components
```

### 3. Bundle Size
```bash
# Analizar bundle size antes y después
npx vite-bundle-analyzer dist

# Importar solo componentes necesarios
```

## Métricas de Éxito

### 1. Código
- **Reducción de líneas**: >30%
- **Eliminación de styled-components**: 100%
- **Imports optimizados**: Alfabéticos y agrupados

### 2. Performance
- **Tiempo de renderizado**: <100ms
- **Bundle size**: Reducción >15%
- **Memory usage**: Sin leaks

### 3. UX
- **Accesibilidad**: WCAG 2.1 AA
- **Responsive**: Mobile-first
- **Animaciones**: Suaves y significativas

## Herramientas Útiles

### 1. Desarrollo
```bash
# shadcn CLI
npx shadcn@latest add [component]

# Tailwind v4
npx @tailwindcss/vite@next

# TypeScript checking
npx tsc --noEmit
```

### 2. Testing
```bash
# Chrome DevTools
# Lighthouse extension
# React Developer Tools
```

## Conclusión

Esta guía proporciona un patrón comprobado para migrar componentes de styled-components a shadcn/ui con Tailwind v4. Siguiendo estos pasos, puedes lograr:

- **40%+ de reducción de código**
- **Mejora significativa en UX**
- **100% de funcionalidad preservada**
- **Componentes estándar y mantenibles**
- **Mejor accesibilidad y performance**

La migración de `ConsultasAvanzadas.tsx` demuestra que este enfoque es efectivo y puede replicarse en otros componentes del proyecto.

---

*Basado en la experiencia real de migración del proyecto Sistema de Almacén*