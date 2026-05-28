// =============================================================================
// City building generator — pure-function port of the old `genBuildings()`
// that used to live inside CityScene.tsx.
//
// C2 scope: this file is BEHAVIOUR-IDENTICAL to the pre-extraction code.
// Identical rng seeds → identical BuildingDef[] output. The point of this
// commit is just to:
//   1. Pull the generator out of a React file so scripts/verify-layout.mjs
//      can import it (used by C4).
//   2. Promote the giant inline `reserved` array to a structured
//      RESERVED_ZONES constant with `reason` labels.
//
// Zoning-driven lot subdivision / FAR / coverage / setback rules arrive
// in C3 — this commit deliberately doesn't change any numbers.
// =============================================================================

import type { BuildingDef } from '../elements/types'
import {
  buildingVisualFootprint,
  pickPalette,
  pickTypeForDistrict,
  pickVariant,
  sizeForType,
  ROOF_PALETTE
} from '../elements/buildings/catalog'
import { rng } from '../components/sceneMaterials'
import { plants } from '../data'
import { onRoad, onStub } from './exclusion'
import { ZONING, NO_PV_TYPES } from './zoning'
import { buildMasterplanCity, MASTERPLAN_BUILDINGS } from './masterplan'
import { obbToAABB, PLACEMENTS } from './layout'
import { BLOCKS } from './spatialZones'
import buildingsManual from '../data/buildings-manual.json'

/** Assumed typical storey height (m), used to convert FAR + footprint to
 *  a height cap. Three.js scale: 1 unit ≈ 1m, our diorama height ≈ 3m/floor. */
const STOREY_HEIGHT = 3.0

// -----------------------------------------------------------------------------
// Reserved zones — places where the procedural city must NOT drop a building.
// Structured (with `reason`) so future readers can see who claimed each
// circle, instead of the previous wall-of-coords array. Values are the
// pre-C2 numbers verbatim.
// -----------------------------------------------------------------------------

export interface ReservedZone {
  x: number
  z: number
  reason: string
  /** Circle radius (m). One of (r) or (halfW + halfD) must be set. */
  r?: number
  /** Local half-extent along x (m). Combined with halfD makes a rectangular
   *  exclusion that hugs elongated facilities (Hospital 1.5×3.0, University
   *  3.0×1.5) far better than a single circle. */
  halfW?: number
  halfD?: number
  /** Y-axis rotation of the rectangle (radians). Defaults to 0. */
  rot?: number
}

