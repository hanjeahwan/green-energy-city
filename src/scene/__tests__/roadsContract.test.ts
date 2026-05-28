import { describe, expect, it } from 'vitest'
import { buildRoadNetwork } from '../cityPlan'
import { ROAD_AVENUES_X, ROAD_AVENUES_Z, ROAD_HALF_WIDTH, STUB_RECTS } from '../roads'

const roadNetwork = buildRoadNetwork()
const avenueXSet = new Set<number>(ROAD_AVENUES_X)
const avenueZSet = new Set<number>(ROAD_AVENUES_Z)

describe('road visual/collision contract', () => {
  it('renders at least one visible road segment for every collision x-avenue', () => {
    for (const avenueX of ROAD_AVENUES_X) {
      expect(
        roadNetwork.some((road) => road.axis === 'z' && road.center[0] === avenueX),
        `x avenue ${avenueX}`
      ).toBe(true)
    }
  })

  it('renders at least one visible road segment for every collision z-avenue', () => {
    for (const avenueZ of ROAD_AVENUES_Z) {
      expect(
        roadNetwork.some((road) => road.axis === 'x' && road.center[1] === avenueZ),
        `z avenue ${avenueZ}`
      ).toBe(true)
    }
  })

  it('uses the road constant width for primary avenue segments', () => {
    const primaryWidth = ROAD_HALF_WIDTH * 2
    const primarySegments = roadNetwork.filter((road) => {
      if (road.axis === 'z') return avenueXSet.has(road.center[0])
      return avenueZSet.has(road.center[1])
    })

    expect(primarySegments.length).toBeGreaterThan(0)
    for (const road of primarySegments) {
      expect(road.width, road.id).toBeCloseTo(primaryWidth)
    }
  })

  it('renders every visual stub declared by roads.ts', () => {
    for (const stub of STUB_RECTS) {
      expect(roadNetwork).toContainEqual({
        id: `inner-${stub.id}`,
        tier: 'inner',
        axis: stub.halfX >= stub.halfZ ? 'x' : 'z',
        center: [stub.cx, stub.cz],
        length: 2 * Math.max(stub.halfX, stub.halfZ),
        width: ROAD_HALF_WIDTH * 2
      })
    }
  })
})
