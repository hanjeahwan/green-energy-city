import { describe, expect, it } from 'vitest'
import { OPERATOR_PLACEMENTS } from '../operatorPlacements'
import { getOperatorProfile, hasOperatorProfile } from '../operatorMetadata'

describe('operator metadata registry', () => {
  it('covers every rendered operator placement with an explicit profile', () => {
    for (const placement of OPERATOR_PLACEMENTS) {
      expect(hasOperatorProfile(placement.id), placement.id).toBe(true)
      const profile = getOperatorProfile(placement.id)
      expect(profile.id).toBe(placement.id)
      expect(profile.role).toBe(placement.role)
      expect(profile.name.trim()).not.toBe('')
      expect(profile.title.trim()).not.toBe('')
      expect(profile.defaultStatus.trim()).not.toBe('')
      expect(profile.office).toMatch(/^Office · /)
      expect(profile.actions.message).toBeDefined()
      expect(profile.actions.locate).toBeDefined()
      expect(profile.actions.reassign).toBeDefined()
      expect(profile.actions.wearable).toBeDefined()
    }
  })

  it('marks unavailable phone channels without removing the card action', () => {
    const profile = getOperatorProfile('ops-repair-battery-b')
    expect(profile.phone).toBe('unavailable')
    expect(profile.actions.message.enabled).toBe(false)
    expect(profile.actions.locate.enabled).toBe(true)
    expect(profile.actions.wearable.enabled).toBe(true)
  })
})