export const RESERVED_ZONES: ReservedZone[] = [
  // Central plaza (CommandTower + cardinal PV lives here)
  { x: 0, z: 0, r: 5.0, reason: 'central-plaza' },

  // 5 PV plants on the cardinal ring (positions sourced from data.ts)
  ...plants.map((p): ReservedZone => ({
    x: p.position[0],
    z: p.position[2],
    r: 3.0,
    reason: `PV-${p.id}`
  })),

  // WindFarmHill — 5×5m tile. OBB-shape exclusion inflated by procedural
  // house halfMax (0.62) + buffer (0.3).
  { x: -12, z: -12, halfW: 2.5 + 0.92, halfD: 2.5 + 0.92, reason: 'wind-farm-hill' },

  // PowerSubstation tile at (-12, 0): halfW=1.75 halfD=1.5 → inflated
  // halves capture worst-case 1.24×1.24 procedural house centred on edge.
  { x: -12, z: 0, halfW: 1.75 + 0.92, halfD: 1.5 + 0.92, reason: 'power-substation' },
  { x: 5,    z: -10,  r: 2.0, reason: 'water-tanks-area' },
  { x: 4,    z: -11.5,r: 2.0, reason: 'water-tanks-area' },
  { x: 6.5,  z: -11,  r: 2.0, reason: 'water-tanks-area' },

  // East energy props — Green Eco Office only. OBB-inflated (halfW=1.5
  // halfD=1.25 from PLACEMENTS).
  { x: 12, z: 2.5, halfW: 1.5 + 0.92, halfD: 1.25 + 0.92, reason: 'east-GreenEcoOffice' },

  // West energy props — SolarCanopy + single H2 sphere. SolarCanopy is
  // rectangular so use OBB; H2 sphere stays as circle.
  { x: -12, z: 4, halfW: 1.2 + 0.92, halfD: 0.9 + 0.92, reason: 'west-SolarCanopy' },
  { x: -12, z: -4,   r: 1.0, reason: 'west-H2Sphere' },

  // EVChargingStation moved into the plaza at (0, -5) — replaces PS-03 PV.
  // The procedural generator never spawns inside the central plaza anyway
  // (RESERVED_PLAZA_RADIUS at the top), so this is belt-and-braces only.
  { x: 0,  z: -5, r: 2.8, reason: 'plaza-EVChargingStation' },
  // DroneHub stays in the north mid-block.
  { x: 3,  z: 12, r: 1.5, reason: 'north-DroneDeliveryHub' },

  // South energy props — single VAT (was 3 + 1 rooftop) + TransmissionTower.
  { x: -3, z: -12, r: 1.2, reason: 'south-VAT' },
  { x: 6,  z: -12, r: 1.0, reason: 'south-TransmissionTower' },

  // PS-02 BatteryBank world position (PS-02 + local -0.35,3.0)
  { x: 4.65, z: 3.0, r: 1.25, reason: 'PS-02-BatteryBank' },

  // Billboards — block-edge placements, max 1 per BLOCKS entry, sparse blocks only.
  { x: -12,   z: -6.5, r: 1.0, reason: 'billboard-1-W-mid-edge' },
  { x: -17.1, z: -5,   r: 1.0, reason: 'billboard-3-W-outer-lower-edge' },
  { x: 9.1,   z: -4,   r: 1.0, reason: 'billboard-4-E-mid-edge' },
  { x: 6,     z: 17.2, r: 1.0, reason: 'billboard-5-N-outer-edge' },
  { x: -17.1, z: 19,   r: 1.0, reason: 'billboard-6-NW-outer-edge' },
  { x: 17.1,  z: -10,  r: 1.0, reason: 'billboard-7-E-outer-edge' },

  // ContainerYard B (relocated SE)
  { x: 13, z: -13, r: 1.5, reason: 'container-yard-B' },

  // Water tanks (separate entries for spatial precision)
  { x: 5.0, z: -10.0, r: 1.0, reason: 'water-tank' },
  { x: 3.0, z: -9.7,  r: 1.0, reason: 'water-tank' },
  { x: 6.5, z: -11.0, r: 1.0, reason: 'water-tank' },

  // Community park (NW residential corner) — 2.5×2.5m tile. OBB-inflated.
  { x: -12, z: 12, halfW: 1.25 + 0.92, halfD: 1.25 + 0.92, reason: 'nw-park' },

  // TwinSolarOffice at (12, 12) — 3.0×2.4 visible tile (halfW=1.5 halfD=1.2).
  // OBB-inflated.
  { x: 12, z: 12, halfW: 1.5 + 0.92, halfD: 1.2 + 0.92, reason: 'twin-solar-office' },

  // ContainerYard A + B — tighter rings now that SE is residential and we
  // want houses up close to the containers instead of an empty buffer.
  { x: 12, z: -10, r: 1.4, reason: 'container-yard-area' },
  { x: 13, z: -13, r: 1.4, reason: 'container-yard-area' },

  // ===== Phase 2: outer-ring civic + functional landmarks =====
  // OBB-shape exclusion so the rectangle is honoured (a circle that fits a
  // 1.5×3.0 hospital would either clip the long sides or hollow out the
  // surrounding block). Each entry's halfW/halfD = facility half-extent +
  // procedural-house half-extent (~0.62) + 0.3 safety buffer. Lot centres
  // landing inside this expanded rectangle are skipped, so even the worst-
  // case house edge ends up ≥0.3u from the facility OBB.
  { x: 0,     z: 18.5,  halfW: 3.92, halfD: 2.42, reason: 'university-N' },
  { x: 18.5,  z: 0,     halfW: 2.42, halfD: 3.92, reason: 'hospital-E' },
  { x: 0,     z: -18.5, halfW: 3.92, halfD: 2.42, reason: 'museum-S' },
  { x: -18.5, z: 0,     halfW: 2.42, halfD: 3.92, reason: 'market-W' },
  { x: -20,   z: 19,    halfW: 2.92, halfD: 2.92, reason: 'sports-NW' },
  { x: -20,   z: 12,    halfW: 2.42, halfD: 3.92, reason: 'transit-W' },
  { x: 19,    z: 19,    halfW: 2.92, halfD: 2.92, reason: 'research-NE' },
  { x: -20,   z: -13,   halfW: 2.42, halfD: 2.92, reason: 'data-W' }
]

