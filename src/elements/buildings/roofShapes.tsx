import * as THREE from 'three'
import { rng } from '../../components/sceneMaterials'
import type { BuildingType } from '../types'
import { getPVPanelTexture, PV_BASE_COLOR } from '../shared/pvAsset'

// =============================================================================
// Roof shape library.
//
// Pre-this-file every renderer in `src/elements/buildings/*` painted a flat
// box at y=h+0.03 in a single hardcoded colour. The skyline read as 73
// identical lids on different boxes. User feedback (2026-05-25) asked for
// roof-shape variety as the highest-leverage way to break the "all the
// same" silhouette.
//
// This module ships 7 roof kinds (`flat`, `gable`, `hip`, `mansard`,
// `pyramid`, `stepped`, `barrel`) and a `pickRoofKind(type, h, seed)`
// router that distributes them by building type + per-instance seed.
// Each kind reads `roofHex` so the existing palette stays in charge of
// colour; this file controls shape only.
//
// Rooftop PV: when `hasPV` is true, the kind decides where the panel goes
// (flat → slab top; gable/mansard → south slope; stepped → top step;
// pyramid/hip/barrel → no PV — those shapes don't carry a usable plane).
// =============================================================================

export type RoofKind =
  | 'flat'
  | 'gable'
  | 'hip'
  | 'mansard'
  | 'pyramid'
  | 'stepped'
  | 'barrel'

// Geometry-only props (each individual roof renderer destructures these)
interface RoofGeomProps {
  w: number
  d: number
  h: number
  /** Slab / surface colour. Pass `b.roofHex` for per-building variation. */
  color: string
  /** Render a tilted PV panel on the most south-facing roof surface. */
  hasPV?: boolean
}

// Dispatcher props (adds `kind` discriminator for SmartRoof switch)
interface SmartRoofProps extends RoofGeomProps {
  kind: RoofKind
}

export function SmartRoof({ w, d, h, kind, color, hasPV = false }: SmartRoofProps) {
  switch (kind) {
    case 'flat':    return <FlatRoof    w={w} d={d} h={h} color={color} hasPV={hasPV} />
    case 'gable':   return <GableRoof   w={w} d={d} h={h} color={color} hasPV={hasPV} />
    case 'hip':     return <HipRoof     w={w} d={d} h={h} color={color} />
    case 'mansard': return <MansardRoof w={w} d={d} h={h} color={color} hasPV={hasPV} />
    case 'pyramid': return <PyramidRoof w={w} d={d} h={h} color={color} />
    case 'stepped': return <SteppedRoof w={w} d={d} h={h} color={color} hasPV={hasPV} />
    case 'barrel':  return <BarrelRoof  w={w} d={d} h={h} color={color} />
  }
}

// -----------------------------------------------------------------------------
// pickRoofKind — deterministic per-building roof type picker.
//
// Mix per type was tuned to keep the skyline coherent: skyscrapers stay
// flat/stepped/barrel (no pitched roofs on towers); houses get the full
// variety; apartments lean flat with a pitched / mansard minority.
// -----------------------------------------------------------------------------
export function pickRoofKind(type: BuildingType, h: number, seed: number): RoofKind {
  const roll = rng(seed * 0.137)
  switch (type) {
    case 'house':
      if (roll < 0.30) return 'gable'
      if (roll < 0.50) return 'hip'
      if (roll < 0.65) return 'pyramid'
      if (roll < 0.85) return 'mansard'
      return 'flat'
    case 'townhouse':
      if (roll < 0.50) return 'gable'
      if (roll < 0.80) return 'hip'
      return 'mansard'
    case 'apartment':
      // Sub-1.8m apartments are stubby; only flat / gable read well.
      if (h < 1.8) return roll < 0.5 ? 'flat' : 'gable'
      if (roll < 0.40) return 'flat'
      if (roll < 0.62) return 'mansard'
      if (roll < 0.78) return 'gable'
      if (roll < 0.90) return 'hip'
      return 'stepped'
    case 'office':
      if (roll < 0.55) return 'flat'
      if (roll < 0.78) return 'stepped'
      if (roll < 0.90) return 'mansard'
      return 'barrel'
    case 'skyscraper':
      // No pitched roofs on tall towers — only flat / stepped / barrel
      // crowns. The masterplan's setback / spire shapeIds still layer
      // on top of whatever SmartRoof returns.
      if (roll < 0.55) return 'flat'
      if (roll < 0.88) return 'stepped'
      return 'barrel'
    case 'warehouse':
    case 'factory':
      // These types already handle their own roof geometry inside their
      // variant branches (sawtooth / gable / cooling tower). They don't
      // call SmartRoof, but the case is here for completeness.
      return 'flat'
    case 'green-apartment':
      // Dead branch — kept so the union type is exhaustively covered.
      return 'flat'
    case 'energy-lab':
    case 'microgrid-control':
    case 'parking-deck':
    case 'service-depot':
    case 'utility-shed':
      return 'flat'
  }
}

