import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { InteractiveOperatorAnchor, type OperatorRuntimeAnchor } from '../InteractiveOperatorAnchor'
import { hasOperatorProfile } from '../../scene/operatorMetadata'
import { useOperatorAnchorStore } from '../../scene/operatorAnchorStore'
import { OPERATOR_PLACEMENTS, operatorPlacementExtras, operatorRoleCounts } from '../../scene/operatorPlacements'
import { Person } from './Person'

function OperatorAnchorPublisher() {
  const { camera, gl } = useThree()
  const lastPublishRef = useRef(0)
  const centerRef = useRef(new Vector3())
  const publishOperatorAnchors = useOperatorAnchorStore((state) => state.publishOperatorAnchors)
  const clearOperatorAnchors = useOperatorAnchorStore((state) => state.clearOperatorAnchors)

  useEffect(() => () => {
    clearOperatorAnchors()
  }, [clearOperatorAnchors])

  useFrame(() => {
    const now = performance.now()
    if (now - lastPublishRef.current < 250) return
    lastPublishRef.current = now

    const rect = gl.domElement.getBoundingClientRect()
    const size = 54
    const anchors: Record<string, OperatorRuntimeAnchor> = {}
    for (const placement of OPERATOR_PLACEMENTS) {
      const center = centerRef.current.set(
        placement.position[0],
        placement.position[1] + 0.72,
        placement.position[2]
      )
      center.project(camera)
      const x = rect.left + (center.x * 0.5 + 0.5) * rect.width
      const y = rect.top + (-center.y * 0.5 + 0.5) * rect.height
      anchors[placement.id] = {
        id: placement.id,
        role: placement.role,
        worldPosition: placement.position,
        rotationY: placement.rot,
        bound: { w: 0.84, h: 1.25, d: 0.84 },
        cardOffset: [0, 1.08, 0],
        screenCenter: { x, y },
        screenBox: {
          left: x - size / 2,
          top: y - size / 2,
          right: x + size / 2,
          bottom: y + size / 2,
          width: size,
          height: size
        },
        visible: center.z > -1 && center.z < 1 && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom,
        occludedBy: null,
        profilePresent: hasOperatorProfile(placement.id),
        updatedAt: now
      }
    }

    const debugWindow = window as Window & {
      __operatorAnchors?: Record<string, OperatorRuntimeAnchor>
    }
    debugWindow.__operatorAnchors = anchors
    publishOperatorAnchors(anchors)
    document.documentElement.dataset.operatorAnchors = String(Object.keys(anchors).length)
    document.documentElement.dataset.operatorAnchorStatus = 'pass'
  })

  return null
}

export function People() {
  const positions = useMemo(() => {
    const placements = OPERATOR_PLACEMENTS
    if (typeof window !== 'undefined') {
      const extras = operatorPlacementExtras()
      const counts = operatorRoleCounts()
      const debugWindow = window as Window & {
        __placementExtras?: ReturnType<typeof operatorPlacementExtras>
        __operatorPlacements?: typeof OPERATOR_PLACEMENTS
        __operatorRoleCounts?: ReturnType<typeof operatorRoleCounts>
      }
      debugWindow.__placementExtras = extras
      debugWindow.__operatorPlacements = placements
      debugWindow.__operatorRoleCounts = counts
      document.documentElement.dataset.operatorPlacements = String(placements.length)
      document.documentElement.dataset.operatorRoleCounts = JSON.stringify(counts)
      document.documentElement.dataset.operatorRoleStatus = 'published'
    }
    return placements
  }, [])
  return (
    <group>
      <OperatorAnchorPublisher />
      {positions.map((person, i) => (
        <InteractiveOperatorAnchor key={person.id} placement={person}>
          <Person position={[0, 0, 0]} rot={0} variant={person.variant} accentSeed={i * 7 + 13} />
        </InteractiveOperatorAnchor>
      ))}
    </group>
  )
}
