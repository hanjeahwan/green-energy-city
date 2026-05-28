import { CITY_SURFACE } from '../../scene/palette'
import { ENERGY_CYAN, STEEL_LIGHT, STEEL_MID, STEEL_DARK, STEEL_DEEP } from './palette'

// =============================================================================
// DataCenter — W outer-ring backend infrastructure (placed at (-20, -12) by
// default). Long windowless server hall with corrugated steel skin + 4 rooftop
// cooling stacks + perimeter mesh fence + cyan emissive vent grilles facing
// the courtyard. Tile 3×4 m (halfW=1.5, halfD=2.0). ~24 draw calls.
// Narrative: physical home of the AI agents that run the command tower.
// =============================================================================

interface DataCenterProps {
  position?: [number, number, number]
  rotation?: number
}

const HALL_BODY = STEEL_DEEP  // deep navy windowless walls

export function DataCenter({ position = [0, 0, 0], rotation = 0 }: DataCenterProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Pad />
      <ServerHall />
      <CoolingStacks />
      <PerimeterFence />
      <VentGrilles />
      <Signage />
    </group>
  )
}

function Pad() {
  return (
    <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[3, 4]} />
      <meshLambertMaterial color={CITY_SURFACE} />
    </mesh>
  )
}

function ServerHall() {
  // Long single-storey rectangular hall, ridged corrugated skin via
  // separated narrow boxes on the long faces.
  return (
    <group>
      {/* main body */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 1.1, 3.4]} />
        <meshLambertMaterial color={HALL_BODY} />
      </mesh>
      {/* roof slab (slightly wider) */}
      <mesh position={[0, 1.13, 0]} castShadow>
        <boxGeometry args={[2.3, 0.06, 3.5]} />
        <meshLambertMaterial color={STEEL_DARK} />
      </mesh>
      {/* corrugated rib effect — 6 thin vertical strips on +x face */}
      {[-1.4, -0.84, -0.28, 0.28, 0.84, 1.4].map((z, i) => (
        <mesh key={i} position={[1.11, 0.55, z]}>
          <boxGeometry args={[0.04, 1.0, 0.06]} />
          <meshLambertMaterial color={STEEL_MID} />
        </mesh>
      ))}
      {/* same on -x face */}
      {[-1.4, -0.84, -0.28, 0.28, 0.84, 1.4].map((z, i) => (
        <mesh key={`l${i}`} position={[-1.11, 0.55, z]}>
          <boxGeometry args={[0.04, 1.0, 0.06]} />
          <meshLambertMaterial color={STEEL_MID} />
        </mesh>
      ))}
    </group>
  )
}

function CoolingStacks() {
  // 4 short cylinder stacks on the roof, evenly spaced.
  return (
    <>
      {[-1.0, -0.35, 0.35, 1.0].map((z, i) => (
        <group key={i} position={[0, 1.15, z]}>
          <mesh position={[0, 0.18, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.14, 0.36, 8]} />
            <meshLambertMaterial color={STEEL_LIGHT} />
          </mesh>
          {/* cap */}
          <mesh position={[0, 0.38, 0]}>
            <cylinderGeometry args={[0.135, 0.12, 0.04, 8]} />
            <meshLambertMaterial color={STEEL_DARK} />
          </mesh>
        </group>
      ))}
    </>
  )
}

function PerimeterFence() {
  // Short fence along the south + east + west edges (north is the entrance).
  const fenceColor = STEEL_MID
  const post = (x: number, z: number) => (
    <mesh key={`p${x}-${z}`} position={[x, 0.12, z]}>
      <cylinderGeometry args={[0.018, 0.018, 0.24, 6]} />
      <meshLambertMaterial color={fenceColor} />
    </mesh>
  )
  const railZ = (z: number) => (
    <mesh key={`rz${z}`} position={[0, 0.2, z]}>
      <boxGeometry args={[2.8, 0.02, 0.02]} />
      <meshLambertMaterial color={fenceColor} />
    </mesh>
  )
  const railX = (x: number) => (
    <mesh key={`rx${x}`} position={[x, 0.2, 0]}>
      <boxGeometry args={[0.02, 0.02, 3.8]} />
      <meshLambertMaterial color={fenceColor} />
    </mesh>
  )
  return (
    <>
      {/* south rail + corner posts */}
      {railZ(-1.92)}
      {post(-1.4, -1.92)} {post(0, -1.92)} {post(1.4, -1.92)}
      {/* east rail */}
      {railX(1.43)}
      {post(1.43, -1.0)} {post(1.43, 1.0)}
      {/* west rail */}
      {railX(-1.43)}
      {post(-1.43, -1.0)} {post(-1.43, 1.0)}
    </>
  )
}

function VentGrilles() {
  // Cyan emissive vent slits on the south face — the "AI brain glow".
  return (
    <>
      {[-0.7, 0, 0.7].map((x, i) => (
        <mesh key={i} position={[x, 0.4, 1.71]}>
          <planeGeometry args={[0.32, 0.06]} />
          <meshLambertMaterial color="#000" emissive={ENERGY_CYAN} emissiveIntensity={1.4} />
        </mesh>
      ))}
      <mesh position={[0, 0.65, 1.71]}>
        <planeGeometry args={[1.6, 0.04]} />
        <meshLambertMaterial color="#000" emissive={ENERGY_CYAN} emissiveIntensity={0.8} />
      </mesh>
    </>
  )
}

function Signage() {
  // Small sign on the north face.
  return (
    <group position={[0, 0.55, -1.71]}>
      <mesh>
        <boxGeometry args={[0.6, 0.18, 0.04]} />
        <meshLambertMaterial color="#0e1a28" />
      </mesh>
      <mesh position={[0, 0, 0.023]}>
        <planeGeometry args={[0.52, 0.13]} />
        <meshLambertMaterial color="#000" emissive={ENERGY_CYAN} emissiveIntensity={1.3} />
      </mesh>
    </group>
  )
}
