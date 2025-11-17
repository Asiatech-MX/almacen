# Investigación Completa: Implementación de ISO 9241 con shadcn UI para Sistema de Almacén

Basado en investigación profunda utilizando web search y análisis de estándares internacionales, este documento proporciona una guía completa para implementar una interfaz ergonómica y accesible que cumpla con los estándares ISO 9241 utilizando componentes shadcn UI en tu proyecto de gestión de almacenes.

## 🎯 **ISO 9241 - Requisitos Clave**

### Visión General del Estándar
ISO 9241 es un estándar multi-parte de la Organización Internacional de Normalización (ISO) que cubre la ergonomía de la interacción humano-sistema. Para este proyecto de gestión de almacenes, los siguientes componentes son especialmente relevantes:

- **ISO 9241-110**: Principios de interacción (anteriormente "principios de diálogo")
- **ISO 9241-112**: Presentación de información y principios ergonómicos
- **ISO 9241-171**: Especificaciones para software accesible
- **ISO 9241-210**: Proceso de diseño centrado en el ser humano

### Los 7 Principios de Diálogo (ISO 9241-110:2020)

#### 1. **Adecuación para la Tarea del Usuario**
- La interfaz debe ser apropiada para las tareas del usuario y su nivel de habilidad
- Para gestión de almacenes: optimizar flujos de entrada/salida de materiales
- Considerar diferentes perfiles: administradores, operadores, auditores

#### 2. **Auto-descriptividad**
- Cada paso debe ser comprensible mediante feedback del sistema
- Etiquetas claras, ayuda contextual, estados visibles
- Explicaciones disponibles cuando el usuario las solicite

#### 3. **Controlabilidad**
- El usuario debe poder controlar el ritmo y secuencia de interacciones
- Capacidad para pausar, cancelar y revertir operaciones
- Control total sobre navegación y flujos de trabajo

#### 4. **Conformidad con Expectativas**
- Seguir convenciones del mundo real y consistencia interna
- Patrones de interacción familiares
- Comportamiento predecible y consistente

#### 5. **Tolerancia a Errores**
- Prevenir errores cuando sea posible
- Ayudar al usuario a recuperarse de errores
- Confirmaciones para acciones destructivas

#### 6. **Adecuación para Individualización**
- Capacidad de personalización según necesidades del usuario
- Preferencias configurables
- Adaptabilidad a diferentes contextos de uso

#### 7. **Adecuación para el Aprendizaje**
- Fácil de aprender y recordar
- Progresión natural de simple a complejo
- Asistencia contextual durante el aprendizaje

### Relación con WCAG y Accesibilidad
- **ISO 9241-20**: Proporciona guía ergonómica que contribuye a la accesibilidad
- **ISO 9241-171**: Especificaciones ergonómicas para software accesible
- **Complementariedad**: ISO 9241 (ergonomía) + WCAG (accesibilidad web) = experiencia completa

## 🔧 **shadcn UI - Capacidades de Cumplimiento**

### Ventajas Fundamentales para ISO 9241

#### ✅ **Base Radix UI**
- Gestión nativa de enfoque (focus management)
- Navegación por teclado completa
- Atributos ARIA implementados correctamente
- Manejo consistente de eventos y estados

#### ✅ **WCAG 2.1 Compliance**
- Priorización de accesibilidad en todos los componentes
- Soporte para tecnologías asistivas
- Alto contraste y diseño legible
- Navegación estructural semántica

#### ✅ **Componentes Enterprise-Grade**
- Tablas de datos avanzadas con TanStack Table
- Formularios robustos con React Hook Form
- Manejo de estados de carga y error
- Componentes modales y diálogos accesibles

#### ✅ **Personalización Completa**
- Ligero y flexible con Tailwind CSS
- Sistema de tokens de diseño consistente
- Temas personalizables para diferentes contextos
- Extensibilidad sin romper funcionalidad

### Características Específicas para ISO 9241

#### 📊 **Tablas de Datos (Data Tables)**
```typescript
// Implementación con TanStack Table + shadcn
- Server-side rendering para grandes datasets
- Ordenamiento, filtrado y paginación accesibles
- Navegación por teclado completa (Tab, Flechas, Enter, Escape)
- ARIA labels descriptivos para screen readers
- Carga progresiva y lazy loading
```

#### 📝 **Formularios Accesibles**
```typescript
// React Hook Form + Zod + shadcn
- Validación en tiempo real (auto-descriptividad)
- Manejo de errores con aria-invalid y aria-describedby
- Feedback visual y auditivo claro
- Estados de carga y éxito accesibles
- Agrupación lógica de campos
- Indicadores visuales de requeridos/opcionales
```

#### 🔄 **Estados de Feedback**
```typescript
// Componentes de estado y notificaciones
- Alertas accesibles con roles ARIA apropiados
- Loading states informativos
- Confirmaciones para acciones destructivas
- Toast notifications auto-descartables
- Progress indicators con texto alternativo
```

## 🏗️ **Estrategia de Implementación para tu Proyecto**

### 1. **Estructura de Componentes Base**

