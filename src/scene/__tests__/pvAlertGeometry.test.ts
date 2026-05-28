import { describe, expect, it } from 'vitest'
import { PENANG_ALERT_CONE_POSITIONS } from '../pvAlertGeometry'

const CONE_BASE_HALF_EXTENT = 0.07

const bounds = {
  solarFarm: { minX: -1.38, maxX: 1.38, minZ: -1.28, maxZ: 1.28 },
  batteryBank: { minX: -1.65, maxX: 0.95, minZ: 2.25, maxZ: 3.75 }
}

const MIN_VISUAL_CLEARANCE = 0.1

function coneBaseIntersects(
  [x, , z]: [number, number, number],
  box: { minX: number; maxX: number; minZ: number; maxZ: number }
) {
  return (
    x + CONE_BASE_HALF_EXTENT > box.minX &&
    x - CONE_BASE_HALF_EXTENT < box.maxX &&
    z + CONE_BASE_HALF_EXTENT > box.minZ &&
    z - CONE_BASE_HALF_EXTENT < box.maxZ
  )
}

function clearanceToBox(
  [x, , z]: [number, number, number],
  box: { minX: number; maxX: number; minZ: number; maxZ: number }
) {
  const outsideX = x < box.minX
    ? box.minX - (x + CONE_BASE_HALF_EXTENT)
    : x > box.maxX
      ? (x - CONE_BASE_HALF_EXTENT) - box.maxX
      : 0
  const outsideZ = z < box.minZ
    ? box.minZ - (z + CONE_BASE_HALF_EXTENT)
    : z > box.maxZ
      ? (z - CONE_BASE_HALF_EXTENT) - box.maxZ
      : 0
  return Math.max(outsideX, outsideZ)
}

describe('Penang PV alert cone geometry', () => {
  it('keeps alert cones outside the enlarged solar farm and battery bank footprints', () => {
    expect(PENANG_ALERT_CONE_POSITIONS).toHaveLength(6)

    for (const position of PENANG_ALERT_CONE_POSITIONS) {
      expect(coneBaseIntersects(position, bounds.solarFarm)).toBe(false)
      expect(coneBaseIntersects(position, bounds.batteryBank)).toBe(false)
      expect(clearanceToBox(position, bounds.solarFarm)).toBeGreaterThanOrEqual(MIN_VISUAL_CLEARANCE)
    }
  })
})
