import * as THREE from 'three'
import { useMemo } from 'react'
import { tintedGeometry, flatGradMat } from '../../components/sceneMaterials'
import type { BuildingDef, ElementVariant } from '../types'
import { ACCENT_CYAN } from './catalog'

// =============================================================================
// House variants
//   classic    — Eco residence: flat roof + FULL rooftop solar canopy + cyan seam under panel
//   modern     — Pitched roof: 4-slope pyramid roof + smaller PV patch on south slope
//   industrial — Shed roof: single mono-pitch slope + steel column corner posts + clerestory window
// Shared: base outline, body box, vertical garden green stripe, door, smart windows.
// =============================================================================

interface HouseFeatures {}

export const HOUSE_VARIANTS: Record<string, ElementVariant<HouseFeatures>> = {
  classic:    { id: 'classic',    footprint: { halfW: 0.5, halfD: 0.55 } },
  modern:     { id: 'modern',     footprint: { halfW: 0.5, halfD: 0.55 } },
  industrial: { id: 'industrial', footprint: { halfW: 0.5, halfD: 0.55 } }
}

export function House({ b, instanced = false }: { b: BuildingDef; instanced?: boolean }) {
  const bodyGeom = useMemo(() => {
    if (instanced) return null
    const g = new THREE.BoxGeometry(b.w, b.h, b.d)
    g.translate(0, b.h / 2, 0)
    return tintedGeometry(g, b.topHex, 0.85)
  }, [b.w, b.h, b.d, b.topHex, instanced])
  const bodyMat = useMemo(() => (instanced ? null : flatGradMat({ roughness: 0.78 })), [instanced])

  const isModern = b.variant === 'modern'
  const isIndustrial = b.variant === 'industrial'

  return (
    <group position={[b.pos[0], 0, b.pos[1]]} rotation={[0, b.rot, 0]}>
      {/* base outline rendered centrally by InstancedBuildingOutlines */}
      {/* body — skipped when this house is rendered through
          <InstancedSimpleBoxBuildings>; the batch draws it instead. */}
      {!instanced && bodyGeom && bodyMat && (
        <mesh geometry={bodyGeom} material={bodyMat} receiveShadow />
      )}

      {isIndustrial
        ? <IndustrialShedRoof b={b} />
        : isModern
        ? <ModernPitchedRoof b={b} />
        : instanced
        ? null /* classic flat roof slab is in the batch */
        : <ClassicFlatPV b={b} />}

      {/* vertical garden green stripe on front facade (shared) */}
      <mesh position={[-b.w * 0.32, b.h * 0.45, b.d / 2 + 0.02]}>
        <planeGeometry args={[b.w * 0.14, b.h * 0.85]} />
        <meshLambertMaterial color="#3a7a4a" />
      </mesh>
      {/* door (shared) */}
      <mesh position={[0, b.h * 0.35, b.d / 2 + 0.02]}>
        <planeGeometry args={[b.w * 0.18, b.h * 0.6]} />
        <meshLambertMaterial color="#2a3340" />
      </mesh>
      {/* smart-home windows — cyan emissive (shared) */}
      <mesh position={[b.w * 0.25, b.h * 0.55, b.d / 2 + 0.02]}>
        <planeGeometry args={[b.w * 0.22, b.h * 0.32]} />
        <meshLambertMaterial color="#0e2440" emissive={ACCENT_CYAN} emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[b.w * 0.25, b.h * 0.55, -b.d / 2 - 0.02]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[b.w * 0.22, b.h * 0.32]} />
        <meshLambertMaterial color="#0e2440" emissive={ACCENT_CYAN} emissiveIntensity={0.35} />
      </mesh>
      <HouseShapeSignature b={b} />
    </group>
  )
}

