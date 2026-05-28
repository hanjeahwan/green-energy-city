import * as THREE from 'three'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { computeLampPlacements, type LampPlacement } from '../../scene/lampLayout'
import { getPVPanelTexture, PV_BASE_COLOR } from '../shared/pvAsset'

// Lamp placement is intersection-aware: 4 corner lamps per crossing + mid-block
// runs with skip-zones around the crossings. See src/scene/lampLayout.ts for the
// algorithm. This component is now purely the visual layer. The parts are
// instanced by geometry/material, preserving the original shapes, colors,
// positions, and pole-only shadow behavior while removing per-lamp draw calls.

type Vec3 = readonly [number, number, number]

const ZERO_ROTATION: Vec3 = [0, 0, 0]
const POLE_POSITION: Vec3 = [0, 0.6, 0]
const ARM_POSITION: Vec3 = [0.06, 1.18, 0]
const ARM_ROTATION: Vec3 = [Math.PI / 2, 0, 0]
const PANEL_POSITION: Vec3 = [0, 1.32, 0]
const PANEL_ROTATION: Vec3 = [-Math.PI / 2 + 0.15, 0, 0]
const HEAD_POSITION: Vec3 = [0.18, 1.22, 0]

function disposeResources(resources: Record<string, THREE.BufferGeometry | THREE.Material>) {
  Object.values(resources).forEach((resource) => resource.dispose())
}

function InstancedLampPart({
  placements,
  geometry,
  material,
  localPosition,
  localRotation = ZERO_ROTATION,
  castShadow = false,
}: {
  placements: LampPlacement[]
  geometry: THREE.BufferGeometry
  material: THREE.Material
  localPosition: Vec3
  localRotation?: Vec3
  castShadow?: boolean
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return

    const parent = new THREE.Object3D()
    const local = new THREE.Object3D()
    const matrix = new THREE.Matrix4()

    local.position.set(localPosition[0], localPosition[1], localPosition[2])
    local.rotation.set(localRotation[0], localRotation[1], localRotation[2])
    local.updateMatrix()

    placements.forEach((placement, index) => {
      parent.position.set(placement.x, 0, placement.z)
      parent.rotation.set(0, placement.rot, 0)
      parent.updateMatrix()
      matrix.multiplyMatrices(parent.matrix, local.matrix)
      mesh.setMatrixAt(index, matrix)
    })

    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [placements, localPosition, localRotation])

  if (placements.length === 0) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, placements.length]}
      castShadow={castShadow}
      receiveShadow={false}
      frustumCulled={false}
    />
  )
}

export function LampPosts() {
  const placements = useMemo(() => computeLampPlacements(), [])
  const assets = useMemo(() => {
    const poleGeometry = new THREE.CylinderGeometry(0.025, 0.025, 1.2, 6)
    const armGeometry = new THREE.TorusGeometry(0.12, 0.018, 6, 8, Math.PI / 2)
    const panelGeometry = new THREE.BoxGeometry(0.16, 0.1, 0.02)
    const headGeometry = new THREE.BoxGeometry(0.1, 0.02, 0.05)

    const metalMaterial = new THREE.MeshStandardMaterial({ color: '#c8d0db' })
    const panelMaterial = new THREE.MeshStandardMaterial({
      color: PV_BASE_COLOR,
      map: getPVPanelTexture(),
      roughness: 0.32,
      metalness: 0.5,
    })
    const headMaterial = new THREE.MeshStandardMaterial({
      color: '#000',
      emissive: '#5dd4e8',
      emissiveIntensity: 1.6,
    })

    return {
      geometries: {
        pole: poleGeometry,
        arm: armGeometry,
        panel: panelGeometry,
        head: headGeometry,
      },
      materials: {
        metal: metalMaterial,
        panel: panelMaterial,
        head: headMaterial,
      },
    }
  }, [])

  useEffect(() => {
    return () => {
      disposeResources(assets.geometries)
      disposeResources(assets.materials)
    }
  }, [assets])

  return (
    <group>
      <InstancedLampPart
        placements={placements}
        geometry={assets.geometries.pole}
        material={assets.materials.metal}
        localPosition={POLE_POSITION}
        castShadow={false}
      />
      <InstancedLampPart
        placements={placements}
        geometry={assets.geometries.arm}
        material={assets.materials.metal}
        localPosition={ARM_POSITION}
        localRotation={ARM_ROTATION}
      />
      <InstancedLampPart
        placements={placements}
        geometry={assets.geometries.panel}
        material={assets.materials.panel}
        localPosition={PANEL_POSITION}
        localRotation={PANEL_ROTATION}
      />
      <InstancedLampPart
        placements={placements}
        geometry={assets.geometries.head}
        material={assets.materials.head}
        localPosition={HEAD_POSITION}
      />
    </group>
  )
}
