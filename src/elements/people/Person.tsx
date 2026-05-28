import { BaseShadowDisc } from '../../components/scenePrimitives'
import { personJitter } from './jitter'
import {
  SolarEngineer,
  WindTech,
  EVMechanic,
  DroneOperator,
  Commander,
  SafetyGuard,
  ShowroomGuide,
  RepairTech,
  DispatchOperator,
  GridInspector,
} from './variants'
import type { ElementVariant } from '../types'
import { ALL_PERSON_VARIANTS, type PersonVariant } from './types'
export type { PersonVariant } from './types'

// =============================================================================
// Person — dispatcher for 10 Lego-minifigure-style technician roles.
//
// The variant geometry lives in `variants.tsx`; the shared body builder lives
// in `LegoBody.tsx`; per-instance jitter (shoe / skin / accent) lives in
// `jitter.ts`. This file is just the registry + dispatch switch so the public
// API (Person, PersonVariant, PERSON_VARIANTS, ALL_PERSON_VARIANTS) stays
// unchanged for callers in People.tsx / generators / operator placements.
// =============================================================================

interface PersonFeatures {
  /** Phase 4+ may add per-role tuning here; empty for Phase 3. */
}

export const PERSON_VARIANTS: Record<PersonVariant, ElementVariant<PersonFeatures>> = {
  'solar-engineer':    { id: 'solar-engineer',    footprint: { halfW: 0.1, halfD: 0.1 } },
  'wind-tech':         { id: 'wind-tech',         footprint: { halfW: 0.1, halfD: 0.1 } },
  'ev-mechanic':       { id: 'ev-mechanic',       footprint: { halfW: 0.1, halfD: 0.1 } },
  'drone-operator':    { id: 'drone-operator',    footprint: { halfW: 0.1, halfD: 0.1 } },
  'commander':         { id: 'commander',         footprint: { halfW: 0.1, halfD: 0.1 } },
  'safety-guard':      { id: 'safety-guard',      footprint: { halfW: 0.1, halfD: 0.1 } },
  'showroom-guide':    { id: 'showroom-guide',    footprint: { halfW: 0.1, halfD: 0.1 } },
  'repair-tech':       { id: 'repair-tech',       footprint: { halfW: 0.1, halfD: 0.1 } },
  'dispatch-operator': { id: 'dispatch-operator', footprint: { halfW: 0.1, halfD: 0.1 } },
  'grid-inspector':    { id: 'grid-inspector',    footprint: { halfW: 0.1, halfD: 0.1 } },
}

export { ALL_PERSON_VARIANTS }

export function Person({
  position,
  rot = 0,
  variant,
  accentSeed = 0,
}: {
  position: [number, number, number]
  rot?: number
  variant: PersonVariant
  accentSeed?: number
}) {
  const jitter = personJitter(accentSeed)
  return (
    <group position={position} rotation={[0, rot, 0]}>
      <BaseShadowDisc position={[0, 0.005, 0]} radius={0.1} opacity={0.4} />
      {variant === 'solar-engineer'    && <SolarEngineer    {...jitter} />}
      {variant === 'wind-tech'         && <WindTech         {...jitter} />}
      {variant === 'ev-mechanic'       && <EVMechanic       {...jitter} />}
      {variant === 'drone-operator'    && <DroneOperator    {...jitter} />}
      {variant === 'commander'         && <Commander        {...jitter} />}
      {variant === 'safety-guard'      && <SafetyGuard      {...jitter} />}
      {variant === 'showroom-guide'    && <ShowroomGuide    {...jitter} />}
      {variant === 'repair-tech'       && <RepairTech       {...jitter} />}
      {variant === 'dispatch-operator' && <DispatchOperator {...jitter} />}
      {variant === 'grid-inspector'    && <GridInspector    {...jitter} />}
    </group>
  )
}