export function isReserved(x: number, z: number): boolean {
  for (const zone of RESERVED_ZONES) {
    if (zone.halfW !== undefined && zone.halfD !== undefined) {
      // Rectangular (OBB) exclusion — local-space half-extent check after
      // un-rotating the query point. Inflated halves already include the
      // expected procedural house footprint + buffer so we can safely match
      // on lot centre.
      const dx = x - zone.x
      const dz = z - zone.z
      const rot = zone.rot ?? 0
      const cos = Math.cos(-rot)
      const sin = Math.sin(-rot)
      const lx = dx * cos - dz * sin
      const lz = dx * sin + dz * cos
      if (Math.abs(lx) < zone.halfW && Math.abs(lz) < zone.halfD) return true
    } else if (zone.r !== undefined) {
      if (Math.hypot(x - zone.x, z - zone.z) < zone.r) return true
    }
  }
  return false
}

/** Procedural houses' worst-case half-extent (1.2×1.2 outer-ring villa
 *  including the 0.02 shape-spec inflation). Used to inflate masterplan
 *  exclusion zones so that even an oversized house centred on the boundary
 *  has room to clear the masterplan building's edge. */
const PROCEDURAL_HOUSE_HALF_MAX = 0.62

/** Buffer between masterplan building edge and the nearest procedural house
 *  edge. Big enough to read as a clear sidewalk strip, not so big that
 *  surrounding lots all get wiped out. */
const MASTERPLAN_BUFFER = 0.3

/** Reserve-check that ALSO avoids hand-placed masterplan buildings. The
 *  procedural infill runs INSIDE residential blocks alongside the masterplan
 *  hero buildings, so we need to clear their footprints in addition to the
 *  static RESERVED_ZONES list.
 *
 *  Uses an OBB check (axis-aligned local-space) inflated by the procedural
 *  house's worst-case half-extent plus a fixed buffer. The earlier circle-
 *  on-centre check let buildings whose centres sat just outside the radius
 *  clip the masterplan footprint with their visible body (e.g. E-EDGE-RES-01
 *  vs apartment@(18,-4) had a 0.17×0.67 overlap). With the OBB+inflation
 *  check the worst-case house centred on the exclusion boundary still ends
 *  up `MASTERPLAN_BUFFER` from the masterplan edge. */
function isReservedOrMasterplan(x: number, z: number): boolean {
  if (isReserved(x, z)) return true
  for (const b of MASTERPLAN_BUILDINGS) {
    const fp = buildingVisualFootprint(b)
    const inflatedW = fp.halfW + PROCEDURAL_HOUSE_HALF_MAX + MASTERPLAN_BUFFER
    const inflatedD = fp.halfD + PROCEDURAL_HOUSE_HALF_MAX + MASTERPLAN_BUFFER
    const dx = x - b.pos[0]
    const dz = z - b.pos[1]
    const rot = b.rot ?? 0
    const cos = Math.cos(-rot)
    const sin = Math.sin(-rot)
    const lx = dx * cos - dz * sin
    const lz = dx * sin + dz * cos
    if (Math.abs(lx) < inflatedW && Math.abs(lz) < inflatedD) return true
  }
  return false
}

