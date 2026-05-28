// =============================================================================
// Visual halo lookup — the ONLY source for "how big does this placement read
// to a viewer" data, used by tree placement + auditor to avoid the tree-vs-
// shadow-disc overlaps the bare PLACEMENTS halfW/halfD doesn't catch.
//
// Three concepts coexist in this codebase — they look similar but mean
// different things, so they MUST stay distinct:
//
//   1. PLACEMENTS halfW/halfD   — structural footprint (road / overlap check).
//                                  Smallest of the three. Hard collision only.
//   2. SHOWROOM_ANCHOR_REGISTRY bound — click hitbox + camera framing volume.
//                                  Often larger than the structural OBB.
//   3. visualBound() output     — true visual extent (shadow disc + status
//                                  ring + canopy + parked vehicles). Used
//                                  ONLY for tree avoidance, not collision.
//
// Why we can't merge: the structural OBB has to stay small enough that the
// pre-commit verifier doesn't flag PS-04-CR's parking pad as on the z=16
// road. But the visual halo (with cars + shadow + LED tile) legitimately
// reaches the road edge. Trees should keep clear of that halo even though
// the verifier doesn't flag it. Hence this module: one place for the visual-
// extent superset, consumed by treeLayout.
// =============================================================================

import { type Placement } from './layout'
import {
  SHOWROOM_ANCHOR_REGISTRY,
  SHOWROOM_ANCHOR_PLACEMENT_IDS,
  type ShowroomAnchorId
} from './showroomContract'

/** Visible shadow-disc radius for facilities that draw one beyond their OBB. */
const KIND_HALO_R: Record<string, number> = {
  'pv-CarRow':      1.20,
  'pv-BatteryBank': 1.45,
  'pv-SolarFarm':   1.45,
}

/** Extra breathing room a tree should keep beyond the OBB+halo. Calibrated
 *  per kind from playtesting iso-view collisions. */
const KIND_TREE_BUFFER: Record<string, number> = {
  'EVChargingStation': 0.6,  // canopy + cars + cyan LED tile feels large
  'pv-CarRow':         0.4,  // shadow disc + status ring extend
  'pv-SolarFarm':      0.3,
  'pv-BatteryBank':    0.3,
  'WindFarmHill':      0.4,  // 3 mini turbines + hill base
  'TransmissionTower': 0.3,  // tall + guy-wires visually claim space
  'Crane':             0.4,
}

/** Reverse lookup: placement id → showroom anchor id (if the placement is the
 *  primary of an anchor group). */
const PLACEMENT_ID_TO_ANCHOR_ID: Record<string, ShowroomAnchorId> = (() => {
  const out: Record<string, ShowroomAnchorId> = {}
  for (const anchorId of Object.keys(SHOWROOM_ANCHOR_PLACEMENT_IDS) as ShowroomAnchorId[]) {
    for (const pid of SHOWROOM_ANCHOR_PLACEMENT_IDS[anchorId]) out[pid] = anchorId
  }
  return out
})()

export interface VisualBound {
  /** Visual OBB halfW (in local x, before rotation). Max of PLACEMENTS halfW
   *  and anchor.bound.w / 2 when an anchor exists. */
  halfW: number
  halfD: number
  /** Shadow-disc radius if the placement draws one beyond its OBB; null otherwise. */
  haloR: number | null
  /** Per-kind tree-avoidance breathing room. Added on top of any caller-
   *  supplied buffer. 0 for kinds without a specific calibration. */
  treeBuffer: number
}

/** Visual extent of a placement — combines PLACEMENTS halfW/halfD with the
 *  anchor bound (when larger), the per-kind halo radius, and the per-kind
 *  tree buffer. Single entry point for "how big does this read visually". */
export function visualBound(p: Placement): VisualBound {
  let halfW = p.halfW
  let halfD = p.halfD
  const anchorId = PLACEMENT_ID_TO_ANCHOR_ID[p.id]
  if (anchorId) {
    const anchor = SHOWROOM_ANCHOR_REGISTRY[anchorId]
    if (anchor && Math.abs(anchor.position[0] - p.x) < 0.5 && Math.abs(anchor.position[2] - p.z) < 0.5) {
      halfW = Math.max(halfW, anchor.bound.w / 2)
      halfD = Math.max(halfD, anchor.bound.d / 2)
    }
  }
  return {
    halfW,
    halfD,
    haloR: KIND_HALO_R[p.kind] ?? null,
    treeBuffer: KIND_TREE_BUFFER[p.kind] ?? 0,
  }
}
