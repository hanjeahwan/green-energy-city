import * as THREE from 'three'
import { useMemo } from 'react'
import { tintedGeometry, flatGradMat } from '../../components/sceneMaterials'
import type { BuildingDef, ElementVariant } from '../types'
import { ACCENT_CYAN } from './catalog'
import { FacadeStack } from './facadeVariants'
import { SmartRoof, pickRoofKind } from './roofShapes'

// =============================================================================
// Apartment variants
//   classic    — per-floor balcony slabs (front + back) + cyan railings + window strips
//   modern     — glass tower: full glass facade + corner cyan accent every 3 floors
//   industrial — exterior corridor block: one open concrete walkway per floor
//                on the front facade + grid of small windows on back
// Shared: base outline, body box, roof slab, optional rooftop PV.
// =============================================================================

interface ApartmentFeatures {}

export const APARTMENT_VARIANTS: Record<string, ElementVariant<ApartmentFeatures>> = {
  classic:    { id: 'classic',    footprint: { halfW: 0.65, halfD: 0.85 } },
  modern:     { id: 'modern',     footprint: { halfW: 0.65, halfD: 0.85 } },
  industrial: { id: 'industrial', footprint: { halfW: 0.65, halfD: 0.85 } }
}

export function Apartment({ b }: { b: BuildingDef }) {
  const bodyGeom = useMemo(() => {
    const g = new THREE.BoxGeometry(b.w, b.h, b.d)
    g.translate(0, b.h / 2, 0)
    // tintedGeometry darkens the bottom of the box by `factor` — 0.55 meant
    // the building base read at ~55% of topHex intensity, which on
    // mid-toned blue-gray apartments produced a near-black ground floor.
    // 0.82 keeps a visible top-lit gradient without crushing the base.
    return tintedGeometry(g, b.topHex, 0.82)
  }, [b.w, b.h, b.d, b.topHex])
  const bodyMat = useMemo(() => flatGradMat({ roughness: 0.8 }), [])
  const floors = Math.max(2, Math.floor(b.h / 0.7))
  const isModern = b.variant === 'modern'
  const isIndustrial = b.variant === 'industrial'

  return (
    <group position={[b.pos[0], 0, b.pos[1]]} rotation={[0, b.rot, 0]}>
      {/* base outline rendered centrally by InstancedBuildingOutlines */}
      {/* body (shared) */}
      <mesh geometry={bodyGeom} material={bodyMat} castShadow receiveShadow />
      {/* Roof — SmartRoof picks flat / mansard / gable / hip / stepped per
          seed (see pickRoofKind apartment branch). Stubby apartments below
          1.8m stay flat or gable. Replaces the previous hardcoded flat box
          + the separate inline rooftop PV (PV now placed by SmartRoof on
          whatever surface fits the chosen roof shape). */}
      <SmartRoof
        w={b.w}
        d={b.d}
        h={b.h}
        color={b.roofHex || '#3a4654'}
        kind={pickRoofKind('apartment', b.h, b.pos[0] * 7 + b.pos[1] * 11)}
        hasPV={b.hasPV}
      />

      {isIndustrial ? (
        <IndustrialCorridorBlock b={b} floors={floors} />
      ) : isModern ? (
        <ModernGlassTower b={b} floors={floors} />
      ) : (
        <ClassicBalconyStack b={b} floors={floors} />
      )}
    </group>
  )
}

