import * as THREE from 'three'
import { useMemo } from 'react'
import { tintedGeometry, flatGradMat } from '../../components/sceneMaterials'
import type { BuildingDef, ElementVariant } from '../types'
import { ACCENT_CYAN } from './catalog'
import { FacadeCornices } from './facade'
import { SmartRoof, pickRoofKind } from './roofShapes'
import { FacadeStack } from './facadeVariants'

// =============================================================================
// Skyscraper variants
//   classic    — tall slim box + stacked floor banding (Runjian-style)
//   modern     — tapered tower: narrows to 0.7× width at top + 4 corner cyan accent strips
//   industrial — art-deco shaft: classic box body + 3-tier stepped spire crown
//                + thick decorative mid waist belt
//
// C6: all three variants gain a three-band silhouette via shared overlays:
//   * PODIUM (~0.18 * h tall, ~1.12× footprint, slate base)   sits at ground
//   * BODY   (existing variant geometry, untouched)            fills the middle
//   * CROWN  (~0.10 * h tall, ~0.82× footprint, slate cap)     sits at the top
// This gives the CBD skyline real "base / shaft / cap" reading instead of
// the previous uniform-box silhouette. BuildingDef schema is unchanged —
// all bands derived from b.h, b.w, b.d. Only Skyscraper.tsx changes.
//
// Shared: base outline, roof slab, optional rooftop AC (h>9), aviation light (h>10), mid-seam.
// =============================================================================

interface SkyscraperFeatures {}

export const SKYSCRAPER_VARIANTS: Record<string, ElementVariant<SkyscraperFeatures>> = {
  classic:    { id: 'classic',    footprint: { halfW: 0.8, halfD: 0.8 } },
  modern:     { id: 'modern',     footprint: { halfW: 0.8, halfD: 0.8 } },
  industrial: { id: 'industrial', footprint: { halfW: 0.8, halfD: 0.8 } }
}

