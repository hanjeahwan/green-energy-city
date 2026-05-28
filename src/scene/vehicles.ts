// =============================================================================
// Vehicle paths — source of truth for any prop that drives along roads.
//
// Pure module (no three.js). Imported by:
//  1. CityScene.tsx ServiceVan to build the CatmullRom curve.
//  2. scripts/verify-layout.mjs to validate every segment lies on a road.
//
// Validation rule: a path segment from A to B must be ON a road centerline,
// meaning either A.x == B.x and that x is in ROAD_AVENUES_X (vertical road),
// OR A.z == B.z and that z is in ROAD_AVENUES_Z (horizontal road).
// Within-tolerance match (ROAD_HALF_WIDTH) is acceptable.
//
// Previously ServiceVan looped at (±8, ±12). z=±12 is NOT a road avenue
// (roads are at z ∈ {-16,-8,8,16}), so 2 of 4 segments cut through the
// N and S city blocks — visible "clipping through buildings". Fixed by
// using the inner road ring (±8, ±8), all 4 segments on real road.
// =============================================================================

import { ROAD_AVENUES_X, ROAD_AVENUES_Z, ROAD_HALF_WIDTH } from './roads'

export interface VehiclePath {
  id: string
  /** Closed loop of [x, z] waypoints — last point connects back to first. */
  waypoints: [number, number][]
  /** Driving height above ground. */
  y: number
}

// World units per second. Matches the old ServiceVan pace:
// inner 64u loop × 0.035 normalized loops/sec = 2.24u/sec.
export const VEHICLE_TRAVEL_SPEED = 2.24

export const VEHICLE_PATHS: VehiclePath[] = [
  {
    id: 'service-van',
    // Inner road ring — all 4 segments along ROAD_AVENUES_X={±8} or ROAD_AVENUES_Z={±8}.
    // SW corner → S avenue east → SE corner → E avenue north → NE corner → N avenue
    // west → NW corner → W avenue south → loop.
    waypoints: [
      [8, -8],
      [8, 8],
      [-8, 8],
      [-8, -8]
    ],
    y: 0.15
  },
  {
    id: 'sedan',
    // Mid road ring — ±16 square, counter-clockwise (reversed order vs van's
    // clockwise loop) so a stationary observer sees opposing traffic flow.
    waypoints: [
      [-16, -16],
      [-16, 16],
      [16, 16],
      [16, -16]
    ],
    y: 0.15
  },
  {
    id: 'truck',
    // Outermost ring — x=±24 / z=±22. Truck is heavy, slow, and lives on the
    // perimeter so it never interacts with the inner two rings' traffic.
    waypoints: [
      [24, -22],
      [24, 22],
      [-24, 22],
      [-24, -22]
    ],
    y: 0.18
  }
]

// =============================================================================
// Path validation (used by verify-layout.mjs)
// =============================================================================

export interface VehiclePathViolation {
  pathId: string
  segmentIndex: number
  from: [number, number]
  to: [number, number]
  msg: string
}

/**
 * For each loop segment (i → (i+1) mod N), assert it runs along a road
 * centerline: either constant x in ROAD_AVENUES_X, or constant z in ROAD_AVENUES_Z.
 * Tolerance: half a road-width.
 */
export function validateVehiclePath(path: VehiclePath): VehiclePathViolation[] {
  const violations: VehiclePathViolation[] = []
  const tol = ROAD_HALF_WIDTH
  for (let i = 0; i < path.waypoints.length; i++) {
    const a = path.waypoints[i]
    const b = path.waypoints[(i + 1) % path.waypoints.length]
    const sameX = Math.abs(a[0] - b[0]) < 1e-6
    const sameZ = Math.abs(a[1] - b[1]) < 1e-6
    if (sameX) {
      // vertical segment — x must be a known avenue
      const onAvenue = ROAD_AVENUES_X.some((ax) => Math.abs(a[0] - ax) < tol)
      if (!onAvenue) {
        violations.push({
          pathId: path.id,
          segmentIndex: i,
          from: a,
          to: b,
          msg: `vertical segment x=${a[0]} not on any ROAD_AVENUES_X ${JSON.stringify(ROAD_AVENUES_X)}`
        })
      }
    } else if (sameZ) {
      // horizontal segment — z must be a known avenue
      const onAvenue = ROAD_AVENUES_Z.some((az) => Math.abs(a[1] - az) < tol)
      if (!onAvenue) {
        violations.push({
          pathId: path.id,
          segmentIndex: i,
          from: a,
          to: b,
          msg: `horizontal segment z=${a[1]} not on any ROAD_AVENUES_Z ${JSON.stringify(ROAD_AVENUES_Z)}`
        })
      }
    } else {
      violations.push({
        pathId: path.id,
        segmentIndex: i,
        from: a,
        to: b,
        msg: 'diagonal segment — vehicle paths must be axis-aligned along roads'
      })
    }
  }
  return violations
}

export function validateAllVehiclePaths(): VehiclePathViolation[] {
  return VEHICLE_PATHS.flatMap(validateVehiclePath)
}
