// =============================================================================
// LAYOUT SOURCE OF TRUTH — every hardcoded static prop position lives here.
// Pure module (no three.js). Imported by:
//   1. <LayoutAuditBanner/> — runtime browser audit, surfaces red banner on
//      any violation.
//   2. scripts/verify-layout.mjs (step 3) — pre-commit gate.
//
// Rule: if a prop has a hardcoded position in CityScene.tsx, it MUST be
// registered here. Procedural generators (Buildings, Trees,
// People) emit their output via window.__* arrays that the runtime auditor
// merges in at render time (see LayoutAuditBanner).
//
// halfW / halfD = OBB half-extents in LOCAL x/z BEFORE rotation.
// rot           = Y-axis rotation in radians (optional, default 0).
// sweepR        = extra radius added on top of OBB for rotating parts (wind
//                 blades, VAT blades). Crane boom is at y=3.3 in the air so
//                 it does not register sweepR — boom-vs-tall-building is an
//                 air-space concern, not a ground footprint concern.
// airborne      = true if prop has no ground footprint (e.g. rooftop VAT at
//                 y=3.5). Excluded from road + overlap checks.
// =============================================================================

import {
  ROAD_AVENUES_X,
  ROAD_AVENUES_Z,
  ROAD_HALF_WIDTH,
  ROAD_REACH,
  ROAD_BUFFER
} from './roads'
export { BLOCKS } from './spatialZones'
export type { CityBlock } from './spatialZones'

export interface Placement {
  id: string
  kind: string
  x: number
  z: number
  halfW: number
  halfD: number
  rot?: number
  sweepR?: number
  airborne?: boolean
  /** Catalog variant id ('classic' | 'modern' | etc.). Defaults to 'classic'.
   *  Drift check looks up footprint via catalog[kind][variant]. */
  variant?: string
  /** Sibling group — placements sharing the same `group` skip pairwise overlap.
   *  Example: PS-02's SolarFarm + BatteryBank are intentionally co-located. */
  group?: string
  /** Pre-rule placement exempt from new street-prop checks (sparse-block,
   *  visual column stacking, rot enum). Use only for inherited positions that
   *  predate the guideline. */
  legacy?: boolean
}

/** Street-prop placement-rule taxonomy. Kinds listed here are checked by
 *  the scripts/verify-layout.ts street-prop phases:
 *   - rot must be one of {0, ±π/2, π} (face a cardinal road direction)
 *   - containing BLOCKS entry must be sparse (≤ 1 non-street-prop facility)
 *   - no two within 10m along the same ROAD_AVENUES line (visual column rule)
 *  Add new kinds (RoadSign, BusShelter, etc.) here when extending the rule. */
export const STREET_PROP_KINDS: ReadonlySet<string> = new Set(['Billboard'])

/** Circular exclusion zones (no buildings spawn inside). */
export const RESERVED_PLAZA_RADIUS = 5.0

// -----------------------------------------------------------------------------
// PLACEMENTS — the actual registry
// -----------------------------------------------------------------------------

