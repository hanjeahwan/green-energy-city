import { useMemo } from 'react'
import * as THREE from 'three'
import { rng } from '../../components/sceneMaterials'
import { CITY_SURFACE, VEGETATION, CLEAR_FOG } from '../../scene/palette'

// Ground is a solid disc of radius FADE_INNER (covers the whole city ±28 +
// shadows) plus a radial fade ring FADE_INNER → FADE_OUTER that dissolves
// into the SkyDome horizon. The disc edge and the ring inner share the exact
// same radius + segment count, so they meet seamlessly with NO overlapping
// area — critical to avoid the coplanar z-fighting (white flicker) that a
// square plate overlapping the ring produced.
const FADE_INNER = 34
const FADE_OUTER = 56
const GROUND_SEGMENTS = 96

export function Ground() {
  const fadeGeom = useMemo(() => {
    const g = new THREE.RingGeometry(FADE_INNER, FADE_OUTER, GROUND_SEGMENTS, 1)
    // Inner ring color now uses CITY_SURFACE (the central-disc tone) instead
    // of BASE_GROUND so the city-block floor and the outer ground read as
    // one continuous surface; the fade still dissolves into CLEAR_FOG at
    // the horizon.
    const inner = new THREE.Color(CITY_SURFACE)
    const outer = new THREE.Color(CLEAR_FOG)
    const pos = g.attributes.position
    const colors = new Float32Array(pos.count * 3)
    const tmp = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      // RingGeometry lies in local XY before the -90° X rotation.
      const radius = Math.hypot(pos.getX(i), pos.getY(i))
      const t = THREE.MathUtils.clamp((radius - FADE_INNER) / (FADE_OUTER - FADE_INNER), 0, 1)
      tmp.copy(inner).lerp(outer, t)
      colors[i * 3] = tmp.r
      colors[i * 3 + 1] = tmp.g
      colors[i * 3 + 2] = tmp.b
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return g
  }, [])

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <circleGeometry args={[FADE_INNER, GROUND_SEGMENTS]} />
        {/* outer-ground disc retinted from BASE_GROUND to CITY_SURFACE so the
            full ring (out to FADE_INNER=34) reads as the same pale floor as
            the inner 10u city-block disc — one continuous surface. */}
        <meshLambertMaterial color={CITY_SURFACE} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} geometry={fadeGeom} renderOrder={-8}>
        <meshBasicMaterial vertexColors fog={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]} receiveShadow>
        <circleGeometry args={[10, 64]} />
        <meshLambertMaterial color={CITY_SURFACE} />
      </mesh>
      {/* mottled patches for ground texture variety */}
      {[[5, -6], [-7, 5], [8, 4], [-6, -7], [3, 8], [-9, -1]].map(([x, z], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, rng(i) * Math.PI]} position={[x, 0.004, z]}>
          <circleGeometry args={[1.2 + rng(i + 10) * 0.8, 20]} />
          <meshLambertMaterial color={VEGETATION} />
        </mesh>
      ))}
    </group>
  )
}
