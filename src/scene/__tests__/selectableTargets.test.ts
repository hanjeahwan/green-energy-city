import { describe, expect, it } from 'vitest'
import { OPERATOR_PLACEMENTS } from '../operatorPlacements'
import { getSelectableTargetFrame } from '../selectableTargets'

describe('selectable target frames', () => {
  it('returns facility focus frames for existing showroom anchors', () => {
    const frame = getSelectableTargetFrame('facility', 'PS-02')
    expect(frame).toMatchObject({
      id: 'PS-02',
      kind: 'facility',
      lookYOffset: 0.5,
      focusDistance: 15.6,
      minDistance: 10,
      maxDistance: 18
    })
  })

  it('uses facility-scale focus frames for rendered people', () => {
    const operator = OPERATOR_PLACEMENTS.find((placement) => placement.id === 'ops-repair-battery-a')
    const frame = getSelectableTargetFrame('operator', 'ops-repair-battery-a')
    expect(frame).toMatchObject({
      id: 'ops-repair-battery-a',
      kind: 'operator',
      lookYOffset: 0.5,
      focusDistance: 15.6,
      minDistance: 10,
      maxDistance: 18
    })
    expect(frame?.position).toEqual(operator?.position)
  })

  it('rejects unknown targets instead of falling through to facility focus', () => {
    expect(getSelectableTargetFrame('facility', 'not-a-facility')).toBeNull()
    expect(getSelectableTargetFrame('operator', 'not-an-operator')).toBeNull()
  })
})
