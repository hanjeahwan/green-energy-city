// =============================================================================
// Tree placement algorithm — pure module, no three.js, no JSX.
//
// Replaces the old 90-iteration radial ring scatter in Trees.tsx that ignored
// districts, buildings, and most facility footprints. New model:
//
//   • Plaza ring — 10 attempts in a 5.4–7.2u ring around the central
//     CommandTower, mixed variants (palm-heavy + broadleaf).
//   • Block interior — district-aware rejection sample inside each BLOCK from
//     `BLOCKS` (residential: ~9 trees / block, CBD: ~5 / block).
//   • VerticalFarmPlanters at 3 explicit plaza positions (was 40% of every
//     tree everywhere, which looked weird in residential interiors).
//
// Collision sources checked (every candidate):
//   1. Roads — `onRoad(x, z, treeFootprint)`
//   2. PLACEMENTS — OBB-vs-point against every facility (EV station, water
//      tanks, billboards, bench planters, wind farm, container stacks, etc.)
//   3. Procedural buildings — `buildCity()` output, circle approximation
//   4. VFP self-placements — 0.5u radius exclusion
//   5. Previously placed trees — TREE_TO_TREE minimum spacing
//
// Variant probabilities are district-weighted so the 4 species feel contextual.
//
// `verifyTrees(placements)` returns Violation[] in the same shape that
// LayoutAuditBanner consumes — actual overlap detection (zero buffer) so the
// audit catches what the placement-time buffer missed.
// =============================================================================

import { rng } from '../components/sceneMaterials'
import { buildCity } from './cityGenerator'
import { onRoad } from './exclusion'
import { PLACEMENTS, type Placement, type Violation } from './layout'
import { BLOCKS } from './spatialZones'
import { visualBound } from './visualHalo'
import type { District } from '../elements/types'

export type TreeVariant = 'classic' | 'modern' | 'palm' | 'broadleaf'
export type TreeKind = 'tree' | 'farm-planter'

export interface TreePlacement {
  x: number
  z: number
  rot: number
  scale: number
  variant: TreeVariant
  kind: TreeKind
  /** Per-tree wind-sway phase in [0, 2π), deterministic from seed. */
  swayPhase: number
}

export type ZoneKind = 'plaza' | 'cbd' | 'residential' | 'edge'

// --- tuning constants ---
// PLACEMENT_BUFFER = 0.6 is a global default. Per-kind extra breathing room
// (EVChargingStation, pv-CarRow, etc.) lives in src/scene/visualHalo.ts so
// all "visual extent" data sits in one module instead of being scattered.
const TREE_FOOTPRINT = 0.5    // road-edge gap (tree disc radius for road check)
const PLACEMENT_BUFFER = 0.6  // gap between tree center and any PLACEMENTS OBB face
const BUILDING_BUFFER = 0.6   // gap from procedural-building bounding rect
const VFP_BUFFER = 0.7        // gap from a VerticalFarmPlanter center
const TREE_TO_TREE = 1.5      // gap between two trees
const BLOCK_INSET = 0.6       // margin from block edge to avoid the curb
const PLAZA_RING_R0 = 6.4   // outside PV+EV exclusion zones at most angles
const PLAZA_RING_R1 = 7.6
const PLAZA_RING_COUNT = 18   // attempts; survivors after collision ~5–7

const RESIDENTIAL_TARGET = 9
const CBD_TARGET = 5
const RESIDENTIAL_ATTEMPTS = 200
const CBD_ATTEMPTS = 100

// --- canopy radii (used by verifyTrees, NOT by placement collision) ---
const TREE_CANOPY: Record<TreeVariant, number> = {
  classic:   0.35,
  modern:    0.30,
  palm:      0.45,
  broadleaf: 0.55,
}
const VFP_RADIUS = 0.28  // VerticalFarmPlanter halfW = 0.2; +0.08 visual padding

/** Map (x,z) to its zone — used for variant weighting only. */
export function districtAt(x: number, z: number): ZoneKind {
  if (Math.abs(x) <= 8 && Math.abs(z) <= 8) return 'plaza'
  for (const b of BLOCKS) {
    const [x0, z0, x1, z1] = b.bounds
    const minX = Math.min(x0, x1), maxX = Math.max(x0, x1)
    const minZ = Math.min(z0, z1), maxZ = Math.max(z0, z1)
    if (x >= minX && x <= maxX && z >= minZ && z <= maxZ) {
      return b.district === 'cbd' ? 'cbd' : 'residential'
    }
  }
  return 'edge'
}

