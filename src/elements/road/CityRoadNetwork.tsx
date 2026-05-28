import { useMemo } from 'react'
import { buildRoadNetwork } from '../../scene/cityPlan'
import { BASE_ROAD, ROAD_ALLEY, ROAD_CONNECTOR } from '../../scene/palette'

function roadRotation(axis: 'x' | 'z'): [number, number, number] {
  return axis === 'z' ? [-Math.PI / 2, 0, 0] : [-Math.PI / 2, 0, Math.PI / 2]
}

function roadColor(tier: string) {
  if (tier === 'perimeter') return ROAD_CONNECTOR
  if (tier === 'alley') return ROAD_ALLEY
  return BASE_ROAD
}

function roadOpacity(tier: string) {
  if (tier === 'perimeter') return 0.68
  if (tier === 'alley') return 0.62
  if (tier === 'connector') return 0.88
  return 1
}

export function CityRoadNetwork() {
  const roads = useMemo(
    () => buildRoadNetwork().filter((road) => road.id.startsWith('inner-')),
    []
  )

  if (typeof window !== 'undefined') {
    type CityPlanDebug = { roads?: typeof roads; parcels?: unknown }
    const debugWindow = window as Window & { __cityPlan?: CityPlanDebug }
    debugWindow.__cityPlan = { ...debugWindow.__cityPlan, roads }
    document.documentElement.dataset.cityPlanRoads = String(roads.length)
    document.documentElement.dataset.cityPlanRoadTiers = JSON.stringify(
      roads.reduce<Record<string, number>>((acc, road) => {
        acc[road.tier] = (acc[road.tier] ?? 0) + 1
        return acc
      }, {})
    )
  }

  return (
    <group>
      {roads.map((road, i) => (
        <mesh key={road.id} position={[road.center[0], 0.018 + i * 0.0001, road.center[1]]} rotation={roadRotation(road.axis)} receiveShadow>
          <planeGeometry args={[road.width, road.length]} />
          <meshLambertMaterial color={roadColor(road.tier)} transparent={road.tier !== 'inner'} opacity={roadOpacity(road.tier)} />
        </mesh>
      ))}

      {roads
        .filter((road) => road.tier === 'connector' || road.tier === 'perimeter')
        .flatMap((road) => {
          const inset = road.width / 2 + 0.38
          const left = road.axis === 'z'
            ? [road.center[0] - inset, road.center[1]]
            : [road.center[0], road.center[1] - inset]
          const right = road.axis === 'z'
            ? [road.center[0] + inset, road.center[1]]
            : [road.center[0], road.center[1] + inset]
          return [left, right].map(([x, z], i) => (
            <mesh key={`green-${road.id}-${i}`} position={[x, 0.016, z]} rotation={roadRotation(road.axis)}>
              <planeGeometry args={[0.22, road.length]} />
              <meshLambertMaterial color="#a9c9b2" transparent opacity={0.32} />
            </mesh>
          ))
        })}
    </group>
  )
}
