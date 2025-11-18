import React, { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table'
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAprobacionesList, useAprobarSolicitud, useRechazarSolicitud } from '@/services/aprobacionesService'
import type { Aprobacion, TipoAprobacion, EstadoAprobacion, NivelUrgencia } from '@/types/aprobaciones'
import {
  MoreHorizontal,
  ArrowUpDown,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Calendar,
  DollarSign,
  User,
  Eye
} from 'lucide-react'

interface AprobacionesTableProps {
  filtros?: {
    tipo?: TipoAprobacion
    estado?: EstadoAprobacion
    solo_mis_pendientes?: boolean
  }
  onVerDetalle?: (aprobacion: Aprobacion) => void
}

const AprobacionesTable: React.FC<AprobacionesTableProps> = ({
  filtros,
  onVerDetalle
}) => {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'fecha_solicitud', desc: true }
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectedAprobacion, setSelectedAprobacion] = useState<Aprobacion | null>(null)
  const [comentarios, setComentarios] = useState('')

  const { data: aprobaciones = [], isLoading, error } = useAprobacionesList(filtros)
  const aprobarMutation = useAprobarSolicitud()
  const rechazarMutation = useRechazarSolicitud()

  const handleAprobar = () => {
    if (!selectedAprobacion) return

    aprobarMutation.mutate({
      id: selectedAprobacion.id,
      comentarios: comentarios.trim() || undefined
    }, {
      onSuccess: () => {
        setSelectedAprobacion(null)
        setComentarios('')
      }
    })
  }

  const handleRechazar = () => {
    if (!selectedAprobacion || !comentarios.trim()) return

    rechazarMutation.mutate({
      id: selectedAprobacion.id,
      comentarios: comentarios.trim()
    }, {
      onSuccess: () => {
        setSelectedAprobacion(null)
        setComentarios('')
      }
    })
  }

  const getEstadoBadge = (estado: EstadoAprobacion) => {
    const variants = {
      pendiente: 'secondary',
      aprobado: 'default',
      rechazado: 'destructive',
      cancelado: 'outline-solid'
    } as const

    const icons = {
      pendiente: <Clock className="w-3 h-3" />,
      aprobado: <CheckCircle className="w-3 h-3" />,
      rechazado: <XCircle className="w-3 h-3" />,
      cancelado: <AlertTriangle className="w-3 h-3" />
    }

    return (
      <Badge variant={variants[estado]} className="flex items-center gap-1">
        {icons[estado]}
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </Badge>
    )
  }

  const getUrgenciaBadge = (urgencia: NivelUrgencia) => {
    const variants = {
      bajo: 'outline-solid',
      medio: 'secondary',
      alto: 'default',
      critico: 'destructive'
    } as const

    return (
      <Badge variant={variants[urgencia]}>
        {urgencia.charAt(0).toUpperCase() + urgencia.slice(1)}
      </Badge>
    )
  }

  const getTipoLabel = (tipo: TipoAprobacion) => {
    const labels = {
      compra: 'Compra',
      movimiento: 'Movimiento',
      ajuste_inventario: 'Ajuste Inventario',
      eliminacion: 'Eliminación'
    }
    return labels[tipo]
  }

  const columns: ColumnDef<Aprobacion>[] = [
    {
      accessorKey: 'titulo',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2"
        >
          Título
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="max-w-xs">
          <div className="font-medium truncate" title={row.getValue('titulo')}>
            {row.getValue('titulo')}
          </div>
          <div className="text-sm text-muted-foreground truncate">
            {row.original.descripcion}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      cell: ({ row }) => getTipoLabel(row.getValue('tipo')),
    },
    {
      accessorKey: 'solicitante_nombre',
      header: 'Solicitante',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <User className="size-4 text-muted-foreground" />
          <span>{row.getValue('solicitante_nombre')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'monto',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2"
        >
          Monto
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const monto = row.getValue('monto') as number
        return monto ? (
          <div className="flex items-center gap-2">
            <DollarSign className="size-4 text-muted-foreground" />
            <span className="font-medium">
              ${monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        )
      },
    },
    {
      accessorKey: 'nivel_urgencia',
      header: 'Urgencia',
      cell: ({ row }) => getUrgenciaBadge(row.getValue('nivel_urgencia')),
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: ({ row }) => getEstadoBadge(row.getValue('estado')),
    },
    {
      accessorKey: 'fecha_solicitud',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2"
        >
          Fecha
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const fecha = new Date(row.getValue('fecha_solicitud'))
        return (
          <div className="flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <span>
              {format(fecha, 'dd/MM/yyyy', { locale: es })}
            </span>
          </div>
        )
      },
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: ({ row }) => {
        const aprobacion = row.original
        const isLoading = aprobarMutation.isPending || rechazarMutation.isPending

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => onVerDetalle?.(aprobacion)}
                className="flex items-center gap-2"
              >
                <Eye className="size-4" />
                Ver detalles
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {aprobacion.estado === 'pendiente' && (
                <>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="flex items-center gap-2 text-green-600"
                        disabled={isLoading}
                      >
                        <CheckCircle className="size-4" />
                        Aprobar
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Aprobar solicitud?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Está a punto de aprobar la solicitud: <strong>{aprobacion.titulo}</strong>
                          {aprobacion.monto && (
                            <p>Monto: ${aprobacion.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="py-4">
                        <Label htmlFor="comentarios-aprobar">Comentarios (opcional)</Label>
                        <Textarea
                          id="comentarios-aprobar"
                          placeholder="Agregar comentarios sobre la aprobación..."
                          value={comentarios}
                          onChange={(e) => setComentarios(e.target.value)}
                          className="mt-2"
                        />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleAprobar}
                          disabled={isLoading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {aprobarMutation.isPending ? 'Aprobando...' : 'Aprobar'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="flex items-center gap-2 text-red-600"
                        disabled={isLoading}
                      >
                        <XCircle className="size-4" />
                        Rechazar
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Rechazar solicitud?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Está a punto de rechazar la solicitud: <strong>{aprobacion.titulo}</strong>
                          {aprobacion.monto && (
                            <p>Monto: ${aprobacion.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="py-4">
                        <Label htmlFor="comentarios-rechazar">
                          Comentarios <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                          id="comentarios-rechazar"
                          placeholder="Debe especificar el motivo del rechazo..."
                          value={comentarios}
                          onChange={(e) => setComentarios(e.target.value)}
                          className="mt-2"
                          required
                        />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleRechazar}
                          disabled={isLoading || !comentarios.trim()}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {rechazarMutation.isPending ? 'Rechazando...' : 'Rechazar'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: aprobaciones,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando aprobaciones...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error al cargar datos</h3>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error ? error.message : 'Error desconocido'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Lista de Aprobaciones ({aprobaciones.length})</span>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar aprobaciones..."
                value={globalFilter ?? ''}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="pl-8 w-64"
                aria-label="Buscar aprobaciones"
              />
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : header.renderHeader()}
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
                    data-state={row.getIsSelected() && 'selected'}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {cell.renderCell()}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No hay resultados para mostrar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Página {table.getState().pagination.pageIndex + 1} de{' '}
              {table.getPageCount()}</span>
            <span>|</span>
            <span>{table.getFilteredRowModel().rows.length} resultados</span>
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
              aria-label="Página siguiente"
            >
              Siguiente
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default AprobacionesTable