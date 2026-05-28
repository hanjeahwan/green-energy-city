import { useMemo } from 'react'
import type { BuildingDef } from '../types'
import { buildCity } from '../../scene/cityGenerator'
import { ROAD_AVENUES_X, ROAD_AVENUES_Z, ROAD_HALF_WIDTH, ROAD_REACH } from '../../scene/roads'
import { Apartment } from './Apartment'
import { Factory } from './Factory'
import { House } from './House'
import { Office } from './Office'
import { Skyscraper } from './Skyscraper'
import {
  EnergyLab,
  GreenApartment,
  MicrogridControlRoom,
  ParkingDeck,
  ServiceDepot,
  Townhouse,
  UtilityShed
} from './SpecialBuildings'
import { Warehouse } from './Warehouse'
import { InstancedBuildingOutlines } from './InstancedBuildingOutlines'
import { InstancedSimpleBoxBuildings, INSTANCED_BODY_TYPES } from './InstancedSimpleBoxBuildings'

function BuildingModel({ b }: { b: BuildingDef }) {
  const instanced = INSTANCED_BODY_TYPES.has(b.type)
  switch (b.type) {
    case 'office': return <Office b={b} />
    case 'skyscraper': return <Skyscraper b={b} />
    case 'warehouse': return <Warehouse b={b} />
    case 'factory': return <Factory b={b} />
    case 'apartment': return <Apartment b={b} />
    case 'house': return <House b={b} instanced={instanced} />
    case 'townhouse': return <Townhouse b={b} />
    case 'energy-lab': return <EnergyLab b={b} />
    case 'microgrid-control': return <MicrogridControlRoom b={b} instanced={instanced} />
    case 'parking-deck': return <ParkingDeck b={b} />
    case 'service-depot': return <ServiceDepot b={b} instanced={instanced} />
    case 'utility-shed': return <UtilityShed b={b} instanced={instanced} />
    case 'green-apartment': return <GreenApartment b={b} />
    default: {
      const exhaustive: never = b.type
      console.warn(`未分发建筑类型：${exhaustive}`)
      return null
    }
  }
}

export function Buildings() {
  const buildings = useMemo(buildCity, [])

  if (typeof window !== 'undefined') {
    interface DebugWindow extends Window {
      __buildings?: BuildingDef[]
      __roads?: {
        x: readonly number[]
        z: readonly number[]
        halfW: number
        reach: number
      }
    }
    const debugWindow = window as DebugWindow
    debugWindow.__buildings = buildings
    debugWindow.__roads = {
      x: ROAD_AVENUES_X,
      z: ROAD_AVENUES_Z,
      halfW: ROAD_HALF_WIDTH,
      reach: ROAD_REACH
    }
    const shapeSummary = buildings.reduce<Record<string, number>>((acc, building) => {
      const key = building.shapeCategory ?? 'uncategorized'
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {})
    document.documentElement.dataset.buildingShapeSummary = JSON.stringify(shapeSummary)
  }

  // Render only the dense core through the full per-type component tree. The
  // suburban falloff belt (b.outskirts) is drawn by the cheap instanced
  // <OutskirtsBuildings> path so the mid/far suburb doesn't blow the
  // draw-call budget. buildCity() still returns the full set (verify + debug).
  //
  // <InstancedBuildingOutlines> deliberately NOT mounted: it was a single-batch
  // re-introduction of the dark `#1a2230` floor rim that each building used to
  // render individually. The rim was originally a fake-AO companion to the
  // directional-light shadow pass. With Canvas shadows={false} those rims
  // become bare blue-gray squares on the ground — visual pollution instead of
  // a shading aid. Component left in tree, callable, in case a future
  // re-enable wants them again.
  const coreBuildings = useMemo(() => buildings.filter((b) => !b.outskirts), [buildings])
  void InstancedBuildingOutlines
  return (
    <group>
      {/* body + slab roof for House / UtilityShed / ServiceDepot /
          MicrogridControl batched into 2 instanced draws here. Each
          per-component still renders around it for decoration (windows,
          doors, signatures, modern/industrial roofs). */}
      <InstancedSimpleBoxBuildings buildings={coreBuildings} />
      {coreBuildings.map((building, index) => (
        <BuildingModel key={index} b={building} />
      ))}
    </group>
  )
}
