import * as THREE from 'three'
import { ENERGY_CYAN } from '../../scene/palette'
import { getPVPanelTexture, PV_BASE_COLOR } from '../shared/pvAsset'

// =============================================================================
// GreenEcoOffice — 3×2.5m tile hosting a 3-story gray concrete office with
// a green living wall, rooftop solar + rooftop garden, side entry tree,
// bench, and a sidewalk EV charger.
//
// Reference image 1: 3-story concrete office, full-height living-wall vines
// covering the south facade with large windows visible through the foliage,
// rooftop solar panel + rooftop garden with small trees, side entry with
// stairs + cyan LED accent, EV charger pylon at the curb, single deciduous
// tree + park bench at the west sidewalk, light gray concrete base tile.
//
// Geometry budget ~60 meshes:
//   - 1 base tile + 1 sidewalk border
//   - 1 main concrete body (3-story) with rooftop step-back
//   - 1 living-wall foliage assembly on south face (instanced sphere clumps)
//   - 1 rooftop solar panel + 1 rooftop garden patch with 3 small trees
//   - 1 entry stairs + door
//   - 1 west entrance tree + bench
//   - 1 curbside EV charger pylon
//   - cyan LED accent strips along the building base + entry threshold
// =============================================================================

interface GreenEcoOfficeProps {
  position?: [number, number, number]
  rotation?: number
}

const TILE_W = 3.0
const TILE_D = 2.5
const SIDEWALK_BAND = 0.2

const CONCRETE = '#bcc0c5'
const CONCRETE_DARK = '#8a9098'
const FOLIAGE_DARK = '#2d6a3c'
const FOLIAGE_MID = '#3d8252'
const FOLIAGE_LIGHT = '#4a9c5e'
const GLASS_DARK = '#1a2638'
const WARM_WINDOW = '#e8b870'

export function GreenEcoOffice({
  position = [0, 0, 0],
  rotation = 0,
}: GreenEcoOfficeProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Tile />
      <MainBuilding />
      <LivingWall />
      <RooftopAssembly />
      <EntryStairs />
      <SidewalkAccents />
    </group>
  )
}

// -----------------------------------------------------------------------------
// Tile — light concrete base + sidewalk border
// -----------------------------------------------------------------------------
function Tile() {
  return (
    <group>
      {/* Layers spaced >=1cm so the depth buffer can separate them at
          zoom-out (was 0.003/0.006/0.008 = 2-3mm gaps -> z-fight). */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[TILE_W + SIDEWALK_BAND * 2, TILE_D + SIDEWALK_BAND * 2]} />
        <meshLambertMaterial color="#d6dae0" />
      </mesh>
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[TILE_W, TILE_D]} />
        <meshLambertMaterial color="#bfc5cc" />
      </mesh>
      <mesh position={[-TILE_W / 2 + 0.4, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.7, TILE_D - 0.4]} />
        <meshLambertMaterial color="#6fb260" />
      </mesh>
    </group>
  )
}

