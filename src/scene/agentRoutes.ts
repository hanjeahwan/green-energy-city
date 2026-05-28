export type AgentRouteKind = 'energy' | 'dispatch' | 'safety' | 'mobility'

export interface AgentRoute {
  id: string
  labelZh: string
  kind: AgentRouteKind
  fromAnchorId: string
  toAnchorId: string
  color: string
  speed: number
  waypoints: [number, number, number][]
}

const y = 0.065

export const COMMAND_AGENT_ROUTES: AgentRoute[] = [
  {
    id: 'route-command-ps02',
    labelZh: '告警分诊流',
    kind: 'safety',
    fromAnchorId: 'command-tower',
    toAnchorId: 'PS-02',
    color: '#e8504a',
    speed: 0.58,
    waypoints: [[0, y, 0], [2.4, y, 0], [5, y, 0]]
  },
  // Storage flow used to reach a standalone east-mid-block BatteryBank.
  // That cabinet was removed in the residential-infill pass; PS-02 now owns
  // the only battery, so storage narrative routes via PS-02 (covered by
  // route-command-ps02 above). Keeping this stub commented for narrative
  // archaeology — restore if a dedicated east battery returns.
  {
    id: 'route-command-ev',
    labelZh: '车网协同流',
    kind: 'mobility',
    fromAnchorId: 'command-tower',
    toAnchorId: 'ev-N',
    color: '#5aa7ff',
    speed: 0.42,
    // EVChargingStation relocated from north (-3, 11.8) to plaza south
    // (0, -5). Single straight segment along the z axis.
    waypoints: [[0, y, 0], [0, y, -2.5], [0, y, -5]]
  },
  {
    id: 'route-command-drone',
    labelZh: '无人机巡检流',
    kind: 'dispatch',
    fromAnchorId: 'command-tower',
    toAnchorId: 'drone-N',
    color: '#6ee7d8',
    speed: 0.64,
    waypoints: [[0, y, 0], [2.55, y, 2.55], [2.55, y, 8], [3, y, 8], [3, y, 12]]
  },
  {
    id: 'route-command-h2',
    labelZh: '氢能韧性流',
    kind: 'energy',
    fromAnchorId: 'command-tower',
    toAnchorId: 'h2-W-NW',
    color: '#8bd49c',
    speed: 0.34,
    // Endpoint now at (-12, -4) — the sole surviving H2 sphere position.
    waypoints: [[0, y, 0], [-2.35, y, -2.35], [-8, y, -2.35], [-12, y, -2.35], [-12, y, -4]]
  },
  {
    id: 'route-command-grid',
    labelZh: '电网预测流',
    kind: 'energy',
    fromAnchorId: 'command-tower',
    toAnchorId: 'trans-S',
    color: '#7fb4d8',
    speed: 0.36,
    waypoints: [[0, y, 0], [2.55, y, -2.55], [2.55, y, -8], [4.2, y, -8], [4.2, y, -12], [6, y, -12]]
  },
  {
    id: 'route-command-substation',
    labelZh: '变电站保护流',
    kind: 'energy',
    fromAnchorId: 'command-tower',
    toAnchorId: 'substation-W',
    color: '#54d6ff',
    speed: 0.32,
    waypoints: [[0, y, 0], [-2.55, y, 2.55], [-8, y, 2.55], [-12, y, 2.55], [-12, y, 0]]
  },
  {
    id: 'route-command-wind',
    labelZh: '风电运维流',
    kind: 'dispatch',
    fromAnchorId: 'command-tower',
    toAnchorId: 'wind-1',
    color: '#6fb3c8',
    speed: 0.4,
    waypoints: [[0, y, 0], [-2.55, y, -2.55], [-8, y, -2.55], [-8, y, -8], [-12, y, -8], [-12, y, -12]]
  },
  {
    id: 'route-command-logistics',
    labelZh: '物流调度流',
    kind: 'dispatch',
    fromAnchorId: 'command-tower',
    toAnchorId: 'container-A',
    color: '#f0c85a',
    speed: 0.46,
    waypoints: [[0, y, 0], [2.35, y, 3.6], [8, y, 3.6], [8, y, -8], [12, y, -8], [12, y, -10]]
  },
  {
    // Was 'route-command-crane' / 施工安全流 — repurposed for the NW
    // community park that replaced the crane set-piece.
    id: 'route-command-park',
    labelZh: '社区智能体流',
    kind: 'safety',
    fromAnchorId: 'command-tower',
    toAnchorId: 'nw-park',
    color: '#8bd49c',
    speed: 0.5,
    waypoints: [[0, y, 0], [-2.55, y, 2.55], [-8, y, 2.55], [-8, y, 8], [-12, y, 8], [-12, y, 12]]
  }
]