function HouseShapeSignature({ b }: { b: BuildingDef }) {
  if (b.shapeId !== 'low-detached-villa') return null
  return (
    <>
      <mesh position={[0, b.h * 0.28, b.d / 2 + 0.13]} castShadow>
        <boxGeometry args={[b.w * 0.58, 0.08, 0.22]} />
        <meshLambertMaterial color="#e5ece8" />
      </mesh>
      <mesh position={[-b.w * 0.34, b.h * 0.3, b.d / 2 + 0.22]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, b.h * 0.55, 6]} />
        <meshLambertMaterial color="#506472" />
      </mesh>
      <mesh position={[b.w * 0.36, b.h + 0.06, -b.d * 0.16]} castShadow>
        <boxGeometry args={[b.w * 0.28, 0.05, b.d * 0.28]} />
        <meshLambertMaterial color="#9fb6ad" />
      </mesh>
    </>
  )
}

// -----------------------------------------------------------------------------
// Classic: flat slate roof. PV canopy removed by user request — see NO_PV_TYPES
// in zoning.ts. House is now in the no-PV set; b.hasPV will always be false
// for type='house' regardless of district probability.
// -----------------------------------------------------------------------------
function ClassicFlatPV({ b }: { b: BuildingDef }) {
  return (
    <mesh position={[0, b.h + 0.025, 0]} castShadow>
      <boxGeometry args={[b.w + 0.05, 0.04, b.d + 0.05]} />
      <meshLambertMaterial color="#3a4a5e" />
    </mesh>
  )
}

// -----------------------------------------------------------------------------
// Industrial: single-slope (mono-pitch) shed roof + 4 steel corner posts.
// "Industrial cool" — concrete + steel, not warm rust.
// -----------------------------------------------------------------------------
function IndustrialShedRoof({ b }: { b: BuildingDef }) {
  const slopeRise = b.w * 0.35  // roof rises from front (low) to back (high)
  const slopeAngle = Math.atan2(slopeRise, b.d)
  const slopeLen = Math.hypot(slopeRise, b.d) + 0.05
  return (
    <>
      {/* shed roof slab — high at back (−z), low at front (+z) */}
      <mesh
        position={[0, b.h + slopeRise / 2 + 0.02, 0]}
        rotation={[slopeAngle, 0, 0]}
        castShadow
      >
        <boxGeometry args={[b.w + 0.06, 0.05, slopeLen]} />
        <meshLambertMaterial color="#3a4654" />
      </mesh>
      {/* Triangular gable ends on left + right sides — close the void.
          Both gables use the same vertex array with peak at local
          (-b.d/2, slopeRise, 0). After their Y-rotations:
            - left  (ry = -π/2): peak lands at world -Z (back)  ✓
            - right (ry = +π/2): peak lands at world +Z (front) ✗ mirrored
          To fix the right side, we flip its local X axis via scale[-1,1,1]
          so the peak vertex effectively moves to local +b.d/2; after the
          +π/2 Y-rotation it then lands at world -Z (back) like the left
          side. (A previous attempt used scale[1,1,-1] but ALL triangle
          vertices are at local Z=0, so Z-scaling was a no-op — the gable
          stayed mirror-flipped. X is the correct axis to flip.) */}
      {[
        { x: b.w / 2 + 0.02,  ry: Math.PI / 2,  xMirror: true  },
        { x: -b.w / 2 - 0.02, ry: -Math.PI / 2, xMirror: false }
      ].map((s, i) => (
        <mesh
          key={`gable-${i}`}
          position={[s.x, b.h, 0]}
          rotation={[0, s.ry, 0]}
          scale={s.xMirror ? [-1, 1, 1] : [1, 1, 1]}
        >
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([
                -b.d / 2, 0, 0,
                b.d / 2, 0, 0,
                -b.d / 2, slopeRise, 0
              ]), 3]}
            />
            <bufferAttribute attach="index" args={[new Uint16Array([0, 1, 2]), 1]} />
          </bufferGeometry>
          <meshLambertMaterial color={b.topHex} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* clerestory window strip just under the high edge — high north-facing daylight */}
      <mesh position={[0, b.h + slopeRise * 0.85, -b.d / 2 - 0.02]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[b.w * 0.7, slopeRise * 0.5]} />
        <meshLambertMaterial color="#22354f" emissive={ACCENT_CYAN} emissiveIntensity={0.4} />
      </mesh>
      {/* 4 steel corner posts (exoskeleton feel) */}
      {[
        [b.w / 2 - 0.04, b.d / 2 - 0.04],
        [-b.w / 2 + 0.04, b.d / 2 - 0.04],
        [b.w / 2 - 0.04, -b.d / 2 + 0.04],
        [-b.w / 2 + 0.04, -b.d / 2 + 0.04]
      ].map(([x, z], i) => (
        <mesh key={`post-${i}`} position={[x, b.h / 2, z]} castShadow>
          <boxGeometry args={[0.035, b.h, 0.035]} />
          <meshLambertMaterial color="#22354f" />
        </mesh>
      ))}
      {/* small chimney/vent — Y MUST track the sloped roof at the chimney's z.
          Pre-fix Y was `b.h + slopeRise + 0.08` (height at the back edge), but
          the chimney sits at z = -b.d * 0.35, where the slope is only at 85%
          of full rise → the chimney floated above the actual roof skin
          ("屋顶圆管悬空"). Linear-interpolate roof top from the slab
          geometry: y_top(z) = b.h + 0.045 + slopeRise * (0.5 - z / b.d). */}
      {(() => {
        const cz = -b.d * 0.35
        const roofTopY = b.h + 0.045 + slopeRise * (0.5 - cz / b.d)
        return (
          <mesh position={[b.w * 0.2, roofTopY + 0.075, cz]} castShadow>
            <boxGeometry args={[0.07, 0.15, 0.07]} />
            <meshLambertMaterial color="#5a6878" />
          </mesh>
        )
      })()}
    </>
  )
}