export const PLACEMENTS: Placement[] = [
  // ============ PV plants (pentagon r=7) — also in src/data.ts ============
  // Footprints reflect the ACTUAL mid-size PVHotspot geometry. SolarFarm
  // panels are larger than the compact pass but still axis-aligned and tighter
  // than the original plaza-sized footprint.
  // PS-02 additionally has a BatteryBank child registered separately.
  // PS-04 EV CarRow sits in the N e-mobility block.
  // PS-03 (怡保地面电站) at (0, -5) was replaced by the EVChargingStation —
  // the S arm of the cardinal cross now hosts e-mobility instead of solar.
  // Five plant ring became four (PS-01 N, PS-02 E, PS-04 N-block CarRow,
  // PS-05 W).
  { id: 'PS-01-SF', kind: 'pv-SolarFarm',   x: 0,  z: 5,    halfW: 1.38, halfD: 1.08, rot: 0 },
  { id: 'PS-02-SF', kind: 'pv-SolarFarm',   x: 5,  z: 0,    halfW: 1.38, halfD: 1.28, rot: 0, group: 'PS-02' },
  { id: 'PS-02-BB', kind: 'pv-BatteryBank', x: 4.65, z: 3.0, halfW: 1.3,  halfD: 0.75, rot: 0, group: 'PS-02' },
  { id: 'PS-04-CR', kind: 'pv-CarRow',      x: 0,  z: 14,   halfW: 1.59, halfD: 0.6,  rot: 0 }, // relocated to N e-mobility block
  { id: 'PS-05-SF', kind: 'pv-SolarFarm',   x: -5, z: 0,    halfW: 1.38, halfD: 1.28, rot: 0 },

  // ============ Energy facility singletons (each kind appears once) ============
  // East: hero Green Eco Office tile (kept). BatteryBank duplicate at z=-2.5
  // removed — PS-02 still has its own BatteryBank in the plaza.
  { id: 'green-office-E',  kind: 'GreenEcoOffice', x: 12, z: 2.5, halfW: 1.5, halfD: 1.25 },
  // West: single H2 sphere (the 2×2 cluster was demo-y; one sphere reads as a
  // residential gas-feed installation). SolarCanopy + PowerSubstation are
  // separate energy props in this corridor.
  { id: 'canopy-W',  kind: 'SolarCanopy',  x: -12,    z: 4,    halfW: 1.2, halfD: 0.9 },
  { id: 'h2-W-NW',   kind: 'H2Sphere',     x: -12,    z: -4,   halfW: 0.5, halfD: 0.5 },
  // North: drone hub stays in the north mid-block. EVChargingStation moved
  // INTO the central plaza at (0, -5) to replace PS-03 (see PS section above).
  // ID stays `ev-N` for showroom/route/operator continuity even though it's
  // no longer geographically north — renaming would cascade through tour /
  // routes / contract for no gain.
  { id: 'ev-N',      kind: 'EVChargingStation', x: 0,    z: -5, halfW: 2.4, halfD: 1.55, rot: Math.PI },
  { id: 'drone-N',   kind: 'DroneHub',     x: 3,      z: 12,   halfW: 0.7, halfD: 0.7 },
  // South: single VAT + TransmissionTower (was 3 VAT + 1 rooftop VAT — over-
  // dense for a residential city. One VAT marks the wind theme.)
  { id: 'vat-S-W',   kind: 'VAT',          x: -3,     z: -12,  halfW: 0.5, halfD: 0.5, sweepR: 0.5 },
  { id: 'trans-S',   kind: 'TransmissionTower', x: 6, z: -12,  halfW: 0.3, halfD: 0.3, rot: Math.PI / 2 },

  // ============ WindFarmHill (SW perimeter) ============
  // Self-contained 5×5m hill tile — 3 mini-turbines + LED rings + control
  // building + pine grove. Replaces the previous single WindTurbine.
  { id: 'wind-1', kind: 'WindFarmHill', x: -12, z: -12, halfW: 2.5, halfD: 2.5 },

  // ============ Twin Solar Office (NE CBD hero) ============
  // 4.6×3.6m tile with two adjacent modern offices + rooftop solar arrays
  // + warm-lit windows + sidewalk lamps + curbside EV chargers.
  { id: 'twin-office-NE', kind: 'TwinSolarOffice', x: 12, z: 12, halfW: 1.5, halfD: 1.2 },

  // ============ Community Park (NW residential corner) ============
  // Replaced the previous Crane construction set-piece per user request.
  // 2.5×2.5m park tile — grass + paths + central fountain + benches + trees.
  { id: 'nw-park', kind: 'CommunityPark', x: -12, z: 12, halfW: 1.25, halfD: 1.25 },

  // ============ ContainerYard (SE industrial) ============
  { id: 'container-A', kind: 'ContainerStack', x: 12, z: -10, halfW: 1.3, halfD: 0.4, rot: 0.3 },
  { id: 'container-B', kind: 'ContainerStack', x: 13, z: -13, halfW: 1.3, halfD: 0.4, rot: -0.3, variant: 'modern' },

  // ============ PowerSubstation (replaces both legacy trans-1 + trans-2) ============
  // 3.5×3m substation tile at (-6.5, 6) — main transformer building + 6
  // rooftop modules + steel pylon with HV cables + side gantry. trans-1
  // at (6.5, -2.5) was deleted; one full substation now serves the city.
  { id: 'substation-W', kind: 'PowerSubstation', x: -12, z: 0, halfW: 1.75, halfD: 1.5 },

  // ============ EnergyPlaza relay (single) ============
  // Was an octagonal ring of 8 small boxes around the CommandTower — visually
  // it just added clutter to the plaza. One relay survives as a token marker.
  { id: 'energy-relay-1', kind: 'EnergyPlazaRelay', x: 6.35, z: 2.05, halfW: 0.24, halfD: 0.24 },

  // ============ Billboards ============
  // Placement rules: (a) at block EDGE (against road, ~1.1m from centerline);
  // (b) only in SPARSE blocks (≤1 reserved facility); (c) max 1 per block.
  // For mid/outer-block edge placements, use rot ±π/2 so the long halfW runs
  // parallel to the road and the small halfD determines road clearance.
  // Sparse blocks used: E mid (GEO), N outer (Uni), NW outer (Sports), E outer
  // (Hospital), W outer lower (DataCenter), W outer upper (Market+TransitHub).
  // billboard-1 stays in W mid (legacy); billboard-3 moved out of W mid (was a
  // duplicate with billboard-1) to W outer lower edge.
  // All rotations face the nearest road. rot encoding: 0=+z, π=-z, π/2=+x, -π/2=-x.
  // Each placement in a different BLOCKS entry; sparse blocks only.
  // billboard-8 dropped: W outer upper has 2 facilities (Market+TransitHub),
  // not sparse, and it created a visual stack with -3 and -6 along x=-17.1.
  // billboard-1 is legacy: W mid has 3 facilities (SolarCanopy+H2+Substation),
  // not sparse. Exempted from new street-prop sparse-block check.
  { id: 'billboard-1', kind: 'Billboard', variant: 'classic',      x: -12,   z: -6.5, halfW: 0.55, halfD: 0.025, rot: Math.PI, legacy: true }, // W mid → z=-8 road
  { id: 'billboard-2', kind: 'Billboard', variant: 'classic',      x: 6,     z: 6,    halfW: 0.55, halfD: 0.025, rot: 0 },            // Central CC → z=8 road
  { id: 'billboard-3', kind: 'Billboard', variant: 'classic',      x: -17.1, z: -5,   halfW: 0.55, halfD: 0.025, rot: Math.PI / 2 },  // W outer lower → x=-16 road
  { id: 'billboard-4', kind: 'Billboard', variant: 'single-pole',  x: 9.1,   z: -4,   halfW: 0.35, halfD: 0.04,  rot: -Math.PI / 2 }, // E mid → x=8 road
  { id: 'billboard-5', kind: 'Billboard', variant: 'poster-stand', x: 6,     z: 17.2, halfW: 0.3,  halfD: 0.15,  rot: Math.PI },      // N outer → z=16 road
  { id: 'billboard-6', kind: 'Billboard', variant: 'classic',      x: -17.1, z: 19,   halfW: 0.55, halfD: 0.025, rot: Math.PI / 2 },  // NW outer → x=-16 road
  { id: 'billboard-7', kind: 'Billboard', variant: 'classic',      x: 17.1,  z: -10,  halfW: 0.55, halfD: 0.025, rot: -Math.PI / 2 }, // E outer → x=16 road

  // ============ WaterTanks (industrial quadrant) ============
  { id: 'water-1', kind: 'WaterTank', x: 5.0, z: -10.0, halfW: 0.55, halfD: 0.55 },
  { id: 'water-2', kind: 'WaterTank', x: 3.0, z: -9.7,  halfW: 0.55, halfD: 0.55 },
  { id: 'water-3', kind: 'WaterTank', x: 6.5, z: -11.0, halfW: 0.55, halfD: 0.55 },

  // ============ BenchPlanters (4 diagonal corners between cardinal PVs) ============
  ...(([[4.5, 4.5], [-4.5, 4.5], [-4.5, -4.5], [4.5, -4.5]] as [number, number][]).map(
    ([x, z], i): Placement => ({
      id: `bench-${i}`,
      kind: 'BenchPlanter',
      x,
      z,
      halfW: 0.4,
      halfD: 0.15,
      rot: Math.atan2(-x, -z)
    })
  )),

  // ============ CommandTower (origin) ============
  { id: 'command-tower', kind: 'CommandTower', x: 0, z: 0, halfW: 1.0, halfD: 1.0 },

  // ===== Outer-ring (±16 to ±20) civic landmarks — 4 functional sectors =====
  // Each tile sits between the outer avenue (±16) and the road grid endpoint
  // (±20). halfD/halfW chosen so OBB edge clears the outer avenue by ≥1.0u
  // (road buffer = 0.95). Narrative pairing in MASTERPLAN_SECTORS.
  { id: 'university-N', kind: 'University',  x: 0,     z: 18.5,  halfW: 3.0, halfD: 1.5 },
  { id: 'hospital-E',   kind: 'Hospital',    x: 18.5,  z: 0,     halfW: 1.5, halfD: 3.0 },
  { id: 'museum-S',     kind: 'MuseumPlaza', x: 0,     z: -18.5, halfW: 3.0, halfD: 1.5 },
  { id: 'market-W',     kind: 'Market',      x: -18.5, z: 0,     halfW: 1.5, halfD: 3.0 },

  // ===== Phase 2 outer ring (±20 to ±22/±24) =====
  // 4 new functional landmarks anchoring the irregular outer ring. Each sits
  // in the strip between the new outer avenue and the existing ±16 ring.
  // Sized so each axis clears road buffer 0.95 plus a comfortable visual gap.
  { id: 'sports-NW',   kind: 'SportsComplex', x: -20, z: 19,  halfW: 2.0, halfD: 2.0 },
  { id: 'transit-W',   kind: 'TransitHub',    x: -20, z: 12,  halfW: 1.5, halfD: 3.0 },
  { id: 'research-NE', kind: 'ResearchPark',  x: 19,  z: 19,  halfW: 2.0, halfD: 2.0 },
  { id: 'data-W',      kind: 'DataCenter',    x: -20, z: -13, halfW: 1.5, halfD: 2.0 }
]