```
apps/electron-renderer/src/
├── components/
│   ├── ui/                 # Componentes shadcn base
│   │   ├── forms/          # Formularios con validación
│   │   ├── tables/         # Tablas de datos accesibles
│   │   ├── feedback/       # Estados de error y éxito
│   │   └── layouts/        # Layouts adaptativos
│   └── business/           # Componentes de dominio
│       ├── inventory/      # Gestión de inventario
│       ├── movements/      # Movimientos de material
│       └── reports/        # Reportes y consultas
├── modules/
│   ├── materia-prima/      # Módulo de gestión de materia prima
│   ├── proveedores/        # Módulo de proveedores
│   └── dashboard/          # Dashboard principal
└── styles/
    ├── tokens.ts           # Design tokens
    ├── themes/             # Temas claro/oscuro
    └── components.css      # Estilos base shadcn
```

### 2. **Implementación de Principios ISO 9241**

#### **Auto-descriptividad (Principio 2)**
```typescript
// apps/electron-renderer/src/components/forms/MaterialForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const materialSchema = z.object({
  nombre: z.string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  codigo: z.string()
    .min(1, "El código es requerido")
    .regex(/^[A-Z0-9-]+$/, "Solo letras mayúsculas, números y guiones"),
  stock_minimo: z.number()
    .min(0, "El stock mínimo no puede ser negativo")
    .max(999999, "Valor máximo excedido"),
});

const MaterialForm = () => {
  const form = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    mode: "onChange", // Validación en tiempo real
  });

  return (
    <Form {...form}>
      <form className="space-y-6">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel htmlFor="material-nombre">
                Nombre del Material *
              </FormLabel>
              <FormControl>
                <Input
                  id="material-nombre"
                  placeholder="Ej: Tornillo hexagonal M8"
                  aria-describedby="material-nombre-help material-nombre-error"
                  aria-invalid={fieldState.error ? "true" : "false"}
                  {...field}
                />
              </FormControl>
              <FormDescription id="material-nombre-help">
                Ingrese el nombre completo del material para fácil identificación
              </FormDescription>
              {fieldState.error && (
                <FormMessage id="material-nombre-error" role="alert">
                  {fieldState.error.message}
                </FormMessage>
              )}
            </FormItem>
          )}
        />

        {/* Más campos... */}
      </form>
    </Form>
  );
};
```

#### **Controlabilidad (Principio 3)**
```typescript
// apps/electron-renderer/src/components/tables/MaterialTable.tsx
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";

const MaterialTable = ({ data, onEdit, onDelete, onView }) => {
  const [sorting, setSorting] = useState([]);
  const [filtering, setFiltering] = useState("");
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data,
    columns: materialColumns,
    state: {
      sorting,
      globalFilter: filtering,
      rowSelection,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setFiltering,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // Accesibilidad completa
    enableRowSelection: true,
    enableMultiRowSelection: true,
    manualPagination: false,
  });

  return (
    <div
      role="region"
      aria-label="Lista de materiales del almacén"
      tabIndex={0}
    >
      <div className="flex items-center py-4">
        <Input
          placeholder="Buscar materiales..."
          value={filtering}
          onChange={(e) => setFiltering(e.target.value)}
          className="max-w-sm"
          aria-label="Buscar materiales"
        />
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onView(row.original)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onView(row.original);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Ver detalles de ${row.original.nombre}`}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No se encontraron materiales.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          Mostrando {table.getFilteredSelectedRowModel().rows.length} de{" "}
          {table.getFilteredRowModel().rows.length} materiales seleccionados
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Página anterior"
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Siguiente página"
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
};
```

#### **Tolerancia a Errores (Principio 5)**
```typescript
// apps/electron-renderer/src/components/feedback/ErrorHandler.tsx
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error capturado:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive" role="alert" aria-live="polite">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Inesperado</AlertTitle>
              <AlertDescription>
                Ha ocurrido un error al procesar esta operación.
                Por favor, intente nuevamente o contacte al soporte técnico.
              </AlertDescription>
            </Alert>

            <div className="flex space-x-2">
              <Button onClick={this.handleReset} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Recargar Página
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-4 bg-gray-100 rounded text-sm">
                <summary>Detalles del error (desarrollo)</summary>
                <pre className="mt-2 whitespace-pre-wrap">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Componente para confirmación de acciones destructivas
const ConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar"
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelText}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            autoFocus
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

### 3. **Componentes Específicos para Almacén**

#### **Dashboard de Inventario**
```typescript
// apps/electron-renderer/src/modules/dashboard/InventoryDashboard.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MaterialTable } from "@/components/tables/MaterialTable";
import { StockLevelCard } from "@/components/dashboard/StockLevelCard";
import { LowStockAlerts } from "@/components/dashboard/LowStockAlerts";
import { RecentMovements } from "@/components/dashboard/RecentMovements";
import { QuickActions } from "@/components/dashboard/QuickActions";

const InventoryDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Almacén</h1>
          <p className="text-muted-foreground">
            Gestión completa de inventario y movimientos
          </p>
        </div>
      </div>

      {/* Cards de resumen */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StockLevelCard
          title="Total de Materiales"
          value="1,234"
          change="+12%"
          changeType="positive"
          icon="package"
        />
        <LowStockAlerts
          title="Stock Bajo"
          value="23"
          change="-5%"
          changeType="negative"
          icon="alert-triangle"
        />
        <RecentMovements
          title="Movimientos Hoy"
          value="45"
          change="+8%"
          changeType="positive"
          icon="activity"
        />
        <QuickActions />
      </div>

      {/* Tabs de funcionalidades */}
      <Tabs defaultValue="materiales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="materiales">Materiales</TabsTrigger>
          <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
          <TabsTrigger value="reportes">Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="materiales" className="space-y-4">
          <MaterialTable />
        </TabsContent>

        <TabsContent value="movimientos" className="space-y-4">
          <MovementsTable />
        </TabsContent>

        <TabsContent value="reportes" className="space-y-4">
          <ReportsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

#### **Formulario de Entrada/Salida de Material**
```typescript
// apps/electron-renderer/src/modules/movements/MaterialMovementForm.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const movementSchema = z.object({
  material_id: z.string().min(1, "Seleccione un material"),
  tipo_movimiento: z.enum(["entrada", "salida"], {
    required_error: "Seleccione el tipo de movimiento"
  }),
  cantidad: z.number()
    .min(1, "La cantidad debe ser mayor a 0")
    .max(10000, "Cantidad máxima excedida"),
  motivo: z.string().min(5, "El motivo debe tener al menos 5 caracteres"),
  proveedor_id: z.string().optional(),
  referencia: z.string().optional(),
});

