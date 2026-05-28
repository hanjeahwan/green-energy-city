import * as THREE from 'three'
import { useEffect, useMemo } from 'react'
import { tintedGeometry, flatGradMat, rng } from '../../components/sceneMaterials'
import { InstancedMeshBatch, type InstanceTransform } from '../shared/InstancedMeshBatch'

export function WaterTanks() {
  // Moved to industrial quadrant (+X -Z), away from grid roads at x={-8,0,8}, z={-8,0,8}.
  // water-2 moved north from (4,-11.5) to (4,-9.7) after verifyLayout flagged
  // its 0.55m AABB overlapping the south VAT row at z=-12.
  const items = useMemo(
    () =>
      [
        [5.0, 0, -10.0],
        [3.0, 0, -9.7],
        [6.5, 0, -11.0],
      ].map((position, index) => ({
        position: position as [number, number, number],
        h: 1.3 + rng(index) * 0.4,
      })),
    []
  )
  const assets = useMemo(() => {
    const bodyGeometry = tintedGeometry(new THREE.CylinderGeometry(0.5, 0.55, 1, 18).translate(0, 0.5, 0), '#dde2e9', 0.6)
    const ribGeometry = new THREE.TorusGeometry(0.52, 0.018, 6, 24)
    const capGeometry = new THREE.SphereGeometry(0.5, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2)
    const shadowGeometry = new THREE.CircleGeometry(1, 28)

    const bodyMaterial = flatGradMat({ roughness: 0.75 })
    const ribMaterial = new THREE.MeshStandardMaterial({ color: '#6a7585', roughness: 0.6 })
    const capMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.75 })
    const shadowMaterial = new THREE.MeshBasicMaterial({
      color: '#0a1422',
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    })

    return {
      geometries: { body: bodyGeometry, rib: ribGeometry, cap: capGeometry, shadow: shadowGeometry },
      materials: { body: bodyMaterial, rib: ribMaterial, cap: capMaterial, shadow: shadowMaterial },
    }
  }, [])

  useEffect(() => {
    return () => {
      Object.values(assets.geometries).forEach((geometry) => geometry.dispose())
      Object.values(assets.materials).forEach((material) => material.dispose())
    }
  }, [assets])

  const shadows: InstanceTransform[] = items.map(({ position }) => ({
    position: [position[0], 0.005, position[2]],
    rotation: [-Math.PI / 2, 0, 0],
    scale: [0.7, 0.7, 1],
  }))
  const bodies: InstanceTransform[] = items.map(({ position, h }) => ({
    position,
    scale: [1, h, 1],
  }))
  const ribs: InstanceTransform[] = items.flatMap(({ position }) =>
    [0.35, 0.7, 1.05].map((y) => ({
      position: [position[0], y, position[2]] as [number, number, number],
    }))
  )
  const caps: InstanceTransform[] = items.map(({ position, h }) => ({
    position: [position[0], h, position[2]],
  }))

  return (
    <group>
      <InstancedMeshBatch instances={shadows} geometry={assets.geometries.shadow} material={assets.materials.shadow} renderOrder={1} />
      <InstancedMeshBatch instances={bodies} geometry={assets.geometries.body} material={assets.materials.body} castShadow={false} />
      <InstancedMeshBatch instances={ribs} geometry={assets.geometries.rib} material={assets.materials.rib} />
      <InstancedMeshBatch instances={caps} geometry={assets.geometries.cap} material={assets.materials.cap} castShadow={false} />
    </group>
  )
}
