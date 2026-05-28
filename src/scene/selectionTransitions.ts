import type { SelectionTarget } from './selection'

export function nextSelectionForTargetClick(
  current: SelectionTarget | null,
  clicked: SelectionTarget
): SelectionTarget | null {
  if (current?.kind === clicked.kind && current.id === clicked.id) return null
  return clicked
}
