import * as THREE from 'three'
import { useMemo } from 'react'
import { tintedGeometry, flatGradMat } from '../../components/sceneMaterials'
import type { BuildingDef, ElementVariant } from '../types'
import { ACCENT_CYAN } from './catalog'
import { FacadeStack } from './facadeVariants'
import { SmartRoof, pickRoofKind } from './roofShapes'

// =============================================================================
// Office variants — M2 migrated to facade primitives library.
//
// Macro structure (body box + roof slab + AC + PV + railing + mid-seam) stays
// in this file; per-variant decoration is now composed from <Facade*/>
// components in facade.tsx. ~140 LOC removed from this file compared to C7.
//
//   classic    — instanced windows + horizontal cornices + entry portal +
//                step-back crown when h > 2.2
//   modern     — full glass curtain + horizontal mullion bands
//   industrial — exterior steel-frame balconies wrapping the facade +
//                rooftop HVAC pent + corner posts
//
// Shared: base outline, body box, roof slab, cyan mid-seam, orthogonal
// roof unit / PV / railing.
// =============================================================================

interface OfficeFeatures {}

export const OFFICE_VARIANTS: Record<string, ElementVariant<OfficeFeatures>> = {
  classic:    { id: 'classic',    footprint: { halfW: 0.7, halfD: 0.7 } },
  modern:     { id: 'modern',     footprint: { halfW: 0.7, halfD: 0.7 } },
  industrial: { id: 'industrial', footprint: { halfW: 0.7, halfD: 0.7 } }
}

export function Office({ b }: { b: BuildingDef }) {
  const bodyGeom = useMemo(() => {
    const g = new THREE.BoxGeometry(b.w, b.h, b.d)
    g.translate(0, b.h / 2, 0)
    // Was 0.5 (base at half intensity → near-black for mid-toned offices).
    // 0.82 keeps the lit-top gradient subtle without dragging the base
    // into the black zone.
    return tintedGeometry(g, b.topHex, 0.82)
  }, [b.w, b.h, b.d, b.topHex])

  const bodyMat = useMemo(() => flatGradMat({ roughness: 0.78, metalness: 0.0 }), [])

  const isModern = b.variant === 'modern'
  const isIndustrial = b.variant === 'industrial'

  return (
    <group position={[b.pos[0], 0, b.pos[1]]} rotation={[0, b.rot, 0]}>
      {/* base outline rendered centrally by InstancedBuildingOutlines */}
      {/* body (shared) */}
      <mesh geometry={bodyGeom} material={bodyMat} castShadow receiveShadow />
      {/* Roof — SmartRoof picks among flat / stepped / mansard / barrel for
          office buildings. Hard-coded flat slab removed; rooftop PV/AC/
          railing below still layer on top of whatever shape was picked. */}
      <SmartRoof
        w={b.w}
        d={b.d}
        h={b.h}
        color={b.roofHex || '#3a4654'}
        kind={pickRoofKind('office', b.h, b.pos[0] * 7 + b.pos[1] * 11)}
        hasPV={b.hasPV}
      />

      {/* M6: classic + modern variant decoration now comes from the
          data-driven FacadeStack (see facadeVariants.tsx). Industrial
          still needs its inline decorator because its HVAC penthouse +
          corner posts + alternating balcony walkway pattern is macro
          structure, not a facade decoration. */}
      <FacadeStack b={b} />
      {isIndustrial && <IndustrialDecorations b={b} />}
      <OfficeShapeSignature b={b} />
      {/* Classic step-back crown is a macro structure (a smaller box on
          the roof), kept inline since it's not a facade primitive. */}
      {!isIndustrial && !isModern && b.h > 2.2 && (
        <group position={[0, b.h + 0.08, 0]}>
          <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[b.w * 0.7, 0.7, b.d * 0.7]} />
            <meshLambertMaterial color="#dfe5ed" />
          </mesh>
          <mesh position={[0, 0.74, 0]} castShadow>
            <boxGeometry args={[b.w * 0.72, 0.05, b.d * 0.72]} />
            <meshLambertMaterial color="#3a4654" />
          </mesh>
        </group>
      )}

      {/* roof AC unit (orthogonal — all variants honor it) */}
      {b.hasRoofUnit && (
        <group position={[b.w * 0.2, b.h + 0.18, b.d * 0.15]}>
          <mesh castShadow>
            <boxGeometry args={[b.w * 0.35, 0.22, b.d * 0.3]} />
            <meshLambertMaterial color="#8a96a6" />
          </mesh>
          <mesh position={[0, 0.15, 0]}>
            <boxGeometry args={[b.w * 0.3, 0.04, b.d * 0.25]} />
            <meshLambertMaterial color="#5a6878" />
          </mesh>
        </group>
      )}
      {/* Rooftop PV moved into SmartRoof so the panel lands on whatever
          slope/deck the chosen roof shape provides (instead of floating at
          a fixed y above pitched roofs). */}
      {/* roof railing (orthogonal) */}
      {b.hasRailing && (
        <>
          {[
            [b.w / 2 - 0.05, b.d / 2 - 0.05],
            [-b.w / 2 + 0.05, b.d / 2 - 0.05],
            [b.w / 2 - 0.05, -b.d / 2 + 0.05],
            [-b.w / 2 + 0.05, -b.d / 2 + 0.05]
          ].map(([x, z], i) => (
            <mesh key={i} position={[x, b.h + 0.14, z]}>
              <cylinderGeometry args={[0.02, 0.02, 0.16, 6]} />
              <meshLambertMaterial color="#3a4654" />
            </mesh>
          ))}
        </>
      )}
      {/* cyan smart-grid mid-seam (shared) */}
      {b.h > 1.5 && (
        <mesh position={[0, b.h * 0.5, b.d / 2 + 0.02]}>
          <planeGeometry args={[b.w * 0.92, 0.022]} />
          <meshLambertMaterial color="#000" emissive={ACCENT_CYAN} emissiveIntensity={0.7} />
        </mesh>
      )}
    </group>
  )
}

