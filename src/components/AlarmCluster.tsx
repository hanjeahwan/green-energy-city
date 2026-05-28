import * as THREE from 'three'
import { useThrottledFrame } from '../scene/throttledFrame'
import { useMemo, useRef } from 'react'

// =============================================================================
// AlarmCluster — composite "this prop is in CRITICAL alert" visual.
//
// Combines:
//  - 1 hover-style red ground halo (AdditiveBlending pulse)
//  - N yellow road cones arranged in a circle of `radius` around the anchor,
//    or custom local cone positions for facilities with asymmetric footprints
//
// Replaces the inline AIScanBeam component + the standalone RoadCones()
// function. RoadCones was previously hardcoded at (3.4, 1.4) — the OLD
// PS-02 position before the Phase 2 cardinal refactor moved PS-02 to
// (5, 0). That left the cone ring stranded in empty plaza.
//
// Now cones are positioned relative to the cluster's `position` so they
// always wrap whatever alarm anchor renders this component.
// =============================================================================

const ALARM_RED = '#b3262d'
const ALARM_RED_BRIGHT = '#ff7a72'
const CONE_ORANGE = '#e8642b'

function roundedFootprintShape(width: number, depth: number, radius: number) {
  const left = -width / 2
  const right = width / 2
  const bottom = -depth / 2
  const top = depth / 2
  const r = Math.min(radius, width / 2, depth / 2)
  const shape = new THREE.Shape()

  shape.moveTo(left + r, bottom)
  shape.lineTo(right - r, bottom)
  shape.quadraticCurveTo(right, bottom, right, bottom + r)
  shape.lineTo(right, top - r)
  shape.quadraticCurveTo(right, top, right - r, top)
  shape.lineTo(left + r, top)
  shape.quadraticCurveTo(left, top, left, top - r)
  shape.lineTo(left, bottom + r)
  shape.quadraticCurveTo(left, bottom, left + r, bottom)

  return shape
}

export function AlarmCluster({
  position,
  radius = 1.7,
  height = 2.5,
  coneCount = 8,
  conePositions: customConePositions,
  haloFootprint
}: {
  position: [number, number, number]
  radius?: number
  height?: number
  coneCount?: number
  conePositions?: [number, number, number][]
  haloFootprint?: { w: number; d: number }
}) {
  const haloFill = useRef<THREE.Mesh>(null!)
  const fillMat = useRef<THREE.MeshBasicMaterial>(null!)
  const coneRefs = useRef<(THREE.Mesh | null)[]>([])
  const coneMats = useRef<(THREE.MeshLambertMaterial | null)[]>([])

  const footprintW = Math.max((haloFootprint?.w ?? radius * 2) * 0.96, 0.84)
  const footprintD = Math.max((haloFootprint?.d ?? radius * 2) * 0.96, 0.84)
  const cornerRadius = Math.min(footprintW, footprintD) * 0.12
  const haloShape = useMemo(
    () => roundedFootprintShape(footprintW, footprintD, cornerRadius),
    [cornerRadius, footprintD, footprintW]
  )

  useThrottledFrame((s) => {
    const t = s.clock.getElapsedTime()
    const pulse = (Math.sin(t * 4.2) + 1) / 2
    if (haloFill.current && fillMat.current) {
      const scale = 1 + pulse * 0.014
      haloFill.current.scale.set(scale, scale, 1)
      fillMat.current.opacity = 0.1 + pulse * 0.05
    }
    // Per-cone breathing — staggered phase, ±8% scale.y, emissive 0.15 → 0.55
    for (let i = 0; i < coneRefs.current.length; i++) {
      const cone = coneRefs.current[i]
      const mat = coneMats.current[i]
      const wave = Math.sin(t * 2.2 + i * 0.7)
      if (cone) {
        cone.scale.y = 1 + wave * 0.08
        cone.scale.x = 1 + wave * 0.02
        cone.scale.z = 1 + wave * 0.02
      }
      if (mat) {
        mat.emissiveIntensity = 0.35 + wave * 0.2
      }
    }
  }, 30)

  // Cone positions in local space. Most facilities use a circular perimeter;
  // asymmetric footprints can pass explicit positions to avoid mesh overlap.
  const conePositions = useMemo(() => {
    if (customConePositions) return customConePositions

    const arr: [number, number, number][] = []
    for (let i = 0; i < coneCount; i++) {
      const a = (i / coneCount) * Math.PI * 2
      arr.push([Math.cos(a) * radius, 0, Math.sin(a) * radius])
    }
    return arr
  }, [coneCount, customConePositions, radius])

  return (
    <group position={position}>
      <group position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
        {/* Hover-style alert halo: subtle local breathing, not a radar sweep. */}
        <mesh ref={haloFill} position={[0, 0, 0.008]} raycast={() => null}>
          <shapeGeometry args={[haloShape]} />
          <meshBasicMaterial
            ref={fillMat}
            color={ALARM_RED}
            transparent
            opacity={0.12}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      </group>
      {/* Central scan beam pole + top beacon sphere removed (user request,
          2026-05-23): the vertical red column dominated the alarm anchor
          and read as a giant exclamation mark. The hover-style ground halo
          + ring of orange cones tell the alarm story without it. The
          `height` prop and `ALARM_RED_BRIGHT` token are kept in place
          signature in case we want to bring a softer indicator back. */}
      {/* Road cones in a circle */}
      {conePositions.map((p, i) => (
        <group key={i} position={p}>
          <mesh
            ref={(el) => { coneRefs.current[i] = el }}
            position={[0, 0.13, 0]}
            castShadow
          >
            <coneGeometry args={[0.07, 0.26, 8]} />
            <meshLambertMaterial
              ref={(el) => { coneMats.current[i] = el }}
              color={CONE_ORANGE}

              emissive={CONE_ORANGE}
              emissiveIntensity={0.35}
            />
          </mesh>
          {/* white reflective band */}
          <mesh position={[0, 0.18, 0]}>
            <cylinderGeometry args={[0.045, 0.045, 0.04, 8]} />
            <meshLambertMaterial color="#ffffff" />
          </mesh>
          {/* base */}
          <mesh position={[0, 0.005, 0]}>
            <boxGeometry args={[0.14, 0.01, 0.14]} />
            <meshLambertMaterial color="#3a3a3a" />
          </mesh>
        </group>
      ))}
    </group>
  )
}