// =============================================================================
// Verifier — all collision/road math
// =============================================================================

export type ViolationKind = 'road' | 'overlap' | 'reserved'

export interface Violation {
  kind: ViolationKind
  msg: string
  ids: string[]
}

/** Pure OBB→world-AABB conversion. Inputs are local half-extents and a
 *  Y-axis rotation in radians; output is the axis-aligned world bound after
 *  rotation, expanded by an optional sweep radius. Used by `effectiveAABB`
 *  for Placement objects and directly by `scripts/verify-layout.ts` to bound
 *  procedural building footprints — both share the exact same math. */
export function obbToAABB(
  halfW: number,
  halfD: number,
  rot: number = 0,
  sweepR: number = 0,
): { halfW: number; halfD: number } {
  const cos = Math.abs(Math.cos(rot))
  const sin = Math.abs(Math.sin(rot))
  return {
    halfW: halfW * cos + halfD * sin + sweepR,
    halfD: halfW * sin + halfD * cos + sweepR,
  }
}

/** Placement-aware wrapper over `obbToAABB`. Exported for tests + the
 *  pre-commit verifier. */
export function effectiveAABB(p: Placement): { halfW: number; halfD: number } {
  return obbToAABB(p.halfW, p.halfD, p.rot, p.sweepR)
}

