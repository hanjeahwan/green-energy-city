import { ACCENT_CYAN } from './buildings/catalog'

export function AgentBeacon({
  position,
  color = ACCENT_CYAN,
  scale = 1
}: {
  position: [number, number, number]
  color?: string
  scale?: number
}) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.18, 0]} castShadow={false}>
        <cylinderGeometry args={[0.055, 0.07, 0.36, 8]} />
        <meshLambertMaterial color="#263342" />
      </mesh>
      <mesh position={[0, 0.43, 0]} rotation={[0, Math.PI / 4, 0]} castShadow={false}>
        <boxGeometry args={[0.26, 0.18, 0.04]} />
        <meshLambertMaterial color="#07131f" emissive={color} emissiveIntensity={0.9} />
      </mesh>
      <mesh position={[0, 0.64, 0]}>
        <sphereGeometry args={[0.055, 10, 10]} />
        <meshLambertMaterial color="#000" emissive={color} emissiveIntensity={2.2} />
      </mesh>
      <mesh position={[0, 0.035, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.24, 0.006, 6, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.55} depthWrite={false} />
      </mesh>
    </group>
  )
}
