import * as THREE from 'three'
import { ENERGY_CYAN } from '../../scene/palette'
import { getPVPanelTexture, PV_BASE_COLOR } from '../shared/pvAsset'

// =============================================================================
// TwinSolarOffice — 4.5×3.5m hero placement of two adjacent modern office
// buildings, each with extensive rooftop solar arrays + warm-lit windows.
//
// Reference image 4: two adjacent low-rise modern offices, each 3-4
// stories, white concrete + glass curtain walls with warm-orange interior
// lighting visible through windows. Rooftop fully covered by solar panel
// arrays. Lamp posts on the sidewalk + EV chargers at curbside + small
// trees framing entrances.
//
// Geometry budget ~70 meshes:
//   - 1 base tile + 1 sidewalk border
//   - Tower-A: 3-story L-shape with a higher 4th-story core, rooftop PV +
//     warm-glowing window strips per floor
//   - Tower-B: 2-block massing with rooftop PV across both blocks +
//     glass curtain wall
//   - 4 lamp posts at corners
//   - 2 sidewalk EV chargers (small cyan pylons)
//   - 3 small entrance trees
// =============================================================================

interface TwinSolarOfficeProps {
  position?: [number, number, number]
  rotation?: number
}

const TILE_W = 4.6
const TILE_D = 3.6
const SIDEWALK_BAND = 0.25

const CONCRETE = '#dde2e8'         // building base concrete
const GLASS_DARK = '#1c2638'        // dark glass body
const WARM_WINDOW = '#f0a850'       // warm-orange interior light
const ROOF_DARK = '#3a4654'         // roof slab dark cap
// SOLAR_BLUE constant removed — panel colour now comes from
// PV_BASE_COLOR via the shared pvAsset module.

export function TwinSolarOffice({
  position = [0, 0, 0],
  rotation = 0,
}: TwinSolarOfficeProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Tile />
      <TowerA position={[-1.1, 0, -0.3]} />
      <TowerB position={[ 1.1, 0,  0.2]} />
      <LampPosts />
      <CurbsideChargers />
      <EntranceTree position={[-2.1, 0,  1.3]} seed={5} />
      <EntranceTree position={[ 0.0, 0,  1.5]} seed={17} />
      <EntranceTree position={[ 2.1, 0, -1.4]} seed={29} />
    </group>
  )
}

// -----------------------------------------------------------------------------
// Tile
// -----------------------------------------------------------------------------
function Tile() {
  return (
    <group>
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[TILE_W + SIDEWALK_BAND * 2, TILE_D + SIDEWALK_BAND * 2]} />
        <meshLambertMaterial color="#d6dae0" />
      </mesh>
      <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[TILE_W, TILE_D]} />
        <meshLambertMaterial color="#bfc5cc" />
      </mesh>
    </group>
  )
}

