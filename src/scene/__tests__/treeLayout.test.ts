import { describe, it, expect } from 'vitest'
import {
  computeTreePlacements,
  verifyTrees,
  verifyVFPPlacements,
  districtAt,
  VFP_PLACEMENTS,
} from '../treeLayout'

describe('districtAt', () => {
  it('returns plaza at the origin', () => {
    expect(districtAt(0, 0)).toBe('plaza')
  })

  it('returns plaza inside the 8×8 central region', () => {
    expect(districtAt(7, -7)).toBe('plaza')
    expect(districtAt(-5, 5)).toBe('plaza')
  })

  it('returns cbd for NE block', () => {
    expect(districtAt(12, 12)).toBe('cbd')
  })

  it('returns residential for non-cbd outer blocks', () => {
    expect(districtAt(-12, 12)).toBe('residential') // NW
    expect(districtAt(12, -12)).toBe('residential') // SE
    expect(districtAt(-12, -12)).toBe('residential') // SW
  })

  it('returns edge outside all blocks', () => {
    // Phase 2 added outer-ring BLOCKS reaching x∈[-24, 22] and z∈[-16, 22],
    // so (20, 20) is now a 'residential' block, not 'edge'. Use a clearly
    // beyond-all-blocks point for the negative case.
    expect(districtAt(30, 30)).toBe('edge')
  })
})

describe('VFP_PLACEMENTS', () => {
  it('has exactly 3 entries', () => {
    expect(VFP_PLACEMENTS).toHaveLength(3)
  })

  it('all three are in the plaza zone', () => {
    for (const v of VFP_PLACEMENTS) {
      expect(districtAt(v.x, v.z)).toBe('plaza')
    }
  })

  it('passes verifyVFPPlacements with zero violations', () => {
    const v = verifyVFPPlacements()
    if (v.length > 0) {
      for (const x of v) console.error(`[${x.kind}] ${x.msg}`)
    }
    expect(v).toEqual([])
  })
})

describe('computeTreePlacements', () => {
  it('returns a non-empty list', () => {
    const trees = computeTreePlacements()
    expect(trees.length).toBeGreaterThan(0)
  })

  it('is deterministic — two calls yield the same trees', () => {
    const a = computeTreePlacements()
    const b = computeTreePlacements()
    expect(a.length).toBe(b.length)
    for (let i = 0; i < a.length; i++) {
      expect(a[i].x).toBeCloseTo(b[i].x)
      expect(a[i].z).toBeCloseTo(b[i].z)
      expect(a[i].variant).toBe(b[i].variant)
    }
  })

  it('produces zero overlaps under verifyTrees', () => {
    const trees = computeTreePlacements()
    const violations = verifyTrees(trees)
    if (violations.length > 0) {
      for (const v of violations) console.error(`[${v.kind}] ${v.msg}`)
    }
    expect(violations).toEqual([])
  })

  it('keeps every tree within the playable grid bounds', () => {
    // Phase 2 expanded BLOCKS to ±22 (E/N) and ±24 (W), so the trees can
    // legitimately sit out to ±24. Use 28 as a generous upper bound that
    // still catches genuinely escaped placements.
    const trees = computeTreePlacements()
    for (const t of trees) {
      expect(Math.abs(t.x)).toBeLessThan(28)
      expect(Math.abs(t.z)).toBeLessThan(28)
    }
  })

  it('every tree has scale > 0 and a valid variant', () => {
    const trees = computeTreePlacements()
    const valid = new Set(['classic', 'modern', 'palm', 'broadleaf'])
    for (const t of trees) {
      expect(t.scale).toBeGreaterThan(0)
      expect(valid.has(t.variant)).toBe(true)
    }
  })
})
