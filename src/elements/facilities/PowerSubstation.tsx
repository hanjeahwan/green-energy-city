import * as THREE from 'three'
import { useMemo } from 'react'
import { ENERGY_CYAN } from '../../scene/palette'

// =============================================================================
// PowerSubstation — full substation tile (3.5×3m) replacing the previous
// pair of standalone TransmissionTower placements (trans-1 + trans-2).
//
// Reference image 3: rectangular gray transformer building with rooftop
// transformer equipment (cylindrical insulators + boxy switchgear), tall
// steel transmission pylon to one side with high-voltage wires looping
// down to the building, smaller framework structure to the left, heavy
// cyan LED accent strip wrapping the base, cyan glow strips on the
// building walls.
//
// Geometry budget ~60 meshes:
//   - 1 base tile + 1 sidewalk border + cyan LED skirt strips
//   - 1 main transformer building (with cyan glass + LED wall accents)
//   - 6 rooftop transformer modules (boxy switchgear + insulator stacks)
//   - 1 tall transmission pylon (lattice tower) + 4 insulator strings
//   - 1 secondary framework structure (smaller side gantry)
//   - 4 high-voltage cables curving from pylon top to building
// =============================================================================

interface PowerSubstationProps {
  position?: [number, number, number]
  rotation?: number
}

const TILE_W = 3.5
const TILE_D = 3.0
const SIDEWALK_BAND = 0.2

export function PowerSubstation({
  position = [0, 0, 0],
  rotation = 0,
}: PowerSubstationProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Tile />
      <LEDSkirt />
      <MainBuilding />
      <RooftopTransformers />
      <PylonTower position={[1.2, 0, 0.9]} />
      <SideGantry position={[-1.3, 0, -0.6]} />
      <HighVoltageCables />
    </group>
  )
}

// -----------------------------------------------------------------------------
// Tile — concrete substation pad + sidewalk border
// -----------------------------------------------------------------------------
function Tile() {
  return (
    <group>
      {/* sidewalk band */}
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[TILE_W + SIDEWALK_BAND * 2, TILE_D + SIDEWALK_BAND * 2]} />
        <meshLambertMaterial color="#d6dae0" />
      </mesh>
      {/* concrete substation pad */}
      <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[TILE_W, TILE_D]} />
        <meshLambertMaterial color="#c8ced6" />
      </mesh>
      {/* gravel underlay around the pylon foot (lighter patch) */}
      <mesh position={[1.2, 0.008, 0.9]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.8, 0.8]} />
        <meshLambertMaterial color="#a8aeb6" />
      </mesh>
    </group>
  )
}

// -----------------------------------------------------------------------------
// LEDSkirt — heavy cyan LED strip wrapping the tile base (reference image's
// signature glow under the substation). Uses 4 emissive box strips on the
// outer edges of the sidewalk band.
// -----------------------------------------------------------------------------
function LEDSkirt() {
  const stripT = 0.05
  const insetFromEdge = 0.04
  const outerW = TILE_W + SIDEWALK_BAND * 2 - insetFromEdge * 2
  const outerD = TILE_D + SIDEWALK_BAND * 2 - insetFromEdge * 2
  const halfW = outerW / 2
  const halfD = outerD / 2
  const mat = (
    <meshLambertMaterial
      color="#0a1428"
      emissive={ENERGY_CYAN}
      emissiveIntensity={1.6}  // very bright — substation is the "energy hub" hero

    />
  )
  return (
    <group position={[0, 0.012, 0]}>
      <mesh position={[0, 0, halfD]}>
        <boxGeometry args={[outerW, 0.04, stripT]} />
        {mat}
      </mesh>
      <mesh position={[0, 0, -halfD]}>
        <boxGeometry args={[outerW, 0.04, stripT]} />
        {mat}
      </mesh>
      <mesh position={[halfW, 0, 0]}>
        <boxGeometry args={[stripT, 0.04, outerD]} />
        {mat}
      </mesh>
      <mesh position={[-halfW, 0, 0]}>
        <boxGeometry args={[stripT, 0.04, outerD]} />
        {mat}
      </mesh>
    </group>
  )
}

