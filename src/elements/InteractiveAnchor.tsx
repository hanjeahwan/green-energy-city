// =============================================================================
// InteractiveAnchor — pointer/select wrapper for any facility group.
//
// Pre-this-file the scene had zero pointer handlers. This primitive is the
// single place where pointer events on facilities are interpreted, so all the
// behaviours (cursor, outline, hover/full card) are co-located and consistent.
//
// Usage (at the consumer site in CityScene.tsx):
//   <InteractiveAnchor
//     id="PS-02"
//     position={[5, 0, 0]}
//     bound={{ w: 3, h: 2.5, d: 3 }}
//   >
//     <SolarFarm rows={3}/>
//     <BatteryBank/>
//   </InteractiveAnchor>
//
// The anchor IS the positioned group — its children inherit the transform.
// Hover halo + card render as siblings to the children.
// =============================================================================

import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, DoubleSide, Shape, type BufferGeometry, type Mesh, type MeshBasicMaterial } from 'three'
import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useSelectionStore } from '../scene/selection'
import { useCameraMode } from '../scene/cameraMode'
import { nextSelectionForTargetClick } from '../scene/selectionTransitions'
import { FacilityCard } from '../components/FacilityCard'
import type { ShowroomRuntimeAnchor } from '../scene/showroomContract'
// import { getMeta } from '../scene/facilityMetadata'  // dot disabled, see below
// import { deriveStatus } from '../scene/status'
// import { STATUS } from '../scene/palette'

const FACILITY_HOVER_HALO = '#9beeff'

export interface InteractiveBound {
  /** Bounding box width  (along local X). */
  w: number
  /** Bounding box height (along local Y). Origin = bottom; centre = h/2. */
  h: number
  /** Bounding box depth  (along local Z). */
  d: number
  /** Vertical centre of the outline box. Defaults to h/2 (assumes the
   *  facility sits with its base at y=0). Override when the facility's
   *  geometric centre is elsewhere (e.g. a flying drone group). */
  cy?: number
}

interface InteractiveAnchorProps {
  id: string
  /** World/local position passed straight through to the group. */
  position?: [number, number, number]
  /** Y rotation passed straight through to the group. */
  rotationY?: number
  /** Bounding box for the outline + card vertical placement. */
  bound: InteractiveBound
  /** Extra offset added to the card position above the bound top. */
  cardOffset?: [number, number, number]
  /** When true, render the FacilityCard pill ALWAYS (not just on hover/select).
   *  Used by the 5 PV station anchors to replace the legacy "PS-XX · XX kW"
   *  hud-label with a richer always-on pill that doubles as the hover state.
   *  Default false → other 21 facilities still gate on hover. */
  showLabel?: boolean
  children: ReactNode
}

type HaloMesh = Mesh<BufferGeometry, MeshBasicMaterial>

function roundedFootprintShape(width: number, depth: number, radius: number) {
  const shape = new Shape()
  const left = -width / 2
  const right = width / 2
  const bottom = -depth / 2
  const top = depth / 2
  const r = Math.min(radius, width / 2, depth / 2)

  shape.moveTo(left + r, bottom)
  shape.lineTo(right - r, bottom)
  shape.quadraticCurveTo(right, bottom, right, bottom + r)
  shape.lineTo(right, top - r)
  shape.quadraticCurveTo(right, top, right - r, top)
  shape.lineTo(left + r, top)
  shape.quadraticCurveTo(left, top, left, top - r)
  shape.lineTo(left, bottom + r)
  shape.quadraticCurveTo(left, bottom, left + r, bottom)

  return shape
}

