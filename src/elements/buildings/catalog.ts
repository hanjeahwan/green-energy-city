// =============================================================================
// Buildings catalog — palettes, district routing, type/size pickers.
//
// Phase 1: holds the shared data referenced by all 7 building renderers and
// the procedural generator (`genBuildings` in CityScene.tsx). No VARIANTS
// table yet — buildings are procedurally generated and the per-instance
// "variant" is encoded in BuildingDef fields (topHex, hasRoofUnit, hasPV,
// hasRailing). Phase 2 will introduce silhouette-level variants (e.g. Office
// glass-curtain vs panel) by adding alt branches inside each renderer.
// =============================================================================

import type {
  BuildingDef,
  BuildingHeightBand,
  BuildingShapeCategory,
  BuildingType,
  BuildingUseCategory,
  BuildingVariant,
  District,
  Footprint,
  SupportFacilityKind
} from '../types'
import {
  BUILDING_PALETTES,
  CORE_NAVY,
  ENERGY_CYAN,
  NEUTRAL_SURFACES
} from '../../scene/palette'
export { BLOCKS } from '../../scene/spatialZones'

// -----------------------------------------------------------------------------
// Color tokens — cohesive cool palette (eco-futurist navy / slate / silver).
// Re-exported here so building renderers don't need to import from CityScene.
//
// NOTE: COOL_NAVY and ACCENT_CYAN are now aliases of the semantic tokens in
// src/scene/palette.ts. Existing import sites keep working unchanged. New
// code should prefer importing from palette.ts directly.
// -----------------------------------------------------------------------------

export const COOL_NAVY = CORE_NAVY
export const COOL_SLATE = NEUTRAL_SURFACES.slate
export const COOL_SILVER = NEUTRAL_SURFACES.silver
export const COOL_WHITE = NEUTRAL_SURFACES.white
export const ACCENT_CYAN = ENERGY_CYAN

// Fallback palettes live in palette.ts; this file keeps the old public export
// names for renderers that already import from the building catalog.
export const OFFICE_PALETTE = [...BUILDING_PALETTES.office]
export const WAREHOUSE_PALETTE = [...BUILDING_PALETTES.warehouse]
export const FACTORY_PALETTE = [...BUILDING_PALETTES.factory]
export const APT_PALETTE = [...BUILDING_PALETTES.apartment]
export const HOUSE_PALETTE = [...BUILDING_PALETTES.house]
export const SKYSCRAPER_PALETTE = [...BUILDING_PALETTES.skyscraper]
export const CIVIC_PALETTE = [...BUILDING_PALETTES.civic]
export const ENERGY_PALETTE = [...BUILDING_PALETTES.energy]
export const ROOF_PALETTE = [...BUILDING_PALETTES.roof]

export interface BuildingShapeSpec {
  labelZh: string
  useCategory: BuildingUseCategory
  heightBand?: BuildingHeightBand
  shapeCategory: BuildingShapeCategory
  shapeFamily: string
  requiredSilhouetteFeatures: string[]
  supportKind?: SupportFacilityKind
  extraHalfW?: number
  extraHalfD?: number
  sweepR?: number
}