/** OBB-vs-point using the placement's visual bound (anchor-bound-aware), with
 *  caller `buffer` + per-kind tree breathing room applied. */
function inPlacementOBB(tx: number, tz: number, p: Placement, buffer: number): boolean {
  const vb = visualBound(p)
  const eff = buffer + vb.treeBuffer
  const dx = tx - p.x
  const dz = tz - p.z
  const rot = p.rot ?? 0
  const cos = Math.cos(-rot)
  const sin = Math.sin(-rot)
  const lx = dx * cos - dz * sin
  const lz = dx * sin + dz * cos
  return Math.abs(lx) < vb.halfW + eff && Math.abs(lz) < vb.halfD + eff
}

/** Combined hull check — collision if the point lies inside EITHER the OBB
 *  (anchor-bound-aware) OR the halo circle (shadow disc). Both expanded by
 *  `buffer` plus the per-kind tree breathing room. */
function inPlacementHull(tx: number, tz: number, p: Placement, buffer: number): boolean {
  if (inPlacementOBB(tx, tz, p, buffer)) return true
  const vb = visualBound(p)
  if (vb.haloR !== null) {
    const dx = tx - p.x
    const dz = tz - p.z
    const r = vb.haloR + buffer + vb.treeBuffer
    return dx * dx + dz * dz < r * r
  }
  return false
}

/** District-weighted variant + scale roll. `r` is a rng() in [0,1). */
function pickVariant(zone: ZoneKind, r: number): { variant: TreeVariant; scaleHint: 'normal' | 'sapling' } {
  if (zone === 'cbd') {
    if (r < 0.50) return { variant: 'modern',    scaleHint: 'normal' }
    if (r < 0.80) return { variant: 'palm',      scaleHint: 'normal' }
    if (r < 0.95) return { variant: 'broadleaf', scaleHint: 'normal' }
    return                { variant: 'classic',  scaleHint: 'normal' }
  }
  if (zone === 'plaza') {
    if (r < 0.30) return { variant: 'palm',      scaleHint: 'normal' }
    if (r < 0.60) return { variant: 'broadleaf', scaleHint: 'normal' }
    if (r < 0.85) return { variant: 'modern',    scaleHint: 'normal' }
    return                { variant: 'classic',  scaleHint: 'normal' }
  }
  if (r < 0.45) return { variant: 'classic',   scaleHint: 'normal'  }
  if (r < 0.75) return { variant: 'broadleaf', scaleHint: 'normal'  }
  if (r < 0.90) return { variant: 'modern',    scaleHint: 'normal'  }
  if (r < 0.95) return { variant: 'palm',      scaleHint: 'normal'  }
  return                { variant: 'classic',  scaleHint: 'sapling' }
}

interface CollisionCtx {
  trees: TreePlacement[]
  buildings: { pos: [number, number]; w: number; d: number }[]
}

function collides(x: number, z: number, ctx: CollisionCtx): boolean {
  if (onRoad(x, z, TREE_FOOTPRINT)) return true
  for (const p of PLACEMENTS) {
    if (inPlacementHull(x, z, p, PLACEMENT_BUFFER)) return true
  }
  for (const b of ctx.buildings) {
    const radius = Math.max(b.w, b.d) / 2 + BUILDING_BUFFER
    const dx = x - b.pos[0]
    const dz = z - b.pos[1]
    if (dx * dx + dz * dz < radius * radius) return true
  }
  for (const vfp of VFP_PLACEMENTS) {
    const dx = x - vfp.x
    const dz = z - vfp.z
    if (dx * dx + dz * dz < VFP_BUFFER * VFP_BUFFER) return true
  }
  for (const t of ctx.trees) {
    const dx = x - t.x
    const dz = z - t.z
    if (dx * dx + dz * dz < TREE_TO_TREE * TREE_TO_TREE) return true
  }
  return false
}

/** Explicit VerticalFarmPlanter positions (plaza-only). Tuned to sit between
 *  PV stations + CommandTower + EV station, off any road. Validated by
 *  verifyVFPPlacements() at module load. */
