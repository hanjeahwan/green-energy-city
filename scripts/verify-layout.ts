#!/usr/bin/env tsx
// =============================================================================
// Pre-commit layout gate.
//
// Imports src/scene/layout.ts (pure module, no three.js), runs verifyLayout(),
// and exits 1 if any violations exist. Wired into the git pre-commit hook so
// the user cannot commit a state where any registered prop occupies a road or
// overlaps another prop.
//
// Run manually:  npm run verify
// Run in CI:     same command, same exit code.
//
// Replaces the legacy `verify-layout.mjs`. Now imports the algorithm-layer
// `obbToAABB` helper from `src/scene/layout.ts` so the OBB→AABB rotation math
// is defined exactly once, not duplicated here.
// =============================================================================

import { verifyLayout, PLACEMENTS, obbToAABB, BLOCKS, STREET_PROP_KINDS, type Placement } from '../src/scene/layout'
import { buildingVisualFootprint } from '../src/elements/buildings/catalog'
import { validateAllVehiclePaths, VEHICLE_PATHS } from '../src/scene/vehicles'
import { buildCity } from '../src/scene/cityGenerator'
import { onRoad, onStub } from '../src/scene/exclusion'
import { operatorPlacementExtras } from '../src/scene/operatorPlacements'
import { MASTERPLAN_BUILDINGS } from '../src/scene/masterplan'
import { ROAD_AVENUES_X, ROAD_AVENUES_Z } from '../src/scene/roads'
import type { BuildingDef } from '../src/elements/types'

/** World-AABB-vs-world-AABB overlap. Returns positive overlap in metres if
 *  the two axis-aligned (post-rotation) boxes intersect, 0 otherwise. The
 *  conservative-on-rotation behaviour is fine here — the procedural overlap
 *  check should over-report rather than miss collisions. */
function aabbOverlap(
  ax: number, az: number, aHW: number, aHD: number,
  bx: number, bz: number, bHW: number, bHD: number,
): number {
  const overlapX = aHW + bHW - Math.abs(ax - bx)
  const overlapZ = aHD + bHD - Math.abs(az - bz)
  if (overlapX > 0 && overlapZ > 0) return Math.min(overlapX, overlapZ)
  return 0
}

interface BuildingBox {
  id: string
  x: number
  z: number
  halfW: number
  halfD: number
  source: 'procedural' | 'masterplan'
}

function boxForBuilding(b: BuildingDef, fallbackId: string, source: 'procedural' | 'masterplan'): BuildingBox {
  const fp = buildingVisualFootprint(b)
  const aabb = obbToAABB(fp.halfW, fp.halfD, b.rot, fp.sweepR ?? 0)
  return {
    id: ('id' in b ? (b as { id?: string }).id : undefined) ?? fallbackId,
    x: b.pos[0],
    z: b.pos[1],
    halfW: aabb.halfW,
    halfD: aabb.halfD,
    source,
  }
}

// ----- Phase 1: road + overlap checks (the original verifier) -----
const operatorExtras = operatorPlacementExtras()
const violations = verifyLayout({ extra: operatorExtras })

// ----- Phase 5: vehicle path validation -----
const vehicleViolations = validateAllVehiclePaths()

