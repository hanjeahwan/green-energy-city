// =============================================================================
// Facility metadata — per-id title/subtitle/KPIs used by <FacilityCard/>.
//
// Two tiers:
//   1. FACILITY_META — hand-written entries for the "hero" set: 5 PV stations,
//      CommandTower, 4 mid-block theme anchors. Real-sounding KPIs pulled
//      from src/data.ts where applicable.
//   2. defaultMetaForPlacement() — falls back to a generic spec ("Vestas V90 ·
//      2.0MW", "Container 40HC × 6") derived from the PLACEMENTS entry's
//      kind+variant. Lets outer-ring assets show a sensible card without
//      forcing us to write 30 individual entries.
//
// Pure module (no three.js). Consumed by FacilityCard.tsx.
// =============================================================================

import { plants } from '../data'
import { PLACEMENTS } from './layout'
import { SHOWROOM_ANCHOR_REGISTRY } from './showroomContract'

export interface FacilityKpi {
  label: string
  value: string
  unit?: string
}

export interface FacilityMeta {
  id: string
  title: string
  subtitle: string
  kpis: FacilityKpi[]
  recentEvents?: number
  /** Override deriveStatus() when present. Hero entries set this when the
   *  story differs from the events feed (e.g. CommandTower is always 'ok'). */
  status?: 'ok' | 'warn' | 'crit'
}

// -----------------------------------------------------------------------------
// Hero set — 10 nodes with hand-written copy.
// -----------------------------------------------------------------------------

// Build PV station entries directly from data.ts so capacity/yield stay in
// sync with the single source of truth.
const PV_META: Record<string, FacilityMeta> = Object.fromEntries(
  plants.map((p) => [
    p.id,
    {
      id: p.id,
      title: p.name,
      subtitle: `Distributed PV node · peak ${p.capacityKw} kW`,
      kpis: [
        { label: 'Capacity', value: String(p.capacityKw), unit: 'kW' },
        { label: 'Today yield', value: p.yieldMwh.toFixed(2), unit: 'MWh' },
        { label: 'Agent', value: 'Online' },
      ],
    } as FacilityMeta,
  ])
)

export const FACILITY_META: Record<string, FacilityMeta> = {
  ...PV_META,
  'command-tower': {
    id: 'command-tower',
    title: 'AI Energy Command Center',
    subtitle: 'City-scale energy hub · AI agents monitor, forecast, dispatch and coordinate every asset',
    status: 'ok',
    kpis: [
      { label: 'Agents online', value: '8' },
      { label: 'Uplink latency', value: '142', unit: 'ms' },
      { label: 'Inference', value: '46.2', unit: 'k/s' },
      { label: 'Showroom runs', value: '548' },
    ],
  },
  'h2-W-NW': {
    id: 'h2-W-NW',
    title: 'West H2 Resilience Station',
    subtitle: 'Single-sphere hydrogen storage · 350 bar safety envelope',
    kpis: [
      { label: 'Storage', value: '12', unit: 'm³' },
      { label: 'Pressure', value: '7.3', unit: 'bar' },
      { label: 'Inventory', value: '46', unit: 'kg' },
      { label: 'Fuel cell', value: '1 online' },
    ],
  },
  'ev-N': {
    id: 'ev-N',
    title: 'North V2G Hub',
    subtitle: 'DC fast + AC slow charging · PV-canopy coordinated',
    kpis: [
      { label: 'Bays', value: '8' },
      { label: 'Per-bay power', value: '150', unit: 'kW' },
      { label: 'Occupied', value: '3' },
      { label: 'Queued', value: '1' },
    ],
  },
  'drone-N': {
    id: 'drone-N',
    title: 'Drone Inspection Port',
    subtitle: 'Quadcopter patrol · defect detection · last-mile delivery',
    kpis: [
      { label: 'Fleet', value: '12' },
      { label: 'In flight', value: '1' },
      { label: 'Pad', value: 'Idle' },
      { label: 'Next arrival', value: '6', unit: 'min' },
    ],
  },
  'vat-S-W': {
    id: 'vat-S-W',
    title: 'South Vertical Turbine',
    subtitle: 'Darrieus turbine · low-noise urban dispatch',
    kpis: [
      { label: 'Rated power', value: '250', unit: 'kW' },
      { label: 'Current output', value: '140', unit: 'kW' },
      { label: 'Wind speed', value: '8.2', unit: 'm/s' },
      { label: 'Cut-in', value: '3.5', unit: 'm/s' },
    ],
  },
}

