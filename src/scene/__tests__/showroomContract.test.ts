import { describe, expect, it } from 'vitest'
import { PLACEMENTS } from '../layout'
import {
  SHOWROOM_ANCHOR_PLACEMENT_IDS,
  SHOWROOM_ANCHOR_REGISTRY,
  SHOWROOM_EXTENDED_ANCHOR_IDS,
  SHOWROOM_REQUIRED_ANCHOR_IDS,
  SHOWROOM_REQUIRED_PLACEMENT_IDS
} from '../showroomContract'

const allContractAnchorIds = [...SHOWROOM_REQUIRED_ANCHOR_IDS, ...SHOWROOM_EXTENDED_ANCHOR_IDS]
const placementById = new Map(PLACEMENTS.map((placement) => [placement.id, placement]))

describe('showroom anchor contract', () => {
  it('keeps the anchor registry aligned to required and extended anchor ids', () => {
    expect(Object.keys(SHOWROOM_ANCHOR_REGISTRY).sort()).toEqual([...allContractAnchorIds].sort())
    for (const anchorId of allContractAnchorIds) {
      expect(SHOWROOM_ANCHOR_REGISTRY[anchorId]?.id).toBe(anchorId)
    }
  })

  it('derives required placement ids from the anchor-to-placement mapping', () => {
    expect(SHOWROOM_REQUIRED_PLACEMENT_IDS).toEqual(
      SHOWROOM_REQUIRED_ANCHOR_IDS.flatMap((anchorId) => SHOWROOM_ANCHOR_PLACEMENT_IDS[anchorId])
    )
  })

  it('maps every showroom anchor to existing placement ids', () => {
    for (const anchorId of allContractAnchorIds) {
      const placementIds = SHOWROOM_ANCHOR_PLACEMENT_IDS[anchorId]
      expect(placementIds.length, `${anchorId} placement ids`).toBeGreaterThan(0)
      for (const placementId of placementIds) {
        expect(placementById.has(placementId), `${anchorId} -> ${placementId}`).toBe(true)
      }
    }
  })

  it('keeps anchor positions on the primary layout placement', () => {
    for (const anchorId of allContractAnchorIds) {
      const primaryPlacementId = SHOWROOM_ANCHOR_PLACEMENT_IDS[anchorId][0]
      const placement = placementById.get(primaryPlacementId)
      const anchor = SHOWROOM_ANCHOR_REGISTRY[anchorId]
      expect(anchor.position[0], `${anchorId} x`).toBeCloseTo(placement?.x ?? Number.NaN)
      expect(anchor.position[2], `${anchorId} z`).toBeCloseTo(placement?.z ?? Number.NaN)
    }
  })
})
