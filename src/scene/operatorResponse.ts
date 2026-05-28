import { events, type EventLevel } from '../data'
import type { Status } from '../elements/StatusRing'
import { PLACEMENTS } from './layout'
import { OPERATOR_PLACEMENTS } from './operatorPlacements'
import { getOperatorProfile, hasOperatorProfile } from './operatorMetadata'
import { deriveStatus } from './status'

export type ResponseMode = 'field' | 'remote' | 'queued'
export type DemoState = 'assigned' | 'en-route' | 'on-site' | 'repairing' | 'monitoring' | 'queued' | 'resolved'
export type VisualCue = 'ownerHalo' | 'etaBadge' | 'dottedLine' | 'queueBadge' | 'monitoringHalo' | 'repairBadge' | 'remoteBadge'
export type CopyTone = 'simulation' | 'demo-proposal'

export interface IncidentAssignment {
  assignmentId: string
  facilityId: string
  severity: Exclude<Status, 'ok'>
  primarySourceEventId: string
  relatedSourceEventIds: string[]
  responseMode: ResponseMode
  displayOwnerId: string
  supportingOwnerIds: string[]
  dispatcherId?: string
  demoState: DemoState
  displayStatusLabel: string
  secondaryStatusLabel?: string
  taskSummary: string
  visualCue: VisualCue[]
  copyTone: CopyTone
  responseTargetId?: string
  responseTargetKind?: 'placement-edge' | 'anchor-edge'
  maxOwnerDistance?: number
}

export interface ResponseTarget {
  id: string
  position: [number, number, number]
  sourcePlacementId: string
  kind: 'placement-edge'
}

type MatrixRow = Omit<
  IncidentAssignment,
  'assignmentId' | 'severity' | 'primarySourceEventId' | 'relatedSourceEventIds'
> & {
  assignmentId: string
  primarySourceEventId: string
}

const ALERT_FACILITY_IDS = ['PS-02', 'PS-05', 'wind-1', 'h2-W-NW', 'vat-S-W'] as const

const RESPONSE_MATRIX: MatrixRow[] = [
  {
    assignmentId: 'alert-PS-02-field',
    facilityId: 'PS-02',
    primarySourceEventId: 'PS-02:CRIT:arc-fault',
    responseMode: 'field',
    displayOwnerId: 'ops-repair-battery-a',
    supportingOwnerIds: ['ops-repair-battery-b'],
    demoState: 'repairing',
    displayStatusLabel: 'On-site repair',
    taskSummary: 'Inverter arc fault isolation',
    visualCue: ['ownerHalo', 'repairBadge'],
    copyTone: 'simulation',
    responseTargetId: 'PS-02-BB:east-service-edge',
    responseTargetKind: 'placement-edge',
    maxOwnerDistance: 1.5
  },
  {
    assignmentId: 'alert-PS-05-queued',
    facilityId: 'PS-05',
    primarySourceEventId: 'PS-05:WARN:work-order-overdue',
    responseMode: 'queued',
    displayOwnerId: 'ops-dispatch-command',
    supportingOwnerIds: [],
    demoState: 'queued',
    displayStatusLabel: 'Assigned queue',
    taskSummary: 'Overdue work order triage',
    visualCue: ['queueBadge'],
    copyTone: 'simulation'
  },
  {
    assignmentId: 'alert-wind-1-field',
    facilityId: 'wind-1',
    primarySourceEventId: 'wind-1:WARN:vibration',
    responseMode: 'field',
    displayOwnerId: 'ops-inspect-wind',
    supportingOwnerIds: [],
    demoState: 'monitoring',
    displayStatusLabel: 'On-site inspection',
    taskSummary: 'Blade vibration inspection',
    visualCue: ['ownerHalo', 'dottedLine'],
    copyTone: 'simulation',
    responseTargetId: 'wind-1:service-edge',
    responseTargetKind: 'placement-edge',
    maxOwnerDistance: 1.5
  },
  {
    assignmentId: 'alert-h2-W-NW-field',
    facilityId: 'h2-W-NW',
    primarySourceEventId: 'h2-W-NW:CRIT:pressure-relief',
    responseMode: 'field',
    displayOwnerId: 'ops-repair-hydrogen-west',
    supportingOwnerIds: [],
    dispatcherId: 'ops-dispatch-grid',
    demoState: 'en-route',
    displayStatusLabel: 'ETA 04 min',
    taskSummary: 'Pressure relief valve response',
    visualCue: ['ownerHalo', 'dottedLine', 'etaBadge'],
    copyTone: 'simulation',
    responseTargetId: 'h2-W-NW:service-edge',
    responseTargetKind: 'placement-edge',
    maxOwnerDistance: 1.5
  },
  {
    assignmentId: 'alert-vat-S-W-remote',
    facilityId: 'vat-S-W',
    primarySourceEventId: 'vat-S-W:WARN:rpm-low',
    responseMode: 'remote',
    displayOwnerId: 'ops-dispatch-grid',
    supportingOwnerIds: [],
    demoState: 'monitoring',
    displayStatusLabel: 'Remote monitoring',
    taskSummary: 'RPM below dispatch threshold',
    visualCue: ['ownerHalo', 'remoteBadge'],
    copyTone: 'simulation'
  }
]

