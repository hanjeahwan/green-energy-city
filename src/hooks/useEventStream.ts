import { useCallback, useEffect, useState } from 'react'
import type { EventLevel, EventRow } from '../data'

const MAX_EVENTS = 30
const TICK_MIN_MS = 3000
const TICK_MAX_MS = 6000

interface Template {
  level: EventLevel
  src: string
  detail: string
}

const MOCK_TEMPLATES: Template[] = [
  { level: 'INFO', src: 'PS-01 KL',         detail: 'Inverter auto-calibration done ({N}/12)' },
  { level: 'OK',   src: 'PS-04 Malacca',    detail: 'Daily yield cumulative {MWh} MWh' },
  { level: 'WARN', src: 'PS-02 Penang',     detail: 'Battery temp rose to {T}°C' },
  { level: 'OK',   src: 'Inspection Agent', detail: 'Patrol route {N} complete' },
  { level: 'INFO', src: 'Grid Dispatch',    detail: 'Load shifted to {kW} kW' },
  { level: 'OK',   src: 'V2G Station',      detail: '{N} user sessions settled' },
  { level: 'INFO', src: 'PS-05 Johor',      detail: 'Array tilt adjusted +{deg}°' },
  { level: 'OK',   src: 'Diagnosis Agent',  detail: 'Health score {pct}%' },
  { level: 'INFO', src: 'Drone 0{N}',       detail: 'Patrol complete · returning to base' },
  { level: 'WARN', src: 'SW Wind Farm',     detail: 'Blade #2 vibration {x}× baseline' },
  { level: 'INFO', src: 'West H2 Station',  detail: 'H2 pressure stable at {bar} bar' },
  { level: 'OK',   src: 'V2G Hub',          detail: 'V2G reverse-charge {kW} kW' },
  { level: 'INFO', src: 'Community Park',   detail: '{N} visitors · fountain saving {pct}% water' },
  { level: 'INFO', src: 'Maintenance',      detail: 'Work order WO-{Y} status: in progress' }
]

function fillVars(detail: string): string {
  return detail
    .replace(/\{N\}/g, () => String(Math.floor(Math.random() * 9) + 1))
    .replace(/\{T\}/g, () => (38 + Math.random() * 3).toFixed(1))
    .replace(/\{kW\}/g, () => String(Math.floor(1800 + Math.random() * 800)))
    .replace(/\{MWh\}/g, () => (1.2 + Math.random() * 2).toFixed(2))
    .replace(/\{deg\}/g, () => (Math.random() * 0.6).toFixed(2))
    .replace(/\{pct\}/g, () => String(Math.floor(78 + Math.random() * 22)))
    .replace(/\{x\}/g, () => (1.1 + Math.random() * 0.5).toFixed(2))
    .replace(/\{bar\}/g, () => (6.0 + Math.random() * 1.4).toFixed(1))
    .replace(/\{Y\}/g, () => `2026-${String(Math.floor(Math.random() * 900) + 100)}`)
}

function formatTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function makeRow(input: Omit<EventRow, 'ts'> & { ts?: string }): EventRow {
  return { ...input, ts: input.ts ?? formatTime(new Date()) }
}

export function useEventStream(seed: EventRow[]) {
  const [list, setList] = useState<EventRow[]>(() => seed.slice(0, MAX_EVENTS))

  const push = useCallback((row: Omit<EventRow, 'ts'> & { ts?: string }) => {
    setList((prev) => {
      const entry = makeRow(row)
      const next = [entry, ...prev]
      return next.length > MAX_EVENTS ? next.slice(0, MAX_EVENTS) : next
    })
  }, [])

  useEffect(() => {
    let timer: number | undefined
    const tick = () => {
      const tpl = MOCK_TEMPLATES[Math.floor(Math.random() * MOCK_TEMPLATES.length)]
      push({ level: tpl.level, src: tpl.src, detail: fillVars(tpl.detail) })
      timer = window.setTimeout(tick, TICK_MIN_MS + Math.random() * (TICK_MAX_MS - TICK_MIN_MS))
    }
    timer = window.setTimeout(tick, TICK_MIN_MS + Math.random() * (TICK_MAX_MS - TICK_MIN_MS))
    return () => {
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [push])

  return { list, push }
}
