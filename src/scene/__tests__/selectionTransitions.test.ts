import { describe, expect, it } from 'vitest'
import { nextSelectionForTargetClick } from '../selectionTransitions'

describe('selection target click transitions', () => {
  it('closes the card when clicking the same facility again', () => {
    expect(nextSelectionForTargetClick(
      { id: 'command-tower', kind: 'facility' },
      { id: 'command-tower', kind: 'facility' }
    )).toBeNull()
  })

  it('switches directly from one facility to another facility', () => {
    expect(nextSelectionForTargetClick(
      { id: 'command-tower', kind: 'facility' },
      { id: 'PS-02', kind: 'facility' }
    )).toEqual({ id: 'PS-02', kind: 'facility' })
  })

  it('switches directly between facility and operator targets', () => {
    expect(nextSelectionForTargetClick(
      { id: 'PS-02', kind: 'facility' },
      { id: 'ops-repair-battery-a', kind: 'operator' }
    )).toEqual({ id: 'ops-repair-battery-a', kind: 'operator' })
  })

  it('switches directly between operator and facility targets', () => {
    expect(nextSelectionForTargetClick(
      { id: 'ops-repair-battery-a', kind: 'operator' },
      { id: 'PS-02', kind: 'facility' }
    )).toEqual({ id: 'PS-02', kind: 'facility' })
  })
})
