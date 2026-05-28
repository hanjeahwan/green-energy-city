import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

export type DroneVariant = 'circle' | 'patrol' | 'inspect' | 'scan' | 'cargo'

interface DroneProps {
  variant?: DroneVariant
  center?: [number, number, number]
  endpoint?: [number, number, number]
  color?: string
  scale?: number
  speed?: number
  phase?: number
}

const VARIANT_COLOR: Record<DroneVariant, string> = {
  circle: '#2bbd84',
  patrol: '#ff4040',
  inspect: '#ffd166',
  scan: '#2bbd84',
  cargo: '#3a8fff',
}

const DEFAULT_CENTER: Record<DroneVariant, [number, number, number]> = {
  circle: [3.4, 4.0, 1.4],
  patrol: [0, 10.5, 0],
  inspect: [-12, 6.5, -12],
  scan: [0, 8, 0],
  cargo: [3, 9.2, 12],
}

// X-frame rotor positions: 4 corners of ~0.36m square, slightly above body center
const ROTOR_POSITIONS: [number, number, number][] = [
  [0.18, 0.04, 0.18],
  [-0.18, 0.04, 0.18],
  [0.18, 0.04, -0.18],
  [-0.18, 0.04, -0.18],
]

export function Drone({
  variant = 'circle',
  center,
  endpoint,
  color,
  scale = 1,
  speed = 1,
  phase = 0,
}: DroneProps = {}) {
  const ref = useRef<THREE.Group>(null!)
  const rotorRefs = [
    useRef<THREE.Group>(null!),
    useRef<THREE.Group>(null!),
    useRef<THREE.Group>(null!),
    useRef<THREE.Group>(null!),
  ]
  const pulseRef = useRef<THREE.MeshLambertMaterial>(null!)

  const c = center ?? DEFAULT_CENTER[variant]
  const ep = endpoint ?? [c[0] + 5, c[1], c[2]]
  const navTint = color ?? VARIANT_COLOR[variant]

  useFrame((s) => {
    const t = s.clock.getElapsedTime() * speed + phase
    if (!ref.current) return

    if (variant === 'circle') {
      const r = 2.0
      const theta = t * 0.25
      ref.current.position.set(
        c[0] + Math.cos(theta) * r,
        c[1] + Math.sin(t * 0.5) * 0.18,
        c[2] + Math.sin(theta) * r
      )
      ref.current.rotation.y = theta + Math.PI / 2
    } else if (variant === 'patrol') {
      const a = 18
      const verts: [number, number][] = [[-a, -a], [a, -a], [a, a], [-a, a]]
      const u = ((t * 0.05) % 1) * 4
      const seg = Math.floor(u) % 4
      const f = u - Math.floor(u)
      const v0 = verts[seg]
      const v1 = verts[(seg + 1) % 4]
      const x = c[0] + v0[0] + (v1[0] - v0[0]) * f
      const z = c[2] + v0[1] + (v1[1] - v0[1]) * f
      ref.current.position.set(x, c[1], z)
      ref.current.rotation.y = Math.atan2(v1[0] - v0[0], v1[1] - v0[1])
    } else if (variant === 'inspect') {
      const r = 3.0
      const theta = t * 0.2
      ref.current.position.set(
        c[0] + Math.cos(theta) * r,
        c[1] + Math.sin(t * 0.3) * 0.25,
        c[2] + Math.sin(theta) * r
      )
      ref.current.rotation.y = theta + Math.PI / 2
    } else if (variant === 'scan') {
      const r = 5.0
      const theta = t * 0.18
      ref.current.position.set(
        c[0] + Math.cos(theta) * r,
        c[1] + Math.sin(theta * 2) * 1.0,
        c[2] + Math.sin(theta) * r
      )
      ref.current.rotation.y = theta + Math.PI / 2
    } else if (variant === 'cargo') {
      const k = (1 + Math.sin(t * 0.25)) * 0.5
      ref.current.position.set(
        c[0] + (ep[0] - c[0]) * k,
        c[1] + (ep[1] - c[1]) * k,
        c[2] + (ep[2] - c[2]) * k
      )
      ref.current.rotation.y =
        Math.atan2(ep[0] - c[0], ep[2] - c[2]) + (Math.cos(t * 0.25) > 0 ? 0 : Math.PI)
    }

    const spin = t * 22
    for (let i = 0; i < rotorRefs.length; i++) {
      const r = rotorRefs[i]
      if (r.current) r.current.rotation.y = i % 2 === 0 ? spin : -spin
    }

    if (variant === 'patrol' && pulseRef.current) {
      pulseRef.current.emissiveIntensity = 2.5 + Math.sin(t * 4) * 1.5
    }
  })

  const bodyScale = variant === 'patrol' ? 1.3 : 1

  return (
    <group ref={ref} scale={[scale, scale, scale]}>
      <group scale={[bodyScale, bodyScale, bodyScale]}>
        {/* ============== Variant body & payload ============== */}
        {variant === 'circle' && (
          <>
            <mesh castShadow={false}>
              <sphereGeometry args={[0.085, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshLambertMaterial color="#2a3340" />
            </mesh>
            <mesh position={[0, -0.025, 0]}>
              <cylinderGeometry args={[0.085, 0.07, 0.05, 14]} />
              <meshLambertMaterial color="#1a2230" />
            </mesh>
            <mesh position={[0, -0.07, 0.1]}>
              <boxGeometry args={[0.2, 0.006, 0.012]} />
              <meshLambertMaterial color="#0e1420" />
            </mesh>
            <mesh position={[0, -0.07, -0.1]}>
              <boxGeometry args={[0.2, 0.006, 0.012]} />
              <meshLambertMaterial color="#0e1420" />
            </mesh>
            <mesh position={[0, 0.075, 0]}>
              <sphereGeometry args={[0.018, 8, 8]} />
              <meshLambertMaterial emissive={navTint} emissiveIntensity={2.5} color="#000" />
            </mesh>
          </>
        )}

        {variant === 'patrol' && (
          <>
            <mesh castShadow={false}>
              <boxGeometry args={[0.2, 0.08, 0.2]} />
              <meshLambertMaterial color="#0a0d12" />
            </mesh>
            <mesh position={[0, 0.015, 0]}>
              <boxGeometry args={[0.205, 0.015, 0.205]} />
              <meshLambertMaterial color="#cc1a1a" emissive="#cc1a1a" emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[0, 0.065, 0]}>
              <sphereGeometry args={[0.028, 10, 10]} />
              <meshLambertMaterial
                ref={pulseRef}
                emissive="#ff2020"
                emissiveIntensity={2.5}
                color="#300"
              />
            </mesh>
            <mesh position={[0, -0.06, 0]} castShadow={false}>
              <sphereGeometry args={[0.045, 12, 10]} />
              <meshLambertMaterial color="#1a1a1f" />
            </mesh>
          </>
        )}

        {variant === 'inspect' && (
          <>
            <mesh castShadow={false}>
              <boxGeometry args={[0.16, 0.06, 0.16]} />
              <meshLambertMaterial color="#2a3340" />
            </mesh>
            <mesh position={[0, 0.018, 0]}>
              <boxGeometry args={[0.165, 0.01, 0.165]} />
              <meshLambertMaterial color="#ffd166" emissive="#ffd166" emissiveIntensity={0.5} />
            </mesh>
            <mesh position={[0.05, 0.07, 0]}>
              <cylinderGeometry args={[0.0025, 0.0025, 0.055, 6]} />
              <meshLambertMaterial color="#888" />
            </mesh>
            <mesh position={[-0.05, 0.07, 0]}>
              <cylinderGeometry args={[0.0025, 0.0025, 0.055, 6]} />
              <meshLambertMaterial color="#888" />
            </mesh>
            <mesh position={[0, -0.05, 0]} castShadow={false}>
              <sphereGeometry args={[0.055, 14, 12]} />
              <meshLambertMaterial color="#0e1014" />
            </mesh>
            <mesh position={[0, -0.05, 0.045]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.02, 0.024, 0.022, 14]} />
              <meshLambertMaterial color="#000" emissive="#3a5a8f" emissiveIntensity={0.7} />
            </mesh>
          </>
        )}

        {variant === 'scan' && (
          <>
            <mesh castShadow={false}>
              <boxGeometry args={[0.24, 0.035, 0.18]} />
              <meshLambertMaterial color="#1a3340" />
            </mesh>
            <mesh position={[0, 0.025, 0]}>
              <sphereGeometry args={[0.05, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshLambertMaterial color="#0e1d24" />
            </mesh>
            <mesh position={[0, -0.05, 0]}>
              <boxGeometry args={[0.34, 0.025, 0.07]} />
              <meshLambertMaterial color="#0e1420" />
            </mesh>
            {[-0.13, -0.065, 0, 0.065, 0.13].map((x, i) => (
              <mesh key={i} position={[x, -0.065, 0]}>
                <boxGeometry args={[0.04, 0.004, 0.05]} />
                <meshLambertMaterial emissive="#2bbd84" emissiveIntensity={2.2} color="#000" />
              </mesh>
            ))}
          </>
        )}

        {variant === 'cargo' && (
          <>
            <mesh castShadow={false}>
              <boxGeometry args={[0.18, 0.08, 0.18]} />
              <meshLambertMaterial color="#1a2540" />
            </mesh>
            <mesh position={[0, 0.015, 0]}>
              <boxGeometry args={[0.185, 0.012, 0.185]} />
              <meshLambertMaterial color="#3a8fff" emissive="#3a8fff" emissiveIntensity={0.5} />
            </mesh>
            <mesh position={[0, 0.06, 0]}>
              <sphereGeometry args={[0.018, 8, 8]} />
              <meshLambertMaterial emissive="#3a8fff" emissiveIntensity={2.2} color="#000" />
            </mesh>
            {(
              [
                [0.06, 0.06],
                [-0.06, 0.06],
                [0.06, -0.06],
                [-0.06, -0.06],
              ] as [number, number][]
            ).map((p, i) => (
              <mesh key={i} position={[p[0], -0.1, p[1]]}>
                <cylinderGeometry args={[0.003, 0.003, 0.1, 6]} />
                <meshLambertMaterial color="#444" />
              </mesh>
            ))}
            <mesh position={[0, -0.18, 0]} castShadow={false}>
              <boxGeometry args={[0.14, 0.1, 0.14]} />
              <meshLambertMaterial color="#8a6b3e" />
            </mesh>
            <mesh position={[0, -0.18, 0.073]}>
              <boxGeometry args={[0.1, 0.018, 0.005]} />
              <meshLambertMaterial color="#ff5a1a" emissive="#ff5a1a" emissiveIntensity={0.6} />
            </mesh>
          </>
        )}

        {/* ============== Shared X-frame arms ============== */}
        {ROTOR_POSITIONS.map((p, i) => {
          const len = Math.sqrt(p[0] ** 2 + p[2] ** 2)
          const ang = Math.atan2(p[2], p[0])
          return (
            <mesh
              key={`arm-${i}`}
              position={[p[0] / 2, p[1] - 0.005, p[2] / 2]}
              rotation={[0, -ang, 0]}
            >
              <boxGeometry args={[len, 0.014, 0.022]} />
              <meshLambertMaterial color="#1a2230" />
            </mesh>
          )
        })}

        {/* ============== Shared rotor assemblies ============== */}
        {ROTOR_POSITIONS.map((p, i) => (
          <group key={`rotor-${i}`} position={p}>
            <mesh>
              <cylinderGeometry args={[0.04, 0.04, 0.014, 12]} />
              <meshLambertMaterial color="#0e1420" />
            </mesh>
            <group ref={rotorRefs[i]} position={[0, 0.014, 0]}>
              <mesh>
                <boxGeometry args={[0.16, 0.004, 0.02]} />
                <meshBasicMaterial color="#5aa0d0" transparent opacity={0.5} />
              </mesh>
              <mesh rotation={[0, Math.PI / 2, 0]}>
                <boxGeometry args={[0.16, 0.004, 0.02]} />
                <meshBasicMaterial color="#5aa0d0" transparent opacity={0.5} />
              </mesh>
            </group>
            <mesh position={[0, -0.012, 0]}>
              <sphereGeometry args={[0.012, 6, 6]} />
              <meshLambertMaterial emissive={navTint} emissiveIntensity={2} color="#000" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}
