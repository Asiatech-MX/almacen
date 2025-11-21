/**
 * Kysely Database Type Helpers
 *
 * Provides common type aliases for consistent typing across adapters
 * Based on Kysely official documentation patterns
 * Note: Using primitive types instead of ColumnType for public APIs
 */

// DB column alias types for consistent adapter typing
// Using primitive types as recommended by Kysely documentation
export type DBString = string | null
export type DBBoolean = boolean | null
export type DBNumber = number | null
export type DBDate = Date | null
export type DBTimestamp = Date | null // PostgreSQL timestamp
export type DBUUID = string | null

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