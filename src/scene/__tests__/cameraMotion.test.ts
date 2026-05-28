import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import {
  clampDistance,
  computeFacilityFocusFrame,
  cruiseAngleFromPosition,
  cruiseAngleOffsetFromPosition,
  CRUISE_ORBIT_SPEED,
  FACILITY_FOCUS_DISTANCE,
  viewDirectionFrom,
} from '../cameraMotion'

describe('camera motion helpers', () => {
  it('preserves the current camera direction when focusing a facility', () => {
    const cameraPosition = new THREE.Vector3(-15.72, 11.43, -15.72)
    const currentTarget = new THREE.Vector3(0, 0, 0)
    const frame = computeFacilityFocusFrame({
      cameraPosition,
      currentTarget,
      anchorPosition: [5, 0, 0],
    })

    const beforeDirection = cameraPosition.clone().sub(currentTarget).normalize()
    const afterDirection = frame.position.clone().sub(frame.target).normalize()
    expect(afterDirection.x).toBeCloseTo(beforeDirection.x)
    expect(afterDirection.y).toBeCloseTo(beforeDirection.y)
    expect(afterDirection.z).toBeCloseTo(beforeDirection.z)
    expect(frame.position.distanceTo(frame.target)).toBeCloseTo(FACILITY_FOCUS_DISTANCE)
  })

  it('keeps a different orbit angle instead of returning a fixed offset', () => {
    const northwestFrame = computeFacilityFocusFrame({
      cameraPosition: new THREE.Vector3(-15.72, 11.43, -15.72),
      currentTarget: new THREE.Vector3(0, 0, 0),
      anchorPosition: [5, 0, 0],
    })
    const southeastFrame = computeFacilityFocusFrame({
      cameraPosition: new THREE.Vector3(18, 9, 12),
      currentTarget: new THREE.Vector3(0, 0, 0),
      anchorPosition: [5, 0, 0],
    })

    expect(southeastFrame.position.x).toBeGreaterThan(northwestFrame.position.x)
    expect(southeastFrame.position.z).toBeGreaterThan(northwestFrame.position.z)
  })

  it('clamps unsafe focus distances', () => {
    expect(clampDistance(3, 10, 20)).toBe(10)
    expect(clampDistance(24, 10, 20)).toBe(20)
    expect(clampDistance(16, 10, 20)).toBe(16)
  })

  it('falls back to the default direction when camera and target overlap', () => {
    const direction = viewDirectionFrom(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0)
    )
    expect(direction.length()).toBeCloseTo(1)
    expect(direction.x).toBeLessThan(0)
    expect(direction.y).toBeGreaterThan(0)
    expect(direction.z).toBeLessThan(0)
  })

  it('starts resumed cruise from the current camera orbit angle', () => {
    const cruiseTarget = new THREE.Vector3(0, 1.1, 0)
    const cameraPosition = new THREE.Vector3(0, 12, 23)
    const elapsed = 100
    const offset = cruiseAngleOffsetFromPosition(cameraPosition, cruiseTarget, elapsed)

    expect(offset + elapsed * CRUISE_ORBIT_SPEED).toBeCloseTo(Math.PI / 2)
    expect(cruiseAngleFromPosition(cameraPosition, cruiseTarget)).toBeCloseTo(Math.PI / 2)
  })

  it('uses the current controls target when deriving a resumed cruise angle', () => {
    const currentTarget = new THREE.Vector3(10, 0, -4)
    const cameraPosition = currentTarget.clone().add(new THREE.Vector3(0, 12, 23))
    const elapsed = 50
    const offset = cruiseAngleOffsetFromPosition(cameraPosition, currentTarget, elapsed)

    expect(offset + elapsed * CRUISE_ORBIT_SPEED).toBeCloseTo(Math.PI / 2)
  })
})
