// =============================================================================
// Lamp placement algorithm — pure module, no three.js, no JSX.
//
// Replaces the old "march every 4.2u along every road" loop that piled 6–8
// lamps into every 4-way intersection. New model is city-arterial style:
//
//   • 4 corner lamps at every intersection (16 ints × 4 = 64), each set back
//     CORNER_SETBACK along both axes so they sit on the curb corner.
//   • Mid-block lamps along the run between consecutive intersections, with a
//     SKIP_RADIUS exclusion zone around each crossing (corner lamps cover it).
//   • Mid-block spacing is symmetric — N = round(span / MID_STEP) lamps with
//     half-step padding at both ends so the strip looks evenly walked.
//   • Edge segments (between outermost avenue and ROAD_REACH) get only the
//     EDGE_BUFFER trim — corner lamps already anchor the intersection side.
//   • Small deterministic JITTER (~25cm) breaks the CAD-grid feel.
//
// Output: { x, z, rot } per lamp. The renderer applies rot as group Y-rotation
// so the lamp arm (default +x direction) aims toward the road centerline /
// intersection center.
// =============================================================================

import { rng } from '../components/sceneMaterials'
import { ROAD_AVENUES_X, ROAD_AVENUES_Z, ROAD_HALF_WIDTH, ROAD_REACH } from './roads'

export interface LampPlacement {
  x: number
  z: number
  /** Y-rotation in radians. Lamp arm defaults to +x; this rotation aims it. */
  rot: number
}

// --- tuning constants ---
/** Distance from road centerline to curb (where the lamp pole sits). */
const CURB_OFFSET = ROAD_HALF_WIDTH + 0.36
/** Two-axis setback for corner lamps from intersection center. Same as CURB_OFFSET
 *  so the corner lamp sits exactly on the curb intersection diagonally. */
const CORNER_SETBACK = ROAD_HALF_WIDTH + 0.36
/** Mid-block lamps are skipped within this radius of an intersection on the
 *  road axis. 2.5u is tight enough that 4-unit edge segments still host 1 lamp. */
const SKIP_RADIUS = 2.5
/** Target spacing between consecutive mid-block lamps along a road. */
const MID_STEP = 5.6
/** Deterministic ±jitter applied along the road axis (in road units). */
const JITTER = 0.25
/** Skip segments whose trimmed span is shorter than this (avoids degenerate placement). */
const MIN_SPAN = 0.5

const AVENUE_X_SET = new Set<number>(ROAD_AVENUES_X)
const AVENUE_Z_SET = new Set<number>(ROAD_AVENUES_Z)


/** Rotation that aims a corner-lamp arm toward the intersection center.
 *  Lamp is at (cx + sx*SETBACK, cz + sz*SETBACK); we want the arm pointing
 *  in the direction (-sx, -sz) (i.e. back toward the intersection). The
 *  default arm direction in mesh-local space is +x. */
function cornerArmRotation(sx: number, sz: number): number {
  return Math.atan2(-sz, -sx)
}

/** Place mid-block lamps along a road segment between two t-axis endpoints.
 *  axis='x' = N-S avenue, fixedCoord is x, t-axis is z.
 *  axis='z' = E-W avenue, fixedCoord is z, t-axis is x.
 *  An endpoint is "intersection" if it appears in the cross-axis avenue set
 *  (skip-radius trim applies); otherwise it's a road edge (edge-buffer trim). */
function placeMidBlock(
  axis: 'x' | 'z',
  fixedCoord: number,
  t0: number,
  t1: number,
  out: LampPlacement[],
): void {
  const crossSet = axis === 'x' ? AVENUE_Z_SET : AVENUE_X_SET
  const t0IsIntersection = crossSet.has(t0)
  const t1IsIntersection = crossSet.has(t1)
  // Edge segments (one endpoint is the road-end at ±ROAD_REACH, not an intersection)
  // are only 4u long. Their mid-block lamp would end up ~1.84u from the
  // outermost intersection's corner lamp, producing a visible cluster at the
  // city-edge crossings. Corner lamps already anchor that area — skip.
  if (!t0IsIntersection || !t1IsIntersection) return
  const a = t0 + SKIP_RADIUS
  const b = t1 - SKIP_RADIUS
  const span = b - a
  if (span < MIN_SPAN) return

  // Natural rounding — small spans (≤ MID_STEP/2 trimmed) get 0 mid-lamps.
  // The old `Math.max(1, …)` clamp forced a lamp into every segment, which
  // packed the new 6u outer-ring blocks (z=±16↔±22, x=±16↔±24) at ~1.9u
  // spacing while the 16u centre block still ran at ~5.5u. Without the clamp
  // the outer corner lamps already cover the 6u gap on their own.
  const N = Math.round(span / MID_STEP)
  if (N <= 0) return
  const step = span / N

  for (let k = 0; k < N; k++) {
    const tCenter = a + step * (k + 0.5)
    const seed = fixedCoord * 31.7 + k * 7.13 + (axis === 'x' ? 0 : 1000)
    const jit = (rng(seed) - 0.5) * 2 * JITTER
    const t = tCenter + jit
    for (const side of [-1, 1] as const) {
      if (axis === 'x') {
        // N-S avenue: lamp on east (side=+1, arm points -x = π) or west (-1, arm points +x = 0)
        out.push({
          x: fixedCoord + side * CURB_OFFSET,
          z: t,
          rot: side > 0 ? Math.PI : 0,
        })
      } else {
        // E-W avenue: lamp on north (side=+1, arm points -z = +π/2) or south (-1, arm points +z = -π/2)
        out.push({
          x: t,
          z: fixedCoord + side * CURB_OFFSET,
          rot: side > 0 ? Math.PI / 2 : -Math.PI / 2,
        })
      }
    }
  }
}

export function computeLampPlacements(): LampPlacement[] {
  const out: LampPlacement[] = []

  // --- Step 1: one corner lamp per intersection, facing city centre ---
  // The previous "4 corners per intersection" rule packed 4 lamps into a
  // ~2.2u square at every crossing, reading as a spike cluster rather than
  // street furniture. Now each int gets one lamp on the diagonal that points
  // back toward (0, 0). For ints on the axis (cx=0 or cz=0 — defensive; the
  // current 6×6 grid has none) we default to +1.
  for (const cx of ROAD_AVENUES_X) {
    for (const cz of ROAD_AVENUES_Z) {
      const sx = -Math.sign(cx) as -1 | 1
      const sz = -Math.sign(cz) as -1 | 1
      out.push({
        x: cx + sx * CORNER_SETBACK,
        z: cz + sz * CORNER_SETBACK,
        rot: cornerArmRotation(sx, sz),
      })
    }
  }

  // --- Step 2: mid-block lamps along each N-S avenue (constant x) ---
  for (const ax of ROAD_AVENUES_X) {
    const crossings = [-ROAD_REACH, ...ROAD_AVENUES_Z, ROAD_REACH]
    for (let i = 0; i < crossings.length - 1; i++) {
      placeMidBlock('x', ax, crossings[i], crossings[i + 1], out)
    }
  }

  // --- Step 3: mid-block lamps along each E-W avenue (constant z) ---
  for (const az of ROAD_AVENUES_Z) {
    const crossings = [-ROAD_REACH, ...ROAD_AVENUES_X, ROAD_REACH]
    for (let i = 0; i < crossings.length - 1; i++) {
      placeMidBlock('z', az, crossings[i], crossings[i + 1], out)
    }
  }

  return out
}
