import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState,
  type RowData,
} from '@tanstack/react-table'

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    // Add any custom meta here if needed
  }
}

interface UseDataTableOptions<TData> {
  data: TData[]
  columns: ColumnDef<TData>[]
  pageCount?: number
  initialState?: {
    sorting?: SortingState
    pagination?: PaginationState
    columnFilters?: ColumnFiltersState
  }
  getRowId?: (row: TData) => string
}

export function useDataTable<TData extends object>({
  data,
  columns,
  pageCount,
  initialState,
  getRowId,
}: UseDataTableOptions<TData>) {
  const [sorting, setSorting] = useState<SortingState>(
    initialState?.sorting ?? []
  )
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    initialState?.columnFilters ?? []
  )
  const [pagination, setPagination] = useState<PaginationState>(
    initialState?.pagination ?? {
      pageIndex: 0,
      pageSize: 10,
    }
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    manualPagination: !!pageCount,
    pageCount,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
    getRowId,
  })

  return { table }
}