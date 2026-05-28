import { CITY_SURFACE, VEGETATION } from '../../scene/palette'
import { ENERGY_CYAN, STEEL_LIGHT, STEEL_MID, RUST_BROWN } from './palette'

// =============================================================================
// Market — W edge sector landmark (placed at x=-18.5 by default). A linear
// row of 5 covered market stalls with differently-tinted canvas canopies,
// goods crates, central walkway, planter boxes at the ends. Footprint 3×6 m
// (halfW=1.5, halfD=3). Narrative: residential neighbourhood retail. ~30 draw
// calls.
// =============================================================================

interface MarketProps {
  position?: [number, number, number]
  rotation?: number
}

const TILE_W = 3
const TILE_D = 6
const PLAZA_PAVING = '#d2cfc4' // warm-ish plaza paving

// 5 canopy tints — cool palette: navy, cyan, teal, slate, off-white. Cycling.
const CANOPY_COLORS = ['#4a6a8c', ENERGY_CYAN, '#6cb8c0', '#5d7088', '#dcdfe3'] as const

export function Market({ position = [0, 0, 0], rotation = 0 }: MarketProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <PlazaPaving />
      <CentralWalkway />
      <StallRow side="west" />
      <StallRow side="east" />
      <Planters />
      <SignArch />
    </group>
  )
}

function PlazaPaving() {
  return (
    <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[TILE_W, TILE_D]} />
      <meshLambertMaterial color={PLAZA_PAVING} />
    </mesh>
  )
}

function CentralWalkway() {
  return (
    <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.7, TILE_D - 0.3]} />
      <meshLambertMaterial color={CITY_SURFACE} />
    </mesh>
  )
}

function StallRow({ side }: { side: 'west' | 'east' }) {
  // 5 stalls per side, offset to ±0.95u from centerline, spanning z∈[-2.2, 2.2].
  const x = side === 'west' ? -0.95 : 0.95
  const flip = side === 'west' ? 1 : -1
  const stallZ = [-2.0, -1.0, 0, 1.0, 2.0]
  return (
    <>
      {stallZ.map((z, i) => (
        <Stall key={i} position={[x, 0, z]} canopyColor={CANOPY_COLORS[(i + (side === 'east' ? 2 : 0)) % CANOPY_COLORS.length]} flip={flip} />
      ))}
    </>
  )
}

function Stall({
  position,
  canopyColor,
  flip,
}: {
  position: [number, number, number]
  canopyColor: string
  flip: number
}) {
  // A stall = base counter + canvas canopy + 2 poles + a couple of crates.
  return (
    <group position={position}>
      {/* counter base */}
      <mesh position={[0, 0.18, 0]} castShadow>
        <boxGeometry args={[0.55, 0.36, 0.7]} />
        <meshLambertMaterial color={RUST_BROWN} />
      </mesh>
      {/* counter top slab */}
      <mesh position={[0, 0.37, 0]} castShadow>
        <boxGeometry args={[0.6, 0.04, 0.75]} />
        <meshLambertMaterial color={STEEL_LIGHT} />
      </mesh>
      {/* 4 corner poles */}
      {[[0.25, 0.32], [-0.25, 0.32], [0.25, -0.32], [-0.25, -0.32]].map(([dx, dz], i) => (
        <mesh key={i} position={[dx, 0.45, dz]} castShadow>
          <cylinderGeometry args={[0.018, 0.018, 0.5, 6]} />
          <meshLambertMaterial color={STEEL_MID} />
        </mesh>
      ))}
      {/* canvas canopy — sloped slightly toward the central walkway */}
      <mesh position={[0.06 * flip, 0.74, 0]} rotation={[0, 0, -0.08 * flip]} castShadow>
        <boxGeometry args={[0.7, 0.025, 0.8]} />
        <meshLambertMaterial color={canopyColor} emissive={canopyColor} emissiveIntensity={0.08} />
      </mesh>
      {/* goods crate on counter */}
      <mesh position={[0.1, 0.46, -0.15]} castShadow>
        <boxGeometry args={[0.18, 0.14, 0.18]} />
        <meshLambertMaterial color={RUST_BROWN} />
      </mesh>
      <mesh position={[-0.12, 0.48, 0.12]} castShadow>
        <boxGeometry args={[0.16, 0.17, 0.16]} />
        <meshLambertMaterial color={STEEL_LIGHT} />
      </mesh>
    </group>
  )
}

function Planters() {
  // 2 planter boxes at the north and south ends with greenery.
  const planter = (z: number) => (
    <group position={[0, 0, z]}>
      <mesh position={[0, 0.1, 0]} castShadow>
        <boxGeometry args={[1.2, 0.2, 0.35]} />
        <meshLambertMaterial color={STEEL_LIGHT} />
      </mesh>
      {/* greenery top */}
      <mesh position={[0, 0.23, 0]}>
        <boxGeometry args={[1.15, 0.08, 0.3]} />
        <meshLambertMaterial color={VEGETATION} />
      </mesh>
    </group>
  )
  return (
    <>
      {planter(2.7)}
      {planter(-2.7)}
    </>
  )
}

function SignArch() {
  // South-end signboard "MARKET" — two posts + horizontal sign plate + cyan
  // emissive text band.
  return (
    <group position={[0, 0, -2.4]}>
      <mesh position={[-0.6, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.9, 6]} />
        <meshLambertMaterial color={STEEL_MID} />
      </mesh>
      <mesh position={[0.6, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.9, 6]} />
        <meshLambertMaterial color={STEEL_MID} />
      </mesh>
      <mesh position={[0, 0.85, 0]} castShadow>
        <boxGeometry args={[1.4, 0.18, 0.06]} />
        <meshLambertMaterial color="#22354f" />
      </mesh>
      <mesh position={[0, 0.85, 0.035]}>
        <planeGeometry args={[1.2, 0.1]} />
        <meshLambertMaterial color="#000" emissive={ENERGY_CYAN} emissiveIntensity={1.4} />
      </mesh>
    </group>
  )
}
