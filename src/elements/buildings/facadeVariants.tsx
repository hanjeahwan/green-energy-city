// =============================================================================
// FACADES_BY_VARIANT — variant decoration as data (M6).
//
// Pre-M6, each building renderer branched on `b.variant` and rendered a
// different JSX subtree per variant. After M2-M5 the inline mesh-spam was
// replaced with <Facade*/> library calls, but the BRANCHING was still
// React code: `isModern ? <ModernDecorations/> : <ClassicDecorations/>`.
//
// M6 collapses that branching into a data table. Each (type, variant)
// combination has a list of facade specs. The renderer doesn't care which
// variant it has — it just calls FacadeStack with the building, which
// looks up the specs and dispatches to the right library primitive.
//
// Scope honest: only variants whose decoration is PURE FACADE work this
// way. Variants with macro structure baked in (e.g. Factory classic's H2
// tanks, House modern's pitched roof, Office industrial's HVAC pent +
// corner posts) keep their inline decorators — those structures aren't
// facade decorations, they're building geometry.
//
// Coverage:
//   office classic + office modern              ✓ pure facade
//   skyscraper modern (decoration only — crown + accents)  ✓
//   apartment modern (mullions + glass + balconies)        ✓
//   warehouse classic (LED bands)                          ✓
// Everything else: stays inline in the renderer. Future variants whose
// decoration matches existing primitives can opt in by adding a table
// entry instead of writing a React decorator.
// =============================================================================

import type { ReactNode } from 'react'
import type { BuildingDef } from '../types'
import {
  FacadeWindows,
  FacadeCornices,
  FacadeMullions,
  FacadeGlassCurtain,
  FacadeEmissiveBands,
  FacadeCornerAccents,
  FacadeBalconies,
  FacadePortal
} from './facade'

// -----------------------------------------------------------------------------
// FacadeSpec — discriminated union of all supported decoration kinds.
//
// `props` is the per-spec override; building dimensions (w, d, h) are NOT
// in props — they're injected by FacadeStack from the BuildingDef so the
// table stays building-agnostic.
// -----------------------------------------------------------------------------

type DropDims<T> = Omit<T, 'w' | 'd' | 'h'>

type FacadeWindowsSpec     = { kind: 'windows';        props?: DropDims<Parameters<typeof FacadeWindows>[0]> }
type FacadeCornicesSpec    = { kind: 'cornices';       props?: DropDims<Parameters<typeof FacadeCornices>[0]> }
type FacadeMullionsSpec    = { kind: 'mullions';       props:  DropDims<Parameters<typeof FacadeMullions>[0]> }
type FacadeGlassSpec       = { kind: 'glass-curtain';  props?: DropDims<Parameters<typeof FacadeGlassCurtain>[0]> }
type FacadeEmissiveSpec    = { kind: 'emissive-bands'; props?: DropDims<Parameters<typeof FacadeEmissiveBands>[0]> }
type FacadeCornerSpec      = { kind: 'corner-accents'; props?: DropDims<Parameters<typeof FacadeCornerAccents>[0]> }
type FacadeBalconiesSpec   = { kind: 'balconies';      props:  DropDims<Parameters<typeof FacadeBalconies>[0]> }
type FacadePortalSpec      = { kind: 'portal';         props?: DropDims<Parameters<typeof FacadePortal>[0]> }

export type FacadeSpec =
  | FacadeWindowsSpec
  | FacadeCornicesSpec
  | FacadeMullionsSpec
  | FacadeGlassSpec
  | FacadeEmissiveSpec
  | FacadeCornerSpec
  | FacadeBalconiesSpec
  | FacadePortalSpec

// -----------------------------------------------------------------------------
// getFacadeSpecs(b) — returns the spec list for a building.
//
// Returns [] for variants that keep their decoration inline (Office
// industrial, Apartment classic+industrial, Skyscraper classic+industrial,
// Warehouse modern+industrial, Factory all, House all). The renderer keeps
// its inline decorator JSX for those; FacadeStack rendering an empty list
// just renders nothing.
// -----------------------------------------------------------------------------

