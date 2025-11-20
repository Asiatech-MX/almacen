/**
 * Kysely Database Type Helpers
 *
 * Provides common ColumnType aliases for consistent typing across adapters
 * Based on Kysely official documentation patterns
 */

import type { ColumnType } from 'kysely'

// DB column alias types for consistent adapter typing
export type DBString = ColumnType<string, string | undefined, string>
export type DBBoolean = ColumnType<boolean, boolean | undefined, boolean>
export type DBNumber = ColumnType<number, string | number | undefined, string | number>
export type DBDate = ColumnType<Date, string | Date | undefined, string | Date>
export type DBTimestamp = DBDate // PostgreSQL timestamp aliases
export type DBUUID = ColumnType<string, string | undefined, string>

// Helper for creating safe error messages from unknown errors
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

// Helper for safe date conversion from ColumnType
export function safeDateFromDb(dateField: Date | string | undefined | null): Date | null {
  if (!dateField) {
    return null
  }

  // Handle ColumnType<Date, string | Date | undefined, string | Date>
  if (dateField instanceof Date) {
    return dateField
  }

  // Handle string dates from DB
  const date = new Date(dateField as string)
  return isNaN(date.getTime()) ? null : date
}