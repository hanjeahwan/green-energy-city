import { Tree } from '../nature/Tree'
import { CITY_SURFACE, OFFICE_GLASS, OFFICE_STONE } from '../../scene/palette'
import { ENERGY_CYAN, STEEL_LIGHT, STEEL_MID, STATUS_RED } from './palette'

// =============================================================================
// Hospital — E edge sector landmark (placed at x=+18.5 by default). Plus-shape
// main building with a rooftop helipad, entrance canopy, and an ambulance bay.
// Footprint 3×6 m (halfW=1.5, halfD=3). Narrative: clean-energy serves life
// (邻 GreenEcoOffice). ~22 draw calls.
// =============================================================================

interface HospitalProps {
  position?: [number, number, number]
  rotation?: number
}

const TILE_W = 3
const TILE_D = 6
const PAD_COLOR = '#cfd5d0' // soft cool concrete

export function Hospital({ position = [0, 0, 0], rotation = 0 }: HospitalProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Pad />
      <MainPlus />
      <RoofHelipad />
      <Entrance />
      <AmbulanceBay />
      <FrontTree />
    </group>
  )
}

function Pad() {
  return (
    <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[TILE_W, TILE_D]} />
      <meshLambertMaterial color={PAD_COLOR} />
    </mesh>
  )
}

function MainPlus() {
  // Two perpendicular bars forming a plus from top — long bar along Z, short
  // bar along X. Each 1.2u tall.
  return (
    <group>
      {/* long bar (north-south) */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 1.2, 3.6]} />
        <meshLambertMaterial color={OFFICE_STONE} />
      </mesh>
      {/* short bar (east-west) */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 1.2, 1.4]} />
        <meshLambertMaterial color={OFFICE_STONE} />
      </mesh>
      {/* glass window strips at level 1 */}
      <mesh position={[0, 0.85, 1.81]}>
        <planeGeometry args={[1.2, 0.18]} />
        <meshLambertMaterial color={OFFICE_GLASS} emissive={ENERGY_CYAN} emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[0, 0.85, -1.81]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.2, 0.18]} />
        <meshLambertMaterial color={OFFICE_GLASS} emissive={ENERGY_CYAN} emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[1.31, 0.85, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[1.2, 0.18]} />
        <meshLambertMaterial color={OFFICE_GLASS} emissive={ENERGY_CYAN} emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[-1.31, 0.85, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[1.2, 0.18]} />
        <meshLambertMaterial color={OFFICE_GLASS} emissive={ENERGY_CYAN} emissiveIntensity={0.18} />
      </mesh>
      {/* red cross emblem on south face */}
      <mesh position={[0, 0.7, 1.815]}>
        <planeGeometry args={[0.22, 0.06]} />
        <meshLambertMaterial color={STATUS_RED} emissive={STATUS_RED} emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0, 0.7, 1.815]}>
        <planeGeometry args={[0.06, 0.22]} />
        <meshLambertMaterial color={STATUS_RED} emissive={STATUS_RED} emissiveIntensity={0.6} />
      </mesh>
    </group>
  )
}

function RoofHelipad() {
  // Circular helipad with painted H on top of the central plus.
  return (
    <group position={[0, 1.21, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.6, 24]} />
        <meshLambertMaterial color={STEEL_MID} />
      </mesh>
      {/* H mark — sits on top of the y=0.005 helipad disc, lifted to 0.015
          so the depth buffer can separate them at zoom-out. */}
      <mesh position={[-0.15, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.08, 0.5]} />
        <meshLambertMaterial color={STEEL_LIGHT} emissive={STEEL_LIGHT} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.15, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.08, 0.5]} />
        <meshLambertMaterial color={STEEL_LIGHT} emissive={STEEL_LIGHT} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.3, 0.08]} />
        <meshLambertMaterial color={STEEL_LIGHT} emissive={STEEL_LIGHT} emissiveIntensity={0.3} />
      </mesh>
      {/* corner cyan landing lights */}
      {[[0.55, 0.55], [-0.55, 0.55], [0.55, -0.55], [-0.55, -0.55]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.01, z]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshLambertMaterial color={ENERGY_CYAN} emissive={ENERGY_CYAN} emissiveIntensity={1.4} />
        </mesh>
      ))}
    </group>
  )
}

function Entrance() {
  // Canopy + double doors on the south face of the plus.
  return (
    <group position={[0, 0, 2.0]}>
      {/* canopy roof */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1.4, 0.06, 0.5]} />
        <meshLambertMaterial color={STEEL_LIGHT} />
      </mesh>
      {/* 2 support pillars */}
      <mesh position={[-0.6, 0.25, 0.2]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.5, 6]} />
        <meshLambertMaterial color={STEEL_MID} />
      </mesh>
      <mesh position={[0.6, 0.25, 0.2]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.5, 6]} />
        <meshLambertMaterial color={STEEL_MID} />
      </mesh>
      {/* paved entry slab */}
      <mesh position={[0, 0.008, 0.18]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.3, 0.5]} />
        <meshLambertMaterial color={CITY_SURFACE} />
      </mesh>
    </group>
  )
}

function AmbulanceBay() {
  // North-side painted stall + a parked ambulance silhouette.
  return (
    <group position={[0, 0, -2.2]}>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.9, 0.55]} />
        <meshLambertMaterial color="#dde3ec" />
      </mesh>
      {/* ambulance box */}
      <mesh position={[0, 0.14, 0]} castShadow>
        <boxGeometry args={[0.5, 0.24, 0.85]} />
        <meshLambertMaterial color="#f0f3f7" />
      </mesh>
      <mesh position={[0, 0.32, -0.05]} castShadow>
        <boxGeometry args={[0.46, 0.16, 0.45]} />
        <meshLambertMaterial color="#dde3ec" />
      </mesh>
      {/* red cross side stripe */}
      <mesh position={[0.26, 0.14, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.5, 0.08]} />
        <meshLambertMaterial color={STATUS_RED} emissive={STATUS_RED} emissiveIntensity={0.4} />
      </mesh>
      {/* light bar */}
      <mesh position={[0, 0.44, 0.05]}>
        <boxGeometry args={[0.18, 0.04, 0.12]} />
        <meshLambertMaterial color={STATUS_RED} emissive={STATUS_RED} emissiveIntensity={1.2} />
      </mesh>
    </group>
  )
}

function FrontTree() {
  return <Tree position={[-1.05, 0, 2.4]} scale={0.65} variant="broadleaf" rot={0.6} />
}
