import { Html } from '@react-three/drei'
import { MapPin, MessageCircle, Watch, X, type LucideIcon } from 'lucide-react'
import { useCallback } from 'react'
import type { OperatorProfile, OperatorActionId } from '../scene/operatorMetadata'
import { getAssignmentForOperator, operatorIncidentStatus } from '../scene/operatorResponse'
import { useSelectionStore } from '../scene/selection'
import { useCameraMode } from '../scene/cameraMode'
import { useShowroomActionsStore } from '../scene/showroomActions'
import { formatCardValue, formatOperatorStatusValue } from '../scene/cardDisplay'

type OperatorCardMode = 'hover' | 'full'

interface OperatorCardProps {
  profile: OperatorProfile
  position: [number, number, number]
  mode: OperatorCardMode
}

const ACTIONS: { id: OperatorActionId; label: string; Icon: LucideIcon }[] = [
  { id: 'message', label: 'Message', Icon: MessageCircle },
  { id: 'locate', label: 'Locate', Icon: MapPin },
  { id: 'wearable', label: 'Wearable', Icon: Watch }
]

function statusTone(status: string) {
  if (/repair|ETA|queued|Remote|inspection|supporting/i.test(status)) return 'warn'
  return 'ok'
}

export function OperatorCard({ profile, position, mode }: OperatorCardProps) {
  const setSelected = useSelectionStore((state) => state.setSelected)
  const { pauseCruise } = useCameraMode()
  const runOperatorAction = useShowroomActionsStore((state) => state.runOperatorAction)
  const clearProposalForAssignment = useShowroomActionsStore((state) => state.clearProposalForAssignment)
  const assignment = getAssignmentForOperator(profile.id)
  const assignmentId = assignment?.assignmentId
  const proposal = useShowroomActionsStore(useCallback(
    (state) => assignmentId
      ? state.proposals.find((item) => item.baseAssignmentId === assignmentId)
      : undefined,
    [assignmentId]
  ))
  const status = operatorIncidentStatus(profile.id)
  const compactStatus = formatOperatorStatusValue(status)
  const tone = statusTone(status)

  return (
    <Html
      position={position}
      distanceFactor={9}
      occlude={false}
      zIndexRange={[32, 0]}
      style={{ pointerEvents: mode === 'full' ? 'auto' : 'none' }}
    >
      <div
        className={`fac-card operator-card ${mode}`}
        data-card-kind="operator"
        data-status={tone}
        data-operator-id={profile.id}
        data-assignment-id={assignment?.assignmentId ?? ''}
        data-base-assignment-id={assignment?.assignmentId ?? ''}
        data-proposal-id={proposal?.proposalId ?? ''}
        data-response-mode={assignment?.responseMode ?? ''}
        data-demo-state={assignment?.demoState ?? ''}
        data-copy-tone={assignment?.copyTone ?? 'simulation'}
      >
        <div className="fac-head">
          <span className={`fac-dot ${tone}`} />
          <div className="fac-title">{profile.name}</div>
          {mode === 'full' && (
            <button
              type="button"
              className="fac-close"
              aria-label="Close operator card"
              onClick={(event) => {
                event.stopPropagation()
                pauseCruise('operator-card-close')
                clearProposalForAssignment(assignment?.assignmentId)
                setSelected(null)
              }}
            >
              <X size={12} strokeWidth={2.25} aria-hidden="true" />
            </button>
          )}
        </div>

        {mode === 'hover' ? (
          <div className="fac-sub operator-hover-status">{compactStatus}</div>
        ) : (
          <>
            <div className="fac-sub operator-role-line">{profile.title} · {profile.subtitle}</div>
            <div className="fac-kpis operator-kpis">
              <div className="fac-kpi">
                <div className="fac-kpi-lbl">Office</div>
                <div className="fac-kpi-val">{formatCardValue(profile.office.replace('Office · ', ''))}</div>
              </div>
              <div className="fac-kpi">
                <div className="fac-kpi-lbl">Phone</div>
                <div className="fac-kpi-val">{formatCardValue(profile.phone)}</div>
              </div>
              <div className="fac-kpi">
                <div className="fac-kpi-lbl">Wearable</div>
                <div className="fac-kpi-val">{formatCardValue(profile.wearable)}</div>
              </div>
              <div className="fac-kpi">
                <div className="fac-kpi-lbl">Status</div>
                <div className="fac-kpi-val">{compactStatus}</div>
              </div>
            </div>
            {assignment && (
              <div className="fac-assignment operator-assignment" data-assignment-source={assignment.primarySourceEventId}>
                <div><span>Response</span><b>{formatCardValue(assignment.displayStatusLabel)}</b></div>
                <div><span>Mode</span><b>{formatCardValue(assignment.responseMode)}</b></div>
                <div><span>Task</span><b>{formatCardValue(assignment.taskSummary)}</b></div>
                {proposal && <div><span>Proposal</span><b>{formatCardValue(proposal.label)}</b></div>}
              </div>
            )}
            <div className="operator-actions" role="group" aria-label="Demo operator controls">
              {ACTIONS.map(({ id, label, Icon }) => {
                const actionState = profile.actions[id]
                const ariaDisabled = !actionState.enabled
                return (
                  <button
                    key={id}
                    type="button"
                    className="operator-action"
                    data-operator-action={id}
                    aria-disabled={ariaDisabled}
                    title={`Demo ${label}`}
                    aria-label={`Demo ${label}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      runOperatorAction({ action: id, profile, assignment })
                    }}
                  >
                    <Icon size={14} strokeWidth={2.2} aria-hidden="true" />
                    <span>{label}</span>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    </Html>
  )
}
