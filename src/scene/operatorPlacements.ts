import type { Placement } from './layout'
import type { PersonVariant } from '../elements/people/types'
import type { ShowroomOperatorRole } from './showroomContract'

export interface OperatorPlacement {
  id: string
  role: ShowroomOperatorRole
  variant: PersonVariant
  position: [number, number, number]
  rot: number
  anchorId: string
  tourStopId: string
  purposeZh: string
  crewId?: string
  footprint: {
    halfW: number
    halfD: number
  }
}

const OPERATOR_FOOTPRINT = { halfW: 0.14, halfD: 0.14 } as const

export const OPERATOR_PLACEMENTS: OperatorPlacement[] = [
  {
    id: 'ops-docent-command',
    role: 'docent',
    variant: 'showroom-guide',
    position: [2.2, 0, 1.6],
    rot: -2.3,
    anchorId: 'command-tower',
    tourStopId: 'command-core',
    purposeZh: '展厅讲解人面向中心塔，说明 AI Agent 如何统一调度能源资产。',
    footprint: OPERATOR_FOOTPRINT
  },
  {
    id: 'ops-dispatch-command',
    role: 'dispatch',
    variant: 'dispatch-operator',
    position: [-2.0, 0, 1.7],
    rot: 2.35,
    anchorId: 'command-tower',
    tourStopId: 'command-core',
    purposeZh: '调度员在指挥中心外侧复核告警、派工和功率预测。',
    footprint: OPERATOR_FOOTPRINT
  },
  {
    id: 'ops-security-plaza',
    role: 'security',
    variant: 'safety-guard',
    position: [6.55, 0, 4.9],
    rot: -2.55,
    anchorId: 'PS-02',
    tourStopId: 'east-storage',
    purposeZh: '安全员守在客户动线与告警区之间，强调展厅安全边界。',
    footprint: OPERATOR_FOOTPRINT
  },
  {
    id: 'ops-inspect-solar',
    role: 'inspection',
    variant: 'grid-inspector',
    position: [2.75, 0, 6.35],
    rot: -2.7,
    anchorId: 'PS-01',
    tourStopId: 'command-core',
    purposeZh: '巡检员在光伏节点边缘读取组串状态，不进入设施占地。',
    footprint: OPERATOR_FOOTPRINT
  },
  // East storage repair crew — pair sits on the open east service edge beside
  // PS-02's BatteryBank, far enough from cabinets / panels that the operator
  // hitbox is easy to click from the default camera.
  {
    id: 'ops-repair-battery-a',
    role: 'repair',
    variant: 'repair-tech',
    position: [6.85, 0, 2.0],
    rot: -2.15,
    anchorId: 'PS-02',
    tourStopId: 'east-storage',
    crewId: 'repair-battery',
    purposeZh: '维修班组 A 在 PS-02 储能柜外侧准备绝缘工具。',
    footprint: OPERATOR_FOOTPRINT
  },
  {
    id: 'ops-repair-battery-b',
    role: 'repair',
    variant: 'repair-tech',
    position: [6.85, 0, 4.0],
    rot: -2.45,
    anchorId: 'PS-02',
    tourStopId: 'east-storage',
    crewId: 'repair-battery',
    purposeZh: '维修班组 B 与 A 成组，复核 PS-02 储能母线绝缘。',
    footprint: OPERATOR_FOOTPRINT
  },
  {
    id: 'ops-docent-ev',
    role: 'docent',
    variant: 'showroom-guide',
    // EVChargingStation moved to (0, -5). Docent stands just south of the
    // canopy's plaza-facing edge so visitors see her gesture toward V2G.
    position: [2.7, 0, -6.9],
    rot: -1.6,
    anchorId: 'ev-N',
    tourStopId: 'north-mobility',
    purposeZh: '讲解人在车网协同港外侧引导客户看 V2G 与充电队列。',
    footprint: OPERATOR_FOOTPRINT
  },
  {
    id: 'ops-dispatch-grid',
    role: 'dispatch',
    variant: 'dispatch-operator',
    position: [6.8, 0, -9.55],
    rot: -0.45,
    anchorId: 'trans-S',
    tourStopId: 'south-grid',
    purposeZh: '电网调度员在南侧出线通道复核风光功率约束。',
    footprint: OPERATOR_FOOTPRINT
  },
  {
    // Crane was replaced by a community park, so this role shifts from a
    // safety-guard cordoning off a construction zone to a community-watch
    // attendant on the park perimeter. Same role family (security) so the
    // operator-role minimums stay satisfied.
    id: 'ops-security-park',
    role: 'security',
    variant: 'safety-guard',
    position: [-10.4, 0, 13.0],
    rot: -1.05,
    anchorId: 'nw-park',
    tourStopId: 'nw-community',
    purposeZh: '社区安保在公园出入口巡值，回应社区生活与公共空间安全叙事。',
    footprint: OPERATOR_FOOTPRINT
  },
  {
    id: 'ops-inspect-wind',
    role: 'inspection',
    variant: 'wind-tech',
    position: [-14.85, 0, -9.55],
    rot: 0.75,
    anchorId: 'wind-1',
    tourStopId: 'sw-wind-ops',
    purposeZh: '风电巡检员站在风场边界，等待智能体派发下一条检修路线。',
    footprint: OPERATOR_FOOTPRINT
  },
  {
    id: 'ops-repair-hydrogen-west',
    role: 'repair',
    variant: 'repair-tech',
    position: [-12.85, 0, -3.15],
    rot: -2.45,
    anchorId: 'h2-W-NW',
    tourStopId: 'west-hydrogen',
    crewId: 'repair-hydrogen',
    purposeZh: '氢站响应技工站在西侧 H2 service edge 外，等待安全阀处置确认。',
    footprint: OPERATOR_FOOTPRINT
  }
]

export function operatorRoleCounts() {
  return OPERATOR_PLACEMENTS.reduce<Record<ShowroomOperatorRole, number>>((acc, placement) => {
    acc[placement.role] = (acc[placement.role] ?? 0) + 1
    return acc
  }, {
    inspection: 0,
    dispatch: 0,
    security: 0,
    docent: 0,
    repair: 0
  })
}

export function operatorPlacementExtras(): Placement[] {
  return OPERATOR_PLACEMENTS.map((placement) => ({
    id: placement.id,
    kind: `Operator:${placement.role}`,
    x: placement.position[0],
    z: placement.position[2],
    halfW: placement.footprint.halfW,
    halfD: placement.footprint.halfD,
    rot: placement.rot
  }))
}