// ----- Phase 1.5: intra-kind consistency check -----
// All placements sharing the same (kind, variant) must have identical
// halfW/halfD/sweepR. PLACEMENTS is the truth (FACILITY_FOOTPRINTS catalog
// has been removed — it was just a duplicate template that PLACEMENTS had to
// match). If a renderer wants different footprints for visually different
// variants, the new variant gets its own variant id and its own consistent
// PLACEMENTS rows.
const driftMessages: string[] = []
const seenByKindVariant = new Map<string, Placement>()
for (const p of PLACEMENTS) {
  if (p.airborne) continue
  // procedural pv-* placements are intentionally per-instance and skip this check
  if (p.kind.startsWith('pv-')) continue
  const key = `${p.kind}#${p.variant ?? 'classic'}`
  const prev = seenByKindVariant.get(key)
  if (!prev) {
    seenByKindVariant.set(key, p)
    continue
  }
  const issues: string[] = []
  if (Math.abs(prev.halfW - p.halfW) > 1e-6) issues.push(`halfW ${prev.id}=${prev.halfW} vs ${p.id}=${p.halfW}`)
  if (Math.abs(prev.halfD - p.halfD) > 1e-6) issues.push(`halfD ${prev.id}=${prev.halfD} vs ${p.id}=${p.halfD}`)
  const prevSweep = prev.sweepR ?? 0
  const curSweep = p.sweepR ?? 0
  if (Math.abs(prevSweep - curSweep) > 1e-6) issues.push(`sweepR ${prev.id}=${prevSweep} vs ${p.id}=${curSweep}`)
  if (issues.length) {
    driftMessages.push(`${key} inconsistent: ${issues.join('; ')}`)
  }
}

// ----- C4: procedural building road audit -----
// Pre-C4 the generator's output was only checked at runtime. Now we reuse the
// same `obbToAABB` math the live verifier uses (no duplicated rotation code).
type ProceduralViolation = {
  kind: 'procedural-road' | 'procedural-overlap' | 'procedural-stub'
  msg: string
}
const proceduralViolations: ProceduralViolation[] = []

// Collect all city buildings (masterplan + procedural) with their world AABBs.
const cityBuildings = buildCity()
const masterplanIdSet = new Set(MASTERPLAN_BUILDINGS.map((b) => b.id))
// We need to distinguish masterplan vs procedural in the city output. The
// masterplan slice comes first in buildCity()'s concatenation; identify by
// stable position match against MASTERPLAN_BUILDINGS.
const masterplanByPos = new Map<string, string>()
for (const b of MASTERPLAN_BUILDINGS) {
  masterplanByPos.set(`${b.pos[0].toFixed(3)}|${b.pos[1].toFixed(3)}`, b.id)
}
const procBuildings: BuildingBox[] = []
const mpBuildings: BuildingBox[] = []
for (let i = 0; i < cityBuildings.length; i++) {
  const b = cityBuildings[i]
  const key = `${b.pos[0].toFixed(3)}|${b.pos[1].toFixed(3)}`
  const mpId = masterplanByPos.get(key)
  if (mpId !== undefined) {
    mpBuildings.push(boxForBuilding(b, mpId, 'masterplan'))
  } else {
    procBuildings.push(boxForBuilding(b, `proc-${i}@${b.pos[0].toFixed(1)},${b.pos[1].toFixed(1)}-${b.type}`, 'procedural'))
  }
}

// road check (existing)
for (const b of cityBuildings) {
  const footprint = buildingVisualFootprint(b)
  const aabb = obbToAABB(footprint.halfW, footprint.halfD, b.rot, footprint.sweepR ?? 0)
  const halfFoot = Math.max(aabb.halfW, aabb.halfD)
  if (onRoad(b.pos[0], b.pos[1], halfFoot)) {
    // skip masterplan-on-road false positives if masterplan already passed
    // its own bounds check; only flag procedural-emitted-on-road, otherwise
    // we'd double-fire on hand-placed buildings near the curb.
    const key = `${b.pos[0].toFixed(3)}|${b.pos[1].toFixed(3)}`
    if (!masterplanByPos.has(key)) {
      proceduralViolations.push({
        kind: 'procedural-road',
        msg: `${b.type}/${b.variant} at (${b.pos[0].toFixed(2)}, ${b.pos[1].toFixed(2)}) overlaps a road (footprint ${b.w.toFixed(2)}×${b.d.toFixed(2)}, rot ${b.rot.toFixed(2)})`,
      })
    }
  } else if (onStub(b.pos[0], b.pos[1], halfFoot)) {
    // Visual stub roads (STUB_RECTS) aren't in ROAD_AVENUES, so onRoad() misses
    // them. The outskirts generator gates on onStub(); this catches any drift.
    const key = `${b.pos[0].toFixed(3)}|${b.pos[1].toFixed(3)}`
    if (!masterplanByPos.has(key)) {
      proceduralViolations.push({
        kind: 'procedural-stub',
        msg: `${b.type}/${b.variant} at (${b.pos[0].toFixed(2)}, ${b.pos[1].toFixed(2)}) overlaps a stub road (footprint ${b.w.toFixed(2)}×${b.d.toFixed(2)})`,
      })
    }
  }
}

