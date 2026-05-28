import { Tree } from '../nature/Tree'
import { CITY_SURFACE, OFFICE_STONE } from '../../scene/palette'
import { ENERGY_CYAN, STEEL_LIGHT, STEEL_MID, RUST_BROWN } from './palette'

// =============================================================================
// MuseumPlaza — S edge sector landmark (placed at z=-18.5 by default). A
// single porticoed museum building (4 columns + pediment + steps) plus a
// front plaza with a central sculpture and reflecting strips. Footprint 6×3 m
// (halfW=3, halfD=1.5). Narrative: civic memory / culture. ~28 draw calls.
// =============================================================================

interface MuseumPlazaProps {
  position?: [number, number, number]
  rotation?: number
}

const TILE_W = 6
const TILE_D = 3
const PLAZA_STONE = '#d4d7d8' // pale museum stone

export function MuseumPlaza({ position = [0, 0, 0], rotation = 0 }: MuseumPlazaProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <PlazaGround />
      <ReflectingPools />
      <MuseumBuilding />
      <Portico />
      <CenterSculpture />
      <FrontBenches />
      <CornerTrees />
    </group>
  )
}

function PlazaGround() {
  return (
    <>
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[TILE_W, TILE_D]} />
        <meshLambertMaterial color={PLAZA_STONE} />
      </mesh>
      {/* central darker plaza inset */}
      <mesh position={[0, 0.008, -0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.4, 1.5]} />
        <meshLambertMaterial color={CITY_SURFACE} />
      </mesh>
    </>
  )
}

function ReflectingPools() {
  // Two thin water strips flanking the central plaza, cyan emissive.
  return (
    <>
      <mesh position={[-1.4, 0.012, -0.4]}>
        <boxGeometry args={[0.35, 0.01, 1.3]} />
        <meshLambertMaterial color={ENERGY_CYAN} emissive={ENERGY_CYAN} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[1.4, 0.012, -0.4]}>
        <boxGeometry args={[0.35, 0.01, 1.3]} />
        <meshLambertMaterial color={ENERGY_CYAN} emissive={ENERGY_CYAN} emissiveIntensity={0.3} />
      </mesh>
    </>
  )
}

function MuseumBuilding() {
  // Long rectangular hall at +z (back of tile), single tall storey.
  return (
    <group position={[0, 0, 1.05]}>
      {/* base */}
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[5.0, 0.1, 0.9]} />
        <meshLambertMaterial color={STEEL_LIGHT} />
      </mesh>
      {/* main hall */}
      <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.6, 1.0, 0.8]} />
        <meshLambertMaterial color={OFFICE_STONE} />
      </mesh>
      {/* pediment triangle */}
      <mesh position={[0, 1.24, 0]} rotation={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 4.7, 3, 1]} />
        <meshLambertMaterial color={STEEL_LIGHT} />
      </mesh>
      {/* engraved frieze band */}
      <mesh position={[0, 1.08, 0.405]}>
        <planeGeometry args={[4.5, 0.1]} />
        <meshLambertMaterial color={RUST_BROWN} emissive={RUST_BROWN} emissiveIntensity={0.1} />
      </mesh>
    </group>
  )
}

function Portico() {
  // 4 columns + steps in front of the museum.
  return (
    <group position={[0, 0, 0.6]}>
      {/* steps (3 layered slabs) */}
      <mesh position={[0, 0.04, 0]} castShadow>
        <boxGeometry args={[4.2, 0.08, 0.35]} />
        <meshLambertMaterial color={STEEL_LIGHT} />
      </mesh>
      <mesh position={[0, 0.1, 0.08]} castShadow>
        <boxGeometry args={[4.0, 0.06, 0.25]} />
        <meshLambertMaterial color={STEEL_LIGHT} />
      </mesh>
      {/* 4 columns */}
      {[-1.6, -0.5, 0.5, 1.6].map((x) => (
        <mesh key={x} position={[x, 0.55, 0.2]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 1.0, 12]} />
          <meshLambertMaterial color={STEEL_LIGHT} />
        </mesh>
      ))}
      {/* portico architrave */}
      <mesh position={[0, 1.08, 0.2]} castShadow>
        <boxGeometry args={[3.6, 0.12, 0.18]} />
        <meshLambertMaterial color={STEEL_MID} />
      </mesh>
    </group>
  )
}

function CenterSculpture() {
  // Abstract obelisk in the plaza center.
  return (
    <group position={[0, 0, -0.4]}>
      {/* base */}
      <mesh position={[0, 0.08, 0]} castShadow>
        <boxGeometry args={[0.28, 0.16, 0.28]} />
        <meshLambertMaterial color={STEEL_LIGHT} />
      </mesh>
      {/* obelisk column — twisted box */}
      <mesh position={[0, 0.45, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <boxGeometry args={[0.13, 0.7, 0.13]} />
        <meshLambertMaterial color={STEEL_MID} />
      </mesh>
      {/* cyan accent cap */}
      <mesh position={[0, 0.83, 0]}>
        <coneGeometry args={[0.07, 0.14, 6]} />
        <meshLambertMaterial color={ENERGY_CYAN} emissive={ENERGY_CYAN} emissiveIntensity={1.2} />
      </mesh>
    </group>
  )
}

function FrontBenches() {
  // 4 benches along the south plaza edge.
  const bench = (x: number) => (
    <group key={x} position={[x, 0, -1.1]}>
      <mesh position={[0, 0.07, 0]} castShadow>
        <boxGeometry args={[0.42, 0.04, 0.1]} />
        <meshLambertMaterial color={RUST_BROWN} />
      </mesh>
      <mesh position={[-0.16, 0.035, 0]} castShadow>
        <boxGeometry args={[0.04, 0.07, 0.08]} />
        <meshLambertMaterial color="#5a5048" />
      </mesh>
      <mesh position={[0.16, 0.035, 0]} castShadow>
        <boxGeometry args={[0.04, 0.07, 0.08]} />
        <meshLambertMaterial color="#5a5048" />
      </mesh>
    </group>
  )
  return <>{[-2.0, -0.7, 0.7, 2.0].map(bench)}</>
}

function CornerTrees() {
  return (
    <>
      <Tree position={[-2.6, 0, -1.0]} scale={0.7} variant="modern" rot={1.0} />
      <Tree position={[2.6, 0, -1.0]} scale={0.7} variant="modern" rot={-1.0} />
    </>
  )
}
