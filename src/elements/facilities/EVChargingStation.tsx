import { useMemo } from 'react'
import { ENERGY_CYAN, CLEAN_GREEN } from '../../scene/palette'
import { getPVPanelTexture, PV_BASE_COLOR } from '../shared/pvAsset'
import { ParkedEV } from '../vehicles/ParkedEV'

// =============================================================================
// EVChargingStation — full station tile (4×2.5m) replacing the previous
// minimal EVChargingHub at ev-N.
//
// Reference image 2: large dark-blue solar canopy roof covering a parking
// row, cyan LED strip along canopy edge, 4-5 cars parked diagonally with
// green floor markings, 6 charging pylons (cyan/green LED screens), 2
// trees framing the entrance.
//
// Geometry budget ~50 meshes:
//   - 4 parking-stall markings
//   - 1 angled solar canopy (panel-textured) + canopy frame + 4 pillars
//   - 1 cyan LED edge strip along canopy front
//   - 6 charging pylons (3-mesh each: post, head, LED screen)
//   - 4 cars (RoundedBox bodies + dark windscreens + wheels)
//   - 2 perimeter trees
//   - 1 small admin module at the right end
// =============================================================================

interface EVChargingStationProps {
  position?: [number, number, number]
  rotation?: number
}

const TILE_W = 4.4   // east-west extent

export function EVChargingStation({
  position = [0, 0, 0],
  rotation = 0,
}: EVChargingStationProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Tile />
      <Canopy />
      <ChargingPylons />
      <ParkedCars />
      <AdminModule position={[1.8, 0, 0]} />
      <EntranceTree position={[-2.0, 0, 1.0]} seed={3} />
      <EntranceTree position={[-2.0, 0, -1.0]} seed={11} />
    </group>
  )
}

// -----------------------------------------------------------------------------
// Tile — 4 green-line parking stalls. The colored ground tile was removed so
// North V2G blends back into the shared city surface instead of sitting on a
// separate gray slab.
// -----------------------------------------------------------------------------
function Tile() {
  return (
    <group>
      {[-1.15, -0.4, 0.35, 1.1].map((x, i) => (
        <mesh
          key={`stall-${i}`}
          position={[x, 0.018, -0.7]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.06, 0.9]} />
          <meshLambertMaterial color={CLEAN_GREEN} emissive={CLEAN_GREEN} emissiveIntensity={0.45} />
        </mesh>
      ))}
    </group>
  )
}

// -----------------------------------------------------------------------------
// Canopy — angled dark-blue solar panel roof + cyan LED edge strip
// -----------------------------------------------------------------------------
function Canopy() {
  // Canopy panel: long horizontal slab tilted slightly toward the sun side.
  // Sits on top of 4 corner pillars. The "front" (south) edge is the lower
  // edge with the cyan LED strip; the "back" (north) edge is higher.
  const panelW = TILE_W - 0.3
  const panelD = 2.0
  const tilt = 0.15  // radians — gentle pitch
  // Lowered from 1.6 → 0.88 (front edge) so the canopy no longer dwarfs the
  // adjacent low-rise residential infill. The pitched back edge sits at
  // ~1.18m which is still taller than the parked cars at ~0.28m.
  const lowFrontY = 0.88
  const backHigherY = lowFrontY + Math.sin(tilt) * panelD

  // Solar panel texture sourced from shared PV asset (see
  // src/elements/shared/pvAsset.ts) so the canopy matches every other PV
  // surface in the city (SolarFarm, rooftop PV, smart-lamp panels).
  const panelTexture = useMemo(() => getPVPanelTexture(), [])

  return (
    <group>
      {/* 4 support pillars */}
      {[
        [-panelW / 2 + 0.15,  panelD / 2 - 0.1],
        [ panelW / 2 - 0.15,  panelD / 2 - 0.1],
        [-panelW / 2 + 0.15, -panelD / 2 + 0.1],
        [ panelW / 2 - 0.15, -panelD / 2 + 0.1],
      ].map(([x, z], i) => {
        const h = z > 0 ? backHigherY : lowFrontY
        return (
          <mesh key={`pillar-${i}`} position={[x, h / 2, z]} castShadow={false}>
            <boxGeometry args={[0.1, h, 0.1]} />
            <meshLambertMaterial color="#3a4654" />
          </mesh>
        )
      })}

      {/* canopy frame — dark band around the panel edges */}
      <group
        position={[0, (lowFrontY + backHigherY) / 2 + 0.08, 0]}
        rotation={[-tilt, 0, 0]}
      >
        {/* frame back panel (north/upper edge, hosts the LED strip) */}
        <mesh position={[0, 0.04, panelD / 2 + 0.04]} castShadow={false}>
          <boxGeometry args={[panelW + 0.08, 0.16, 0.06]} />
          <meshLambertMaterial color="#1a2438" />
        </mesh>
        {/* frame front panel (south/lower edge) */}
        <mesh position={[0, 0.04, -panelD / 2 - 0.04]} castShadow={false}>
          <boxGeometry args={[panelW + 0.08, 0.16, 0.06]} />
          <meshLambertMaterial color="#1a2438" />
        </mesh>
        {/* CYAN LED strip — runs along the FRONT edge (south, lower side),
            facing the cars. Matches the reference image's prominent edge
            glow. Strong emissive so it reads under daylight. */}
        <mesh position={[0, 0.0, -panelD / 2 - 0.05]}>
          <boxGeometry args={[panelW + 0.06, 0.04, 0.012]} />
          <meshLambertMaterial
            color="#102438"
            emissive={ENERGY_CYAN}
            emissiveIntensity={1.4}
          />
        </mesh>
        {/* also a thinner glow on the back edge */}
        <mesh position={[0, 0.0, panelD / 2 + 0.05]}>
          <boxGeometry args={[panelW + 0.06, 0.04, 0.012]} />
          <meshLambertMaterial
            color="#102438"
            emissive={ENERGY_CYAN}
            emissiveIntensity={0.7}
          />
        </mesh>
        {/* the actual solar panel surface — flat slab with shared PV grid */}
        <mesh position={[0, 0.0, 0]} castShadow={false}>
          <boxGeometry args={[panelW, 0.06, panelD]} />
          <meshLambertMaterial
            color={PV_BASE_COLOR}
            map={panelTexture}


          />
        </mesh>
      </group>
    </group>
  )
}

