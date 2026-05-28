import { describe, it, expect } from 'vitest'
import { computeLampPlacements } from '../lampLayout'
import {
  ROAD_AVENUES_X,
  ROAD_AVENUES_Z,
  ROAD_HALF_WIDTH,
  ROAD_REACH,
} from '../roads'

describe('computeLampPlacements', () => {
  const lamps = computeLampPlacements()

  it('returns a non-empty list', () => {
    expect(lamps.length).toBeGreaterThan(0)
  })

  it('places exactly one corner lamp per intersection, facing city centre', () => {
    // Phase 3: 4-corner-per-int rule replaced with 1-per-int on the diagonal
    // pointing back toward (0, 0). Saves ~64 lamps and removes the "spike
    // cluster" look at every crossing.
    let cornerCount = 0
    for (const cx of ROAD_AVENUES_X) {
      for (const cz of ROAD_AVENUES_Z) {
        for (const lamp of lamps) {
          const dx = Math.abs(lamp.x - cx)
          const dz = Math.abs(lamp.z - cz)
          if (dx > 0.5 && dx < 1.5 && dz > 0.5 && dz < 1.5) cornerCount++
        }
      }
    }
    expect(cornerCount).toBe(ROAD_AVENUES_X.length * ROAD_AVENUES_Z.length)
  })

  it('places every lamp inside ROAD_REACH bounds', () => {
    for (const lamp of lamps) {
      expect(Math.abs(lamp.x)).toBeLessThanOrEqual(ROAD_REACH + 2)
      expect(Math.abs(lamp.z)).toBeLessThanOrEqual(ROAD_REACH + 2)
    }
  })

  it('keeps lamps off the road centerlines', () => {
    const margin = ROAD_HALF_WIDTH + 0.2 // road body + visual buffer
    for (const lamp of lamps) {
      const offX = ROAD_AVENUES_X.every((ax) => Math.abs(lamp.x - ax) > margin)
      const offZ = ROAD_AVENUES_Z.every((az) => Math.abs(lamp.z - az) > margin)
      // Lamp must be off at least one axis (on the curb of one road)
      expect(offX || offZ).toBe(true)
    }
  })

  it('is deterministic — two calls return identical placements', () => {
    const a = computeLampPlacements()
    const b = computeLampPlacements()
    expect(a).toEqual(b)
  })

  it('produces no duplicate (x, z) coordinates', () => {
    const keys = lamps.map((l) => `${l.x.toFixed(3)}|${l.z.toFixed(3)}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('every corner lamp has a rotation in [-π, π]', () => {
    for (const lamp of lamps) {
      expect(lamp.rot).toBeGreaterThanOrEqual(-Math.PI - 1e-6)
      expect(lamp.rot).toBeLessThanOrEqual(Math.PI + 1e-6)
    }
  })

  it('does not place edge-segment lamps near outer ROAD_REACH endpoints', () => {
    // Edge segments (between outermost avenue and ±ROAD_REACH) are explicitly
    // skipped to avoid clustering at the city-edge intersections.
    // A mid-block lamp would otherwise land in the 4u gap between x=16 and
    // x=ROAD_REACH (=20). Verify no mid-block lamps exist in that strip.
    const outerX = ROAD_AVENUES_X[ROAD_AVENUES_X.length - 1] // 16
    let edgeStrip = 0
    for (const lamp of lamps) {
      if (lamp.x > outerX + 1.5 && lamp.x < ROAD_REACH) {
        // Only corner lamps near outerX are allowed; check if z aligns to an avenue
        const onAvenue = ROAD_AVENUES_Z.some((az) => Math.abs(lamp.z - az) < 1.5)
        if (!onAvenue) edgeStrip++
      }
    }
    expect(edgeStrip).toBe(0)
  })
})