// -----------------------------------------------------------------------------
// Suburban falloff belt — the "outskirts" ring that bridges the dense core to
// the distant ridges so the city stops reading as an island ringed by a road
// moat. Sparse low-rise housing in the frame OUTSIDE the ±24/±22 core block
// rectangle, density decreasing outward, reusing the same outer-residential
// generator (types / sizes / palettes) for visual coherence.
//
// CRITICAL — verify-layout discipline:
//   - Output carries the `procedural` identity (no masterplan pos match), so
//     it auto-enters the verifier's proc↔{placement,masterplan,proc} pairwise
//     overlap checks. Those are ZERO-tolerance (any overlap > 0 fails). So we
//     place incrementally with an explicit no-overlap gate (GAP clearance)
//     against the core procedural buildings, the masterplan heroes AND the
//     PLACEMENTS facilities — exactly the populations the verifier checks.
//   - Footprint AABB is computed with the SAME obbToAABB the verifier uses, so
//     the generator gate and the verifier never diverge.
//   - onRoad / onStub keep the belt off asphalt.
// -----------------------------------------------------------------------------

interface AvoidBox {
  x: number
  z: number
  hw: number
  hd: number
}

/** World-AABB of a building using the verifier's footprint + rotation math. */
function buildingAABB(b: Pick<BuildingDef, 'pos' | 'w' | 'd' | 'rot' | 'shapeId' | 'visualFootprint'>): AvoidBox {
  const fp = buildingVisualFootprint(b as BuildingDef)
  const a = obbToAABB(fp.halfW, fp.halfD, b.rot, fp.sweepR ?? 0)
  return { x: b.pos[0], z: b.pos[1], hw: a.halfW, hd: a.halfD }
}

/** Cardinal "face the CommandTower at (0,0)" rotation — same octant logic the
 *  core generator uses for apartments. Keeps the belt AABB predictable
 *  (cardinal rot → obbToAABB just swaps halfW/halfD). */
function faceCenterRot(x: number, z: number): number {
  return Math.abs(x) >= Math.abs(z)
    ? x > 0 ? -Math.PI / 2 : Math.PI / 2
    : z > 0 ? Math.PI : 0
}

const OUTSKIRTS_SEED_BASE = 100000

// Disabled 2026-05-27: the first execution of the suburban falloff belt read
// as "severed + sparse" against the detailed core. Kept wired (verify
// integration intact) behind this flag so a reworked version can re-enable by
// flipping it back to true — no need to re-thread the generator/verify seams.
const OUTSKIRTS_ENABLED = false

