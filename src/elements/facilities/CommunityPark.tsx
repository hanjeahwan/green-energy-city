import { Tree } from '../nature/Tree'
import { VEGETATION, CORE_NAVY, CITY_SURFACE, COMMUNITY_TRIM } from '../../scene/palette'
import { ENERGY_CYAN } from './palette'

// Park-specific concrete tones — pale gray paths + slightly darker plaza ring.
const PARK_PATH = '#c8cdd2'
const PARK_PLAZA = '#bcc2c8'
const FOUNTAIN_STONE = '#9aa1aa'
const FOUNTAIN_SPRAY = '#c8e8ed'
const BENCH_WOOD = '#7a5a3c'
const BENCH_LEG = '#5a5048'

// =============================================================================
// CommunityPark — NW residential block public space. Replaces the previous
// smart-crane construction set-piece per user request (2026-05-25).
//
// 2.5×2.5m tile centred on the placement origin. Composition:
//   - soft grass base + concrete border
//   - cross-shaped pedestrian path with a small central plaza
//   - 6 trees scattered at the 4 corner planters
//   - 4 short benches flanking the central plaza
//   - 1 small fountain ring (LED-lit at night via cyan emissive cap)
//
// Footprint is registered in PLACEMENTS / showroomContract
// as `nw-park` (kind=CommunityPark, halfW=1.25 halfD=1.25). The geometry is
// deliberately low-poly — mostly tinted boxes + reused Tree component — so
// adding the park costs <30 draw calls.
// =============================================================================

interface CommunityParkProps {
  position?: [number, number, number]
  rotation?: number
}

const TILE_W = 2.5
const TILE_D = 2.5

export function CommunityPark({
  position = [0, 0, 0],
  rotation = 0
}: CommunityParkProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <GrassBase />
      <ConcreteBorder />
      <Paths />
      <CentralFountain />
      <Benches />
      <ParkTrees />
    </group>
  )
}

function GrassBase() {
  return (
    <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[TILE_W, TILE_D]} />
      <meshLambertMaterial color={VEGETATION} />
    </mesh>
  )
}

function ConcreteBorder() {
  // Thin 0.1m sidewalk band around the grass — separates the park from the
  // street grid visually.
  const t = 0.1
  return (
    <>
      <mesh position={[0, 0.003, TILE_D / 2 - t / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TILE_W, t]} />
        <meshLambertMaterial color={CITY_SURFACE} />
      </mesh>
      <mesh position={[0, 0.003, -TILE_D / 2 + t / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TILE_W, t]} />
        <meshLambertMaterial color={CITY_SURFACE} />
      </mesh>
      <mesh position={[TILE_W / 2 - t / 2, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[t, TILE_D - t * 2]} />
        <meshLambertMaterial color={CITY_SURFACE} />
      </mesh>
      <mesh position={[-TILE_W / 2 + t / 2, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[t, TILE_D - t * 2]} />
        <meshLambertMaterial color={CITY_SURFACE} />
      </mesh>
    </>
  )
}

function Paths() {
  // Cross-shaped path through the centre. Width 0.32m for two pedestrians.
  const pathW = 0.32
  return (
    <>
      {/* East-west path */}
      <mesh position={[0, 0.007, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TILE_W - 0.2, pathW]} />
        <meshLambertMaterial color={PARK_PATH} />
      </mesh>
      {/* North-south path */}
      <mesh position={[0, 0.007, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[pathW, TILE_D - 0.2]} />
        <meshLambertMaterial color={PARK_PATH} />
      </mesh>
      {/* Central circular plaza */}
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.45, 24]} />
        <meshLambertMaterial color={PARK_PLAZA} />
      </mesh>
    </>
  )
}

function CentralFountain() {
  // Three-ring fountain: stone basin + water surface (cyan emissive at night)
  // + a small water column nozzle in the centre.
  return (
    <group>
      {/* basin ring */}
      <mesh position={[0, 0.07, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.24, 0.14, 18]} />
        <meshLambertMaterial color={FOUNTAIN_STONE} />
      </mesh>
      {/* water surface */}
      <mesh position={[0, 0.142, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.005, 18]} />
        <meshLambertMaterial color={ENERGY_CYAN} emissive={ENERGY_CYAN} emissiveIntensity={0.25} />
      </mesh>
      {/* central jet column */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.04, 0.12, 8]} />
        <meshLambertMaterial color={COMMUNITY_TRIM} />
      </mesh>
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.015, 0.02, 0.16, 6]} />
        <meshLambertMaterial color={FOUNTAIN_SPRAY} transparent opacity={0.7} />
      </mesh>
    </group>
  )
}

function Benches() {
  // 4 short benches flanking the fountain, one on each cardinal side of the
  // central plaza. Each bench is a long slat + 2 stub legs.
  const offset = 0.62
  const bench = (x: number, z: number, rotY: number) => (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.07, 0]} castShadow>
        <boxGeometry args={[0.45, 0.04, 0.1]} />
        <meshLambertMaterial color={BENCH_WOOD} />
      </mesh>
      <mesh position={[-0.18, 0.035, 0]} castShadow>
        <boxGeometry args={[0.04, 0.07, 0.08]} />
        <meshLambertMaterial color={BENCH_LEG} />
      </mesh>
      <mesh position={[0.18, 0.035, 0]} castShadow>
        <boxGeometry args={[0.04, 0.07, 0.08]} />
        <meshLambertMaterial color={BENCH_LEG} />
      </mesh>
    </group>
  )
  return (
    <>
      {bench(0, offset, 0)}
      {bench(0, -offset, 0)}
      {bench(offset, 0, Math.PI / 2)}
      {bench(-offset, 0, Math.PI / 2)}
    </>
  )
}

function ParkTrees() {
  // 6 trees at the 4 corner planters (2 in the larger corners, 1 each in the
  // smaller). Mix of deciduous + evergreen for silhouette variety. Scales
  // vary slightly per seed so they don't look stamped.
  return (
    <>
      <Tree position={[ 0.95, 0,  0.95]} scale={0.85} variant="classic" rot={0.5} />
      <Tree position={[-0.95, 0,  0.95]} scale={0.75} variant="modern"  rot={1.2} />
      <Tree position={[-0.95, 0, -0.95]} scale={0.9}  variant="classic" rot={-0.4} />
      <Tree position={[ 0.95, 0, -0.95]} scale={0.78} variant="modern"  rot={2.1} />
      <Tree position={[ 0.55, 0,  0.55]} scale={0.55} variant="classic" rot={0.8} />
      <Tree position={[-0.55, 0, -0.55]} scale={0.6}  variant="modern"  rot={1.8} />
    </>
  )
}

// Silence the unused import warning until CORE_NAVY is used by a future
// night-mode shadow pass.
void CORE_NAVY