const RESPONSE_TARGETS: Record<string, { placementId: string; dx: number; dz: number }> = {
  'PS-02-BB:east-service-edge': { placementId: 'PS-02-BB', dx: 1, dz: 0 },
  'wind-1:service-edge': { placementId: 'wind-1', dx: -1, dz: 1 },
  'h2-W-NW:service-edge': { placementId: 'h2-W-NW', dx: -1, dz: 1 }
}

const LEVEL_RANK: Record<EventLevel, number> = { INFO: 0, OK: 1, WARN: 2, CRIT: 3 }
const STATUS_RANK: Record<Status, number> = { ok: 0, warn: 2, crit: 3 }

function severityFor(status: Status): Exclude<Status, 'ok'> | null {
  return status === 'warn' || status === 'crit' ? status : null
}

function eventId(event: (typeof events)[number]): string {
  const detail = event.detail
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 42)
  return `${event.facilityId ?? event.src}:${event.level}:${detail}`
}

function sourceEventsFor(facilityId: string) {
  return events
    .filter((event) => event.facilityId === facilityId && (event.level === 'WARN' || event.level === 'CRIT'))
    .sort((a, b) => {
      const rank = LEVEL_RANK[b.level] - LEVEL_RANK[a.level]
      if (rank !== 0) return rank
      return b.ts.localeCompare(a.ts)
    })
}

export function deriveFacilityStatusById(): Record<string, Status> {
  return Object.fromEntries(ALERT_FACILITY_IDS.map((id) => [id, deriveStatus(id)]))
}

export function resolveResponseTarget(id: string | undefined): ResponseTarget | null {
  if (!id) return null
  const target = RESPONSE_TARGETS[id]
  if (!target) return null
  const placement = PLACEMENTS.find((item) => item.id === target.placementId)
  if (!placement) return null
  const edgeX = placement.x + target.dx * (placement.halfW + 0.18)
  const edgeZ = placement.z + target.dz * (placement.halfD + 0.18)
  return {
    id,
    position: [edgeX, 0, edgeZ],
    sourcePlacementId: placement.id,
    kind: 'placement-edge'
  }
}

export function incidentAssignments(statusById = deriveFacilityStatusById()): IncidentAssignment[] {
  return RESPONSE_MATRIX.flatMap((row) => {
    const severity = severityFor(statusById[row.facilityId] ?? 'ok')
    if (!severity) return []
    const sourceEvents = sourceEventsFor(row.facilityId)
    const primary = sourceEvents[0]
    const primarySourceEventId = row.primarySourceEventId || (primary ? eventId(primary) : `${row.facilityId}:${severity}`)
    return [{
      ...row,
      severity,
      primarySourceEventId,
      relatedSourceEventIds: sourceEvents
        .slice(1)
        .map(eventId)
    }]
  })
}

export const INCIDENT_ASSIGNMENTS = incidentAssignments()

export function assignmentByFacilityId(assignments = INCIDENT_ASSIGNMENTS): Record<string, IncidentAssignment> {
  return Object.fromEntries(assignments.map((assignment) => [assignment.facilityId, assignment]))
}

export function getAssignmentForFacility(facilityId: string): IncidentAssignment | undefined {
  return assignmentByFacilityId()[facilityId]
}

