import * as THREE from 'three'

// =============================================================================
// Shared PV (photovoltaic) panel asset — single source of truth for every
// solar panel surface across the city. User feedback (2026-05-25): "PV looks
// like a blackboard". The fix in SolarFarm was a new lighter-navy base +
// 8×6 cell grid + bright silver gridlines + per-cell sheen + aluminum frame.
// User then asked: "any building or facility that has PV should follow the
// same style + detail + colour".
//
// This module exports:
//   - `getPVPanelTexture()` — singleton canvas texture (created on first
//     call, cached forever). Replaces the ~6 inline copies that each
//     reinvented a darker/uglier version.
//   - `PV_BASE_COLOR`       — `#2e4a7a` — the material color that multiplies
//     with the texture map to give the final panel hue.
//   - `PV_FRAME_COLOR`      — `#c8d0db` — aluminum frame ring color (used
//     by SolarFarm and any caller that wants per-panel framing).
//
// Consumers (after this refactor):
//   - facilities/SolarFarm.tsx
//   - facilities/EVChargingStation.tsx  (canopy panel)
//   - facilities/GreenEcoOffice.tsx     (rooftop patch)
//   - facilities/TwinSolarOffice.tsx    (rooftop arrays)
//   - buildings/roofShapes.tsx          (flat/gable/mansard/stepped PV)
//   - buildings/SpecialBuildings.tsx    (RooftopPV)
//   - buildings/Warehouse.tsx           (rooftop PV slabs)
//   - components/CityScene.tsx          (smart lamp-post mini panel)
// =============================================================================

export const PV_BASE_COLOR = '#2e4a7a'
export const PV_FRAME_COLOR = '#c8d0db'

let cachedTexture: THREE.CanvasTexture | null = null

/** Returns the shared PV panel texture — 128×128 canvas with 8×6 cell grid
 *  + bright silver-blue gridlines + per-cell radial sheen. Created lazily
 *  on first call, cached for the lifetime of the page. */
export function getPVPanelTexture(): THREE.CanvasTexture {
  if (cachedTexture) return cachedTexture
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')!
  // base navy fill — multiplies with PV_BASE_COLOR at material time
  ctx.fillStyle = '#1f3a6a'
  ctx.fillRect(0, 0, 128, 128)
  // per-cell radial gradient — fake anti-reflective sheen
  const cellW = 128 / 8
  const cellH = 128 / 6
  for (let cy = 0; cy < 6; cy++) {
    for (let cx = 0; cx < 8; cx++) {
      const px = cx * cellW + cellW / 2
      const py = cy * cellH + cellH / 2
      const grad = ctx.createRadialGradient(px, py, 1, px, py, cellW * 0.7)
      grad.addColorStop(0, '#2b4d80')
      grad.addColorStop(1, '#16305a')
      ctx.fillStyle = grad
      ctx.fillRect(cx * cellW, cy * cellH, cellW, cellH)
    }
  }
  // silver-blue cell gridlines
  ctx.strokeStyle = '#cfd8e8'
  ctx.lineWidth = 1.5
  for (let x = 0; x <= 8; x++) {
    ctx.beginPath()
    ctx.moveTo(x * cellW, 0)
    ctx.lineTo(x * cellW, 128)
    ctx.stroke()
  }
  for (let y = 0; y <= 6; y++) {
    ctx.beginPath()
    ctx.moveTo(0, y * cellH)
    ctx.lineTo(128, y * cellH)
    ctx.stroke()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  cachedTexture = tex
  return tex
}
