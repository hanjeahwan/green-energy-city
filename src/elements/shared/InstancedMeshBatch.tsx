import * as THREE from 'three'
import { useLayoutEffect, useRef } from 'react'

export interface InstanceTransform {
  position?: readonly [number, number, number]
  rotation?: readonly [number, number, number]
  scale?: readonly [number, number, number]
  matrix?: THREE.Matrix4
  color?: string
}

export function transformMatrix({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
}: Omit<InstanceTransform, 'matrix' | 'color'>) {
  const obj = new THREE.Object3D()
  obj.position.set(position[0], position[1], position[2])
  obj.rotation.set(rotation[0], rotation[1], rotation[2])
  obj.scale.set(scale[0], scale[1], scale[2])
  obj.updateMatrix()
  return obj.matrix.clone()
}

export function composeInstanceTransform(
  parent: Omit<InstanceTransform, 'matrix' | 'color'>,
  child: Omit<InstanceTransform, 'matrix' | 'color'>,
): InstanceTransform {
  return {
    matrix: transformMatrix(parent).multiply(transformMatrix(child)),
  }
}

export function InstancedMeshBatch({
  instances,
  geometry,
  material,
  castShadow = false,
  receiveShadow = false,
  // Default to TRUE — computeBoundingSphere() runs after every instance write
  // below, so per-batch boundingSphere is accurate and off-screen batches can
  // be skipped. Global batches that cover the whole city (outlines, road
  // lamps, facility-wide PV) explicitly pass `false` since their sphere
  // always intersects the frustum and the culling check is pure overhead.
  frustumCulled = true,
  renderOrder,
}: {
  instances: readonly InstanceTransform[]
  geometry: THREE.BufferGeometry
  material: THREE.Material
  castShadow?: boolean
  receiveShadow?: boolean
  frustumCulled?: boolean
  renderOrder?: number
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return

    const obj = new THREE.Object3D()
    const color = new THREE.Color()

    instances.forEach((instance, index) => {
      if (instance.matrix) {
        mesh.setMatrixAt(index, instance.matrix)
      } else {
        const position = instance.position ?? [0, 0, 0]
        const rotation = instance.rotation ?? [0, 0, 0]
        const scale = instance.scale ?? [1, 1, 1]
        obj.position.set(position[0], position[1], position[2])
        obj.rotation.set(rotation[0], rotation[1], rotation[2])
        obj.scale.set(scale[0], scale[1], scale[2])
        obj.updateMatrix()
        mesh.setMatrixAt(index, obj.matrix)
      }

      if (instance.color) mesh.setColorAt(index, color.set(instance.color))
    })

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [instances])

  if (instances.length === 0) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, instances.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      frustumCulled={frustumCulled}
      renderOrder={renderOrder}
    />
  )
}
