import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { tintedGeometry, flatGradMat } from '../../components/sceneMaterials'
import { BaseShadowDisc } from '../../components/scenePrimitives'
import type { ElementVariant } from '../types'

// =============================================================================
// Tree variants — 4 species used by treeLayout.computeTreePlacements()
//   classic    — deciduous: 2 stacked green cones + brown trunk (rounded silhouette)
//   modern     — evergreen: 1 tall narrow cone + thin dark trunk (pointy silhouette)
//   palm       — tropical: thin tan trunk + 6 angled flat fronds (CBD / plaza accent)
//   broadleaf  — shade tree: short trunk + flattened sphere canopy (residential yards)
//
// Each tree group can wind-sway via useFrame: per-instance swayPhase keeps the
// motion desynchronized so the canopy reads as a real breeze, not synced flags.
// =============================================================================

interface TreeFeatures {}

export const TREE_VARIANTS: Record<string, ElementVariant<TreeFeatures>> = {
  classic:   { id: 'classic',   footprint: { halfW: 0.35, halfD: 0.35 } },
  modern:    { id: 'modern',    footprint: { halfW: 0.30, halfD: 0.30 } },
  palm:      { id: 'palm',      footprint: { halfW: 0.30, halfD: 0.30 } },
  broadleaf: { id: 'broadleaf', footprint: { halfW: 0.40, halfD: 0.40 } },
}

const SWAY_AMP_Y = 0.022   // rad — ~1.25° y-axis oscillation
const SWAY_AMP_Z = 0.015   // rad — ~0.86° z-axis tilt
const SWAY_FREQ_Y = 0.6    // Hz-ish (radian rate)
const SWAY_FREQ_Z = 0.5

export function Tree({
  position,
  scale = 1,
  rot = 0,
  variant = 'classic',
  swayPhase = 0,
}: {
  position: [number, number, number]
  scale?: number
  rot?: number
  variant?: string
  swayPhase?: number
}) {
  const ref = useRef<THREE.Group>(null!)
  // Wind sway: small y-rotation + z-tilt around the base rotation, per-tree phase
  // offset prevents lock-step motion across the whole grove.
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (!ref.current) return
    ref.current.rotation.y = rot + Math.sin(t * SWAY_FREQ_Y + swayPhase) * SWAY_AMP_Y
    ref.current.rotation.z = Math.sin(t * SWAY_FREQ_Z + swayPhase + Math.PI / 3) * SWAY_AMP_Z
  })

  const shadowRadius = variant === 'broadleaf' ? 0.55 : variant === 'palm' ? 0.45 : 0.35
  return (
    <group ref={ref} position={position} scale={scale} rotation={[0, rot, 0]}>
      <BaseShadowDisc position={[0, 0.005, 0]} radius={shadowRadius} opacity={0.3} />
      {variant === 'modern' ? <EvergreenCone /> :
       variant === 'palm' ? <PalmTree /> :
       variant === 'broadleaf' ? <BroadleafTree /> :
       <DeciduousCones />}
    </group>
  )
}

function DeciduousCones() {
  const geom1 = useMemo(
    () => tintedGeometry(new THREE.ConeGeometry(0.32, 0.7, 8).translate(0, 0.35, 0), '#3a8a52', 0.55),
    []
  )
  const geom2 = useMemo(
    () => tintedGeometry(new THREE.ConeGeometry(0.24, 0.55, 8).translate(0, 0.5, 0), '#42a060', 0.55),
    []
  )
  return (
    <>
      <mesh position={[0, 0.18, 0]} castShadow={false}>
        <cylinderGeometry args={[0.04, 0.06, 0.36, 6]} />
        <meshLambertMaterial color="#6a4226" />
      </mesh>
      <mesh geometry={geom1} material={flatGradMat()} position={[0, 0.25, 0]} castShadow={false} />
      <mesh geometry={geom2} material={flatGradMat()} position={[0, 0.35, 0]} castShadow={false} />
    </>
  )
}

function EvergreenCone() {
  const coneGeom = useMemo(
    () => tintedGeometry(new THREE.ConeGeometry(0.22, 1.1, 8).translate(0, 0.55, 0), '#2d6a3c', 0.45),
    []
  )
  return (
    <>
      <mesh position={[0, 0.12, 0]} castShadow={false}>
        <cylinderGeometry args={[0.025, 0.035, 0.24, 6]} />
        <meshLambertMaterial color="#3a2a1a" />
      </mesh>
      <mesh geometry={coneGeom} material={flatGradMat()} position={[0, 0.22, 0]} castShadow={false} />
    </>
  )
}

function PalmTree() {
  // Tropical accent: thin tan trunk + 6 angled flat fronds radiating from top.
  // Frond is a wide, thin box tilted ~20° below horizontal for drooping look.
  const frondGeom = useMemo(() => new THREE.BoxGeometry(0.5, 0.02, 0.12), [])
  const FROND_COUNT = 6
  return (
    <>
      {/* Trunk — thin, tan, slight upward taper */}
      <mesh position={[0, 0.7, 0]} castShadow={false}>
        <cylinderGeometry args={[0.035, 0.05, 1.4, 6]} />
        <meshLambertMaterial color="#9b7a52" />
      </mesh>
      {/* Crown — 6 fronds, each rotated around y + tilted down ~20° */}
      <group position={[0, 1.4, 0]}>
        {Array.from({ length: FROND_COUNT }, (_, i) => {
          const yaw = (Math.PI * 2 * i) / FROND_COUNT
          // Box pivots at its center; offset frond by half its length along its local x
          return (
            <group key={i} rotation={[0, yaw, -0.35]}>
              <mesh geometry={frondGeom} material={flatGradMat()} position={[0.25, 0, 0]} castShadow={false}>
                <meshLambertMaterial color="#3f5a36" />
              </mesh>
            </group>
          )
        })}
      </group>
    </>
  )
}

function BroadleafTree() {
  // Shade tree: short stout trunk + flattened sphere canopy.
  const canopyGeom = useMemo(
    () => tintedGeometry(new THREE.SphereGeometry(0.55, 12, 10).scale(1, 0.7, 1), '#5a8a3a', 0.5),
    []
  )
  return (
    <>
      {/* Trunk — stout, warm brown */}
      <mesh position={[0, 0.25, 0]} castShadow={false}>
        <cylinderGeometry args={[0.07, 0.09, 0.5, 7]} />
        <meshLambertMaterial color="#7a5a3a" />
      </mesh>
      {/* Canopy — squished sphere centered above the trunk */}
      <mesh geometry={canopyGeom} material={flatGradMat()} position={[0, 0.75, 0]} castShadow={false} />
    </>
  )
}
