import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useThrottledFrame } from '../../scene/throttledFrame'
import { tintedGeometry, flatGradMat } from '../../components/sceneMaterials'
import { BaseShadowDisc } from '../../components/scenePrimitives'
import { AlarmCluster } from '../../components/AlarmCluster'
import { pickStatusDot } from '../../scene/accentColor'
import { StatusRing, type Status } from '../StatusRing'
import type { ElementVariant } from '../types'
import { ENERGY_CYAN, CLEAN_GREEN, ALERT_ORANGE, ALERT_RED } from '../../scene/palette'

// =============================================================================
// BatteryBank variants
//   classic — 4 modular boxes in a single row (one cyan-tinted), top slab + green LEDs
//   modern  — 2×2 grid of taller modules + central inverter housing + 4 status LEDs
// Same 2.6×1.5 footprint.
// =============================================================================

interface BatteryBankFeatures {}

export const BATTERYBANK_VARIANTS: Record<string, ElementVariant<BatteryBankFeatures>> = {
  classic: { id: 'classic', footprint: { halfW: 1.3, halfD: 0.75 } },
  modern:  { id: 'modern',  footprint: { halfW: 1.3, halfD: 0.75 } }
}

export function BatteryBank({
  position,
  variant = 'classic',
  status
}: {
  position: [number, number, number]
  variant?: string
  status?: Status
}) {
  // Per-instance status-dot accent — pickStatusDot picks from a small cool
  // palette (green/mint/cyan/jade), seeded by world position so reloads are
  // stable but adjacent banks look distinct.
  const dotSeed = position[0] * 13 + position[2] * 17
  const dotColor = pickStatusDot(dotSeed)
  return (
    <group position={position}>
      <BaseShadowDisc position={[0, 0.005, 0]} radius={1.6} opacity={0.32} />
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.6, 1.5]} />
        <meshLambertMaterial color="#a8b1bd" />
      </mesh>
      {variant === 'modern'
        ? <ModernTowerGrid dotColor={dotColor} ledStatus={status ?? 'ok'} />
        : <ClassicRow dotColor={dotColor} />}
      {status && status !== 'ok' && <StatusRing status={status} radius={1.5} />}
      {status === 'crit' && <AlarmCluster position={[0, 0, 0]} radius={1.5} height={2.0} />}
    </group>
  )
}

function ClassicRow({ dotColor }: { dotColor: string }) {
  return (
    <>
      {[-0.75, -0.25, 0.25, 0.75].map((x, i) => {
        const geom = useMemo(() => {
          const g = new THREE.BoxGeometry(0.4, 0.5, 1.1)
          g.translate(0, 0.25, 0)
          return tintedGeometry(g, i === 1 ? '#7fc4e8' : '#f5f7fa', 0.55)
        }, [])
        return (
          <group key={i} position={[x, 0, 0]}>
            <mesh geometry={geom} material={flatGradMat({ roughness: 0.7 })} castShadow />
            <mesh position={[0, 0.52, 0]} castShadow>
              <boxGeometry args={[0.42, 0.04, 1.12]} />
              <meshLambertMaterial color="#3a4654" />
            </mesh>
            <mesh position={[0, 0.55, 0.48]}>
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshLambertMaterial emissive={dotColor} emissiveIntensity={1.5} color="#000" />
            </mesh>
          </group>
        )
      })}
    </>
  )
}

function ModernTowerGrid({ dotColor, ledStatus }: { dotColor: string; ledStatus: Status }) {
  // 2×2 grid of TALLER modules (0.85m vs 0.5m classic) + a central inverter housing between them.
  const moduleSpec: Array<{ x: number; z: number; c: string }> = [
    { x: -0.7, z: -0.45, c: '#143258' },
    { x: 0.7,  z: -0.45, c: '#1a3a5c' },
    { x: -0.7, z: 0.45,  c: '#22354f' },
    { x: 0.7,  z: 0.45,  c: '#0e2440' }
  ]

  // Vent slots + central inverter screen blink at ~0.4 Hz. Color is driven by
  // status: ok → CLEAN_GREEN, warn → ALERT_ORANGE, crit → ALERT_RED.
  // Pre-this change the vent + screen were a static cyan #5dd4e8. The blink
  // gives the bank visible "life" the user asked for ("储能柜状态灯闪烁").
  const ventMats = useRef<(THREE.MeshLambertMaterial | null)[]>([])
  const screenMat = useRef<THREE.MeshLambertMaterial>(null!)
  const ledEmissive = ledStatus === 'crit'
    ? ALERT_RED
    : ledStatus === 'warn'
      ? ALERT_ORANGE
      : CLEAN_GREEN
  useThrottledFrame((s) => {
    const t = s.clock.getElapsedTime()
    // 2π × 0.4 Hz ≈ 2.5 — same frequency as the central tower helipad pulse.
    const v = 0.4 + 0.8 * (0.5 + 0.5 * Math.sin(t * 2.5))
    for (const m of ventMats.current) {
      if (m) m.emissiveIntensity = v
    }
    if (screenMat.current) {
      // Screen has a slightly faster sub-blink for "data activity" feel.
      screenMat.current.emissiveIntensity = 0.9 + 0.4 * Math.sin(t * 4.0)
    }
  }, 20)
  return (
    <>
      {moduleSpec.map((m, i) => {
        const geom = useMemo(() => {
          const g = new THREE.BoxGeometry(0.7, 0.85, 0.6)
          g.translate(0, 0.425, 0)
          return tintedGeometry(g, m.c, 0.5)
        }, [m.c])
        return (
          <group key={i} position={[m.x, 0, m.z]}>
            <mesh geometry={geom} material={flatGradMat({ roughness: 0.7 })} castShadow />
            {/* vertical vent slot on front face — animated blink at 0.4 Hz,
                colour from ledEmissive (status-derived). */}
            <mesh position={[0, 0.42, 0.302]}>
              <planeGeometry args={[0.5, 0.04]} />
              <meshLambertMaterial
                ref={(m) => { ventMats.current[i] = m }}
                color="#000"
                emissive={ledEmissive}
                emissiveIntensity={1.2}
              />
            </mesh>
            {/* small panel detail on top */}
            <mesh position={[0, 0.87, 0]} castShadow>
              <boxGeometry args={[0.72, 0.04, 0.62]} />
              <meshLambertMaterial color="#3a4654" />
            </mesh>
            {/* status dot — cool accent per instance */}
            <mesh position={[0, 0.9, 0.28]}>
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshLambertMaterial emissive={dotColor} emissiveIntensity={1.5} color="#000" />
            </mesh>
          </group>
        )
      })}
      {/* central inverter housing — slim vertical box between the 4 modules */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[0.4, 1.2, 0.4]} />
        <meshLambertMaterial color="#c8d0db" />
      </mesh>
      {/* cyan emissive screen on front of inverter — fast sub-blink for
          "data activity" feel, stays cyan even when status is warn (the
          screen is the inverter UI, separate from the vent LEDs). */}
      <mesh position={[0, 0.75, 0.205]}>
        <planeGeometry args={[0.28, 0.32]} />
        <meshLambertMaterial
          ref={screenMat}
          color="#000"
          emissive={ENERGY_CYAN}
          emissiveIntensity={1.4}
        />
      </mesh>
    </>
  )
}