export const VFP_PLACEMENTS: ReadonlyArray<{ x: number; z: number; rot: number; variant: 'classic' | 'modern' }> = [
  // Hand-picked positions in the plaza ring's inner band (r ≈ 4.5–5.0u),
  // off-axis from the cardinal PV stations (PS-01..05 at radius 5) and EV
  // station (0,-5). Validated by verifyVFPPlacements() in Trees.tsx.
  { x: -3.5, z:  3.5, rot:  0.4, variant: 'classic' },
  { x:  3.5, z: -3.5, rot: -0.7, variant: 'modern' },
  { x:  3.0, z:  4.5, rot:  1.2, variant: 'classic' },
]

export function computeTreePlacements(): TreePlacement[] {
  const trees: TreePlacement[] = []
  const cityBuildings = buildCity().map((b) => ({ pos: b.pos, w: b.w, d: b.d }))
  const ctx: CollisionCtx = { trees, buildings: cityBuildings }

  // --- Step 1: plaza ring (around CommandTower at origin) ---
  for (let i = 0; i < PLAZA_RING_COUNT; i++) {
    const baseAngle = (Math.PI * 2 * i) / PLAZA_RING_COUNT
    const jitterAngle = (rng(i * 13.1 + 7) - 0.5) * (Math.PI / 5)
    const angle = baseAngle + jitterAngle
    const r = PLAZA_RING_R0 + rng(i * 13.1 + 8) * (PLAZA_RING_R1 - PLAZA_RING_R0)
    const x = Math.cos(angle) * r
    const z = Math.sin(angle) * r
    if (collides(x, z, ctx)) continue
    const variantRoll = rng(i * 13.1 + 9)
    const { variant, scaleHint } = pickVariant('plaza', variantRoll)
    const scale = scaleHint === 'sapling'
      ? 0.45 + rng(i * 13.1 + 10) * 0.10
      : 0.75 + rng(i * 13.1 + 10) * 0.30
    trees.push({
      x, z,
      rot: rng(i * 13.1 + 11) * Math.PI * 2,
      scale,
      variant,
      kind: 'tree',
      swayPhase: rng(i * 13.1 + 12) * Math.PI * 2,
    })
  }

  // --- Step 2: block-interior rejection sample ---
  let blockIdx = 0
  for (const block of BLOCKS) {
    const [x0, z0, x1, z1] = block.bounds
    const minX = Math.min(x0, x1) + BLOCK_INSET
    const maxX = Math.max(x0, x1) - BLOCK_INSET
    const minZ = Math.min(z0, z1) + BLOCK_INSET
    const maxZ = Math.max(z0, z1) - BLOCK_INSET
    const zone: ZoneKind = block.district === 'cbd' ? 'cbd' : 'residential'
    const target = zone === 'cbd' ? CBD_TARGET : RESIDENTIAL_TARGET
    const maxAttempts = zone === 'cbd' ? CBD_ATTEMPTS : RESIDENTIAL_ATTEMPTS

    let placed = 0
    for (let attempt = 0; attempt < maxAttempts && placed < target; attempt++) {
      const seed = blockIdx * 1009 + attempt * 17
      const x = minX + rng(seed + 1) * (maxX - minX)
      const z = minZ + rng(seed + 2) * (maxZ - minZ)
      if (collides(x, z, ctx)) continue
      const { variant, scaleHint } = pickVariant(zone, rng(seed + 3))
      const scale = scaleHint === 'sapling'
        ? 0.45 + rng(seed + 4) * 0.10
        : 0.70 + rng(seed + 4) * 0.40
      trees.push({
        x, z,
        rot: rng(seed + 5) * Math.PI * 2,
        scale,
        variant,
        kind: 'tree',
        swayPhase: rng(seed + 6) * Math.PI * 2,
      })
      placed++
    }
    blockIdx++
  }

  return trees
}

// =============================================================================
// Verification — runs against actual canopy radius (zero buffer) so it only
// fires on real visual overlap. Output shape matches verifyLayout()'s Violation
// so LayoutAuditBanner can render tree violations alongside layout ones.
// =============================================================================

