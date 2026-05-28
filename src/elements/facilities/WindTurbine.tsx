import * as THREE from 'three'
import { useThrottledFrame } from '../../scene/throttledFrame'
import { useMemo, useRef } from 'react'
import { RoundedBox } from '@react-three/drei'
import { BaseShadowDisc } from '../../components/scenePrimitives'
import { AlarmCluster } from '../../components/AlarmCluster'
import { StatusRing, type Status } from '../StatusRing'
import type { ElementVariant } from '../types'
import { CLEAN_GREEN } from '../../scene/palette'

// =============================================================================
// WindTurbine variants
//   classic — tapered tower + nacelle + 3 airfoil blades (1.4 rad/s, sweepR 1.6)
//   modern  — slimmer 2-blade variant + smaller nacelle (1.8 rad/s, sweepR 1.2)
// Modern's smaller blade sweep is reflected in the catalog footprint so
// PLACEMENTS entries can switch to 'modern' without re-balancing road clearance.
// =============================================================================

interface WindTurbineFeatures {}

export const WINDTURBINE_VARIANTS: Record<string, ElementVariant<WindTurbineFeatures>> = {
  classic: { id: 'classic', footprint: { halfW: 0.5, halfD: 0.5, sweepR: 1.6 } },
  modern:  { id: 'modern',  footprint: { halfW: 0.5, halfD: 0.5, sweepR: 1.2 } }
}

export function WindTurbine({
  position,
  scale = 1,
  phase = 0,
  variant = 'classic',
  status
}: {
  position: [number, number, number]
  scale?: number
  phase?: number
  variant?: string
  status?: Status
}) {
  const blades = useRef<THREE.Group>(null!)
  const tipLightMat = useRef<THREE.MeshLambertMaterial>(null!)
  const isModern = variant === 'modern'
  const spinSpeed = isModern ? 1.8 : 1.4
  useThrottledFrame((s) => {
    const t = s.clock.getElapsedTime()
    if (blades.current) blades.current.rotation.z = t * spinSpeed + phase
    // Top-of-nacelle aviation light — 1 Hz blink, low base + sharp peak
    // (mimics red FAA beacon but in green to stay on-palette).
    if (tipLightMat.current) {
      const cyc = (t + phase) % 1.0
      tipLightMat.current.emissiveIntensity = cyc < 0.15 ? 1.2 : 0.15
    }
  }, 30)

  const classicBladeGeom = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-0.06, 0)
    shape.lineTo(0.06, 0)
    shape.lineTo(0.025, 1.8)
    shape.lineTo(-0.025, 1.8)
    shape.closePath()
    return new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: false }).translate(0, 0, -0.02)
  }, [])

  // Modern blade — narrower + shorter (1.3 vs 1.8), reflects smaller sweepR
  const modernBladeGeom = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-0.045, 0)
    shape.lineTo(0.045, 0)
    shape.lineTo(0.02, 1.3)
    shape.lineTo(-0.02, 1.3)
    shape.closePath()
    return new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: false }).translate(0, 0, -0.015)
  }, [])

  return (
    <group position={position} scale={scale}>
      <BaseShadowDisc position={[0, 0.005, 0]} radius={isModern ? 0.7 : 0.85} opacity={0.32} />
      {/* base (shared shape but slimmer for modern) */}
      <mesh position={[0, 0.05, 0]} castShadow={false}>
        <cylinderGeometry args={[isModern ? 0.42 : 0.55, isModern ? 0.55 : 0.7, 0.1, 18]} />
        <meshLambertMaterial color="#c8d2dc" />
      </mesh>
      {/* tapered tower (shared) */}
      <mesh position={[0, 1.95, 0]} castShadow={false}>
        <cylinderGeometry args={[0.06, isModern ? 0.14 : 0.18, 3.8, 16]} />
        <meshLambertMaterial color="#f0f3f7" />
      </mesh>
      {/* nacelle — smaller for modern */}
      <RoundedBox
        args={isModern ? [0.24, 0.18, 0.45] : [0.32, 0.24, 0.6]}
        radius={0.05}
        smoothness={3}
        position={[0, 3.85, isModern ? 0.08 : 0.12]}
        castShadow={false}
      >
        <meshLambertMaterial color="#dde2e9" />
      </RoundedBox>
      {/* hub */}
      <mesh position={[0, 3.85, isModern ? 0.32 : 0.42]}>
        <sphereGeometry args={[isModern ? 0.09 : 0.11, 14, 14]} />
        <meshLambertMaterial color="#aab4c0" />
      </mesh>
      <mesh
        position={[0, 3.85, isModern ? 0.42 : 0.55]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow={false}
      >
        <coneGeometry args={[isModern ? 0.08 : 0.1, isModern ? 0.14 : 0.18, 12]} />
        <meshLambertMaterial color="#9aa5b2" />
      </mesh>
      {/* blades — classic 3, modern 2 */}
      <group ref={blades} position={[0, 3.85, isModern ? 0.36 : 0.48]}>
        {(isModern ? [0, 1] : [0, 1, 2]).map((i) => (
          <mesh
            key={i}
            rotation={[0, 0, (i * Math.PI * 2) / (isModern ? 2 : 3)]}
            geometry={isModern ? modernBladeGeom : classicBladeGeom}
            castShadow={false}
          >
            <meshLambertMaterial color="#ffffff" />
          </mesh>
        ))}
      </group>
      {/* aviation tip light on nacelle — tiny green emissive sphere that
          blinks at 1 Hz. Picked green (CLEAN_GREEN) to keep the orange/red
          alert palette reserved for fault states. */}
      <mesh position={[0, 4.0, isModern ? 0.08 : 0.12]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshLambertMaterial
          ref={tipLightMat}
          color="#0e2440"
          emissive={CLEAN_GREEN}
          emissiveIntensity={1.0}

        />
      </mesh>
      {/* status indicator at base */}
      {status && status !== 'ok' && <StatusRing status={status} radius={1.0} />}
      {status === 'crit' && <AlarmCluster position={[0, 0, 0]} radius={1.3} height={1.8} />}
    </group>
  )
}