export const BUILDING_SHAPE_SPECS = {
  'low-detached-villa': {
    labelZh: '独栋能源别墅',
    useCategory: 'residential',
    heightBand: 'low-rise',
    shapeCategory: 'residential-low',
    shapeFamily: 'detached-villa',
    requiredSilhouetteFeatures: ['独立庭院', '门廊', '坡屋顶'],
    extraHalfW: 0.02,
    extraHalfD: 0.02
  },
  'low-townhouse-row': {
    labelZh: '联排住宅组团',
    useCategory: 'residential',
    heightBand: 'low-rise',
    shapeCategory: 'residential-low',
    shapeFamily: 'townhouse-row',
    requiredSilhouetteFeatures: ['连续单元', '重复门洞', '分段屋顶'],
    extraHalfW: 0.1,
    extraHalfD: 0.12
  },
  'low-bungalow': {
    labelZh: '低矮平房',
    useCategory: 'residential',
    heightBand: 'low-rise',
    shapeCategory: 'residential-low',
    shapeFamily: 'bungalow',
    requiredSilhouetteFeatures: ['宽檐', '单层体量', '前廊'],
    extraHalfW: 0.02,
    extraHalfD: 0.02
  },
  'low-courtyard-house': {
    labelZh: '院落住宅',
    useCategory: 'residential',
    heightBand: 'low-rise',
    shapeCategory: 'residential-low',
    shapeFamily: 'courtyard-house',
    requiredSilhouetteFeatures: ['半围合院落', '侧翼', '入口雨棚'],
    extraHalfW: 0.02,
    extraHalfD: 0.02
  },
  'low-roof-garden-villa': {
    labelZh: '屋顶花园住宅',
    useCategory: 'residential',
    heightBand: 'low-rise',
    shapeCategory: 'residential-low',
    shapeFamily: 'roof-garden-villa',
    requiredSilhouetteFeatures: ['屋顶花园', '露台', '绿化檐口'],
    extraHalfW: 0.14,
    extraHalfD: 0.14
  },
  'mid-standard-block': {
    labelZh: '普通多层居民楼',
    useCategory: 'residential',
    heightBand: 'mid-rise',
    shapeCategory: 'residential-mid',
    shapeFamily: 'standard-apartment-block',
    requiredSilhouetteFeatures: ['规则窗格', '入口门厅', '平屋顶'],
    extraHalfW: 0.08,
    extraHalfD: 0.1
  },
  'mid-old-estate-slab': {
    labelZh: '老式小区板楼',
    useCategory: 'residential',
    heightBand: 'mid-rise',
    shapeCategory: 'residential-mid',
    shapeFamily: 'estate-slab',
    requiredSilhouetteFeatures: ['长板楼', '外廊', '服务管线'],
    extraHalfW: 0.1,
    extraHalfD: 0.12
  },
  'mid-student-apartment': {
    labelZh: '学生公寓',
    useCategory: 'residential',
    heightBand: 'mid-rise',
    shapeCategory: 'residential-mid',
    shapeFamily: 'student-dorm',
    requiredSilhouetteFeatures: ['重复小窗', '公共走廊', '共享入口'],
    extraHalfW: 0.02,
    extraHalfD: 0.02
  },
  'mid-courtyard-apartment': {
    labelZh: '围合多层公寓',
    useCategory: 'residential',
    heightBand: 'mid-rise',
    shapeCategory: 'residential-mid',
    shapeFamily: 'courtyard-apartment',
    requiredSilhouetteFeatures: ['L 形体量', '内院', '连廊'],
    extraHalfW: 0.14,
    extraHalfD: 0.16
  },
  'mid-roof-garden-block': {
    labelZh: '屋顶花园公寓',
    useCategory: 'residential',
    heightBand: 'mid-rise',
    shapeCategory: 'residential-mid',
    shapeFamily: 'roof-garden-block',
    requiredSilhouetteFeatures: ['屋顶花园', '阳台层', '绿化立面'],
    extraHalfW: 0.1,
    extraHalfD: 0.12
  },
  'high-sky-garden-tower': {
    labelZh: '空中花园住宅塔',
    useCategory: 'residential',
    heightBand: 'high-rise',
    shapeCategory: 'residential-high',
    shapeFamily: 'sky-garden-tower',
    requiredSilhouetteFeatures: ['空中花园', '塔身切口', '住宅阳台'],
    extraHalfW: 0.04,
    extraHalfD: 0.05
  },
  'high-stepped-luxury-tower': {
    labelZh: '阶梯豪宅塔楼',
    useCategory: 'residential',
    heightBand: 'high-rise',
    shapeCategory: 'residential-high',
    shapeFamily: 'stepped-luxury-tower',
    requiredSilhouetteFeatures: ['阶梯退台', '冠部会所', '深阳台'],
    extraHalfW: 0.04,
    extraHalfD: 0.04
  },
  'high-balcony-spine-tower': {
    labelZh: '阳台脊柱住宅塔',
    useCategory: 'residential',
    heightBand: 'high-rise',
    shapeCategory: 'residential-high',
    shapeFamily: 'balcony-spine-tower',
    requiredSilhouetteFeatures: ['竖向阳台脊柱', '错层露台', '深色核心筒'],
    extraHalfW: 0.05,
    extraHalfD: 0.04
  },
  'high-terrace-crown-tower': {
    labelZh: '冠部露台住宅塔',
    useCategory: 'residential',
    heightBand: 'high-rise',
    shapeCategory: 'residential-high',
    shapeFamily: 'terrace-crown-tower',
    requiredSilhouetteFeatures: ['冠部露台', '裙房入口', '转角阳台'],
    extraHalfW: 0.04,
    extraHalfD: 0.04
  },
  'high-twin-slim-tower': {
    labelZh: '双芯细塔公寓',
    useCategory: 'residential',
    heightBand: 'high-rise',
    shapeCategory: 'residential-high',
    shapeFamily: 'twin-slim-tower',
    requiredSilhouetteFeatures: ['双塔身', '连接层', '住宅竖窗'],
    extraHalfW: 0.06,
    extraHalfD: 0.05
  },
  'office-glass-tower': {
    labelZh: '玻璃写字楼',
    useCategory: 'office-commercial',
    heightBand: 'mid-rise',
    shapeCategory: 'office-commercial',
    shapeFamily: 'glass-office',
    requiredSilhouetteFeatures: ['玻璃幕墙', '入口雨棚', '屋顶设备层'],
    extraHalfW: 0.08,
    extraHalfD: 0.1
  },
  'office-business-center': {
    labelZh: '商务中心',
    useCategory: 'office-commercial',
    heightBand: 'mid-rise',
    shapeCategory: 'office-commercial',
    shapeFamily: 'business-center',
    requiredSilhouetteFeatures: ['石材裙房', '大堂', '水平窗带'],
    extraHalfW: 0.1,
    extraHalfD: 0.12
  },
  'office-cowork-terrace': {
    labelZh: '联合办公楼',
    useCategory: 'office-commercial',
    heightBand: 'mid-rise',
    shapeCategory: 'office-commercial',
    shapeFamily: 'cowork-terrace',
    requiredSilhouetteFeatures: ['共享露台', '错层平台', '开放首层'],
    extraHalfW: 0.12,
    extraHalfD: 0.12
  },
  'office-low-commercial': {
    labelZh: '低层商业办公',
    useCategory: 'office-commercial',
    heightBand: 'low-rise',
    shapeCategory: 'office-commercial',
    shapeFamily: 'low-commercial-office',
    requiredSilhouetteFeatures: ['底商', '连续骑楼', '浅色招牌带'],
    extraHalfW: 0.02,
    extraHalfD: 0.02
  },
  'office-atrium-podium': {
    labelZh: '共享中庭办公综合体',
    useCategory: 'office-commercial',
    heightBand: 'mid-rise',
    shapeCategory: 'office-commercial',
    shapeFamily: 'atrium-podium',
    requiredSilhouetteFeatures: ['共享中庭', '裙房', '连桥'],
    extraHalfW: 0.02,
    extraHalfD: 0.02
  },
  'support-guard-booth': {
    labelZh: '小区门卫室',
    useCategory: 'community-support',
    heightBand: 'low-rise',
    shapeCategory: 'support-facility',
    shapeFamily: 'guard-booth',
    supportKind: 'guard-booth',
    requiredSilhouetteFeatures: ['小体量', '门岗雨棚', '岗亭窗'],
    extraHalfW: 0.1,
    extraHalfD: 0.12
  },
  'support-garage-entry': {
    labelZh: '地下车库入口',
    useCategory: 'community-support',
    heightBand: 'low-rise',
    shapeCategory: 'support-facility',
    shapeFamily: 'garage-entry',
    supportKind: 'garage-entry',
    requiredSilhouetteFeatures: ['下沉坡道', '护墙', '入口棚架'],
    extraHalfW: 0.02,
    extraHalfD: 0.02
  },
  'support-community-center': {
    labelZh: '社区活动中心',
    useCategory: 'community-support',
    heightBand: 'low-rise',
    shapeCategory: 'support-facility',
    shapeFamily: 'community-center',
    supportKind: 'community-center',
    requiredSilhouetteFeatures: ['公共大厅', '外摆平台', '大窗'],
    extraHalfW: 0.14,
    extraHalfD: 0.12
  },
  'support-energy-service-station': {
    labelZh: '能源服务站',
    useCategory: 'community-support',
    heightBand: 'low-rise',
    shapeCategory: 'support-facility',
    shapeFamily: 'energy-service-station',
    supportKind: 'energy-service-station',
    requiredSilhouetteFeatures: ['服务车位', '设备棚', '蓝绿状态屏'],
    extraHalfW: 0.14,
    extraHalfD: 0.14
  },
  'support-management-kiosk': {
    labelZh: '社区管理亭',
    useCategory: 'community-support',
    heightBand: 'low-rise',
    shapeCategory: 'support-facility',
    shapeFamily: 'management-kiosk',
    supportKind: 'management-kiosk',
    requiredSilhouetteFeatures: ['管理窗口', '信息屏', '细杆信标'],
    extraHalfW: 0.02,
    extraHalfD: 0.02
  },
  'energy-lab-node': {
    labelZh: '能源实验节点',
    useCategory: 'energy',
    heightBand: 'low-rise',
    shapeCategory: 'energy',
    shapeFamily: 'energy-lab',
    requiredSilhouetteFeatures: ['设备舱', '屋顶光伏', '状态面板'],
    extraHalfW: 0.08,
    extraHalfD: 0.08
  },
  'logistics-depot': {
    labelZh: '智能物流仓配',
    useCategory: 'industrial-logistics',
    heightBand: 'low-rise',
    shapeCategory: 'industrial-logistics',
    shapeFamily: 'logistics-depot',
    requiredSilhouetteFeatures: ['装卸门', '长跨屋面', '调度灯带'],
    extraHalfW: 0.02,
    extraHalfD: 0.02
  }
} as const satisfies Record<string, BuildingShapeSpec>

