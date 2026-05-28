import type {
  BuildingDef,
  BuildingHeightBand,
  BuildingShapeCategory,
  BuildingType,
  BuildingUseCategory,
  BuildingVariant,
  Footprint,
  SupportFacilityKind
} from '../elements/types'
import { BUILDING_SHAPE_SPECS, type BuildingShapeId, type BuildingShapeSpec } from '../elements/buildings/catalog'

export type MasterplanSectorId =
  | 'north-emobility'
  | 'east-storage'
  | 'south-grid'
  | 'west-hydrogen'
  | 'ne-cbd'
  | 'nw-community'
  | 'se-logistics'
  | 'sw-wind-park'
  // Outer-ring (±16 → ±20) edge sectors — civic mixed-use, not part of the
  // core 8. Each is a single landmark + a small residential cluster, sitting
  // in the strip between the outer avenue and the road grid endpoint.
  | 'n-edu-edge'
  | 'e-health-edge'
  | 's-culture-edge'
  | 'w-market-edge'

export interface MasterplanSector {
  id: MasterplanSectorId
  label: string
  bounds: [number, number, number, number]
  anchor: [number, number]
  color: string
  minVisibleMasses: number
}

export const MASTERPLAN_SECTORS: MasterplanSector[] = [
  {
    id: 'north-emobility',
    label: 'AI 车网协同港',
    bounds: [-8, 8, 8, 16],
    anchor: [0, 12],
    color: '#5aa7ff',
    minVisibleMasses: 6
  },
  {
    id: 'east-storage',
    label: '储能与智能办公',
    bounds: [8, -8, 16, 8],
    anchor: [12, 0],
    color: '#00d4a8',
    minVisibleMasses: 6
  },
  {
    id: 'south-grid',
    label: '风光电网调度带',
    bounds: [-8, -16, 8, -8],
    anchor: [0, -12],
    color: '#6fb3c8',
    minVisibleMasses: 6
  },
  {
    id: 'west-hydrogen',
    label: '氢能社区枢纽',
    bounds: [-16, -8, -8, 8],
    anchor: [-12, 0],
    color: '#8bd49c',
    minVisibleMasses: 6
  },
  {
    id: 'ne-cbd',
    label: '微网金融中枢',
    bounds: [8, 8, 16, 16],
    anchor: [12, 12],
    color: '#7fb4d8',
    minVisibleMasses: 4
  },
  {
    id: 'nw-community',
    label: '低碳生活社区',
    bounds: [-16, 8, -8, 16],
    anchor: [-12, 12],
    color: '#8fd1a3',
    minVisibleMasses: 4
  },
  {
    id: 'se-logistics',
    label: '智能物流场站',
    bounds: [8, -16, 16, -8],
    anchor: [12, -12],
    color: '#7fa6c8',
    minVisibleMasses: 4
  },
  {
    id: 'sw-wind-park',
    label: '风电运维基地',
    bounds: [-19, -21, -8, -8],
    anchor: [-12, -12],
    color: '#7fc8aa',
    minVisibleMasses: 3
  },
  // ===== outer-ring edge sectors =====
  // Each edge sector takes ONE diagonal corner so the 4 corners are owned
  // without overlap. Cyclic assignment: N→NW, E→NE, S→SE, W→SW.
  {
    id: 'n-edu-edge',
    label: '绿色能源大学',
    bounds: [-20, 16, 8, 20],
    anchor: [0, 18.5],
    color: '#a3c0e8',
    minVisibleMasses: 2
  },
  {
    id: 'e-health-edge',
    label: '智慧医疗中心',
    bounds: [16, -8, 20, 20],
    anchor: [18.5, 0],
    color: '#d8a0a0',
    minVisibleMasses: 1
  },
  {
    id: 's-culture-edge',
    label: '城市记忆博物馆',
    bounds: [-8, -20, 20, -16],
    anchor: [0, -18.5],
    color: '#b8b0d0',
    minVisibleMasses: 2
  },
  {
    id: 'w-market-edge',
    label: '邻里市集',
    bounds: [-20, -20, -16, 8],
    anchor: [-18.5, 0],
    color: '#b9d8a8',
    minVisibleMasses: 2
  }
]

