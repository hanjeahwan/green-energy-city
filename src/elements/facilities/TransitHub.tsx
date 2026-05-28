import { CITY_SURFACE, OFFICE_GLASS } from '../../scene/palette'
import { ENERGY_CYAN, STEEL_LIGHT, STEEL_MID, STEEL_DARK, RUST_BROWN } from './palette'

// =============================================================================
// TransitHub — W outer-ring intermodal exchange (placed at (-20, 12) by
// default). Long bus shelter with 4 bays, sunken metro stairwell entrance,
// 2 bike share docks, info sign. Tile 3×6 m (halfW=1.5, halfD=3.0). ~27
// draw calls. Narrative: car-light mobility hub for the new outer ring.
// =============================================================================

interface TransitHubProps {
  position?: [number, number, number]
  rotation?: number
}

const PAD_COLOR = '#cdd1d6'
const BUS_LANE = '#3a4654'

export function TransitHub({ position = [0, 0, 0], rotation = 0 }: TransitHubProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Pad />
      <BusLane />
      <BusCanopy />
      <BusVehicles />
      <MetroEntrance />
      <BikeRacks />
      <InfoSign />
    </group>
  )
}

function Pad() {
  return (
    <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[3, 6]} />
      <meshLambertMaterial color={PAD_COLOR} />
    </mesh>
  )
}

function BusLane() {
  // Long painted lane running north-south along the east half of the tile.
  return (
    <mesh position={[0.55, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1.1, 5.5]} />
      <meshLambertMaterial color={BUS_LANE} />
    </mesh>
  )
}

function BusCanopy() {
  // Long shed roof spanning 4 bus bays.
  return (
    <group position={[-0.4, 0, 0]}>
      <mesh position={[0, 0.85, 0]} castShadow>
        <boxGeometry args={[0.9, 0.06, 5.0]} />
        <meshLambertMaterial color={STEEL_LIGHT} />
      </mesh>
      {/* support pillars (4, evenly spaced) */}
      {[-2.0, -0.7, 0.7, 2.0].map((z, i) => (
        <mesh key={i} position={[0.4, 0.42, z]} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 0.85, 6]} />
          <meshLambertMaterial color={STEEL_MID} />
        </mesh>
      ))}
      {/* cyan light strip under canopy */}
      <mesh position={[0.4, 0.81, 0]}>
        <boxGeometry args={[0.06, 0.012, 4.8]} />
        <meshLambertMaterial color="#000" emissive={ENERGY_CYAN} emissiveIntensity={1.2} />
      </mesh>
    </group>
  )
}

function BusVehicles() {
  // 2 stationary buses in 2 of the 4 bays.
  const bus = (z: number) => (
    <group key={z} position={[0.55, 0.1, z]}>
      <mesh castShadow>
        <boxGeometry args={[0.6, 0.28, 1.4]} />
        <meshLambertMaterial color={ENERGY_CYAN} emissive={ENERGY_CYAN} emissiveIntensity={0.12} />
      </mesh>
      {/* window strip */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[0.62, 0.1, 1.2]} />
        <meshLambertMaterial color={OFFICE_GLASS} />
      </mesh>
      {/* dark roof rack */}
      <mesh position={[0, 0.18, 0]} castShadow>
        <boxGeometry args={[0.5, 0.04, 1.0]} />
        <meshLambertMaterial color={STEEL_DARK} />
      </mesh>
    </group>
  )
  return (
    <>
      {bus(-1.3)}
      {bus(1.3)}
    </>
  )
}

function MetroEntrance() {
  // Sunken stairwell with railings + an M sign post on the west side.
  return (
    <group position={[-1.0, 0, 2.0]}>
      {/* darker recessed plane */}
      <mesh position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.7, 0.9]} />
        <meshLambertMaterial color={STEEL_DARK} />
      </mesh>
      {/* 3 visible steps */}
      <mesh position={[0, 0.018, 0.35]} castShadow>
        <boxGeometry args={[0.65, 0.035, 0.12]} />
        <meshLambertMaterial color={STEEL_LIGHT} />
      </mesh>
      <mesh position={[0, 0.05, 0.22]} castShadow>
        <boxGeometry args={[0.65, 0.04, 0.12]} />
        <meshLambertMaterial color={STEEL_LIGHT} />
      </mesh>
      {/* railings (2 short posts + horizontal bar) */}
      <mesh position={[-0.3, 0.12, 0.42]}>
        <cylinderGeometry args={[0.015, 0.015, 0.24, 6]} />
        <meshLambertMaterial color={STEEL_MID} />
      </mesh>
      <mesh position={[0.3, 0.12, 0.42]}>
        <cylinderGeometry args={[0.015, 0.015, 0.24, 6]} />
        <meshLambertMaterial color={STEEL_MID} />
      </mesh>
      {/* M sign */}
      <mesh position={[0, 0.42, 0.42]} castShadow>
        <boxGeometry args={[0.16, 0.18, 0.06]} />
        <meshLambertMaterial color="#22354f" />
      </mesh>
      <mesh position={[0, 0.42, 0.453]}>
        <planeGeometry args={[0.1, 0.12]} />
        <meshLambertMaterial color="#000" emissive={ENERGY_CYAN} emissiveIntensity={1.5} />
      </mesh>
    </group>
  )
}

function BikeRacks() {
  // 2 small bike-share docks on the south end.
  const rack = (x: number) => (
    <group key={x} position={[x, 0, -2.3]}>
      <mesh position={[0, 0.08, 0]} castShadow>
        <boxGeometry args={[0.35, 0.04, 0.18]} />
        <meshLambertMaterial color={RUST_BROWN} />
      </mesh>
      {/* 3 mini bike silhouettes (just thin boxes) */}
      {[-0.1, 0, 0.1].map((dx) => (
        <mesh key={dx} position={[dx, 0.12, 0]} castShadow>
          <boxGeometry args={[0.05, 0.08, 0.16]} />
          <meshLambertMaterial color={ENERGY_CYAN} emissive={ENERGY_CYAN} emissiveIntensity={0.3} />
        </mesh>
      ))}
    </group>
  )
  return (
    <>
      {rack(-0.7)}
      {rack(-0.3)}
    </>
  )
}

function InfoSign() {
  return (
    <group position={[-1.1, 0, -2.5]}>
      <mesh position={[0, 0.42, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.85, 6]} />
        <meshLambertMaterial color={STEEL_MID} />
      </mesh>
      <mesh position={[0, 0.85, 0]} castShadow>
        <boxGeometry args={[0.4, 0.22, 0.04]} />
        <meshLambertMaterial color="#0e1a28" />
      </mesh>
      <mesh position={[0, 0.85, 0.023]}>
        <planeGeometry args={[0.34, 0.16]} />
        <meshLambertMaterial color={CITY_SURFACE} emissive={ENERGY_CYAN} emissiveIntensity={0.4} />
      </mesh>
    </group>
  )
}
