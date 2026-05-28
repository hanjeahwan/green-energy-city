import * as THREE from 'three'
import { useThrottledFrame } from '../../scene/throttledFrame'
import { useMemo, useRef } from 'react'
import { RoundedBox } from '@react-three/drei'
import { ENERGY_CYAN, CLEAN_GREEN } from '../../scene/palette'

// =============================================================================
// WindFarmHill — single 5×5m tile hosting 3 wind turbines + control building
// + pine grove + cyan LED rings, matching the reference image (low-poly
// isometric wind farm hill).
//
// Replaces the previous single-turbine WindFarm at wind-1. This is a self-
// contained "module" with its own ground/sidewalk so it reads as a distinct
// installation when dropped into the SW industrial corner.
//
// Geometry budget — ~30 meshes total:
//   - 1 sidewalk-bordered grass tile (2 planes + 4 LED edge strips)
//   - 3 turbines (reusing WindTurbine internals but lighter — 1 nacelle,
//     3 blades, simple tower)
//   - 3 cyan LED rings on the ground beneath each turbine
//   - 1 control building cluster (3 boxes + cyan glass face)
//   - 6 pine trees (2-cone stacked foliage on a trunk)
// =============================================================================

interface WindFarmHillProps {
  position?: [number, number, number]
  rotation?: number
}

// Hill tile dimensions
const TILE_W = 5.0
const TILE_D = 5.0
const HALF_TILE_W = TILE_W / 2
const HALF_TILE_D = TILE_D / 2
const SIDEWALK_BAND = 0.35  // gray border around the green grass

// Turbine positions on the tile (triangle layout matching reference image)
const TURBINE_POSITIONS: [number, number][] = [
  [-1.2, -0.8],
  [ 1.2, -1.1],
  [ 0.0,  1.0],
]

// Pine tree scatter positions (around the edges, leaving turbines clear)
const PINE_POSITIONS: [number, number][] = [
  [-1.9,  1.7],
  [-1.8,  0.3],
  [-1.6, -2.0],
  [ 1.9,  1.6],
  [ 1.8,  0.2],
  [-0.4, -2.0],
]

export function WindFarmHill({
  position = [0, 0, 0],
  rotation = 0,
}: WindFarmHillProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <HillBase />
      <CyanEdgeStrips />
      {TURBINE_POSITIONS.map((p, i) => (
        <group key={`turb-${i}`} position={[p[0], 0, p[1]]}>
          <CyanRingPad />
          <MiniTurbine phase={i * 0.7} />
        </group>
      ))}
      <ControlBuildingCluster position={[1.7, 0, 1.8]} />
      <Path />
      {PINE_POSITIONS.map((p, i) => (
        <Pine key={`pine-${i}`} position={[p[0], 0, p[1]]} seed={i * 13} />
      ))}
    </group>
  )
}

// -----------------------------------------------------------------------------
// Hill base — sidewalk-bordered green grass tile
// -----------------------------------------------------------------------------

function HillBase() {
  return (
    <group>
      {/* Ground-decal stack with 1cm spacing for depth-buffer headroom:
          sidewalk 0.005 -> grass 0.015 -> tone patches 0.025. */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[TILE_W + SIDEWALK_BAND * 2, TILE_D + SIDEWALK_BAND * 2]} />
        <meshLambertMaterial color="#d6dae0" />
      </mesh>
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[TILE_W, TILE_D]} />
        <meshLambertMaterial color="#6fb260" />
      </mesh>
      {[
        [-1.6, 0.5, 1.5, 1.0],
        [1.4, -1.6, 1.2, 0.8],
        [0.3, 1.7, 1.4, 0.7],
      ].map(([x, z, w, d], i) => (
        <mesh
          key={`patch-${i}`}
          position={[x, 0.025, z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[w, d]} />
          <meshLambertMaterial color="#5fa050" />
        </mesh>
      ))}
    </group>
  )
}

// -----------------------------------------------------------------------------
// Cyan LED edge strips — 4 thin emissive bands around the sidewalk
// -----------------------------------------------------------------------------

function CyanEdgeStrips() {
  const stripT = 0.035
  const insetFromEdge = 0.04  // sit just inside the sidewalk outer edge
  const outerW = TILE_W + SIDEWALK_BAND * 2 - insetFromEdge * 2
  const outerD = TILE_D + SIDEWALK_BAND * 2 - insetFromEdge * 2
  const halfW = outerW / 2
  const halfD = outerD / 2

  // Use thin boxes so the strip catches the light a bit (planes look flat).
  // emissiveIntensity tuned for daylight legibility (cyan reads but doesn't
  // dominate).
  const mat = (
    <meshLambertMaterial
      color="#102438"
      emissive={ENERGY_CYAN}
      emissiveIntensity={0.7}

    />
  )

  return (
    <group position={[0, 0.012, 0]}>
      {/* N edge */}
      <mesh position={[0, 0, halfD]}>
        <boxGeometry args={[outerW, 0.02, stripT]} />
        {mat}
      </mesh>
      {/* S edge */}
      <mesh position={[0, 0, -halfD]}>
        <boxGeometry args={[outerW, 0.02, stripT]} />
        {mat}
      </mesh>
      {/* E edge */}
      <mesh position={[halfW, 0, 0]}>
        <boxGeometry args={[stripT, 0.02, outerD]} />
        {mat}
      </mesh>
      {/* W edge */}
      <mesh position={[-halfW, 0, 0]}>
        <boxGeometry args={[stripT, 0.02, outerD]} />
        {mat}
      </mesh>
    </group>
  )
}

