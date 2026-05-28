import { useEffect, useState } from 'react'
import type { ShowroomMetrics } from '../scene/showroomContract'

/**
 * Reads the FPS sample that ShowroomMetricsProbe writes into
 * window.__showroomMetrics each second and renders it as a small badge
 * overlaid on the 3D canvas. Polls at 500ms — the probe only updates the
 * sample every 1s anyway, so faster polling is wasted work.
 */
export function FpsBadge() {
  const [fps, setFps] = useState<number | null>(null)
  const [frameMs, setFrameMs] = useState<number | null>(null)

  useEffect(() => {
    const tick = () => {
      const w = window as Window & { __showroomMetrics?: ShowroomMetrics }
      const m = w.__showroomMetrics
      if (m) {
        setFps(m.fps)
        setFrameMs(m.frameMs)
      }
    }
    tick()
    const id = window.setInterval(tick, 500)
    return () => window.clearInterval(id)
  }, [])

  const tone =
    fps == null
      ? 'text-text-dim'
      : fps >= 55
        ? 'text-accent'
        : fps >= 30
          ? 'text-warn'
          : 'text-crit'

  return (
    <div className="scene-fps absolute top-5 right-6 font-sans text-ui-caption tracking-ui-brand uppercase pointer-events-none leading-ui-compact text-right">
      <div className={`${tone} font-semibold tabular-nums`}>
        {fps == null ? '— FPS' : `${fps.toFixed(0)} FPS`}
      </div>
      <div className="text-text-mute tabular-nums">
        {frameMs == null ? '—' : `${frameMs.toFixed(1)} ms/frame`}
      </div>
    </div>
  )
}
