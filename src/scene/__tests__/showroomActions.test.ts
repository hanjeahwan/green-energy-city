import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getOperatorProfile } from '../operatorMetadata'
import { INCIDENT_ASSIGNMENTS } from '../operatorResponse'
import { useShowroomActionsStore } from '../showroomActions'

const assignment = INCIDENT_ASSIGNMENTS.find((item) => item.assignmentId === 'alert-PS-02-field')
if (!assignment) throw new Error('Missing PS-02 incident assignment fixture')

describe('showroom action store', () => {
  beforeEach(() => {
    useShowroomActionsStore.setState({
      actionLog: [],
      proposals: [],
      cueFocusRequest: null,
      addEvent: vi.fn(),
      addToast: vi.fn()
    })
  })

  it('keeps one reassignment proposal per assignment while preserving action history', () => {
    const profile = getOperatorProfile(assignment.displayOwnerId)
    const { runOperatorAction } = useShowroomActionsStore.getState()

    runOperatorAction({ action: 'reassign', profile, assignment })
    runOperatorAction({ action: 'reassign', profile, assignment })

    const state = useShowroomActionsStore.getState()
    expect(state.proposals).toHaveLength(1)
    expect(state.proposals[0]).toMatchObject({
      baseAssignmentId: assignment.assignmentId,
      operatorId: profile.id
    })
    expect(state.actionLog).toHaveLength(2)
  })

  it('publishes locate cue focus requests with explicit expiry cleanup', () => {
    const profile = getOperatorProfile(assignment.displayOwnerId)
    const { runOperatorAction, clearExpiredCueFocusRequest } = useShowroomActionsStore.getState()

    runOperatorAction({ action: 'locate', profile, assignment })
    const cue = useShowroomActionsStore.getState().cueFocusRequest

    expect(cue).toMatchObject({
      assignmentId: assignment.assignmentId,
      reason: 'locate'
    })
    expect(cue?.expiresAt).toBeGreaterThan(Date.now())

    if (!cue) throw new Error('Expected locate cue')
    clearExpiredCueFocusRequest(cue)
    expect(useShowroomActionsStore.getState().cueFocusRequest).toBeNull()
  })
})