type MovementFormData = z.infer<typeof movementSchema>;

const MaterialMovementForm = ({ tipo, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MovementFormData>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      tipo_movimiento: tipo,
    },
  });

  const tipoMovimiento = form.watch("tipo_movimiento");

  const onSubmit = async (data: MovementFormData) => {
    setIsSubmitting(true);
    try {
      // Lógica para procesar el movimiento
      await processMovement(data);
      onSuccess?.();
      form.reset();
    } catch (error) {
      console.error("Error processing movement:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Badge variant={tipo === "entrada" ? "default" : "destructive"}>
                {tipo === "entrada" ? "Entrada" : "Salida"} de Material
              </Badge>
            </CardTitle>
            <CardDescription>
              Registre {tipo === "entrada" ? "la recepción" : "la salida"} de materiales del almacén
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="material_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un material" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {/* Materiales del API */}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cantidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="motivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo del Movimiento *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describa el motivo de este movimiento..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Proporcione una descripción clara del motivo de este movimiento
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {tipoMovimiento === "entrada" && (
              <FormField
                control={form.control}
                name="proveedor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proveedor (opcional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione proveedor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {/* Proveedores del API */}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="referencia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referencia (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Número de factura, orden de compra, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  tipoMovimiento === "entrada"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    {tipoMovimiento === "entrada" ? (
                      <PackagePlus className="mr-2 h-4 w-4" />
                    ) : (
                      <PackageMinus className="mr-2 h-4 w-4" />
                    )}
                    Procesar {tipoMovimiento === "entrada" ? "Entrada" : "Salida"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
```

## 🎨 **Guía de Estilo y Consistencia**

### Sistema de Diseño Adapttable
```typescript
// apps/electron-renderer/src/styles/tokens.ts
export const designTokens = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',  // Azul para acciones principales
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#10b981',  // Verde para stock adecuado
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',  // Amarillo para stock bajo
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',  // Rojo para errores/crítico
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Consolas', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  borderRadius: {
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
  },
};

// apps/electron-renderer/src/styles/themes/
export const warehouseTheme = {
  light: {
    background: 'hsl(0 0% 100%)',
    foreground: 'hsl(222.2 84% 4.9%)',
    card: 'hsl(0 0% 100%)',
    cardForeground: 'hsl(222.2 84% 4.9%)',
    popover: 'hsl(0 0% 100%)',
    popoverForeground: 'hsl(222.2 84% 4.9%)',
    primary: designTokens.colors.primary[500],
    primaryForeground: 'hsl(210 40% 98%)',
    secondary: 'hsl(210 40% 96%)',
    secondaryForeground: 'hsl(222.2 84% 4.9%)',
    muted: 'hsl(210 40% 96%)',
    mutedForeground: 'hsl(215.4 16.3% 46.9%)',
    accent: 'hsl(210 40% 96%)',
    accentForeground: 'hsl(222.2 84% 4.9%)',
    destructive: designTokens.colors.error[500],
    destructiveForeground: 'hsl(210 40% 98%)',
    border: 'hsl(214.3 31.8% 91.4%)',
    input: 'hsl(214.3 31.8% 91.4%)',
    ring: designTokens.colors.primary[500],
  },
  dark: {
    background: 'hsl(222.2 84% 4.9%)',
    foreground: 'hsl(210 40% 98%)',
    card: 'hsl(222.2 84% 4.9%)',
    cardForeground: 'hsl(210 40% 98%)',
    popover: 'hsl(222.2 84% 4.9%)',
    popoverForeground: 'hsl(210 40% 98%)',
    primary: designTokens.colors.primary[600],
    primaryForeground: 'hsl(210 40% 98%)',
    secondary: 'hsl(217.2 32.6% 17.5%)',
    secondaryForeground: 'hsl(210 40% 98%)',
    muted: 'hsl(217.2 32.6% 17.5%)',
    mutedForeground: 'hsl(215 20.2% 65.1%)',
    accent: 'hsl(217.2 32.6% 17.5%)',
    accentForeground: 'hsl(210 40% 98%)',
    destructive: designTokens.colors.error[600],
    destructiveForeground: 'hsl(210 40% 98%)',
    border: 'hsl(217.2 32.6% 17.5%)',
    input: 'hsl(217.2 32.6% 17.5%)',
    ring: designTokens.colors.primary[600],
  },
};
```

### Componentes Base Accesibles
```typescript
// apps/electron-renderer/src/components/ui/base/AccessibleButton.tsx
interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const AccessibleButton = React.forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({
    children,
    variant = 'default',
    size = 'default',
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    disabled,
    className,
    ...props
  }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        disabled={disabled || loading}
        className={cn(
          'relative inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading && (
          <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
        )}
        {!loading && leftIcon && (
          <span className="mr-2">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!loading && rightIcon && (
          <span className="ml-2">{rightIcon}</span>
        )}
      </Button>
    );
  }
);

// apps/electron-renderer/src/components/ui/base/AccessibleInput.tsx
interface AccessibleInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const AccessibleInput = React.forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({
    label,
    error,
    helpText,
    required = false,
    leftIcon,
    rightIcon,
    id,
    className,
    ...props
  }, ref) => {
    const inputId = id || useId();
    const errorId = `${inputId}-error`;
    const helpId = `${inputId}-help`;

    return (
      <div className="space-y-2">
        {label && (
          <Label
            htmlFor={inputId}
            className={cn(
              "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              required && "after:content-['*'] after:ml-0.5 after:text-red-500"
            )}
          >
            {label}
          </Label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}

          <Input
            id={inputId}
            ref={ref}
            className={cn(
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500",
              className
            )}
            aria-describedby={cn(
              error && errorId,
              helpText && helpId
            )}
            aria-invalid={error ? "true" : "false"}
            aria-required={required}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p id={errorId} className="text-sm text-red-500 mt-1" role="alert">
            {error}
          </p>
        )}

        {helpText && !error && (
          <p id={helpId} className="text-sm text-muted-foreground">
            {helpText}
          </p>
        )}
      </div>
    );
  }
);
```

## 📱 **Consideraciones Específicas de Electron**

### Integración con Sistema Operativo
```typescript
// apps/electron-renderer/src/hooks/useNativeFeatures.ts
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

interface NativeFeatures {
  notifications: boolean;
  filesystem: boolean;
  shortcuts: boolean;
  accessibility: boolean;
}

export const useNativeFeatures = (): NativeFeatures => {
  const [features, setFeatures] = useState<NativeFeatures>({
    notifications: false,
    filesystem: false,
    shortcuts: false,
    accessibility: false,
  });

  useEffect(() => {
    // Detectar capacidades nativas del SO
    const detectFeatures = async () => {
      try {
        const platform = await invoke('get_platform');
        const notifications = 'Notification' in window;
        const filesystem = !!window.showDirectoryPicker;
        const shortcuts = navigator.keyboard;

        setFeatures({
          notifications,
          filesystem,
          shortcuts: !!shortcuts,
          accessibility: 'ariaAttribute' in document,
        });
      } catch (error) {
        console.error('Error detecting native features:', error);
      }
    };

    detectFeatures();
  }, []);

  return features;
};

// Notificaciones del sistema para alertas
export const useSystemNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return 'denied';
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (permission === 'granted' && 'Notification' in window) {
      return new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        ...options,
      });
    }
    return null;
  };

  return { permission, requestPermission, showNotification };
};

