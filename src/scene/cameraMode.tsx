import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export type CameraMode =
  | 'cruise'
  | 'manual'
  | 'focus-transition'
  | 'focused'
  | 'restore-transition'

export type CruiseState = 'running' | 'paused'

export type CruisePauseReason =
  | 'canvas-pointer'
  | 'canvas-wheel'
  | 'empty-click'
  | 'facility-click'
  | 'operator-click'
  | 'operator-card-close'
  | 'operator-keyboard-focus'
  | 'cruise-toggle'
  | 'tab-hidden'
  | 'orbit-start'
  | 'focus'
  | 'auto-exit'
  | 'unknown'

export interface CameraModeState {
  mode: CameraMode
  cruiseState: CruiseState
  pauseReason: CruisePauseReason | null
  lastUserInteractionAt: number | null
  cruiseRunId: number
  setCameraMode: (mode: CameraMode) => void
  pauseCruise: (reason?: CruisePauseReason) => void
  resumeCruise: () => void
}

export interface CruiseVisibilitySnapshot {
  mode: CameraMode
  cruiseState: CruiseState
  pauseReason: CruisePauseReason | null
  cruiseRunId: number
  resumeCruiseOnVisible: boolean
}

export type CruiseVisibilityAction = 'none' | 'pause-tab-hidden' | 'resume-tab-visible'

export interface CruiseVisibilityTransition {
  action: CruiseVisibilityAction
  state: CruiseVisibilitySnapshot
}

const noop = () => {}

const defaultState: CameraModeState = {
  mode: 'cruise',
  cruiseState: 'running',
  pauseReason: null,
  lastUserInteractionAt: null,
  cruiseRunId: 0,
  setCameraMode: noop,
  pauseCruise: noop,
  resumeCruise: noop,
}

const CameraModeCtx = createContext<CameraModeState>(defaultState)

function now(): number {
  return globalThis.performance?.now?.() ?? Date.now()
}

export function reconcileCruiseVisibility(
  snapshot: CruiseVisibilitySnapshot,
  visibilityState: DocumentVisibilityState
): CruiseVisibilityTransition {
  if (visibilityState === 'visible') {
    if (!snapshot.resumeCruiseOnVisible) {
      return {
        action: 'none',
        state: { ...snapshot, resumeCruiseOnVisible: false },
      }
    }

    return {
      action: 'resume-tab-visible',
      state: {
        ...snapshot,
        mode: 'cruise',
        cruiseState: 'running',
        pauseReason: null,
        cruiseRunId: snapshot.cruiseRunId + 1,
        resumeCruiseOnVisible: false,
      },
    }
  }

  if (snapshot.cruiseState === 'running' && snapshot.mode === 'cruise') {
    return {
      action: 'pause-tab-hidden',
      state: {
        ...snapshot,
        mode: 'manual',
        cruiseState: 'paused',
        pauseReason: 'tab-hidden',
        resumeCruiseOnVisible: true,
      },
    }
  }

  return {
    action: 'none',
    state: {
      ...snapshot,
      resumeCruiseOnVisible: snapshot.pauseReason === 'tab-hidden'
        ? snapshot.resumeCruiseOnVisible
        : false,
    },
  }
}

export function CameraModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<CameraMode>('cruise')
  const [cruiseState, setCruiseState] = useState<CruiseState>('running')
  const [pauseReason, setPauseReason] = useState<CruisePauseReason | null>(null)
  const [lastUserInteractionAt, setLastUserInteractionAt] = useState<number | null>(null)
  const [cruiseRunId, setCruiseRunId] = useState(0)
  const modeRef = useRef(mode)
  const cruiseStateRef = useRef(cruiseState)
  const pauseReasonRef = useRef(pauseReason)
  const cruiseRunIdRef = useRef(cruiseRunId)
  const resumeCruiseOnVisibleRef = useRef(false)

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    cruiseStateRef.current = cruiseState
  }, [cruiseState])

  useEffect(() => {
    pauseReasonRef.current = pauseReason
  }, [pauseReason])

  useEffect(() => {
    cruiseRunIdRef.current = cruiseRunId
  }, [cruiseRunId])

  const setCameraMode = useCallback((nextMode: CameraMode) => {
    modeRef.current = nextMode
    setMode(nextMode)
  }, [])

  const pauseCruise = useCallback((reason: CruisePauseReason = 'unknown') => {
    if (reason !== 'tab-hidden') resumeCruiseOnVisibleRef.current = false
    cruiseStateRef.current = 'paused'
    pauseReasonRef.current = reason
    modeRef.current = modeRef.current === 'cruise' ? 'manual' : modeRef.current
    setCruiseState('paused')
    setPauseReason(reason)
    setLastUserInteractionAt(now())
    setMode((current) => current === 'cruise' ? 'manual' : current)
  }, [])

  const resumeCruise = useCallback(() => {
    resumeCruiseOnVisibleRef.current = false
    cruiseStateRef.current = 'running'
    pauseReasonRef.current = null
    modeRef.current = 'cruise'
    cruiseRunIdRef.current += 1
    setCruiseState('running')
    setPauseReason(null)
    setMode('cruise')
    setCruiseRunId((value) => value + 1)
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return

    const handleVisibilityChange = () => {
      const transition = reconcileCruiseVisibility({
        mode: modeRef.current,
        cruiseState: cruiseStateRef.current,
        pauseReason: pauseReasonRef.current,
        cruiseRunId: cruiseRunIdRef.current,
        resumeCruiseOnVisible: resumeCruiseOnVisibleRef.current,
      }, document.visibilityState)

      resumeCruiseOnVisibleRef.current = transition.state.resumeCruiseOnVisible

      if (transition.action === 'pause-tab-hidden') {
        pauseCruise('tab-hidden')
      } else if (transition.action === 'resume-tab-visible') {
        resumeCruise()
      }
    }

    handleVisibilityChange()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [pauseCruise, resumeCruise])

  const value = useMemo<CameraModeState>(
    () => ({
      mode,
      cruiseState,
      pauseReason,
      lastUserInteractionAt,
      cruiseRunId,
      setCameraMode,
      pauseCruise,
      resumeCruise,
    }),
    [
      mode,
      cruiseState,
      pauseReason,
      lastUserInteractionAt,
      cruiseRunId,
      setCameraMode,
      pauseCruise,
      resumeCruise,
    ]
  )

  return <CameraModeCtx.Provider value={value}>{children}</CameraModeCtx.Provider>
}

export function useCameraMode(): CameraModeState {
  return useContext(CameraModeCtx)
}
