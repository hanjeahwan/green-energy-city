import * as THREE from 'three'
import { useMemo } from 'react'
import type { BuildingDef } from '../types'
import { InstancedMeshBatch, type InstanceTransform } from '../shared/InstancedMeshBatch'

const OUTLINE_PAD = 0.09
const OUTLINE_HEIGHT = 0.04
const OUTLINE_Y = 0.012

export function InstancedBuildingOutlines({ buildings }: { buildings: readonly BuildingDef[] }) {
  const instances = useMemo<InstanceTransform[]>(() => {
    return buildings.map((b) => {
      const t = new THREE.Matrix4().makeTranslation(b.pos[0], OUTLINE_Y, b.pos[1])
      const r = new THREE.Matrix4().makeRotationY(b.rot)
      const s = new THREE.Matrix4().makeScale(b.w + OUTLINE_PAD, OUTLINE_HEIGHT, b.d + OUTLINE_PAD)
      const m = new THREE.Matrix4().multiplyMatrices(t, r).multiply(s)
      return { matrix: m }
    })
  }, [buildings])

  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#1a2230',
        transparent: true,
        opacity: 0.52,
      }),
    []
  )

  if (instances.length === 0) return null
  return <InstancedMeshBatch instances={instances} geometry={geometry} material={material} frustumCulled={false} />
}