// -----------------------------------------------------------------------------
// Classic: per-floor balcony slabs + cyan railings + window strips behind balconies
// -----------------------------------------------------------------------------
function ClassicBalconyStack({ b, floors }: { b: BuildingDef; floors: number }) {
  // Clamp the WHOLE per-floor balcony cluster (slab + railing + window strip)
  // so the top floor stays beneath the roof line. Previous fix only moved
  // the window strip, which left the top-floor slab + railing at their
  // original y while the window dropped — visibly misaligned vs the lower
  // floors (user report: "和其它三个对比 不一致").
  //
  // Topmost point of the cluster = window-strip top edge = y + 0.1 + 0.14
  // = y + 0.24. Keep that <= b.h - 0.04 (4cm under roof) by clamping y.
  const Y_MAX = b.h - 0.28
  return (
    <>
      {Array.from({ length: floors }).map((_, f) => {
        const yRaw = ((f + 1) / floors) * b.h - 0.15
        const y = Math.min(yRaw, Y_MAX)
        return (
          <group key={f}>
            <mesh position={[0, y, b.d / 2 + 0.12]} castShadow>
              <boxGeometry args={[b.w * 0.8, 0.06, 0.24]} />
              <meshLambertMaterial color="#e0e6ec" />
            </mesh>
            <mesh position={[0, y + 0.13, b.d / 2 + 0.22]}>
              <boxGeometry args={[b.w * 0.8, 0.16, 0.02]} />
              <meshLambertMaterial
                color={ACCENT_CYAN}
                transparent
                opacity={0.55}
                emissive={ACCENT_CYAN}
                emissiveIntensity={0.15}
              />
            </mesh>
            <mesh position={[0, y + 0.1, b.d / 2 + 0.02]}>
              <planeGeometry args={[b.w * 0.78, 0.28]} />
              {/* Window strip behind balcony — mid blue-gray reads as tinted
                  glass. Always at y+0.1 relative to the cluster's clamped y,
                  so the strip stays aligned to its slab + railing. */}
              <meshLambertMaterial color="#8a9eb0" />
            </mesh>
          </group>
        )
      })}
    </>
  )
}

// -----------------------------------------------------------------------------
// Industrial: exterior open-corridor "deck access" block. One concrete walkway
// per floor strapped to the front facade with thin steel railings, plus a grid
// of small uniform windows on the back facade — utilitarian public-housing feel.
// -----------------------------------------------------------------------------
function IndustrialCorridorBlock({ b, floors }: { b: BuildingDef; floors: number }) {
  return (
    <>
      {/* front facade exterior corridors — one per floor */}
      {Array.from({ length: floors }).map((_, f) => {
        const y = ((f + 0.5) / floors) * b.h
        return (
          <group key={`corr-${f}`}>
            {/* corridor floor slab (deeper than balcony so it reads as walkway) */}
            <mesh position={[0, y, b.d / 2 + 0.1]} castShadow>
              <boxGeometry args={[b.w * 0.92, 0.05, 0.2]} />
              <meshLambertMaterial color="#9aa6b4" />
            </mesh>
            {/* top railing rail */}
            <mesh position={[0, y + 0.18, b.d / 2 + 0.195]}>
              <boxGeometry args={[b.w * 0.92, 0.02, 0.02]} />
              <meshLambertMaterial color="#3a4654" />
            </mesh>
            {/* mid railing rail */}
            <mesh position={[0, y + 0.09, b.d / 2 + 0.195]}>
              <boxGeometry args={[b.w * 0.92, 0.015, 0.015]} />
              <meshLambertMaterial color="#3a4654" />
            </mesh>
            {/* 5 narrow vertical balusters */}
            {[-0.4, -0.2, 0, 0.2, 0.4].map((xr, i) => (
              <mesh key={`bal-${i}`} position={[b.w * xr, y + 0.1, b.d / 2 + 0.195]}>
                <boxGeometry args={[0.012, 0.18, 0.012]} />
                <meshLambertMaterial color="#3a4654" />
              </mesh>
            ))}
            {/* unit doors behind corridor — was alternating near-black
                navy. Replaced with mid grays so doors read as steel/wood
                instead of voids. */}
            {[-0.3, 0, 0.3].map((xr, i) => (
              <mesh key={`door-${i}`} position={[b.w * xr, y + 0.13, b.d / 2 + 0.02]}>
                <planeGeometry args={[b.w * 0.18, 0.26]} />
                <meshLambertMaterial color={i % 2 === 0 ? '#8a8e94' : '#a0a4aa'} />
              </mesh>
            ))}
          </group>
        )
      })}
      {/* back facade — uniform 3-col window grid. Glass colour lightened
          from #22354f (near-black) to mid blue-gray so windows read as
          glass not voids. */}
      {Array.from({ length: floors }).map((_, f) => {
        const y = ((f + 0.5) / floors) * b.h
        return [-0.3, 0, 0.3].map((xr, i) => (
          <mesh key={`win-${f}-${i}`} position={[b.w * xr, y, -b.d / 2 - 0.02]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[b.w * 0.18, 0.24]} />
            <meshLambertMaterial color="#8a9eb0" />
          </mesh>
        ))
      })}
      {/* vertical service riser pipe on the right edge of the back facade */}
      <mesh position={[b.w / 2 - 0.06, b.h / 2, -b.d / 2 - 0.04]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, b.h * 0.95, 8]} />
        <meshLambertMaterial color="#5a6878" />
      </mesh>
    </>
  )
}