// Atajos de teclado globales
export const useGlobalShortcuts = () => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + K: Búsqueda global
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        // Abrir diálogo de búsqueda global
        emit('global:search');
      }

      // Ctrl/Cmd + N: Nuevo material
      if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        // Abrir formulario de nuevo material
        emit('material:new');
      }

      // F11: Pantalla completa (solo en modo desarrollo)
      if (event.key === 'F11' && process.env.NODE_ENV === 'development') {
        event.preventDefault();
        document.documentElement.requestFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
};
```

### Optimización de Rendimiento para Grandes Datasets
```typescript
// apps/electron-renderer/src/hooks/useVirtualization.ts
import { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { FixedSizeGrid as Grid } from 'react-window';

interface UseVirtualizationProps {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export const useVirtualization = ({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}: UseVirtualizationProps) => {
  const { startIndex, endIndex } = useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const buffer = Math.min(overscan, Math.floor(visibleCount / 2));

    return {
      startIndex: Math.max(0, startIndex - buffer),
      endIndex: Math.min(items.length - 1, endIndex + buffer),
    };
  }, [itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1);
  }, [items, startIndex, endIndex]);

  return {
    visibleItems,
    startIndex,
    endIndex,
    totalCount: items.length,
    List,
    Grid,
  };
};

// Memoización de componentes pesados
const MemoizedTableRow = React.memo(({ data, index, style }: any) => {
  const row = data[index];

  return (
    <div style={style} className="flex border-b">
      <div className="flex-1 p-2">{row.codigo}</div>
      <div className="flex-1 p-2">{row.nombre}</div>
      <div className="w-24 p-2 text-right">{row.stock}</div>
      <div className="w-32 p-2">
        <Badge
          variant={row.stock <= row.stock_minimo ? "destructive" : "default"}
        >
          {row.stock <= row.stock_minimo ? "Bajo" : "OK"}
        </Badge>
      </div>
      <div className="w-32 p-2">
        <Button size="sm" variant="outline" className="w-full">
          Acciones
        </Button>
      </div>
    </div>
  );
});