// -----------------------------------------------------------------------------
// Cyan LED ring pad — circular emissive ring inscribed on the grass under
// each turbine (matches the "active scanning" rings in the reference image).
// -----------------------------------------------------------------------------

function CyanRingPad() {
  return (
    <group>
      {/* Stack above the tile (grass=0.015, patches=0.025): pad=0.035, ring=0.045, inner=0.055 */}
      <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.85, 32]} />
        <meshLambertMaterial color="#5a9050" />
      </mesh>
      <mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.78, 0.84, 48]} />
        <meshLambertMaterial
          color="#102438"
          emissive={ENERGY_CYAN}
          emissiveIntensity={1.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0.055, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 0.46, 32]} />
        <meshLambertMaterial
          color="#102438"
          emissive={ENERGY_CYAN}
          emissiveIntensity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

// -----------------------------------------------------------------------------
// MiniTurbine — slimmer than the standalone WindTurbine.tsx (which is sized
// for solo placement). 3 white blades, ~2.5m total height, blinking green
// aviation light on the nacelle. Re-uses the same blade-rotation pattern.
// -----------------------------------------------------------------------------

function MiniTurbine({ phase = 0 }: { phase?: number }) {
  const blades = useRef<THREE.Group>(null!)
  const tipLight = useRef<THREE.MeshLambertMaterial>(null!)

  useThrottledFrame((s) => {
    const t = s.clock.getElapsedTime()
    if (blades.current) blades.current.rotation.z = t * 1.3 + phase
    if (tipLight.current) {
      const cyc = (t + phase) % 1.0
      tipLight.current.emissiveIntensity = cyc < 0.15 ? 1.2 : 0.15
    }
  }, 30)

  const bladeGeom = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-0.05, 0)
    shape.lineTo(0.05, 0)
    shape.lineTo(0.02, 1.1)
    shape.lineTo(-0.02, 1.1)
    shape.closePath()
    return new THREE.ExtrudeGeometry(shape, { depth: 0.035, bevelEnabled: false })
      .translate(0, 0, -0.017)
  }, [])

  return (
    <group position={[0, 0.02, 0]}>
      {/* foundation pillar (small base on the grass) */}
      <mesh position={[0, 0.04, 0]} castShadow={false}>
        <cylinderGeometry args={[0.18, 0.22, 0.08, 18]} />
        <meshLambertMaterial color="#c8d2dc" />
      </mesh>
      {/* tapered tower — 2.4m */}
      <mesh position={[0, 1.28, 0]} castShadow={false}>
        <cylinderGeometry args={[0.05, 0.13, 2.4, 16]} />
        <meshLambertMaterial color="#f4f6f9" />
      </mesh>
      {/* nacelle */}
      <RoundedBox
        args={[0.22, 0.17, 0.42]}
        radius={0.04}
        smoothness={3}
        position={[0, 2.5, 0.08]}
        castShadow={false}
      >
        <meshLambertMaterial color="#e2e7ed" />
      </RoundedBox>
      {/* hub */}
      <mesh position={[0, 2.5, 0.3]}>
        <sphereGeometry args={[0.08, 14, 14]} />
        <meshLambertMaterial color="#a8b2bf" />
      </mesh>
      <mesh
        position={[0, 2.5, 0.4]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow={false}
      >
        <coneGeometry args={[0.07, 0.13, 12]} />
        <meshLambertMaterial color="#9aa5b2" />
      </mesh>
      {/* 3 blades */}
      <group ref={blades} position={[0, 2.5, 0.34]}>
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            rotation={[0, 0, (i * Math.PI * 2) / 3]}
            geometry={bladeGeom}
            castShadow={false}
          >
            <meshLambertMaterial color="#ffffff" />
          </mesh>
        ))}
      </group>
      {/* green aviation light on top of nacelle */}
      <mesh position={[0, 2.62, 0.08]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshLambertMaterial
          ref={tipLight}
          color="#0e2440"
          emissive={CLEAN_GREEN}
          emissiveIntensity={0.8}

        />
      </mesh>
    </group>
  )
}

// -----------------------------------------------------------------------------
// Control building cluster — 3 stacked/adjacent gray modules + cyan glass
// front (matches the cyan-glowing operations hub in the reference's SE corner).
// -----------------------------------------------------------------------------