// -----------------------------------------------------------------------------
// ChargingPylons — 6 small vertical pylons with cyan/green LED screens
// -----------------------------------------------------------------------------
function ChargingPylons() {
  const positions: [number, number, [string, number]][] = [
    // x, z, [color, emissive intensity] — alternate cyan/green for variety
    [-1.5, 0.5, [ENERGY_CYAN, 1.2]],
    [-1.0, 0.5, [CLEAN_GREEN, 1.0]],
    [-0.5, 0.5, [ENERGY_CYAN, 1.2]],
    [ 0.0, 0.5, [CLEAN_GREEN, 1.0]],
    [ 0.5, 0.5, [ENERGY_CYAN, 1.2]],
    [ 1.0, 0.5, [CLEAN_GREEN, 1.0]],
  ]
  return (
    <group>
      {positions.map(([x, z, [color, emissive]], i) => (
        <group key={`pylon-${i}`} position={[x, 0, z]}>
          {/* post */}
          <mesh position={[0, 0.3, 0]} castShadow={false}>
            <boxGeometry args={[0.12, 0.6, 0.08]} />
            <meshLambertMaterial color="#c8d0db" />
          </mesh>
          {/* dark head */}
          <mesh position={[0, 0.65, 0]} castShadow={false}>
            <boxGeometry args={[0.14, 0.18, 0.1]} />
            <meshLambertMaterial color="#1c2638" />
          </mesh>
          {/* LED screen on south face */}
          <mesh position={[0, 0.45, 0.05]}>
            <planeGeometry args={[0.09, 0.14]} />
            <meshLambertMaterial color="#0a1428" emissive={color} emissiveIntensity={emissive} />
          </mesh>
          {/* small base shadow — above the 0.025 stall-line layer */}
          <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.12, 12]} />
            <meshBasicMaterial color="#1a2230" transparent opacity={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// -----------------------------------------------------------------------------
// ParkedCars — 4 simple low-poly cars on the parking stalls
// -----------------------------------------------------------------------------
function ParkedCars() {
  // 4 cars matching the 4 stall lines (-1.15, -0.4, 0.35, 1.1).
  const cars: { x: number; color: string }[] = [
    { x: -1.15, color: '#dde4ec' },  // white
    { x: -0.4,  color: '#1a2030' },  // dark
    { x:  0.35, color: '#dde4ec' },  // white
    { x:  1.1,  color: '#dde4ec' },  // white
  ]
  return (
    <group>
      {cars.map((c, i) => (
        <ParkedEV key={`car-${i}`} position={[c.x, 0, -0.85]} bodyColor={c.color} length={0.88} width={0.45} />
      ))}
    </group>
  )
}

// -----------------------------------------------------------------------------
// AdminModule — small ops office at the east end of the station
// -----------------------------------------------------------------------------
function AdminModule({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.35, 0]} castShadow={false}>
        <boxGeometry args={[0.4, 0.7, 0.6]} />
        <meshLambertMaterial color="#c8d0db" />
      </mesh>
      {/* cyan glass front facing west (toward the parking) */}
      <mesh position={[-0.2, 0.4, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[0.45, 0.5]} />
        <meshLambertMaterial color="#1a3a5a" emissive={ENERGY_CYAN} emissiveIntensity={0.7} />
      </mesh>
      {/* dark roof slab */}
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[0.44, 0.04, 0.64]} />
        <meshLambertMaterial color="#3a4654" />
      </mesh>
    </group>
  )
}

// -----------------------------------------------------------------------------
// EntranceTree — small deciduous tree (rounded foliage) framing the entrance
// -----------------------------------------------------------------------------
function EntranceTree({
  position,
  seed = 0,
}: {
  position: [number, number, number]
  seed?: number
}) {
  const scale = 0.85 + ((seed * 1031) % 100) / 333
  return (
    <group position={position} scale={scale}>
      {/* trunk */}
      <mesh position={[0, 0.18, 0]} castShadow={false}>
        <cylinderGeometry args={[0.04, 0.05, 0.36, 6]} />
        <meshLambertMaterial color="#5a3a22" />
      </mesh>
      {/* foliage — single rounded sphere for a deciduous look */}
      <mesh position={[0, 0.5, 0]} castShadow={false}>
        <sphereGeometry args={[0.28, 12, 10]} />
        <meshLambertMaterial color="#4a8a4e" flatShading />
      </mesh>
      {/* small darker shadow inside foliage to give volume read */}
      <mesh position={[0.05, 0.45, 0.05]}>
        <sphereGeometry args={[0.18, 10, 8]} />
        <meshLambertMaterial color="#3d7240" flatShading />
      </mesh>
    </group>
  )
}