export function Skyscraper({ b }: { b: BuildingDef }) {
  const isModern = b.variant === 'modern'
  const isIndustrial = b.variant === 'industrial'
  // Industrial variant uses the classic box body, not the modern taper.
  const useModernBody = isModern

  // Classic body = full box. Modern body = 4-sided cylinder tapered (top 70% of base width).
  const classicGeom = useMemo(() => {
    const g = new THREE.BoxGeometry(b.w, b.h, b.d)
    g.translate(0, b.h / 2, 0)
    // 0.55 → 0.82: the bottom-of-box vertex tint dragged tall towers'
    // bases into near-black. 0.82 keeps a visible top-lit gradient
    // without the dark plinth effect.
    return tintedGeometry(g, b.topHex, 0.82)
  }, [b.w, b.h, b.d, b.topHex])

  const modernGeom = useMemo(() => {
    // 4-sided cylinder = square prism; radii are half-diagonals.
    // Bottom: full b.w → radius = b.w / √2. Top: 70% → radius = (b.w * 0.7) / √2.
    const r = Math.SQRT1_2
    const g = new THREE.CylinderGeometry((b.w * 0.7) * r, b.w * r, b.h, 4, 1)
    g.translate(0, b.h / 2, 0)
    g.rotateY(Math.PI / 4) // align flat faces to ±X/±Z
    return tintedGeometry(g, b.topHex, 0.82)
  }, [b.w, b.h, b.topHex])

  const bodyMat = useMemo(() => flatGradMat({ roughness: 0.75 }), [])
  const floors = Math.max(2, Math.floor(b.h / 1.0))

  return (
    <group position={[b.pos[0], 0, b.pos[1]]} rotation={[0, b.rot, 0]}>
      {/* base outline rendered centrally by InstancedBuildingOutlines */}

      {/* ---- C6 Podium: wider plinth at the base ---- */}
      {/* Sits on the ground, encases the lower 18% of the body. Slightly
          wider (1.12×) and a darker slate material so it reads as a
          distinct entrance-level base instead of part of the shaft. */}
      <SkyscraperPodium b={b} />

      {/* body (variant-specific geometry, full b.h tall) */}
      <mesh geometry={useModernBody ? modernGeom : classicGeom} material={bodyMat} castShadow receiveShadow />

      {/* ---- C6 Crown: narrower setback cap at the top ---- */}
      {/* Sits at the top 10% of the body, narrower (0.82×) than the shaft so
          you read it as a setback / cap. Modern + industrial already have
          their own top elements (corner accents / spire) — the crown
          overlays cleanly under them. */}
      <SkyscraperCrown b={b} useModernBody={useModernBody} />
      {/* Roof — SmartRoof picks flat / stepped / barrel for skyscrapers
          (no pitched roofs on towers). Modern body tapers 0.72×, so we
          shrink the cluster w/d to match the cap dimension. */}
      <SmartRoof
        w={(useModernBody ? b.w * 0.72 : b.w)}
        d={(useModernBody ? b.d * 0.72 : b.d)}
        h={b.h}
        color={b.roofHex || '#3a4654'}
        kind={pickRoofKind('skyscraper', b.h, b.pos[0] * 7 + b.pos[1] * 11)}
        hasPV={b.hasPV}
      />

      {isIndustrial ? (
        <IndustrialArtDeco b={b} floors={floors} />
      ) : isModern ? (
        <ModernCornerAccents b={b} />
      ) : (
        <ClassicFloorBanding b={b} floors={floors} />
      )}
      <HighResidentialSignature b={b} />

      {/* rooftop AC unit for tallest (shared, h > 9) */}
      {b.h > 9 && (
        <mesh
          position={[
            (useModernBody ? b.w * 0.7 : b.w) * 0.15,
            b.h + 0.15,
            (useModernBody ? b.d * 0.7 : b.d) * 0.15
          ]}
          castShadow
        >
          <boxGeometry args={[
            (useModernBody ? b.w * 0.7 : b.w) * 0.3,
            0.2,
            (useModernBody ? b.d * 0.7 : b.d) * 0.3
          ]} />
          <meshLambertMaterial color="#5a6878" />
        </mesh>
      )}
      {/* aviation warning light (shared, h > 10) */}
      {b.h > 10 && (
        <mesh position={[0, b.h + 0.3, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshLambertMaterial emissive={ACCENT_CYAN} emissiveIntensity={2.5} color="#000" />
        </mesh>
      )}
      {/* mid-height cyan accent line (shared) */}
      {b.h > 4 && (
        <mesh position={[0, b.h / 2, b.d / 2 + 0.02]}>
          <planeGeometry args={[b.w * 0.92, 0.025]} />
          <meshLambertMaterial color="#000" emissive={ACCENT_CYAN} emissiveIntensity={0.8} />
        </mesh>
      )}
    </group>
  )
}

function HighResidentialSignature({ b }: { b: BuildingDef }) {
  switch (b.shapeId) {
    case 'high-sky-garden-tower':
      // Was: 2 setback floors with sage slabs + green planter strip. Per
      // user request the rooftop greening is removed; keep the slab ledges
      // (they read as architectural setbacks) and drop the green planter.
      return (
        <>
          {[0.34, 0.62].map((ratio, i) => (
            <mesh key={i} position={[0, b.h * ratio, 0]} castShadow>
              <boxGeometry args={[b.w * 1.08, 0.06, b.d * 1.08]} />
              <meshLambertMaterial color="#b9c7d4" />
            </mesh>
          ))}
        </>
      )
    case 'high-stepped-luxury-tower':
      return (
        <>
          {[0.52, 0.7, 0.84].map((ratio, i) => (
            <mesh key={i} position={[0, b.h * ratio, b.d / 2 + 0.06]} castShadow>
              <boxGeometry args={[b.w * (0.86 - i * 0.12), 0.045, 0.12]} />
              <meshLambertMaterial color="#dce5ec" />
            </mesh>
          ))}
        </>
      )
    case 'high-balcony-spine-tower':
      return (
        <>
          <mesh position={[b.w / 2 + 0.05, b.h * 0.5, b.d / 2 + 0.03]} castShadow>
            <boxGeometry args={[0.12, b.h * 0.7, 0.12]} />
            <meshLambertMaterial color="#b9c7d4" />
          </mesh>
          {Array.from({ length: 5 }).map((_, i) => (
            <mesh key={i} position={[b.w / 2 + 0.09, b.h * (0.24 + i * 0.13), b.d / 2 + 0.09]} castShadow>
              <boxGeometry args={[0.18, 0.035, 0.18]} />
              <meshLambertMaterial color="#edf3f7" />
            </mesh>
          ))}
        </>
      )
    case 'high-terrace-crown-tower':
      // Crown terrace kept; the small green planter strip on it removed
      // alongside the rest of the rooftop greening.
      return (
        <mesh position={[0, b.h + 0.16, 0]} castShadow>
          <boxGeometry args={[b.w * 0.72, 0.22, b.d * 0.72]} />
          <meshLambertMaterial color="#506472" />
        </mesh>
      )
    case 'high-twin-slim-tower':
      return (
        <>
          <mesh position={[b.w * 0.42, b.h * 0.47, 0]} castShadow receiveShadow>
            <boxGeometry args={[b.w * 0.46, b.h * 0.82, b.d * 0.72]} />
            <meshLambertMaterial color={b.topHex} />
          </mesh>
          <mesh position={[b.w * 0.2, b.h * 0.62, b.d / 2 + 0.04]} castShadow>
            <boxGeometry args={[b.w * 0.44, 0.055, 0.12]} />
            <meshLambertMaterial color="#2f465c" />
          </mesh>
        </>
      )
    default:
      return null
  }
}

// -----------------------------------------------------------------------------
// Classic: stacked floor bands every ~1m — now via FacadeCornices.
// -----------------------------------------------------------------------------
function ClassicFloorBanding({ b, floors }: { b: BuildingDef; floors: number }) {
  // Match pre-M3 spacing — `b.h / (floors + 0.5)` → ~1m gaps. The library
  // primitive starts at startY and steps by spacing; we mirror those numbers.
  const spacing = b.h / (floors + 0.5)
  return (
    <FacadeCornices
      w={b.w}
      d={b.d}
      h={b.h}
      spacing={spacing}
      startY={spacing}
      thickness={0.05}
      outset={0.0075}
      color="#9aa6b4"
    />
  )
}

// -----------------------------------------------------------------------------
// Industrial: art-deco shaft. Reuses the classic box body but layers a 3-step
// stepped spire on the roof and a thick decorative belt at mid-height with
// 4 setback corner notches. Reads as a "deco skyscraper" silhouette from far
// away, while staying within the cool palette (steel + slate, no gold).
// -----------------------------------------------------------------------------
function IndustrialArtDeco({ b, floors }: { b: BuildingDef; floors: number }) {
  const spireBaseW = b.w * 0.55
  const spireBaseD = b.d * 0.55
  const spacing = b.h / (floors + 0.5)
  return (
    <>
      {/* floor banding inherited from classic look (thinner so deco belt reads).
          M3: ports to FacadeCornices with the thinner industrial profile. */}
      <FacadeCornices
        w={b.w}
        d={b.d}
        h={b.h}
        spacing={spacing}
        startY={spacing}
        thickness={0.035}
        outset={0.006}
        color="#9aa6b4"
      />
      {/* thick decorative belt at mid-height — 3 stacked tiers */}
      <group position={[0, b.h * 0.5, 0]}>
        <mesh position={[0, -0.08, 0]}>
          <boxGeometry args={[b.w + 0.05, 0.06, b.d + 0.05]} />
          <meshLambertMaterial color="#3a4654" />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[b.w + 0.08, 0.12, b.d + 0.08]} />
          <meshLambertMaterial color="#5a6878" />
        </mesh>
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[b.w + 0.05, 0.06, b.d + 0.05]} />
          <meshLambertMaterial color="#3a4654" />
        </mesh>
        {/* cyan emissive stripe in the belt's middle tier */}
        <mesh position={[0, 0, b.d / 2 + 0.045]}>
          <planeGeometry args={[b.w * 0.85, 0.04]} />
          <meshLambertMaterial color="#000" emissive={ACCENT_CYAN} emissiveIntensity={0.9} />
        </mesh>
        <mesh position={[0, 0, -b.d / 2 - 0.045]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[b.w * 0.85, 0.04]} />
          <meshLambertMaterial color="#000" emissive={ACCENT_CYAN} emissiveIntensity={0.9} />
        </mesh>
      </group>

      {/* 3-tier stepped spire crown on roof */}
      <group position={[0, b.h + 0.06, 0]}>
        {/* tier 1 — widest, shortest */}
        <mesh position={[0, 0.15, 0]} castShadow>
          <boxGeometry args={[spireBaseW, 0.3, spireBaseD]} />
          <meshLambertMaterial color="#7a8a9a" />
        </mesh>
        {/* tier 2 */}
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[spireBaseW * 0.72, 0.3, spireBaseD * 0.72]} />
          <meshLambertMaterial color="#8898a8" />
        </mesh>
        {/* tier 3 — narrowest */}
        <mesh position={[0, 0.72, 0]} castShadow>
          <boxGeometry args={[spireBaseW * 0.45, 0.24, spireBaseD * 0.45]} />
          <meshLambertMaterial color="#98a4b4" />
        </mesh>
        {/* central thin spire needle */}
        <mesh position={[0, 1.0, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.05, 0.5, 8]} />
          <meshLambertMaterial color="#5a6878" />
        </mesh>
        {/* cyan beacon orb on top of needle */}
        <mesh position={[0, 1.28, 0]}>
          <sphereGeometry args={[0.05, 10, 10]} />
          <meshLambertMaterial color="#000" emissive={ACCENT_CYAN} emissiveIntensity={2.5} />
        </mesh>
        {/* 4 thin vertical fins around tier 1 — deco rib pattern */}
        {[
          [spireBaseW / 2 + 0.012, 0, 0] as [number, number, number],
          [-spireBaseW / 2 - 0.012, 0, 0],
          [0, 0, spireBaseD / 2 + 0.012],
          [0, 0, -spireBaseD / 2 - 0.012]
        ].map((p, i) => (
          <mesh key={`fin-${i}`} position={[p[0], 0.15, p[2]]}>
            <boxGeometry args={[i < 2 ? 0.025 : spireBaseW * 0.15, 0.34, i < 2 ? spireBaseD * 0.15 : 0.025]} />
            <meshLambertMaterial color="#3a4654" />
          </mesh>
        ))}
      </group>
    </>
  )
}