function buildOutskirtsBelt(coreProcedural: BuildingDef[]): BuildingDef[] {
  if (!OUTSKIRTS_ENABLED) return []
  const result: BuildingDef[] = []

  // Avoid-set = every population the verifier will pairwise-check us against.
  const placed: AvoidBox[] = []
  for (const b of coreProcedural) placed.push(buildingAABB(b))
  for (const b of buildMasterplanCity()) placed.push(buildingAABB(b))
  for (const p of PLACEMENTS) {
    if (p.airborne) continue
    const a = obbToAABB(p.halfW, p.halfD, p.rot ?? 0, p.sweepR ?? 0)
    placed.push({ x: p.x, z: p.z, hw: a.halfW, hd: a.halfD })
  }

  const STEP = 2.4 // candidate grid pitch
  const JITTER = 0.9 // ± world jitter so it isn't a clock-face
  const OUTER_R = 38 // outer extent (ground plane is ±40, fade ring starts 40)
  const FRAME = 14 // falloff depth (m) measured outward from the core rect
  const RECT_HALF_X = 24.8 // core BLOCKS own |x| ≤ this
  const RECT_HALF_Z = 22.8 // core BLOCKS own |z| ≤ this
  const GAP = 0.5 // clearance so the verifier's >0 overlap never trips

  let seed = OUTSKIRTS_SEED_BASE
  for (let gx = -OUTER_R; gx <= OUTER_R + 1e-3; gx += STEP) {
    for (let gz = -OUTER_R; gz <= OUTER_R + 1e-3; gz += STEP) {
      seed += 1
      const x = gx + (rng(seed * 2.3) - 0.5) * JITTER
      const z = gz + (rng(seed * 2.3 + 1) - 0.5) * JITTER
      if (Math.hypot(x, z) > OUTER_R) continue

      // Only fill the frame OUTSIDE the core block rectangle. The annulus
      // corners that fall INSIDE the rect are already built by the core BLOCKS.
      const outDist = Math.max(Math.abs(x) - RECT_HALF_X, Math.abs(z) - RECT_HALF_Z)
      if (outDist <= 0) continue
      if (outDist > FRAME) continue

      // Density falloff: dense at the perimeter (outDist→0 ⇒ p→1), thinning to
      // ~0.07 at the frame edge.
      const p = Math.pow(Math.max(0, 1 - outDist / FRAME), 1.4)
      if (rng(seed * 11) > p) continue

      if (isReservedOrMasterplan(x, z)) continue

      const type = pickTypeForDistrict('outer-residential', rng(seed * 11 + 100))
      const size = sizeForType(type, rng(seed * 11 + 3))
      const w = size.w
      const d = size.d
      // Keep the belt low + stepping down outward so its silhouette settles
      // into the ridges rather than competing with the core skyline.
      const outerT = Math.min(1, outDist / FRAME)
      const h = Math.max(0.5, Math.min(size.h, 3.2) * (1 - outerT * 0.4))

      const rot = faceCenterRot(x, z)
      const box = buildingAABB({ pos: [x, z], w, d, rot })
      const halfFoot = Math.max(box.hw, box.hd)
      if (onRoad(x, z, halfFoot)) continue
      if (onStub(x, z, halfFoot)) continue

      let clash = false
      for (const b of placed) {
        if (
          box.hw + b.hw + GAP - Math.abs(x - b.x) > 0 &&
          box.hd + b.hd + GAP - Math.abs(z - b.z) > 0
        ) {
          clash = true
          break
        }
      }
      if (clash) continue

      placed.push({ x, z, hw: box.hw, hd: box.hd })

      const palette = pickPalette(type)
      const topHex = palette[Math.floor(rng(seed * 11 + 7) * palette.length)]
      const roofHex = ROOF_PALETTE[Math.floor(rng(seed * 11 + 11) * ROOF_PALETTE.length)]
      const variant = pickVariant(type, rng(seed * 11 + 13))
      result.push({
        pos: [x, z],
        w, d, h, rot, topHex, type, variant,
        hasRoofUnit: false, hasPV: false, hasRailing: false, roofHex,
        outskirts: true,
      })
    }
  }
  return result
}

// -----------------------------------------------------------------------------
// Generator — pure function. Deterministic via rng() seeds.
// -----------------------------------------------------------------------------