// -----------------------------------------------------------------------------
// Modern: 4-pitched pyramid roof + smaller PV patch on south slope
// -----------------------------------------------------------------------------
function ModernPitchedRoof({ b }: { b: BuildingDef }) {
  // Apex above the body center; roof rises ~40% of width
  const apexH = b.w * 0.4
  // CylinderGeometry args = (radiusTop=0, radiusBottom=√(w²+d²)/2, height=apexH, segments=4)
  // 4 segments + rotation π/4 makes a square-base pyramid aligned to xy axes.

  return (
    <>
      {/* 4-pitched pyramid roof — using 4-sided cylinder with radiusTop=0 */}
      <mesh position={[0, b.h + apexH / 2 + 0.02, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <cylinderGeometry args={[0.0001, Math.hypot(b.w, b.d) / 2, apexH, 4, 1]} />
        <meshLambertMaterial color="#3a4a5e" flatShading />
      </mesh>
      {/* PV patch removed — house is in NO_PV_TYPES (see zoning.ts). */}
      {/* small chimney/vent — Y MUST track the pyramid slope at the chimney's
          XZ. Pre-fix Y was `b.h + apexH + 0.08` (apex height), but the chimney
          sits off-center at (b.w*0.15, -b.d*0.15) where the roof has descended
          to ≈ 70% of apexH → ~10cm float ("屋顶圆管悬空"). For a square-aligned
          pyramid: y_top(x,z) = b.h + 0.02 + apexH * (1 - max(|x|/(b.w/2),
          |z|/(b.d/2))). */}
      {(() => {
        const cx = b.w * 0.15
        const cz = -b.d * 0.15
        const xFrac = Math.abs(cx) / (b.w / 2)
        const zFrac = Math.abs(cz) / (b.d / 2)
        const roofTopY = b.h + 0.02 + apexH * (1 - Math.max(xFrac, zFrac))
        return (
          <mesh position={[cx, roofTopY + 0.08, cz]} castShadow>
            <boxGeometry args={[0.08, 0.16, 0.08]} />
            <meshLambertMaterial color="#5a6878" />
          </mesh>
        )
      })()}
    </>
  )
}
