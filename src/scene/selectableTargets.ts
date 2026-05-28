import { getAnchorPosition } from './facilityMetadata'
import { OPERATOR_PLACEMENTS } from './operatorPlacements'
import type { SelectionTargetKind } from './selection'

export interface SelectableTargetFrame {
  id: string
  kind: SelectionTargetKind
  position: [number, number, number]
  lookYOffset: number
  focusDistance: number
  minDistance: number
  maxDistance: number
}

const SELECTABLE_FOCUS_DISTANCE = 15.6
const SELECTABLE_MIN_DISTANCE = 10
const SELECTABLE_MAX_DISTANCE = 18
const SELECTABLE_LOOK_Y_OFFSET = 0.5

export function getSelectableTargetFrame(kind: SelectionTargetKind, id: string): SelectableTargetFrame | null {
  if (kind === 'facility') {
    const position = getAnchorPosition(id)
    if (!position) return null
    return {
      id,
      kind,
      position,
      lookYOffset: SELECTABLE_LOOK_Y_OFFSET,
      focusDistance: SELECTABLE_FOCUS_DISTANCE,
      minDistance: SELECTABLE_MIN_DISTANCE,
      maxDistance: SELECTABLE_MAX_DISTANCE
    }
  }

  const operator = OPERATOR_PLACEMENTS.find((placement) => placement.id === id)
  if (!operator) return null
  return {
    id,
    kind,
    position: operator.position,
    lookYOffset: SELECTABLE_LOOK_Y_OFFSET,
    focusDistance: SELECTABLE_FOCUS_DISTANCE,
    minDistance: SELECTABLE_MIN_DISTANCE,
    maxDistance: SELECTABLE_MAX_DISTANCE
  }
}
