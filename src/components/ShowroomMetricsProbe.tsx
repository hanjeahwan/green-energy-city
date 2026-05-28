import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import {
  SHOWROOM_PERFORMANCE_BASELINE,
  type ShowroomMetrics,
  type ShowroomRuntimeAnchor
} from '../scene/showroomContract'
import { useCameraMode } from '../scene/cameraMode'
import { publishIncidentDebug } from '../scene/operatorResponse'
import { useShowroomRuntimeStore } from '../scene/showroomRuntime'

interface ShowroomMetricsProbeProps {
  enablePerformanceMetrics?: boolean
}

export function ShowroomMetricsProbe({ enablePerformanceMetrics = false }: ShowroomMetricsProbeProps) {
  const { gl, camera } = useThree()
  const { mode, cruiseState, pauseReason, cruiseRunId } = useCameraMode()
  const publishCameraReadout = useShowroomRuntimeStore((state) => state.publishCameraReadout)
  const lastCameraPublishRef = useRef(0)
  const sampleRef = useRef({
    lastTime: 0,
    frames: 0,
    fps: 0,
    frameMs: 0,
    frameTimes: [] as number[]
  })

  useEffect(() => {
    publishIncidentDebug()
  }, [])

  useEffect(() => {
    const debugWindow = window as Window & { __showroomMetrics?: ShowroomMetrics }

    if (!enablePerformanceMetrics) {
      delete debugWindow.__showroomMetrics
      delete document.documentElement.dataset.showroomFps
      delete document.documentElement.dataset.showroomP95FrameMs
      return
    }

    const previousAutoReset = gl.info.autoReset
    gl.info.autoReset = false
    gl.info.reset()
    return () => {
      gl.info.autoReset = previousAutoReset
      gl.info.reset()
    }
  }, [enablePerformanceMetrics, gl])

  useFrame(({ clock }, delta) => {
    const now = clock.getElapsedTime()
    // SceneZoomReadout subscribes to this store directly. Sampling at 10Hz keeps
    // the HUD responsive without frame-loop → DOM → interval → React churn.
    if (now - lastCameraPublishRef.current >= 0.1) {
      lastCameraPublishRef.current = now
      const horiz = Math.hypot(camera.position.x, camera.position.z)
      publishCameraReadout({
        distance: Number(camera.position.length().toFixed(1)),
        elevationDeg: Number(((Math.atan2(camera.position.y, horiz) * 180) / Math.PI).toFixed(0)),
        mode,
        cruiseState,
        pauseReason,
        cruiseRunId
      })
    }

    if (!enablePerformanceMetrics) return

    const sample = sampleRef.current
    sample.frames += 1
    sample.frameTimes.push(delta * 1000)
    if (sample.frameTimes.length > 240) sample.frameTimes.shift()
    if (now - sample.lastTime < 1) return

    const elapsed = now - sample.lastTime
    sample.fps = sample.frames / elapsed
    sample.frameMs = 1000 / Math.max(sample.fps, 1)
    const sortedFrameTimes = [...sample.frameTimes].sort((a, b) => a - b)
    const p95Index = Math.max(0, Math.ceil(sortedFrameTimes.length * 0.95) - 1)
    const p95FrameMs = sortedFrameTimes[p95Index] ?? sample.frameMs
    const framesInSample = Math.max(sample.frames, 1)
    const drawCalls = Math.round(gl.info.render.calls / framesInSample)
    const triangles = Math.round(gl.info.render.triangles / framesInSample)
    sample.frames = 0
    sample.lastTime = now

    const debugWindow = window as Window & {
      __showroomAnchors?: Record<string, ShowroomRuntimeAnchor>
      __showroomMetrics?: ShowroomMetrics
    }
    debugWindow.__showroomMetrics = {
      fps: Number(sample.fps.toFixed(1)),
      frameMs: Number(sample.frameMs.toFixed(1)),
      p95FrameMs: Number(p95FrameMs.toFixed(1)),
      frameTimes: sample.frameTimes.slice(-120).map((frameMs) => Number(frameMs.toFixed(1))),
      drawCalls,
      triangles,
      anchors: Object.keys(debugWindow.__showroomAnchors ?? {}).length,
      baseline: SHOWROOM_PERFORMANCE_BASELINE,
      updatedAt: performance.now()
    }
    document.documentElement.dataset.showroomFps = String(debugWindow.__showroomMetrics.fps)
    document.documentElement.dataset.showroomP95FrameMs = String(debugWindow.__showroomMetrics.p95FrameMs)
    gl.info.reset()
  })

  return null
}