// -----------------------------------------------------------------------------
// MainBuilding — central gray transformer building with cyan glass windows
// + cyan LED wall accent strips
// -----------------------------------------------------------------------------
function MainBuilding() {
  const w = 1.8
  const h = 1.0
  const d = 1.4
  return (
    <group position={[-0.2, 0, 0]}>
      {/* body */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshLambertMaterial color="#c8ced6" />
      </mesh>
      {/* roof slab — lightened from #3a4654 (near-black) to mid gray so
          the substation's main building doesn't read as a black box. */}
      <mesh position={[0, h + 0.04, 0]} castShadow>
        <boxGeometry args={[w + 0.04, 0.08, d + 0.04]} />
        <meshLambertMaterial color="#7a8088" />
      </mesh>
      {/* cyan glass strip on the south face (long horizontal window) */}
      <mesh position={[0, h * 0.55, d / 2 + 0.02]}>
        <planeGeometry args={[w * 0.85, h * 0.32]} />
        <meshLambertMaterial color="#1a3a5a" emissive={ENERGY_CYAN} emissiveIntensity={0.6} />
      </mesh>
      {/* cyan glass strip on the east face */}
      <mesh position={[w / 2 + 0.02, h * 0.55, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[d * 0.85, h * 0.32]} />
        <meshLambertMaterial color="#1a3a5a" emissive={ENERGY_CYAN} emissiveIntensity={0.6} />
      </mesh>
      {/* faint vertical LED strips at corners */}
      {[
        [w / 2 + 0.02,  d / 2 + 0.02],
        [-w / 2 - 0.02, d / 2 + 0.02],
        [w / 2 + 0.02,  -d / 2 - 0.02],
        [-w / 2 - 0.02, -d / 2 - 0.02],
      ].map(([x, z], i) => (
        <mesh key={`led-${i}`} position={[x, h * 0.5, z]}>
          <boxGeometry args={[0.018, h * 0.7, 0.018]} />
          <meshLambertMaterial color="#0a1428" emissive={ENERGY_CYAN} emissiveIntensity={1.0} />
        </mesh>
      ))}
      {/* small entry door */}
      <mesh position={[w / 2 + 0.02, h * 0.28, d * 0.3]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.2, h * 0.45]} />
        <meshLambertMaterial color="#2a3340" />
      </mesh>
      {/* base ventilation grills (dark grilles around the base) */}
      <mesh position={[0, 0.08, d / 2 + 0.02]}>
        <planeGeometry args={[w * 0.7, 0.1]} />
        <meshLambertMaterial color="#1c2638" />
      </mesh>
    </group>
  )
}

// -----------------------------------------------------------------------------
// RooftopTransformers — 6 modules on the building roof: 3 boxy switchgear +
// 3 insulator stacks (porcelain disc towers)
// -----------------------------------------------------------------------------
function RooftopTransformers() {
  const roofY = 1.0 + 0.08  // building top + roof slab
  return (
    <group position={[-0.2, roofY, 0]}>
      {/* 3 switchgear boxes (light gray with dark caps) */}
      {[
        [-0.55, 0.3],
        [-0.05, 0.3],
        [ 0.45, 0.3],
      ].map(([x, z], i) => (
        <group key={`sw-${i}`} position={[x, 0, z]}>
          <mesh position={[0, 0.12, 0]} castShadow>
            <boxGeometry args={[0.32, 0.24, 0.32]} />
            <meshLambertMaterial color="#a8b0bc" />
          </mesh>
          {/* dark cap on top */}
          <mesh position={[0, 0.255, 0]} castShadow>
            <boxGeometry args={[0.36, 0.04, 0.36]} />
            <meshLambertMaterial color="#3a4654" />
          </mesh>
          {/* small cyan LED indicator */}
          <mesh position={[0, 0.16, 0.165]}>
            <boxGeometry args={[0.06, 0.03, 0.005]} />
            <meshLambertMaterial color="#0a1428" emissive={ENERGY_CYAN} emissiveIntensity={1.2} />
          </mesh>
        </group>
      ))}
      {/* 3 insulator stacks (cylinder + 3 porcelain discs stacking up) */}
      {[
        [-0.45, -0.3],
        [ 0.05, -0.3],
        [ 0.55, -0.3],
      ].map(([x, z], i) => (
        <group key={`ins-${i}`} position={[x, 0, z]}>
          {/* base box */}
          <mesh position={[0, 0.08, 0]} castShadow>
            <boxGeometry args={[0.2, 0.16, 0.2]} />
            <meshLambertMaterial color="#a8b0bc" />
          </mesh>
          {/* porcelain discs stack — 3 stacked discs of decreasing radius */}
          {[
            { y: 0.22, r: 0.06 },
            { y: 0.34, r: 0.05 },
            { y: 0.46, r: 0.045 },
          ].map((p, j) => (
            <mesh key={`disc-${j}`} position={[0, p.y, 0]}>
              <cylinderGeometry args={[p.r, p.r, 0.08, 12]} />
              <meshLambertMaterial color="#dde2e9" />
            </mesh>
          ))}
          {/* tip cap */}
          <mesh position={[0, 0.55, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.06, 8]} />
            <meshLambertMaterial color="#3a4654" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// -----------------------------------------------------------------------------
// PylonTower — tall steel lattice transmission pylon with cross arms +
// insulator strings hanging from arms
// -----------------------------------------------------------------------------
function PylonTower({ position }: { position: [number, number, number] }) {
  const totalH = 3.2

  // 4 legs of the lattice — corners of a square base tapering inward.
  const legs = useMemo(() => {
    const baseHalf = 0.35
    const topHalf = 0.08
    return [
      { x: -baseHalf, z: -baseHalf, tx: -topHalf, tz: -topHalf },
      { x:  baseHalf, z: -baseHalf, tx:  topHalf, tz: -topHalf },
      { x: -baseHalf, z:  baseHalf, tx: -topHalf, tz:  topHalf },
      { x:  baseHalf, z:  baseHalf, tx:  topHalf, tz:  topHalf },
    ]
  }, [])

  return (
    <group position={position}>
      {/* 4 legs — each is a thin tapered cylinder approximated by a slanted box */}
      {legs.map((leg, i) => {
        const dx = leg.tx - leg.x
        const dz = leg.tz - leg.z
        const len = Math.hypot(dx, totalH, dz)
        const angleX = Math.atan2(dz, totalH)
        const angleZ = -Math.atan2(dx, totalH)
        return (
          <mesh
            key={`leg-${i}`}
            position={[(leg.x + leg.tx) / 2, totalH / 2, (leg.z + leg.tz) / 2]}
            rotation={[angleX, 0, angleZ]}
            castShadow
          >
            <boxGeometry args={[0.04, len, 0.04]} />
            <meshLambertMaterial color="#7a8088" />
          </mesh>
        )
      })}
      {/* horizontal cross braces at 4 levels (lattice look) */}
      {[0.7, 1.4, 2.1, 2.8].map((y, i) => {
        // brace square radius shrinks with height (linear interp between 0.35 and 0.08)
        const t = y / totalH
        const r = 0.35 + (0.08 - 0.35) * t
        return (
          <group key={`level-${i}`} position={[0, y, 0]}>
            {/* 4 horizontal bars */}
            {[
              [0, r, 0, 0],   // N edge — extends along x
              [0, -r, 0, 0],  // S edge
              [r, 0, 0, 1],   // E edge — along z
              [-r, 0, 0, 1],  // W edge
            ].map(([x, z, _, axis], j) => (
              <mesh
                key={`brace-${j}`}
                position={[x, 0, z]}
                rotation={[0, axis === 1 ? Math.PI / 2 : 0, 0]}
              >
                <boxGeometry args={[r * 2, 0.025, 0.025]} />
                <meshLambertMaterial color="#7a8088" />
              </mesh>
            ))}
            {/* diagonals — single X cross on N and S faces (for visual lattice) */}
            {[1, -1].map((side) => (
              <mesh
                key={`diag-${side}`}
                position={[0, 0, side * r]}
                rotation={[0, 0, Math.PI / 4]}
              >
                <boxGeometry args={[r * 2.6, 0.02, 0.02]} />
                <meshLambertMaterial color="#7a8088" />
              </mesh>
            ))}
          </group>
        )
      })}
      {/* TWO cross arms near the top — 2.4m and 2.85m */}
      {[2.4, 2.85].map((y, i) => (
        <group key={`arm-${i}`} position={[0, y, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.9, 0.04, 0.04]} />
            <meshLambertMaterial color="#7a8088" />
          </mesh>
          {/* 2 insulator strings hanging from each arm tip — porcelain bead chain */}
          {[-0.4, 0.4].map((x, k) => (
            <group key={`ins-${k}`} position={[x, -0.18, 0]}>
              {[0, 1, 2].map((j) => (
                <mesh key={j} position={[0, -j * 0.06, 0]}>
                  <sphereGeometry args={[0.025, 8, 8]} />
                  <meshLambertMaterial color="#dde2e9" />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      ))}
      {/* top tip aviation light — small red sphere */}
      <mesh position={[0, totalH + 0.04, 0]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshLambertMaterial color="#3a1414" emissive="#e8504a" emissiveIntensity={1.5} />
      </mesh>
    </group>
  )
}

// -----------------------------------------------------------------------------
// SideGantry — smaller framework structure to the left of the main building
// -----------------------------------------------------------------------------
function SideGantry({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* 2 short pylons */}
      {[-0.35, 0.35].map((x, i) => (
        <mesh key={`gp-${i}`} position={[x, 0.6, 0]} castShadow>
          <boxGeometry args={[0.05, 1.2, 0.05]} />
          <meshLambertMaterial color="#7a8088" />
        </mesh>
      ))}
      {/* horizontal beam connecting them */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[0.75, 0.04, 0.04]} />
        <meshLambertMaterial color="#7a8088" />
      </mesh>
      {/* 2 small insulators dangling from the beam */}
      {[-0.2, 0.2].map((x, i) => (
        <group key={`gi-${i}`} position={[x, 1.0, 0]}>
          {[0, 1].map((j) => (
            <mesh key={j} position={[0, -j * 0.07, 0]}>
              <sphereGeometry args={[0.022, 8, 8]} />
              <meshLambertMaterial color="#dde2e9" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

// -----------------------------------------------------------------------------
// HighVoltageCables — 4 catenary curves from pylon top to building rooftop
// using TubeGeometry along a Catmull-Rom curve for the cable droop.
// -----------------------------------------------------------------------------
function HighVoltageCables() {
  const cables = useMemo(() => {
    // Pylon top is at (1.2, 3.2, 0.9). Building roof is at (-0.2, 1.08, 0)
    // (building's rooftop transformers sit around y=1.1-1.4). Draw 4 cables
    // from the pylon arms to the roof. Use 3-point catmull-rom for a
    // natural sagging curve.
    const arr: THREE.TubeGeometry[] = []
    const ends: [number, number, number][][] = [
      // arm-1 left endpoint → switchgear 1
      [[1.2 - 0.4, 2.4, 0.9], [(1.2 - 0.4 + -0.75) / 2, 1.7, (0.9 + 0.3) / 2], [-0.75, 1.3, 0.3]],
      // arm-1 right endpoint → switchgear 2
      [[1.2 + 0.4, 2.4, 0.9], [(1.2 + 0.4 + -0.25) / 2, 1.7, (0.9 + 0.3) / 2], [-0.25, 1.3, 0.3]],
      // arm-2 left endpoint → switchgear 3
      [[1.2 - 0.4, 2.85, 0.9], [(1.2 - 0.4 + 0.25) / 2, 2.0, (0.9 + 0.3) / 2], [0.25, 1.3, 0.3]],
      // arm-2 right endpoint → side gantry
      [[1.2 + 0.4, 2.85, 0.9], [(1.2 + 0.4 + -1.3) / 2, 2.0, (0.9 + -0.6) / 2], [-1.3, 1.0, -0.6]],
    ]
    for (const pts of ends) {
      const curve = new THREE.CatmullRomCurve3(
        pts.map(([x, y, z]) => new THREE.Vector3(x, y, z))
      )
      arr.push(new THREE.TubeGeometry(curve, 20, 0.015, 6, false))
    }
    return arr
  }, [])
  return (
    <group>
      {cables.map((geom, i) => (
        <mesh key={`cable-${i}`} geometry={geom}>
          <meshLambertMaterial color="#1c2638" />
        </mesh>
      ))}
    </group>
  )
}
