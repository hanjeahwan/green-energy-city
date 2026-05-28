import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { STATUS } from '../scene/palette'

// =============================================================================
// StatusRing — lightweight ok / warn / crit indicator (2 concentric rings,
// inner one pulses outward). Sized via `radius`; colour driven by `status`.
//
// Sibling of AlarmCluster: StatusRing is the universal status badge for any
// element that wants to surface a state visually. AlarmCluster is the heavier
// "crit" alert visual (rings + scan beam + cones), reserved for the alarm
// hero(es). A facility in 'crit' typically renders BOTH.
//
// Phase G (visual upgrade): opacity reduced from 0.7/0.45 → 0.5/0.3 so the
// new emissive-rich hero set doesn't compete with status rings; colours
// shifted to STATUS triad (palette.ts) for consistency with FacilityCard.
// =============================================================================

export type Status = 'ok' | 'warn' | 'crit'

const STATUS_COLOR: Record<Status, string> = STATUS
const ENABLE_STATUS_RING = false

interface StatusRingProps {
  status: Status
  radius?: number
  height?: number
}

export function StatusRing(props: StatusRingProps) {
  if (!ENABLE_STATUS_RING) return null
  return <StatusRingVisual {...props} />
}

function StatusRingVisual({
  status,
  radius = 1.0,
  height = 0.04
}: StatusRingProps) {
  const inner = useRef<THREE.Mesh>(null!)
  const innerMat = useRef<THREE.MeshBasicMaterial>(null!)
  const outerMat = useRef<THREE.MeshBasicMaterial>(null!)
  // Initial color set once; subsequent status changes lerp toward target.
  const initialColor = useMemo(() => new THREE.Color(STATUS_COLOR[status]), []) // eslint-disable-line react-hooks/exhaustive-deps
  const currentColor = useRef<THREE.Color>(initialColor.clone())
  const targetColor = useMemo(() => new THREE.Color(STATUS_COLOR[status]), [status])
  const lastUpdateRef = useRef(0)
  // Pulse + color lerp throttled to ~30Hz (cinema is 24fps; eye can't
  // distinguish a breathing ring at 30 vs 60). Halves per-frame state writes
  // for every PV station + every status-tagged anchor.
  useFrame((s) => {
    const t = s.clock.getElapsedTime()
    if (t - lastUpdateRef.current < 1 / 30) return
    lastUpdateRef.current = t
    currentColor.current.lerp(targetColor, 0.22)
    if (innerMat.current) innerMat.current.color.copy(currentColor.current)
    if (outerMat.current) outerMat.current.color.copy(currentColor.current)
    if (inner.current && innerMat.current) {
      const phase = (t * 0.7) % 2.0
      inner.current.scale.setScalar(0.8 + phase)
      innerMat.current.opacity = 0.5 - (phase / 2.0) * 0.5
    }
  })
  const color = STATUS_COLOR[status]
  const innerInner = radius * 0.78  // inner ring inside-radius
  const innerOuter = radius * 0.87  // inner ring outside-radius
  const outerInner = radius * 1.00  // outer ring inside-radius
  const outerOuter = radius * 1.04  // outer ring outside-radius
  return (
    <group>
      {/* inner pulsing ring */}
      <mesh ref={inner} position={[0, height, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[innerInner, innerOuter, 64]} />
        <meshBasicMaterial
          ref={innerMat}
          color={color}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* static outer ring — opacity 0.45 → 0.3 (Phase G). */}
      <mesh position={[0, height * 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[outerInner, outerOuter, 64]} />
        <meshBasicMaterial
          ref={outerMat}
          color={color}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
