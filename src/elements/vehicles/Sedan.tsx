import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { VEHICLE_PATHS, VEHICLE_TRAVEL_SPEED } from '../../scene/vehicles'

export function Sedan() {
  const ref = useRef<THREE.Group>(null!)
  const path = VEHICLE_PATHS.find((p) => p.id === 'sedan')!
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
    const t = (s.clock.getElapsedTime() * VEHICLE_TRAVEL_SPEED / loopLength + 0.25) % 1
    const pos = curve.getPointAt(t)
    const tangent = curve.getTangentAt(t)
    ref.current.position.copy(pos)
    ref.current.rotation.y = Math.atan2(tangent.x, tangent.z)
  })
  return (
    <group ref={ref}>
      {/* Lower body */}
      <mesh position={[0, 0.12, 0]} castShadow={false}>
        <boxGeometry args={[0.4, 0.18, 0.85]} />
        <meshLambertMaterial color="#4a5868" />
      </mesh>
      {/* Slanted cabin */}
      <mesh position={[0, 0.27, 0.02]} castShadow={false}>
        <boxGeometry args={[0.36, 0.14, 0.4]} />
        <meshLambertMaterial color="#4a5868" />
      </mesh>
      {/* Windshield (front, slightly angled visually via depth offset) */}
      <mesh position={[0, 0.27, 0.22]}>
        <boxGeometry args={[0.34, 0.12, 0.02]} />
        <meshLambertMaterial color="#0d1a2a" />
      </mesh>
      {/* Rear window */}
      <mesh position={[0, 0.27, -0.18]}>
        <boxGeometry args={[0.34, 0.12, 0.02]} />
        <meshLambertMaterial color="#0d1a2a" />
      </mesh>
      {/* Headlights (front) */}
      <mesh position={[0.14, 0.13, 0.43]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshLambertMaterial emissive="#ffe066" emissiveIntensity={2} color="#000" />
      </mesh>
      <mesh position={[-0.14, 0.13, 0.43]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshLambertMaterial emissive="#ffe066" emissiveIntensity={2} color="#000" />
      </mesh>
      {/* Tail light bar */}
      <mesh position={[0, 0.13, -0.43]}>
        <boxGeometry args={[0.3, 0.04, 0.012]} />
        <meshLambertMaterial emissive="#e8504a" emissiveIntensity={1.8} color="#200" />
      </mesh>
    </group>
  )
}