export type BuildingShapeId = keyof typeof BUILDING_SHAPE_SPECS

export function buildingVisualFootprint(building: BuildingDef): Footprint {
  if (building.visualFootprint) return building.visualFootprint
  const shape = building.shapeId
    ? BUILDING_SHAPE_SPECS[building.shapeId as BuildingShapeId] as BuildingShapeSpec | undefined
    : undefined
  return {
    halfW: building.w / 2 + (shape?.extraHalfW ?? 0),
    halfD: building.d / 2 + (shape?.extraHalfD ?? 0),
    ...(shape?.sweepR ? { sweepR: shape.sweepR } : {})
  }
}

export function pickPalette(type: BuildingType): string[] {
  switch (type) {
    case 'warehouse': return WAREHOUSE_PALETTE
    case 'factory': return FACTORY_PALETTE
    case 'apartment': return APT_PALETTE
    case 'house': return HOUSE_PALETTE
    case 'skyscraper': return SKYSCRAPER_PALETTE
    case 'townhouse': return HOUSE_PALETTE
    case 'green-apartment': return APT_PALETTE
    case 'energy-lab': return ENERGY_PALETTE
    case 'microgrid-control': return ENERGY_PALETTE
    case 'parking-deck': return CIVIC_PALETTE
    case 'service-depot': return WAREHOUSE_PALETTE
    case 'utility-shed': return FACTORY_PALETTE
    default: return OFFICE_PALETTE
  }
}

