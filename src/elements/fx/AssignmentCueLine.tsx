import { Line } from '@react-three/drei'
import { useEffect } from 'react'
import { AdditiveBlending, DoubleSide } from 'three'
import { getAnchorPosition } from '../../scene/facilityMetadata'
import { INCIDENT_ASSIGNMENTS, resolveResponseTarget, type IncidentAssignment } from '../../scene/operatorResponse'
import { OPERATOR_PLACEMENTS } from '../../scene/operatorPlacements'
import { useShowroomActionsStore } from '../../scene/showroomActions'
import { ALERT_ORANGE, CLEAN_GREEN, ENERGY_CYAN } from '../../scene/palette'

const OWNER_HALO_RADIUS = 0.34
const OWNER_HALO_REINFORCED_RADIUS = 0.42

function ownerPosition(assignment: IncidentAssignment): [number, number, number] | null {
  return OPERATOR_PLACEMENTS.find((operator) => operator.id === assignment.displayOwnerId)?.position ?? null
}

function facilityPosition(assignment: IncidentAssignment): [number, number, number] | null {
  return resolveResponseTarget(assignment.responseTargetId)?.position ?? getAnchorPosition(assignment.facilityId)
}

function publishAssignmentCues() {
  if (typeof window === 'undefined') return
  const debugWindow = window as Window & {
    __assignmentCues?: unknown[]
  }
  debugWindow.__assignmentCues = INCIDENT_ASSIGNMENTS.map((assignment) => ({
    assignmentId: assignment.assignmentId,
    facilityId: assignment.facilityId,
    displayOwnerId: assignment.displayOwnerId,
    supportingOwnerIds: assignment.supportingOwnerIds,
    responseMode: assignment.responseMode,
    demoState: assignment.demoState,
    cueTypes: assignment.visualCue,
    visible: true,
    hasDottedLine: assignment.visualCue.includes('dottedLine'),
    operatorPlacementSnapshotHash: OPERATOR_PLACEMENTS.map((operator) => `${operator.id}:${operator.position.join(',')}`).join('|')
  }))
  document.documentElement.dataset.assignmentCues = String(INCIDENT_ASSIGNMENTS.length)
}

function cueColor(assignment: IncidentAssignment) {
  return assignment.responseMode === 'queued' ? ALERT_ORANGE : ENERGY_CYAN
}

export function AssignmentCueLine() {
  const cueFocusRequest = useShowroomActionsStore((state) => state.cueFocusRequest)

  useEffect(() => {
    publishAssignmentCues()
  }, [])

  return (
    <group>
      {INCIDENT_ASSIGNMENTS.map((assignment) => {
        const owner = ownerPosition(assignment)
        const facility = facilityPosition(assignment)
        if (!owner || !facility) return null
        const reinforced = cueFocusRequest?.assignmentId === assignment.assignmentId && cueFocusRequest.expiresAt > Date.now()
        const color = cueColor(assignment)
        return (
          <group key={assignment.assignmentId}>
            {assignment.responseMode === 'field' && assignment.visualCue.includes('ownerHalo') && (
              <mesh position={[owner[0], 0.055, owner[2]]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
                <circleGeometry args={[reinforced ? OWNER_HALO_REINFORCED_RADIUS : OWNER_HALO_RADIUS, 32]} />
                <meshBasicMaterial
                  color={CLEAN_GREEN}
                  transparent
                  opacity={reinforced ? 0.2 : 0.1}
                  depthWrite={false}
                  side={DoubleSide}
                  blending={AdditiveBlending}
                  toneMapped={false}
                />
              </mesh>
            )}
            {assignment.visualCue.includes('dottedLine') && (
              <Line
                points={[
                  [facility[0], 0.08, facility[2]],
                  [owner[0], 0.08, owner[2]]
                ]}
                color={color}
                lineWidth={reinforced ? 1.8 : 0.9}
                dashed
                dashScale={0.45}
                dashSize={0.35}
                gapSize={0.18}
                transparent
                opacity={reinforced ? 0.9 : 0.46}
              />
            )}
          </group>
        )
      })}
    </group>
  )
}
