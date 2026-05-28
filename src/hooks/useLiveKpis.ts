import { useEffect, useState } from 'react'
import { kpis } from '../data'

const HISTORY = 20
const ALARM_HISTORY = 12  // 12 个 2-hour bucket = 24h
const TICK_MS = 1000

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

function initialAlarmHist(): number[] {
  const arr = Array(ALARM_HISTORY).fill(0)
  arr[ALARM_HISTORY - 4] = 2
  arr[ALARM_HISTORY - 3] = 3
  return arr
}

export interface NodeStatus {
  id: string
  ok: boolean
}

export const LIVE_NODE_STATUS: readonly NodeStatus[] = kpis.nodeStatus.map((node) => ({ ...node }))

export function useLiveKpis() {
  const [power, setPower] = useState(kpis.portfolioPowerKw)
  const [tokens, setTokens] = useState(kpis.agentTokens)
  const [powerHist, setPowerHist] = useState<number[]>(() =>
    Array.from({ length: HISTORY }, (_, i) => kpis.portfolioPowerKw + Math.sin(i * 0.5) * 40)
  )
  const [tokensHist, setTokensHist] = useState<number[]>(() =>
    Array.from({ length: HISTORY }, (_, i) => kpis.agentTokens + Math.sin(i * 0.4) * 4)
  )
  const [alarmHist24h, setAlarmHist24h] = useState<number[]>(initialAlarmHist)
  const [latencyMs, setLatencyMs] = useState(142)
  const [agentsOnline, setAgentsOnline] = useState(8)
  // node status stays stable (matches src/data.ts seed).
  const nodes = LIVE_NODE_STATUS

  useEffect(() => {
    let alarmTick = 0
    const id = window.setInterval(() => {
      setPower((prev) => {
        // 双随机：基线游走 ±100 + 偶发 spike ±180 = 更夸张的实时波动
        const spike = Math.random() < 0.18 ? (Math.random() - 0.5) * 360 : 0
        const next = clamp(prev + (Math.random() - 0.5) * 200 + spike, 1800, 2400)
        setPowerHist((h) => [...h.slice(1), next])
        return next
      })
      setTokens((prev) => {
        const spike = Math.random() < 0.18 ? (Math.random() - 0.5) * 12 : 0
        const next = clamp(prev + (Math.random() - 0.5) * 6 + spike, 32, 62)
        setTokensHist((h) => [...h.slice(1), next])
        return next
      })
      alarmTick++
      if (alarmTick % 10 === 0) {
        setAlarmHist24h((h) => {
          const next = [...h]
          const last = next.length - 1
          const r = Math.random()
          if (r < 0.35) next[last] = Math.min(5, next[last] + 1)
          else if (r < 0.55 && next[last] > 0) next[last] = next[last] - 1
          return next
        })
      }
      if (alarmTick % 3 === 0) {
        setLatencyMs((prev) => clamp(Math.round(prev + (Math.random() - 0.5) * 30), 110, 185))
      }
      if (alarmTick % 6 === 0) {
        setAgentsOnline(6 + Math.floor(Math.random() * 3))
      }
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [])

  return { power, tokens, powerHist, tokensHist, alarmHist24h, latencyMs, agentsOnline, nodes }
}