// -----------------------------------------------------------------------------
// Block-based city layout.
// 8 buildable blocks around the central 16x16 plaza. Roads at x={-16,-8,8,16}
// z={-16,-8,8,16}. Plaza (x∈[-8,8], z∈[-8,8]) is intentionally NOT a block —
// reserved for tower + 4 cardinal PV stations.
// -----------------------------------------------------------------------------

// Pick building type from district + random roll
export function pickTypeForDistrict(district: District, roll: number): BuildingType {
  switch (district) {
    case 'cbd':
      return roll < 0.7 ? 'skyscraper' : roll < 0.95 ? 'office' : 'apartment'
    case 'commercial':
      return roll < 0.6 ? 'office' : roll < 0.9 ? 'apartment' : 'skyscraper'
    case 'midrise':
      return roll < 0.55 ? 'office' : 'apartment'
    case 'outer-residential':
      // Outer ring favours detached low-rise housing — mostly houses and
      // townhouses, only the occasional small apartment. Avoids the "block
      // of flats" feel for what should read as a peripheral suburb.
      return roll < 0.55 ? 'house' : roll < 0.9 ? 'townhouse' : 'apartment'
    case 'residential':
      // Rebalanced to mix apartments with houses/townhouses without any
      // position-based rule (user vetoed the perimeter pattern as too
      // rigid). Down from 45 % apartment to 30 %, with townhouse the new
      // plurality. green-apartment kept at 5 % as a sage-roof accent.
      return roll < 0.30 ? 'house'
           : roll < 0.65 ? 'townhouse'
           : roll < 0.95 ? 'apartment'
           : 'green-apartment'
    case 'industrial':
      return roll < 0.32 ? 'service-depot' : roll < 0.58 ? 'warehouse' : roll < 0.82 ? 'factory' : 'utility-shed'
  }
}