// -----------------------------------------------------------------------------
// Modern: corner cyan + mullion bands + crown ring (C7 facade upgrade)
//
// Pre-C7: 4 full-height cyan corner strips + a thin top cap band.
// Post-C7:
//   - Corner cyan is broken into 3 segments per corner (bottom / middle /
//     top), with darker "gap" zones between, giving the deco "broken line"
//     reading instead of a uniform tube.
//   - Horizontal mullion strips at every ~1.5m on each facade — adds the
//     "glass-curtain-with-floor-divisions" silhouette of real modern
//     office towers.
//   - Crown ring upgraded to a 3-tier emissive setback at the top.
// -----------------------------------------------------------------------------
function ModernCornerAccents({ b }: { b: BuildingDef }) {
  // M6: corner cyan + horizontal mullions come from FacadeStack via the
  // facadeVariants data table. Only the 3-tier emissive crown ring stays
  // inline (macro structure tied to the tapered body width).
  return (
    <>
      <FacadeStack b={b} />
      <group position={[0, b.h - 0.1, 0]}>
        {/* Modern crown ring trim — was near-black; mid slate now so the
            ring under the emissive cyan band doesn't read as a black halo. */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[b.w * 0.74 + 0.04, 0.04, b.d * 0.74 + 0.04]} />
          <meshLambertMaterial color="#5a6470" />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[b.w * 0.72 + 0.04, 0.04, b.d * 0.72 + 0.04]} />
          <meshLambertMaterial color="#000" emissive={ACCENT_CYAN} emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[0, 0.10, 0]}>
          <boxGeometry args={[b.w * 0.65 + 0.04, 0.03, b.d * 0.65 + 0.04]} />
          <meshLambertMaterial color="#6a7078" />
        </mesh>
      </group>
    </>
  )
}