/** Visual canopy radius of a tree, used for overlap detection (not placement). */
function treeRadius(t: TreePlacement): number {
  return TREE_CANOPY[t.variant] * t.scale
}

/** Audit every tree against PLACEMENTS, VFPs, roads, and pairwise trees.
 *  Uses CANOPY radii (not placement-time buffer) so it catches actual visual
 *  overlap — what the user sees, not what the algorithm tried to avoid. */
export function verifyTrees(placements: TreePlacement[]): Violation[] {
  const violations: Violation[] = []

  for (let i = 0; i < placements.length; i++) {
    const t = placements[i]
    const r = treeRadius(t)
    const treeLabel = `tree[${i}/${t.variant}]@(${t.x.toFixed(2)},${t.z.toFixed(2)})`

    if (onRoad(t.x, t.z, r)) {
      violations.push({
        kind: 'road',
        msg: `${treeLabel} canopy on road`,
        ids: [`tree-${i}`],
      })
    }

    for (const p of PLACEMENTS) {
      if (!inPlacementHull(t.x, t.z, p, r)) continue
      const vb = visualBound(p)
      let overlap: number
      if (vb.haloR !== null) {
        const d = Math.hypot(t.x - p.x, t.z - p.z)
        overlap = vb.haloR + r - d
      } else {
        overlap = Math.max(
          (vb.halfW + r) - Math.abs((t.x - p.x) * Math.cos(-(p.rot ?? 0)) - (t.z - p.z) * Math.sin(-(p.rot ?? 0))),
          (vb.halfD + r) - Math.abs((t.x - p.x) * Math.sin(-(p.rot ?? 0)) + (t.z - p.z) * Math.cos(-(p.rot ?? 0))),
        )
      }
      violations.push({
        kind: 'overlap',
        msg: `${treeLabel} overlaps ${p.kind} "${p.id}" by ${overlap.toFixed(2)}m`,
        ids: [`tree-${i}`, p.id],
      })
    }

    for (let v = 0; v < VFP_PLACEMENTS.length; v++) {
      const vfp = VFP_PLACEMENTS[v]
      const minD = r + VFP_RADIUS
      const dx = t.x - vfp.x
      const dz = t.z - vfp.z
      const d2 = dx * dx + dz * dz
      if (d2 < minD * minD) {
        violations.push({
          kind: 'overlap',
          msg: `${treeLabel} overlaps VFP[${v}]@(${vfp.x},${vfp.z}) by ${(minD - Math.sqrt(d2)).toFixed(2)}m`,
          ids: [`tree-${i}`, `vfp-${v}`],
        })
      }
    }

    for (let j = i + 1; j < placements.length; j++) {
      const u = placements[j]
      const r2 = treeRadius(u)
      const minD = r + r2
      const dx = t.x - u.x
      const dz = t.z - u.z
      const d2 = dx * dx + dz * dz
      if (d2 < minD * minD) {
        violations.push({
          kind: 'overlap',
          msg: `${treeLabel} overlaps tree[${j}/${u.variant}]@(${u.x.toFixed(2)},${u.z.toFixed(2)}) by ${(minD - Math.sqrt(d2)).toFixed(2)}m`,
          ids: [`tree-${i}`, `tree-${j}`],
        })
      }
    }
  }

  return violations
}

/** Audit VFP_PLACEMENTS against PLACEMENTS + roads. Static check — only fires
 *  if a hand-tuned VFP position drifts into a facility footprint. */
export function verifyVFPPlacements(): Violation[] {
  const violations: Violation[] = []
  for (let i = 0; i < VFP_PLACEMENTS.length; i++) {
    const vfp = VFP_PLACEMENTS[i]
    const label = `VFP[${i}]@(${vfp.x},${vfp.z})`
    if (onRoad(vfp.x, vfp.z, VFP_RADIUS)) {
      violations.push({ kind: 'road', msg: `${label} on road`, ids: [`vfp-${i}`] })
    }
    for (const p of PLACEMENTS) {
      if (inPlacementHull(vfp.x, vfp.z, p, VFP_RADIUS)) {
        violations.push({
          kind: 'overlap',
          msg: `${label} overlaps ${p.kind} "${p.id}"`,
          ids: [`vfp-${i}`, p.id],
        })
      }
    }
  }
  return violations
}

export type { District }