function checkRoad(p: Placement): Violation | null {
  if (p.airborne) return null
  const { halfW, halfD } = effectiveAABB(p)
  const threshold = ROAD_HALF_WIDTH + ROAD_BUFFER

  for (const ax of ROAD_AVENUES_X) {
    const dx = Math.abs(p.x - ax) - halfW
    if (dx < threshold) {
      const insideExtent = Math.abs(p.z) - halfD <= ROAD_REACH
      if (insideExtent) {
        const overlap = threshold - dx
        return {
          kind: 'road',
          msg: `${p.kind} "${p.id}" @ (${p.x.toFixed(2)},${p.z.toFixed(2)}) overlaps x=${ax} avenue by ${overlap.toFixed(2)}m`,
          ids: [p.id]
        }
      }
    }
  }
  for (const az of ROAD_AVENUES_Z) {
    const dz = Math.abs(p.z - az) - halfD
    if (dz < threshold) {
      const insideExtent = Math.abs(p.x) - halfW <= ROAD_REACH
      if (insideExtent) {
        const overlap = threshold - dz
        return {
          kind: 'road',
          msg: `${p.kind} "${p.id}" @ (${p.x.toFixed(2)},${p.z.toFixed(2)}) overlaps z=${az} avenue by ${overlap.toFixed(2)}m`,
          ids: [p.id]
        }
      }
    }
  }
  return null
}

function checkOverlap(a: Placement, b: Placement): Violation | null {
  if (a.airborne || b.airborne) return null
  if (a.group && a.group === b.group) return null // intentional siblings
  const aa = effectiveAABB(a)
  const bb = effectiveAABB(b)
  const dx = Math.abs(a.x - b.x)
  const dz = Math.abs(a.z - b.z)
  const overlapX = aa.halfW + bb.halfW - dx
  const overlapZ = aa.halfD + bb.halfD - dz
  if (overlapX > 0 && overlapZ > 0) {
    const minOverlap = Math.min(overlapX, overlapZ)
    return {
      kind: 'overlap',
      msg: `${a.kind} "${a.id}" overlaps ${b.kind} "${b.id}" by ${minOverlap.toFixed(2)}m`,
      ids: [a.id, b.id]
    }
  }
  return null
}

export interface VerifyOptions {
  /** Extra placements from runtime generators (Buildings, Trees). */
  extra?: Placement[]
}

export function verifyLayout(opts: VerifyOptions = {}): Violation[] {
  const all = opts.extra ? [...PLACEMENTS, ...opts.extra] : PLACEMENTS
  const violations: Violation[] = []

  for (const p of all) {
    const v = checkRoad(p)
    if (v) violations.push(v)
  }

  // Pairwise — N^2 but N<200, fine.
  for (let i = 0; i < all.length; i++) {
    for (let j = i + 1; j < all.length; j++) {
      const v = checkOverlap(all[i], all[j])
      if (v) violations.push(v)
    }
  }

  return violations
}
