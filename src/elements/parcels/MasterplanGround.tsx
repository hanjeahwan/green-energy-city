import { useMemo } from 'react'
import { buildInnerParcels, buildInnerParcelSummary } from '../../scene/cityPlan'

function rotatePlanOffset(x: number, z: number, rot: number): [number, number] {
  const c = Math.cos(rot)
  const s = Math.sin(rot)
  return [x * c - z * s, x * s + z * c]
}

export function MasterplanGround() {
  const parcels = useMemo(buildInnerParcels, [])
  const summary = useMemo(() => buildInnerParcelSummary(parcels), [parcels])

  if (typeof window !== 'undefined') {
    type CityPlanDebug = { roads?: unknown; parcels?: unknown; innerParcels?: typeof parcels }
    const debugWindow = window as Window & { __cityPlan?: CityPlanDebug }
    debugWindow.__cityPlan = { ...debugWindow.__cityPlan, innerParcels: parcels }
    document.documentElement.dataset.innerCityParcels = String(parcels.length)
    document.documentElement.dataset.innerParcelSummary = JSON.stringify(summary)
    document.documentElement.dataset.innerGridStyle = 'irregular-tetris'
    document.documentElement.dataset.innerParcelsWithRoadId = String(parcels.filter((parcel) => Boolean(parcel.roadId)).length)
    document.documentElement.dataset.innerSectorCounts = JSON.stringify(
      parcels.reduce<Record<string, number>>((acc, parcel) => {
        acc[parcel.sector] = (acc[parcel.sector] ?? 0) + 1
        return acc
      }, {})
    )
    document.documentElement.dataset.innerShapeSummary = JSON.stringify(
      parcels.reduce<Record<string, number>>((acc, parcel) => {
        acc[parcel.shape] = (acc[parcel.shape] ?? 0) + 1
        return acc
      }, {})
    )
  }

  // Parcel-cell tinted ground decals NOT rendered.
  //
  // Each sector in masterplan.ts (#5aa7ff / #7fb4d8 / #a3c0e8 etc.) was a
  // light blue/teal, drawn as a planeGeometry per cell at y=0.012 with
  // opacity 0.23. Original purpose was a Phase-2 lot-key debugging
  // visual — "this parcel belongs to sector X". Without real shadows
  // damping them, every cell on the ground reads as a discrete light
  // blue square ("地上浅蓝色方块" report).
  //
  // The parcels themselves are still built (debug dataset writes above
  // still fire), only the tinted ground geometry is suppressed. To
  // re-enable for layout debugging, restore the previous return body
  // (last live commit: ffa7a6d).
  void parcels
  return null
}