// ----- Phase 2 expansion: procedural overlap audit -----
// Covers the gap that let MASTERPLAN_BUILDINGS' E-EDGE-RES-01 clip a
// procedural apartment at (18,-4): isReservedOrMasterplan's circle check
// missed the rectangular overlap. Now the procedural infill is
// independently verified against three populations.

// 1) procedural vs PLACEMENTS (facilities, benches, water tanks, etc.)
const placementBoxes: BuildingBox[] = PLACEMENTS.filter((p) => !p.airborne).map((p) => {
  const aabb = obbToAABB(p.halfW, p.halfD, p.rot, p.sweepR)
  return { id: p.id, x: p.x, z: p.z, halfW: aabb.halfW, halfD: aabb.halfD, source: 'masterplan' }
})
for (const proc of procBuildings) {
  for (const pl of placementBoxes) {
    const ov = aabbOverlap(proc.x, proc.z, proc.halfW, proc.halfD, pl.x, pl.z, pl.halfW, pl.halfD)
    if (ov > 0) {
      proceduralViolations.push({
        kind: 'procedural-overlap',
        msg: `${proc.id} overlaps PLACEMENT "${pl.id}" by ${ov.toFixed(2)}m`,
      })
    }
  }
}

// 2) procedural vs masterplan buildings
for (const proc of procBuildings) {
  for (const mp of mpBuildings) {
    const ov = aabbOverlap(proc.x, proc.z, proc.halfW, proc.halfD, mp.x, mp.z, mp.halfW, mp.halfD)
    if (ov > 0) {
      proceduralViolations.push({
        kind: 'procedural-overlap',
        msg: `${proc.id} overlaps MASTERPLAN "${mp.id}" by ${ov.toFixed(2)}m`,
      })
    }
  }
}

// 3) procedural vs procedural (pairwise)
for (let i = 0; i < procBuildings.length; i++) {
  for (let j = i + 1; j < procBuildings.length; j++) {
    const a = procBuildings[i]
    const b = procBuildings[j]
    const ov = aabbOverlap(a.x, a.z, a.halfW, a.halfD, b.x, b.z, b.halfW, b.halfD)
    if (ov > 0) {
      proceduralViolations.push({
        kind: 'procedural-overlap',
        msg: `${a.id} overlaps PROCEDURAL ${b.id} by ${ov.toFixed(2)}m`,
      })
    }
  }
}

// 4) masterplan vs masterplan (pairwise) — catches hand-placement mistakes
// like the Phase-2 attempt that put E-APT-01 (14.5, 6.5) clipping into
// E-LAB-01 (14.2, 5.4) by 0.02u while every other check still passed.
for (let i = 0; i < mpBuildings.length; i++) {
  for (let j = i + 1; j < mpBuildings.length; j++) {
    const a = mpBuildings[i]
    const b = mpBuildings[j]
    const ov = aabbOverlap(a.x, a.z, a.halfW, a.halfD, b.x, b.z, b.halfW, b.halfD)
    if (ov > 0) {
      proceduralViolations.push({
        kind: 'procedural-overlap',
        msg: `MASTERPLAN ${a.id} overlaps MASTERPLAN ${b.id} by ${ov.toFixed(2)}m`,
      })
    }
  }
}

void masterplanIdSet // silence unused

