import { useMemo } from 'react'
import { ACCENT_CYAN } from '../buildings/catalog'
import { ROAD_SHADOW } from '../../scene/palette'

export function EnergyPlaza() {
  const equipment = useMemo(() => {
    const items: Array<{ p: [number, number, number]; rot: number; color: string }> = []
    const coords: Array<[number, number]> = [
      [6.35, 2.05],
      [2.05, 6.35],
      [-2.05, 6.35],
      [-6.35, 2.05],
      [-6.35, -2.05],
      [-2.05, -6.35],
      [2.05, -6.35],
      [6.35, -2.05]
    ]
    coords.forEach(([x, z], i) => {
      items.push({
        p: [x, 0, z],
        rot: Math.atan2(x, z),
        color: i % 2 === 0 ? '#dfe6ee' : '#8a96a6'
      })
    })
    return items
  }, [])

  return (
    <group>
      {/* Plaza ground stack — 1cm spacing for depth-buffer headroom:
          strips 0.030, conduit-A 0.040, conduit-B 0.050. */}
      {[
        { p: [0, 0.030, 4.4] as [number, number, number], args: [0.28, 5.4] as [number, number], rot: 0 },
        { p: [0, 0.030, -4.4] as [number, number, number], args: [0.28, 5.4] as [number, number], rot: 0 },
        { p: [4.4, 0.030, 0] as [number, number, number], args: [5.4, 0.28] as [number, number], rot: 0 },
        { p: [-4.4, 0.030, 0] as [number, number, number], args: [5.4, 0.28] as [number, number], rot: 0 }
      ].map((strip, i) => (
        <mesh key={i} position={strip.p} rotation={[-Math.PI / 2, 0, strip.rot]}>
          <planeGeometry args={strip.args} />
          <meshLambertMaterial color={ROAD_SHADOW} transparent opacity={0.48} />
        </mesh>
      ))}
      {[
        { p: [0, 0.040, 0] as [number, number, number], args: [0.08, 12.8] as [number, number], color: '#00d4a8' },
        { p: [0, 0.050, 0] as [number, number, number], args: [12.8, 0.08] as [number, number], color: '#5aa7ff' }
      ].map((conduit, i) => (
        <mesh key={i} position={conduit.p} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={conduit.args} />
          <meshLambertMaterial color="#000" emissive={conduit.color} emissiveIntensity={0.75} transparent opacity={0.65} />
        </mesh>
      ))}
      {equipment.map((item, i) => (
        <group key={i} position={item.p} rotation={[0, item.rot, 0]}>
          <mesh position={[0, 0.18, 0]} castShadow>
            <boxGeometry args={[0.34, 0.36, 0.28]} />
            <meshLambertMaterial color={item.color} />
          </mesh>
          <mesh position={[0, 0.39, 0]} castShadow>
            <boxGeometry args={[0.3, 0.06, 0.24]} />
            <meshLambertMaterial color="#22354f" />
          </mesh>
          <mesh position={[0, 0.2, 0.145]}>
            <planeGeometry args={[0.22, 0.13]} />
            <meshLambertMaterial color="#000" emissive={ACCENT_CYAN} emissiveIntensity={0.75} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
