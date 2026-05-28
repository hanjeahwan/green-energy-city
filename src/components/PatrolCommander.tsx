import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { Person } from '../elements/people/Person'

// =============================================================================
// PatrolCommander — a commander Person walking a slow circular patrol around
// an anchor (typically PS-02 alarm site). Replaces the static fixed-position
// commander from P4 so the alarm scene feels alive.
//
// Geometry inherited from Person variant='commander' (peaked cap + dark suit
// + cyan tie + radio antenna). This wrapper is purely motion.
// =============================================================================

export function PatrolCommander({
  centerX,
  centerZ,
  radius = 1.5,
  speed = 0.15,
  startAngle = 0
}: {
  centerX: number
  centerZ: number
  /** Patrol circle radius. Default 1.5m — fits inside PS-02 cone perimeter (r=1.7). */
  radius?: number
  /** Angular speed in rad/s. Default 0.15 → full lap in ~42 s, a calm pace. */
  speed?: number
  /** Initial angle in radians. Default 0 = start at +X (east). */
  startAngle?: number
}) {
  const ref = useRef<THREE.Group>(null!)
  useFrame((s) => {
    if (!ref.current) return
    const theta = startAngle + s.clock.getElapsedTime() * speed
    ref.current.position.x = centerX + Math.cos(theta) * radius
    ref.current.position.z = centerZ + Math.sin(theta) * radius
    // Face tangent (walking direction). Person's "front" is +Z; the tangent
    // direction in world XZ is (-sin θ, +cos θ), so rotation Y around the
    // group makes +Z map to that direction.
    ref.current.rotation.y = -theta + Math.PI / 2
  })
  return (
    <group ref={ref}>
      <Person position={[0, 0, 0]} variant="commander" accentSeed={101} />
    </group>
  )
}
