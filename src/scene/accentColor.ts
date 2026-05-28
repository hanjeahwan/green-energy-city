// =============================================================================
// Cool accent colour palette — used for per-instance emissive highlights so
// that facilities of the same kind don't all glow identical cyan.
//
// All colours are strictly cool/eco palette (no warm tones). Picked from a
// small curated set so the scene stays cohesive — variation, not chaos.
// =============================================================================

import { rng } from '../components/sceneMaterials'
import {
  COOL_ACCENT_PALETTE,
  STATUS_DOT_PALETTE
} from './palette'

export {
  COOL_ACCENT_PALETTE,
  STATUS_DOT_PALETTE
} from './palette'

// Palette values live in palette.ts; this file only provides deterministic
// pickers for code that already imports from accentColor.ts.
/** Pick a cool accent colour deterministically from a seed (e.g. position
 *  hash, instance index). Same seed → same colour across reloads. */
export function pickCoolAccent(seed: number): string {
  return COOL_ACCENT_PALETTE[Math.floor(rng(seed) * COOL_ACCENT_PALETTE.length)]
}

/** Status-indicator accent (green-ish). Same idea but for the small "system
 *  OK" dots on BatteryBank caps. Mostly green, occasionally cyan, never
 *  warm. */
export function pickStatusDot(seed: number): string {
  return STATUS_DOT_PALETTE[Math.floor(rng(seed) * STATUS_DOT_PALETTE.length)]
}