// -----------------------------------------------------------------------------
// Modern: full glass facade + corner cyan accent every 3 floors + (C7) vertical
// mullion grid + corner setback ledges + segmented balcony bays.
//
// Pre-C7: dark glass box + corner cyan squares + thin cyan band per 3rd floor.
// Post-C7:
//   - Vertical mullions every ~0.45m on front + back facades — gives the
//     "glass-curtain-with-frames" reading of real modern apartment towers.
//   - Corner setback ledges at each cyan-band height — small horizontal
//     shelf sticking out from each corner, reads as "split-level" facade.
//   - Segmented balcony bays at every 4th floor on the front — 3 small
//     glass-railing bays per row, giving a "live-here" residential feel.
// -----------------------------------------------------------------------------
function ModernGlassTower({ b, floors }: { b: BuildingDef; floors: number }) {
  return (
    <>
      {/* M6: glass curtain + vertical mullions + balconies come from the
          data-driven FacadeStack (see facadeVariants.tsx). */}
      <FacadeStack b={b} />

      {/* corner cyan accent bands every 3rd floor — wraps around 4 corners */}
      {Array.from({ length: floors }).map((_, f) => {
        if ((f + 1) % 3 !== 0) return null
        const y = ((f + 1) / floors) * b.h - 0.08
        // 4 small cyan corner squares at this height
        return (
          <group key={`acc-${f}`} position={[0, y, 0]}>
            {[
              [b.w / 2 + 0.02, 0, b.d / 2 + 0.02],
              [-b.w / 2 - 0.02, 0, b.d / 2 + 0.02],
              [b.w / 2 + 0.02, 0, -b.d / 2 - 0.02],
              [-b.w / 2 - 0.02, 0, -b.d / 2 - 0.02]
            ].map((p, i) => (
              <mesh key={i} position={p as [number, number, number]}>
                <boxGeometry args={[0.06, 0.18, 0.06]} />
                <meshLambertMaterial color="#000" emissive={ACCENT_CYAN} emissiveIntensity={1.4} />
              </mesh>
            ))}
            {/* C7 corner setback ledges — small horizontal shelves at each corner */}
            {[
              [b.w / 2 + 0.02, 0, b.d / 2 + 0.02],
              [-b.w / 2 - 0.02, 0, b.d / 2 + 0.02],
              [b.w / 2 + 0.02, 0, -b.d / 2 - 0.02],
              [-b.w / 2 - 0.02, 0, -b.d / 2 - 0.02]
            ].map((p, i) => (
              <mesh key={`ledge-${i}`} position={p as [number, number, number]}>
                <boxGeometry args={[0.18, 0.025, 0.18]} />
                {/* Corner ledge accent — lightened from #22354f (near-black)
                    to mid slate so it reads as architectural trim. */}
                <meshLambertMaterial color="#5a6470" />
              </mesh>
            ))}
            {/* thin cyan band running around 4 facades */}
            <mesh position={[0, 0, b.d / 2 + 0.02]}>
              <planeGeometry args={[b.w + 0.02, 0.04]} />
              <meshLambertMaterial color="#000" emissive={ACCENT_CYAN} emissiveIntensity={0.9} />
            </mesh>
            <mesh position={[0, 0, -b.d / 2 - 0.02]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[b.w + 0.02, 0.04]} />
              <meshLambertMaterial color="#000" emissive={ACCENT_CYAN} emissiveIntensity={0.9} />
            </mesh>
            <mesh position={[b.w / 2 + 0.02, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <planeGeometry args={[b.d + 0.02, 0.04]} />
              <meshLambertMaterial color="#000" emissive={ACCENT_CYAN} emissiveIntensity={0.9} />
            </mesh>
            <mesh position={[-b.w / 2 - 0.02, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
              <planeGeometry args={[b.d + 0.02, 0.04]} />
              <meshLambertMaterial color="#000" emissive={ACCENT_CYAN} emissiveIntensity={0.9} />
            </mesh>
          </group>
        )
      })}
    </>
  )
}
