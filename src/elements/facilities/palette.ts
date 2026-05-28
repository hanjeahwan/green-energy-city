// =============================================================================
// Facility palette — semantic names for the hex literals that recur across
// `src/elements/facilities/*.tsx`.
//
// Before this file: 23 facility components had ~241 inline `"#xxxxxx"`
// literals; the same shades ("steel", "deep navy shadow", "warm copper") were
// re-typed in each file and could not be re-themed without touching every
// component. After this file: each colour has one home and a documented
// purpose. Components import from here instead of typing hex.
//
// We layer on top of `src/scene/palette.ts` rather than redefining tokens
// already there (e.g. ENERGY_CYAN, CORE_NAVY, NEUTRAL_SURFACES.silver). When
// a facility colour was just an alias of an existing token we re-export it;
// when it's facility-specific (e.g. solar mullion grey) we define it here.
// =============================================================================

import { ENERGY_CYAN, CORE_NAVY, NEUTRAL_SURFACES } from '../../scene/palette'

// -----------------------------------------------------------------------------
// Steel / metal family — solar mullions, transmission lattice, container ribs,
// substation gantries, wind nacelles. Most "industrial gray" goes through here.
// -----------------------------------------------------------------------------
export const STEEL_LIGHT   = NEUTRAL_SURFACES.silver  // '#c8d0db' (30x usages)
export const STEEL_MID     = '#5a6878'                 // (23x) concrete / dark-aluminium
export const STEEL_DARK    = '#3a4654'                 // (21x) baseplate / structural shadow
export const STEEL_SLATE   = NEUTRAL_SURFACES.slate    // '#3a4a5e' (19x) slate-blue panel
export const STEEL_DEEP    = '#0a1428'                 // (12x) bottom-of-pylon shadow / deep navy
export const STEEL_NEUTRAL = '#7a8088'                 // (7x) raw concrete / paint chip
export const STEEL_PANEL   = '#102438'                 // (6x) panel undertone
export const STEEL_LIGHT_2 = '#dde2e9'                 // (5x) brushed aluminium highlight
export const STEEL_LIGHT_3 = '#d6dae0'                 // (5x) light concrete / weathered roof
export const STEEL_MID_2   = '#5d6b7d'                 // (5x) duct / armature
export const STEEL_DARK_2  = '#1c2638'                 // (5x) pylon brace

// -----------------------------------------------------------------------------
// Solar panel — deep navy + accent cyan. SOLAR_GLASS is the visible front of
// a PV module; SOLAR_FRAME is the aluminium edge.
// -----------------------------------------------------------------------------
export const SOLAR_GLASS = '#1a3a5a'   // (4x) photovoltaic module face
export const SOLAR_FRAME = STEEL_LIGHT // aluminium frame around solar glass
export const SOLAR_NAVY  = CORE_NAVY   // PV inverter / charge controller bodies

// -----------------------------------------------------------------------------
// Status & wood-rust accents — sparse but recurring.
// -----------------------------------------------------------------------------
export const RUST_BROWN  = '#5a3a22'   // (7x) wood handrail, weathered crate
export const STATUS_RED  = '#e8504a'   // (3x) emergency button / shutoff pull
export const STATUS_GOLD = '#f0c85a'   // (2x) caution stripe
export const STATUS_TEAL = '#8bd49c'   // (2x) "all good" indicator pad

// -----------------------------------------------------------------------------
// Re-exports — facilities reach for the energy + accent network constantly.
// Re-export here so a facility component only imports `./palette`.
// -----------------------------------------------------------------------------
export { ENERGY_CYAN, CORE_NAVY } from '../../scene/palette'
