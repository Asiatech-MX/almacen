import React, { useState, useMemo, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState,
} from '@tanstack/react-table'
import { z } from 'zod'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Icons
import { MoreHorizontal, ArrowUpDown, Search, Edit, Trash2, Eye, Package, AlertTriangle } from 'lucide-react'

// Types
import type { MateriaPrima } from '@/shared/types/materiaPrima'

// Validation schema con Zod
export const materiaPrimaTableSchema = z.object({
  id: z.string(),
  codigo_barras: z.string(),
  nombre: z.string(),
  marca: z.string().nullable(),
  modelo: z.string().nullable(),
  presentacion: z.string(),
  stock_actual: z.number(),
  stock_minimo: z.number(),
  costo_unitario: z.number().nullable(),
  fecha_caducidad: z.date().nullable(),
  categoria: z.string().nullable(),
  proveedor_id: z.string().nullable(),
})

type MateriaPrimaValidated = z.infer<typeof materiaPrimaTableSchema>

export interface MaterialTableProps {
  data: MateriaPrima[]
  onEdit?: (material: MateriaPrima) => void
  onDelete?: (material: MateriaPrima) => void
  onView?: (material: MateriaPrima) => void
  onStockUpdate?: (material: MateriaPrima) => void
  loading?: boolean
  className?: string
}

