import type { PVPlant } from '../../data'
import { AlarmCluster } from '../../components/AlarmCluster'
import { StatusRing } from '../StatusRing'
import { deriveStatus } from '../../scene/status'
import { SolarFarm } from './SolarFarm'
import { BatteryBank } from './BatteryBank'
import { CarRow } from './CarRow'
import { PENANG_ALERT_CONE_POSITIONS } from '../../scene/pvAlertGeometry'
import { SHOWROOM_ANCHOR_REGISTRY } from '../../scene/showroomContract'

const PENANG_HALO_FOOTPRINT = SHOWROOM_ANCHOR_REGISTRY['PS-02'].bound

export function PVHotspot({ plant }: { plant: PVPlant }) {
  const statusRadius = plant.id === 'PS-04' ? 1.18 : 1.35

  // Outer PVHotspot rotation removed — was rng-based per plant, which made the
  // rotated AABB unpredictable and caused PS-02 to occupy the x=8 road no matter
  // what pentagon radius we chose. PVs now sit axis-aligned; only the inner
  // SolarFarm/CarRow rotation argument remains, which is small and deterministic.
  //
  // Positioning moved OUT of this component — the call site wraps each
  // PVHotspot in <InteractiveAnchor position={plant.position}/>. PVHotspot
  // now returns its children fragment-style so the InteractiveAnchor's group
  // transform applies to them directly.
  return (
    <>
      {/* Cardinal layout: PV stations stay axis-aligned for clean symmetry.
          Solar arrays are a mid-size tile now: bigger than the compact pass,
          but still tighter than the original plaza-sized footprint. */}
      {plant.id === 'PS-01' && <SolarFarm position={[0, 0, 0]} rows={3} cols={5} rotation={0} />}
      {plant.id === 'PS-02' && (
        <>
          <SolarFarm position={[0, 0, 0]} rows={4} cols={5} rotation={0} />
          <BatteryBank position={[-0.35, 0, 3.0]} />
          {/* PS-02 is the alarm hero — expanding red rings + perimeter cones,
              sized to match the larger PV tile without
              reclaiming the whole plaza. */}
          <AlarmCluster
            position={[0, 0, 0]}
            radius={1.6}
            height={2.2}
            conePositions={PENANG_ALERT_CONE_POSITIONS}
            haloFootprint={PENANG_HALO_FOOTPRINT}
          />
        </>
      )}
      {plant.id === 'PS-03' && <SolarFarm position={[0, 0, 0]} rows={2} cols={3} rotation={0} />}
      {plant.id === 'PS-04' && <CarRow position={[0, 0, 0]} count={6} variant="modern" />}
      {plant.id === 'PS-05' && <SolarFarm position={[0, 0, 0]} rows={4} cols={5} rotation={0} />}
      {/* Status ring — derived from events feed (Phase 4-C). plant.status in
          src/data.ts is now informational only; deriveStatus(plant.id) picks
          the highest-severity event whose src starts with plant.id. */}
      <StatusRing status={deriveStatus(plant.id)} radius={statusRadius} />
      {/* hud-label removed (user request, 2026-05-23): the bare "PS-XX · XX kW"
          label has been replaced by the always-on FacilityCard.hover pill,
          which carries the same information richer (title + status dot +
          subtitle). The 5 PV anchors set showLabel={true} on their
          InteractiveAnchor so the pill renders without requiring hover. */}
    </>
  )
}
