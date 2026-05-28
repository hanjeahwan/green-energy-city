import type { SelectionTargetKind } from './selection'

interface FacilityHoverHaloInput {
  anchorId: string
  hoveredId: string | null
  hoveredKind: SelectionTargetKind | null
  selectedFacilityId: string | null
}

export function shouldShowFacilityHoverHalo({
  anchorId,
  hoveredId,
  hoveredKind,
  selectedFacilityId,
}: FacilityHoverHaloInput): boolean {
  return hoveredKind === 'facility' && hoveredId === anchorId && selectedFacilityId !== anchorId
}
