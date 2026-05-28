import { AgentBeacon } from '../AgentBeacon'
import { InteractiveAnchor } from '../InteractiveAnchor'
import { SHOWROOM_ANCHOR_REGISTRY } from '../../scene/showroomContract'
import { PowerSubstation } from './PowerSubstation'

const showroomAnchor = SHOWROOM_ANCHOR_REGISTRY

export function TransmissionTowers() {
  // Phase: replaced both legacy TransmissionTower placements with a single
  // full PowerSubstation tile at (-6.5, 6). The substation has its own
  // pylon + HV cables built in, so the standalone trans-1 / trans-2 are
  // retired. Component name kept ("TransmissionTowers") to avoid touching
  // the render call site in CityScene's main return tree.
  return (
    <group>
      <InteractiveAnchor {...showroomAnchor['substation-W']}>
        <PowerSubstation />
        <AgentBeacon position={[1.35, 0, 1.0]} color="#54d6ff" scale={0.8} />
      </InteractiveAnchor>
    </group>
  )
}