export function buildProceduralBuildings(): BuildingDef[] {
  const out: BuildingDef[] = []

  const BLOCK_REGEN: Record<string, number> = {
    '8,-8,16,8': 3,
  }

  let blockIdx = 0
  for (const block of BLOCKS) {
    const [x0, z0, x1, z1] = block.bounds
    const bw = x1 - x0
    const bd = z1 - z0
    const zoning = ZONING[block.district]

    // ---- Lot grid INSIDE block ----
    // Two-stage spacing:
    //   * BLOCK_ROAD_MARGIN (constant 1.0) — block edge → lot edge, keeps
    //     ALL buildings clear of road exclusion zones. Don't touch.
    //   * zoning.minSetback — applied later (lot edge → building face);
    //     shrinks the building footprint within an already-placed lot.
    // Cell size varies per district → visibly different lot density.
    const BLOCK_ROAD_MARGIN = 1.0
    const margin = BLOCK_ROAD_MARGIN
    const usableW = bw - 2 * margin
    const usableD = bd - 2 * margin
    const cellSize = zoning.cellSize
    const cols = Math.max(1, Math.floor(usableW / cellSize))
    const rows = Math.max(1, Math.floor(usableD / cellSize))
    const actualCellW = usableW / cols
    const actualCellD = usableD / rows
    const lotArea = actualCellW * actualCellD

    // Per-block seed namespace: cell-deterministic seed that is also
    // independent across blocks. This way bumping E block's regen counter
    // only reshuffles E block — outer-ring blocks downstream stay stable.
    const blockBoundsKey = block.bounds.join(',')
    const blockSeedBase = blockIdx * 1009 + (BLOCK_REGEN[blockBoundsKey] ?? 0) * 7919
    for (let cy = 0; cy < rows; cy++) {
      for (let cx = 0; cx < cols; cx++) {
        const seed = blockSeedBase + cy * 31 + cx + 1

        // Per-district empty-lot rate (CBD 5%, residential 25%, industrial 30%).
        if (rng(seed * 11) < zoning.emptyLotProbability) continue

        const x = x0 + margin + actualCellW * (cx + 0.5)
        const z = z0 + margin + actualCellD * (cy + 0.5)

        if (isReservedOrMasterplan(x, z)) continue

        const typeRoll = rng(seed * 11 + 100)
        const type = pickTypeForDistrict(block.district, typeRoll)
        let { w, d, h } = sizeForType(type, rng(seed * 11 + 3))

        // ---- Setback cap ----
        // Lot edge → building face = zoning.minSetback. Caps building
        // footprint to (lotCell - 2*setback). residential 0.5 → tight
        // little houses sitting in green; CBD 0.3 → towers nearly fill
        // their lot.
        const maxWFromSetback = Math.max(0.6, actualCellW - 2 * zoning.minSetback)
        const maxDFromSetback = Math.max(0.6, actualCellD - 2 * zoning.minSetback)
        if (w > maxWFromSetback) w = maxWFromSetback
        if (d > maxDFromSetback) d = maxDFromSetback

        // ---- Coverage cap ----
        // After setback, building footprint also can't exceed
        // `coverageRatio * lotArea`. If still too big, scale down
        // proportionally. (Usually setback already handles this — this is
        // a backup for super-thin/elongated buildings.)
        const proposedArea = w * d
        const maxFootprintArea = lotArea * zoning.coverageRatio
        if (proposedArea > maxFootprintArea) {
          const scale = Math.sqrt(maxFootprintArea / proposedArea)
          w *= scale
          d *= scale
        }

        // ---- Height cap ----
        // Two caps: hard maxHeight + FAR-derived cap. Take the smaller.
        // FAR cap: total floor area = footprint * floors; total ≤ FAR * lotArea
        // ⇒ floors ≤ FAR * lotArea / (w * d); h ≤ floors * STOREY_HEIGHT
        const farFloors = (zoning.far * lotArea) / Math.max(w * d, 0.01)
        const farHeight = farFloors * STOREY_HEIGHT
        h = Math.min(h, zoning.maxHeight, farHeight)
        // Don't let buildings shrink below half their typed minimum — keeps
        // skyscrapers in CBD recognisable even if FAR math gets aggressive.
        h = Math.max(h, 0.6)

        // ---- Road final safety ----
        const halfFoot = Math.max(w, d) / 2 + 0.3
        if (onRoad(x, z, halfFoot)) continue

        // ---- Rotation: cardinal directions only (no jitter) ----
        // Apartments ALWAYS face the CommandTower at (0, 0) — balcony "looks
        // at" the city centre. Other residential / non-residential types keep
        // the 40 % face-centre / 60 % face-nearest-road mix for variety.
        //
        // The original face-centre block had the z-axis branch swapped
        // (z>0 → rot=0 made balconies face +z = away from centre); fixed
        // here to `z > 0 ? Math.PI : 0` so the north-of-centre case faces
        // south = toward (0, 0).
        const faceCenterRot =
          Math.abs(x) >= Math.abs(z)
            ? (x > 0 ? -Math.PI / 2 : Math.PI / 2)  // east of centre → face west; west → face east
            : (z > 0 ? Math.PI : 0)                  // north of centre → face south; south → face north
        let rot: number
        if (type === 'apartment') {
          rot = faceCenterRot
        } else if (rng(seed * 19 + 30) < 0.4) {
          rot = faceCenterRot
        } else {
          const distToWest = x - x0
          const distToEast = x1 - x
          const distToSouth = z - z0
          const distToNorth = z1 - z
          const minDist = Math.min(distToWest, distToEast, distToSouth, distToNorth)
          if (minDist === distToSouth) rot = 0
          else if (minDist === distToNorth) rot = Math.PI
          else if (minDist === distToEast) rot = Math.PI / 2
          else rot = -Math.PI / 2
        }

        const palette = pickPalette(type)
        const topHex = palette[Math.floor(rng(seed * 11 + 7) * palette.length)]
        const roofHex = ROOF_PALETTE[Math.floor(rng(seed * 11 + 11) * ROOF_PALETTE.length)]
        const hasRoofUnit = type === 'office' && rng(seed * 11 + 8) > 0.5 && h > 1.6

        // ---- Rooftop PV: zoning-driven, with type blacklist ----
        // residential → 70%, midrise → 60%, commercial → 50%, cbd/industrial → 40-50%.
        // Skyscrapers + factories never get PV (curtain walls / heat venting).
        const hasPV =
          !NO_PV_TYPES.has(type) &&
          rng(seed * 11 + 14) < zoning.roofPVProbability

        const hasRailing = type === 'office' && h > 2.2 && rng(seed * 11 + 10) > 0.55
        const variant = pickVariant(type, rng(seed * 11 + 13))
        out.push({
          pos: [x, z],
          w, d, h, rot, topHex, type, variant,
          hasRoofUnit, hasPV, hasRailing, roofHex
        })
      }
    }
    blockIdx++
  }

  // Suburban falloff belt — appended last so it can avoid every core building
  // already placed in `out`.
  out.push(...buildOutskirtsBelt(out))

  return out
}

