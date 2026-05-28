import * as THREE from 'three'

export const CRUISE_RADIUS = 23
export const CRUISE_HEIGHT = 13.5
export const CRUISE_HEIGHT_DRIFT = 1.2
export const CRUISE_ORBIT_SPEED = 0.045
export const CRUISE_TARGET_Y_OFFSET = 1.1
export const DEFAULT_CRUISE_ANGLE = -Math.PI * 0.75

export const DEFAULT_CAMERA_TARGET = new THREE.Vector3(0, CRUISE_TARGET_Y_OFFSET, 0)
export const DEFAULT_CAMERA_POSITION = new THREE.Vector3(
  DEFAULT_CAMERA_TARGET.x + Math.cos(DEFAULT_CRUISE_ANGLE) * CRUISE_RADIUS,
  DEFAULT_CAMERA_TARGET.y + CRUISE_HEIGHT,
  DEFAULT_CAMERA_TARGET.z + Math.sin(DEFAULT_CRUISE_ANGLE) * CRUISE_RADIUS
)

export const FACILITY_FOCUS_DISTANCE = 15.6
export const FACILITY_FOCUS_MIN_DISTANCE = 11
export const FACILITY_FOCUS_MAX_DISTANCE = 18
export const FACILITY_FOCUS_LOOK_Y = 0.5
export const FACILITY_AUTO_EXIT_DISTANCE = 23.5

export interface CameraFocusFrameInput {
  cameraPosition: THREE.Vector3
  currentTarget: THREE.Vector3
  anchorPosition: [number, number, number]
  focusDistance?: number
  minDistance?: number
  maxDistance?: number
  lookYOffset?: number
}

export interface CameraFocusFrame {
  position: THREE.Vector3
  target: THREE.Vector3
  distance: number
  direction: THREE.Vector3
}

export function clampDistance(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function viewDirectionFrom(
  cameraPosition: THREE.Vector3,
  currentTarget: THREE.Vector3
): THREE.Vector3 {
  const direction = cameraPosition.clone().sub(currentTarget)
  if (direction.lengthSq() > 0.0001) return direction.normalize()
  return DEFAULT_CAMERA_POSITION.clone().sub(DEFAULT_CAMERA_TARGET).normalize()
}

export function computeFacilityFocusFrame({
  cameraPosition,
  currentTarget,
  anchorPosition,
  focusDistance = FACILITY_FOCUS_DISTANCE,
  minDistance = FACILITY_FOCUS_MIN_DISTANCE,
  maxDistance = FACILITY_FOCUS_MAX_DISTANCE,
  lookYOffset = FACILITY_FOCUS_LOOK_Y,
}: CameraFocusFrameInput): CameraFocusFrame {
  const distance = clampDistance(focusDistance, minDistance, maxDistance)
  const target = new THREE.Vector3(
    anchorPosition[0],
    anchorPosition[1] + lookYOffset,
    anchorPosition[2]
  )
  const direction = viewDirectionFrom(cameraPosition, currentTarget)
  return {
    position: target.clone().add(direction.clone().multiplyScalar(distance)),
    target,
    distance,
    direction,
  }
}

export function distanceToTarget(cameraPosition: THREE.Vector3, target: THREE.Vector3): number {
  return cameraPosition.distanceTo(target)
}

export function cruiseAngleFromPosition(
  cameraPosition: THREE.Vector3,
  cruiseTarget: THREE.Vector3
): number {
  const dx = cameraPosition.x - cruiseTarget.x
  const dz = cameraPosition.z - cruiseTarget.z
  if ((dx * dx) + (dz * dz) < 0.0001) return DEFAULT_CRUISE_ANGLE
  return Math.atan2(dz, dx)
}

export function cruiseAngleOffsetFromPosition(
  cameraPosition: THREE.Vector3,
  cruiseTarget: THREE.Vector3,
  elapsed: number,
  orbitSpeed = CRUISE_ORBIT_SPEED
): number {
  return cruiseAngleFromPosition(cameraPosition, cruiseTarget) - elapsed * orbitSpeed
}