// -----------------------------------------------------------------------------
// C6 Podium — wider plinth at building base
// -----------------------------------------------------------------------------
function SkyscraperPodium({ b }: { b: BuildingDef }) {
  const podiumH = b.h * 0.18
  const podiumW = b.w * 1.12
  const podiumD = b.d * 1.12
  return (
    <group position={[0, podiumH / 2, 0]}>
      {/* podium body — was #3a4654 (near-black slate); user reported the
          4 CBD towers all had black bases. Mid cool gray now so the podium
          still reads distinct from the shaft but doesn't look like a void. */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[podiumW, podiumH, podiumD]} />
        <meshLambertMaterial color="#7a8088" />
      </mesh>
      {/* top trim — was #22354f; mid slate so the seam still reads but the
          band isn't a black ring at every podium top. */}
      <mesh position={[0, podiumH / 2 + 0.01, 0]}>
        <boxGeometry args={[podiumW + 0.02, 0.03, podiumD + 0.02]} />
        <meshLambertMaterial color="#5a6470" />
      </mesh>
      {/* cyan entrance-level accent strip across the front */}
      <mesh position={[0, podiumH * 0.25, podiumD / 2 + 0.02]}>
        <planeGeometry args={[podiumW * 0.7, podiumH * 0.12]} />
        <meshLambertMaterial color="#000" emissive={ACCENT_CYAN} emissiveIntensity={0.9} />
      </mesh>
    </group>
  )
}

// -----------------------------------------------------------------------------
// C6 Crown — narrower setback cap at building top
// -----------------------------------------------------------------------------
function SkyscraperCrown({ b, useModernBody }: { b: BuildingDef; useModernBody: boolean }) {
  const crownH = b.h * 0.10
  // Crown sits centered on the body's narrowing — for modern (tapered) body
  // we use the top width (0.7×); for classic/industrial we apply a setback.
  const shaftTopW = useModernBody ? b.w * 0.7 : b.w
  const shaftTopD = useModernBody ? b.d * 0.7 : b.d
  const crownW = shaftTopW * 0.82
  const crownD = shaftTopD * 0.82
  // Crown center sits at b.h - crownH/2 so the cap finishes flush with the
  // body top.
  return (
    <group position={[0, b.h - crownH / 2, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[crownW, crownH, crownD]} />
        <meshLambertMaterial color="#5a6878" />
      </mesh>
      {/* trim ring around the setback shoulder — was #22354f near-black;
          mid slate keeps the seam visible without dark band on every crown. */}
      <mesh position={[0, -crownH / 2 - 0.01, 0]}>
        <boxGeometry args={[crownW + 0.04, 0.03, crownD + 0.04]} />
        <meshLambertMaterial color="#5a6470" />
      </mesh>
    </group>
  )
}