interface PlannedBuildingInput {
  id: string
  sector: MasterplanSectorId
  type: BuildingType
  pos: [number, number]
  size: [number, number, number]
  variant: BuildingVariant
  rot?: number
  topHex: string
  roofHex?: string
  hasPV?: boolean
  hasRoofUnit?: boolean
  hasRailing?: boolean
  shapeId?: BuildingShapeId
  useCategory?: BuildingUseCategory
  heightBand?: BuildingHeightBand
  shapeCategory?: BuildingShapeCategory
  shapeFamily?: string
  labelZh?: string
  requiredSilhouetteFeatures?: string[]
  supportKind?: SupportFacilityKind
  visualFootprint?: Footprint
}

export type PlannedBuilding = BuildingDef & {
  id: string
  sector: MasterplanSectorId
}

function planned(input: PlannedBuildingInput): PlannedBuilding {
  const [w, d, h] = input.size
  const shapeSpec = input.shapeId
    ? BUILDING_SHAPE_SPECS[input.shapeId] as BuildingShapeSpec | undefined
    : undefined
  const visualFootprint = input.visualFootprint ?? (shapeSpec
    ? {
        halfW: w / 2 + (shapeSpec.extraHalfW ?? 0),
        halfD: d / 2 + (shapeSpec.extraHalfD ?? 0),
        ...(shapeSpec.sweepR ? { sweepR: shapeSpec.sweepR } : {})
      }
    : undefined)
  return {
    id: input.id,
    sector: input.sector,
    pos: input.pos,
    w,
    d,
    h,
    rot: input.rot ?? 0,
    topHex: input.topHex,
    type: input.type,
    variant: input.variant,
    hasRoofUnit: input.hasRoofUnit ?? false,
    hasPV: input.hasPV ?? false,
    hasRailing: input.hasRailing ?? false,
    roofHex: input.roofHex ?? '#143258',
    shapeId: input.shapeId,
    useCategory: input.useCategory ?? shapeSpec?.useCategory,
    heightBand: input.heightBand ?? shapeSpec?.heightBand,
    shapeCategory: input.shapeCategory ?? shapeSpec?.shapeCategory,
    shapeFamily: input.shapeFamily ?? shapeSpec?.shapeFamily,
    labelZh: input.labelZh ?? shapeSpec?.labelZh,
    requiredSilhouetteFeatures: input.requiredSilhouetteFeatures ?? (shapeSpec ? [...shapeSpec.requiredSilhouetteFeatures] : undefined),
    supportKind: input.supportKind ?? shapeSpec?.supportKind,
    visualFootprint
  }
}