// -----------------------------------------------------------------------------
// TowerA — taller L-shape with a 4th-story core block
//
// Footprint: ~1.8 × 2.4m. Mass: 3 stories + a 4th-story tower on the NE
// corner. Solar arrays cover the L's rooftop AND the 4th-story top.
// -----------------------------------------------------------------------------
function TowerA({ position }: { position: [number, number, number] }) {
  const baseW = 1.6
  const baseD = 2.4
  const baseH = 1.6        // 3 stories
  const coreW = 0.7
  const coreD = 0.9
  const coreH = 0.7        // 1 additional story above NE corner

  return (
    <group position={position}>
      {/* base massing — 3-story concrete box */}
      <mesh position={[0, baseH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[baseW, baseH, baseD]} />
        <meshLambertMaterial color={CONCRETE} />
      </mesh>
      {/* dark roof slab on the base */}
      <mesh position={[0, baseH + 0.04, 0]} castShadow>
        <boxGeometry args={[baseW + 0.06, 0.07, baseD + 0.06]} />
        <meshLambertMaterial color={ROOF_DARK} />
      </mesh>

      {/* core block — taller, sits on the NE corner of the base */}
      <mesh
        position={[(baseW - coreW) / 2, baseH + coreH / 2 + 0.07, -(baseD - coreD) / 2]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[coreW, coreH, coreD]} />
        <meshLambertMaterial color={CONCRETE} />
      </mesh>
      <mesh
        position={[(baseW - coreW) / 2, baseH + coreH + 0.1, -(baseD - coreD) / 2]}
      >
        <boxGeometry args={[coreW + 0.04, 0.06, coreD + 0.04]} />
        <meshLambertMaterial color={ROOF_DARK} />
      </mesh>

      {/* per-floor warm-glowing window bands on the SOUTH face (3 bands) */}
      {[0.25, 0.75, 1.25].map((y, i) => (
        <mesh key={`a-s-${i}`} position={[0, y, baseD / 2 + 0.02]}>
          <planeGeometry args={[baseW * 0.85, 0.22]} />
          <meshLambertMaterial color={GLASS_DARK} emissive={WARM_WINDOW} emissiveIntensity={0.6} />
        </mesh>
      ))}
      {/* east face windows */}
      {[0.25, 0.75, 1.25].map((y, i) => (
        <mesh key={`a-e-${i}`} position={[baseW / 2 + 0.02, y, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[baseD * 0.85, 0.22]} />
          <meshLambertMaterial color={GLASS_DARK} emissive={WARM_WINDOW} emissiveIntensity={0.6} />
        </mesh>
      ))}
      {/* core block window — full glass wall on south + east */}
      <mesh
        position={[(baseW - coreW) / 2, baseH + coreH / 2 + 0.07, -(baseD - coreD) / 2 + coreD / 2 + 0.02]}
      >
        <planeGeometry args={[coreW * 0.85, coreH * 0.7]} />
        <meshLambertMaterial color={GLASS_DARK} emissive={WARM_WINDOW} emissiveIntensity={0.5} />
      </mesh>
      <mesh
        position={[(baseW - coreW) / 2 + coreW / 2 + 0.02, baseH + coreH / 2 + 0.07, -(baseD - coreD) / 2]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <planeGeometry args={[coreD * 0.85, coreH * 0.7]} />
        <meshLambertMaterial color={GLASS_DARK} emissive={WARM_WINDOW} emissiveIntensity={0.5} />
      </mesh>

      {/* rooftop SOLAR ARRAY on base roof (the L-shape not covered by core) */}
      <SolarArray
        position={[-(coreW / 2), baseH + 0.09, 0]}
        w={baseW - coreW - 0.1}
        d={baseD - 0.15}
      />
      {/* rooftop SOLAR ARRAY on core top */}
      <SolarArray
        position={[(baseW - coreW) / 2, baseH + coreH + 0.13, -(baseD - coreD) / 2]}
        w={coreW - 0.1}
        d={coreD - 0.1}
      />

      {/* cyan accent strip along base south facade (signature LED) */}
      <mesh position={[0, baseH + 0.02, baseD / 2 + 0.02]}>
        <boxGeometry args={[baseW + 0.05, 0.015, 0.008]} />
        <meshLambertMaterial color="#0a1428" emissive={ENERGY_CYAN} emissiveIntensity={1.1} />
      </mesh>
    </group>
  )
}

// -----------------------------------------------------------------------------
// TowerB — 2-block lower massing (wider, 2 stories) with continuous rooftop PV
// -----------------------------------------------------------------------------
function TowerB({ position }: { position: [number, number, number] }) {
  const w = 2.0
  const d = 2.8
  const h = 1.4   // 2-3 stories

  return (
    <group position={position}>
      {/* main body */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshLambertMaterial color={CONCRETE} />
      </mesh>
      {/* darker right-side block — taller by 0.2m */}
      <mesh position={[w * 0.3, (h + 0.2) / 2, -d * 0.15]} castShadow receiveShadow>
        <boxGeometry args={[w * 0.45, h + 0.2, d * 0.55]} />
        <meshLambertMaterial color={GLASS_DARK} />
      </mesh>
      {/* dark roof slab on main */}
      <mesh position={[0, h + 0.04, 0]}>
        <boxGeometry args={[w + 0.06, 0.07, d + 0.06]} />
        <meshLambertMaterial color={ROOF_DARK} />
      </mesh>
      {/* dark roof slab on taller block */}
      <mesh position={[w * 0.3, h + 0.2 + 0.04, -d * 0.15]}>
        <boxGeometry args={[w * 0.45 + 0.04, 0.06, d * 0.55 + 0.04]} />
        <meshLambertMaterial color={ROOF_DARK} />
      </mesh>

      {/* per-floor warm window bands — south face (2 bands) */}
      {[0.35, 0.95].map((y, i) => (
        <mesh key={`b-s-${i}`} position={[0, y, d / 2 + 0.02]}>
          <planeGeometry args={[w * 0.85, 0.25]} />
          <meshLambertMaterial color={GLASS_DARK} emissive={WARM_WINDOW} emissiveIntensity={0.6} />
        </mesh>
      ))}
      {/* east face */}
      {[0.35, 0.95].map((y, i) => (
        <mesh key={`b-e-${i}`} position={[w / 2 + 0.02, y, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[d * 0.85, 0.25]} />
          <meshLambertMaterial color={GLASS_DARK} emissive={WARM_WINDOW} emissiveIntensity={0.6} />
        </mesh>
      ))}
      {/* west face */}
      {[0.35, 0.95].map((y, i) => (
        <mesh key={`b-w-${i}`} position={[-w / 2 - 0.02, y, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[d * 0.85, 0.25]} />
          <meshLambertMaterial color={GLASS_DARK} emissive={WARM_WINDOW} emissiveIntensity={0.6} />
        </mesh>
      ))}

      {/* rooftop SOLAR ARRAY — covers most of the main roof */}
      <SolarArray
        position={[-w * 0.15, h + 0.09, d * 0.1]}
        w={w * 0.55}
        d={d * 0.65}
      />
      {/* second smaller solar array on the taller block top */}
      <SolarArray
        position={[w * 0.3, h + 0.2 + 0.08, -d * 0.15]}
        w={w * 0.35}
        d={d * 0.42}
      />

      {/* cyan LED corner accent on the south face */}
      <mesh position={[0, h + 0.025, d / 2 + 0.02]}>
        <boxGeometry args={[w + 0.05, 0.015, 0.008]} />
        <meshLambertMaterial color="#0a1428" emissive={ENERGY_CYAN} emissiveIntensity={1.0} />
      </mesh>
    </group>
  )
}

// -----------------------------------------------------------------------------
// SolarArray — rooftop solar panel grid, oriented flat with a dark blue
// canvas-texture grid. Used by both towers.
// -----------------------------------------------------------------------------
function SolarArray({
  position,
  w,
  d,
}: {
  position: [number, number, number]
  w: number
  d: number
}) {
  // Approximate panel grid count from size
  const cols = Math.max(2, Math.round(w / 0.35))
  const rows = Math.max(2, Math.round(d / 0.35))
  const cellW = w / cols
  const cellD = d / rows
  return (
    <group position={position}>
      {/* flat dark slab as backing */}
      <mesh position={[0, 0.005, 0]} castShadow>
        <boxGeometry args={[w + 0.04, 0.01, d + 0.04]} />
        <meshLambertMaterial color={ROOF_DARK} />
      </mesh>
      {/* individual solar panels — tilted slightly toward camera (positive Z) */}
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => {
          const x = (c - cols / 2 + 0.5) * cellW
          const z = (r - rows / 2 + 0.5) * cellD
          return (
            <mesh
              key={`pv-${r}-${c}`}
              position={[x, 0.03, z]}
              rotation={[-Math.PI / 12, 0, 0]}  // 15° tilt
              castShadow
            >
              <boxGeometry args={[cellW * 0.85, 0.01, cellD * 0.85]} />
              {/* Shared PV style — texture + lighter base navy so the
                  rooftop array reads as detailed panels, not a black slab. */}
              <meshLambertMaterial color={PV_BASE_COLOR} map={getPVPanelTexture()} />
            </mesh>
          )
        })
      )}
    </group>
  )
}

// -----------------------------------------------------------------------------
// LampPosts — 4 streetlamps at the tile's outer corners (sidewalk pieces)
// -----------------------------------------------------------------------------
function LampPosts() {
  const corners: [number, number][] = [
    [-TILE_W / 2 - SIDEWALK_BAND * 0.4,  TILE_D / 2 + SIDEWALK_BAND * 0.4],
    [ TILE_W / 2 + SIDEWALK_BAND * 0.4,  TILE_D / 2 + SIDEWALK_BAND * 0.4],
    [-TILE_W / 2 - SIDEWALK_BAND * 0.4, -TILE_D / 2 - SIDEWALK_BAND * 0.4],
    [ TILE_W / 2 + SIDEWALK_BAND * 0.4, -TILE_D / 2 - SIDEWALK_BAND * 0.4],
  ]
  return (
    <group>
      {corners.map(([x, z], i) => (
        <group key={`lamp-${i}`} position={[x, 0, z]}>
          {/* post */}
          <mesh position={[0, 0.45, 0]} castShadow>
            <cylinderGeometry args={[0.018, 0.025, 0.9, 6]} />
            <meshLambertMaterial color="#3a4654" />
          </mesh>
          {/* lamp head — small box with cyan emissive bottom */}
          <mesh position={[0, 0.9, 0]} castShadow>
            <boxGeometry args={[0.1, 0.05, 0.1]} />
            <meshLambertMaterial color="#1c2638" />
          </mesh>
          <mesh position={[0, 0.875, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.09, 0.09]} />
            <meshLambertMaterial color="#0a1428" emissive={ENERGY_CYAN} emissiveIntensity={1.2} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// -----------------------------------------------------------------------------
// CurbsideChargers — 2 small EV chargers at the south sidewalk (matches
// reference image's curbside chargers between the two buildings)
// -----------------------------------------------------------------------------
function CurbsideChargers() {
  const positions: [number, number][] = [
    [-0.3, TILE_D / 2 + SIDEWALK_BAND * 0.5],
    [ 1.5, TILE_D / 2 + SIDEWALK_BAND * 0.5],
  ]
  return (
    <group>
      {positions.map(([x, z], i) => (
        <group key={`cc-${i}`} position={[x, 0, z]}>
          <mesh position={[0, 0.18, 0]} castShadow>
            <boxGeometry args={[0.08, 0.36, 0.06]} />
            <meshLambertMaterial color="#c8d0db" />
          </mesh>
          <mesh position={[0, 0.27, 0.032]}>
            <planeGeometry args={[0.06, 0.1]} />
            <meshLambertMaterial color="#0a1428" emissive={ENERGY_CYAN} emissiveIntensity={1.3} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// -----------------------------------------------------------------------------
// EntranceTree — small deciduous tree
// -----------------------------------------------------------------------------
function EntranceTree({
  position,
  seed = 0,
}: {
  position: [number, number, number]
  seed?: number
}) {
  const scale = 0.7 + ((seed * 1031) % 100) / 333
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.045, 0.32, 6]} />
        <meshLambertMaterial color="#5a3a22" />
      </mesh>
      <mesh position={[0, 0.45, 0]} castShadow>
        <sphereGeometry args={[0.25, 12, 10]} />
        <meshLambertMaterial color="#4a8a4e" flatShading />
      </mesh>
    </group>
  )
}