// -----------------------------------------------------------------------------
// JSON overrides — manual + future OSM/Overture/CityJSON import path (M7).
//
// Today: src/data/buildings-manual.json holds an empty `buildings` array;
// loadOverridesFromJSON() returns no overrides and buildCity() emits a
// pure-procedural city.
//
// Future use cases the seam is designed for:
//   - Hand-tuning a hero building (override topHex / h / variant by pos).
//   - Importing a small OSM/Overture region: write an adapter that produces
//     `BuildingOverride[]` from the foreign schema; M7 below merges them.
//   - A/B testing layouts: drop a different JSON in.
//
// Merge rules:
//   - An override with `pos` within MATCH_RADIUS (0.5m) of a procedural
//     building REPLACES that building's fields (partial merge).
//   - An override with no matching procedural building APPENDS as new.
//   - Procedural buildings with no override pass through unchanged.
//
// Schema is intentionally minimal — JSON shapes that follow BuildingDef
// load directly. Stricter parsing (zod, etc.) is for if/when an external
// data source actually lands.
// -----------------------------------------------------------------------------

const MATCH_RADIUS_M = 0.5

/** Same shape as BuildingDef but every field optional. The merger fills
 *  missing fields from the matched procedural building, or from defaults
 *  when there's no match (a brand-new appended building). */
export type BuildingOverride = Partial<BuildingDef> & {
  /** REQUIRED — the merger uses this to find / append. */
  pos: [number, number]
}

interface BuildingsManualFile {
  buildings: BuildingOverride[]
  [k: string]: unknown
}

export function loadOverridesFromJSON(): BuildingOverride[] {
  const file = buildingsManual as BuildingsManualFile
  if (!Array.isArray(file.buildings)) return []
  return file.buildings
}

/** Merge an override into a base BuildingDef. Unspecified override fields
 *  fall through to the base. */
function mergeOverride(base: BuildingDef, ov: BuildingOverride): BuildingDef {
  return {
    pos:        ov.pos        ?? base.pos,
    w:          ov.w          ?? base.w,
    d:          ov.d          ?? base.d,
    h:          ov.h          ?? base.h,
    rot:        ov.rot        ?? base.rot,
    topHex:     ov.topHex     ?? base.topHex,
    type:       ov.type       ?? base.type,
    variant:    ov.variant    ?? base.variant,
    hasRoofUnit:ov.hasRoofUnit ?? base.hasRoofUnit,
    hasPV:      ov.hasPV      ?? base.hasPV,
    hasRailing: ov.hasRailing ?? base.hasRailing,
    roofHex:    ov.roofHex    ?? base.roofHex,
    useCategory: ov.useCategory ?? base.useCategory,
    heightBand: ov.heightBand ?? base.heightBand,
    shapeCategory: ov.shapeCategory ?? base.shapeCategory,
    shapeFamily: ov.shapeFamily ?? base.shapeFamily,
    shapeId: ov.shapeId ?? base.shapeId,
    labelZh: ov.labelZh ?? base.labelZh,
    requiredSilhouetteFeatures: ov.requiredSilhouetteFeatures ?? base.requiredSilhouetteFeatures,
    supportKind: ov.supportKind ?? base.supportKind,
    visualFootprint: ov.visualFootprint ?? base.visualFootprint
  }
}

