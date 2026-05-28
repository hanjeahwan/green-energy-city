import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { BaseShadowDisc } from '../../components/scenePrimitives'
import { AlarmCluster } from '../../components/AlarmCluster'
import { StatusRing, type Status } from '../StatusRing'
import type { ElementVariant } from '../types'

// =============================================================================
// Crane variants
//   classic — slewing tower crane: mast + rotating top (boom + counter-jib + hook + cabin)
//   modern  — jib crane: single wall-mounted arm rotating around a fixed pivot,
//             no full mast — looks more like a fixed luffing jib than a tower crane
// Both rooted at (-12, 0, 12); footprint stays at halfW=halfD=0.3.
// =============================================================================

interface CraneFeatures {}

export const CRANE_VARIANTS: Record<string, ElementVariant<CraneFeatures>> = {
  classic: { id: 'classic', footprint: { halfW: 0.3, halfD: 0.3 } },
  modern:  { id: 'modern',  footprint: { halfW: 0.3, halfD: 0.3 } }
}

export function Crane({
  variant = 'classic',
  status,
  // Position used to live inside this component as a hardcoded [-12, 0, 12].
  // Extracted so the call site (e.g. an InteractiveAnchor wrapper) can place
  // the crane and the outline/card at the same world coords.
  position = [-12, 0, 12]
}: { variant?: string; status?: Status; position?: [number, number, number] } = {}) {
  return (
    <group position={position}>
      <BaseShadowDisc position={[0, 0.005, 0]} radius={0.6} opacity={0.32} />
      {variant === 'modern' ? <ModernJibCrane /> : <ClassicSlewingTower />}
      {status && <StatusRing status={status} radius={0.7} />}
      {status === 'crit' && <AlarmCluster position={[0, 0, 0]} radius={0.8} height={3.0} coneCount={6} />}
    </group>
  )
}

function ClassicSlewingTower() {
  const ref = useRef<THREE.Group>(null!)
  useFrame((s) => {
    if (ref.current) ref.current.rotation.y = s.clock.getElapsedTime() * 0.1
  })
  return (
    <>
      <mesh position={[0, 0.15, 0]} castShadow={false}>
        <boxGeometry args={[0.6, 0.3, 0.6]} />
        <meshLambertMaterial color="#c8d0db" />
      </mesh>
      <mesh position={[0, 1.8, 0]} castShadow={false}>
        <boxGeometry args={[0.16, 3.0, 0.16]} />
        <meshLambertMaterial color="#c8d0db" />
      </mesh>
      <group ref={ref} position={[0, 3.3, 0]}>
        <mesh position={[1.0, 0, 0]} castShadow={false}>
          <boxGeometry args={[2.4, 0.08, 0.12]} />
          <meshLambertMaterial color="#c8d0db" />
        </mesh>
        <mesh position={[-0.6, 0, 0]} castShadow={false}>
          <boxGeometry args={[1.0, 0.08, 0.12]} />
          <meshLambertMaterial color="#c8d0db" />
        </mesh>
        <mesh position={[-1.0, -0.08, 0]} castShadow={false}>
          <boxGeometry args={[0.3, 0.18, 0.3]} />
          <meshLambertMaterial color="#3a4654" />
        </mesh>
        <mesh position={[1.8, -0.55, 0]} castShadow={false}>
          <boxGeometry args={[0.1, 0.4, 0.1]} />
          <meshLambertMaterial color="#3a4654" />
        </mesh>
        <mesh position={[0.2, -0.1, 0]} castShadow={false}>
          <boxGeometry args={[0.28, 0.22, 0.28]} />
          <meshLambertMaterial color="#1c3a5c" emissive="#5dd4e8" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0.2, 0.1, 0]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshLambertMaterial emissive="#e8504a" emissiveIntensity={2} color="#000" />
        </mesh>
      </group>
    </>
  )
}

function ModernJibCrane() {
  // Wall-mounted style: shorter base pylon (1.5m) + luffing jib arm that lifts up at ~30°.
  // The jib rotates slowly around the pylon (yaw).
  const ref = useRef<THREE.Group>(null!)
  useFrame((s) => {
    // Slow yaw — quarter speed of classic for variety
    if (ref.current) ref.current.rotation.y = Math.sin(s.clock.getElapsedTime() * 0.15) * 0.4
  })
  return (
    <>
      {/* concrete foundation */}
      <mesh position={[0, 0.1, 0]} castShadow={false}>
        <boxGeometry args={[0.5, 0.2, 0.5]} />
        <meshLambertMaterial color="#5a6878" />
      </mesh>
      {/* short stout pylon (~1.5m, vs 3m classic mast) */}
      <mesh position={[0, 0.95, 0]} castShadow={false}>
        <boxGeometry args={[0.22, 1.5, 0.22]} />
        <meshLambertMaterial color="#c8d0db" />
      </mesh>
      {/* yaw pivot housing */}
      <mesh position={[0, 1.78, 0]} castShadow={false}>
        <cylinderGeometry args={[0.13, 0.13, 0.18, 12]} />
        <meshLambertMaterial color="#3a4a5e" />
      </mesh>
      <group ref={ref} position={[0, 1.85, 0]}>
        {/* luffing jib arm — angled up ~30° from horizontal, length 2.2m */}
        <mesh position={[0.95, 0.55, 0]} rotation={[0, 0, Math.PI * 0.18]} castShadow={false}>
          <boxGeometry args={[2.2, 0.09, 0.13]} />
          <meshLambertMaterial color="#c8d0db" />
        </mesh>
        {/* short counter-arm on opposite side */}
        <mesh position={[-0.35, 0.2, 0]} rotation={[0, 0, Math.PI * 0.18]} castShadow={false}>
          <boxGeometry args={[0.8, 0.09, 0.13]} />
          <meshLambertMaterial color="#c8d0db" />
        </mesh>
        {/* tie cable (visual) from top of arm down to base */}
        <mesh position={[0.5, 0.7, 0]} rotation={[0, 0, -Math.PI * 0.22]}>
          <cylinderGeometry args={[0.012, 0.012, 1.3, 6]} />
          <meshLambertMaterial color="#3a4654" />
        </mesh>
        {/* hook at tip */}
        <mesh position={[1.95, 1.0, 0]} castShadow={false}>
          <boxGeometry args={[0.08, 0.3, 0.08]} />
          <meshLambertMaterial color="#3a4654" />
        </mesh>
        {/* cyan emissive operator cab near pivot */}
        <mesh position={[0, 0.2, 0.15]} castShadow={false}>
          <boxGeometry args={[0.18, 0.22, 0.18]} />
          <meshLambertMaterial color="#1c3a5c" emissive="#5dd4e8" emissiveIntensity={0.5} />
        </mesh>
        {/* red safety light at arm tip */}
        <mesh position={[1.95, 1.15, 0]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshLambertMaterial emissive="#e8504a" emissiveIntensity={2} color="#000" />
        </mesh>
      </group>
    </>
  )
}
