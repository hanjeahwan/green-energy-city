// =============================================================================
// Facilities catalog — (placeholder)
//
// Historical note: this file used to export FACILITY_FOOTPRINTS, a per-kind
// + per-variant footprint map that every PLACEMENTS row had to match. That
// table was deleted in the C-stage data-source unification — PLACEMENTS in
// src/scene/layout.ts is the truth, and `scripts/verify-layout.ts` enforces
// intra-kind consistency (two rows with the same kind+variant must agree on
// halfW/halfD/sweepR).
//
// Per-kind visual halo data (shadow disc radius, tree-avoidance buffer) lives
// in `src/scene/visualHalo.ts` next to the anchor-bound merge logic.
// =============================================================================

export {}
