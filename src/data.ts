export type EventLevel = 'INFO' | 'OK' | 'WARN' | 'CRIT'

export interface EventRow {
  ts: string
  level: EventLevel
  src: string
  detail: string
  facilityId?: string
}

export const events: EventRow[] = [
  { ts: '18:48:18', level: 'CRIT', src: 'PS-02 Penang', detail: 'Inverter #4 detected DC arc fault', facilityId: 'PS-02' },
  { ts: '18:48:18', level: 'WARN', src: 'PS-02 Penang', detail: 'Combiner box #2 24°C above baseline', facilityId: 'PS-02' },
  { ts: '18:48:18', level: 'INFO', src: 'Drone 01', detail: 'Pre-flight cleared · ETA 6 min', facilityId: 'drone-N' },
  { ts: '18:48:18', level: 'INFO', src: 'Service Van 04', detail: 'Left depot with spare IGBT modules' },
  { ts: '18:48:22', level: 'OK', src: 'Repair Crew 2 (Chen)', detail: 'Dispatch confirmed · en route to site' },
  { ts: '18:48:18', level: 'OK', src: 'PS-04 Malacca', detail: 'Daily yield target met (1.84 MWh)', facilityId: 'PS-04' },
  { ts: '18:48:18', level: 'INFO', src: 'Diagnosis Agent', detail: 'Bayesian root-cause complete · arc confidence 91%', facilityId: 'command-tower' },
  { ts: '18:48:18', level: 'INFO', src: 'Optimization Agent', detail: 'Site-wide performance ratio stable at 84.2%' },
  { ts: '18:48:18', level: 'WARN', src: 'PS-05 Johor', detail: 'WO-2026-0418 overdue 3 days', facilityId: 'PS-05' },
  { ts: '18:46:02', level: 'OK', src: 'PS-01 KL', detail: 'Inverter cluster sync normal', facilityId: 'PS-01' },
  { ts: '18:45:51', level: 'INFO', src: 'Grid Agent', detail: 'Feed-in tariff stable at MYR 0.317/kWh' },
  { ts: '18:45:30', level: 'OK',   src: 'V2G Hub',     detail: 'Charge queue stable · 2 vehicles refueling', facilityId: 'ev-N' },
  // Phase 4-C: events backing non-PV facility demo statuses.
  // Adding these lets src/scene/status.ts::deriveStatus() pick them up
  // automatically — change the level here and the StatusRing in 3D updates.
  // After the residential infill pass, each energy kind has a single anchor:
  // battery → PS-02's BatteryBank (alarm hero); h2-W-NW stays as the only
  // hydrogen sphere; vat-S-W is the only ground VAT.
  { ts: '18:48:10', level: 'WARN', src: 'PS-02 Storage',  detail: 'Cell module #3 voltage drift +0.18V', facilityId: 'PS-02' },
  { ts: '18:48:05', level: 'WARN', src: 'SW Wind Farm',   detail: 'Blade #2 vibration at 1.4× baseline', facilityId: 'wind-1' },
  { ts: '18:47:45', level: 'CRIT', src: 'West H2 Station', detail: 'Pressure relief valve triggered at 7.3 bar', facilityId: 'h2-W-NW' },
  { ts: '18:47:30', level: 'WARN', src: 'South VAT',      detail: 'RPM below dispatch threshold · 0.42×', facilityId: 'vat-S-W' },
  { ts: '18:47:15', level: 'INFO', src: 'NW Community Park', detail: 'Dusk 17:00 foot traffic 38 · fountain to night low-pressure mode', facilityId: 'nw-park' }
]

export const EVENT_LEVEL_LABELS: Record<EventLevel, string> = {
  INFO: 'INFO',
  OK: 'OK',
  WARN: 'WARN',
  CRIT: 'CRIT'
}

export interface PVPlant {
  id: string
  name: string
  position: [number, number, number]
  capacityKw: number
  status: 'ok' | 'warn' | 'crit'
  yieldMwh: number
}

// 3-arm cross layout (was 4). The S arm at z=-5 used to be PS-03 (怡保
// 地面电站) — user replaced it with the EVChargingStation, so the plaza
// south now hosts e-mobility instead of solar. PS-04 (Melaka CarRow) stays
// in the N e-mobility mid-block; PS-02 (alarm hero) anchors East at the
// most visible direction.
export const plants: PVPlant[] = [
  { id: 'PS-01', name: 'KL Rooftop PV A',       position: [0,  0,  5],  capacityKw: 680,  status: 'ok',   yieldMwh: 2.14 }, // N
  { id: 'PS-02', name: 'Penang Industrial PV',  position: [5,  0,  0],  capacityKw: 1200, status: 'crit', yieldMwh: 0.92 }, // E (alarm)
  { id: 'PS-04', name: 'Malacca V2G Depot',     position: [0,  0,  14], capacityKw: 320,  status: 'ok',   yieldMwh: 1.84 }, // N block (e-mobility cluster)
  { id: 'PS-05', name: 'Johor Agri-Solar',      position: [-5, 0,  0],  capacityKw: 2400, status: 'warn', yieldMwh: 4.32 }  // W
]

export const kpis = {
  portfolioPowerKw: 2152,
  alarmCount24h: 2,
  nodeStatus: [
    { id: 'PS-01', ok: true },
    { id: 'PS-02', ok: false },
    { id: 'PS-04', ok: true },
    { id: 'PS-05', ok: false }
  ],
  agentTokens: 46.2
}
