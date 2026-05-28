import { BaseShadowDisc } from '../../components/scenePrimitives'
import { AlarmCluster } from '../../components/AlarmCluster'
import { pickCoolAccent } from '../../scene/accentColor'
import { StatusRing, type Status } from '../StatusRing'
import type { ElementVariant } from '../types'

// =============================================================================
// EVChargingHub variants
//   classic — 4 posts + flat canopy + cyan underside strip + 4 charging pylons
//   modern  — 4 standalone pillar chargers in a row, no overhead canopy + concrete pad
// Same 2.4×1.2 footprint.
// =============================================================================

interface EVHubFeatures {}

export const EVCHARGINGHUB_VARIANTS: Record<string, ElementVariant<EVHubFeatures>> = {
  classic: { id: 'classic', footprint: { halfW: 1.2, halfD: 0.6 } },
  modern:  { id: 'modern',  footprint: { halfW: 1.2, halfD: 0.6 } }
}

export function EVChargingHub({
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
  const isModern = variant === 'modern'
  const accent = pickCoolAccent(position[0] * 37 + position[2] * 41)
  return (
    <group position={position} rotation={[0, rot, 0]}>
      <BaseShadowDisc position={[0, 0.005, 0]} radius={1.6} opacity={0.3} />
      {isModern ? <ModernWallChargers accent={accent} /> : <ClassicCanopy accent={accent} />}
      {status && <StatusRing status={status} radius={1.4} />}
      {status === 'crit' && <AlarmCluster position={[0, 0, 0]} radius={1.7} height={2.5} />}
    </group>
  )
}

function ClassicCanopy({ accent }: { accent: string }) {
  return (
    <>
      {[[-1.05, -0.5], [1.05, -0.5], [-1.05, 0.5], [1.05, 0.5]].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.1, z]} castShadow={false}>
          <cylinderGeometry args={[0.04, 0.04, 2.2, 6]} />
          <meshLambertMaterial color="#c8d0db" />
        </mesh>
      ))}
      <mesh position={[0, 2.22, 0]} castShadow={false}>
        <boxGeometry args={[2.4, 0.08, 1.2]} />
        <meshLambertMaterial color="#3a4a5e" />
      </mesh>
      <mesh position={[0, 2.17, 0]}>
        <boxGeometry args={[2.2, 0.01, 1.0]} />
        <meshLambertMaterial color="#000" emissive={accent} emissiveIntensity={1.0} />
      </mesh>
      {[-0.75, -0.25, 0.25, 0.75].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh position={[0, 0.55, 0]} castShadow={false}>
            <boxGeometry args={[0.18, 1.1, 0.18]} />
            <meshLambertMaterial color="#c8d0db" />
          </mesh>
          <mesh position={[0, 0.85, 0.092]}>
            <planeGeometry args={[0.12, 0.18]} />
            <meshLambertMaterial color="#000" emissive={accent} emissiveIntensity={1.4} />
          </mesh>
        </group>
      ))}
    </>
  )
}

function ModernWallChargers({ accent }: { accent: string }) {
  return (
    <>
      {/* concrete pad */}
      <mesh position={[0, 0.025, 0]}>
        <boxGeometry args={[2.4, 0.05, 1.2]} />
        <meshLambertMaterial color="#5a6878" />
      </mesh>
      {/* back wall — chargers mount against this */}
      <mesh position={[0, 0.75, -0.45]} castShadow={false}>
        <boxGeometry args={[2.4, 1.5, 0.1]} />
        <meshLambertMaterial color="#c8d0db" />
      </mesh>
      {/* cyan accent strip on top of wall */}
      <mesh position={[0, 1.51, -0.45]}>
        <boxGeometry args={[2.4, 0.04, 0.12]} />
        <meshLambertMaterial color="#000" emissive={accent} emissiveIntensity={1.2} />
      </mesh>
      {/* 4 wall-mounted charger units in a row */}
      {[-0.9, -0.3, 0.3, 0.9].map((x, i) => (
        <group key={i} position={[x, 0.7, -0.36]}>
          {/* charger body — pillar attached to wall */}
          <mesh castShadow={false}>
            <boxGeometry args={[0.22, 0.9, 0.16]} />
            <meshLambertMaterial color="#1c3a5c" />
          </mesh>
          {/* cyan emissive screen on charger face */}
          <mesh position={[0, 0.18, 0.085]}>
            <planeGeometry args={[0.16, 0.22]} />
            <meshLambertMaterial color="#000" emissive={accent} emissiveIntensity={1.4} />
          </mesh>
          {/* cable hint dangling */}
          <mesh position={[0, -0.35, 0.08]}>
            <cylinderGeometry args={[0.018, 0.018, 0.3, 6]} />
            <meshLambertMaterial color="#3a4a5e" />
          </mesh>
        </group>
      ))}
    </>
  )
}
