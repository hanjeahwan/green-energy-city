import * as THREE from 'three'
import { useThrottledFrame } from '../../scene/throttledFrame'
import { useRef } from 'react'
import { BaseShadowDisc } from '../../components/scenePrimitives'
import { AlarmCluster } from '../../components/AlarmCluster'
import { pickCoolAccent } from '../../scene/accentColor'
import { StatusRing, type Status } from '../StatusRing'
import type { ElementVariant } from '../types'
import { ACCENT_CYAN } from '../buildings/catalog'

// =============================================================================
// DroneDeliveryHub variants
//   classic — landing pad + cyan H marking + 4 blink markers + 2 hovering drones (animated)
//   modern  — enclosed hangar shed + 1 drone docked on pad in front + cyan glow under shed
// Both share the ~1.4×1.4 footprint.
// =============================================================================

interface DroneHubFeatures {}

export const DRONEHUB_VARIANTS: Record<string, ElementVariant<DroneHubFeatures>> = {
  classic: { id: 'classic', footprint: { halfW: 0.7, halfD: 0.7 } },
  modern:  { id: 'modern',  footprint: { halfW: 0.7, halfD: 0.7 } }
}

export function DroneDeliveryHub({
  position,
  variant = 'classic',
  status
}: {
  position: [number, number, number]
  variant?: string
  status?: Status
}) {
  const accent = pickCoolAccent(position[0] * 19 + position[2] * 23)
  return (
    <group position={position}>
      <BaseShadowDisc position={[0, 0.005, 0]} radius={0.7} opacity={0.32} />
      {variant === 'modern' ? <ModernHangar accent={accent} /> : <ClassicPadWithDrones accent={accent} />}
      {status && <StatusRing status={status} radius={0.9} />}
      {status === 'crit' && <AlarmCluster position={[0, 0, 0]} radius={1.0} height={1.5} coneCount={6} />}
    </group>
  )
}

function ClassicPadWithDrones({ accent }: { accent: string }) {
  const drone1 = useRef<THREE.Group>(null!)
  const drone2 = useRef<THREE.Group>(null!)
  const rotorRefs = [
    useRef<THREE.Mesh>(null!), useRef<THREE.Mesh>(null!), useRef<THREE.Mesh>(null!), useRef<THREE.Mesh>(null!),
    useRef<THREE.Mesh>(null!), useRef<THREE.Mesh>(null!), useRef<THREE.Mesh>(null!), useRef<THREE.Mesh>(null!)
  ]
  useThrottledFrame((s) => {
    const t = s.clock.getElapsedTime()
    if (drone1.current) drone1.current.position.y = 0.7 + Math.sin(t * 1.5) * 0.08
    if (drone2.current) drone2.current.position.y = 0.9 + Math.sin(t * 1.5 + 1.0) * 0.08
    const spin = t * 28
    rotorRefs.forEach((r, i) => {
      if (r.current) r.current.rotation.y = i % 2 === 0 ? spin : -spin
    })
  }, 30)
  return (
    <>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.08, 24]} />
        <meshLambertMaterial color="#3a4a5e" />
      </mesh>
      <mesh position={[0, 0.085, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5, 24]} />
        <meshLambertMaterial color="#000" emissive={accent} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[-0.12, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.06, 0.35]} />
        <meshBasicMaterial color="#5dd4e8" />
      </mesh>
      <mesh position={[0.12, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.06, 0.35]} />
        <meshBasicMaterial color="#5dd4e8" />
      </mesh>
      <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.3, 0.06]} />
        <meshBasicMaterial color="#5dd4e8" />
      </mesh>
      {[[0.55, 0], [-0.55, 0], [0, 0.55], [0, -0.55]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.1, z]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshLambertMaterial color="#000" emissive={ACCENT_CYAN} emissiveIntensity={2} />
        </mesh>
      ))}
      <group ref={drone1} position={[0.3, 0.7, 0]}>
        <mesh>
          <boxGeometry args={[0.18, 0.04, 0.18]} />
          <meshLambertMaterial color="#c8d0db" />
        </mesh>
        {([[0.1, 0.04, 0.1], [-0.1, 0.04, 0.1], [0.1, 0.04, -0.1], [-0.1, 0.04, -0.1]] as [number, number, number][]).map((p, i) => (
          <mesh key={i} position={p} ref={rotorRefs[i]}>
            <cylinderGeometry args={[0.07, 0.07, 0.005, 12]} />
            <meshBasicMaterial color="#5dd4e8" transparent opacity={0.55} />
          </mesh>
        ))}
      </group>
      <group ref={drone2} position={[-0.25, 0.9, 0.15]}>
        <mesh>
          <boxGeometry args={[0.16, 0.04, 0.16]} />
          <meshLambertMaterial color="#c8d0db" />
        </mesh>
        {([[0.09, 0.04, 0.09], [-0.09, 0.04, 0.09], [0.09, 0.04, -0.09], [-0.09, 0.04, -0.09]] as [number, number, number][]).map((p, i) => (
          <mesh key={i} position={p} ref={rotorRefs[i + 4]}>
            <cylinderGeometry args={[0.065, 0.065, 0.005, 12]} />
            <meshBasicMaterial color="#5dd4e8" transparent opacity={0.55} />
          </mesh>
        ))}
      </group>
    </>
  )
}

