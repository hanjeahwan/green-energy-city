import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { buildRoadNetwork, type RoadSegment } from '../../scene/cityPlan'
import { ROAD_AVENUES_X, ROAD_AVENUES_Z, ROAD_REACH } from '../../scene/roads'
import { LANE_PAINT } from '../../scene/palette'

// =============================================================================
// RoadMarkings — three InstancedMesh batches that paint white lane lines on
// the eight inner-grid avenues. Sits above the road surface (y=0.018) at
// y=0.024-0.025 so paint floats on top without z-fighting.
//
//   1. centre dashes   — 0.4m dash + 0.6m gap along each road's centreline.
//   2. crosswalk zebra — 4 stripes at each of 16 intersections × 4 sides.
//   3. stop lines      — one perpendicular bar before each crosswalk approach.
//
// Each marking type is a single InstancedMesh (3 draw calls total). Road
// markings are decorative — they're not registered in PLACEMENTS and don't
// affect the OBB / road-buffer audit or vehicle path validator.
// =============================================================================

// Geometry y-offset above road plane (road sits at y=0.018).
const DASH_Y = 0.025
const STRIPE_Y = 0.024
const STOP_Y = 0.024

// Distance from intersection centre to the inner edge of the crosswalk band.
// Crosswalk stripes are placed in a 0.6m wide band starting at this distance.
const CROSSWALK_INSET = 0.85
const CROSSWALK_STRIPE_COUNT = 4
const CROSSWALK_STRIPE_SPACING = 0.2
const CROSSWALK_STRIPE_LEN = 0.7   // along the road's perpendicular axis (= road width-ish)
const CROSSWALK_STRIPE_WIDTH = 0.12 // along the road's length axis (perpendicular to traffic)

// Stop line sits just inside the crosswalk band, on the road approach side.
const STOP_OFFSET = CROSSWALK_INSET + CROSSWALK_STRIPE_COUNT * CROSSWALK_STRIPE_SPACING + 0.12
const STOP_LEN = 1.3       // ~road width
const STOP_WIDTH = 0.08

// Dash pattern: 0.4m painted + 0.6m gap = 1m cycle, centred on the road span.
const DASH_LEN = 0.4
const DASH_CYCLE = 1.0
const DASH_WIDTH = 0.04
const DASH_THICKNESS = 0.005

// -----------------------------------------------------------------------------
// Helpers — return instance transform arrays for each marking type.
// -----------------------------------------------------------------------------

function computeDashInstances(roads: readonly RoadSegment[]) {
  const matrices: THREE.Matrix4[] = []
  const dummy = new THREE.Object3D()
  for (const road of roads) {
    const dashCount = Math.floor(road.length / DASH_CYCLE)
    if (dashCount <= 0) continue
    // Centre the dash pattern on the road span.
    const spanUsed = dashCount * DASH_CYCLE
    const start = -spanUsed / 2 + DASH_CYCLE / 2
    for (let i = 0; i < dashCount; i++) {
      const offset = start + i * DASH_CYCLE
      // Local-frame placement (X-along-road for x-axis roads after rotation, Z otherwise).
      if (road.axis === 'z') {
        // Road runs along world Z. Centre at road.center, dashes shift in Z.
        dummy.position.set(road.center[0], DASH_Y, road.center[1] + offset)
        dummy.rotation.set(0, 0, 0)
      } else {
        // Road runs along world X. Dashes shift in X; rotate yaw=π/2 so the
        // box's local Z (=length axis) aligns with world X.
        dummy.position.set(road.center[0] + offset, DASH_Y, road.center[1])
        dummy.rotation.set(0, Math.PI / 2, 0)
      }
      dummy.updateMatrix()
      matrices.push(dummy.matrix.clone())
    }
  }
  return matrices
}

function computeCrosswalkInstances() {
  const matrices: THREE.Matrix4[] = []
  const dummy = new THREE.Object3D()
  for (const ax of ROAD_AVENUES_X) {
    for (const az of ROAD_AVENUES_Z) {
      // Four crosswalk bands per intersection — one on each approach side
      // (north / south / east / west). Each band has CROSSWALK_STRIPE_COUNT
      // stripes spaced by CROSSWALK_STRIPE_SPACING.
      //
      // North band: north of the intersection, stripes run east-west,
      //             stripe boxes are long in X (perpendicular to traffic
      //             flowing along Z).
      // South band: mirror of north.
      // East band: east of intersection, stripes run north-south, stripe
      //            boxes are long in Z.
      // West band: mirror of east.
      const bandOffsets = (i: number) => CROSSWALK_INSET + i * CROSSWALK_STRIPE_SPACING

      // North band — stripes long in X axis (no rotation needed since
      // crosswalk stripe geometry is [width, thickness, length] with length
      // pointing along Z in local space, then rotated yaw=π/2 to point X).
      for (let i = 0; i < CROSSWALK_STRIPE_COUNT; i++) {
        const z = az + bandOffsets(i)
        if (Math.abs(z) > ROAD_REACH) continue
        dummy.position.set(ax, STRIPE_Y, z)
        // Stripe geometry is built with length on local Z. For the N band
        // we want the stripe long along world X → rotate yaw=π/2.
        dummy.rotation.set(0, Math.PI / 2, 0)
        dummy.updateMatrix()
        matrices.push(dummy.matrix.clone())
      }
      // South band
      for (let i = 0; i < CROSSWALK_STRIPE_COUNT; i++) {
        const z = az - bandOffsets(i)
        if (Math.abs(z) > ROAD_REACH) continue
        dummy.position.set(ax, STRIPE_Y, z)
        dummy.rotation.set(0, Math.PI / 2, 0)
        dummy.updateMatrix()
        matrices.push(dummy.matrix.clone())
      }
      // East band — stripes long along world Z (no rotation).
      for (let i = 0; i < CROSSWALK_STRIPE_COUNT; i++) {
        const x = ax + bandOffsets(i)
        if (Math.abs(x) > ROAD_REACH) continue
        dummy.position.set(x, STRIPE_Y, az)
        dummy.rotation.set(0, 0, 0)
        dummy.updateMatrix()
        matrices.push(dummy.matrix.clone())
      }
      // West band
      for (let i = 0; i < CROSSWALK_STRIPE_COUNT; i++) {
        const x = ax - bandOffsets(i)
        if (Math.abs(x) > ROAD_REACH) continue
        dummy.position.set(x, STRIPE_Y, az)
        dummy.rotation.set(0, 0, 0)
        dummy.updateMatrix()
        matrices.push(dummy.matrix.clone())
      }
    }
  }
  return matrices
}

