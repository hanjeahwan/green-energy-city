import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, DoubleSide, type BufferGeometry, type Mesh, type MeshBasicMaterial } from 'three'
import { useCallback, useRef, type ReactNode } from 'react'
import { OperatorCard } from '../components/OperatorCard'
import { useCameraMode } from '../scene/cameraMode'
import { getOperatorProfile } from '../scene/operatorMetadata'
import type { OperatorPlacement } from '../scene/operatorPlacements'
import { useSelectionStore } from '../scene/selection'
import { nextSelectionForTargetClick } from '../scene/selectionTransitions'
import { ENERGY_CYAN } from '../scene/palette'

export interface OperatorRuntimeAnchor {
  id: string
  role: string
  worldPosition: [number, number, number]
  rotationY: number
  bound: { w: number; h: number; d: number }
  cardOffset: [number, number, number]
  screenCenter: { x: number; y: number }
  screenBox: { left: number; top: number; right: number; bottom: number; width: number; height: number }
  visible: boolean
  occludedBy: string | null
  profilePresent: boolean
  updatedAt: number
}

interface InteractiveOperatorAnchorProps {
  placement: OperatorPlacement
  children: ReactNode
}

type HaloMesh = Mesh<BufferGeometry, MeshBasicMaterial>

function OperatorHalo() {
  const ref = useRef<HaloMesh>(null)
  const lastUpdateRef = useRef(0)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const now = clock.elapsedTime
    if (now - lastUpdateRef.current < 1 / 30) return
    lastUpdateRef.current = now
    const pulse = (Math.sin(now * 4.8) + 1) / 2
    ref.current.scale.setScalar(1 + pulse * 0.08)
    ref.current.material.opacity = 0.08 + pulse * 0.05
  })
  return (
    <mesh ref={ref} position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <circleGeometry args={[0.34, 32]} />
      <meshBasicMaterial
        color={ENERGY_CYAN}
        transparent
        opacity={0.1}
        depthWrite={false}
        side={DoubleSide}
        blending={AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  )
}

export function InteractiveOperatorAnchor({ placement, children }: InteractiveOperatorAnchorProps) {
  const isHovered = useSelectionStore(useCallback(
    (state) => state.hoveredTarget?.kind === 'operator' && state.hoveredTarget.id === placement.id,
    [placement.id]
  ))
  const isSelected = useSelectionStore(useCallback(
    (state) => state.selectedTarget?.kind === 'operator' && state.selectedTarget.id === placement.id,
    [placement.id]
  ))
  const showHoverHalo = useSelectionStore(useCallback(
    (state) =>
      state.hoveredTarget?.kind === 'operator' &&
      state.hoveredTarget.id === placement.id &&
      state.selectedTarget === null,
    [placement.id]
  ))
  const setHovered = useSelectionStore((state) => state.setHovered)
  const setSelected = useSelectionStore((state) => state.setSelected)
  const { pauseCruise } = useCameraMode()
  const downRef = useRef<{ x: number; y: number; t: number } | null>(null)
  const profile = getOperatorProfile(placement.id)
  const cardOffset: [number, number, number] = [0, isSelected ? 1.32 : 1.08, 0]

  return (
    <group
      position={placement.position}
      rotation={[0, placement.rot, 0]}
      onPointerOver={(event) => {
        event.stopPropagation()
        setHovered(placement.id, 'operator')
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={(event) => {
        event.stopPropagation()
        const hoveredTarget = useSelectionStore.getState().hoveredTarget
        if (hoveredTarget?.kind === 'operator' && hoveredTarget.id === placement.id) setHovered(null)
        document.body.style.cursor = ''
      }}
      onPointerDown={(event) => {
        downRef.current = { x: event.clientX, y: event.clientY, t: performance.now() }
      }}
      onClick={(event) => {
        const down = downRef.current
        if (down) {
          const dist = Math.hypot(event.clientX - down.x, event.clientY - down.y)
          const dt = performance.now() - down.t
          if (dist > 6 || dt > 400) return
        }
        event.stopPropagation()
        pauseCruise('operator-click')
        const selectedTarget = useSelectionStore.getState().selectedTarget
        const nextSelection = nextSelectionForTargetClick(selectedTarget, { id: placement.id, kind: 'operator' })
        setSelected(nextSelection?.id ?? null, nextSelection?.kind)
      }}
    >
      <mesh position={[0, 0.62, 0]} renderOrder={-1}>
        <boxGeometry args={[0.84, 1.24, 0.84]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {children}
      {(showHoverHalo || isSelected) && <OperatorHalo />}
      {(isHovered || isSelected) && (
        <OperatorCard
          profile={profile}
          position={cardOffset}
          mode={isSelected ? 'full' : 'hover'}
        />
      )}
    </group>
  )
}
