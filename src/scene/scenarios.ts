// Mock scenario engine — drives multi-step demos so the showroom HUD reads
// like a real incident response, not a one-shot toast.
//
// A scenario is a chronologically-ordered list of {at, event?, toast?} steps.
// `useScenario(addEvent, addToast)` returns a `run(id)` callback that schedules
// every step via `setTimeout`. Timers are cleared automatically on unmount of
// the calling component (returned cleanup ref).

import { useCallback, useEffect, useRef } from 'react'
import type { EventLevel, EventRow } from '../data'
import type { ToastTone } from '../components/ui/sonner'

type AddEvent = (row: Omit<EventRow, 'ts'>) => void
type AddToast = (text: string, tone?: ToastTone) => void

export interface ScenarioStep {
  /** Delay from scenario start, ms. */
  at: number
  event?: { level: EventLevel; src: string; detail: string; facilityId?: string }
  toast?: { text: string; tone?: ToastTone }
}

export const SCENARIOS: Record<string, ScenarioStep[]> = {
  // 22s emergency-response demo: SOS escalation → crew dispatch → drone IR → on-site → stabilized
  sos: [
    { at: 0,     event: { level: 'CRIT', src: 'Emergency',       detail: 'SOS escalated · regional lead engaged within 60s', facilityId: 'PS-02' }, toast: { text: 'SOS escalated', tone: 'warn' } },
    { at: 2000,  event: { level: 'INFO', src: 'Dispatch Center', detail: 'Crew 2 + service van 04 mobilized · ETA 18 min' },                       toast: { text: 'Crew dispatched', tone: 'warn' } },
    { at: 5000,  event: { level: 'INFO', src: 'Drone 02',        detail: 'Pre-flight IR scan cleared · launching', facilityId: 'drone-N' } },
    { at: 9000,  event: { level: 'OK',   src: 'Drone 02',        detail: 'On-site IR confirms hot-spot at array #12', facilityId: 'PS-02' } },
    { at: 14000, event: { level: 'OK',   src: 'Crew 2 (Chen)',   detail: 'Arrived · isolating affected string' },                                   toast: { text: 'Crew on site' } },
    { at: 22000, event: { level: 'OK',   src: 'Operations',      detail: 'Site stabilized · short-term loss 38 kW (3.2%)' },                        toast: { text: 'Resolved' } },
  ],

  // 18s grid-fault demo: feeder trip → backup arm → BESS bridge → reclose → stable
  gridFault: [
    { at: 0,     event: { level: 'CRIT', src: 'Substation 03',   detail: 'Feeder breaker tripped · 2.4 MW load shed', facilityId: 'TX-03' },         toast: { text: 'Grid fault detected', tone: 'warn' } },
    { at: 2500,  event: { level: 'INFO', src: 'Dispatch Center', detail: 'Backup feeder armed · transferring critical loads' },                      toast: { text: 'Backup feeder armed' } },
    { at: 6000,  event: { level: 'INFO', src: 'PCS Controller',  detail: 'BESS supplying 1.8 MW during transfer window' } },
    { at: 11000, event: { level: 'OK',   src: 'Substation 03',   detail: 'Reclose successful · feeder back in service' },                            toast: { text: 'Feeder restored' } },
    { at: 18000, event: { level: 'OK',   src: 'Operations',      detail: 'Grid stable · 14 customers affected, 4 min average outage' } },
  ],

  // 20s wind-turbine overspeed demo: gust front → auto-pitch derate → review → stabilize
  turbineOverspeed: [
    { at: 0,     event: { level: 'WARN', src: 'WT-07',           detail: 'Rotor RPM 17.8 → 21.4 · gust front incoming' },                            toast: { text: 'Turbine overspeed', tone: 'warn' } },
    { at: 3000,  event: { level: 'INFO', src: 'SCADA',           detail: 'Auto-pitching blades to 14° · derating to 60%' } },
    { at: 7000,  event: { level: 'INFO', src: 'Maintenance',     detail: 'Remote engineer reviewing vibration trace' } },
    { at: 12000, event: { level: 'OK',   src: 'WT-07',           detail: 'RPM nominal · resuming full output' },                                     toast: { text: 'Turbine stabilized' } },
    { at: 20000, event: { level: 'OK',   src: 'Operations',      detail: 'Event closed · 0.4% generation loss for 7 min' } },
  ],

  // 20s H2 leak recovery: detector trip → isolation → ventilation → on-site → cleared
  hydrogenLeakRecovery: [
    { at: 0,     event: { level: 'CRIT', src: 'H2 Sphere W',     detail: 'Leak detector array #3 · LEL 24% · valve auto-shut', facilityId: 'PS-04' }, toast: { text: 'H2 leak isolated', tone: 'warn' } },
    { at: 3000,  event: { level: 'INFO', src: 'Safety Bot',      detail: 'Forced ventilation engaged · perimeter cleared 20m' } },
    { at: 8000,  event: { level: 'INFO', src: 'Crew 1 (PPE)',    detail: 'On-site sniffer sweep · locating flange #7' },                             toast: { text: 'Crew on site' } },
    { at: 14000, event: { level: 'OK',   src: 'Crew 1 (PPE)',    detail: 'Gasket replaced · pressure test 1.2× nominal pass' } },
    { at: 20000, event: { level: 'OK',   src: 'Operations',      detail: 'Site clear · LEL <0.1% sustained 10 min · cleared for refill' },           toast: { text: 'H2 site cleared' } },
  ],
}

export type ScenarioId = keyof typeof SCENARIOS

export function useScenario(addEvent: AddEvent, addToast: AddToast) {
  const timersRef = useRef<number[]>([])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current = []
  }, [])

  // Clear any pending steps on unmount so demos don't fire into a dead tree
  useEffect(() => {
    return clearTimers
  }, [clearTimers])

  return useCallback(
    (id: ScenarioId) => {
      const steps = SCENARIOS[id]
      if (!steps) return
      clearTimers()
      for (const step of steps) {
        const timer = window.setTimeout(() => {
          if (step.event) addEvent(step.event)
          if (step.toast) addToast(step.toast.text, step.toast.tone)
        }, step.at)
        timersRef.current.push(timer)
      }
    },
    [addEvent, addToast, clearTimers]
  )
}
