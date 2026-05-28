import * as THREE from 'three'
import { useThrottledFrame } from '../../scene/throttledFrame'
import { useRef } from 'react'
import { AlarmCluster } from '../../components/AlarmCluster'
import { StatusRing, type Status } from '../StatusRing'
import type { ElementVariant } from '../types'

// =============================================================================
// VerticalAxisTurbine variants
//   classic — Darrieus rotor: 3 straight blades + connecting arms, fast rotation
//   modern  — Savonius rotor: 2 large curved cups (S-shape silhouette), slower rotation
// Both share the same shaft + base + footprint with sweepR=0.5.
// =============================================================================

interface VATFeatures {}

export const VAT_VARIANTS: Record<string, ElementVariant<VATFeatures>> = {
  classic: { id: 'classic', footprint: { halfW: 0.5, halfD: 0.5, sweepR: 0.5 } },
  modern:  { id: 'modern',  footprint: { halfW: 0.5, halfD: 0.5, sweepR: 0.5 } }
}

export function VerticalAxisTurbine({
  position,
  scale = 1,
  variant = 'classic',
  status
}: {
  position: [number, number, number]
  scale?: number
  variant?: string
  status?: Status
}) {
  const ref = useRef<THREE.Group>(null!)
  const isModern = variant === 'modern'
  // Modern (Savonius) spins slower because it's a drag-type rotor
  const speed = isModern ? 0.6 : 1.2
  useThrottledFrame((s) => {
    if (ref.current) ref.current.rotation.y = s.clock.getElapsedTime() * speed
  }, 30)
  return (
    <group position={position} scale={scale}>
      {/* central shaft (shared) */}
      <mesh position={[0, 0.4, 0]} castShadow={false}>
        <cylinderGeometry args={[0.03, 0.03, 0.8, 8]} />
        <meshLambertMaterial color="#3a4a5e" />
      </mesh>
      {/* base mount (shared) */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.1, 0.12, 0.04, 12]} />
        <meshLambertMaterial color="#3a4a5e" />
      </mesh>
      <group ref={ref} position={[0, 0.4, 0]}>
        {isModern ? <SavoniusCups /> : <DarrieusBlades />}
      </group>
      {status && <StatusRing status={status} radius={0.7} />}
      {status === 'crit' && <AlarmCluster position={[0, 0, 0]} radius={0.9} height={1.6} coneCount={6} />}
    </group>
  )
}

function DarrieusBlades() {
  return (
    <>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2
        return (
          <group key={i} rotation={[0, a, 0]}>
            <mesh position={[0.18, 0, 0]}>
              <boxGeometry args={[0.025, 0.65, 0.08]} />
              <meshLambertMaterial color="#c8d0db" />
            </mesh>
            <mesh position={[0.09, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.015, 0.015, 0.18, 6]} />
              <meshLambertMaterial color="#c8d0db" />
            </mesh>
          </group>
        )
      })}
    </>
  )
}

function SavoniusCups() {
  // 2 half-cylindrical curved cups offset to opposite sides, classic Savonius S-rotor.
  // Approximated with 4-segment cylinder half-arcs.
  const cupGeom = (
    <cylinderGeometry args={[0.2, 0.2, 0.65, 16, 1, true, 0, Math.PI]} />
  )
  return (
    <>
      {/* upper cup — facing +x */}
      <mesh position={[0.04, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        {cupGeom}
        <meshLambertMaterial color="#c8d0db" side={THREE.DoubleSide} />
      </mesh>
      {/* lower cup — facing -x, offset to opposite side */}
      <mesh position={[-0.04, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        {cupGeom}
        <meshLambertMaterial color="#c8d0db" side={THREE.DoubleSide} />
      </mesh>
      {/* top end cap */}
      <mesh position={[0, 0.33, 0]}>
        <cylinderGeometry args={[0.21, 0.21, 0.02, 16]} />
        <meshLambertMaterial color="#5a6878" />
      </mesh>
      {/* bottom end cap */}
      <mesh position={[0, -0.33, 0]}>
        <cylinderGeometry args={[0.21, 0.21, 0.02, 16]} />
        <meshLambertMaterial color="#5a6878" />
      </mesh>
    </>
  )
}
