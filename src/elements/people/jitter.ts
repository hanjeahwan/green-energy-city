import { rng } from '../../components/sceneMaterials'
import { pickCoolAccent } from '../../scene/accentColor'

// Per-instance jitter — deterministic palette picks keyed by accentSeed so
// neighbouring figures of the same role look distinct without breaking role
// identity. Strictly cool tones (no warm shoes / accents) to stay on-brand.

const SHOE_COLORS = ['#2a2f38', '#0e1a28', '#1a2a3a', '#3a4654'] as const
const SKIN_TONES  = ['#e6c5a4', '#d9b48f', '#c8a07d', '#f0d4b8'] as const

export function pickShoe(seed: number): string {
  return SHOE_COLORS[Math.floor(rng(seed * 11 + 3) * SHOE_COLORS.length)]
}

export function pickSkin(seed: number): string {
  return SKIN_TONES[Math.floor(rng(seed * 13 + 7) * SKIN_TONES.length)]
}

export interface VariantJitter {
  shoeColor: string
  skinTone: string
  accent: string
}

/** One call → all three jitter values for a Person instance. */
export function personJitter(accentSeed: number): VariantJitter {
  return {
    shoeColor: pickShoe(accentSeed),
    skinTone: pickSkin(accentSeed),
    accent: pickCoolAccent(accentSeed),
  }
}
