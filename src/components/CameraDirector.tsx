// =============================================================================
// CameraDirector — lerps the camera + OrbitControls.target toward the
// currently selected facility, then RELEASES control back to OrbitControls.
//
// Behaviour matrix (driven by selectedId transitions):
//   null  → id   : ENTER zoom. Snapshot current camera+target so we can
//                  return here later, then lerp to focus point.
//   id    → id'  : SWITCH focus. Reuse the original snapshot for legacy /
//                  programmatic restore, but direct user clears still exit
//                  in place.
//   id    → null : EXIT zoom. Direct user clears (close button, re-click,
//                  empty click, wheel-out) close the card in place. Legacy /
//                  programmatic clears still lerp back to the snapshot.
//
// Independently, any OrbitControls 'start' event aborts the active lerp
// instantly — the moment the user grabs the mouse, they own the camera.
// =============================================================================

import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { type RefObject, useEffect, useMemo, useRef } from 'react'
import { useSelectionStore } from '../scene/selection'
import { useCameraMode, type CruisePauseReason } from '../scene/cameraMode'
import { getAnchorPosition } from '../scene/facilityMetadata'
import { getSelectableTargetFrame } from '../scene/selectableTargets'
import {
  CRUISE_HEIGHT,
  CRUISE_HEIGHT_DRIFT,
  CRUISE_ORBIT_SPEED,
  CRUISE_RADIUS,
  CRUISE_TARGET_Y_OFFSET,
  computeFacilityFocusFrame,
  cruiseAngleOffsetFromPosition,
  DEFAULT_CRUISE_ANGLE,
  DEFAULT_CAMERA_POSITION,
  DEFAULT_CAMERA_TARGET,
  distanceToTarget,
  FACILITY_AUTO_EXIT_DISTANCE,
} from '../scene/cameraMotion'

// Distance below which lerp is considered converged → switch to idle.
const SETTLED_EPS = 0.3
const NO_RESTORE_CLEAR_REASONS: ReadonlySet<CruisePauseReason> = new Set([
  'facility-click',
  'operator-click',
  'operator-card-close',
  'canvas-wheel',
  'empty-click',
])

interface CameraDirectorProps {
  /** Ref to the OrbitControls instance in CityScene. Forwarded here so we
   *  can write to controls.target without re-mounting the controls. */
  controlsRef: RefObject<any>
}

