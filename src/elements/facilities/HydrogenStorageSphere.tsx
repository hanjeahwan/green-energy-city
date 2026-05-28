import { BaseShadowDisc } from '../../components/scenePrimitives'
import { AlarmCluster } from '../../components/AlarmCluster'
import { StatusRing, type Status } from '../StatusRing'
import type { ElementVariant } from '../types'
import { ACCENT_CYAN } from '../buildings/catalog'

// =============================================================================
// HydrogenStorageSphere variants
//   classic — single sphere on 4 legs + equator seam + cyan H2 label
//   modern  — tank array: 3 upright cylindrical tanks side-by-side + bottom manifold
// Both share the 1×1 footprint.
// =============================================================================

interface H2Features {}

export const H2SPHERE_VARIANTS: Record<string, ElementVariant<H2Features>> = {
  classic: { id: 'classic', footprint: { halfW: 0.5, halfD: 0.5 } },
  modern:  { id: 'modern',  footprint: { halfW: 0.5, halfD: 0.5 } }
}

export function HydrogenStorageSphere({
  position,
  variant = 'classic',
  status
}: {
  position: [number, number, number]
  variant?: string
  status?: Status
}) {
  return (
    <group position={position}>
      <BaseShadowDisc position={[0, 0.005, 0]} radius={0.7} opacity={0.32} />
      {variant === 'modern' ? <ModernTankArray /> : <ClassicSphere />}
      {status && status !== 'ok' && <StatusRing status={status} radius={0.7} />}
      {status === 'crit' && <AlarmCluster position={[0, 0, 0]} radius={0.9} height={1.5} coneCount={6} />}
    </group>
  )
}

function ClassicSphere() {
  return (
    <>
      {[[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.225, z]}>
          <cylinderGeometry args={[0.03, 0.03, 0.45, 6]} />
          <meshLambertMaterial color="#3a4a5e" />
        </mesh>
      ))}
      <mesh position={[0, 0.65, 0]} castShadow={false}>
        <sphereGeometry args={[0.5, 24, 18]} />
        <meshLambertMaterial color="#eef2f7" />
      </mesh>
      <mesh position={[0, 0.65, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.505, 0.008, 6, 24]} />
        <meshLambertMaterial color="#3a4a5e" />
      </mesh>
      <mesh position={[0, 0.65, 0.505]}>
        <planeGeometry args={[0.22, 0.13]} />
        <meshLambertMaterial color="#000" emissive={ACCENT_CYAN} emissiveIntensity={1.5} />
      </mesh>
    </>
  )
}

function ModernTankArray() {
  // 3 upright cylindrical tanks in a row (along x), each ~0.2 radius × 0.9 tall.
  // Bottom manifold connects all three.
  const tankPositions: [number, number][] = [[-0.32, 0], [0, 0], [0.32, 0]]
  return (
    <>
      {/* concrete pad */}
      <mesh position={[0, 0.025, 0]}>
        <boxGeometry args={[0.95, 0.05, 0.55]} />
        <meshLambertMaterial color="#5a6878" />
      </mesh>
      {/* 3 cylindrical tanks */}
      {tankPositions.map(([x, z], i) => (
        <group key={i} position={[x, 0.5, z]}>
          {/* tank body */}
          <mesh castShadow={false}>
            <cylinderGeometry args={[0.16, 0.16, 0.85, 16]} />
            <meshLambertMaterial color="#eef2f7" />
          </mesh>
          {/* hemispherical top cap */}
          <mesh position={[0, 0.425, 0]} castShadow={false}>
            <sphereGeometry args={[0.16, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshLambertMaterial color="#eef2f7" />
          </mesh>
          {/* tank ring seam */}
          <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.162, 0.005, 6, 18]} />
            <meshLambertMaterial color="#3a4a5e" />
          </mesh>
        </group>
      ))}
      {/* bottom manifold pipe connecting tanks (along x) */}
      <mesh position={[0, 0.15, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 0.7, 8]} />
        <meshLambertMaterial color="#c8d0db" />
      </mesh>
      {/* center cyan H2 label on middle tank */}
      <mesh position={[0, 0.55, 0.163]}>
        <planeGeometry args={[0.14, 0.1]} />
        <meshLambertMaterial color="#000" emissive={ACCENT_CYAN} emissiveIntensity={1.5} />
      </mesh>
    </>
  )
}
