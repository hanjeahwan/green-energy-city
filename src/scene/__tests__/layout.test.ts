import { describe, it, expect } from 'vitest'
import {
  BLOCKS,
  PLACEMENTS,
  effectiveAABB,
  verifyLayout,
  type Placement,
} from '../layout'
import { BLOCKS as BUILDING_CATALOG_BLOCKS } from '../../elements/buildings/catalog'
import { ROAD_HALF_WIDTH } from '../roads'

const base = (overrides: Partial<Placement> = {}): Placement => ({
  id: 'test',
  kind: 'TestKind',
  x: 0,
  z: 0,
  halfW: 1,
  halfD: 0.5,
  ...overrides,
})

describe('effectiveAABB', () => {
  it('returns input halves when rot=0 and no sweep', () => {
    const r = effectiveAABB(base())
    expect(r.halfW).toBeCloseTo(1)
    expect(r.halfD).toBeCloseTo(0.5)
  })

  it('swaps halves at 90° rotation', () => {
    const r = effectiveAABB(base({ rot: Math.PI / 2 }))
    expect(r.halfW).toBeCloseTo(0.5)
    expect(r.halfD).toBeCloseTo(1)
  })

  it('returns same halves at 180°', () => {
    const r = effectiveAABB(base({ rot: Math.PI }))
    expect(r.halfW).toBeCloseTo(1)
    expect(r.halfD).toBeCloseTo(0.5)
  })

  it('inflates both axes at 45°', () => {
    const r = effectiveAABB(base({ rot: Math.PI / 4 }))
    const sqrt2 = Math.sqrt(2)
    expect(r.halfW).toBeCloseTo((1 + 0.5) / sqrt2)
    expect(r.halfD).toBeCloseTo((1 + 0.5) / sqrt2)
  })

  it('adds sweepR to both axes', () => {
    const r = effectiveAABB(base({ sweepR: 0.5 }))
    expect(r.halfW).toBeCloseTo(1.5)
    expect(r.halfD).toBeCloseTo(1.0)
  })
})

describe('PLACEMENTS registry integrity', () => {
  it('has unique ids', () => {
    const ids = PLACEMENTS.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every placement has positive halfW/halfD', () => {
    for (const p of PLACEMENTS) {
      expect(p.halfW, `${p.id} halfW`).toBeGreaterThan(0)
      expect(p.halfD, `${p.id} halfD`).toBeGreaterThan(0)
    }
  })

  it('passes verifyLayout with zero violations', () => {
    const v = verifyLayout()
    if (v.length > 0) {
      // Log details for debugging
      for (const x of v) console.error(`[${x.kind}] ${x.msg}`)
    }
    expect(v).toEqual([])
  })
})

describe('BLOCKS registry integrity', () => {
  it('uses one shared city-block source for layout and building generation', () => {
    expect(BUILDING_CATALOG_BLOCKS).toBe(BLOCKS)
    expect(BLOCKS).toHaveLength(17)
    expect(BLOCKS).toContainEqual({ bounds: [16, -22, 24, -16], district: 'outer-residential' })
  })
})

describe('verifyLayout violations', () => {
  it('flags a placement that sits on an x-avenue', () => {
    // x=8 is a known avenue
    const intruder: Placement = base({ id: 'intruder', x: 8, z: 0 })
    const v = verifyLayout({ extra: [intruder] })
    expect(v.some((x) => x.kind === 'road' && x.ids.includes('intruder'))).toBe(true)
  })

  it('flags a placement that sits on a z-avenue', () => {
    const intruder: Placement = base({ id: 'intruder', x: 0, z: -16 })
    const v = verifyLayout({ extra: [intruder] })
    expect(v.some((x) => x.kind === 'road' && x.ids.includes('intruder'))).toBe(true)
  })

  it('does not flag a placement clearly between avenues and away from PLACEMENTS', () => {
    // (2, 2) is in the plaza interior — off every road, away from PVs / benches /
    // command tower. Use a tiny halfW/halfD so we test the verifier, not a tight
    // budget against the canonical PLACEMENTS.
    const intruder: Placement = base({ id: 'safe', x: 2, z: 2, halfW: 0.1, halfD: 0.1 })
    const v = verifyLayout({ extra: [intruder] })
    expect(v.filter((x) => x.ids.includes('safe'))).toEqual([])
  })

  it('flags two overlapping extras', () => {
    const a: Placement = base({ id: 'a', x: 4, z: 4, halfW: 0.5, halfD: 0.5 })
    const b: Placement = base({ id: 'b', x: 4.5, z: 4, halfW: 0.5, halfD: 0.5 })
    const v = verifyLayout({ extra: [a, b] })
    expect(v.some((x) => x.kind === 'overlap' && x.ids.includes('a') && x.ids.includes('b'))).toBe(true)
  })

  it('skips airborne in road check', () => {
    const intruder: Placement = base({ id: 'air', x: 8, z: 0, airborne: true })
    const v = verifyLayout({ extra: [intruder] })
    expect(v.some((x) => x.ids.includes('air'))).toBe(false)
  })

  it('skips same-group pairwise overlap', () => {
    const a: Placement = base({ id: 'g1', x: 4, z: 4, halfW: 0.5, halfD: 0.5, group: 'g' })
    const b: Placement = base({ id: 'g2', x: 4.3, z: 4, halfW: 0.5, halfD: 0.5, group: 'g' })
    const v = verifyLayout({ extra: [a, b] })
    expect(v.some((x) => x.kind === 'overlap' && x.ids.includes('g1') && x.ids.includes('g2'))).toBe(false)
  })

  it('road check respects ROAD_HALF_WIDTH boundary', () => {
    // Just outside the road buffer should be safe
    const safe: Placement = base({
      id: 'safe-edge',
      x: 8 + ROAD_HALF_WIDTH + 0.4,
      z: 0,
      halfW: 0.05,
      halfD: 0.05,
    })
    const v = verifyLayout({ extra: [safe] })
    expect(v.some((x) => x.ids.includes('safe-edge'))).toBe(false)
  })

  it('rotated placement at 90° is detected on the correct avenue', () => {
    // halfW=2, halfD=0.3, rotated 90° → effective halfW=0.3, halfD=2.
    // Center at (8.4, 0): the avenue at x=8 should NOT be hit (effective halfW=0.3,
    // dx=0.4, dx-halfW=0.1 > 0; road buffer ≈ 0.95). Actually 0.1 < 0.95 so road
    // overlap still applies. Just verify it's checked.
    const rotated: Placement = base({
      id: 'rot',
      x: 8.4,
      z: 0,
      halfW: 2,
      halfD: 0.3,
      rot: Math.PI / 2,
    })
    const v = verifyLayout({ extra: [rotated] })
    // Should report road overlap with x=8
    expect(v.some((x) => x.kind === 'road' && x.ids.includes('rot'))).toBe(true)
  })
})
