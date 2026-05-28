// =============================================================================
// Semantic color palette — single source of truth for the diorama.
//
// Pre-this-file colors lived in two places:
//   - src/elements/buildings/catalog.ts (ACCENT_CYAN + COOL_NAVY/SLATE/SILVER)
//   - inline hex literals scattered across CityScene.tsx and facility components
// The showroom V1 palette carries five readable layers:
//   1. clear daylight sky + light city base
//   2. road / shadow separation
//   3. residential, office, and support facility families
//   4. cyan-green AI energy network
//   5. sparse orange/red alerts
//
// This file centralises tokens for those four layers. Existing names from
// buildings/catalog.ts (ACCENT_CYAN, COOL_NAVY) are re-exported as aliases of
// the new tokens, so we don't have to chase every import site at once.
// =============================================================================

// -----------------------------------------------------------------------------
// Layer 1 — Sunny daylight base.
// -----------------------------------------------------------------------------
// Zenith blue for the SkyDome gradient. Was #e8f7ff (near-white) which read
// as washed-out / overcast under exposure 1.30 + ACES. #7fb8e6 is a clean
// mid-saturation sky blue — clearly "sunny clear day" against the warm
// CLEAR_FOG horizon. SkyDome's SKY_BLEND_EXPONENT (1.8) keeps the warm
// horizon dominant on the lower dome and ramps to this blue only near the
// top, so the result reads sun-lit rather than aquarium-blue.
export const CLEAR_SKY = '#7fb8e6'
export const CLEAR_FOG = '#fff2cc'
export const BASE_GROUND = '#d6e0e8'
export const CITY_SURFACE = '#edf3f7'
export const BASE_ROAD = '#7d8994'
export const ROAD_SHADOW = '#253241'
export const ROAD_CONNECTOR = '#8b96a1'
export const ROAD_ALLEY = '#98a3ad'
export const BASE_FOG = CLEAR_FOG
// White paint for road centre dashes, crosswalk stripes, stop lines.
// Slightly cool off-white so it sits cleanly on the asphalt grey without
// looking like a fluorescent decal. Consumed by RoadMarkings.tsx.
export const LANE_PAINT = '#f0f0f0'

// Residential / community: soft, bright, and quieter than the energy network.
export const RESIDENTIAL_WARM_WHITE = '#f3f6f2'
export const RESIDENTIAL_SAGE = '#dbe8df'
export const RESIDENTIAL_GREEN = '#c7d9c8'
export const COMMUNITY_SUPPORT = '#e5ece8'
export const COMMUNITY_TRIM = '#9fb6ad'
export const COMMUNITY_DARK = '#506472'

// Office / commercial: glass, metal, stone, and deeper blue-gray contrast.
export const OFFICE_GLASS = '#dce5ec'
export const OFFICE_METAL = '#b9c7d4'
export const OFFICE_STONE = '#cfd8de'
export const OFFICE_DARK = '#2f465c'

// -----------------------------------------------------------------------------
// Layer 2 — Energy network (cyan + green). Cyan reads as "data / grid / smart
// uplink"; green reads as "clean energy production / ok status".
// -----------------------------------------------------------------------------
export const ENERGY_CYAN = '#5dd4e8'   // = existing ACCENT_CYAN
export const CLEAN_GREEN = '#3ad48a'   // "ok" emissive + clean-power accent
export const VEGETATION  = '#6cb87a'   // vertical-garden + moss patches

// -----------------------------------------------------------------------------
// Layer 3 — Core facilities (deep blue). Reserved for the heroes:
// CommandTower, PV station inverter banks, hero skyscraper crowns.
// -----------------------------------------------------------------------------
export const CORE_BLUE = '#1a4a7a'     // CommandTower mid trim, hero PV inverters
export const CORE_NAVY = '#0e2440'     // alias for the existing COOL_NAVY