function HoverFacilityHalo({ bound }: { bound: InteractiveBound }) {
  const fillRef = useRef<HaloMesh>(null)
  const outlineRef = useRef<HaloMesh>(null)
  const footprintW = Math.max(bound.w * 0.96, 0.84)
  const footprintD = Math.max(bound.d * 0.96, 0.84)
  const cornerRadius = Math.min(footprintW, footprintD) * 0.12
  const footprintShape = useMemo(
    () => roundedFootprintShape(footprintW, footprintD, cornerRadius),
    [footprintW, footprintD, cornerRadius]
  )
  const boundBottomY = (bound.cy ?? bound.h / 2) - bound.h / 2
  const baseY = Math.max(boundBottomY, 0) + 0.045
  const lastUpdateRef = useRef(0)

  // Decorative pulse throttled to 30Hz — only mounts while hovered, but with
  // 22 facility anchors the chance of a hover-locked frame is non-trivial.
  useFrame(({ clock }) => {
    const now = clock.elapsedTime
    if (now - lastUpdateRef.current < 1 / 30) return
    lastUpdateRef.current = now
    const pulse = (Math.sin(now * 4.2) + 1) / 2
    if (fillRef.current) {
      const scale = 1 + pulse * 0.014
      fillRef.current.scale.set(scale, scale, 1)
      fillRef.current.material.opacity = 0.04 + pulse * 0.02
    }
    if (outlineRef.current) {
      const scale = 1.035 + pulse * 0.035
      outlineRef.current.scale.set(scale, scale, 1)
      outlineRef.current.material.opacity = 0.24 + pulse * 0.08
    }
  })

  return (
    <group position={[0, baseY, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
      <mesh ref={outlineRef} position={[0, 0, 0.004]} raycast={() => null}>
        <shapeGeometry args={[footprintShape]} />
        <meshBasicMaterial
          color={FACILITY_HOVER_HALO}
          transparent
          opacity={0.28}
          depthWrite={false}
          side={DoubleSide}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={fillRef} position={[0, 0, 0.008]} raycast={() => null}>
        <shapeGeometry args={[footprintShape]} />
        <meshBasicMaterial
          color={FACILITY_HOVER_HALO}
          transparent
          opacity={0.05}
          depthWrite={false}
          side={DoubleSide}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

export function InteractiveAnchor({
  id,
  position = [0, 0, 0],
  rotationY = 0,
  bound,
  cardOffset = [0, 0.3, 0],
  showLabel = false,
  children,
}: InteractiveAnchorProps) {
  const isHovered = useSelectionStore(useCallback(
    (state) => state.hoveredTarget?.kind === 'facility' && state.hoveredTarget.id === id,
    [id]
  ))
  const isSelected = useSelectionStore(useCallback(
    (state) => state.selectedTarget?.kind === 'facility' && state.selectedTarget.id === id,
    [id]
  ))
  const setHovered = useSelectionStore((state) => state.setHovered)
  const setSelected = useSelectionStore((state) => state.setSelected)
  const { pauseCruise } = useCameraMode()
  const showHoverHalo = isHovered && !isSelected

  const cardY = bound.h + cardOffset[1]
  const visibleCardY = isSelected && id === 'command-tower'
    ? Math.min(cardY, bound.h * 0.48)
    : cardY

  useEffect(() => {
    if (typeof window === 'undefined') return
    const debugWindow = window as Window & {
      __showroomAnchors?: Record<string, ShowroomRuntimeAnchor>
    }
    const anchors = debugWindow.__showroomAnchors ?? {}
    anchors[id] = {
      id,
      position,
      rotationY,
      bound: { ...bound },
      cardOffset,
      showLabel,
      updatedAt: performance.now()
    }
    debugWindow.__showroomAnchors = anchors
    document.documentElement.dataset.showroomAnchors = String(Object.keys(anchors).length)

    return () => {
      const current = debugWindow.__showroomAnchors
      if (!current) return
      delete current[id]
      document.documentElement.dataset.showroomAnchors = String(Object.keys(current).length)
    }
  }, [
    id,
    position,
    rotationY,
    bound,
    cardOffset,
    showLabel
  ])

  // Drag-vs-click detection. R3F's onClick fires whenever pointerdown and
  // pointerup hit the same mesh, REGARDLESS of how far the pointer travelled
  // in between — so an OrbitControls drag that started/ended over a facility
  // would trigger setSelected. We record the pointerdown screen position +
  // timestamp here and only call setSelected on pointerup if the pointer
  // moved less than DRAG_PX and the gesture took less than CLICK_MS.
  const downRef = useRef<{ x: number; y: number; t: number } | null>(null)
  const DRAG_PX = 6
  const CLICK_MS = 400

  // Dot infrastructure kept for potential re-enable (commented-out block
  // below). Computed here so re-adding the mesh requires no other edits.
  // const meta = getMeta(id)
  // const dotStatus = meta.status ?? deriveStatus(id)
  // const dotColor = STATUS[dotStatus]

  return (
    <group
      position={position}
      rotation={[0, rotationY, 0]}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(id, 'facility')
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={(e) => {
        e.stopPropagation()
        // Only clear if WE are still the hovered id — protects against
        // sibling-overlap races where a child fires Out after a sibling Over.
        const hoveredTarget = useSelectionStore.getState().hoveredTarget
        if (hoveredTarget?.kind === 'facility' && hoveredTarget.id === id) setHovered(null)
        document.body.style.cursor = ''
      }}
      onPointerDown={(e) => {
        // Don't stopPropagation — OrbitControls needs the down event to
        // start its drag. We just record where the gesture started so
        // onClick (below) can tell drag from click.
        downRef.current = {
          x: e.clientX,
          y: e.clientY,
          t: performance.now(),
        }
      }}
      onClick={(e) => {
        // Drag-vs-click check (unchanged)
        const d = downRef.current
        if (d) {
          const dist = Math.hypot(e.clientX - d.x, e.clientY - d.y)
          const dt = performance.now() - d.t
          if (dist > DRAG_PX || dt > CLICK_MS) return
        }
        e.stopPropagation()
        pauseCruise('facility-click')
        // Same target toggles closed; a different facility/operator switches
        // directly. The invisible click shield still owns the hit test for
        // this anchor, so a deliberate click on another target should not
        // spend an extra click just to dismiss the current card.
        const selectedTarget = useSelectionStore.getState().selectedTarget
        const nextSelection = nextSelectionForTargetClick(selectedTarget, { id, kind: 'facility' })
        setSelected(nextSelection?.id ?? null, nextSelection?.kind)
      }}
    >
      {/* CLICK SHIELD — invisible box sized to `bound`. Covers the asset's
          full footprint so clicks anywhere in the bounding volume (including
          the GAPS between sub-meshes — e.g. between WindFarmHill turbines,
          or above an EVChargingStation parking stall) hit THIS anchor's
          onClick instead of passing through to whatever's behind (most
          commonly: the central CommandTower).
          Symptom this fixed: "点击设施 A → zoom in → 再点击 A 跳去中心 tower".
          When the camera is zoomed in on A, the screen frustum often
          intersects CommandTower at origin. A click in a gap of A's
          geometry would raycast past A and hit CommandTower's mesh,
          selecting it instead of toggling A off.
          opacity=0 keeps it invisible; depthWrite=false avoids polluting
          the depth buffer; renderOrder=-1 puts it BEHIND visible meshes
          in alpha sort. */}
      <mesh position={[0, bound.cy ?? bound.h / 2, 0]} renderOrder={-1}>
        <boxGeometry args={[bound.w, bound.h, bound.d]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {children}

      {showHoverHalo && <HoverFacilityHalo bound={bound} />}

      {/* 3D status dot was used as a visual reference to calibrate where the
          pill should anchor — it's now hidden because the pill alone reads
          cleanly at this position. The dot infrastructure (status, colour,
          STATUS triad) stays in place because it's near-zero cost and we
          may bring the dot back as a hover/select indicator. To re-enable
          for debugging: uncomment the mesh below.

          {showLabel && (
            <mesh position={[cardOffset[0], cardY, cardOffset[2]]} raycast={() => null}>
              <sphereGeometry args={[0.08, 14, 14]} />
              <meshBasicMaterial color={dotColor} toneMapped={false} />
            </mesh>
          )} */}

      {/* Floating card. Three render gates:
          - selectedId === id → 'full' mode (detail panel + KPIs + close)
          - hoveredId === id   → 'hover' mode (compact pill)
          - showLabel=true     → 'hover' mode always-on (no hover required)
          The card's 3D anchor sits at the SAME point as the dot. CSS
          translate(-50%, 0%) on .fac-card.hover hangs the pill DOWN from
          this anchor on screen, so on render: dot above + pill directly
          below, both X-centred. */}
      {(showLabel || isHovered || isSelected) && (
        <FacilityCard
          id={id}
          position={[cardOffset[0], visibleCardY, cardOffset[2]]}
          mode={isSelected ? 'full' : 'hover'}
        />
      )}
    </group>
  )
}
