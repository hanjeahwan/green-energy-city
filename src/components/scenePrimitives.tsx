// =============================================================================
// Shared primitive components (JSX) used across CityScene + all elements/*.tsx.
// These are the AO-simulation helpers that replace true SSAO (removed from
// PostFX due to GPU error — see PostFX.tsx). Every prop with a footprint puts
// a BaseShadowDisc under itself.
// =============================================================================

// BOTH primitives stubbed to render nothing as of the "shadow-off" cleanup
// (Canvas shadows={false}). They existed only as fake-AO companions to real
// directional shadows; without those shadows they are visible artifacts on
// the ground plane ("浅蓝色方块" report).
//
// Kept as exported no-op components so call sites compile unchanged. If
// shadows are ever re-enabled, restore the geometries from git history
// (last live commit: 6b940e1).

export function BaseShadowDisc(_props: {
  position: [number, number, number]
  radius: number
  opacity?: number
}) {
  void _props
  return null
}

export function BaseOutline(_props: {
  position: [number, number, number]
  w: number
  d: number
  color?: string
}) {
  void _props
  return null
}