// -----------------------------------------------------------------------------
// Layer 4 — Alerts (orange/red). Used sparingly: construction props, warn
// state on facilities, crit beacons.
// -----------------------------------------------------------------------------
export const ALERT_ORANGE = '#ff9540'  // construction, "warn" status
export const ALERT_RED    = '#e8504a'  // critical status

// -----------------------------------------------------------------------------
// Status triad — shared by <StatusRing/> and <FacilityCard/> status pills.
// Mapped from the layered tokens so re-themes only have to edit one row.
// -----------------------------------------------------------------------------
export const STATUS = {
  ok:   CLEAN_GREEN,
  warn: ALERT_ORANGE,
  crit: ALERT_RED,
} as const

export type StatusKey = keyof typeof STATUS

// -----------------------------------------------------------------------------
// Shared theme groups — consumers should pick from these role palettes instead
// of inventing local hex arrays. This keeps the theme centralized without
// locking every roof, facade, or accent to a single color.
// -----------------------------------------------------------------------------
export const NEUTRAL_SURFACES = {
  slate: '#3a4a5e',
  silver: '#c8d0db',
  white: '#ffffff',
  deepPanel: '#0a1a30'
} as const

export const COOL_ACCENT_PALETTE = [
  ENERGY_CYAN,
  '#7fc4e8',
  '#4ad4c4',
  '#5d9ce8',
  '#a8e0d8',
  '#6bd0a8'
] as const

export const STATUS_DOT_PALETTE = [
  '#2bbd84',
  '#4dd8a0',
  ENERGY_CYAN,
  '#3ac490'
] as const

export const BUILDING_PALETTES = {
  // Office bodies are now all light / mid-light. OFFICE_DARK (#2f465c) was
  // the 8th entry and produced near-black office buildings whenever the
  // generator's random pick landed on it. Replaced with a slightly cooler
  // mid blue-gray that still reads as "office stone" without making the
  // building look like a black brick.
  office: [
    CITY_SURFACE, '#f1f4f9', OFFICE_GLASS, OFFICE_STONE,
    OFFICE_METAL, '#a8bdca', '#8fa4b4', '#a4b4c2'
  ],
  warehouse: [
    '#5a6e88', '#506684', '#566c8a', '#5e7290',
    '#647892', '#6a7888', '#4e6e92', '#465e80'
  ],
  factory: [
    '#dfe6ee', '#eef2f7', NEUTRAL_SURFACES.silver, '#b6bfcc',
    '#d4dde6', '#a8b4c0', '#8a96a6', '#bcc8d2'
  ],
  apartment: [
    RESIDENTIAL_WARM_WHITE, RESIDENTIAL_SAGE, '#d9e3e6', '#c8d4e0',
    RESIDENTIAL_GREEN, '#b9c9d1', '#bcc6cf', '#a5b2bc'
  ],
  house: [
    RESIDENTIAL_WARM_WHITE, '#eef3ed', RESIDENTIAL_SAGE, '#d4e0ec',
    RESIDENTIAL_GREEN, '#c8d8cf', '#cad9d4', '#bccfd2'
  ],
  skyscraper: [
    NEUTRAL_SURFACES.silver, '#b6bfcc', '#a8b2c0', '#dde3ec',
    '#b2bcc8', '#a4b0bc', '#96a4b0', '#d8e0e8'
  ],
  civic: [
    COMMUNITY_SUPPORT, '#dfe8ef', '#c8d8e2', '#b8c8d6',
    COMMUNITY_TRIM, '#7f95a8', '#d4e8df', COMMUNITY_DARK
  ],
  energy: [
    '#e8f2ee', '#cfe4dc', '#b8d8cc', '#9fc4bd',
    '#d7e8ef', '#b6cad8', '#8faebc', '#dce8d8'
  ],
  roof: [
    '#4c688c', '#5374a0', '#6a7888',
    '#3e567a', '#5c7090', '#5078a0'
  ]
} as const
