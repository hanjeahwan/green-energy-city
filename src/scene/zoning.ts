// =============================================================================
// District zoning rules — the procedural city's planning code.
//
// The pre-zoning generator (`genBuildings` in CityScene.tsx) used a single
// fixed 2.6m cell grid, a uniform 1.0m road margin, a 15% empty-lot rate,
// and ad-hoc rooftop-PV probabilities. That made every district look the
// same: a Lego grid of equal-sized boxes. Per the
// `research_3d_city_ground_buildings_20260522.md` report (§3 "道路与城市
// 规划"), real urban variety comes from per-district FAR / setback /
// coverage / lot density rules.
//
// This file holds those rules as plain data. The cityGenerator consumes
// `ZONING[block.district]` when slicing lots and sizing buildings.
//
// Rule-of-thumb numbers tuned for "明显可辨" (user-confirmed visual goal):
//   - CBD must look denser, taller, more packed than midrise.
//   - residential must show generous setback + green gaps.
//   - industrial must read as low-slung, sparse, with bigger lots.
//   - midrise / commercial sit between them.
//
// These are starting values — expected to be tuned during C3 screenshots.
// =============================================================================

import type { District } from '../elements/types'

export interface DistrictZoning {
  // -------- Lot subdivision --------

  /** Base edge length of a single buildable lot, before per-lot variation.
   *  Smaller → more lots per block → denser feel. */
  cellSize: number

  /** Setback (m) from lot edges before placing the building footprint.
   *  Bigger setback → more visible green/sidewalk strip around each lot. */
  minSetback: number

  /** 0..1 probability that a candidate lot is skipped (green space, plaza,
   *  parking). Higher → sparser district. */
  emptyLotProbability: number

  // -------- Building massing --------

  /** Hard ceiling (m) on building height for this district.
   *  `sizeForType()` proposes a height; the lot generator clamps to this. */
  maxHeight: number

  /** Floor-area ratio. Used together with `coverageRatio` and an assumed
   *  storey height (3m) to cap building height to `(lotArea * far) /
   *  (footprintArea / coverageRatio) / 3`. CBD wants high FAR + high
   *  coverage; residential wants low FAR + low coverage. */
  far: number

  /** Max ratio of footprint area to lot area. Bigger → buildings hug lot
   *  edges (urban); smaller → buildings sit in middle of lot (suburban). */
  coverageRatio: number

  // -------- Rooftop energy --------

  /** Probability a building in this district receives rooftop PV.
   *  Replaces the previous ad-hoc `type === 'office' || ...` rule.
   *  Per-type blacklist still applies (factories, skyscrapers never get
   *  rooftop PV regardless of this number). */
  roofPVProbability: number
}

export const ZONING: Record<District, DistrictZoning> = {
  // Dense skyline cluster — CBD must dominate any view of the city.
  cbd: {
    cellSize: 3.0,
    minSetback: 0.3,
    emptyLotProbability: 0.05,
    maxHeight: 12,
    far: 8.0,
    coverageRatio: 0.75,
    // Dropped from 0.4 — most CBD lots are skyscrapers (NO_PV) anyway,
    // but the occasional office/apartment shouldn't all have PV either.
    roofPVProbability: 0.2
  },
  // Office / apartment mid-rise belt — clearly shorter than CBD, more breath.
  midrise: {
    cellSize: 2.6,
    minSetback: 0.4,
    emptyLotProbability: 0.10,
    maxHeight: 4.0,
    far: 2.5,
    coverageRatio: 0.6,
    // Dropped from 0.6 — a "PV showroom" feel happens above ~0.4.
    roofPVProbability: 0.35
  },
  // Commercial strip — mostly office + some apartment, plaza-scale fronts.
  commercial: {
    cellSize: 2.8,
    minSetback: 0.35,
    emptyLotProbability: 0.08,
    maxHeight: 6.0,
    far: 3.5,
    coverageRatio: 0.65,
    // Dropped from 0.5.
    roofPVProbability: 0.3
  },
  // Houses + townhouses + low-rise apartments. The city is now residential
  // first; previous values were tuned for a marginal western strip and gave
  // a sparse, "village in a corner" feel that didn't fill the freed mid-blocks.
  //   - maxHeight 3 → 5: lets green-apartments / standard apartment blocks
  //     reach ~2-3 stories, giving the residential zones visible silhouette
  //     variety against the single CBD anchor.
  //   - emptyLotProbability 0.25 → 0.12: fewer skipped lots, more "filled".
  //   - cellSize 2.2 → 2.0: denser lot grid, closer to a real neighbourhood.
  //   - far 1.2 → 2.0 + coverage 0.45 → 0.55: gives the height cap room to
  //     actually apply on small lots without FAR clamping it back to 1m.
  residential: {
    cellSize: 2.0,
    minSetback: 0.45,
    emptyLotProbability: 0.12,
    maxHeight: 5.0,
    far: 2.0,
    coverageRatio: 0.55,
    // Dropped from 0.7. User reported residential houses looked like a
    // "solar showroom" — small dwellings shouldn't all have rooftop PV.
    roofPVProbability: 0.35
  },
  // Outer-ring residential — sparser than 'residential' on every axis. Used
  // for the Phase 2 BLOCKS between the existing ±16 ring and the new outer
  // avenues (±22/±24). The N / E / W edge strips otherwise produced 24-32
  // buildings each because they're 32u long; we want maybe 8-12 per strip
  // with visible green gaps so the new civic landmarks (university, sports
  // complex, etc.) read as the focal point rather than dwarfed by infill.
  'outer-residential': {
    // Tuned middle ground — aim for 12-16 buildings per long 32u strip.
    // Match 'residential' cellSize (2.0) so the lot grid is the same; the
    // sparseness comes purely from emptyLotProbability + reserved zones.
    cellSize: 2.0,
    minSetback: 0.45,
    emptyLotProbability: 0.22,
    maxHeight: 3.5,
    far: 1.5,
    coverageRatio: 0.5,
    roofPVProbability: 0.25
  },
  // Warehouses + factories — low-slung, big lots, lots of empty (yards).
  industrial: {
    cellSize: 3.4,
    minSetback: 0.6,
    emptyLotProbability: 0.30,
    maxHeight: 2.5,
    far: 1.4,
    coverageRatio: 0.5,
    // Dropped from 0.5. Factories don't get PV anyway (NO_PV_TYPES) so
    // this only affects warehouses; keep it modest.
    roofPVProbability: 0.3
  }
}

/** Types that NEVER get rooftop PV regardless of district probability.
 *  Skyscrapers have curtain walls / wind issues; factories vent heat.
 *  Houses removed by user request — pitched/shed roof PV on small dwellings
 *  kept clipping into the slope geometry and the panels read as visual noise
 *  on tiny footprints anyway. Cleaner to suppress them outright than to keep
 *  tweaking offsets per variant. */
export const NO_PV_TYPES = new Set(['skyscraper', 'factory', 'house'])