export function CameraDirector({ controlsRef }: CameraDirectorProps) {
  const selectedTarget = useSelectionStore((state) => state.selectedTarget)
  const selectedId = selectedTarget?.id ?? null
  const selectedKind = selectedTarget?.kind ?? null
  const setSelected = useSelectionStore((state) => state.setSelected)
  const {
    mode,
    cruiseState,
    cruiseRunId,
    pauseReason,
    setCameraMode,
    pauseCruise,
  } = useCameraMode()
  const { camera } = useThree()

  // Active transition: where lerp is heading.
  const transition = useRef<'to-focus' | 'to-restore' | null>(null)
  const focusRef = useRef<{ pos: THREE.Vector3; look: THREE.Vector3 } | null>(null)
  // Snapshot of where the user was BEFORE entering zoom. Used as the
  // exit-lerp target so closing the panel returns the user to their last
  // self-driven view instead of the hard-coded isometric default.
  const snapshot = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null)
  // Tracks the previous selectedId so we can detect enter/switch/exit.
  const prevSelectedRef = useRef<string | null>(null)
  const skipNextRestoreRef = useRef(false)
  const autoExitPendingRef = useRef(false)
  const pauseReasonRef = useRef(pauseReason)
  const cruiseStateRef = useRef(cruiseState)
  const cruiseAngleOffsetRef = useRef(DEFAULT_CRUISE_ANGLE)
  const lastCruiseRunIdRef = useRef(cruiseRunId)
  const prevCruiseStateRef = useRef(cruiseState)
  const elapsedRef = useRef(0)
  const cruiseNextTargetRef = useRef(new THREE.Vector3())
  const cruiseDesiredPosRef = useRef(new THREE.Vector3())

  const cruiseTarget = useMemo(() => {
    const anchor = getAnchorPosition('command-tower') ?? [0, 0, 0]
    return new THREE.Vector3(anchor[0], anchor[1] + CRUISE_TARGET_Y_OFFSET, anchor[2])
  }, [])

  useEffect(() => {
    pauseReasonRef.current = pauseReason
  }, [pauseReason])

  useEffect(() => {
    cruiseStateRef.current = cruiseState
  }, [cruiseState])

  // Drive transitions from selectedId changes.
  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    const prev = prevSelectedRef.current
    prevSelectedRef.current = selectedId

    if (selectedId && !prev) {
      // ENTER zoom: snapshot current camera+target so we can restore later.
      const targetFrame = selectedKind ? getSelectableTargetFrame(selectedKind, selectedId) : null
      if (!targetFrame) return
      pauseCruise('focus')
      snapshot.current = {
        pos: camera.position.clone(),
        target: controls.target.clone(),
      }
      const focus = computeFacilityFocusFrame({
        cameraPosition: camera.position,
        currentTarget: controls.target,
        anchorPosition: targetFrame.position,
        focusDistance: targetFrame.focusDistance,
        minDistance: targetFrame.minDistance,
        maxDistance: targetFrame.maxDistance,
        lookYOffset: targetFrame.lookYOffset,
      })
      focusRef.current = { pos: focus.position, look: focus.target }
      transition.current = 'to-focus'
      setCameraMode('focus-transition')
    } else if (selectedId && prev) {
      // SWITCH: keep the original snapshot for legacy / programmatic restore,
      // but lerp toward the new focus.
      const targetFrame = selectedKind ? getSelectableTargetFrame(selectedKind, selectedId) : null
      if (!targetFrame) return
      pauseCruise('focus')
      const focus = computeFacilityFocusFrame({
        cameraPosition: camera.position,
        currentTarget: controls.target,
        anchorPosition: targetFrame.position,
        focusDistance: targetFrame.focusDistance,
        minDistance: targetFrame.minDistance,
        maxDistance: targetFrame.maxDistance,
        lookYOffset: targetFrame.lookYOffset,
      })
      focusRef.current = { pos: focus.position, look: focus.target }
      transition.current = 'to-focus'
      setCameraMode('focus-transition')
    } else if (!selectedId && prev) {
      focusRef.current = null
      const clearWithoutRestore = skipNextRestoreRef.current ||
        cruiseStateRef.current === 'running' ||
        (pauseReasonRef.current !== null && NO_RESTORE_CLEAR_REASONS.has(pauseReasonRef.current))
      if (clearWithoutRestore) {
        skipNextRestoreRef.current = false
        autoExitPendingRef.current = false
        transition.current = null
        snapshot.current = null
        setCameraMode('manual')
      } else {
        // EXIT zoom: lerp back to the snapshot.
        transition.current = 'to-restore'
        setCameraMode('restore-transition')
      }
    }
  }, [selectedId, selectedKind, camera, controlsRef, pauseCruise, setCameraMode])

  // Listen for OrbitControls 'start' (user grabbed the mouse) — abort any
  // active transition so user is in full control immediately.
  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    const onStart = () => {
      pauseCruise('orbit-start')
      // User took over: cancel the active lerp. If they were RESTORING
      // (no selection), also drop the snapshot — wherever they drag to is
      // their new "default", which we'll snapshot fresh on the next zoom.
      if (transition.current === 'to-restore') snapshot.current = null
      transition.current = null
      setCameraMode(selectedId ? 'focused' : 'manual')
    }
    controls.addEventListener('start', onStart)
    return () => {
      controls.removeEventListener('start', onStart)
    }
  }, [controlsRef, pauseCruise, selectedId, setCameraMode])

  useEffect(() => {
    if (cruiseState === 'running' && !selectedId) {
      transition.current = null
      focusRef.current = null
      snapshot.current = null
      setCameraMode('cruise')
    }
  }, [cruiseRunId, cruiseState, selectedId, setCameraMode])

  useEffect(() => {
    const controls = controlsRef.current
    const previousCruiseState = prevCruiseStateRef.current
    prevCruiseStateRef.current = cruiseState
    if (!controls || selectedId || previousCruiseState !== 'paused' || cruiseState !== 'running') return

    cruiseAngleOffsetRef.current = cruiseAngleOffsetFromPosition(
      camera.position,
      controls.target,
      elapsedRef.current
    )
    lastCruiseRunIdRef.current = cruiseRunId
  }, [camera, controlsRef, cruiseRunId, cruiseState, selectedId])

  useFrame(({ clock }) => {
    const controls = controlsRef.current
    if (!controls) return
    const elapsed = clock.getElapsedTime()
    elapsedRef.current = elapsed
    const t = transition.current

    if (t === 'to-focus' && focusRef.current) {
      const focus = focusRef.current
      camera.position.lerp(focus.pos, 0.08)
      controls.target.lerp(focus.look, 0.08)
      controls.update()
      if (
        camera.position.distanceTo(focus.pos) < SETTLED_EPS &&
        controls.target.distanceTo(focus.look) < SETTLED_EPS
      ) {
        transition.current = null
        setCameraMode('focused')
      }
    } else if (t === 'to-restore') {
      const snap = snapshot.current
      const targetPos = snap?.pos ?? DEFAULT_CAMERA_POSITION
      const targetLook = snap?.target ?? DEFAULT_CAMERA_TARGET
      camera.position.lerp(targetPos, 0.06)
      controls.target.lerp(targetLook, 0.06)
      controls.update()
      if (
        camera.position.distanceTo(targetPos) < SETTLED_EPS &&
        controls.target.distanceTo(targetLook) < SETTLED_EPS
      ) {
        transition.current = null
        snapshot.current = null   // restore complete; forget the snapshot
        setCameraMode('manual')
      }
    } else if (
      selectedId &&
      !autoExitPendingRef.current &&
      distanceToTarget(camera.position, controls.target) > FACILITY_AUTO_EXIT_DISTANCE
    ) {
      skipNextRestoreRef.current = true
      autoExitPendingRef.current = true
      transition.current = null
      focusRef.current = null
      snapshot.current = null
      pauseCruise('auto-exit')
      setCameraMode('manual')
      setSelected(null)
    } else if (cruiseState === 'running' && !selectedId) {
      if (lastCruiseRunIdRef.current !== cruiseRunId) {
        cruiseAngleOffsetRef.current = cruiseAngleOffsetFromPosition(camera.position, controls.target, elapsed)
        lastCruiseRunIdRef.current = cruiseRunId
      }
      const angle = cruiseAngleOffsetRef.current + elapsed * CRUISE_ORBIT_SPEED
      const nextTarget = cruiseNextTargetRef.current.copy(controls.target).lerp(cruiseTarget, 0.018)
      const desiredPos = cruiseDesiredPosRef.current.set(
        nextTarget.x + Math.cos(angle) * CRUISE_RADIUS,
        nextTarget.y + CRUISE_HEIGHT + Math.sin(elapsed * 0.17) * CRUISE_HEIGHT_DRIFT,
        nextTarget.z + Math.sin(angle) * CRUISE_RADIUS
      )
      camera.position.lerp(desiredPos, 0.012)
      controls.target.copy(nextTarget)
      controls.update()
      if (mode !== 'cruise') setCameraMode('cruise')
    }
  })

  return null
}