function computeStopLineInstances() {
  const matrices: THREE.Matrix4[] = []
  const dummy = new THREE.Object3D()
  for (const ax of ROAD_AVENUES_X) {
    for (const az of ROAD_AVENUES_Z) {
      // North approach (a vehicle travelling south down the x=ax road, about
      // to enter the (ax, az) intersection from the north). Stop line on the
      // north side of intersection, long along X, sits at z = az + STOP_OFFSET.
      const north = az + STOP_OFFSET
      if (Math.abs(north) <= ROAD_REACH) {
        dummy.position.set(ax, STOP_Y, north)
        dummy.rotation.set(0, 0, 0)
        dummy.updateMatrix()
        matrices.push(dummy.matrix.clone())
      }
      const south = az - STOP_OFFSET
      if (Math.abs(south) <= ROAD_REACH) {
        dummy.position.set(ax, STOP_Y, south)
        dummy.rotation.set(0, 0, 0)
        dummy.updateMatrix()
        matrices.push(dummy.matrix.clone())
      }
      // East/west approaches — stop line long along Z, rotated yaw=π/2.
      const east = ax + STOP_OFFSET
      if (Math.abs(east) <= ROAD_REACH) {
        dummy.position.set(east, STOP_Y, az)
        dummy.rotation.set(0, Math.PI / 2, 0)
        dummy.updateMatrix()
        matrices.push(dummy.matrix.clone())
      }
      const west = ax - STOP_OFFSET
      if (Math.abs(west) <= ROAD_REACH) {
        dummy.position.set(west, STOP_Y, az)
        dummy.rotation.set(0, Math.PI / 2, 0)
        dummy.updateMatrix()
        matrices.push(dummy.matrix.clone())
      }
    }
  }
  return matrices
}

// -----------------------------------------------------------------------------
// React component — three InstancedMesh refs, populated once on mount.
// -----------------------------------------------------------------------------

export function RoadMarkings() {
  const innerRoads = useMemo(
    () => buildRoadNetwork().filter((road) => road.id.startsWith('inner-')),
    []
  )

  const dashMatrices = useMemo(() => computeDashInstances(innerRoads), [innerRoads])
  const crosswalkMatrices = useMemo(() => computeCrosswalkInstances(), [])
  const stopMatrices = useMemo(() => computeStopLineInstances(), [])

  const dashRef = useRef<THREE.InstancedMesh>(null!)
  const crosswalkRef = useRef<THREE.InstancedMesh>(null!)
  const stopRef = useRef<THREE.InstancedMesh>(null!)

  useEffect(() => {
    if (dashRef.current) {
      dashMatrices.forEach((m, i) => dashRef.current.setMatrixAt(i, m))
      dashRef.current.instanceMatrix.needsUpdate = true
    }
    if (crosswalkRef.current) {
      crosswalkMatrices.forEach((m, i) => crosswalkRef.current.setMatrixAt(i, m))
      crosswalkRef.current.instanceMatrix.needsUpdate = true
    }
    if (stopRef.current) {
      stopMatrices.forEach((m, i) => stopRef.current.setMatrixAt(i, m))
      stopRef.current.instanceMatrix.needsUpdate = true
    }
  }, [dashMatrices, crosswalkMatrices, stopMatrices])

  return (
    <group>
      {/* Centre dashes — local geometry built sideways (Z = length) so the
          instance matrix rotation can re-orient to either world axis. */}
      <instancedMesh
        ref={dashRef}
        args={[undefined, undefined, dashMatrices.length || 1]}
        receiveShadow={false}
        castShadow={false}
      >
        <boxGeometry args={[DASH_WIDTH, DASH_THICKNESS, DASH_LEN]} />
        <meshLambertMaterial color={LANE_PAINT} />
      </instancedMesh>

      {/* Crosswalk zebra stripes. */}
      <instancedMesh
        ref={crosswalkRef}
        args={[undefined, undefined, crosswalkMatrices.length || 1]}
        receiveShadow={false}
        castShadow={false}
      >
        <boxGeometry args={[CROSSWALK_STRIPE_WIDTH, DASH_THICKNESS, CROSSWALK_STRIPE_LEN]} />
        <meshLambertMaterial color={LANE_PAINT} />
      </instancedMesh>

      {/* Stop lines at every intersection approach. Same Z-as-length convention
          as the dashes — yaw=π/2 to align with world X axis. */}
      <instancedMesh
        ref={stopRef}
        args={[undefined, undefined, stopMatrices.length || 1]}
        receiveShadow={false}
        castShadow={false}
      >
        <boxGeometry args={[STOP_WIDTH, DASH_THICKNESS, STOP_LEN]} />
        <meshLambertMaterial color={LANE_PAINT} />
      </instancedMesh>
    </group>
  )
}