function ControlBuildingCluster({
  position,
}: {
  position: [number, number, number]
}) {
  return (
    <group position={position}>
      {/* Main module — taller box with cyan glass front */}
      <mesh position={[0, 0.4, 0]} castShadow={false} receiveShadow>
        <boxGeometry args={[0.7, 0.8, 0.55]} />
        <meshLambertMaterial color="#c8d0db" />
      </mesh>
      {/* cyan glass front panel */}
      <mesh position={[0, 0.42, 0.281]}>
        <planeGeometry args={[0.55, 0.55]} />
        <meshLambertMaterial
          color="#1a3a5a"
          emissive={ENERGY_CYAN}
          emissiveIntensity={0.7}


        />
      </mesh>
      {/* dark roof slab */}
      <mesh position={[0, 0.82, 0]}>
        <boxGeometry args={[0.74, 0.04, 0.59]} />
        <meshLambertMaterial color="#3a4654" />
      </mesh>
      {/* small rooftop unit */}
      <mesh position={[0, 0.88, -0.1]}>
        <boxGeometry args={[0.18, 0.08, 0.14]} />
        <meshLambertMaterial color="#5a6878" />
      </mesh>

      {/* Side module 1 (left, shorter) */}
      <mesh position={[-0.55, 0.25, 0.1]} castShadow={false}>
        <boxGeometry args={[0.38, 0.5, 0.42]} />
        <meshLambertMaterial color="#dde2e9" />
      </mesh>
      <mesh position={[-0.55, 0.52, 0.1]}>
        <boxGeometry args={[0.42, 0.04, 0.46]} />
        <meshLambertMaterial color="#3a4654" />
      </mesh>
      {/* cyan accent strip on left module */}
      <mesh position={[-0.55, 0.18, 0.32]}>
        <boxGeometry args={[0.3, 0.03, 0.005]} />
        <meshLambertMaterial color="#102438" emissive={ENERGY_CYAN} emissiveIntensity={0.9} />
      </mesh>

      {/* Side module 2 (right, lowest) */}
      <mesh position={[0.5, 0.18, -0.05]} castShadow={false}>
        <boxGeometry args={[0.32, 0.36, 0.34]} />
        <meshLambertMaterial color="#c8d0db" />
      </mesh>
      <mesh position={[0.5, 0.38, -0.05]}>
        <boxGeometry args={[0.36, 0.04, 0.38]} />
        <meshLambertMaterial color="#3a4654" />
      </mesh>
    </group>
  )
}

// -----------------------------------------------------------------------------
// Path — connects the control building to the centre of the turbine triangle.
// Light gray gravel strips, just thin enough to read as worn track.
// -----------------------------------------------------------------------------

function Path() {
  const w = 0.18
  const mat = <meshLambertMaterial color="#bdc4cc" />
  return (
    <group position={[0, 0.011, 0]}>
      {/* From control building (1.7, 1.8) to center (0, 0) — one long path */}
      <mesh
        position={[0.85, 0, 0.9]}
        rotation={[-Math.PI / 2, 0, Math.atan2(1.8, 1.7)]}
      >
        <planeGeometry args={[Math.hypot(1.7, 1.8), w]} />
        {mat}
      </mesh>
      {/* Branch to each turbine */}
      {TURBINE_POSITIONS.map((p, i) => {
        const len = Math.hypot(p[0], p[1])
        const angle = Math.atan2(p[1], p[0])
        return (
          <mesh
            key={`branch-${i}`}
            position={[p[0] / 2, 0, p[1] / 2]}
            rotation={[-Math.PI / 2, 0, angle]}
          >
            <planeGeometry args={[len, w]} />
            {mat}
          </mesh>
        )
      })}
    </group>
  )
}

// -----------------------------------------------------------------------------
// Pine — low-poly conifer: brown trunk + 2-tier stacked dark-green cones.
// Looks more "fir tree" than rounded foliage; matches the reference image's
// taiga-style trees framing the wind hill.
// -----------------------------------------------------------------------------

function Pine({
  position,
  seed = 0,
}: {
  position: [number, number, number]
  seed?: number
}) {
  // Tiny per-instance variance so the grove doesn't read as cloned
  const scale = 0.85 + ((seed * 1031) % 100) / 333  // 0.85 - 1.15
  const rot = (seed * 47) % 360
  return (
    <group
      position={position}
      scale={scale}
      rotation={[0, (rot * Math.PI) / 180, 0]}
    >
      {/* trunk */}
      <mesh position={[0, 0.13, 0]} castShadow={false}>
        <cylinderGeometry args={[0.035, 0.045, 0.26, 6]} />
        <meshLambertMaterial color="#5a3a22" />
      </mesh>
      {/* lower foliage cone — wider */}
      <mesh position={[0, 0.42, 0]} castShadow={false}>
        <coneGeometry args={[0.27, 0.45, 8]} />
        <meshLambertMaterial color="#2d6a3c" flatShading />
      </mesh>
      {/* mid foliage cone */}
      <mesh position={[0, 0.65, 0]} castShadow={false}>
        <coneGeometry args={[0.21, 0.38, 8]} />
        <meshLambertMaterial color="#357548" flatShading />
      </mesh>
      {/* top foliage cone — narrowest, brightest tip */}
      <mesh position={[0, 0.88, 0]} castShadow={false}>
        <coneGeometry args={[0.14, 0.32, 8]} />
        <meshLambertMaterial color="#3d8252" flatShading />
      </mesh>
    </group>
  )
}
