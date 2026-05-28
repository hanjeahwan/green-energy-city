import type { CityBlock } from '../elements/types'

// Buildable city blocks. This is the single source of truth for procedural
// building, tree, and street-prop sparse-block logic.
export const BLOCKS: CityBlock[] = [
  { bounds: [8, 8, 16, 16], district: 'cbd' },
  { bounds: [-8, 8, 8, 16], district: 'residential' },
  { bounds: [-16, 8, -8, 16], district: 'residential' },
  { bounds: [-16, -8, -8, 8], district: 'residential' },
  { bounds: [-16, -16, -8, -8], district: 'residential' },
  { bounds: [-8, -16, 8, -8], district: 'residential' },
  { bounds: [8, -16, 16, -8], district: 'residential' },
  { bounds: [8, -8, 16, 8], district: 'residential' },

  // Outer ring: irregular W/E/N/S residential expansion around civic anchors.
  { bounds: [-24, 16, -16, 22], district: 'outer-residential' },
  { bounds: [-16, 16, 16, 22], district: 'outer-residential' },
  { bounds: [16, 16, 24, 22], district: 'outer-residential' },
  { bounds: [16, -16, 24, 16], district: 'outer-residential' },
  { bounds: [-24, 0, -16, 16], district: 'outer-residential' },
  { bounds: [-24, -16, -16, 0], district: 'outer-residential' },
  { bounds: [-24, -22, -16, -16], district: 'outer-residential' },
  { bounds: [-16, -22, 16, -16], district: 'outer-residential' },
  { bounds: [16, -22, 24, -16], district: 'outer-residential' },
]

export type { CityBlock }
