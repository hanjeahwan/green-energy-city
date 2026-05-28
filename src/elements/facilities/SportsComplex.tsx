import { VEGETATION, CITY_SURFACE } from '../../scene/palette'
import { ENERGY_CYAN, STEEL_LIGHT, STEEL_MID, STEEL_DARK, RUST_BROWN } from './palette'

// =============================================================================
// SportsComplex — NW outer-ring landmark (placed at (-20, 19) by default).
// Oval running track around a central football pitch, single grandstand with
// a small covered roof, one outdoor basketball court, scoreboard pole. Tile
// 4×4 m (halfW=halfD=2.0). ~25 draw calls. Narrative: civic recreation /
// neighbourhood sports for the new outer-residential blocks.
// =============================================================================

interface SportsComplexProps {
  position?: [number, number, number]
  rotation?: number
}

const TRACK_COLOR = '#c47a52'   // sport-orange running surface
const COURT_COLOR = '#3a6a8a'   // basketball court tarmac
const LINE_COLOR  = '#f0f3f7'   // painted lines

export function SportsComplex({ position = [0, 0, 0], rotation = 0 }: SportsComplexProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Ground />
      <Track />
      <PitchGrass />
      <Grandstand />
      <BasketballCourt />
      <Scoreboard />
    </group>
  )
}

function Ground() {
  return (
    <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[4, 4]} />
      <meshLambertMaterial color={CITY_SURFACE} />
    </mesh>
  )
}

function Track() {
  // Approximate oval track using a flat torus.
  // Layers: apron 0.005 -> track 0.015 -> pitch 0.025 -> lines 0.035 (>=1cm
  // gap each so the depth-buffer at zoom-out can resolve them).
  return (
    <mesh position={[0, 0.015, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[1.0, 1.45, 32]} />
      <meshLambertMaterial color={TRACK_COLOR} />
    </mesh>
  )
}

function PitchGrass() {
  return (
    <>
      {/* central football pitch */}
      <mesh position={[0, 0.025, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.6, 1.0]} />
        <meshLambertMaterial color={VEGETATION} />
      </mesh>
      {/* center line + center circle were both at y=0.035 (same plane) so
          they z-fought each other where the circle crosses the line.
          Lifted circle to 0.045 — keeps them visually merged at any normal
          viewing angle but separates their depth. */}
      <mesh position={[0, 0.035, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.02, 1.0]} />
        <meshLambertMaterial color={LINE_COLOR} />
      </mesh>
      <mesh position={[0, 0.045, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.13, 0.15, 16]} />
        <meshLambertMaterial color={LINE_COLOR} />
      </mesh>
    </>
  )
}

function Grandstand() {
  // South-side grandstand: 3 stepped rows + a covered roof on slanted struts.
  //
  // Box dims shrunk from [1.8, 0.12, 0.18] to [1.8, 0.09, 0.10]:
  //   - Rows step Y by 0.10, but the old box was 0.12 tall — adjacent rows
  //     overlapped 2cm in Y.
  //   - Rows step Z by 0.12, but the old box was 0.18 deep — adjacent rows
  //     overlapped 6cm in Z.
  //   - Together each pair shared a 2×6cm solid prism. The surfaces inside
  //     that prism z-fought permanently, regardless of depth precision.
  // New dims: 0.09 tall (1cm Y gap), 0.10 deep (2cm Z gap). Each row reads
  // as a distinct step instead of fusing into a blob.
  return (
    <group position={[0, 0, -1.4]}>
      {/* 3 stepped seating rows */}
      <mesh position={[0, 0.06, 0.12]} castShadow>
        <boxGeometry args={[1.8, 0.09, 0.10]} />
        <meshLambertMaterial color={STEEL_LIGHT} />
      </mesh>
      <mesh position={[0, 0.16, 0.0]} castShadow>
        <boxGeometry args={[1.8, 0.09, 0.10]} />
        <meshLambertMaterial color={STEEL_LIGHT} />
      </mesh>
      <mesh position={[0, 0.26, -0.12]} castShadow>
        <boxGeometry args={[1.8, 0.09, 0.10]} />
        <meshLambertMaterial color={STEEL_LIGHT} />
      </mesh>
      {/* cyan seat strip */}
      <mesh position={[0, 0.22, 0.06]}>
        <planeGeometry args={[1.75, 0.04]} />
        <meshLambertMaterial color="#000" emissive={ENERGY_CYAN} emissiveIntensity={0.8} />
      </mesh>
      {/* covered roof (slanted) */}
      <mesh position={[0, 0.65, -0.1]} rotation={[-0.35, 0, 0]} castShadow>
        <boxGeometry args={[2.0, 0.04, 0.6]} />
        <meshLambertMaterial color={STEEL_DARK} />
      </mesh>
      {/* roof support struts (2 diagonal) */}
      <mesh position={[-0.85, 0.4, 0]} rotation={[0.25, 0, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.7, 6]} />
        <meshLambertMaterial color={STEEL_MID} />
      </mesh>
      <mesh position={[0.85, 0.4, 0]} rotation={[0.25, 0, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.7, 6]} />
        <meshLambertMaterial color={STEEL_MID} />
      </mesh>
    </group>
  )
}

function BasketballCourt() {
  // North-side: small basketball half-court with painted lines and 1 hoop pole.
  return (
    <group position={[1.4, 0, 1.2]}>
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.0, 0.7]} />
        <meshLambertMaterial color={COURT_COLOR} />
      </mesh>
      {/* line border */}
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.13, 0.15, 12, 1, 0, Math.PI]} />
        <meshLambertMaterial color={LINE_COLOR} />
      </mesh>
      {/* hoop pole + backboard */}
      <mesh position={[0.42, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.4, 6]} />
        <meshLambertMaterial color={STEEL_MID} />
      </mesh>
      <mesh position={[0.46, 0.32, 0]} castShadow>
        <boxGeometry args={[0.02, 0.12, 0.16]} />
        <meshLambertMaterial color={LINE_COLOR} />
      </mesh>
    </group>
  )
}

function Scoreboard() {
  return (
    <group position={[-1.4, 0, 1.3]}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.04, 0.8, 6]} />
        <meshLambertMaterial color={RUST_BROWN} />
      </mesh>
      <mesh position={[0, 0.85, 0]} castShadow>
        <boxGeometry args={[0.42, 0.18, 0.06]} />
        <meshLambertMaterial color="#22354f" />
      </mesh>
      {/* Screen plane was at z=0.033 — only 3mm in front of the scoreboard
          box's z=0.03 front face. Pushed to 0.05 (2cm clearance). */}
      <mesh position={[0, 0.85, 0.05]}>
        <planeGeometry args={[0.36, 0.1]} />
        <meshLambertMaterial color="#000" emissive={ENERGY_CYAN} emissiveIntensity={1.4} />
      </mesh>
    </group>
  )
}