/** Synthesize a BuildingDef for a brand-new appended override (no
 *  procedural match). Override must carry enough fields to produce a
 *  renderable building — `pos`, `w`, `d`, `h`, `type`, `variant`. Other
 *  fields fall back to safe defaults. */
function synthesizeFromOverride(ov: BuildingOverride): BuildingDef | null {
  if (
    !ov.pos ||
    ov.w == null || ov.d == null || ov.h == null ||
    !ov.type || !ov.variant
  ) {
    // Not enough info to render — bail rather than render a half-built
    // building.
    return null
  }
  const palette = pickPalette(ov.type)
  return {
    pos:        ov.pos,
    w:          ov.w,
    d:          ov.d,
    h:          ov.h,
    rot:        ov.rot ?? 0,
    topHex:     ov.topHex ?? palette[0],
    type:       ov.type,
    variant:    ov.variant,
    hasRoofUnit:ov.hasRoofUnit ?? false,
    hasPV:      ov.hasPV ?? false,
    hasRailing: ov.hasRailing ?? false,
    roofHex:    ov.roofHex ?? ROOF_PALETTE[0],
    useCategory: ov.useCategory,
    heightBand: ov.heightBand,
    shapeCategory: ov.shapeCategory,
    shapeFamily: ov.shapeFamily,
    shapeId: ov.shapeId,
    labelZh: ov.labelZh,
    requiredSilhouetteFeatures: ov.requiredSilhouetteFeatures,
    supportKind: ov.supportKind,
    visualFootprint: ov.visualFootprint
  }
}

/** Top-level entry: procedural city + JSON overrides merged.
 *
 *  Today this is what CityScene.tsx and the verify-layout CLI both call.
 *  `loadOverridesFromJSON()` returns [] by default so the output equals
 *  `buildProceduralBuildings()` for a clean checkout — visual regression
 *  zero unless someone edits src/data/buildings-manual.json. */
// Module-level cache — buildCity() is deterministic on a constant rng seed,
// so the result is identical across calls within a process. Caching it
// removes a hidden duplication risk: pre-cache, Buildings.tsx and the tree
// layout each invoked buildCity() independently, relying on RNG determinism
// to stay in sync. Any future stochastic change would have silently broken
// that contract.
let _cachedCity: BuildingDef[] | null = null

/** Reset the module-level cache. Tests should call this before/after any
 *  mutation of the inputs (rng seeds, overrides JSON, masterplan). Not used
 *  in production — buildCity is deterministic. */
export function _resetCityCache(): void {
  _cachedCity = null
}

export function buildCity(): BuildingDef[] {
  if (_cachedCity) return _cachedCity
  // Hero/landmark buildings come from the hand-placed masterplan; residential
  // infill comes from the zoning-driven procedural generator. The procedural
  // generator already skips every masterplan footprint via
  // isReservedOrMasterplan(), so concatenation is collision-safe.
  const masterplan = buildMasterplanCity()
  const procedural = buildProceduralBuildings()
  const base = [...masterplan, ...procedural]

  const overrides = loadOverridesFromJSON()
  if (overrides.length === 0) {
    _cachedCity = base
    return _cachedCity
  }

  const result = [...base]
  for (const ov of overrides) {
    // Find the procedural building closest to ov.pos within MATCH_RADIUS.
    let bestIdx = -1
    let bestDist = MATCH_RADIUS_M
    for (let i = 0; i < result.length; i++) {
      const b = result[i]
      const dist = Math.hypot(b.pos[0] - ov.pos[0], b.pos[1] - ov.pos[1])
      if (dist < bestDist) {
        bestDist = dist
        bestIdx = i
      }
    }
    if (bestIdx >= 0) {
      result[bestIdx] = mergeOverride(result[bestIdx], ov)
    } else {
      const synthesized = synthesizeFromOverride(ov)
      if (synthesized) result.push(synthesized)
    }
  }
  _cachedCity = result
  return _cachedCity
}
