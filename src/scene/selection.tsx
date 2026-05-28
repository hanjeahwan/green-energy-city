// =============================================================================
// Selection state — Zustand store that tracks which facility/operator the user
// is currently hovering and which one they have clicked into.
//
// Pre-this-file the scene had ZERO interactive state (audit confirmed: no
// pointer handlers, no useState in CityScene, no store). For the upcoming
// InteractiveAnchor + FacilityCard + CameraDirector trio we need a tiny
// shared state container that:
//   - HUD components can read (BottomDeck highlighting selected NODE STATUS)
//   - The 3D scene can read (outlines, focused PowerFlowLine)
//   - InteractiveAnchor writes via pointer handlers
//
// Kept behind a tiny selector-store API so hover churn does not force the whole
// <CityScene/> tree to re-render. Provider is still mounted in App.tsx for the
// debug publisher and backwards-compatible tree shape.
// =============================================================================

import { useEffect, useMemo, type ReactNode } from 'react'
import { create } from 'zustand'

export type FacilityKind =
  | 'pv'
  | 'battery'
  | 'h2'
  | 'ev'
  | 'drone'
  | 'wind'
  | 'vat'
  | 'crane'
  | 'container'
  | 'transmission'
  | 'command'
  | 'service-van'
  | 'aerial-drone'

export type SelectionTargetKind = 'facility' | 'operator'

export interface SelectionTarget {
  kind: SelectionTargetKind
  id: string
}

export interface SelectionState {
  hoveredId: string | null
  selectedId: string | null
  hoveredKind: SelectionTargetKind | null
  selectedKind: SelectionTargetKind | null
  hoveredTarget: SelectionTarget | null
  selectedTarget: SelectionTarget | null
  selectedFacilityId: string | null
  selectedOperatorId: string | null
  setHovered: (id: string | null, kind?: SelectionTargetKind) => void
  setSelected: (id: string | null, kind?: SelectionTargetKind) => void
  /** Clear both hovered + selected (used by ESC handler / empty-space click). */
  clear: () => void
}

interface SelectionStore {
  hoveredTarget: SelectionTarget | null
  selectedTarget: SelectionTarget | null
  setHovered: (id: string | null, kind?: SelectionTargetKind) => void
  setSelected: (id: string | null, kind?: SelectionTargetKind) => void
  clear: () => void
}

function sameTarget(a: SelectionTarget | null, b: SelectionTarget | null): boolean {
  return a?.id === b?.id && a?.kind === b?.kind
}

export const useSelectionStore = create<SelectionStore>((set) => ({
  hoveredTarget: null,
  selectedTarget: null,
  setHovered: (id, kind = 'facility') => {
    const next = id ? { id, kind } : null
    set((state) => sameTarget(state.hoveredTarget, next) ? state : { hoveredTarget: next })
  },
  setSelected: (id, kind = 'facility') => {
    const next = id ? { id, kind } : null
    set((state) => sameTarget(state.selectedTarget, next) ? state : { selectedTarget: next })
  },
  clear: () => {
    set((state) => state.hoveredTarget === null && state.selectedTarget === null
      ? state
      : { hoveredTarget: null, selectedTarget: null })
  },
}))

function selectionSnapshot(
  hoveredTarget: SelectionTarget | null,
  selectedTarget: SelectionTarget | null,
  setHovered: SelectionStore['setHovered'],
  setSelected: SelectionStore['setSelected'],
  clear: SelectionStore['clear'],
): SelectionState {
  const hoveredId = hoveredTarget?.id ?? null
  const selectedId = selectedTarget?.id ?? null
  const hoveredKind = hoveredTarget?.kind ?? null
  const selectedKind = selectedTarget?.kind ?? null
  const selectedFacilityId = selectedKind === 'facility' ? selectedId : null
  const selectedOperatorId = selectedKind === 'operator' ? selectedId : null

  return {
    hoveredId,
    selectedId,
    hoveredKind,
    selectedKind,
    hoveredTarget,
    selectedTarget,
    selectedFacilityId,
    selectedOperatorId,
    setHovered,
    setSelected,
    clear
  }
}

function SelectionDebugPublisher() {
  const hoveredTarget = useSelectionStore((state) => state.hoveredTarget)
  const selectedTarget = useSelectionStore((state) => state.selectedTarget)
  const hoveredId = hoveredTarget?.id ?? null
  const selectedId = selectedTarget?.id ?? null
  const hoveredKind = hoveredTarget?.kind ?? null
  const selectedKind = selectedTarget?.kind ?? null

  useEffect(() => {
    if (typeof window === 'undefined') return
    const debugWindow = window as Window & {
      __showroomSelection?: {
        selectedKind: SelectionTargetKind | null
        selectedId: string | null
        hoveredKind: SelectionTargetKind | null
        hoveredId: string | null
      }
    }
    debugWindow.__showroomSelection = { selectedKind, selectedId, hoveredKind, hoveredId }
    document.documentElement.dataset.showroomSelectedKind = selectedKind ?? ''
    document.documentElement.dataset.showroomSelectedId = selectedId ?? ''
    document.documentElement.dataset.showroomHoveredKind = hoveredKind ?? ''
    document.documentElement.dataset.showroomHoveredId = hoveredId ?? ''
  }, [hoveredId, hoveredKind, selectedId, selectedKind])

  return null
}

export function SelectionProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <SelectionDebugPublisher />
      {children}
    </>
  )
}

/** Read the full selection snapshot. Prefer useSelectionStore(selector) in hot
 *  paths so hover changes do not wake components that only care about selected. */
export function useSelection(): SelectionState {
  const hoveredTarget = useSelectionStore((state) => state.hoveredTarget)
  const selectedTarget = useSelectionStore((state) => state.selectedTarget)
  const setHovered = useSelectionStore((state) => state.setHovered)
  const setSelected = useSelectionStore((state) => state.setSelected)
  const clear = useSelectionStore((state) => state.clear)
  return useMemo(
    () => selectionSnapshot(hoveredTarget, selectedTarget, setHovered, setSelected, clear),
    [hoveredTarget, selectedTarget, setHovered, setSelected, clear]
  )
}