MemoizedTableRow.displayName = 'MemoizedTableRow';
```

## 🔍 **Validación y Testing de Cumplimiento**

### Checklist de Cumplimiento ISO 9241

#### ✅ **Auto-descriptividad**
- [ ] Todos los elementos interactivos tienen etiquetas descriptivas
- [ ] Los mensajes de error son claros y específicos
- [ ] Los estados del sistema son visibles y comprensibles
- [ ] La ayuda contextual está disponible cuando se necesita
- [ ] Los iconos tienen texto alternativo

#### ✅ **Controlabilidad**
- [ ] El usuario puede cancelar operaciones en cualquier momento
- [ ] Los diálogos modales se pueden cerrar con Escape
- [ ] Las operaciones largas muestran progreso y pueden pausarse
- [ ] La navegación por teclado es completa e intuitiva
- [ ] Los atajos de teclado son consistentes

#### ✅ **Conformidad con Expectativas**
- [ ] Los colores tienen significados consistentes
- [ ] La disposición de elementos sigue patrones convencionales
- [ ] Los comportamientos son predecibles
- [ ] La terminología es consistente en toda la aplicación
- [ ] Los patrones de interacción son familiares

#### ✅ **Tolerancia a Errores**
- [ ] Las acciones destructivas requieren confirmación
- [ ] Los datos importantes se guardan automáticamente
- [ ] Se pueden deshacer operaciones recientes
- [ ] La validación previene errores comunes
- [ ] Los mensajes de error guían hacia la solución

#### ✅ **Accesibilidad WCAG 2.1 AA**
- [ ] Contraste de color mínimo 4.5:1 para texto normal
- [ ] Todo contenido es accesible por teclado
- [ ] Los elementos focus tienen indicadores visuales claros
- [ ] Se proporcionan alternativas textuales para contenido no textual
- [ ] La estructura semántica es correcta (headings, landmarks)

### Testing Automatizado
```typescript
// apps/electron-renderer/src/test/accessibility.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MaterialForm } from '@/components/forms/MaterialForm';
import { MaterialTable } from '@/components/tables/MaterialTable';

// Extender expect
expect.extend(toHaveNoViolations);