// Variant picker — called by genBuildings with an independent rng roll per instance.
// Phase 5-C4: 3-way split — classic / modern / industrial.
// - All types: 40% classic, 35% modern, 25% industrial
// - Skyscrapers lean modern (10% classic, 60% modern, 30% industrial) so the
//   NE backdrop reads as a contemporary skyline with art-deco accents sprinkled.
export function pickVariant(type: BuildingType, roll: number): BuildingVariant {
  if (type === 'skyscraper') {
    if (roll < 0.1) return 'classic'
    if (roll < 0.7) return 'modern'
    return 'industrial'
  }
  if (
    type === 'townhouse' ||
    type === 'green-apartment' ||
    type === 'energy-lab' ||
    type === 'microgrid-control'
  ) {
    if (roll < 0.55) return 'green'
    if (roll < 0.8) return 'modern'
    return 'compact'
  }
  if (type === 'parking-deck' || type === 'utility-shed') {
    if (roll < 0.45) return 'compact'
    if (roll < 0.75) return 'modern'
    return 'industrial'
  }
  if (type === 'service-depot') {
    if (roll < 0.55) return 'industrial'
    if (roll < 0.8) return 'modern'
    return 'compact'
  }
  if (roll < 0.4) return 'classic'
  if (roll < 0.68) return 'modern'
  if (roll < 0.82) return 'green'
  return 'industrial'
}

// Building dimensions per type (no per-call randomization for w/d — uniform within type).
export function sizeForType(type: BuildingType, rngVal: number): { w: number; d: number; h: number } {
  switch (type) {
    case 'skyscraper':
      return { w: 1.6, d: 1.6, h: 6 + rngVal * 6 }
    case 'office':
      return { w: 1.4, d: 1.4, h: 1.8 + rngVal * 1.6 }
    case 'apartment':
      return { w: 1.3, d: 1.7, h: 2.2 + rngVal * 1.0 }
    case 'warehouse':
      return { w: 2.0, d: 1.6, h: 1.0 + rngVal * 0.5 }
    case 'factory':
      return { w: 1.6, d: 1.8, h: 1.4 + rngVal * 0.6 }
    case 'house':
      return { w: 1.0, d: 1.1, h: 0.7 + rngVal * 0.3 }
    case 'townhouse':
      return { w: 1.8, d: 0.9, h: 0.9 + rngVal * 0.35 }
    case 'energy-lab':
      return { w: 1.5, d: 1.1, h: 1.2 + rngVal * 0.5 }
    case 'microgrid-control':
      return { w: 1.0, d: 0.8, h: 0.8 + rngVal * 0.25 }
    case 'parking-deck':
      return { w: 1.7, d: 1.0, h: 1.1 + rngVal * 0.4 }
    case 'service-depot':
      return { w: 1.7, d: 1.0, h: 0.9 + rngVal * 0.3 }
    case 'utility-shed':
      return { w: 0.8, d: 0.7, h: 0.65 + rngVal * 0.25 }
    case 'green-apartment':
      return { w: 1.3, d: 1.3, h: 2.1 + rngVal * 0.8 }
  }
}
