import { describe, expect, it } from 'vitest'
import {
  INCIDENT_ASSIGNMENTS,
  assignmentByFacilityId,
  deriveFacilityStatusById,
  getAssignmentForOperator,
  ownerDistanceToTarget,
  resolveResponseTarget,
  validateIncidentAssignments
} from '../operatorResponse'

describe('operator incident response mapping', () => {
  it('maps every current warn/crit demo facility to an assignment owner', () => {
    const statusById = deriveFacilityStatusById()
    const assignments = assignmentByFacilityId()
    const alertFacilityIds = Object.entries(statusById)
      .filter(([, status]) => status === 'warn' || status === 'crit')
      .map(([facilityId]) => facilityId)

    expect(alertFacilityIds.sort()).toEqual(['PS-02', 'PS-05', 'h2-W-NW', 'vat-S-W', 'wind-1'].sort())
    for (const facilityId of alertFacilityIds) {
      expect(assignments[facilityId], facilityId).toBeDefined()
      expect(assignments[facilityId].displayOwnerId).toMatch(/^ops-/)
    }
  })

  it('keeps field response owners physically near their response targets', () => {
    expect(validateIncidentAssignments()).toEqual([])

    for (const assignment of INCIDENT_ASSIGNMENTS.filter((item) => item.responseMode === 'field')) {
      expect(resolveResponseTarget(assignment.responseTargetId), assignment.assignmentId).not.toBeNull()
      expect(ownerDistanceToTarget(assignment), assignment.assignmentId).toBeLessThanOrEqual(
        assignment.maxOwnerDistance ?? 0
      )
      expect(assignment.visualCue).toContain('ownerHalo')
    }
  })

  it('changes operator status copy from idle to the assigned facility context', () => {
    expect(getAssignmentForOperator('ops-repair-battery-a')?.facilityId).toBe('PS-02')
    expect(getAssignmentForOperator('ops-repair-hydrogen-west')?.demoState).toBe('en-route')
    expect(getAssignmentForOperator('ops-dispatch-grid')?.facilityId).toBe('h2-W-NW')
  })
})
