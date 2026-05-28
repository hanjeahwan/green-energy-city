import * as THREE from 'three'
import { useEffect, useMemo } from 'react'
import { InstancedMeshBatch, composeInstanceTransform } from '../shared/InstancedMeshBatch'

export function BenchPlanters() {
  const items = useMemo(() => {
    const arr: { p: [number, number, number]; rot: number }[] = []
    // 4 benches at the 4 diagonal corners (4.5, 4.5) etc. Kept outside the
    // compact PS-02 BatteryBank service edge so the plaza stays 4-fold
    // symmetric. Each bench rotates to face the center.
    const diagonals: [number, number][] = [[4.5, 4.5], [-4.5, 4.5], [-4.5, -4.5], [4.5, -4.5]]
    for (const [x, z] of diagonals) {
      arr.push({ p: [x, 0, z], rot: Math.atan2(-x, -z) })
    }
    return arr
  }, [])
  const assets = useMemo(() => {
    const benchSeatGeometry = new THREE.BoxGeometry(0.42, 0.05, 0.16)
    const benchLegGeometry = new THREE.BoxGeometry(0.04, 0.12, 0.16)
    const planterGeometry = new THREE.BoxGeometry(0.3, 0.18, 0.3)
    const treeGeometry = new THREE.ConeGeometry(0.14, 0.3, 8)

    const benchSeatMaterial = new THREE.MeshStandardMaterial({ color: '#3a4a5e', roughness: 0.7 })
    const benchLegMaterial = new THREE.MeshStandardMaterial({ color: '#3a4654' })
    const planterMaterial = new THREE.MeshStandardMaterial({ color: '#9aa5b2', roughness: 0.9 })
    const treeMaterial = new THREE.MeshStandardMaterial({ color: '#3a8a52', roughness: 0.85 })

    return {
      geometries: { benchSeat: benchSeatGeometry, benchLeg: benchLegGeometry, planter: planterGeometry, tree: treeGeometry },
      materials: { benchSeat: benchSeatMaterial, benchLeg: benchLegMaterial, planter: planterMaterial, tree: treeMaterial },
    }
  }, [])

  useEffect(() => {
    return () => {
      Object.values(assets.geometries).forEach((geometry) => geometry.dispose())
      Object.values(assets.materials).forEach((material) => material.dispose())
    }
  }, [assets])

  const parentFor = (item: { p: [number, number, number]; rot: number }) => ({
    position: item.p,
    rotation: [0, item.rot, 0] as const,
  })
  const benchSeats = items.map((item) =>
    composeInstanceTransform(parentFor(item), { position: [-0.25, 0.12, 0] })
  )
  const benchLegs = items.flatMap((item) => [
    composeInstanceTransform(parentFor(item), { position: [-0.36, 0.06, 0] }),
    composeInstanceTransform(parentFor(item), { position: [-0.14, 0.06, 0] }),
  ])
  const planters = items.map((item) =>
    composeInstanceTransform(parentFor(item), { position: [0.25, 0.1, 0] })
  )
  const trees = items.map((item) =>
    composeInstanceTransform(parentFor(item), { position: [0.25, 0.32, 0] })
  )

  return (
    <group>
      <InstancedMeshBatch instances={benchSeats} geometry={assets.geometries.benchSeat} material={assets.materials.benchSeat} castShadow={false} />
      <InstancedMeshBatch instances={benchLegs} geometry={assets.geometries.benchLeg} material={assets.materials.benchLeg} />
      <InstancedMeshBatch instances={planters} geometry={assets.geometries.planter} material={assets.materials.planter} />
      <InstancedMeshBatch instances={trees} geometry={assets.geometries.tree} material={assets.materials.tree} castShadow={false} />
    </group>
  )
}
