// =============================================================================
// Status derivation — turn the events feed into facility status colors.
//
// Pure module (no three.js). Imported by CityScene.tsx callsites so that
// changing the events array in src/data.ts automatically retints the
// corresponding facility's StatusRing.
//
// Matching rule: an event "belongs to" facilityId if its `src` equals
// facilityId exactly, OR starts with `facilityId + ' '` (so "PS-02 PENANG"
// matches "PS-02"). Among matches, the highest-severity level wins.
//
// INFO is treated as 'ok' visually — informational pings don't justify a
// non-green ring.
// =============================================================================

import { events, type EventLevel } from '../data'
import type { Status } from '../elements/StatusRing'

const LEVEL_TO_STATUS: Record<EventLevel, Status> = {
  CRIT: 'crit',
  WARN: 'warn',
  OK:   'ok',
  INFO: 'ok'
}

const SEVERITY: Record<EventLevel, number> = {
  CRIT: 3,
  WARN: 2,
  OK:   1,
  INFO: 0
}

function normalizeId(value: string): string {
  return value.trim().toUpperCase()
}

function eventMatches(src: string, facilityId: string, explicitFacilityId?: string): boolean {
  const target = normalizeId(facilityId)
  if (explicitFacilityId && normalizeId(explicitFacilityId) === target) return true
  const source = normalizeId(src)
  return source === target || source.startsWith(target + ' ')
}

/** Derive a facility's current status from the events array.
 *  Returns 'ok' when no event matches `facilityId`. */
export function deriveStatus(facilityId: string): Status {
  const matched = events.filter((e) => eventMatches(e.src, facilityId, e.facilityId))
  if (matched.length === 0) return 'ok'
  const top = matched.reduce((a, b) => (SEVERITY[a.level] >= SEVERITY[b.level] ? a : b))
  return LEVEL_TO_STATUS[top.level]
}
