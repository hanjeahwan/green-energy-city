// =============================================================================
// FacilityCard — drei <Html> overlay anchored above a clicked/hovered facility.
//
// Two modes driven by SelectionState:
//   - 'hover' : compact pill (title + status dot + 1 KPI). Renders when
//               hoveredId === id and selectedId !== id. Read-only, no
//               pointer events (cards shouldn't block re-hover).
//   - 'full'  : detail card (status row, KPI grid, close button). Renders
//               when selectedId === id. Pointer-enabled so the close button
//               works.
//
// Styling lives in src/styles.css (.fac-card class). Keeps the existing
// CSS-variable system; no Tailwind / no CSS-in-JS dependency.
// =============================================================================

import { Html } from '@react-three/drei'
import { X } from 'lucide-react'
import { useSelectionStore } from '../scene/selection'
import { useCameraMode } from '../scene/cameraMode'
import { getMeta } from '../scene/facilityMetadata'
import { getAssignmentForFacility } from '../scene/operatorResponse'
import { getOperatorProfile } from '../scene/operatorMetadata'
import { formatCardValue } from '../scene/cardDisplay'
import { deriveStatus } from '../scene/status'

export type CardMode = 'hover' | 'full'

interface FacilityCardProps {
  id: string
  /** Local position (relative to InteractiveAnchor's group). Typically just
   *  above the bounding box top so the card floats over the facility. */
  position: [number, number, number]
  mode: CardMode
}

export function FacilityCard({ id, position, mode }: FacilityCardProps) {
  const setSelected = useSelectionStore((state) => state.setSelected)
  const { pauseCruise } = useCameraMode()
  const meta = getMeta(id)
  const status = meta.status ?? deriveStatus(id)
  const assignment = getAssignmentForFacility(id)
  const assignmentOwner = assignment ? getOperatorProfile(assignment.displayOwnerId) : null

  return (
    <Html
      position={position}
      // distanceFactor scales the card with camera distance — same value used
      // by the existing PVHotspot label so cards stay visually consistent.
      distanceFactor={9}
      // Don't occlude on the depth buffer; otherwise the card disappears when
      // any geometry sits in front of the anchor (very common).
      occlude={false}
      // Cap drei's z-index range to [0, 30] so DOM HUD elements like the
      // .scene-quickbar dock menu (z-index ~40) can float above pills.
      // Without this, drei defaults to [16777271, 0] and pills always win.
      zIndexRange={[30, 0]}
      // `center` removed — we control vertical placement entirely via CSS
      // transform on .fac-card, which lets us put the hover pill BELOW the
      // 3D dot (translate(-50%, 0%)) while keeping the full panel above
      // (translate(-50%, -100%)). With center on, those CSS transforms
      // would compose with drei's own translate(-50%, -50%) and the
      // arithmetic gets fiddly per pill size.
      // pointer-events: 'auto' only for the full card so the hover pill never
      // intercepts re-hover or click events targeted at adjacent facilities.
      style={{ pointerEvents: mode === 'full' ? 'auto' : 'none' }}
    >
      <div
        className={`fac-card ${mode}`}
        data-card-kind="facility"
        data-status={status}
        data-facility-id={id}
        data-assignment-id={assignment?.assignmentId ?? ''}
        data-response-mode={assignment?.responseMode ?? ''}
        data-demo-state={assignment?.demoState ?? ''}
      >
        <div className="fac-head">
          <span className={`fac-dot ${status}`} />
          <div className="fac-title">{meta.title}</div>
          {mode === 'full' && (
            <button
              type="button"
              className="fac-close"
              aria-label="关闭详情"
              onClick={(e) => {
                e.stopPropagation()
                pauseCruise('facility-click')
                setSelected(null)
              }}
            >
              <X size={12} strokeWidth={2.25} aria-hidden="true" />
            </button>
          )}
        </div>
        {/* subtitle moved to full-mode only. Hover/pinned pill stays a single
            row (status dot + title) so it reads as a clean tag, matching the
            reference image's "SOLAR FIELD 4" / "WIND PARK 1" style. */}
        {mode === 'full' && <div className="fac-sub">{meta.subtitle}</div>}
        {mode === 'full' && (
          <div className="fac-kpis">
            {meta.kpis.map((k) => (
              <div className="fac-kpi" key={k.label}>
                <div className="fac-kpi-lbl">{k.label}</div>
                <div className="fac-kpi-val">
                  {formatCardValue(k.value)}
                  {k.unit && <span className="fac-kpi-unit">{k.unit}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
        {mode === 'full' && assignment && (
          <div className="fac-assignment" data-assignment-source={assignment.primarySourceEventId}>
            <div><span>Owner</span><b>{formatCardValue(assignmentOwner?.title)}</b></div>
            <div><span>Response</span><b>{formatCardValue(assignment.displayStatusLabel)}</b></div>
            <div><span>Mode</span><b>{formatCardValue(assignment.responseMode)}</b></div>
            <div><span>Task</span><b>{formatCardValue(assignment.taskSummary)}</b></div>
          </div>
        )}
      </div>
    </Html>
  )
}