// ----- Phase 6: street-prop rotation enum check -----
// Block-edge street props (Billboard, future RoadSign / BusShelter) must face
// a cardinal road direction. Allowed rot ∈ {0, ±π/2, π}; decorative random
// angles like 0.3 / -0.6 / 1.2 result in screens that don't face the road.
const ALLOWED_STREET_PROP_ROTS = [0, Math.PI / 2, -Math.PI / 2, Math.PI, -Math.PI]
const rotEnumViolations: string[] = []
for (const p of PLACEMENTS) {
  if (!STREET_PROP_KINDS.has(p.kind)) continue
  if (p.legacy) continue
  const rot = p.rot ?? 0
  const ok = ALLOWED_STREET_PROP_ROTS.some((r) => Math.abs(r - rot) < 1e-3)
  if (!ok) {
    rotEnumViolations.push(
      `${p.kind} "${p.id}" has rot=${rot.toFixed(3)} — street props must face a road; use rot ∈ {0, ±π/2, π}`,
    )
  }
}

// ----- Phase 7: street-prop sparse-block check -----
// "Sparse block" = BLOCKS entry containing ≤ 1 non-street-prop reserved
// facility from PLACEMENTS. Central CC (x∈[-8,8] ∧ z∈[-8,8]) and the south
// outer band (z∈[-22,-16]) are not in any BLOCKS entry → sparse by default
// (findBlock returns null, check skipped).
function findBlock(x: number, z: number): (typeof BLOCKS)[number] | null {
  for (const b of BLOCKS) {
    const [x0, z0, x1, z1] = b.bounds
    if (x >= x0 && x <= x1 && z >= z0 && z <= z1) return b
  }
  return null
}

// Pre-compute per-block facility count, excluding street props themselves and
// procedural pv-* placements (those live in central CC, no BLOCKS entry).
const blockFacilityCount = new Map<string, number>()
for (const p of PLACEMENTS) {
  if (p.airborne) continue
  if (STREET_PROP_KINDS.has(p.kind)) continue
  if (p.kind.startsWith('pv-')) continue
  const block = findBlock(p.x, p.z)
  if (!block) continue
  const key = block.bounds.join(',')
  blockFacilityCount.set(key, (blockFacilityCount.get(key) ?? 0) + 1)
}

const sparseBlockViolations: string[] = []
for (const p of PLACEMENTS) {
  if (!STREET_PROP_KINDS.has(p.kind)) continue
  if (p.legacy) continue
  const block = findBlock(p.x, p.z)
  if (!block) continue // central CC or south outer band — sparse by definition
  const key = block.bounds.join(',')
  const count = blockFacilityCount.get(key) ?? 0
  if (count > 1) {
    sparseBlockViolations.push(
      `${p.kind} "${p.id}" placed in block [${block.bounds.join(',')}] which has ${count} reserved facilities (need ≤1 for sparse)`,
    )
  }
}

// ----- Phase 8: street-prop visual column stacking check -----
// Two street props within 1.5m of the same ROAD_AVENUES line, separated by
// <10m along that road, read as a stacked column in perspective view. User
// will judge them as "two billboards in the same block" even if they live in
// different BLOCKS entries.
const COLUMN_PROXIMITY = 1.5
const MIN_COLUMN_SPACING = 10
const columnViolations: string[] = []
const streetProps = PLACEMENTS.filter((p) => STREET_PROP_KINDS.has(p.kind) && !p.legacy)
for (let i = 0; i < streetProps.length; i++) {
  for (let j = i + 1; j < streetProps.length; j++) {
    const a = streetProps[i]
    const b = streetProps[j]
    for (const ax of ROAD_AVENUES_X) {
      if (Math.abs(a.x - ax) < COLUMN_PROXIMITY && Math.abs(b.x - ax) < COLUMN_PROXIMITY) {
        const along = Math.abs(a.z - b.z)
        if (along < MIN_COLUMN_SPACING) {
          columnViolations.push(
            `"${a.id}" and "${b.id}" both within ${COLUMN_PROXIMITY}m of vertical road x=${ax}; only ${along.toFixed(1)}m apart along z (need ≥${MIN_COLUMN_SPACING}m to avoid visual column stack)`,
          )
        }
      }
    }
    for (const az of ROAD_AVENUES_Z) {
      if (Math.abs(a.z - az) < COLUMN_PROXIMITY && Math.abs(b.z - az) < COLUMN_PROXIMITY) {
        const along = Math.abs(a.x - b.x)
        if (along < MIN_COLUMN_SPACING) {
          columnViolations.push(
            `"${a.id}" and "${b.id}" both within ${COLUMN_PROXIMITY}m of horizontal road z=${az}; only ${along.toFixed(1)}m apart along x (need ≥${MIN_COLUMN_SPACING}m to avoid visual column stack)`,
          )
        }
      }
    }
  }
}

