import { BaseShadowDisc } from '../../components/scenePrimitives'
import { AlarmCluster } from '../../components/AlarmCluster'
import { pickCoolAccent } from '../../scene/accentColor'
import { StatusRing, type Status } from '../StatusRing'
import type { ElementVariant } from '../types'
import { ParkedEV } from '../vehicles/ParkedEV'

// =============================================================================
// SolarCanopy variants
//   classic — 4 posts + single tilted PV panel + cyan underseam
//   modern  — pergola: same posts + 8 individual slatted PV fins instead of one panel
// Both share the 2.4×1.8 footprint.
// =============================================================================

interface CanopyFeatures {}

export const SOLARCANOPY_VARIANTS: Record<string, ElementVariant<CanopyFeatures>> = {
  classic: { id: 'classic', footprint: { halfW: 1.2, halfD: 0.9 } },
  modern:  { id: 'modern',  footprint: { halfW: 1.2, halfD: 0.9 } }
}

export function SolarCanopy({
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
  // Per-instance accent for the seam under the panel — distinct cool hue per canopy.
  const accent = pickCoolAccent(position[0] * 7 + position[2] * 11)
  return (
    <group position={position} rotation={[0, rot, 0]}>
      <BaseShadowDisc position={[0, 0.005, 0]} radius={1.6} opacity={0.28} />
      {/* 4 support posts — lowered from 1.6m → 0.92m so the canopy reads as
          a single-storey carport instead of looming over neighbouring
          residential buildings. Posts are centred at y=h/2. */}
      {[[-1.1, -0.8], [1.1, -0.8], [-1.1, 0.8], [1.1, 0.8]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.46, z]} castShadow={false}>
          <cylinderGeometry args={[0.04, 0.04, 0.92, 6]} />
          <meshLambertMaterial color="#3a4a5e" />
        </mesh>
      ))}
      {/* Two small cars parked under the canopy (per user request). The
          canopy is now low enough that ground-level cars fit cleanly. */}
      <ParkedEV position={[-0.6, 0, 0]} rotationY={Math.PI / 2} bodyColor="#dde4ec" length={0.72} width={0.4} />
      <ParkedEV position={[ 0.6, 0, 0]} rotationY={Math.PI / 2} bodyColor="#1a2030" length={0.72} width={0.4} />
      {isModern ? <ModernPergola accent={accent} /> : <ClassicTilt accent={accent} />}
      {status && <StatusRing status={status} radius={1.4} />}
      {status === 'crit' && <AlarmCluster position={[0, 0, 0]} radius={1.6} height={2.2} />}
    </group>
  )
}

// Panel positions follow the lowered post height (0.92m). Original panel sat
// at y=1.55; now at y=0.92 with the same 0.12 rad pitch.
function ClassicTilt({ accent }: { accent: string }) {
  return (
    <>
      <mesh position={[0, 0.92, 0]} rotation={[-Math.PI / 2 + 0.12, 0, 0]} castShadow={false}>
        <boxGeometry args={[2.4, 1.8, 0.04]} />
        <meshLambertMaterial color="#143258" />
      </mesh>
      <mesh position={[0, 0.875, 0]} rotation={[-Math.PI / 2 + 0.12, 0, 0]}>
        <planeGeometry args={[2.4, 0.025]} />
        <meshLambertMaterial color="#000" emissive={accent} emissiveIntensity={0.8} />
      </mesh>
    </>
  )
}

function ModernPergola({ accent }: { accent: string }) {
  // 8 slatted PV fins running long-side, each tilted slightly, with gaps
  // between for the "pergola" feel. Top crossbeam connects them.
  // All Y coords dropped from ~1.62 → ~0.97 alongside the post height cut.
  return (
    <>
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[2.4, 0.04, 0.08]} />
        <meshLambertMaterial color="#3a4a5e" />
      </mesh>
      <mesh position={[0, 1.0, 0.7]}>
        <boxGeometry args={[2.4, 0.04, 0.08]} />
        <meshLambertMaterial color="#3a4a5e" />
      </mesh>
      <mesh position={[0, 1.0, -0.7]}>
        <boxGeometry args={[2.4, 0.04, 0.08]} />
        <meshLambertMaterial color="#3a4a5e" />
      </mesh>
      {Array.from({ length: 8 }).map((_, i) => {
        const x = (i - 3.5) * 0.3
        return (
          <mesh
            key={i}
            position={[x, 0.97, 0]}
            rotation={[0, 0, 0.18]}
            castShadow={false}
          >
            <boxGeometry args={[0.18, 0.03, 1.55]} />
            <meshLambertMaterial color="#143258" />
          </mesh>
        )
      })}
      <mesh position={[0, 0.92, 0]}>
        <boxGeometry args={[2.4, 0.012, 0.04]} />
        <meshLambertMaterial color="#000" emissive={accent} emissiveIntensity={0.8} />
      </mesh>
    </>
  )
}
