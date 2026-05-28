// =============================================================================
// Road geometry — single source of truth.
// Pure module (no three.js imports). Safe for both browser and Node.
// =============================================================================

/** N-S avenue centerlines (constant x, variable z).
 *  Phase 2 added -24 (W deep) and 22 (E shallow). Phase 3 pushed E out to 24
 *  to widen the E-side outer-ring blocks from 6u to 8u so the hospital strip
 *  gains a third lot column and stops reading as a moat around the landmark. */
export const ROAD_AVENUES_X = [-24, -16, -8, 8, 16, 24] as const

/** E-W avenue centerlines (constant z, variable x).
 *  Phase 2 added 22 (N only). Phase 3 mirrored it on the south side with -22
 *  so the south outer-ring blocks fill symmetrically against the north. */
export const ROAD_AVENUES_Z = [-22, -16, -8, 8, 16, 22] as const

/** Half the road width — asphalt occupies ±this around each centerline. */
export const ROAD_HALF_WIDTH = 0.75

/** Roads only extend to |x| or |z| <= this. Past this is open ground/backdrop.
 *  Phase 2: 20 → 28 to cover the new ±24 W and 22 E/N avenues. */
export const ROAD_REACH = 28

/** Safety margin added to every road clearance check (prevents zero-gap kiss). */
export const ROAD_BUFFER = 0.2

// -----------------------------------------------------------------------------
// Visual-only stub roads.
//
// Short spurs that continue a primary avenue OUTWARD past the ±24 / ±22
// perimeter ring into the suburban falloff belt, so the city edge reads as
// "the grid keeps going, it just fades out" instead of a hard moat.
//
// These are PURELY VISUAL — deliberately NOT added to ROAD_AVENUES, so they
// carry no avenue collision/lamp identity. The single thing that must know
// about them is "don't drop an outskirts building on the asphalt", which is
// `onStub()` in exclusion.ts. STUB_RECTS is the single source of truth shared
// by three consumers:
//   - cityPlan.buildPrimaryInnerRoads()  → emits the visible asphalt segment
//   - cityGenerator.buildOutskirtsBelt() → onStub() gate skips lots on a stub
//   - scripts/verify-layout.ts           → onStub() check rejects clips
// Keep the rect axis-aligned; the longer half-extent is the running length,
// the shorter is the road half-width.
// -----------------------------------------------------------------------------

export interface StubRect {
  id: string
  /** Center (world x, z). */
  cx: number
  cz: number
  /** Half-extent along x (m). */
  halfX: number
  /** Half-extent along z (m). */
  halfZ: number
}

export const STUB_RECTS: readonly StubRect[] = [
  { id: 'stub-n', cx: 8, cz: 26, halfX: 0.75, halfZ: 4 }, // x=8 avenue → north, z 22→30
  { id: 'stub-e', cx: 28, cz: 8, halfX: 4, halfZ: 0.75 }, // z=8 avenue → east,  x 24→32
  { id: 'stub-w', cx: -28, cz: -8, halfX: 4, halfZ: 0.75 }, // z=-8 avenue → west, x -32→-24
  { id: 'stub-s', cx: -8, cz: -24, halfX: 0.75, halfZ: 1.75 }, // x=-8 avenue -> south, z -25.75..-22.25
] as const