// ----- Phase 9: vehicle path pairwise segment independence -----
// Multi-vehicle scenes must use independent ring loops sharing no overlapping
// segment on the same road centerline. Two paths sharing a segment risk
// real-time collision (Sedan, ServiceVan, Truck currently use inner ±8 / mid
// ±16 / outer ±24/±22 — completely disjoint).
type VehicleSeg = {
  pathId: string
  segIdx: number
  axis: 'x' | 'z'
  coord: number
  min: number
  max: number
}
const vehicleSegs: VehicleSeg[] = []
for (const path of VEHICLE_PATHS) {
  for (let i = 0; i < path.waypoints.length; i++) {
    const a = path.waypoints[i]
    const b = path.waypoints[(i + 1) % path.waypoints.length]
    if (Math.abs(a[0] - b[0]) < 1e-6) {
      vehicleSegs.push({
        pathId: path.id,
        segIdx: i,
        axis: 'x',
        coord: a[0],
        min: Math.min(a[1], b[1]),
        max: Math.max(a[1], b[1]),
      })
    } else if (Math.abs(a[1] - b[1]) < 1e-6) {
      vehicleSegs.push({
        pathId: path.id,
        segIdx: i,
        axis: 'z',
        coord: a[1],
        min: Math.min(a[0], b[0]),
        max: Math.max(a[0], b[0]),
      })
    }
  }
}
const vehiclePathOverlaps: string[] = []
for (let i = 0; i < vehicleSegs.length; i++) {
  for (let j = i + 1; j < vehicleSegs.length; j++) {
    const a = vehicleSegs[i]
    const b = vehicleSegs[j]
    if (a.pathId === b.pathId) continue
    if (a.axis !== b.axis) continue
    if (Math.abs(a.coord - b.coord) > 0.5) continue
    const overlap = Math.min(a.max, b.max) - Math.max(a.min, b.min)
    if (overlap > 0) {
      vehiclePathOverlaps.push(
        `vehicle path "${a.pathId}" seg ${a.segIdx} overlaps "${b.pathId}" seg ${b.segIdx} on ${a.axis}=${a.coord} by ${overlap.toFixed(1)}m — use independent ring loops, not shared segments`,
      )
    }
  }
}

const totalIssues =
  violations.length +
  driftMessages.length +
  vehicleViolations.length +
  proceduralViolations.length +
  rotEnumViolations.length +
  sparseBlockViolations.length +
  columnViolations.length +
  vehiclePathOverlaps.length

if (totalIssues === 0) {
  console.log(
    '\x1b[32m✓\x1b[0m LayoutAudit PASSED — 0 violations, 0 kind drift, 0 vehicle path issues, 0 procedural building issues, 0 street-prop rule violations',
  )
  process.exit(0)
}

if (violations.length > 0) {
  console.log(`\x1b[31m✗\x1b[0m Layout violations (${violations.length}):`)
  for (const v of violations) {
    console.log(`  \x1b[31m[${v.kind}]\x1b[0m ${v.msg}`)
  }
}

