import { AgentBeacon } from '../AgentBeacon'
import { InteractiveAnchor } from '../InteractiveAnchor'
import { SHOWROOM_ANCHOR_REGISTRY } from '../../scene/showroomContract'
import { ContainerStack } from './ContainerStack'

const showroomAnchor = SHOWROOM_ANCHOR_REGISTRY

export function ContainerYard() {
  // Both stacks placed in block centers. Rotation kept small (<0.3 rad) so the rotated
  // OBB doesn't push corners onto adjacent roads. Stacks are 2.6m long × 0.5m deep —
  // at rot=0.7 the rotated z-extent grows to ~1m and would overlap z=±8 roads.
  return (
    <group>
      {/* Moved from inner plaza (3,5)(3,-6) to SE industrial block — was clutter inside r<8.
          container-B pulled in from (14,-13) to (13,-13) after verifyLayout caught
          its rot=-0.3 OBB extending 0.31m into x=16 road. */}
      <InteractiveAnchor {...showroomAnchor['container-A']}>
        <ContainerStack position={[0, 0, 0]} rot={0} status="ok" />
        <AgentBeacon position={[-0.95, 0, 0.38]} color="#f0c85a" scale={0.55} />
      </InteractiveAnchor>
      <InteractiveAnchor {...showroomAnchor['container-B']}>
        <ContainerStack position={[0, 0, 0]} rot={0} variant="modern" />
        <AgentBeacon position={[0.95, 0, -0.38]} color="#f0c85a" scale={0.55} />
      </InteractiveAnchor>
    </group>
  )
}