function OfficeShapeSignature({ b }: { b: BuildingDef }) {
  switch (b.shapeId) {
    case 'office-glass-tower':
      return (
        <>
          <mesh position={[0, b.h * 0.48, b.d / 2 + 0.012]}>
            <planeGeometry args={[b.w * 0.86, b.h * 0.74]} />
            <meshLambertMaterial color="#0e2440" emissive={ACCENT_CYAN} emissiveIntensity={0.18} transparent opacity={0.74} />
          </mesh>
          <mesh position={[0, 0.24, b.d / 2 + 0.11]} castShadow>
            <boxGeometry args={[b.w * 0.72, 0.16, 0.18]} />
            <meshLambertMaterial color="#dce5ec" />
          </mesh>
        </>
      )
    case 'office-business-center':
      return (
        <>
          <mesh position={[0, 0.24, b.d / 2 + 0.08]} castShadow receiveShadow>
            <boxGeometry args={[b.w * 1.05, 0.48, 0.18]} />
            <meshLambertMaterial color="#cfd8de" />
          </mesh>
          <mesh position={[0, 0.55, b.d / 2 + 0.18]}>
            <planeGeometry args={[b.w * 0.62, 0.08]} />
            <meshLambertMaterial color="#000" emissive={ACCENT_CYAN} emissiveIntensity={0.55} />
          </mesh>
        </>
      )
    case 'office-cowork-terrace':
      return (
        <>
          {[0.45, 0.68].map((ratio, i) => (
            <mesh key={i} position={[b.w * (i === 0 ? -0.18 : 0.18), b.h * ratio, b.d / 2 + 0.11]} castShadow>
              <boxGeometry args={[b.w * 0.45, 0.05, 0.22]} />
              <meshLambertMaterial color="#b9c7d4" />
            </mesh>
          ))}
          <mesh position={[0, b.h + 0.11, 0]} castShadow>
            <boxGeometry args={[b.w * 0.62, 0.08, b.d * 0.48]} />
            <meshLambertMaterial color="#9fb6ad" />
          </mesh>
        </>
      )
    case 'office-low-commercial':
      return (
        <>
          <mesh position={[0, 0.28, b.d / 2 + 0.12]} castShadow>
            <boxGeometry args={[b.w * 1.08, 0.16, 0.26]} />
            <meshLambertMaterial color="#e5ece8" />
          </mesh>
          {[-0.3, 0, 0.3].map((x, i) => (
            <mesh key={i} position={[b.w * x, 0.46, b.d / 2 + 0.26]}>
              <boxGeometry args={[0.035, 0.34, 0.035]} />
              <meshLambertMaterial color="#506472" />
            </mesh>
          ))}
        </>
      )
    case 'office-atrium-podium':
      return (
        <>
          <mesh position={[0, 0.32, b.d / 2 + 0.08]} castShadow receiveShadow>
            <boxGeometry args={[b.w * 1.06, 0.64, 0.2]} />
            <meshLambertMaterial color="#dce5ec" transparent opacity={0.86} />
          </mesh>
          <mesh position={[0, b.h * 0.56, b.d / 2 + 0.14]} castShadow>
            <boxGeometry args={[b.w * 0.52, 0.06, 0.22]} />
            <meshLambertMaterial color="#2f465c" />
          </mesh>
        </>
      )
    default:
      return null
  }
}