export function getFacadeSpecs(b: BuildingDef): FacadeSpec[] {
  const key = `${b.type}_${b.variant}`

  switch (key) {
    case 'office_classic':
      return [
        { kind: 'windows' },
        { kind: 'cornices' },
        ...(b.h > 1.5 ? [{ kind: 'portal' as const } satisfies FacadePortalSpec] : [])
      ]

    case 'office_modern': {
      const mullionCount = Math.max(1, Math.floor((b.h - 0.3) / 0.45))
      return [
        // Glass curtain was #142844 (near-black navy) — same problem the
        // apartment had, modern office buildings reading as black boxes.
        // Mid blue-gray glass shows topHex through.
        { kind: 'glass-curtain', props: { color: '#8a9eb0', opacity: 0.55, metalness: 0.5 } },
        {
          kind: 'mullions',
          props: {
            direction: 'horizontal',
            count: mullionCount,
            facades: ['front', 'back', 'left', 'right'],
            color: '#9aa6b4',
            thickness: 0.02
          }
        }
      ]
    }

    case 'skyscraper_modern': {
      const mullionCount = Math.max(1, Math.floor((b.h - 0.5) / 1.5))
      return [
        {
          kind: 'corner-accents',
          props: {
            offsetFrac: 0.86,
            thickness: 0.04,
            segments: 3,
            gapFrac: 0.05,
            intensity: 0.9
          }
        },
        {
          kind: 'mullions',
          props: {
            direction: 'horizontal',
            count: mullionCount,
            facades: ['front', 'back'],
            color: '#9aa6b4',
            thickness: 0.025
          }
        }
      ]
      // Note: the 3-tier crown ring stays inline in Skyscraper.tsx
      // (modern-specific macro tied to the tapered body width).
    }

    case 'apartment_modern': {
      const mullionCount = Math.max(2, Math.floor(b.w / 0.45)) + 1
      const floors = Math.max(2, Math.floor(b.h / 0.7))
      const balconyRows: number[] = []
      for (let f = 3; f < floors; f += 4) balconyRows.push(((f + 0.5) / floors) * b.h)
      return [
        // Glass curtain was #1a2c44 (near-black navy) at 0.88 opacity —
        // it almost fully covered the apartment body and made the whole
        // building read as black from any distance, even though topHex is
        // a light blue-gray. Switched to mid blue-gray glass with lower
        // opacity so the body colour shows through.
        { kind: 'glass-curtain', props: { color: '#8a9eb0', opacity: 0.55, metalness: 0.5 } },
        {
          kind: 'mullions',
          props: {
            direction: 'vertical',
            count: mullionCount,
            facades: ['front', 'back'],
            color: '#5a6878',
            thickness: 0.025,
            heightFraction: 0.88,
            metalness: 0.4
          }
        },
        {
          kind: 'balconies',
          props: {
            rows: balconyRows,
            bayCount: 3,
            facade: 'front'
          }
        }
      ]
      // Corner cyan accent bands every 3rd floor stay inline (a per-3-floor
      // strip wrapping 4 facades doesn't yet match a library primitive).
    }

    case 'warehouse_classic':
      return [
        {
          kind: 'emissive-bands',
          props: {
            bandRatios: [0.3, 0.55, 0.8],
            intensity: 1.4
          }
        }
      ]

    default:
      return []
  }
}

// -----------------------------------------------------------------------------
// FacadeStack — dispatcher React component.
//
// Calls getFacadeSpecs(b) and renders each spec via the matching library
// primitive. Building dimensions (w, d, h) are injected here so the table
// stays building-agnostic.
// -----------------------------------------------------------------------------

export function FacadeStack({ b }: { b: BuildingDef }): ReactNode {
  const specs = getFacadeSpecs(b)
  return (
    <>
      {specs.map((spec, i) => {
        const key = `${spec.kind}-${i}`
        switch (spec.kind) {
          case 'windows':
            return <FacadeWindows key={key} w={b.w} d={b.d} h={b.h} {...spec.props} />
          case 'cornices':
            return <FacadeCornices key={key} w={b.w} d={b.d} h={b.h} {...spec.props} />
          case 'mullions':
            return <FacadeMullions key={key} w={b.w} d={b.d} h={b.h} {...spec.props} />
          case 'glass-curtain':
            return <FacadeGlassCurtain key={key} w={b.w} d={b.d} h={b.h} {...spec.props} />
          case 'emissive-bands':
            return <FacadeEmissiveBands key={key} w={b.w} d={b.d} h={b.h} {...spec.props} />
          case 'corner-accents':
            return <FacadeCornerAccents key={key} w={b.w} d={b.d} h={b.h} {...spec.props} />
          case 'balconies':
            return <FacadeBalconies key={key} w={b.w} d={b.d} h={b.h} {...spec.props} />
          case 'portal':
            return <FacadePortal key={key} w={b.w} d={b.d} h={b.h} {...spec.props} />
        }
      })}
    </>
  )
}
