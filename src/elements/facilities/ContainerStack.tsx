import * as THREE from 'three'
import { useMemo } from 'react'
import { tintedGeometry, flatGradMat, rng } from '../../components/sceneMaterials'
import { BaseShadowDisc } from '../../components/scenePrimitives'
import { AlarmCluster } from '../../components/AlarmCluster'
import { pickCoolAccent } from '../../scene/accentColor'
import { StatusRing, type Status } from '../StatusRing'
import type { ElementVariant } from '../types'

// =============================================================================
// ContainerStack variants
//   classic — 5 closed battery modules (3 bottom + 2 top) with vertical ridges + cyan LEDs
//   modern  — open frame rack: 2 horizontal shelves on a 4-corner steel frame, 4 visible
//             battery modules exposed inside
// Same 2.6×0.8 footprint.
// =============================================================================

interface ContainerFeatures {}

export const CONTAINERSTACK_VARIANTS: Record<string, ElementVariant<ContainerFeatures>> = {
  classic: { id: 'classic', footprint: { halfW: 1.3, halfD: 0.4 } },
  modern:  { id: 'modern',  footprint: { halfW: 1.3, halfD: 0.4 } }
}

export function ContainerStack({
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
  const accent = pickCoolAccent(position[0] * 29 + position[2] * 31)
  return (
    <group position={position} rotation={[0, rot, 0]}>
      <group position={[-1.05, 0, 0]}>
        <BaseShadowDisc position={[1.05, 0.005, 0]} radius={2.0} opacity={0.3} />
        {variant === 'modern' ? <ModernOpenRack accent={accent} /> : <ClassicStack accent={accent} />}
        {status && (
          <group position={[1.05, 0, 0]}>
            <StatusRing status={status} radius={1.5} />
          </group>
        )}
        {status === 'crit' && <AlarmCluster position={[1.05, 0, 0]} radius={1.8} height={1.5} />}
      </group>
    </group>
  )
}

function ClassicStack({ accent }: { accent: string }) {
  const palette = ['#143258', '#22354f', '#3a4a5e', '#5dd4e8', '#0e2440']
  const stack = [
    { y: 0.25, x: 0.225, color: palette[0] },
    { y: 0.25, x: 1.05, color: palette[1] },
    { y: 0.25, x: 1.875, color: palette[2] },
    { y: 0.78, x: 0.225, color: palette[3] },
    { y: 0.78, x: 1.05, color: palette[4] }
  ]
  return (
    <>
      {stack.map((s, i) => {
        // Box width 0.95 vs X spacing 0.825 between adjacent containers ->
        // each pair physically overlapped 12.5cm in solid geometry, so the
        // surfaces inside the overlap region z-fought permanently. Shrunk
        // to 0.78 (2cm gap each side) — containers now read as distinct
        // crates instead of a fused block.
        const geom = useMemo(() => {
          const g = new THREE.BoxGeometry(0.78, 0.5, 0.5)
          return tintedGeometry(g, s.color, 0.5)
        }, [s.color])
        return (
          <group key={i} position={[s.x, s.y, 0]} rotation={[0, (rng(i) - 0.5) * 0.06, 0]}>
            <mesh geometry={geom} material={flatGradMat({ roughness: 0.75 })} castShadow={false} />
            {/* Decorations layered with explicit depth separation:
                - vertical strips are BOX (5mm half-thickness on Z): center
                  at 0.270 -> occupies 0.265-0.275 (in front of container
                  face at 0.25 with 15mm clearance).
                - horizontal LEDs are PLANES: at z=0.290, a clear 1.5cm
                  in front of the strip box's front face.
                Previously strips at 0.278 (box 0.273-0.283) overlapped LEDs
                at 0.280 in Z, so at the cross points the LED plane sat
                INSIDE the strip box -> z-fight every frame. */}
            {[-0.3, 0, 0.3].map((rx, j) => (
              <mesh key={j} position={[rx, 0, 0.270]}>
                <boxGeometry args={[0.02, 0.4, 0.01]} />
                <meshLambertMaterial color="#000" transparent opacity={0.25} />
              </mesh>
            ))}
            {[-0.15, 0.15].map((yr, j) => (
              <mesh key={`led-${j}`} position={[0, yr, 0.290]}>
                <planeGeometry args={[0.85, 0.025]} />
                <meshLambertMaterial color="#000" emissive={accent} emissiveIntensity={1.2} />
              </mesh>
            ))}
          </group>
        )
      })}
    </>
  )
}

function ModernOpenRack({ accent }: { accent: string }) {
  // 4 corner posts forming a rectangular frame + 2 horizontal shelves at y=0.3 and y=0.75.
  // 4 smaller battery modules sit on shelves, visibly exposed (no enclosure walls).
  const frameW = 2.5
  const frameD = 0.6
  const corners: Array<[number, number]> = [
    [-frameW / 2 + 0.05, -frameD / 2 + 0.05],
    [frameW / 2 - 0.05, -frameD / 2 + 0.05],
    [-frameW / 2 + 0.05, frameD / 2 - 0.05],
    [frameW / 2 - 0.05, frameD / 2 - 0.05]
  ]
  const moduleColors = ['#143258', '#5dd4e8', '#22354f', '#1a3a5c']
  return (
    <group position={[1.05, 0, 0]}>
      {/* 4 corner posts */}
      {corners.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.6, z]} castShadow={false}>
          <boxGeometry args={[0.05, 1.2, 0.05]} />
          <meshLambertMaterial color="#5a6878" />
        </mesh>
      ))}
      {/* 2 horizontal shelves */}
      {[0.28, 0.72].map((y, i) => (
        <mesh key={`shelf-${i}`} position={[0, y, 0]} castShadow={false}>
          <boxGeometry args={[frameW + 0.05, 0.04, frameD + 0.05]} />
          <meshLambertMaterial color="#3a4a5e" />
        </mesh>
      ))}
      {/* 4 exposed battery modules (2 per shelf) */}
      {[
        { p: [-0.55, 0.5, 0], c: moduleColors[0] },
        { p: [0.55, 0.5, 0], c: moduleColors[1] },
        { p: [-0.55, 0.94, 0], c: moduleColors[2] },
        { p: [0.55, 0.94, 0], c: moduleColors[3] }
      ].map((m, i) => {
        const geom = useMemo(() => tintedGeometry(new THREE.BoxGeometry(0.9, 0.34, 0.45), m.c, 0.5), [m.c])
        return (
          <group key={i} position={m.p as [number, number, number]}>
            <mesh geometry={geom} material={flatGradMat({ roughness: 0.7 })} castShadow={false} />
            {/* emissive vent slot on top — accent per-instance */}
            <mesh position={[0, 0.18, 0]}>
              <boxGeometry args={[0.6, 0.012, 0.06]} />
              <meshLambertMaterial color="#000" emissive={accent} emissiveIntensity={1.2} />
            </mesh>
          </group>
        )
      })}
      {/* top rail with green status LED row */}
      <mesh position={[0, 1.18, 0]} castShadow={false}>
        <boxGeometry args={[frameW + 0.05, 0.04, frameD + 0.05]} />
        <meshLambertMaterial color="#5a6878" />
      </mesh>
      {[-0.8, -0.3, 0.3, 0.8].map((x, i) => (
        <mesh key={`status-${i}`} position={[x, 1.21, 0]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshLambertMaterial emissive="#2bbd84" emissiveIntensity={1.5} color="#000" />
        </mesh>
      ))}
    </group>
  )
}
