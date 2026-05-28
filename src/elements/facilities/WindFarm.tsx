import { AgentBeacon } from '../AgentBeacon'
import { InteractiveAnchor } from '../InteractiveAnchor'
import { SHOWROOM_ANCHOR_REGISTRY } from '../../scene/showroomContract'
import { WindFarmHill } from './WindFarmHill'

const showroomAnchor = SHOWROOM_ANCHOR_REGISTRY

export function WindFarm() {
  // wind-1 at (-12, -12) is now a complete WindFarmHill tile (5×5m) hosting
  // 3 mini-turbines + control building + pine grove + cyan LED rings.
  // Replaces the single standalone WindTurbine that used to sit here.
  return (
    <InteractiveAnchor {...showroomAnchor['wind-1']}>
      <WindFarmHill />
      <AgentBeacon position={[1.7, 0, -1.6]} color="#6fb3c8" scale={0.85} />
    </InteractiveAnchor>
  )
}
