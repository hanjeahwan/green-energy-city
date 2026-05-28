import { useEffect, type ReactNode } from 'react'
import { create } from 'zustand'
import type { EventLevel, EventRow } from '../data'
import type { ToastTone } from '../components/ui/sonner'
import type { IncidentAssignment } from './operatorResponse'
import type { OperatorActionId, OperatorProfile } from './operatorMetadata'

type AddEvent = (row: Omit<EventRow, 'ts'>) => void
type AddToast = (text: string, tone?: ToastTone) => void

export interface ShowroomActionLogEntry {
  id: string
  action: OperatorActionId
  operatorId: string
  assignmentId?: string
  copyTone: 'simulation' | 'demo-proposal'
  detail: string
  timestamp: number
}

export interface AssignmentProposal {
  proposalId: string
  baseAssignmentId: string
  operatorId: string
  createdAt: number
  label: string
}

interface CueFocusRequest {
  assignmentId: string
  reason: string
  expiresAt: number
}

interface ShowroomActionsState {
  actionLog: ShowroomActionLogEntry[]
  proposals: AssignmentProposal[]
  cueFocusRequest: CueFocusRequest | null
}

interface ShowroomActionsStore extends ShowroomActionsState {
  addEvent: AddEvent
  addToast: AddToast
  setDependencies: (addEvent: AddEvent, addToast: AddToast) => void
  runOperatorAction: (input: {
    action: OperatorActionId
    profile: OperatorProfile
    assignment?: IncidentAssignment
  }) => void
  clearProposalForAssignment: (assignmentId: string | undefined) => void
  clearExpiredCueFocusRequest: (request: CueFocusRequest) => void
}

const noopAddEvent: AddEvent = () => {}
const noopAddToast: AddToast = () => {}
const CUE_FOCUS_TTL_MS = 5000

function timestamp() {
  return Date.now()
}

function eventFor(action: OperatorActionId, profile: OperatorProfile, assignment?: IncidentAssignment): {
  level: EventLevel
  src: string
  detail: string
  toast: string
  tone?: ToastTone
  copyTone: 'simulation' | 'demo-proposal'
} {
  const target = assignment?.facilityId ?? profile.title
  if (action === 'message') {
    if (!profile.actions.message.enabled) {
      return {
        level: 'INFO',
        src: 'Operator Console',
        detail: `Demo contact channel unavailable · ${profile.title}`,
        toast: 'Demo channel unavailable',
        tone: 'info',
        copyTone: 'simulation'
      }
    }
    return {
      level: 'INFO',
      src: 'Operator Console',
      detail: `Demo contact request queued · ${profile.title}`,
      toast: 'Demo request queued',
      tone: 'info',
      copyTone: 'simulation'
    }
  }
  if (action === 'locate') {
    return {
      level: 'INFO',
      src: 'Operator Console',
      detail: `Monitoring view highlighted · ${profile.title} · ${target}`,
      toast: 'Monitoring view highlighted',
      tone: 'info',
      copyTone: 'simulation'
    }
  }
  if (action === 'reassign') {
    return {
      level: 'INFO',
      src: 'Operator Console',
      detail: `Demo reassignment proposal created · ${target}`,
      toast: 'Proposal created',
      tone: 'info',
      copyTone: 'demo-proposal'
    }
  }
  return {
    level: 'INFO',
    src: 'Operator Console',
    detail: `Simulated signal snapshot · ${profile.title} · ${profile.wearable}`,
    toast: 'Signal snapshot opened',
    tone: profile.wearable === 'online' ? 'info' : 'warn',
    copyTone: 'simulation'
  }
}

function publish(actionLog: ShowroomActionLogEntry[], proposals: AssignmentProposal[], cueFocusRequest: ShowroomActionsState['cueFocusRequest']) {
  if (typeof window === 'undefined') return
  const debugWindow = window as Window & {
    __showroomActionLog?: ShowroomActionLogEntry[]
    __assignmentProposals?: AssignmentProposal[]
    __assignmentCueFocusRequest?: ShowroomActionsState['cueFocusRequest']
  }
  debugWindow.__showroomActionLog = actionLog
  debugWindow.__assignmentProposals = proposals
  debugWindow.__assignmentCueFocusRequest = cueFocusRequest
  document.documentElement.dataset.showroomActionLog = String(actionLog.length)
  document.documentElement.dataset.assignmentProposals = String(proposals.length)
}

