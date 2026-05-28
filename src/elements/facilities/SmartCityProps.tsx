import { AgentBeacon } from '../AgentBeacon'
import { InteractiveAnchor } from '../InteractiveAnchor'
import { SHOWROOM_ANCHOR_REGISTRY } from '../../scene/showroomContract'
import { deriveStatus } from '../../scene/status'
import { CLEAN_GREEN } from '../../scene/palette'
import { GreenEcoOffice } from './GreenEcoOffice'
import { SolarCanopy } from './SolarCanopy'
import { HydrogenStorageSphere } from './HydrogenStorageSphere'
import { EVChargingStation } from './EVChargingStation'
import { DroneDeliveryHub } from './DroneDeliveryHub'
import { VerticalAxisTurbine } from './VerticalAxisTurbine'
import { TransmissionTower } from './TransmissionTower'

const showroomAnchor = SHOWROOM_ANCHOR_REGISTRY

export function SmartCityProps() {
  // 4-themed mid-block layout. Each cardinal mid-block tells a different
  // renewable story instead of 4 identical SolarCanopy slots:
  //   East  (x= 12): 光伏 + 储能  (SolarCanopy + BatteryBank)
  //   West  (x=-12): 氢能站       (SolarCanopy feeding 2×2 H2 sphere bank)
  //   North (z= 12): 电动出行     (EVChargingHub + DroneDeliveryHub)
  //   South (z=-12): 立式风能     (3× ground VAT + TransmissionTower export)
  // Road clearance: every prop AABB stays >= 0.95m from x=±8/±16 and z=±8/±16
  // centerlines (road halfWidth 0.75 + 0.2 buffer). No two props overlap —
  // gaps verified manually below.
  // Each facility is wrapped in an InteractiveAnchor whose id matches the
  // corresponding PLACEMENTS entry. The anchor places the group at the world
  // position; the inner facility is rendered at local [0,0,0]. Bounding
  // boxes were sized from each facility's actual geometry — wider than the
  // mesh so the outline halo reads, not so wide that it bleeds onto roads.
  return (
    <group>
      {/* ============ EAST: Green Eco Office + storage (block [8..16, -8..8]) ============ */}
      {/* canopy-E replaced by GreenEcoOffice — 3-story concrete office with
          living wall vines, rooftop solar + garden, side entry, bench,
          curbside EV charger. */}
      <InteractiveAnchor {...showroomAnchor['green-office-E']}>
        <GreenEcoOffice />
        <AgentBeacon position={[1.25, 0, 0.95]} color={CLEAN_GREEN} scale={0.85} />
      </InteractiveAnchor>

      {/* ============ WEST: hydrogen + canopy (block [-16..-8, -8..8]) ====
          The four-sphere 2×2 cluster shrank to a single residential-scale
          H2 sphere. SolarCanopy stays as the corridor's PV anchor. */}
      <InteractiveAnchor {...showroomAnchor['canopy-W']}>
        <SolarCanopy position={[0, 0, 0]} rot={0} variant="modern" />
        <AgentBeacon position={[0.85, 0, -0.55]} color="#8bd49c" scale={0.72} />
      </InteractiveAnchor>
      <InteractiveAnchor {...showroomAnchor['h2-W-NW']}>
        <HydrogenStorageSphere position={[0, 0, 0]} variant="modern" status={deriveStatus('H2-W-NW')} />
        <AgentBeacon position={[0.36, 0, 0.36]} color="#8bd49c" scale={0.52} />
      </InteractiveAnchor>

      {/* ============ NORTH: 电动出行 (block [-8..8, 8..16]) ============= */}
      {/* Full EV Charging Station tile — solar canopy + 6 chargers + 4 cars
          + entrance trees + admin module. Replaces minimal EVChargingHub. */}
      <InteractiveAnchor {...showroomAnchor['ev-N']}>
        <EVChargingStation />
        <AgentBeacon position={[-1.85, 0, 1.12]} color="#5aa7ff" scale={0.85} />
      </InteractiveAnchor>
      <InteractiveAnchor {...showroomAnchor['drone-N']}>
        <DroneDeliveryHub position={[0, 0, 0]} variant="modern" status="ok" />
        <AgentBeacon position={[0.5, 0, -0.5]} color="#6ee7d8" scale={0.62} />
      </InteractiveAnchor>

      {/* ============ SOUTH: vertical wind (block [-8..8, -16..-8]) =====
          The 3-VAT line + rooftop VAT were dedup'd to a single VAT marker. */}
      <InteractiveAnchor {...showroomAnchor['vat-S-W']}>
        <VerticalAxisTurbine position={[0, 0, 0]} scale={2.5} variant="modern" status={deriveStatus('VAT-S-W')} />
        <AgentBeacon position={[0.38, 0, 0.4]} color="#7fb4d8" scale={0.56} />
      </InteractiveAnchor>
      <InteractiveAnchor {...showroomAnchor['trans-S']}>
        <TransmissionTower position={[0, 0, 0]} rot={Math.PI / 2} status="ok" />
        <AgentBeacon position={[-0.34, 0, 0.34]} color="#54d6ff" scale={0.5} />
      </InteractiveAnchor>
    </group>
  )
}
