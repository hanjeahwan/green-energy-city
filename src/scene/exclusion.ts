// =============================================================================
// Exclusion zones - road centerlines as pure data + helpers.
//
// Extracted from CityScene.tsx (C2) so the cityGenerator and the verify-layout
// CLI can share the same road checks without pulling in any React code.
// Previously these lived inside CityScene.tsx as exported helpers, which made
// the verifier unable to import them (React/JSX in the same module).
//
// Anything that needs to know "is (x,z) on a road?" should import from here.
// =============================================================================

import { ROAD_AVENUES_X, ROAD_AVENUES_Z, ROAD_HALF_WIDTH, ROAD_REACH, STUB_RECTS } from './roads'

// -----------------------------------------------------------------------------
// Road overlap test
// -----------------------------------------------------------------------------

/** Returns true if a building/prop AABB centered at (x,z) with the given
 *  half-footprint overlaps any road avenue (or its 0.2m visual buffer).
 *  ROAD_REACH limits how far the avenues extend; objects beyond that range
 *  pass through cleanly. */
export function onRoad(x: number, z: number, halfFootprint: number = 0): boolean {
  const margin = ROAD_HALF_WIDTH + 0.2 + halfFootprint
  for (const ax of ROAD_AVENUES_X) {
    if (Math.abs(x - ax) < margin && Math.abs(z) <= ROAD_REACH + halfFootprint) return true
  }
  for (const az of ROAD_AVENUES_Z) {
    if (Math.abs(z - az) < margin && Math.abs(x) <= ROAD_REACH + halfFootprint) return true
  }
  return false
}

// -----------------------------------------------------------------------------
// Visual-only stub-road overlap test.
//
// STUB_RECTS are short asphalt spurs past the perimeter ring (see roads.ts).
// They are NOT in ROAD_AVENUES, so onRoad() never sees them — outskirts
// generation and the verifier both call onStub() to keep buildings off the
// stub asphalt. Axis-aligned AABB test against each stub rect + a small buffer.
// -----------------------------------------------------------------------------

/** Returns true if a building/prop AABB centered at (x,z) with the given
 *  half-footprint overlaps any visual stub road (plus a 0.2m buffer). */
export function onStub(x: number, z: number, halfFootprint: number = 0): boolean {
  const buffer = 0.2 + halfFootprint
  for (const s of STUB_RECTS) {
    if (Math.abs(x - s.cx) < s.halfX + buffer && Math.abs(z - s.cz) < s.halfZ + buffer) return true
  }
  return false
}