export function getAssignmentForOperator(operatorId: string): IncidentAssignment | undefined {
  return INCIDENT_ASSIGNMENTS.find((assignment) =>
    assignment.displayOwnerId === operatorId ||
    assignment.supportingOwnerIds.includes(operatorId) ||
    assignment.dispatcherId === operatorId
  )
}

export function operatorIncidentStatus(operatorId: string): string {
  const assignment = getAssignmentForOperator(operatorId)
  if (!assignment) return getOperatorProfile(operatorId).defaultStatus
  if (assignment.displayOwnerId === operatorId) return `${assignment.displayStatusLabel} · ${assignment.facilityId}`
  if (assignment.supportingOwnerIds.includes(operatorId)) return `Supporting crew · ${assignment.facilityId}`
  return `Dispatch watch · ${assignment.facilityId}`
}

export function ownerDistanceToTarget(assignment: IncidentAssignment): number | null {
  if (assignment.responseMode !== 'field') return null
  const owner = OPERATOR_PLACEMENTS.find((operator) => operator.id === assignment.displayOwnerId)
  const target = resolveResponseTarget(assignment.responseTargetId)
  if (!owner || !target) return null
  return Math.hypot(owner.position[0] - target.position[0], owner.position[2] - target.position[2])
}

export function validateIncidentAssignments(assignments = INCIDENT_ASSIGNMENTS): string[] {
  const issues: string[] = []
  const modes: ResponseMode[] = ['field', 'remote', 'queued']
  const compatibleStates: Record<ResponseMode, DemoState[]> = {
    field: ['en-route', 'on-site', 'repairing', 'monitoring'],
    remote: ['monitoring', 'assigned'],
    queued: ['queued', 'assigned']
  }
  for (const assignment of assignments) {
    if (!modes.includes(assignment.responseMode)) issues.push(`${assignment.assignmentId} invalid responseMode`)
    if (!compatibleStates[assignment.responseMode].includes(assignment.demoState)) {
      issues.push(`${assignment.assignmentId} demoState ${assignment.demoState} incompatible with ${assignment.responseMode}`)
    }
    if (assignment.copyTone !== 'simulation' && assignment.copyTone !== 'demo-proposal') {
      issues.push(`${assignment.assignmentId} invalid copyTone`)
    }
    if (!hasOperatorProfile(assignment.displayOwnerId)) issues.push(`${assignment.assignmentId} missing display owner`)
    for (const supportingOwnerId of assignment.supportingOwnerIds) {
      if (!hasOperatorProfile(supportingOwnerId)) issues.push(`${assignment.assignmentId} missing supporting owner ${supportingOwnerId}`)
    }
    if (assignment.dispatcherId && !hasOperatorProfile(assignment.dispatcherId)) {
      issues.push(`${assignment.assignmentId} missing dispatcher ${assignment.dispatcherId}`)
    }
    if (assignment.responseMode === 'field') {
      const target = resolveResponseTarget(assignment.responseTargetId)
      const distance = ownerDistanceToTarget(assignment)
      if (!target) issues.push(`${assignment.assignmentId} missing response target`)
      if (distance === null || distance > (assignment.maxOwnerDistance ?? 0)) {
        issues.push(`${assignment.assignmentId} owner too far from response target`)
      }
    }
    if ((assignment.responseMode === 'remote' || assignment.responseMode === 'queued') && assignment.visualCue.includes('dottedLine')) {
      issues.push(`${assignment.assignmentId} ${assignment.responseMode} cannot use dottedLine`)
    }
    if (assignment.visualCue.length === 0) issues.push(`${assignment.assignmentId} missing visualCue`)
    if (!assignment.primarySourceEventId) issues.push(`${assignment.assignmentId} missing primary source`)
  }
  return issues
}

export function publishIncidentDebug() {
  if (typeof window === 'undefined') return
  const debugWindow = window as Window & {
    __facilityStatusById?: Record<string, Status>
    __incidentAssignments?: IncidentAssignment[]
  }
  const statusById = deriveFacilityStatusById()
  const assignments = incidentAssignments(statusById)
  debugWindow.__facilityStatusById = statusById
  debugWindow.__incidentAssignments = assignments
  document.documentElement.dataset.incidentAssignments = String(assignments.length)
}