export const MASTERPLAN_BUILDINGS: PlannedBuilding[] = [
  // North: EV and drone block, matched to the current densest side.
  planned({
    id: 'N-PARK-01',
    sector: 'north-emobility',
    type: 'parking-deck',
    pos: [-5.6, 14.0],
    size: [1.7, 1.0, 1.3],
    variant: 'modern',
    topHex: '#c8d8e2',
    shapeId: 'support-garage-entry'
  }),
  planned({
    id: 'N-LAB-01',
    sector: 'north-emobility',
    type: 'office',
    pos: [5.2, 14.2],
    size: [1.45, 1.05, 2.05],
    variant: 'modern',
    topHex: '#d7e8ef',
    hasPV: true,
    hasRailing: true,
    shapeId: 'office-glass-tower'
  }),
  planned({
    id: 'N-APT-01',
    sector: 'north-emobility',
    type: 'apartment',
    pos: [-6.3, 9.8],
    size: [1.3, 1.2, 2.35],
    variant: 'modern',
    topHex: '#c8d4e0',
    hasPV: true,
    shapeId: 'mid-student-apartment'
  }),
  planned({
    id: 'N-CTRL-01',
    sector: 'north-emobility',
    type: 'microgrid-control',
    pos: [5.6, 9.8],
    size: [0.95, 0.75, 0.95],
    variant: 'compact',
    topHex: '#dfe8ef',
    hasPV: true,
    shapeId: 'support-management-kiosk'
  }),
  planned({
    id: 'N-AGENT-01',
    sector: 'north-emobility',
    type: 'office',
    pos: [2.8, 14.35],
    size: [1.05, 0.8, 1.2],
    variant: 'modern',
    topHex: '#d8e6ef',
    hasPV: true,
    hasRailing: true,
    shapeId: 'office-cowork-terrace'
  }),
  planned({
    id: 'N-COMMS-01',
    sector: 'north-emobility',
    type: 'apartment',
    pos: [1.4, 9.75],
    // Face the CommandTower at (0, 0): this north-block apartment's balcony
    // facade is local +z, so rotate it to world -z toward the city center.
    rot: Math.PI,
    size: [1.1, 0.88, 2.15],
    variant: 'classic',
    topHex: '#e2eef4',
    hasRoofUnit: true,
    shapeId: 'mid-standard-block'
  }),
  // East: storage campus around GreenEcoOffice + BatteryBank.
  planned({
    id: 'E-LAB-01',
    sector: 'east-storage',
    type: 'office',
    pos: [14.2, 5.4],
    size: [1.48, 1.05, 1.85],
    variant: 'green',
    topHex: '#cfe4dc',
    hasPV: true,
    hasRailing: true,
    shapeId: 'office-atrium-podium'
  }),
  planned({
    id: 'E-CTRL-01',
    sector: 'east-storage',
    type: 'microgrid-control',
    pos: [9.8, 5.6],
    size: [0.95, 0.75, 0.95],
    variant: 'compact',
    topHex: '#e8f2ee',
    hasPV: true,
    shapeId: 'support-energy-service-station'
  }),
  planned({
    id: 'E-APT-01',
    sector: 'east-storage',
    type: 'skyscraper',
    // Moved toward NE-CBD direction: NE corner of E block at (14.5, 6.5)
    // clipped E-LAB-01 (14.2, 5.4) by 0.02u in z. (12, 6.4) sits north of
    // GEO with clean gaps from LAB (dx=2.2) and the z=8 main road
    // (dz=1.6, 1.025u after halfD). Sky now points the eye from GEO →
    // skyscraper → NE-CBD cluster naturally.
    pos: [12, 6.4],
    size: [1.05, 1.05, 5.3],
    variant: 'modern',
    topHex: '#b8c8d6',
    hasPV: true,
    shapeId: 'high-twin-slim-tower'
  }),
  planned({
    id: 'E-SHED-01',
    sector: 'east-storage',
    type: 'apartment',
    pos: [9.8, -5.5],
    // Face the CommandTower at (0, 0) — |x|=9.8 > |z|=5.5 so the cardinal
    // toward centre is -x (west). Matches the procedural apartment rule
    // applied city-wide.
    rot: -Math.PI / 2,
    size: [1.1, 0.9, 2.1],
    variant: 'classic',
    topHex: '#dbe8df',
    hasPV: true,
    // mid-roof-garden-block now renders a concrete roof terrace (not green
    // grass) — kept as the 5th distinct mid-rise shape required by the
    // showroom contract.
    shapeId: 'mid-roof-garden-block'
  }),
  planned({
    id: 'E-OFFICE-01',
    sector: 'east-storage',
    type: 'office',
    pos: [14.2, 0],
    size: [1.1, 1.0, 2.2],
    variant: 'green',
    topHex: '#dfe8ef',
    hasPV: true,
    hasRailing: true,
    shapeId: 'office-business-center'
  }),
  planned({
    id: 'E-AGENT-01',
    sector: 'east-storage',
    type: 'microgrid-control',
    pos: [9.65, 0.25],
    size: [0.95, 0.78, 1.15],
    variant: 'modern',
    topHex: '#d7ebe4',
    hasPV: true,
    shapeId: 'support-management-kiosk'
  }),

  // South: vertical wind and grid export block.
  planned({
    id: 'S-DEPOT-01',
    sector: 'south-grid',
    type: 'service-depot',
    pos: [-5.4, -14.0],
    size: [1.7, 0.95, 1.05],
    variant: 'industrial',
    // Was #22354f (near-black navy) — user reported these depot/warehouse
    // bodies read as "black". Mid-light industrial gray reads as proper
    // steel-panel cladding without darkening the silhouette.
    topHex: '#8a909a',
    shapeId: 'support-energy-service-station'
  }),
  planned({
    id: 'S-LAB-01',
    sector: 'south-grid',
    type: 'office',
    pos: [1.0, -14.3],
    size: [1.45, 0.95, 1.55],
    variant: 'green',
    topHex: '#dce8d8',
    hasPV: true,
    shapeId: 'office-low-commercial'
  }),
  planned({
    id: 'S-SHED-01',
    sector: 'south-grid',
    type: 'utility-shed',
    pos: [5.5, -14.2],
    size: [0.8, 0.7, 0.8],
    variant: 'compact',
    topHex: '#d4dde6',
    shapeId: 'support-guard-booth'
  }),
  planned({
    id: 'S-CTRL-01',
    sector: 'south-grid',
    type: 'microgrid-control',
    pos: [-6.0, -9.8],
    size: [0.95, 0.75, 0.95],
    variant: 'modern',
    topHex: '#cfe4dc',
    hasPV: true,
    shapeId: 'support-management-kiosk'
  }),
  planned({
    id: 'S-DEPOT-02',
    sector: 'south-grid',
    type: 'service-depot',
    pos: [1.0, -9.8],
    size: [1.35, 0.8, 0.95],
    variant: 'compact',
    // Was #2c3e5c — replaced with a slightly warmer mid gray so the two
    // S depots aren't identical.
    topHex: '#9aa0a8',
    shapeId: 'support-community-center'
  }),
  planned({
    id: 'S-DISPATCH-01',
    sector: 'south-grid',
    type: 'microgrid-control',
    pos: [6.4, -13.2],
    size: [0.9, 0.75, 1.05],
    variant: 'modern',
    topHex: '#dce8f0',
    hasRoofUnit: true,
    shapeId: 'support-management-kiosk'
  }),

  // West: hydrogen and community energy block.
  planned({
    id: 'W-TOWN-01',
    sector: 'west-hydrogen',
    type: 'townhouse',
    pos: [-13.6, 6.0],
    size: [1.85, 0.85, 1.15],
    variant: 'green',
    topHex: '#d4e0ec',
    shapeId: 'low-townhouse-row'
  }),
  planned({
    id: 'W-LAB-01',
    sector: 'west-hydrogen',
    type: 'energy-lab',
    pos: [-9.8, 5.5],
    size: [1.4, 1.0, 1.45],
    variant: 'green',
    topHex: '#cfe4dc',
    hasPV: true,
    shapeId: 'energy-lab-node'
  }),
  planned({
    id: 'W-APT-01',
    sector: 'west-hydrogen',
    type: 'apartment',
    pos: [-9.8, -4.0],
    size: [1.25, 1.25, 2.35],
    variant: 'industrial',
    topHex: '#c0cfdd',
    hasPV: true,
    shapeId: 'mid-old-estate-slab'
  }),
  planned({
    id: 'W-SHED-01',
    sector: 'west-hydrogen',
    type: 'utility-shed',
    pos: [-14.1, -5.5],
    size: [0.78, 0.68, 0.78],
    variant: 'compact',
    topHex: '#bcc8d2',
    shapeId: 'support-guard-booth'
  }),
  planned({
    id: 'W-TOWN-02',
    sector: 'west-hydrogen',
    type: 'townhouse',
    pos: [-14.0, 2.0],
    size: [1.85, 0.85, 1.1],
    variant: 'compact',
    topHex: '#eef2f7',
    shapeId: 'low-bungalow'
  }),
  planned({
    id: 'W-AGENT-01',
    sector: 'west-hydrogen',
    type: 'house',
    pos: [-9.6, 1.7],
    size: [0.92, 0.82, 0.95],
    variant: 'modern',
    topHex: '#d8efe0',
    shapeId: 'low-detached-villa'
  }),

  // NE: skyline is still strongest, but constrained to four corner towers
  // around the existing TwinSolarOffice so the other sides can compete.
  // CBD towers widened from 1.0×1.0 → 1.5×1.5 (50% wider footprint) at the
  // road-buffer-limited positions 9.75 / 14.25. Required a 0.65× shrink of
  // TwinSolarOffice (see CityScene.tsx group wrap) so the centre piece no
  // longer eats the corner space. Aspect ratio drops from 1:6.2~1:9.2 to
  // ~1:4.1~1:6.1 — towers now read as proper CBD slabs instead of pencils.
  planned({
    id: 'NE-TOWER-01',
    sector: 'ne-cbd',
    type: 'skyscraper',
    pos: [9.75, 9.75],
    size: [1.5, 1.5, 8.5],
    variant: 'modern',
    topHex: '#c8d0db',
    hasRoofUnit: true,
    shapeId: 'high-sky-garden-tower'
  }),
  planned({
    id: 'NE-TOWER-02',
    sector: 'ne-cbd',
    type: 'skyscraper',
    pos: [14.25, 9.75],
    size: [1.5, 1.5, 9.2],
    variant: 'industrial',
    topHex: '#b6bfcc',
    hasRoofUnit: true,
    shapeId: 'high-stepped-luxury-tower'
  }),
  planned({
    id: 'NE-TOWER-03',
    sector: 'ne-cbd',
    type: 'skyscraper',
    pos: [9.75, 14.25],
    size: [1.5, 1.5, 7.4],
    variant: 'classic',
    topHex: '#dde3ec',
    shapeId: 'high-balcony-spine-tower'
  }),
  planned({
    id: 'NE-OFFICE-01',
    sector: 'ne-cbd',
    type: 'skyscraper',
    pos: [14.25, 14.25],
    size: [1.5, 1.5, 6.2],
    variant: 'green',
    topHex: '#dfe8ef',
    hasPV: true,
    shapeId: 'high-terrace-crown-tower'
  }),

  // NW: community corner around the crane, no empty residential quadrant.
  planned({
    id: 'NW-TOWN-01',
    sector: 'nw-community',
    type: 'townhouse',
    pos: [-14.0, 10.2],
    size: [1.85, 0.85, 1.1],
    variant: 'green',
    topHex: '#d4e0ec',
    shapeId: 'low-courtyard-house'
  }),
  planned({
    id: 'NW-APT-01',
    sector: 'nw-community',
    type: 'apartment',
    pos: [-9.8, 14.0],
    size: [1.25, 1.15, 2.45],
    variant: 'modern',
    topHex: '#c8d4e0',
    hasPV: true,
    shapeId: 'mid-courtyard-apartment'
  }),
  planned({
    id: 'NW-CTRL-01',
    sector: 'nw-community',
    type: 'microgrid-control',
    pos: [-9.8, 9.8],
    size: [0.95, 0.75, 0.95],
    variant: 'modern',
    topHex: '#e8f2ee',
    hasPV: true,
    shapeId: 'support-management-kiosk'
  }),
  planned({
    id: 'NW-TOWN-02',
    sector: 'nw-community',
    type: 'townhouse',
    pos: [-14.0, 13.8],
    size: [1.75, 0.8, 1.05],
    variant: 'compact',
    topHex: '#eef2f7',
    shapeId: 'low-roof-garden-villa'
  }),

  // SE: industrial/logistics corner around container stacks.
  planned({
    id: 'SE-DEPOT-01',
    sector: 'se-logistics',
    type: 'service-depot',
    pos: [10.4, -14.2],
    size: [1.55, 0.95, 1.05],
    variant: 'industrial',
    // Was #22354f near-black navy — mid steel gray (slightly cooler than
    // the matching S depot) for SE-logistics identity.
    topHex: '#8e949c',
    shapeId: 'logistics-depot'
  }),
  planned({
    id: 'SE-WAREHOUSE-01',
    sector: 'se-logistics',
    type: 'warehouse',
    pos: [14.2, -9.8],
    size: [1.4, 1.05, 1.25],
    variant: 'modern',
    // Was #2c3e5c — mid-light corrugated-metal gray. Warehouse silhouette
    // stays distinct (it's the largest box in the SE corner) without
    // turning into a black brick.
    topHex: '#a8aeb4',
    hasPV: true,
    shapeId: 'logistics-depot'
  }),
  planned({
    id: 'SE-SHED-01',
    sector: 'se-logistics',
    type: 'utility-shed',
    pos: [14.2, -14.2],
    size: [0.78, 0.68, 0.78],
    variant: 'compact',
    topHex: '#bcc8d2',
    shapeId: 'support-management-kiosk'
  }),
  planned({
    id: 'SE-DEPOT-02',
    sector: 'se-logistics',
    type: 'service-depot',
    pos: [9.8, -10.0],
    size: [1.35, 0.85, 0.95],
    variant: 'modern',
    // Was #1b2c46 (the darkest of the bunch) — slightly cooler steel gray
    // so the two SE depots aren't identical to each other.
    topHex: '#7e848c',
    shapeId: 'support-energy-service-station'
  }),

  // SW: support sheds sit on the wind-park edge so the quadrant no longer
  // reads as a single isolated hill tile.
  planned({
    id: 'SW-SHED-01',
    sector: 'sw-wind-park',
    type: 'utility-shed',
    pos: [-18.2, -10.2],
    size: [0.78, 0.68, 0.78],
    variant: 'compact',
    topHex: '#d4dde6',
    shapeId: 'support-guard-booth'
  }),
  planned({
    id: 'SW-CTRL-01',
    sector: 'sw-wind-park',
    type: 'microgrid-control',
    pos: [-10.2, -20.6],
    size: [0.85, 0.7, 0.85],
    variant: 'compact',
    topHex: '#e8f2ee',
    hasPV: true,
    shapeId: 'support-management-kiosk'
  }),
  planned({
    id: 'SW-MET-01',
    sector: 'sw-wind-park',
    type: 'utility-shed',
    pos: [-18.2, -18.2],
    size: [0.72, 0.62, 0.9],
    variant: 'green',
    topHex: '#d7e6dd',
    hasRoofUnit: true,
    shapeId: 'support-energy-service-station'
  }),

  // ===== Outer-ring (±16 to ±20) residential infill =====
  // Each edge sector hosts 1 small house adjacent to its civic landmark
  // (university / hospital / museum / market). Each outer corner gets 2 small
  // houses, assigned to the geographically-nearest core sector (e.g. NE
  // corner → ne-cbd) since the edge sectors only cover the edge strips, not
  // the outer corners. All footprints 1.2×1.2 (halfW=halfD=0.6).

  // -- N edge --
  planned({
    id: 'N-EDGE-RES-01',
    sector: 'n-edu-edge',
    type: 'house',
    pos: [-5.0, 18.5],
    size: [1.2, 1.2, 0.85],
    variant: 'green',
    topHex: '#e3eee0',
    shapeId: 'low-detached-villa'
  }),

  // -- E edge (hospital campus) --
  // Phase 3: replaced the lone E-EDGE-RES-01 house with paired medical
  // service annexes flanking hospital-E (18.5, 0). The hospital reserved
  // zone left a visible 4u-wide grass strip at lot columns x=18, 20; these
  // 1.5×1.0 service blocks suppress 2 procedural lots each at z=±5 and
  // make the area read as "hospital campus" instead of "hospital alone".
  planned({
    id: 'E-MED-N',
    sector: 'e-health-edge',
    type: 'service-depot',
    pos: [18.5, 5.0],
    size: [1.5, 0.6, 0.9],
    variant: 'compact',
    topHex: '#dfe7ee',
    shapeId: 'support-energy-service-station'
  }),
  planned({
    id: 'E-MED-S',
    sector: 'e-health-edge',
    type: 'service-depot',
    pos: [18.5, -5.0],
    size: [1.5, 0.6, 0.9],
    variant: 'compact',
    topHex: '#e0e6ed',
    shapeId: 'support-energy-service-station'
  }),

  // -- S edge --
  planned({
    id: 'S-EDGE-RES-01',
    sector: 's-culture-edge',
    type: 'house',
    pos: [5.0, -17.7],
    size: [1.2, 1.2, 0.85],
    variant: 'modern',
    topHex: '#e0e4eb',
    shapeId: 'low-detached-villa'
  }),

  // -- W edge --
  planned({
    id: 'W-EDGE-RES-01',
    sector: 'w-market-edge',
    type: 'house',
    pos: [-18.5, 5.0],
    size: [1.2, 1.2, 0.85],
    variant: 'green',
    topHex: '#dfeae0',
    shapeId: 'low-detached-villa'
  }),

  // NE / NW outer corner residences from Phase 1 deleted in Phase 2 — those
  // corners now host ResearchPark (NE @ (20, 19.5)) and SportsComplex
  // (NW @ (-21, 19)) respectively. Procedural infill in the new BLOCKS at
  // [-24, 16, -16, 22] and [16, 16, 22, 22] auto-fills the surrounding
  // residential pockets, so the manual outer-corner houses are no longer
  // needed.

  // -- SE outer corner (assigned to s-culture-edge) --
  planned({
    id: 'SE-OUT-RES-01',
    sector: 's-culture-edge',
    type: 'house',
    pos: [18.5, -18.0],
    size: [1.2, 1.2, 0.9],
    variant: 'modern',
    topHex: '#d6dde4',
    shapeId: 'low-detached-villa'
  }),
  planned({
    id: 'SE-OUT-RES-02',
    sector: 's-culture-edge',
    type: 'house',
    pos: [18.5, -19.3],
    size: [1.2, 1.2, 0.9],
    variant: 'modern',
    topHex: '#d0d8e1',
    shapeId: 'low-detached-villa'
  }),

  // -- SW outer corner (assigned to w-market-edge) --
  // Avoids SW-MET-01 at (-18.2, -18.2). Single house in this corner because
  // the utility shed and road buffers don't leave room for a second.
  planned({
    id: 'SW-OUT-RES-01',
    sector: 'w-market-edge',
    type: 'house',
    // Shifted -19.3 → -19.38 to clear SW-MET-01 (-18.2, -18.2) by 0.06u
    // while staying inside w-market-edge bounds (xmin=-20 minus
    // extraHalfW=0.02 → need x ≥ -19.38).
    pos: [-19.38, -17.7],
    size: [1.2, 1.2, 0.85],
    variant: 'green',
    topHex: '#dde9d5',
    shapeId: 'low-detached-villa'
  }),
  // SW corner has room for only 1 house: SW-MET-01 + road-x=-16 buffer rule
  // out the second viable spot. Compensate with a 12th house on
  // the N edge east end (mirror of N-EDGE-RES-01 at the west end).
  planned({
    id: 'N-EDGE-RES-02',
    sector: 'n-edu-edge',
    type: 'house',
    pos: [5.0, 18.5],
    size: [1.2, 1.2, 0.85],
    variant: 'green',
    topHex: '#dbe7d4',
    shapeId: 'low-detached-villa'
  })
]

export function buildMasterplanCity(): BuildingDef[] {
  return MASTERPLAN_BUILDINGS.map(({ id: _id, sector: _sector, ...building }) => ({ ...building }))
}
