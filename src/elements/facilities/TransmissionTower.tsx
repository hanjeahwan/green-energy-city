import { BaseShadowDisc } from '../../components/scenePrimitives'
import { AlarmCluster } from '../../components/AlarmCluster'
import { StatusRing, type Status } from '../StatusRing'
import { STEEL_MID, STEEL_LIGHT_2 } from './palette'
import type { ElementVariant } from '../types'

// =============================================================================
// TransmissionTower variants
//   classic — 4-leg lattice tower (4 legs + 3 cross-ties + 2 horizontal arms + 4 insulators)
//   modern  — H-frame steel gantry (2 vertical posts + horizontal top beam + diagonal X-bracing)
// Same 0.6×0.6 base footprint; both reach ~2.5m tall.
// =============================================================================

interface TransmissionFeatures {}

export const TRANSMISSIONTOWER_VARIANTS: Record<string, ElementVariant<TransmissionFeatures>> = {
  classic: { id: 'classic', footprint: { halfW: 0.3, halfD: 0.3 } },
  modern:  { id: 'modern',  footprint: { halfW: 0.3, halfD: 0.3 } }
}

export function TransmissionTower({
  position,
  rot = 0,
  variant = 'classic',
  status
}: {
  position: [number, number, number]
  rot?: number
  variant?: string
  status?: Status
}) {
  return (
    <group position={position} rotation={[0, rot, 0]}>
      <BaseShadowDisc position={[0, 0.005, 0]} radius={0.4} opacity={0.32} />
      {variant === 'modern' ? <ModernHFrame /> : <ClassicLattice />}
      {status && <StatusRing status={status} radius={0.6} />}
      {status === 'crit' && <AlarmCluster position={[0, 0, 0]} radius={0.7} height={2.5} coneCount={6} />}
    </group>
  )
}

function ClassicLattice() {
  const legs: { p: [number, number, number] }[] = [
    { p: [0.18, 0, 0.18] },
    { p: [-0.18, 0, 0.18] },
    { p: [0.18, 0, -0.18] },
    { p: [-0.18, 0, -0.18] }
  ]
  return (
    <>
      {legs.map((l, i) => (
        <mesh key={i} position={[l.p[0], 1.2, l.p[2]]} castShadow={false}>
          <cylinderGeometry args={[0.02, 0.025, 2.4, 6]} />
          <meshLambertMaterial color={STEEL_MID} />
        </mesh>
      ))}
      {[0.4, 1.2, 2.0].map((y, j) => (
        <group key={j} position={[0, y, 0]}>
          <mesh>
            <boxGeometry args={[0.4, 0.015, 0.015]} />
            <meshLambertMaterial color={STEEL_MID} />
          </mesh>
          <mesh rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[0.4, 0.015, 0.015]} />
            <meshLambertMaterial color={STEEL_MID} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 2.3, 0]} castShadow={false}>
        <boxGeometry args={[1.2, 0.05, 0.05]} />
        <meshLambertMaterial color={STEEL_MID} />
      </mesh>
      <mesh position={[0, 2.5, 0]} castShadow={false}>
        <boxGeometry args={[0.9, 0.05, 0.05]} />
        <meshLambertMaterial color={STEEL_MID} />
      </mesh>
      {[-0.55, -0.3, 0.3, 0.55].map((x, k) => (
        <mesh key={k} position={[x, 2.27, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.08, 6]} />
          <meshLambertMaterial color={STEEL_LIGHT_2} />
        </mesh>
      ))}
    </>
  )
}

function ModernHFrame() {
  // 2 vertical posts + horizontal top beam + diagonal X-bracing in the middle.
  return (
    <>
      {/* 2 vertical posts (taller, thicker than lattice legs) */}
      <mesh position={[-0.25, 1.25, 0]} castShadow={false}>
        <boxGeometry args={[0.07, 2.5, 0.07]} />
        <meshLambertMaterial color={STEEL_MID} />
      </mesh>
      <mesh position={[0.25, 1.25, 0]} castShadow={false}>
        <boxGeometry args={[0.07, 2.5, 0.07]} />
        <meshLambertMaterial color={STEEL_MID} />
      </mesh>
      {/* horizontal top beam */}
      <mesh position={[0, 2.45, 0]} castShadow={false}>
        <boxGeometry args={[0.7, 0.08, 0.08]} />
        <meshLambertMaterial color={STEEL_MID} />
      </mesh>
      {/* diagonal X-bracing center */}
      <mesh position={[0, 1.2, 0]} rotation={[0, 0, Math.atan2(2.0, 0.5)]} castShadow={false}>
        <boxGeometry args={[0.04, 2.06, 0.04]} />
        <meshLambertMaterial color={STEEL_MID} />
      </mesh>
      <mesh position={[0, 1.2, 0]} rotation={[0, 0, -Math.atan2(2.0, 0.5)]} castShadow={false}>
        <boxGeometry args={[0.04, 2.06, 0.04]} />
        <meshLambertMaterial color={STEEL_MID} />
      </mesh>
      {/* 3 insulators hanging from top beam */}
      {[-0.25, 0, 0.25].map((x, i) => (
        <mesh key={i} position={[x, 2.34, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 0.18, 6]} />
          <meshLambertMaterial color={STEEL_LIGHT_2} />
        </mesh>
      ))}
    </>
  )
}
