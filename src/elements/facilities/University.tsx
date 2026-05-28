import { Tree } from '../nature/Tree'
import { VEGETATION, CITY_SURFACE, OFFICE_GLASS, OFFICE_STONE } from '../../scene/palette'
import { ENERGY_CYAN, STEEL_LIGHT, STEEL_MID, RUST_BROWN } from './palette'

// =============================================================================
// University — N edge sector landmark (placed at z=+18.5 by default). Three
// academic blocks arranged in a U opening south, central quad with a clock
// tower / flagpole and a few trees. Footprint 6×3 m (halfW=3, halfD=1.5).
// Sits in the outer-ring +z strip, narrative: knowledge → e-mobility (邻
// north-emobility sector). ~25 draw calls.
// =============================================================================

interface UniversityProps {
  position?: [number, number, number]
  rotation?: number
}

const TILE_W = 6
const TILE_D = 3
const GROUND_COLOR = '#d8dcd4' // soft warm stone (subtle distinction from CITY_SURFACE)

export function University({ position = [0, 0, 0], rotation = 0 }: UniversityProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <CampusGround />
      <MainHall />
      <WestWing />
      <EastWing />
      <CentralQuad />
      <ClockTower />
      <FrontGate />
      <CampusTrees />
    </group>
  )
}

function CampusGround() {
  return (
    <>
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[TILE_W, TILE_D]} />
        <meshLambertMaterial color={GROUND_COLOR} />
      </mesh>
      {/* central grass quad (front of main hall) */}
      <mesh position={[0, 0.008, -0.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3.0, 1.6]} />
        <meshLambertMaterial color={VEGETATION} />
      </mesh>
    </>
  )
}

function MainHall() {
  // Two-storey rectangular hall at the +z (back) edge. Wider than tall.
  return (
    <group position={[0, 0, 1.05]}>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 1.1, 0.8]} />
        <meshLambertMaterial color={OFFICE_STONE} />
      </mesh>
      {/* pediment top */}
      <mesh position={[0, 1.18, 0]} castShadow>
        <boxGeometry args={[2.7, 0.05, 0.86]} />
        <meshLambertMaterial color={STEEL_LIGHT} />
      </mesh>
      {/* window strip */}
      <mesh position={[0, 0.75, 0.405]}>
        <planeGeometry args={[2.2, 0.18]} />
        <meshLambertMaterial color={OFFICE_GLASS} emissive={ENERGY_CYAN} emissiveIntensity={0.15} />
      </mesh>
      {/* entrance double doors */}
      <mesh position={[0, 0.25, 0.405]}>
        <planeGeometry args={[0.5, 0.5]} />
        <meshLambertMaterial color={RUST_BROWN} />
      </mesh>
      {/* steps */}
      <mesh position={[0, 0.04, -0.5]} castShadow>
        <boxGeometry args={[1.0, 0.08, 0.2]} />
        <meshLambertMaterial color={STEEL_LIGHT} />
      </mesh>
    </group>
  )
}

function WestWing() {
  return (
    <group position={[-2.0, 0, 0.4]}>
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.8, 1.0]} />
        <meshLambertMaterial color={OFFICE_STONE} />
      </mesh>
      {/* window rows */}
      <mesh position={[0, 0.55, 0.51]}>
        <planeGeometry args={[1.3, 0.16]} />
        <meshLambertMaterial color={OFFICE_GLASS} emissive={ENERGY_CYAN} emissiveIntensity={0.12} />
      </mesh>
      <mesh position={[0, 0.3, 0.51]}>
        <planeGeometry args={[1.3, 0.16]} />
        <meshLambertMaterial color={OFFICE_GLASS} emissive={ENERGY_CYAN} emissiveIntensity={0.12} />
      </mesh>
      {/* roof trim */}
      <mesh position={[0, 0.83, 0]}>
        <boxGeometry args={[1.65, 0.05, 1.05]} />
        <meshLambertMaterial color={STEEL_MID} />
      </mesh>
    </group>
  )
}

function EastWing() {
  // Mirror of WestWing.
  return (
    <group position={[2.0, 0, 0.4]}>
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.8, 1.0]} />
        <meshLambertMaterial color={OFFICE_STONE} />
      </mesh>
      <mesh position={[0, 0.55, 0.51]}>
        <planeGeometry args={[1.3, 0.16]} />
        <meshLambertMaterial color={OFFICE_GLASS} emissive={ENERGY_CYAN} emissiveIntensity={0.12} />
      </mesh>
      <mesh position={[0, 0.3, 0.51]}>
        <planeGeometry args={[1.3, 0.16]} />
        <meshLambertMaterial color={OFFICE_GLASS} emissive={ENERGY_CYAN} emissiveIntensity={0.12} />
      </mesh>
      <mesh position={[0, 0.83, 0]}>
        <boxGeometry args={[1.65, 0.05, 1.05]} />
        <meshLambertMaterial color={STEEL_MID} />
      </mesh>
    </group>
  )
}

function CentralQuad() {
  // Paved cross walkway through the grass quad.
  const w = 0.3
  return (
    <>
      <mesh position={[0, 0.012, -0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.8, w]} />
        <meshLambertMaterial color={CITY_SURFACE} />
      </mesh>
      <mesh position={[0, 0.012, -0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, 1.4]} />
        <meshLambertMaterial color={CITY_SURFACE} />
      </mesh>
    </>
  )
}

function ClockTower() {
  // Slim central tower with a clock face — visible landmark.
  return (
    <group position={[0, 0, -0.2]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.18, 1.0, 0.18]} />
        <meshLambertMaterial color={OFFICE_STONE} />
      </mesh>
      {/* clock face */}
      <mesh position={[0, 0.85, 0.092]}>
        <circleGeometry args={[0.06, 16]} />
        <meshLambertMaterial color="#1a1a1a" emissive={ENERGY_CYAN} emissiveIntensity={0.8} />
      </mesh>
      {/* spire cap */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <coneGeometry args={[0.08, 0.18, 6]} />
        <meshLambertMaterial color={STEEL_MID} />
      </mesh>
    </group>
  )
}

function FrontGate() {
  // Pair of short stone gateposts at the south edge.
  return (
    <>
      <mesh position={[-1.2, 0.18, -1.35]} castShadow>
        <boxGeometry args={[0.15, 0.36, 0.15]} />
        <meshLambertMaterial color={STEEL_LIGHT} />
      </mesh>
      <mesh position={[1.2, 0.18, -1.35]} castShadow>
        <boxGeometry args={[0.15, 0.36, 0.15]} />
        <meshLambertMaterial color={STEEL_LIGHT} />
      </mesh>
    </>
  )
}

function CampusTrees() {
  return (
    <>
      <Tree position={[-2.6, 0, -1.0]} scale={0.7} variant="broadleaf" rot={0.6} />
      <Tree position={[2.6, 0, -1.0]} scale={0.72} variant="broadleaf" rot={-0.4} />
      <Tree position={[-1.0, 0, -1.1]} scale={0.55} variant="classic" rot={0.2} />
      <Tree position={[1.0, 0, -1.1]} scale={0.58} variant="classic" rot={1.4} />
    </>
  )
}