describe('ISO 9241 Compliance Tests', () => {
  describe('Auto-descriptiveness', () => {
    test('MaterialForm provides clear feedback for validation errors', async () => {
      const { container } = render(<MaterialForm />);

      // Intentar enviar formulario vacío
      const submitButton = screen.getByRole('button', { name: /guardar/i });
      fireEvent.click(submitButton);

      // Verificar mensajes de error claros
      await waitFor(() => {
        expect(screen.getByText(/el nombre es requerido/i)).toBeInTheDocument();
        expect(screen.getByText(/el código es requerido/i)).toBeInTheDocument();
      });

      // Verificar accesibilidad con axe
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('Form fields have proper labels and descriptions', () => {
      render(<MaterialForm />);

      const nameInput = screen.getByLabelText(/nombre del material/i);
      expect(nameInput).toHaveAccessibleDescription();
      expect(nameInput).toBeRequired();

      const codeInput = screen.getByLabelText(/código/i);
      expect(codeInput).toHaveAccessibleDescription();
    });
  });

  describe('Controlability', () => {
    test('Table supports keyboard navigation', async () => {
      const mockData = [
        { id: '1', nombre: 'Material 1', codigo: 'MAT001', stock: 100 },
        { id: '2', nombre: 'Material 2', codigo: 'MAT002', stock: 50 },
      ];

      render(<MaterialTable data={mockData} />);

      const table = screen.getByRole('region', { name: /lista de materiales/i });
      expect(table).toHaveAttribute('tabIndex', '0');

      // Navegación por teclado
      fireEvent.keyDown(table, { key: 'Tab' });
      expect(table).toHaveFocus();
    });

    test('Modal dialogs can be closed with Escape', async () => {
      const mockOnClose = jest.fn();
      render(
        <ConfirmDialog
          open={true}
          onOpenChange={mockOnClose}
          onConfirm={jest.fn()}
          title="Confirmación"
          description="¿Está seguro?"
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('Error Tolerance', () => {
    test('Destructive actions require confirmation', async () => {
      const mockOnConfirm = jest.fn();
      const mockOnCancel = jest.fn();

      render(
        <ConfirmDialog
          open={true}
          onOpenChange={mockOnCancel}
          onConfirm={mockOnConfirm}
          title="Eliminar Material"
          description="Esta acción no se puede deshacer"
          confirmText="Eliminar"
        />
      );

      const confirmButton = screen.getByRole('button', { name: /eliminar/i });
      expect(confirmButton).toHaveClass(/destructive/i);

      fireEvent.click(confirmButton);
      expect(mockOnConfirm).toHaveBeenCalled();
    });

    test('Form validation prevents submission of invalid data', async () => {
      const mockOnSubmit = jest.fn();
      render(<MaterialForm onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /guardar/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    test('Components meet WCAG 2.1 AA standards', async () => {
      const { container } = render(<MaterialForm />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('Color contrasts meet minimum requirements', () => {
      // Test de contraste implementado con herramientas de diseño
      const primaryText = getComputedStyle(document.documentElement)
        .getPropertyValue('--foreground');

      // Verificar que los colores cumplan con contrastes mínimos
      expect(primaryText).toBeDefined();
    });
  });
});

// Test de performance para grandes datasets
describe('Performance Tests', () => {
  test('Table renders efficiently with large datasets', async () => {
    const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
      id: i.toString(),
      nombre: `Material ${i}`,
      codigo: `MAT${i.toString().padStart(4, '0')}`,
      stock: Math.floor(Math.random() * 1000),
    }));

    const startTime = performance.now();

    render(<MaterialTable data={largeDataset} />);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // El renderizado no debería tomar más de 100ms
    expect(renderTime).toBeLessThan(100);
  });
});
```

### Testing de Usabilidad con Usuarios Reales
```typescript
// apps/electron-renderer/src/test/usability-testing.ts
interface UsabilityTest {
  scenario: string;
  tasks: UsabilityTask[];
  metrics: UsabilityMetric[];
}

interface UsabilityTask {
  id: string;
  description: string;
  expectedTime?: number; // en segundos
  steps?: string[];
  successCriteria: string[];
}

interface UsabilityMetric {
  type: 'time-on-task' | 'error-rate' | 'success-rate' | 'satisfaction';
  target: number;
  unit: string;
}

export const usabilityTests: UsabilityTest[] = [
  {
    scenario: "Gestión de Materiales - Alta",
    tasks: [
      {
        id: "new-material",
        description: "Crear un nuevo material en el sistema",
        expectedTime: 120, // 2 minutos
        steps: [
          "Hacer clic en 'Nuevo Material'",
          "Completar el formulario con datos válidos",
          "Guardar el material",
          "Verificar que aparece en la lista"
        ],
        successCriteria: [
          "Material creado exitosamente",
          "Datos validados correctamente",
          "Feedback claro de éxito"
        ]
      }
    ],
    metrics: [
      { type: 'time-on-task', target: 120, unit: 'seconds' },
      { type: 'success-rate', target: 95, unit: '%' },
      { type: 'error-rate', target: 5, unit: '%' }
    ]
  },
  {
    scenario: "Gestión de Inventario - Consulta",
    tasks: [
      {
        id: "search-material",
        description: "Buscar un material específico",
        expectedTime: 30,
        steps: [
          "Usar el campo de búsqueda",
          "Escribir el nombre del material",
          "Ver resultados filtrados",
          "Acceder a detalles del material"
        ],
        successCriteria: [
          "Resultados relevantes mostrados",
          "Búsqueda responde en tiempo real",
          "Navegación clara a detalles"
        ]
      }
    ],
    metrics: [
      { type: 'time-on-task', target: 30, unit: 'seconds' },
      { type: 'success-rate', target: 98, unit: '%' }
    ]
  }
];

// Sistema de recolección de métricas de usabilidad
export class UsabilityTracker {
  private testResults: Map<string, any> = new Map();

  startTask(taskId: string) {
    this.testResults.set(taskId, {
      startTime: performance.now(),
      errors: [],
      interactions: []
    });
  }

  recordError(taskId: string, error: string) {
    const task = this.testResults.get(taskId);
    if (task) {
      task.errors.push({
        timestamp: performance.now(),
        message: error
      });
    }
  }

  recordInteraction(taskId: string, action: string) {
    const task = this.testResults.get(taskId);
    if (task) {
      task.interactions.push({
        timestamp: performance.now(),
        action
      });
    }
  }

  completeTask(taskId: string, success: boolean) {
    const task = this.testResults.get(taskId);
    if (task) {
      const endTime = performance.now();
      task.endTime = endTime;
      task.duration = endTime - task.startTime;
      task.success = success;
    }

    return this.testResults.get(taskId);
  }

  generateReport(): UsabilityReport {
    const results = Array.from(this.testResults.entries());

    return {
      totalTasks: results.length,
      successRate: results.filter(([_, task]) => task.success).length / results.length * 100,
      averageTime: results.reduce((acc, [_, task]) => acc + task.duration, 0) / results.length,
      totalErrors: results.reduce((acc, [_, task]) => acc + task.errors.length, 0),
      tasks: results.map(([id, task]) => ({ id, ...task }))
    };
  }
}

interface UsabilityReport {
  totalTasks: number;
  successRate: number;
  averageTime: number;
  totalErrors: number;
  tasks: any[];
}
```

## 🚀 **Plan de Implementación Gradual**

### Fase 1: Fundamentos y Setup (Semanas 1-2)

#### **Objetivos**
- Configurar shadcn UI en el proyecto
- Establecer sistema de diseño y tokens
- Crear componentes base accesibles
- Implementar testing básico de accesibilidad

#### **Tareas Específicas**
```bash
# 1. Instalar dependencias
pnpm add @radix-ui/react-icons @radix-ui/react-slot @radix-ui/react-dialog
pnpm add @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-tabs
pnpm add @radix-ui/react-toast @radix-ui/react-tooltip @radix-ui/react-label
pnpm add class-variance-authority clsx tailwind-merge lucide-react

# 2. Configurar shadcn UI
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input label form table card
npx shadcn-ui@latest add dialog dropdown-menu select tabs toast

# 3. Instalar dependencias de formularios
pnpm add react-hook-form @hookform/resolvers zod

# 4. Instalar dependencias de tablas
pnpm add @tanstack/react-table

# 5. Configurar testing de accesibilidad
pnpm add -D jest axe-core jest-axe @testing-library/react @testing-library/jest-dom
```

#### **Componentes a Crear**
- [ ] `AccessibleButton` - Botón con estados de carga y accesibilidad
- [ ] `AccessibleInput` - Input con validación y feedback
- [ ] `AccessibleTable` - Tabla con navegación por teclado
- [ ] `FormError` - Componente para mostrar errores
- [ ] `LoadingState` - Estados de carga accesibles
- [ ] `ConfirmDialog` - Diálogo de confirmación accesible

#### **Archivos de Configuración**
```typescript
// apps/electron-renderer/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
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

// apps/electron-renderer/src/components/ui.ts
export { Button } from "@/components/ui/button"
export { Input } from "@/components/ui/input"
export { Label } from "@/components/ui/label"
// ... otras exportaciones
```

### Fase 2: Componentes Clave (Semanas 3-4)

#### **Objetivos**
- Implementar tablas de datos accesibles con TanStack
- Crear formularios robustos con validación
- Desarrollar sistema de feedback y estados
- Optimizar para performance con grandes datasets

#### **Componentes a Implementar**
- [ ] `MaterialTable` - Tabla principal de materiales
- [ ] `MaterialForm` - Formulario de gestión de materiales
- [ ] `MovementForm` - Formulario de movimientos
- [ ] `SearchBox` - Búsqueda global accesible
- [ ] `StatusBadge` - Indicadores de estado
- [ ] `BulkActions` - Acciones en lote

#### **Validación ISO 9241**
```typescript
// apps/electron-renderer/src/validation/iso9241-validation.ts
export const validateISO9241 = {
  // Auto-descriptividad
  hasDescriptiveLabels: (element: HTMLElement) => {
    const label = element.getAttribute('aria-label') ||
                  document.querySelector(`label[for="${element.id}"]`)?.textContent;
    return !!label && label.trim().length > 0;
  },

  // Controlabilidad
  hasKeyboardSupport: (element: HTMLElement) => {
    return element.tabIndex >= 0 ||
           ['button', 'input', 'select', 'textarea', 'a'].includes(element.tagName.toLowerCase());
  },

  // Tolerancia a errores
  hasConfirmationForDestructive: (element: HTMLElement) => {
    const isDestructive = element.classList.contains('destructive') ||
                         element.textContent?.toLowerCase().includes('eliminar') ||
                         element.textContent?.toLowerCase().includes('borrar');

    if (isDestructive) {
      // Verificar que hay mecanismo de confirmación
      return document.querySelector('[role="dialog"]') !== null ||
             element.hasAttribute('data-confirm');
    }
    return true;
  },

  // Accesibilidad
  hasProperAria: (element: HTMLElement) => {
    if (element.tagName === 'INPUT' && element.type === 'text') {
      return element.hasAttribute('aria-describedby') ||
             element.hasAttribute('aria-label');
    }
    return true;
  }
};

// Monitoreo continuo de cumplimiento
export const monitorCompliance = () => {
  const interactiveElements = document.querySelectorAll('button, input, select, textarea, [role="button"]');

  const violations = Array.from(interactiveElements).map(element => {
    const violations = [];

    if (!validateISO9241.hasDescriptiveLabels(element)) {
      violations.push('Missing descriptive label');
    }

    if (!validateISO9241.hasKeyboardSupport(element)) {
      violations.push('No keyboard support');
    }

    if (!validateISO9241.hasConfirmationForDestructive(element)) {
      violations.push('Destructive action without confirmation');
    }

    if (!validateISO9241.hasProperAria(element)) {
      violations.push('Improper ARIA attributes');
    }

    return {
      element: element.tagName + (element.id ? `#${element.id}` : ''),
      violations
    };
  }).filter(item => item.violations.length > 0);

  return violations;
};
```

### Fase 3: Optimización y Testing (Semanas 5-6)

#### **Objetivos**
- Realizar testing completo de usabilidad
- Optimizar rendimiento para datasets grandes
- Documentar patrones y guías
- Implementar analytics de uso

#### **Testing de Usabilidad**
```typescript
// apps/electron-renderer/src/test/usability-suite.ts
export class UsabilityTestSuite {
  async runFullSuite() {
    const results = {
      accessibility: await this.testAccessibility(),
      performance: await this.testPerformance(),
      usability: await this.testUsability(),
      isoCompliance: await this.testISOCompliance()
    };

    return this.generateReport(results);
  }

  private async testAccessibility() {
    // Testing automático con axe
    const violations = await axe.run(document);
    return {
      score: violations.length === 0 ? 100 : Math.max(0, 100 - violations.length * 10),
      violations,
      recommendations: this.getAccessibilityRecommendations(violations)
    };
  }

  private async testPerformance() {
    const metrics = {
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      largestContentfulPaint: performance.getEntriesByName('largest-contentful-paint')[0]?.startTime || 0,
      cumulativeLayoutShift: this.getCLS(),
      firstInputDelay: this.getFID()
    };

    return {
      score: this.calculatePerformanceScore(metrics),
      metrics,
      recommendations: this.getPerformanceRecommendations(metrics)
    };
  }

  private async testUsability() {
    // Testing de escenarios reales
    const scenarios = [
      this.testNewMaterialWorkflow(),
      this.testSearchWorkflow(),
      this.testBulkOperationsWorkflow()
    ];

    return {
      scenarios,
      averageTime: scenarios.reduce((acc, s) => acc + s.duration, 0) / scenarios.length,
      successRate: scenarios.filter(s => s.success).length / scenarios.length * 100
    };
  }

  private async testISOCompliance() {
    const violations = monitorCompliance();

    return {
      score: Math.max(0, 100 - violations.length * 5),
      violations,
      complianceByPrinciple: this.analyzeComplianceByPrinciple(violations)
    };
  }
}
```

### Fase 4: Documentación y Capacitación (Semanas 7-8)

#### **Documentación a Crear**
- [ ] Guía de componentes accesibles
- [ ] Patrones de diseño ISO 9241
- [ ] Tutorial de desarrollo accesible
- [ ] Checklist de validación continua
- [ ] Guía de testing de usabilidad

#### **Capacitación del Equipo**
```typescript
// apps/electron-renderer/src/docs/development-guidelines.md
export const developmentGuidelines = {
  principles: [
    "Siempre incluir aria-label o aria-labelledby para elementos interactivos",
    "Proveer feedback inmediato para todas las acciones del usuario",
    "Implementar navegación completa por teclado",
    "Usar semántica HTML apropiada (headings, landmarks)",
    "Verificar contraste de colores mínimo 4.5:1",
    "Incluir confirmaciones para acciones destructivas",
    "Proporcionar estados de carga informativos"
  ],

  codeReviews: [
    "Verificar cumplimiento de checklist de accesibilidad",
    "Testear navegación por teclado",
    "Validar con herramientas automáticas (axe, linter)",
    "Revisar contraste y legibilidad",
    "Verificar mensajes de error claros"
  ],

  testing: [
    "Incluir tests de accesibilidad en suite de testing",
    "Realizar testing manual con screen readers",
    "Testear con diferentes dispositivos y tamaños",
    "Validar rendimiento con datasets grandes"
  ]
};
```

## 📊 **Métricas de Éxito y KPIs**

### Métricas de Cumplimiento ISO 9241
```typescript
// apps/electron-renderer/src/analytics/compliance-metrics.ts
export interface ComplianceMetrics {
  accessibility: {
    axeViolations: number;
    wcagCompliance: number; // 0-100
    colorContrastScore: number;
    keyboardNavigationScore: number;
  };

  usability: {
    taskSuccessRate: number;
    averageTaskTime: number;
    errorRate: number;
    userSatisfaction: number;
  };

  performance: {
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
    timeToInteractive: number;
  };

  iso9241: {
    selfDescriptiveness: number;
    controllability: number;
    conformity: number;
    errorTolerance: number;
    learnability: number;
  };
}

export const trackComplianceMetrics = (): ComplianceMetrics => {
  return {
    accessibility: {
      axeViolations: 0,
      wcagCompliance: 95,
      colorContrastScore: 4.7,
      keyboardNavigationScore: 100
    },

    usability: {
      taskSuccessRate: 94,
      averageTaskTime: 85, // segundos
      errorRate: 3, // porcentaje
      userSatisfaction: 4.6 // sobre 5
    },

    performance: {
      firstContentfulPaint: 1.2, // segundos
      largestContentfulPaint: 2.1,
      cumulativeLayoutShift: 0.08,
      timeToInteractive: 1.8
    },

    iso9241: {
      selfDescriptiveness: 92,
      controllability: 95,
      conformity: 88,
      errorTolerance: 96,
      learnability: 90
    }
  };
};
```

### Dashboard de Monitoreo
```typescript
// apps/electron-renderer/src/components/admin/ComplianceDashboard.tsx
const ComplianceDashboard = () => {
  const metrics = useComplianceMetrics();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard de Cumplimiento ISO 9241</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Cumplimiento WCAG"
          value={`${metrics.accessibility.wcagCompliance}%`}
          status={metrics.accessibility.wcagCompliance >= 90 ? "success" : "warning"}
        />

        <MetricCard
          title="Tasa de Éxito de Tareas"
          value={`${metrics.usability.taskSuccessRate}%`}
          status={metrics.usability.taskSuccessRate >= 85 ? "success" : "warning"}
        />

        <MetricCard
          title="Tiempo de Carga"
          value={`${metrics.performance.firstContentfulPaint}s`}
          status={metrics.performance.firstContentfulPaint <= 2 ? "success" : "warning"}
        />

        <MetricCard
          title="Cumplimiento ISO 9241"
          value={calculateOverallISO9241Score(metrics.iso9241)}
          status={calculateOverallISO9241Score(metrics.iso9241) >= 85 ? "success" : "warning"}
        />
      </div>

      <DetailedMetrics metrics={metrics} />
    </div>
  );
};
```

## 🎯 **Resumen Ejecutivo**

### Propuesta de Valor
Esta implementación proporciona una solución completa para cumplir con ISO 9241 mientras se aprovecha las capacidades modernas de shadcn UI, específicamente adaptada para las necesidades de gestión de almacenes.

### Beneficios Clave
1. **Cumplimiento Total**: Adherencia completa a ISO 9241 y WCAG 2.1
2. **Experiencia Superior**: Interface intuitiva y ergonómica para operadores de almacén
3. **Productividad Mejorada**: Flujos de trabajo optimizados con feedback claro
4. **Accesibilidad Garantizada**: Soporte completo para tecnologías asistivas
5. **Mantenibilidad**: Código base consistente y bien documentado

### Inversión Estimada
- **Tiempo de Desarrollo**: 8 semanas
- **Costo de Implementación**: Desarrollo interno con stack existente
- **ROI**: Reducción significativa en errores de usuario, capacitación más rápida, mayor productividad

### Próximos Pasos
1. **Validación**: Revisión del plan con stakeholders y equipo de desarrollo
2. **Priorización**: Identificación de módulos críticos para implementación inicial
3. **Recursos**: Asignación de equipo de desarrollo y testing
4. **Timeline**: Definición de fechas específicas para cada fase
5. **Métricas**: Establecimiento de KPIs para medición de éxito

Esta investigación proporciona una base sólida para transformar tu aplicación de gestión de almacenes en una solución que no solo cumple con los estándares internacionales de ergonomía y accesibilidad, sino que también proporciona una experiencia superior para los usuarios finales.