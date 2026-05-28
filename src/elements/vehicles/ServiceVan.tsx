import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { VEHICLE_PATHS, VEHICLE_TRAVEL_SPEED } from '../../scene/vehicles'

export function ServiceVan() {
  const ref = useRef<THREE.Group>(null!)
  // P5-C1: waypoints sourced from src/scene/vehicles.ts so the verifier can
  // validate them against ROAD_AVENUES. Previous waypoints used z=±12 which
  // is NOT a road avenue (avenues at z={-16,-8,8,16}) — van was clipping
  // through N and S city blocks. Inner road ring (±8, ±8) is all on-road.
  const path = VEHICLE_PATHS.find((p) => p.id === 'service-van')!
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        path.waypoints.map(([x, z]) => new THREE.Vector3(x, path.y, z)),
        true,
        'catmullrom',
        0.0 // sharp corners (van drives in straight lines)
      ),
    [path]
  )
  const loopLength = useMemo(() => curve.getLength(), [curve])
  useFrame((s) => {
    if (!ref.current) return
    const t = (s.clock.getElapsedTime() * VEHICLE_TRAVEL_SPEED / loopLength) % 1
    const pos = curve.getPointAt(t)
    const tangent = curve.getTangentAt(t)
    ref.current.position.copy(pos)
    ref.current.rotation.y = Math.atan2(tangent.x, tangent.z)
  })
  return (
    <group ref={ref}>
      <mesh position={[0, 0.18, 0]} castShadow={false}>
        <boxGeometry args={[0.45, 0.32, 1.0]} />
        <meshLambertMaterial color="#0e2440" />
      </mesh>
      <mesh position={[0, 0.42, -0.18]} castShadow={false}>
        <boxGeometry args={[0.42, 0.22, 0.4]} />
        <meshLambertMaterial color="#0e2440" />
      </mesh>
      <mesh position={[0, 0.42, -0.39]}>
        <boxGeometry args={[0.36, 0.18, 0.02]} />
        <meshLambertMaterial color="#1a3a5c" />
      </mesh>
      <mesh position={[0, 0.56, -0.18]}>
        <boxGeometry args={[0.25, 0.04, 0.18]} />
        <meshLambertMaterial emissive="#5aa0d0" emissiveIntensity={1.4} color="#000" />
      </mesh>
    </group>
  )
}