// Classic + modern variant decoration moved to facadeVariants.tsx (M6).
// Only industrial decoration stays as a local helper because its HVAC
// penthouse + corner posts pattern is macro structure, not facade detail.

// -----------------------------------------------------------------------------
// industrial — exterior steel-frame balconies + rooftop HVAC + corner posts
//
// This variant has more specific macro structure (HVAC penthouse, corner
// posts running full height, alternating side+front balconies) so most of
// its decoration stays inline. The library doesn't yet have a generic
// "balcony walkway around 3 facades" primitive — Apartment classic and
// Office industrial use slightly different patterns. Left for future
// consolidation if patterns converge.
// -----------------------------------------------------------------------------
function IndustrialDecorations({ b }: { b: BuildingDef }) {
  const balconySpacing = 0.7
  const balconyCount = Math.max(1, Math.floor((b.h - 0.4) / balconySpacing))
  return (
    <>
      {/* rooftop HVAC penthouse — body and trim lightened from near-black
          to mid grays so industrial offices don't have black blocks on top. */}
      <mesh position={[-b.w * 0.15, b.h + 0.22, -b.d * 0.05]} castShadow>
        <boxGeometry args={[b.w * 0.45, 0.4, b.d * 0.5]} />
        <meshLambertMaterial color="#7a8088" />
      </mesh>
      <mesh position={[-b.w * 0.15, b.h + 0.43, -b.d * 0.05]}>
        <boxGeometry args={[b.w * 0.4, 0.025, b.d * 0.45]} />
        <meshLambertMaterial color="#5a6470" />
      </mesh>
      {/* exterior balcony walkways: front + 2 sides */}
      {Array.from({ length: balconyCount }).map((_, i) => {
        const y = 0.4 + (i + 1) * balconySpacing
        if (y > b.h - 0.2) return null
        return (
          <group key={`bal-${i}`}>
            <mesh position={[0, y, b.d / 2 + 0.07]} castShadow>
              <boxGeometry args={[b.w * 0.94, 0.04, 0.16]} />
              <meshLambertMaterial color="#5a6878" />
            </mesh>
            <mesh position={[0, y + 0.13, b.d / 2 + 0.14]}>
              <boxGeometry args={[b.w * 0.94, 0.018, 0.018]} />
              <meshLambertMaterial color="#3a4654" />
            </mesh>
            <mesh position={[b.w / 2 + 0.07, y, 0]} castShadow>
              <boxGeometry args={[0.16, 0.04, b.d * 0.94]} />
              <meshLambertMaterial color="#5a6878" />
            </mesh>
            <mesh position={[-b.w / 2 - 0.07, y, 0]} castShadow>
              <boxGeometry args={[0.16, 0.04, b.d * 0.94]} />
              <meshLambertMaterial color="#5a6878" />
            </mesh>
          </group>
        )
      })}
      {/* 4 steel corner posts — lightened from #22354f (near-black) to
          mid slate so the posts read as steel structure not black bars. */}
      {[
        [b.w / 2 + 0.07, b.d / 2 + 0.07],
        [-b.w / 2 - 0.07, b.d / 2 + 0.07],
        [b.w / 2 + 0.07, -b.d / 2 - 0.07],
        [-b.w / 2 - 0.07, -b.d / 2 - 0.07]
      ].map(([x, z], i) => (
        <mesh key={`post-${i}`} position={[x, b.h / 2, z]} castShadow>
          <boxGeometry args={[0.045, b.h, 0.045]} />
          <meshLambertMaterial color="#5a6470" />
        </mesh>
      ))}
    </>
  )
}
