import { useMemo } from 'react'
import * as THREE from 'three'
import { CLEAR_SKY, CLEAR_FOG } from '../../scene/palette'

// =============================================================================
// SkyDome — inward-facing gradient sphere.
//
// The single most load-bearing piece of the edge-cleanup: it wraps the whole
// scene in a sky so orbiting to any angle never reveals the ground-plane edge
// or the void beyond it. Full sphere avoids a visible hemisphere cut line when
// the camera looks down across the horizon. Vertex-color gradient (zenith CLEAR_SKY → horizon
// CLEAR_FOG) on an unlit basic material; fog disabled so it isn't double-fogged
// (it IS the horizon the fog blends toward). r=70 — inside fogFar (110), and
// OrbitControls maxDistance (28) keeps the camera well inside it.
// =============================================================================

const DOME_RADIUS = 70
const SKY_BLEND_EXPONENT = 1.35

export function SkyDome() {
  const geom = useMemo(() => {
    const g = new THREE.SphereGeometry(DOME_RADIUS, 32, 24)
    const zenith = new THREE.Color(CLEAR_SKY)
    const horizon = new THREE.Color(CLEAR_FOG)
    const pos = g.attributes.position
    const colors = new Float32Array(pos.count * 3)
    const tmp = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      const t = THREE.MathUtils.clamp(pos.getY(i) / DOME_RADIUS, 0, 1)
      // Hold the warm horizon colour through low elevations; otherwise the
      // camera's shallow sky strip reads as a hard blue line above the city.
      tmp.copy(horizon).lerp(zenith, Math.pow(t, SKY_BLEND_EXPONENT))
      colors[i * 3] = tmp.r
      colors[i * 3 + 1] = tmp.g
      colors[i * 3 + 2] = tmp.b
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return g
  }, [])

  return (
    <mesh geometry={geom} renderOrder={-10} frustumCulled={false}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} />
    </mesh>
  )
}
