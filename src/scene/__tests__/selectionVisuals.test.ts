import { describe, expect, it } from 'vitest'
import { shouldShowFacilityHoverHalo } from '../selectionVisuals'

describe('selection visual state', () => {
  it('shows facility hover halo when no facility is selected', () => {
    expect(shouldShowFacilityHoverHalo({
      anchorId: 'PS-02',
      hoveredId: 'PS-02',
      hoveredKind: 'facility',
      selectedFacilityId: null,
    })).toBe(true)
  })

  it('keeps another facility hover halo visible while a focused facility is selected', () => {
    expect(shouldShowFacilityHoverHalo({
      anchorId: 'PS-02',
      hoveredId: 'PS-02',
      hoveredKind: 'facility',
      selectedFacilityId: 'command-tower',
    })).toBe(true)
  })

  it('does not duplicate hover halo on the selected facility itself', () => {
    expect(shouldShowFacilityHoverHalo({
      anchorId: 'command-tower',
      hoveredId: 'command-tower',
      hoveredKind: 'facility',
      selectedFacilityId: 'command-tower',
    })).toBe(false)
  })

  it('ignores operator hover state for facility halos', () => {
    expect(shouldShowFacilityHoverHalo({
      anchorId: 'PS-02',
      hoveredId: 'ops-repair-battery-a',
      hoveredKind: 'operator',
      selectedFacilityId: 'command-tower',
    })).toBe(false)
  })
})
