import { BaseShadowDisc } from '../../components/scenePrimitives'
import type { ElementVariant } from '../types'
import { ACCENT_CYAN } from '../buildings/catalog'

// =============================================================================
// VerticalFarmPlanter variants
//   classic — concrete box + 4 green moss stripe facades + dark slate top + cyan sensor
//   modern  — open trellis frame: 4 corner posts + 3 horizontal slats + hanging plant strings
// Same footprint, distinctive silhouette.
// =============================================================================

interface PlanterFeatures {}

export const PLANTER_VARIANTS: Record<string, ElementVariant<PlanterFeatures>> = {
  classic: { id: 'classic', footprint: { halfW: 0.2, halfD: 0.2 } },
  modern:  { id: 'modern',  footprint: { halfW: 0.2, halfD: 0.2 } }
}

export function VerticalFarmPlanter({
  position,
  rot = 0,
  variant = 'classic'
}: {
  position: [number, number, number]
  rot?: number
  variant?: string
}) {
  return (
    <group position={position} rotation={[0, rot, 0]}>
      <BaseShadowDisc position={[0, 0.005, 0]} radius={0.28} opacity={0.3} />
      {variant === 'modern' ? <ModernTrellis /> : <ClassicMossBox />}
    </group>
  )
}

function ClassicMossBox() {
  return (
    <>
      <mesh position={[0, 0.35, 0]} castShadow={false} receiveShadow>
        <boxGeometry args={[0.4, 0.7, 0.4]} />
        <meshLambertMaterial color="#eef2f7" />
      </mesh>
      {[
        { p: [0, 0.35, 0.205] as [number, number, number], r: [0, 0, 0] as [number, number, number] },
        { p: [0, 0.35, -0.205] as [number, number, number], r: [0, Math.PI, 0] as [number, number, number] },
        { p: [0.205, 0.35, 0] as [number, number, number], r: [0, Math.PI / 2, 0] as [number, number, number] },
        { p: [-0.205, 0.35, 0] as [number, number, number], r: [0, -Math.PI / 2, 0] as [number, number, number] }
      ].map((side, i) => (
        <mesh key={i} position={side.p} rotation={side.r}>
          <planeGeometry args={[0.06, 0.58]} />
          <meshLambertMaterial color="#3a7a4a" />
        </mesh>
      ))}
      <mesh position={[0, 0.72, 0]} castShadow={false}>
        <boxGeometry args={[0.42, 0.04, 0.42]} />
        <meshLambertMaterial color="#3a4a5e" />
      </mesh>
      <mesh position={[0, 0.75, 0]}>
        <sphereGeometry args={[0.018, 6, 6]} />
        <meshLambertMaterial color="#000" emissive={ACCENT_CYAN} emissiveIntensity={2} />
      </mesh>
    </>
  )
}

function ModernTrellis() {
  // Open frame: 4 corner posts + 3 horizontal slats running across + hanging vines.
  const halfW = 0.18
  const halfD = 0.18
  const corners: Array<[number, number]> = [
    [halfW, halfD], [-halfW, halfD], [halfW, -halfD], [-halfW, -halfD]
  ]
  return (
    <>
      {/* 4 corner posts */}
      {corners.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.4, z]} castShadow={false}>
          <boxGeometry args={[0.03, 0.8, 0.03]} />
          <meshLambertMaterial color="#5a6878" />
        </mesh>
      ))}
      {/* 3 horizontal slats spanning front-back */}
      {[0.15, 0.4, 0.65].map((y, i) => (
        <mesh key={`slat-${i}`} position={[0, y, 0]}>
          <boxGeometry args={[halfW * 2 + 0.04, 0.025, halfD * 2 + 0.04]} />
          <meshLambertMaterial color="#3a4a5e" />
        </mesh>
      ))}
      {/* hanging plant strings (4 vertical green tendrils) */}
      {[[-halfW * 0.6, halfD * 0.6], [halfW * 0.6, halfD * 0.6], [-halfW * 0.6, -halfD * 0.6], [halfW * 0.6, -halfD * 0.6]].map(([x, z], i) => (
        <mesh key={`vine-${i}`} position={[x, 0.4, z]}>
          <boxGeometry args={[0.04, 0.5, 0.04]} />
          <meshLambertMaterial color="#3a8a52" />
        </mesh>
      ))}
      {/* top irrigation pipe (cyan accent) */}
      <mesh position={[0, 0.8, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, halfW * 2 + 0.04, 6]} />
        <meshLambertMaterial color="#000" emissive={ACCENT_CYAN} emissiveIntensity={0.8} />
      </mesh>
      {/* bottom soil tray */}
      <mesh position={[0, 0.04, 0]} castShadow={false}>
        <boxGeometry args={[halfW * 2 + 0.05, 0.08, halfD * 2 + 0.05]} />
        <meshLambertMaterial color="#5a3a26" />
      </mesh>
    </>
  )
}