export const MaterialTable: React.FC<MaterialTableProps> = ({
  data = [],
  onEdit,
  onDelete,
  onView,
  onStockUpdate,
  loading = false,
  className,
}) => {
  // Estados para la tabla
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'nombre', desc: false }
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  })

  // Memoized columns con accesibilidad WCAG
  const columns = useMemo<ColumnDef<MateriaPrima>[]>(() => [
    {
      accessorKey: 'codigo_barras',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-2 font-semibold text-left"
          aria-label={`Ordenar por código de barras ${column.getIsSorted() === 'asc' ? 'descendente' : 'ascendente'}`}
        >
          Código
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-mono text-sm" role="cell">
          {row.getValue('codigo_barras')}
        </div>
      ),
      enableSorting: true,
      enableColumnFilter: true,
    },
    {
      accessorKey: 'nombre',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-2 font-semibold text-left"
          aria-label={`Ordenar por nombre ${column.getIsSorted() === 'asc' ? 'descendente' : 'ascendente'}`}
        >
          Nombre
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium" role="cell">
          {row.getValue('nombre')}
        </div>
      ),
      enableSorting: true,
      enableColumnFilter: true,
    },
    {
      accessorKey: 'categoria',
      header: 'Categoría',
      cell: ({ row }) => (
        <Badge variant="secondary" role="cell">
          {row.getValue('categoria') || 'Sin categoría'}
        </Badge>
      ),
      enableSorting: true,
      enableColumnFilter: true,
    },
    {
      accessorKey: 'presentacion',
      header: 'Presentación',
      cell: ({ row }) => (
        <div className="text-sm text-gray-600" role="cell">
          {row.getValue('presentacion')}
        </div>
      ),
    },
    {
      accessorKey: 'stock_actual',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-2 font-semibold text-left"
          aria-label={`Ordenar por stock actual ${column.getIsSorted() === 'asc' ? 'descendente' : 'ascendente'}`}
        >
          Stock
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const stock = row.getValue('stock_actual') as number
        const stockMinimo = row.original.stock_minimo
        const stockStatus = stock === 0 ? 'out' : stock <= stockMinimo ? 'low' : 'normal'

        return (
          <div className="flex items-center gap-2" role="cell">
            <span className={`font-medium ${
              stockStatus === 'out' ? 'text-red-600' :
              stockStatus === 'low' ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              {stock}
            </span>
            {stockStatus === 'out' && (
              <AlertTriangle className="h-4 w-4 text-red-600" aria-label="Sin stock" />
            )}
            {stockStatus === 'low' && (
              <AlertTriangle className="h-4 w-4 text-yellow-600" aria-label="Stock bajo" />
            )}
          </div>
        )
      },
      enableSorting: true,
    },
    {
      accessorKey: 'costo_unitario',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-2 font-semibold text-left"
          aria-label={`Ordenar por costo unitario ${column.getIsSorted() === 'asc' ? 'descendente' : 'ascendente'}`}
        >
          Costo Unitario
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const costo = row.getValue('costo_unitario') as number | null
        return (
          <div className="text-sm font-medium" role="cell">
            {costo ? `$${costo.toFixed(2)}` : 'N/A'}
          </div>
        )
      },
      enableSorting: true,
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const material = row.original

        return (
          <div className="flex items-center justify-end" role="cell">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  aria-label={`Acciones para ${material.nombre}`}
                >
                  <span className="sr-only">Abrir menú de acciones</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {onView && (
                  <DropdownMenuItem
                    onClick={() => onView(material)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Ver detalles
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem
                    onClick={() => onEdit(material)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                )}
                {onStockUpdate && (
                  <DropdownMenuItem
                    onClick={() => onStockUpdate(material)}
                    className="flex items-center gap-2"
                  >
                    <Package className="h-4 w-4" />
                    Actualizar Stock
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(material)}
                    className="flex items-center gap-2 text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
      enableSorting: false,
    },
  ], [onEdit, onDelete, onView, onStockUpdate])

  // Configuración de la tabla con React Table
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id,
    // Configuraciones de accesibilidad
    enableColumnResizing: false,
    enableRowSelection: true,
    enableMultiRowSelection: true,
    // Meta para accesibilidad
    meta: {
      tableDescription: 'Tabla de materiales prima del almacén con funciones de ordenamiento, filtrado y paginación',
    },
  })

  // Handlers para accesibilidad
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // Navegación por teclado mejorada
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      // Implementar navegación personalizada si se necesita
    }
  }, [])

  // Función de exportación para accesibilidad
  const exportToCSV = useCallback(() => {
    const headers = columns.map(col =>
      typeof col.header === 'string' ? col.header : 'Columna'
    ).join(',')

    const rows = table.getFilteredRowModel().rows.map(row =>
      columns.map(col => {
        const value = row.getValue(col.id as string)
        return typeof value === 'string' ? `"${value}"` : value
      }).join(',')
    )

    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `materiales_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [columns, table])

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">
            Materiales Prima ({table.getFilteredRowModel().rows.length} elementos)
          </CardTitle>

          <div className="flex items-center gap-2">
            {/* Búsqueda global accesible */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar materiales..."
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-8 w-64"
                aria-label="Buscar materiales"
                aria-describedby="search-help"
              />
              <span id="search-help" className="sr-only">
                Escribe para buscar en todas las columnas
              </span>
            </div>

            {/* Botón de exportación */}
            <Button
              variant="outline"
              onClick={exportToCSV}
              aria-label="Exportar datos a CSV"
            >
              Exportar CSV
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
              role="status"
              aria-label="Cargando datos"
            >
              <span className="sr-only">Cargando...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Tabla accesible */}
            <div className="rounded-md border overflow-hidden">
              <Table
                role="table"
                aria-label={table.options.meta?.tableDescription}
                aria-rowcount={table.getFilteredRowModel().rows.length}
              >
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} role="row">
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          scope="col"
                          role="columnheader"
                          aria-sort={
                            header.column.getIsSorted()
                              ? header.column.getIsSorted() === 'asc'
                                ? 'ascending'
                                : 'descending'
                              : undefined
                          }
                          className="px-4 py-3 font-semibold text-gray-900"
                        >
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
                <TableBody onKeyDown={handleKeyDown}>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row, index) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && 'selected'}
                        role="row"
                        aria-rowindex={index + 1}
                        className="hover:bg-gray-50 focus:bg-blue-50 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:ring-inset"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            role="gridcell"
                            className="px-4 py-3"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow role="row">
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center text-gray-500"
                        role="gridcell"
                      >
                        No se encontraron resultados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Controles de paginación accesibles */}
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-gray-600">
                Mostrando{' '}
                <span className="font-medium">
                  {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
                </span>{' '}
                a{' '}
                <span className="font-medium">
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                    table.getFilteredRowModel().rows.length
                  )}
                </span>{' '}
                de{' '}
                <span className="font-medium">
                  {table.getFilteredRowModel().rows.length}
                </span>{' '}
                resultados
              </div>

              <div className="flex items-center space-x-2">
                {/* Paginación */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Página anterior"
                >
                  Anterior
                </Button>

                <div className="flex items-center space-x-1">
                  {Array.from(
                    { length: Math.ceil(table.getFilteredRowModel().rows.length / table.getState().pagination.pageSize) },
                    (_, i) => (
                      <Button
                        key={i}
                        variant={table.getState().pagination.pageIndex === i ? 'default' : 'outline-solid'}
                        size="sm"
                        onClick={() => table.setPageIndex(i)}
                        className="w-8 h-8 p-0"
                        aria-label={`Ir a página ${i + 1}`}
                        aria-current={table.getState().pagination.pageIndex === i ? 'page' : undefined}
                      >
                        {i + 1}
                      </Button>
                    )
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Página siguiente"
                >
                  Siguiente
                </Button>

                {/* Selector de tamaño de página */}
                <select
                  value={table.getState().pagination.pageSize}
                  onChange={(e) => {
                    table.setPageSize(Number(e.target.value))
                  }}
                  className="border rounded px-2 py-1 text-sm"
                  aria-label="Seleccionar tamaño de página"
                >
                  {[10, 15, 20, 30, 50].map((pageSize) => (
                    <option key={pageSize} value={pageSize}>
                      {pageSize} por página
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default MaterialTable