// -----------------------------------------------------------------------------
// MainBuilding — 3-story concrete box with step-back on top
// -----------------------------------------------------------------------------
function MainBuilding() {
  const w = 1.8
  const d = 1.6
  const h = 1.8       // 3 stories
  const stepW = 0.7   // 4th-story step-back block
  const stepD = 0.7
  const stepH = 0.5

  return (
    <group position={[0.25, 0, 0]}>
      {/* main 3-story body */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshLambertMaterial color={CONCRETE} />
      </mesh>
      {/* darker base course (0-0.18m) for visual ground anchor */}
      <mesh position={[0, 0.09, 0]} castShadow>
        <boxGeometry args={[w + 0.04, 0.18, d + 0.04]} />
        <meshLambertMaterial color={CONCRETE_DARK} />
      </mesh>
      {/* dark roof slab on main body */}
      <mesh position={[0, h + 0.04, 0]} castShadow>
        <boxGeometry args={[w + 0.06, 0.07, d + 0.06]} />
        <meshLambertMaterial color="#3a4654" />
      </mesh>
      {/* step-back 4th-story block on the back-right (NE) */}
      <mesh
        position={[(w - stepW) / 2, h + stepH / 2 + 0.07, -(d - stepD) / 2]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[stepW, stepH, stepD]} />
        <meshLambertMaterial color={CONCRETE} />
      </mesh>
      <mesh
        position={[(w - stepW) / 2, h + stepH + 0.1, -(d - stepD) / 2]}
      >
        <boxGeometry args={[stepW + 0.04, 0.05, stepD + 0.04]} />
        <meshLambertMaterial color="#3a4654" />
      </mesh>

      {/* large windows on EAST face (no vines here — clean glass) */}
      <mesh position={[w / 2 + 0.02, h * 0.55, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[d * 0.85, h * 0.7]} />
        <meshLambertMaterial color={GLASS_DARK} emissive={WARM_WINDOW} emissiveIntensity={0.4} />
      </mesh>
      {/* horizontal mullion dividing the glass into floors */}
      {[0.5, 1.05, 1.5].map((y, i) => (
        <mesh key={`mul-${i}`} position={[w / 2 + 0.02, y, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[d * 0.86, 0.04]} />
          <meshLambertMaterial color="#5a6878" />
        </mesh>
      ))}
      {/* step-back south face — small window */}
      <mesh
        position={[(w - stepW) / 2, h + stepH / 2 + 0.07, -(d - stepD) / 2 + stepD / 2 + 0.02]}
      >
        <planeGeometry args={[stepW * 0.7, stepH * 0.5]} />
        <meshLambertMaterial color={GLASS_DARK} emissive={WARM_WINDOW} emissiveIntensity={0.45} />
      </mesh>
    </group>
  )
}

// -----------------------------------------------------------------------------
// LivingWall — vines covering the south facade, with windows peeking through
// -----------------------------------------------------------------------------
function LivingWall() {
  const w = 1.8
  const d = 1.6
  const h = 1.8

  // 6 vertical wood trellis posts running floor-to-ceiling on the south face.
  const trellisCount = 5
  const trellisXs: number[] = []
  for (let i = 0; i < trellisCount; i++) {
    trellisXs.push((i - (trellisCount - 1) / 2) * (w / trellisCount))
  }

  // Foliage clumps — distributed in a 4-row × 5-column grid, with per-cell
  // jitter so it reads as organic vine growth.
  const clumps: { x: number; y: number; r: number; color: string }[] = []
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 6; col++) {
      const x = (col - 2.5) * 0.32 + (Math.sin(row * 3 + col * 7) * 0.05)
      const y = 0.25 + row * 0.4 + (Math.cos(col * 5 + row * 11) * 0.06)
      const r = 0.16 + ((col + row) % 3) * 0.04
      const colorRoll = (col + row * 3) % 3
      const color = colorRoll === 0 ? FOLIAGE_DARK : colorRoll === 1 ? FOLIAGE_MID : FOLIAGE_LIGHT
      clumps.push({ x, y, r, color })
    }
  }

  return (
    <group position={[0.25, 0, d / 2 + 0.015]}>
      {/* 2 large glass windows visible through the vines — middle of south
          face, behind the foliage. Wider than the trellis spacing so vines
          partially cover but glass shows through. */}
      <mesh position={[0, h * 0.45, 0]}>
        <planeGeometry args={[w * 0.85, h * 0.7]} />
        <meshLambertMaterial color={GLASS_DARK} emissive={WARM_WINDOW} emissiveIntensity={0.55} />
      </mesh>
      {/* horizontal floor mullions */}
      {[0.5, 1.05, 1.5].map((y, i) => (
        <mesh key={`m-${i}`} position={[0, y, 0.002]}>
          <planeGeometry args={[w * 0.86, 0.04]} />
          <meshLambertMaterial color="#5a6878" />
        </mesh>
      ))}
      {/* trellis posts (wood-colored verticals) */}
      {trellisXs.map((x, i) => (
        <mesh key={`tr-${i}`} position={[x, h * 0.5, 0.005]} castShadow>
          <boxGeometry args={[0.035, h - 0.1, 0.025]} />
          <meshLambertMaterial color="#5a3a22" />
        </mesh>
      ))}
      {/* foliage clumps — instanced spheres, slightly offset from the wall */}
      {clumps.map((c, i) => (
        <mesh key={`f-${i}`} position={[c.x, c.y, 0.04 + (i % 3) * 0.015]} castShadow>
          <sphereGeometry args={[c.r, 8, 8]} />
          <meshLambertMaterial color={c.color} flatShading />
        </mesh>
      ))}
      {/* a few hanging vines on the very top edge */}
      {[-0.6, -0.2, 0.3, 0.7].map((x, i) => (
        <mesh key={`v-${i}`} position={[x, h - 0.04, 0.04]} castShadow>
          <boxGeometry args={[0.04, 0.18, 0.04]} />
          <meshLambertMaterial color={FOLIAGE_MID} flatShading />
        </mesh>
      ))}
    </group>
  )
}

// -----------------------------------------------------------------------------
// RooftopAssembly — solar panel + small garden + 3 mini trees on the main
// roof, sitting beside the step-back tower
// -----------------------------------------------------------------------------
function RooftopAssembly() {
  // Main roof Y is at building h=1.8 + roof slab 0.07 = 1.87.
  const roofY = 1.87
  // Garden + PV occupy the part of the roof NOT covered by the step-back
  // block (the step-back is on the NE corner ~0.7×0.7, so we use the SW
  // ~1.1×1.4 area for the assembly).
  return (
    <group position={[0.25, roofY, 0]}>
      {/* solar panel patch on the south side of the roof */}
      <group position={[-0.45, 0, 0.4]}>
        <mesh position={[0, 0.01, 0]}>
          <boxGeometry args={[0.7, 0.02, 0.5]} />
          <meshLambertMaterial color="#3a4654" />
        </mesh>
        {/* 3×2 panel grid, tilted south */}
        {Array.from({ length: 2 }).map((_, r) =>
          Array.from({ length: 3 }).map((_, c) => {
            const x = (c - 1) * 0.22
            const z = (r - 0.5) * 0.22
            return (
              <mesh
                key={`pv-${r}-${c}`}
                position={[x, 0.04, z]}
                rotation={[-Math.PI / 12, 0, 0]}
                castShadow
              >
                <boxGeometry args={[0.2, 0.01, 0.2]} />
                <meshLambertMaterial color={PV_BASE_COLOR} map={getPVPanelTexture()} />
              </mesh>
            )
          })
        )}
      </group>

      {/* Rooftop garden (grass patch + 3 mini conifers) removed in the
          rooftop-greening cleanup. The building's vertical living wall on
          the south facade still carries the "green eco" identity. */}

      {/* small rooftop unit (HVAC) on the step-back tower */}
      <mesh position={[0.55, 0.06, -0.45]} castShadow>
        <boxGeometry args={[0.18, 0.12, 0.14]} />
        <meshLambertMaterial color="#5a6878" />
      </mesh>
    </group>
  )
}

// -----------------------------------------------------------------------------
// EntryStairs — small stairs + door on the south face (west side of the bldg)
// -----------------------------------------------------------------------------
function EntryStairs() {
  return (
    <group position={[-0.4, 0, 0.95]}>
      {/* 3 stair steps */}
      {[0, 1, 2].map((i) => (
        <mesh key={`step-${i}`} position={[0, 0.04 + i * 0.04, -i * 0.08]} castShadow>
          <boxGeometry args={[0.36, 0.08, 0.16 - i * 0.04]} />
          <meshLambertMaterial color={CONCRETE_DARK} />
        </mesh>
      ))}
      {/* door above the top step (just into the south facade) */}
      <mesh position={[0, 0.36, -0.2]}>
        <planeGeometry args={[0.28, 0.4]} />
        <meshLambertMaterial color="#1a2638" emissive={ENERGY_CYAN} emissiveIntensity={0.4} />
      </mesh>
      {/* small cyan LED accent under the entry threshold */}
      <mesh position={[0, 0.02, 0.04]}>
        <boxGeometry args={[0.32, 0.01, 0.1]} />
        <meshLambertMaterial color="#0a1428" emissive={ENERGY_CYAN} emissiveIntensity={1.2} />
      </mesh>
    </group>
  )
}

// -----------------------------------------------------------------------------
// SidewalkAccents — west entrance tree + park bench + curbside EV charger
// -----------------------------------------------------------------------------
function SidewalkAccents() {
  return (
    <group>
      {/* west entrance tree */}
      <group position={[-1.15, 0, -0.3]}>
        <mesh position={[0, 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.065, 0.6, 7]} />
          <meshLambertMaterial color="#5a3a22" />
        </mesh>
        <mesh position={[0, 0.75, 0]} castShadow>
          <sphereGeometry args={[0.35, 12, 10]} />
          <meshLambertMaterial color={FOLIAGE_MID} flatShading />
        </mesh>
        <mesh position={[0.08, 0.7, 0.08]}>
          <sphereGeometry args={[0.22, 10, 8]} />
          <meshLambertMaterial color={FOLIAGE_DARK} flatShading />
        </mesh>
      </group>

      {/* bench */}
      <group position={[-1.1, 0, 0.5]}>
        <mesh position={[0, 0.08, 0]} castShadow>
          <boxGeometry args={[0.45, 0.04, 0.14]} />
          <meshLambertMaterial color="#5a3a22" />
        </mesh>
        {/* legs */}
        <mesh position={[-0.18, 0.04, 0]}>
          <boxGeometry args={[0.04, 0.08, 0.12]} />
          <meshLambertMaterial color="#3a4654" />
        </mesh>
        <mesh position={[0.18, 0.04, 0]}>
          <boxGeometry args={[0.04, 0.08, 0.12]} />
          <meshLambertMaterial color="#3a4654" />
        </mesh>
        {/* backrest */}
        <mesh position={[0, 0.16, -0.05]}>
          <boxGeometry args={[0.45, 0.12, 0.025]} />
          <meshLambertMaterial color="#5a3a22" />
        </mesh>
        {/* small cyan LED under the bench — above the tile grass strip (0.025) */}
        <mesh position={[0, 0.032, 0]}>
          <boxGeometry args={[0.4, 0.005, 0.12]} />
          <meshLambertMaterial color="#0a1428" emissive={ENERGY_CYAN} emissiveIntensity={0.8} />
        </mesh>
      </group>

      {/* curbside EV charger on the east side */}
      <group position={[1.35, 0, -0.7]}>
        <mesh position={[0, 0.22, 0]} castShadow>
          <boxGeometry args={[0.12, 0.44, 0.1]} />
          <meshLambertMaterial color="#c8d0db" />
        </mesh>
        {/* dark head */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.14, 0.16, 0.12]} />
          <meshLambertMaterial color="#1c2638" />
        </mesh>
        {/* cyan LED screen */}
        <mesh position={[0, 0.32, 0.055]}>
          <planeGeometry args={[0.08, 0.12]} />
          <meshLambertMaterial color="#0a1428" emissive={ENERGY_CYAN} emissiveIntensity={1.3} />
        </mesh>
      </group>

      {/* small cyan ground LEDs scattered on the sidewalk */}
      {[
        [-1.0, -1.0],
        [-1.1, 1.0],
        [1.2, 0.8],
      ].map(([x, z], i) => (
        <mesh key={`led-${i}`} position={[x, 0.012, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.03, 8]} />
          <meshLambertMaterial color="#0a1428" emissive={ENERGY_CYAN} emissiveIntensity={1.3} />
        </mesh>
      ))}
    </group>
  )
}