if (driftMessages.length > 0) {
  console.log(`\x1b[31m✗\x1b[0m Intra-kind footprint drift (${driftMessages.length}):`)
  for (const m of driftMessages) {
    console.log(`  \x1b[31m[drift]\x1b[0m ${m}`)
  }
}

if (vehicleViolations.length > 0) {
  console.log(`\x1b[31m✗\x1b[0m Vehicle path violations (${vehicleViolations.length}):`)
  for (const v of vehicleViolations) {
    console.log(`  \x1b[31m[vehicle-path]\x1b[0m ${v.pathId} seg ${v.segmentIndex} (${v.from} → ${v.to}): ${v.msg}`)
  }
}

if (proceduralViolations.length > 0) {
  console.log(`\x1b[31m✗\x1b[0m Procedural building violations (${proceduralViolations.length}):`)
  for (const v of proceduralViolations) {
    console.log(`  \x1b[31m[${v.kind}]\x1b[0m ${v.msg}`)
  }
}

if (rotEnumViolations.length > 0) {
  console.log(`\x1b[31m✗\x1b[0m Street-prop rotation enum violations (${rotEnumViolations.length}):`)
  for (const m of rotEnumViolations) console.log(`  \x1b[31m[street-rot]\x1b[0m ${m}`)
}

if (sparseBlockViolations.length > 0) {
  console.log(`\x1b[31m✗\x1b[0m Street-prop sparse-block violations (${sparseBlockViolations.length}):`)
  for (const m of sparseBlockViolations) console.log(`  \x1b[31m[street-sparse]\x1b[0m ${m}`)
}

if (columnViolations.length > 0) {
  console.log(`\x1b[31m✗\x1b[0m Street-prop visual column-stack violations (${columnViolations.length}):`)
  for (const m of columnViolations) console.log(`  \x1b[31m[street-column]\x1b[0m ${m}`)
}

if (vehiclePathOverlaps.length > 0) {
  console.log(`\x1b[31m✗\x1b[0m Vehicle path segment-overlap violations (${vehiclePathOverlaps.length}):`)
  for (const m of vehiclePathOverlaps) console.log(`  \x1b[31m[vehicle-overlap]\x1b[0m ${m}`)
}

console.log('\nFix the issues above before committing.')
console.log('Layout violations: edit src/scene/layout.ts (PLACEMENTS) or the')
console.log('  matching component coordinate in src/components/CityScene.tsx.')
console.log('Intra-kind drift: two placements share a (kind, variant) but report')
console.log('  different halfW/halfD/sweepR. Align them so the same kind+variant')
console.log('  always uses the same footprint in src/scene/layout.ts PLACEMENTS.')
console.log('Vehicle path: edit src/scene/vehicles.ts so every segment lies on a')
console.log('  ROAD_AVENUES_X or ROAD_AVENUES_Z centerline.')
console.log('Procedural building: the generator in src/scene/cityGenerator.ts')
console.log('  put a building inside a road exclusion zone. Either fix')
console.log('  the relevant ZONING entry (src/scene/zoning.ts), the')
console.log('  RESERVED_ZONES (src/scene/cityGenerator.ts), or BLOCKS bounds.')
console.log('Street-prop rules (Billboard etc, listed in STREET_PROP_KINDS):')
console.log('  - rot must be one of {0, ±π/2, π} so the screen faces a road.')
console.log('  - containing BLOCKS entry needs ≤1 non-street-prop facility.')
console.log('  - no two street props within 1.5m of same road and <10m apart.')
console.log('  Override: mark a placement `legacy: true` if it predates the rule.')
console.log('Vehicle path overlap: two VEHICLE_PATHS share a segment on the')
console.log('  same road centerline. Use independent ring loops (inner ±8 /')
console.log('  mid ±16 / outer ±24/±22), not shared segments.')
process.exit(1)
