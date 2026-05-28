import { useId, useMemo } from 'react'
import { Area, AreaChart, Bar, BarChart, Cell, ResponsiveContainer } from 'recharts'
import type { NodeStatus } from '../hooks/useLiveKpis'

// Recharts defaults initialDimension to -1/-1 before ResizeObserver reports,
// which produces noisy warnings even when the final KPI slot is correctly sized.
const KPI_CHART_INITIAL_SIZE = { width: 160, height: 42 } as const

export function AreaSpark({ hist }: { hist: number[] }) {
  const data = useMemo(() => hist.map((v, i) => ({ i, v })), [hist])
  const gradId = `kpiAreaGrad-${useId().replace(/:/g, '')}`
  return (
    <ResponsiveContainer width="100%" height="100%" initialDimension={KPI_CHART_INITIAL_SIZE}>
      <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.55} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.04} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke="var(--accent)"
          strokeWidth={1.5}
          fill={`url(#${gradId})`}
          isAnimationActive
          animationDuration={650}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function AlarmBars({ hist }: { hist: number[] }) {
  // 非告警 bucket 用 0..2 的 deterministic 微抖 → 矮但有不规则；告警 bucket 用 v + 2（封顶 6）
  const data = useMemo(
    () => hist.map((v, i) => ({ i, v: v === 0 ? 1 + ((i * 7) % 3) : Math.min(6, v + 2) })),
    [hist]
  )
  return (
    <ResponsiveContainer width="100%" height="100%" initialDimension={KPI_CHART_INITIAL_SIZE}>
      <BarChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }} barCategoryGap={2}>
        <Bar
          dataKey="v"
          radius={[2, 2, 0, 0]}
          isAnimationActive
          animationDuration={400}
          animationEasing="ease-out"
        >
          {hist.map((v, i) => (
            <Cell key={i} fill={v > 0 ? 'var(--crit)' : 'rgba(var(--white-rgb), 0.22)'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function NodePills({ nodes }: { nodes: readonly NodeStatus[] }) {
  return (
    <div
      className="grid gap-1.5 h-full content-end"
      style={{ gridTemplateColumns: `repeat(${nodes.length}, minmax(0, 1fr))` }}
    >
      {nodes.map((n) => (
        <span
          key={n.id}
          data-node-id={n.id}
          data-node-state={n.ok ? 'ok' : 'alert'}
          className={`py-1 px-1 text-center font-sans text-ui-body rounded-md border leading-tight ${n.ok ? '' : 'node-pill-alert'}`}
          style={{
            color: n.ok ? 'var(--accent)' : 'var(--crit)',
            borderColor: n.ok ? 'rgba(var(--accent-rgb), 0.45)' : 'rgba(var(--crit-rgb), 0.55)',
            backgroundColor: n.ok ? 'rgba(var(--accent-rgb), 0.08)' : 'rgba(var(--crit-rgb), 0.14)',
          }}
        >
          {n.id}
        </span>
      ))}
    </div>
  )
}