function ModernHangar({ accent }: { accent: string }) {
  // Enclosed shed at back-half of footprint + small pad in front with one resting drone
  return (
    <>
      {/* shed base / floor */}
      <mesh position={[0, 0.04, -0.2]}>
        <cylinderGeometry args={[0.6, 0.6, 0.08, 24]} />
        <meshLambertMaterial color="#3a4a5e" />
      </mesh>
      {/* hangar building body */}
      <mesh position={[0, 0.45, -0.32]} castShadow={false}>
        <boxGeometry args={[0.9, 0.7, 0.45]} />
        <meshLambertMaterial color="#c8d0db" />
      </mesh>
      {/* arched/gable roof on hangar — single sloped front-to-back */}
      <mesh position={[0, 0.83, -0.32]} rotation={[Math.PI * 0.07, 0, 0]} castShadow={false}>
        <boxGeometry args={[0.95, 0.04, 0.5]} />
        <meshLambertMaterial color="#3a4654" />
      </mesh>
      {/* hangar open front — accent glow inside (per instance) */}
      <mesh position={[0, 0.4, -0.1]}>
        <planeGeometry args={[0.65, 0.55]} />
        <meshLambertMaterial color="#000" emissive={accent} emissiveIntensity={0.6} />
      </mesh>
      {/* hangar side LED strip */}
      <mesh position={[0.46, 0.45, -0.32]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.4, 0.04]} />
        <meshLambertMaterial color="#000" emissive={accent} emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[-0.46, 0.45, -0.32]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[0.4, 0.04]} />
        <meshLambertMaterial color="#000" emissive={accent} emissiveIntensity={1.2} />
      </mesh>
      {/* front landing pad (small) */}
      <mesh position={[0, 0.045, 0.32]}>
        <cylinderGeometry args={[0.28, 0.28, 0.07, 18]} />
        <meshLambertMaterial color="#3a4a5e" />
      </mesh>
      {/* docked drone on pad (stationary, no useFrame) */}
      <group position={[0, 0.18, 0.32]}>
        <mesh>
          <boxGeometry args={[0.18, 0.04, 0.18]} />
          <meshLambertMaterial color="#c8d0db" />
        </mesh>
        {([[0.1, 0.04, 0.1], [-0.1, 0.04, 0.1], [0.1, 0.04, -0.1], [-0.1, 0.04, -0.1]] as [number, number, number][]).map((p, i) => (
          <mesh key={i} position={p}>
            <cylinderGeometry args={[0.07, 0.07, 0.005, 12]} />
            <meshBasicMaterial color="#5dd4e8" transparent opacity={0.45} />
          </mesh>
        ))}
      </group>
      {/* 2 perimeter blink markers (fewer than classic) */}
      {[[0.55, 0.3], [-0.55, 0.3]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.1, z]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshLambertMaterial color="#000" emissive={ACCENT_CYAN} emissiveIntensity={2} />
        </mesh>
      ))}
    </>
  )
}
