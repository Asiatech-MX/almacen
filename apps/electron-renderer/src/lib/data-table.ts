import type { Column } from "@tanstack/react-table"

export function getCommonPinningStyles<TData>({
  column,
}: {
  column: Column<TData, unknown>
}): React.CSSProperties {
  const isPinned = column.getIsPinned()
  const isLastLeftPinnedColumn = isPinned === "left" && column.getIsLastColumn("left")
  const isFirstRightPinnedColumn = isPinned === "right" && column.getIsFirstColumn("right")

  return {
    left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
    right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
    position: isPinned ? "sticky" : "relative",
    width: column.getSize(),
    zIndex: isPinned ? 1 : 0,
    opacity: isLastLeftPinnedColumn || isFirstRightPinnedColumn ? 0.95 : 1,
    background: isLastLeftPinnedColumn
      ? "linear-gradient(to right, hsl(var(--background)) 50%, transparent)"
      : isFirstRightPinnedColumn
        ? "linear-gradient(to left, hsl(var(--background)) 50%, transparent)"
        : undefined,
    boxShadow: isLastLeftPinnedColumn
      ? "-4px 0 4px -4px hsl(var(--border)) inset"
      : isFirstRightPinnedColumn
        ? "4px 0 4px -4px hsl(var(--border)) inset"
        : undefined,
  } as React.CSSProperties
}