// -----------------------------------------------------------------------------
// FlatRoof — the original. Box at y=h+0.03 + optional PV tile on top.
// -----------------------------------------------------------------------------
function FlatRoof({ w, d, h, color, hasPV }: RoofGeomProps) {
  return (
    <>
      <mesh position={[0, h + 0.03, 0]} castShadow>
        <boxGeometry args={[w + 0.04, 0.06, d + 0.04]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {hasPV && (
        <mesh position={[0, h + 0.09, 0]} rotation={[-Math.PI / 2 + 0.12, 0, 0]} castShadow>
          <boxGeometry args={[w * 0.7, d * 0.6, 0.025]} />
          <meshLambertMaterial color={PV_BASE_COLOR} map={getPVPanelTexture()} />
        </mesh>
      )}
    </>
  )
}

// -----------------------------------------------------------------------------
// GableRoof — two sloped slabs meeting at an apex, ridge along the X axis.
// Triangular gable end walls close the void on the short sides.
// -----------------------------------------------------------------------------
function GableRoof({ w, d, h, color, hasPV }: RoofGeomProps) {
  const apexRise = Math.min(w, d) * 0.35
  const slopeAngle = Math.atan2(apexRise, d / 2)
  const slopeLen = Math.hypot(apexRise, d / 2) + 0.04
  return (
    <>
      {/* eaves trim — no castShadow, this thin strip would just smear the
          shadow map for negligible visual gain. */}
      <mesh position={[0, h + 0.015, 0]}>
        <boxGeometry args={[w + 0.08, 0.03, d + 0.08]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* front slope (south, +z). Rotation `+slopeAngle` around X drops the
          +Z end down to the eave (y=h, z=d/2) and lifts the −Z end up to
          the apex (y=h+apexRise, z=0). The earlier `−slopeAngle` was wrong
          and produced a V-shape because both slopes met at the bottom. */}
      <mesh
        position={[0, h + apexRise / 2 + 0.03, d / 4]}
        rotation={[slopeAngle, 0, 0]}
        castShadow
      >
        <boxGeometry args={[w + 0.06, 0.04, slopeLen]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* back slope (north, −z). Mirror of the front: rotation is the
          opposite sign so its +Z end stays high near the apex. */}
      <mesh
        position={[0, h + apexRise / 2 + 0.03, -d / 4]}
        rotation={[-slopeAngle, 0, 0]}
        castShadow
      >
        <boxGeometry args={[w + 0.06, 0.04, slopeLen]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* east + west gable end walls — triangle facing outward */}
      <GableEndWall x={w / 2} d={d} apexRise={apexRise} h={h} color={color} flipX={false} />
      <GableEndWall x={-w / 2} d={d} apexRise={apexRise} h={h} color={color} flipX />
      {/* PV on the south slope — matches the slope's +slopeAngle rotation
          so the panel lies flush instead of intersecting the slab. */}
      {hasPV && (
        <mesh
          position={[0, h + apexRise / 2 + 0.06, d / 4]}
          rotation={[slopeAngle, 0, 0]}
          castShadow
        >
          <boxGeometry args={[w * 0.6, 0.022, slopeLen * 0.7]} />
          <meshLambertMaterial color={PV_BASE_COLOR} map={getPVPanelTexture()} />
        </mesh>
      )}
    </>
  )
}

function GableEndWall({
  x,
  d,
  apexRise,
  h,
  color,
  flipX
}: {
  x: number
  d: number
  apexRise: number
  h: number
  color: string
  flipX: boolean
}) {
  const positions = new Float32Array([
    -d / 2, 0, 0,
     d / 2, 0, 0,
     0,     apexRise, 0
  ])
  return (
    <mesh
      position={[x, h, 0]}
      rotation={[0, flipX ? -Math.PI / 2 : Math.PI / 2, 0]}
      scale={flipX ? [-1, 1, 1] : [1, 1, 1]}
    >
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="index" args={[new Uint16Array([0, 1, 2]), 1]} />
      </bufferGeometry>
      <meshLambertMaterial color={color} side={THREE.DoubleSide} />
    </mesh>
  )
}

// -----------------------------------------------------------------------------
// HipRoof — 4 slopes meeting at a ridge. Implemented via a 6-vertex buffer
// geometry: 4 base corners + 2 ridge endpoints. Handles non-square footprints
// by orienting the ridge along the longer dimension.
// -----------------------------------------------------------------------------
function HipRoof({ w, d, h, color }: RoofGeomProps) {
  // Ridge runs along the longer axis. If w >= d → ridge along x; else along z.
  const longAlongX = w >= d
  const longSide = longAlongX ? w : d
  const shortSide = longAlongX ? d : w
  const apexRise = shortSide * 0.45
  const ridgeLen = Math.max(longSide - shortSide, 0)

  // Vertex layout (assume long along x):
  //   0: front-left  (-longSide/2, 0, +shortSide/2)
  //   1: front-right ( longSide/2, 0, +shortSide/2)
  //   2: back-right  ( longSide/2, 0, -shortSide/2)
  //   3: back-left   (-longSide/2, 0, -shortSide/2)
  //   4: ridge-left  (-ridgeLen/2, apexRise, 0)
  //   5: ridge-right ( ridgeLen/2, apexRise, 0)
  const hl = longSide / 2
  const hs = shortSide / 2
  const rh = ridgeLen / 2
  const positions = new Float32Array([
    -hl, 0,  hs,
     hl, 0,  hs,
     hl, 0, -hs,
    -hl, 0, -hs,
    -rh, apexRise, 0,
     rh, apexRise, 0
  ])
  // 4 faces:
  //   front slope:  0, 1, 5 + 0, 5, 4  (trapezoid)
  //   back slope:   2, 3, 4 + 2, 4, 5  (trapezoid)
  //   left slope:   3, 0, 4            (triangle)
  //   right slope:  1, 2, 5            (triangle)
  const indices = new Uint16Array([
    0, 1, 5,  0, 5, 4,
    2, 3, 4,  2, 4, 5,
    3, 0, 4,
    1, 2, 5
  ])
  return (
    <mesh
      position={[0, h + 0.02, 0]}
      rotation={[0, longAlongX ? 0 : Math.PI / 2, 0]}
      castShadow
    >
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="index" args={[indices, 1]} />
      </bufferGeometry>
      <meshLambertMaterial color={color} side={THREE.DoubleSide} flatShading />
    </mesh>
  )
}

// -----------------------------------------------------------------------------
// MansardRoof — steep 4-sided lower mansard + small flat top deck.
// Reads as "French baroque attic" silhouette. Optional dormer pop-outs
// could be added later — for now keep clean.
// -----------------------------------------------------------------------------
function MansardRoof({ w, d, h, color, hasPV }: RoofGeomProps) {
  const lowerRise = Math.min(w, d) * 0.28
  const inset = Math.min(w, d) * 0.18
  const topW = Math.max(w - inset * 2, 0.3)
  const topD = Math.max(d - inset * 2, 0.3)
  const slopeAngle = Math.atan2(lowerRise, inset)
  // Slope slabs use a long thin box rotated. Length = hypot(lowerRise, inset).
  const slopeLen = Math.hypot(lowerRise, inset) + 0.04

  return (
    <>
      {/* eaves trim */}
      <mesh position={[0, h + 0.015, 0]}>
        <boxGeometry args={[w + 0.08, 0.03, d + 0.08]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* 4 steep slopes — pivot at the eave line, tilt inward + up. The
          earlier (−,+) X-rotation pair was inverted; (+,−) makes the +Z
          ends of front/back land at the lower eave (y=h) and the inner
          ends meet the top deck at y=h+lowerRise. */}
      {/* front (south, +z) */}
      <mesh
        position={[0, h + lowerRise / 2 + 0.03, d / 2 - inset / 2]}
        rotation={[slopeAngle, 0, 0]}
        castShadow
      >
        <boxGeometry args={[w + 0.06, 0.04, slopeLen]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* back (north, −z) */}
      <mesh
        position={[0, h + lowerRise / 2 + 0.03, -d / 2 + inset / 2]}
        rotation={[-slopeAngle, 0, 0]}
        castShadow
      >
        <boxGeometry args={[w + 0.06, 0.04, slopeLen]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* left (west, −x) */}
      <mesh
        position={[-w / 2 + inset / 2, h + lowerRise / 2 + 0.03, 0]}
        rotation={[0, 0, slopeAngle]}
        castShadow
      >
        <boxGeometry args={[slopeLen, 0.04, d + 0.06]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* right (east, +x) */}
      <mesh
        position={[w / 2 - inset / 2, h + lowerRise / 2 + 0.03, 0]}
        rotation={[0, 0, -slopeAngle]}
        castShadow
      >
        <boxGeometry args={[slopeLen, 0.04, d + 0.06]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* flat top deck */}
      <mesh position={[0, h + lowerRise + 0.04, 0]} castShadow>
        <boxGeometry args={[topW, 0.04, topD]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* PV on the top flat deck */}
      {hasPV && (
        <mesh
          position={[0, h + lowerRise + 0.08, 0]}
          rotation={[-Math.PI / 2 + 0.1, 0, 0]}
          castShadow
        >
          <boxGeometry args={[topW * 0.85, topD * 0.7, 0.022]} />
          <meshLambertMaterial color={PV_BASE_COLOR} map={getPVPanelTexture()} />
        </mesh>
      )}
    </>
  )
}

// -----------------------------------------------------------------------------
// PyramidRoof — 4 triangular slopes meeting at an apex. Square or near-square
// footprints read best; wide rectangles use a stretched cone.
// -----------------------------------------------------------------------------
function PyramidRoof({ w, d, h, color }: RoofGeomProps) {
  // 5 vertices: 4 base corners + 1 apex
  const apexRise = Math.min(w, d) * 0.55
  const positions = new Float32Array([
    -w / 2, 0,  d / 2,   // 0 FL
     w / 2, 0,  d / 2,   // 1 FR
     w / 2, 0, -d / 2,   // 2 BR
    -w / 2, 0, -d / 2,   // 3 BL
     0,     apexRise, 0  // 4 apex
  ])
  const indices = new Uint16Array([
    0, 1, 4,  // front
    1, 2, 4,  // right
    2, 3, 4,  // back
    3, 0, 4   // left
  ])
  return (
    <>
      {/* eaves trim */}
      <mesh position={[0, h + 0.015, 0]}>
        <boxGeometry args={[w + 0.08, 0.03, d + 0.08]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <mesh position={[0, h + 0.04, 0]} castShadow>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="index" args={[indices, 1]} />
        </bufferGeometry>
        <meshLambertMaterial color={color} side={THREE.DoubleSide} flatShading />
      </mesh>
    </>
  )
}

// -----------------------------------------------------------------------------
// SteppedRoof — 3 stacked flat slabs of decreasing footprint. The classic
// "wedding cake" CBD crown. Top step is the PV-friendly surface.
// -----------------------------------------------------------------------------
function SteppedRoof({ w, d, h, color, hasPV }: RoofGeomProps) {
  return (
    <>
      <mesh position={[0, h + 0.03, 0]} castShadow>
        <boxGeometry args={[w + 0.04, 0.06, d + 0.04]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <mesh position={[0, h + 0.18, 0]} castShadow>
        <boxGeometry args={[w * 0.82, 0.08, d * 0.82]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <mesh position={[0, h + 0.34, 0]} castShadow>
        <boxGeometry args={[w * 0.6, 0.08, d * 0.6]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {hasPV && (
        <mesh position={[0, h + 0.42, 0]} rotation={[-Math.PI / 2 + 0.1, 0, 0]} castShadow>
          <boxGeometry args={[w * 0.5, d * 0.5, 0.022]} />
          <meshLambertMaterial color={PV_BASE_COLOR} map={getPVPanelTexture()} />
        </mesh>
      )}
    </>
  )
}

// -----------------------------------------------------------------------------
// BarrelRoof — half-cylinder vault. The cylinder axis runs along the longer
// dimension; the half points up so the curve is the visible roof.
// -----------------------------------------------------------------------------
function BarrelRoof({ w, d, h, color }: RoofGeomProps) {
  const longAlongX = w >= d
  const length = longAlongX ? w : d
  const radius = (longAlongX ? d : w) / 2

  return (
    <>
      {/* eaves trim — provides a base for the vault to rest on */}
      <mesh position={[0, h + 0.015, 0]}>
        <boxGeometry args={[w + 0.06, 0.03, d + 0.06]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* The vault: a half cylinder, open ends. Default cylinder axis is Y,
          so rotate around z by π/2 to put the axis along x. If the long axis
          is z, additionally rotate around y by π/2. thetaStart=0 thetaLength
          =π gives the upper half. openEnded=true since we close the ends
          with the bufferGeometry semicircles below. */}
      <group position={[0, h + 0.03, 0]} rotation={[0, longAlongX ? 0 : Math.PI / 2, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry
            args={[radius, radius, length, 18, 1, true, 0, Math.PI]}
          />
          <meshLambertMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
        {/* Cap the two ends with semicircles (so the vault doesn't look hollow
            from oblique angles). */}
        {[length / 2, -length / 2].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <circleGeometry args={[radius, 18, 0, Math.PI]} />
            <meshLambertMaterial color={color} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </>
  )
}
