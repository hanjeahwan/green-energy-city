import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { VEHICLE_PATHS, VEHICLE_TRAVEL_SPEED } from '../../scene/vehicles'

export function Truck() {
  const ref = useRef<THREE.Group>(null!)
  const path = VEHICLE_PATHS.find((p) => p.id === 'truck')!
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        path.waypoints.map(([x, z]) => new THREE.Vector3(x, path.y, z)),
        true,
        'catmullrom',
        0.0
      ),
    [path]
  )
  const loopLength = useMemo(() => curve.getLength(), [curve])
  useFrame((s) => {
    if (!ref.current) return
    const t = (s.clock.getElapsedTime() * VEHICLE_TRAVEL_SPEED / loopLength + 0.6) % 1
    const pos = curve.getPointAt(t)
    const tangent = curve.getTangentAt(t)
    ref.current.position.copy(pos)
    ref.current.rotation.y = Math.atan2(tangent.x, tangent.z)
  })
  return (
    <group ref={ref}>
      {/* Cab (front of truck — local +z direction) */}
      <mesh position={[0, 0.28, 0.7]} castShadow={false}>
        <boxGeometry args={[0.5, 0.4, 0.4]} />
        <meshLambertMaterial color="#264027" />
      </mesh>
      {/* Cab windshield */}
      <mesh position={[0, 0.34, 0.91]}>
        <boxGeometry args={[0.42, 0.2, 0.02]} />
        <meshLambertMaterial color="#0d1a2a" />
      </mesh>
      {/* Cab grille / bumper */}
      <mesh position={[0, 0.14, 0.91]}>
        <boxGeometry args={[0.46, 0.08, 0.04]} />
        <meshLambertMaterial color="#1a1a1f" />
      </mesh>
      {/* Headlights */}
      <mesh position={[0.17, 0.22, 0.92]}>
        <sphereGeometry args={[0.028, 8, 8]} />
        <meshLambertMaterial emissive="#ffe066" emissiveIntensity={2} color="#000" />
      </mesh>
      <mesh position={[-0.17, 0.22, 0.92]}>
        <sphereGeometry args={[0.028, 8, 8]} />
        <meshLambertMaterial emissive="#ffe066" emissiveIntensity={2} color="#000" />
      </mesh>
      {/* Cargo box (rear) */}
      <mesh position={[0, 0.32, -0.1]} castShadow={false}>
        <boxGeometry args={[0.5, 0.48, 1.2]} />
        <meshLambertMaterial color="#d4d0c4" />
      </mesh>
      {/* Cargo box ribs (top, ×3) */}
      {[-0.4, 0, 0.4].map((zOff, i) => (
        <mesh key={i} position={[0, 0.57, -0.1 + zOff]}>
          <boxGeometry args={[0.51, 0.025, 0.04]} />
          <meshLambertMaterial color="#8a8378" />
        </mesh>
      ))}
      {/* Cargo box rear door panel */}
      <mesh position={[0, 0.32, -0.71]}>
        <boxGeometry args={[0.48, 0.4, 0.012]} />
        <meshLambertMaterial color="#8a8378" />
      </mesh>
      {/* Tail light */}
      <mesh position={[0, 0.14, -0.71]}>
        <boxGeometry args={[0.34, 0.04, 0.012]} />
        <meshLambertMaterial emissive="#e8504a" emissiveIntensity={1.6} color="#200" />
      </mesh>
    </group>
  )
}