// -----------------------------------------------------------------------------
// Fallback — derive a generic card from PLACEMENTS by kind.
// -----------------------------------------------------------------------------

const KIND_FALLBACK: Record<
  string,
  { title: (variant: string) => string; subtitle: string; kpis: FacilityKpi[] }
> = {
  WindTurbine: {
    title: (v) => (v === 'modern' ? 'HAWT V120 · twin-blade' : 'HAWT V90 · three-blade'),
    subtitle: 'Peripheral wind feed-in unit',
    kpis: [
      { label: 'Rated power', value: '2.0', unit: 'MW' },
      { label: 'Hub height', value: '90', unit: 'm' },
      { label: 'Status', value: 'Online' },
    ],
  },
  VAT: {
    title: () => 'Vertical Micro-Turbine',
    subtitle: 'Low-noise urban wind unit',
    kpis: [
      { label: 'Rated power', value: '250', unit: 'kW' },
      { label: 'Cut-in', value: '3.5', unit: 'm/s' },
    ],
  },
  TransmissionTower: {
    title: () => 'HV Transmission Tower',
    subtitle: 'City backbone grid spine',
    kpis: [
      { label: 'Voltage', value: '132', unit: 'kV' },
      { label: 'Circuits', value: '2' },
    ],
  },
  ContainerStack: {
    title: (v) => (v === 'modern' ? 'Reefer Container Yard' : 'Dry Container Yard'),
    subtitle: 'Clean-logistics buffer zone',
    kpis: [
      { label: 'Volume', value: '24', unit: 'TEU' },
      { label: 'Utilization', value: '67', unit: '%' },
    ],
  },
  // Crane is no longer placed in the scene (NW slot replaced by the
  // CommunityPark) — metadata kept as fallback in case a future scene
  // brings the crane back, but no PLACEMENTS entry references it.
  Crane: {
    title: () => 'NW Smart Lift Zone',
    subtitle: 'Wind-bounded construction lift node',
    kpis: [
      { label: 'Capacity', value: '40', unit: 't' },
      { label: 'Boom', value: '62', unit: 'm' },
      { label: 'Status', value: 'Standby' },
    ],
  },
  CommunityPark: {
    title: () => 'NW Community Park',
    subtitle: 'Resident gathering space · smart lighting + microclimate sensing',
    kpis: [
      { label: 'Area', value: '6.25', unit: 'm²×4' },
      { label: 'Dusk traffic', value: '38' },
      { label: 'Microgrid load', value: '0.4', unit: 'kW' },
      { label: 'Species', value: '6 trees' },
    ],
  },
  H2Sphere: {
    title: () => 'Hydrogen Sphere',
    subtitle: 'Compressed hydrogen safety reserve',
    kpis: [
      { label: 'Volume', value: '12', unit: 'm³' },
      { label: 'Design pressure', value: '350', unit: 'bar' },
    ],
  },
  BatteryBank: {
    title: () => 'Battery Energy Storage',
    subtitle: 'Grid-tied energy buffer',
    kpis: [
      { label: 'Capacity', value: '1.0', unit: 'MWh' },
      { label: 'Power', value: '250', unit: 'kW' },
    ],
  },
  SolarCanopy: {
    title: (v) => (v === 'modern' ? 'Bifacial PV Canopy' : 'PV Canopy'),
    subtitle: 'Parking shade + power generation integrated',
    kpis: [
      { label: 'Area', value: '48', unit: 'm²' },
      { label: 'Output', value: '8.4', unit: 'kW' },
    ],
  },
  EVChargingHub: {
    title: () => 'Charging Hub',
    subtitle: 'Mixed DC / AC bays',
    kpis: [
      { label: 'Bays', value: '6' },
      { label: 'Max power', value: '150', unit: 'kW' },
    ],
  },
  EVChargingStation: {
    title: () => 'AI V2G Station',
    subtitle: 'PV + storage + charging fleet dispatch',
    kpis: [
      { label: 'Bays', value: '8' },
      { label: 'Peak power', value: '420', unit: 'kW' },
      { label: 'V2G', value: 'Enabled' },
    ],
  },
  DroneHub: {
    title: () => 'Drone Port',
    subtitle: 'Last-mile delivery + plant inspection',
    kpis: [
      { label: 'Fleet', value: '8' },
      { label: 'Pads', value: '3' },
    ],
  },
  PowerSubstation: {
    title: () => 'Smart Substation',
    subtitle: 'AI load forecast + main-grid interface',
    kpis: [
      { label: 'Capacity', value: '35', unit: 'MVA' },
      { label: 'Feeders', value: '6' },
      { label: 'Protection', value: 'Adaptive' },
    ],
  },
  TwinSolarOffice: {
    title: () => 'Twin Solar Office',
    subtitle: 'Customer showroom + microgrid operations complex',
    kpis: [
      { label: 'Building load', value: '-18', unit: '%' },
      { label: 'Rooftop PV', value: 'Online' },
      { label: 'Tenant agents', value: '4' },
    ],
  },
  GreenEcoOffice: {
    title: () => 'Green Eco Office',
    subtitle: 'Building energy optimization + storage coordination',
    kpis: [
      { label: 'Savings', value: '21', unit: '%' },
      { label: 'Comfort index', value: '92', unit: '%' },
      { label: 'BMS agent', value: 'Online' },
    ],
  },
  WindFarmHill: {
    title: () => 'Wind Farm Hill',
    subtitle: 'Small turbines, met mast and ops control room',
    kpis: [
      { label: 'Turbines', value: '3' },
      { label: 'Output', value: '1.8', unit: 'MW' },
      { label: 'Patrol cycle', value: '12', unit: 'min' },
    ],
  },
  Billboard: {
    title: () => 'Showroom Display Board',
    subtitle: 'City operations + brand showcase',
    kpis: [{ label: 'Refresh', value: '30', unit: 's' }],
  },
  WaterTank: {
    title: () => 'Utility Water Tank',
    subtitle: 'Campus public-works reserve',
    kpis: [{ label: 'Volume', value: '5', unit: 'm³' }],
  },
  CommandTower: {
    title: () => 'AI Energy Command Center',
    subtitle: 'City-wide dispatch control',
    kpis: [{ label: 'Agents', value: '8' }],
  },
  'pv-SolarFarm': {
    title: () => 'PV Array',
    subtitle: 'Crystalline-Si generation unit',
    kpis: [
      { label: 'Capacity', value: '480', unit: 'kW' },
      { label: 'Tilt', value: '15', unit: '°' },
    ],
  },
  'pv-BatteryBank': {
    title: () => 'PV Storage Buffer',
    subtitle: 'PV-side energy cache',
    kpis: [{ label: 'Capacity', value: '2.0', unit: 'MWh' }],
  },
  'pv-CarRow': {
    title: () => 'PV Charging Row',
    subtitle: 'Solar-shaded charging bays',
    kpis: [{ label: 'Bays', value: '8' }],
  },
  University: {
    title: () => 'Green Energy University',
    subtitle: 'Renewables R&D campus · 3 academic blocks + central quad',
    kpis: [
      { label: 'Students', value: '4,200' },
      { label: 'Research load', value: '320', unit: 'kW' },
      { label: 'Rooftop PV', value: 'Online' },
    ],
  },
  Hospital: {
    title: () => 'Smart Healthcare Center',
    subtitle: 'Tier-3 hospital · helipad-equipped emergency wing',
    kpis: [
      { label: 'Beds', value: '180' },
      { label: 'Load', value: '420', unit: 'kW' },
      { label: 'Backup grid', value: '8h' },
      { label: 'Helipad', value: 'Active' },
    ],
  },
  MuseumPlaza: {
    title: () => 'City Memory Museum',
    subtitle: 'Civic culture landmark · public plaza + reflecting pools',
    kpis: [
      { label: 'Daily visitors', value: '1,180' },
      { label: 'Plaza lighting', value: 'AI dim' },
      { label: 'Exhibits', value: '14' },
    ],
  },
  Market: {
    title: () => 'Neighbourhood Market',
    subtitle: 'Open-air retail row · 10 stalls under cyan canopies',
    kpis: [
      { label: 'Stalls', value: '10' },
      { label: 'Foot traffic', value: '720', unit: '/h' },
      { label: 'Refrigeration', value: 'Microgrid-tied' },
    ],
  },
  SportsComplex: {
    title: () => 'Community Sports Complex',
    subtitle: 'Track + pitch + half-court for the new outer-ring residents',
    kpis: [
      { label: 'Track', value: '180', unit: 'm' },
      { label: 'Grandstand', value: '120', unit: 'seats' },
      { label: 'Evening load', value: '12', unit: 'kW' },
    ],
  },
  TransitHub: {
    title: () => 'Intermodal Transit Hub',
    subtitle: 'Bus terminal + metro entry + bike share · pedestrian-first',
    kpis: [
      { label: 'Bus bays', value: '4' },
      { label: 'Daily riders', value: '6,400' },
      { label: 'Bikes docked', value: '24' },
      { label: 'Microgrid', value: 'V2G-ready' },
    ],
  },
  ResearchPark: {
    title: () => 'AI Energy Research Park',
    subtitle: 'Three labs + courtyard · university spin-out incubator',
    kpis: [
      { label: 'Labs', value: '3' },
      { label: 'PhD seats', value: '46' },
      { label: 'Patents/yr', value: '18' },
      { label: 'Rooftop solar', value: 'Net-zero' },
    ],
  },
  DataCenter: {
    title: () => 'AI Compute Hall',
    subtitle: 'Physical home of the command-tower agents · liquid-cooled racks',
    kpis: [
      { label: 'Racks', value: '320' },
      { label: 'Load', value: '1.8', unit: 'MW' },
      { label: 'PUE', value: '1.15' },
      { label: 'Backup', value: 'Battery + H2' },
    ],
  },
}

export function getMeta(id: string): FacilityMeta {
  const explicit = FACILITY_META[id]
  if (explicit) return explicit
  const placement = PLACEMENTS.find((p) => p.id === id)
  const kind = placement?.kind ?? 'unknown'
  const variant = placement?.variant ?? 'classic'
  const fb = KIND_FALLBACK[kind]
  if (!fb) {
    return {
      id,
      title: id,
      subtitle: kind,
      kpis: [],
    }
  }
  return {
    id,
    title: fb.title(variant),
    subtitle: fb.subtitle,
    kpis: fb.kpis,
  }
}

/** Look up anchor world position by id. Rendered showroom anchors resolve via
 *  SHOWROOM_ANCHOR_REGISTRY first; legacy placement/PV ids remain fallbacks.
 *  Returns null when unknown so callers can bail out gracefully. */
export function getAnchorPosition(id: string): [number, number, number] | null {
  const anchor = SHOWROOM_ANCHOR_REGISTRY[id]
  if (anchor) return anchor.position
  const plant = plants.find((p) => p.id === id)
  if (plant) return [plant.position[0], 0, plant.position[2]]
  const p = PLACEMENTS.find((x) => x.id === id)
  if (p) return [p.x, 0, p.z]
  return null
}
