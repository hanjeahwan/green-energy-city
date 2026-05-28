import { Tree } from '../nature/Tree'
import { VEGETATION, OFFICE_GLASS, OFFICE_STONE, CITY_SURFACE } from '../../scene/palette'
import { ENERGY_CYAN, STEEL_LIGHT, STEEL_MID } from './palette'

// =============================================================================
// ResearchPark — NE outer-ring R&D campus (placed at (19, 19) by default).
// Three low-rise glass labs arranged in a U around a central courtyard with
// a reflecting water feature, rooftop HVAC blocks, security gate, and corner
// trees. Tile 4×4 m (halfW=halfD=2.0). ~30 draw calls. Narrative: AI-energy
// research extends the University → industrial pipeline.
// =============================================================================

interface ResearchParkProps {
  position?: [number, number, number]
  rotation?: number
}

export function ResearchPark({ position = [0, 0, 0], rotation = 0 }: ResearchParkProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <CampusGround />
      <NorthLab />
      <WestLab />
      <EastLab />
      <CentralWater />
      <SecurityGate />
      <CornerTrees />
    </group>
  )
}

function CampusGround() {
  return (
    <>
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4, 4]} />
        <meshLambertMaterial color={CITY_SURFACE} />
      </mesh>
      {/* central grass */}
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1.8, 1.6]} />
        <meshLambertMaterial color={VEGETATION} />
      </mesh>
    </>
  )
}

function lab(width: number, depth: number) {
  // Single low-rise glass cube + rooftop HVAC. Used by all 3 labs at varying sizes.
  return (
    <>
      {/* base body */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.9, depth]} />
        <meshLambertMaterial color={OFFICE_STONE} />
      </mesh>
      {/* glass curtain wall (front face only — at +Z) */}
      <mesh position={[0, 0.5, depth / 2 + 0.02]}>
        <planeGeometry args={[width * 0.85, 0.7]} />
        <meshLambertMaterial color={OFFICE_GLASS} emissive={ENERGY_CYAN} emissiveIntensity={0.2} />
      </mesh>
      {/* roof trim */}
      <mesh position={[0, 0.92, 0]}>
        <boxGeometry args={[width + 0.04, 0.05, depth + 0.04]} />
        <meshLambertMaterial color={STEEL_MID} />
      </mesh>
      {/* 2 small rooftop HVAC blocks */}
      <mesh position={[-width * 0.25, 1.0, 0]} castShadow>
        <boxGeometry args={[width * 0.2, 0.12, depth * 0.4]} />
        <meshLambertMaterial color={STEEL_LIGHT} />
      </mesh>
      <mesh position={[width * 0.25, 1.0, 0]} castShadow>
        <boxGeometry args={[width * 0.2, 0.12, depth * 0.4]} />
        <meshLambertMaterial color={STEEL_LIGHT} />
      </mesh>
    </>
  )
}

function NorthLab() {
  // Wide back lab (the "main" one) facing south toward courtyard.
  return (
    <group position={[0, 0, 1.35]} rotation={[0, Math.PI, 0]}>
      {lab(2.4, 1.0)}
    </group>
  )
}

function WestLab() {
  return (
    <group position={[-1.4, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
      {lab(1.6, 0.9)}
    </group>
  )
}

function EastLab() {
  return (
    <group position={[1.4, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
      {lab(1.6, 0.9)}
    </group>
  )
}

function CentralWater() {
  // Cyan emissive square reflecting pool with stone edge.
  return (
    <group position={[0, 0, 0]}>
      {/* stone edge */}
      <mesh position={[0, 0.025, 0]}>
        <boxGeometry args={[1.2, 0.05, 1.0]} />
        <meshLambertMaterial color={STEEL_LIGHT} />
      </mesh>
      {/* water surface */}
      <mesh position={[0, 0.055, 0]}>
        <boxGeometry args={[1.0, 0.008, 0.8]} />
        <meshLambertMaterial color={ENERGY_CYAN} emissive={ENERGY_CYAN} emissiveIntensity={0.35} />
      </mesh>
    </group>
  )
}

function SecurityGate() {
  // South-side: 2 short pylons + a horizontal beam (drop-arm gate aesthetic).
  return (
    <group position={[0, 0, -1.85]}>
      <mesh position={[-0.5, 0.15, 0]} castShadow>
        <boxGeometry args={[0.12, 0.3, 0.12]} />
        <meshLambertMaterial color={STEEL_MID} />
      </mesh>
      <mesh position={[0.5, 0.15, 0]} castShadow>
        <boxGeometry args={[0.12, 0.3, 0.12]} />
        <meshLambertMaterial color={STEEL_MID} />
      </mesh>
      {/* gate arm */}
      <mesh position={[0, 0.32, 0]} castShadow>
        <boxGeometry args={[1.05, 0.04, 0.04]} />
        <meshLambertMaterial color="#000" emissive={ENERGY_CYAN} emissiveIntensity={0.9} />
      </mesh>
    </group>
  )
}

function CornerTrees() {
  return (
    <>
      <Tree position={[-1.7, 0, -1.6]} scale={0.55} variant="modern" rot={0.4} />
      <Tree position={[1.7, 0, -1.6]} scale={0.55} variant="modern" rot={-0.4} />
    </>
  )
}