export const useShowroomActionsStore = create<ShowroomActionsStore>((set, get) => ({
  actionLog: [],
  proposals: [],
  cueFocusRequest: null,
  addEvent: noopAddEvent,
  addToast: noopAddToast,
  setDependencies: (addEvent, addToast) => {
    set({ addEvent, addToast })
  },
  clearProposalForAssignment: (assignmentId) => {
    if (!assignmentId) return
    set((state) => {
      const proposals = state.proposals.filter((proposal) => proposal.baseAssignmentId !== assignmentId)
      return proposals.length === state.proposals.length ? state : { proposals }
    })
  },
  runOperatorAction: ({ action, profile, assignment }) => {
    const feedback = eventFor(action, profile, assignment)
    const { addEvent, addToast } = get()
    addEvent({ level: feedback.level, src: feedback.src, detail: feedback.detail })
    addToast(feedback.toast, feedback.tone)

    const now = timestamp()
    const entry: ShowroomActionLogEntry = {
      id: `${action}-${profile.id}-${now}`,
      action,
      operatorId: profile.id,
      assignmentId: assignment?.assignmentId,
      copyTone: feedback.copyTone,
      detail: feedback.detail,
      timestamp: now
    }

    set((state) => {
      const proposals = action === 'reassign' && assignment
        ? [
            ...state.proposals.filter((item) => item.baseAssignmentId !== assignment.assignmentId),
            {
              proposalId: `proposal-${assignment.assignmentId}-${now}`,
              baseAssignmentId: assignment.assignmentId,
              operatorId: profile.id,
              createdAt: now,
              label: 'Proposal'
            }
          ]
        : state.proposals
      const cueFocusRequest = action === 'locate'
        ? (assignment
            ? { assignmentId: assignment.assignmentId, reason: 'locate', expiresAt: now + CUE_FOCUS_TTL_MS }
            : null)
        : state.cueFocusRequest

      return {
        actionLog: [...state.actionLog, entry].slice(-20),
        proposals,
        cueFocusRequest
      }
    })
  },
  clearExpiredCueFocusRequest: (request) => {
    set((state) => state.cueFocusRequest?.assignmentId === request.assignmentId &&
      state.cueFocusRequest.expiresAt === request.expiresAt
      ? { cueFocusRequest: null }
      : state)
  }
}))

export function ShowroomActionsProvider({
  addEvent,
  addToast,
  children
}: {
  addEvent: AddEvent
  addToast: AddToast
  children: ReactNode
}) {
  useEffect(() => {
    useShowroomActionsStore.getState().setDependencies(addEvent, addToast)
    return () => {
      useShowroomActionsStore.getState().setDependencies(noopAddEvent, noopAddToast)
    }
  }, [addEvent, addToast])

  useEffect(() => {
    const publishCurrent = () => {
      const { actionLog, proposals, cueFocusRequest } = useShowroomActionsStore.getState()
      publish(actionLog, proposals, cueFocusRequest)
    }
    publishCurrent()
    return useShowroomActionsStore.subscribe((state, previous) => {
      if (
        state.actionLog === previous.actionLog &&
        state.proposals === previous.proposals &&
        state.cueFocusRequest === previous.cueFocusRequest
      ) return
      publish(state.actionLog, state.proposals, state.cueFocusRequest)
    })
  }, [])

  useEffect(() => {
    let timer: number | null = null
    const scheduleClear = (request: CueFocusRequest | null) => {
      if (timer !== null) window.clearTimeout(timer)
      timer = null
      if (!request) return
      const delay = Math.max(0, request.expiresAt - Date.now())
      timer = window.setTimeout(() => {
        useShowroomActionsStore.getState().clearExpiredCueFocusRequest(request)
      }, delay)
    }

    scheduleClear(useShowroomActionsStore.getState().cueFocusRequest)
    const unsubscribe = useShowroomActionsStore.subscribe((state, previous) => {
      if (state.cueFocusRequest !== previous.cueFocusRequest) scheduleClear(state.cueFocusRequest)
    })

    return () => {
      unsubscribe()
      if (timer !== null) window.clearTimeout(timer)
    }
  }, [])

  return <>{children}</>
}

export function useShowroomActions() {
  return useShowroomActionsStore()
}
