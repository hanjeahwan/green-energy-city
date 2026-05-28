import { useRef } from 'react'
import { useFrame, type RenderCallback } from '@react-three/fiber'

// =============================================================================
// useThrottledFrame
//
// Drop-in replacement for useFrame that only invokes the callback at most
// `hz` times per second. The callback still receives the FULL accumulated
// delta since the last invocation (so position integrators stay correct
// across skipped frames).
//
// Use for animation that doesn't need 60Hz fidelity: blade rotation,
// emissive flicker, status pulse, mast breathing, power-flow strobe.
// Do NOT use for position-critical motion (vehicles, drones, camera lerp)
// — choppy at 20Hz.
//
// 20Hz cinema is borderline jittery; 30Hz is the safe ceiling for any
// motion. Use 20 for non-motion (pulses/flickers), 30 for slow rotation
// where the eye can barely tell the difference.
// =============================================================================

export function useThrottledFrame(callback: RenderCallback, hz: number) {
  const accumRef = useRef(0)
  const period = 1 / hz
  useFrame((state, delta) => {
    accumRef.current += delta
    if (accumRef.current < period) return
    const accumulated = accumRef.current
    accumRef.current = 0
    callback(state, accumulated)
  })
}
