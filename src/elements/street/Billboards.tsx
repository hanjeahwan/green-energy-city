import * as THREE from 'three'
import { useEffect, useMemo } from 'react'
import { PLACEMENTS } from '../../scene/layout'
import { InstancedMeshBatch, composeInstanceTransform, type InstanceTransform } from '../shared/InstancedMeshBatch'

export type BillboardVariant = 'classic' | 'single-pole' | 'led-megascreen' | 'poster-stand'

interface BillboardData {
  id: string
  variant: BillboardVariant
  position: [number, number, number]
  rot: number
  label: string
  color: string
}

// Per-id label + color (variant only controls geometry). Keeps the 3 original
// alert-tagged billboards looking the same, and assigns themed copy to the
// 5 new ones so each placement reads as a distinct city-life beat.
const BILLBOARD_META: Record<string, { label: string; color: string }> = {
  'billboard-1': { label: 'ENERGY DISPATCH', color: '#2bbd84' },
  'billboard-2': { label: 'PS-02 ALERT ZONE', color: '#e8504a' },
  'billboard-3': { label: 'WIND OPS', color: '#5aa0d0' },
  'billboard-4': { label: 'GRID 24/7', color: '#ffd166' },
  'billboard-5': { label: 'DRONE LANE', color: '#3a8fff' },
  'billboard-6': { label: 'EV ZONE', color: '#2bbd84' },
  'billboard-7': { label: 'SOUTH GATE', color: '#e8504a' },
  'billboard-8': { label: 'WEST CORRIDOR', color: '#5aa0d0' },
}

function parentFor(item: BillboardData) {
  return {
    position: item.position,
    rotation: [0, item.rot, 0] as const,
  }
}

function partInstances(items: readonly BillboardData[], local: Omit<InstanceTransform, 'matrix' | 'color'>) {
  return items.map((item) => composeInstanceTransform(parentFor(item), local))
}

function pairedPartInstances(items: readonly BillboardData[], locals: readonly Omit<InstanceTransform, 'matrix' | 'color'>[]) {
  return items.flatMap((item) =>
    locals.map((local) => composeInstanceTransform(parentFor(item), local))
  )
}

function colorGroups(items: readonly BillboardData[], local: Omit<InstanceTransform, 'matrix' | 'color'>) {
  const groups = new Map<string, InstanceTransform[]>()
  for (const item of items) {
    const current = groups.get(item.color) ?? []
    current.push(composeInstanceTransform(parentFor(item), local))
    groups.set(item.color, current)
  }
  return [...groups.entries()]
}

function ColorPanelBatch({
  instances,
  geometry,
  color,
  intensity,
}: {
  instances: readonly InstanceTransform[]
  geometry: THREE.BufferGeometry
  color: string
  intensity: number
}) {
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity }),
    [color, intensity]
  )

  useEffect(() => () => material.dispose(), [material])

  return <InstancedMeshBatch instances={instances} geometry={geometry} material={material} />
}

export function Billboards() {
  const items: BillboardData[] = useMemo(
    () =>
      PLACEMENTS
        .filter((p) => p.kind === 'Billboard')
        .map((p) => {
          const meta = BILLBOARD_META[p.id] ?? { label: 'CITY', color: '#5aa0d0' }
          return {
            id: p.id,
            variant: (p.variant ?? 'classic') as BillboardVariant,
            position: [p.x, 0, p.z],
            rot: p.rot ?? 0,
            label: meta.label,
            color: meta.color,
          }
        }),
    []
  )
  const grouped = useMemo(
    () => ({
      classic: items.filter((item) => item.variant === 'classic'),
      singlePole: items.filter((item) => item.variant === 'single-pole'),
      mega: items.filter((item) => item.variant === 'led-megascreen'),
      poster: items.filter((item) => item.variant === 'poster-stand'),
    }),
    [items]
  )
  const assets = useMemo(() => {
    const classicPoleGeometry = new THREE.CylinderGeometry(0.04, 0.04, 1.0, 6)
    const classicBoxGeometry = new THREE.BoxGeometry(1.1, 0.4, 0.05)
    const classicFaceGeometry = new THREE.PlaneGeometry(1.0, 0.32)
    const singlePoleGeometry = new THREE.CylinderGeometry(0.06, 0.06, 1.1, 8)
    const singleBoxGeometry = new THREE.BoxGeometry(0.7, 0.35, 0.08)
    const singleFaceGeometry = new THREE.PlaneGeometry(0.62, 0.28)
    const megaPoleGeometry = new THREE.CylinderGeometry(0.055, 0.055, 1.6, 8)
    const megaBoxGeometry = new THREE.BoxGeometry(1.8, 0.7, 0.07)
    const megaFaceGeometry = new THREE.PlaneGeometry(1.7, 0.62)
    const megaTopBarGeometry = new THREE.BoxGeometry(1.5, 0.04, 0.06)
    const posterPoleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.9, 8)
    const posterBoxGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.04)
    const posterFaceGeometry = new THREE.PlaneGeometry(0.52, 0.72)

    const classicPoleMaterial = new THREE.MeshStandardMaterial({ color: '#3a4654' })
    const singlePoleMaterial = new THREE.MeshStandardMaterial({ color: '#2e3845' })
    const classicBoxMaterial = new THREE.MeshStandardMaterial({ color: '#0e1a2a', roughness: 0.6 })
    const megaBoxMaterial = new THREE.MeshStandardMaterial({ color: '#0a0d12', roughness: 0.5 })
    const megaTopBarMaterial = new THREE.MeshStandardMaterial({ color: '#1a1a1f' })
    const posterBoxMaterial = new THREE.MeshStandardMaterial({ color: '#0e1a2a', roughness: 0.7 })

    return {
      geometries: {
        classicPole: classicPoleGeometry,
        classicBox: classicBoxGeometry,
        classicFace: classicFaceGeometry,
        singlePole: singlePoleGeometry,
        singleBox: singleBoxGeometry,
        singleFace: singleFaceGeometry,
        megaPole: megaPoleGeometry,
        megaBox: megaBoxGeometry,
        megaFace: megaFaceGeometry,
        megaTopBar: megaTopBarGeometry,
        posterPole: posterPoleGeometry,
        posterBox: posterBoxGeometry,
        posterFace: posterFaceGeometry,
      },
      materials: {
        classicPole: classicPoleMaterial,
        singlePole: singlePoleMaterial,
        classicBox: classicBoxMaterial,
        megaBox: megaBoxMaterial,
        megaTopBar: megaTopBarMaterial,
        posterBox: posterBoxMaterial,
      },
    }
  }, [])

  useEffect(() => {
    return () => {
      Object.values(assets.geometries).forEach((geometry) => geometry.dispose())
      Object.values(assets.materials).forEach((material) => material.dispose())
    }
  }, [assets])

  const classicPoles = pairedPartInstances(grouped.classic, [
    { position: [-0.4, 0.5, 0] },
    { position: [0.4, 0.5, 0] },
  ])
  const classicBoxes = partInstances(grouped.classic, { position: [0, 1.0, 0] })
  const singlePoles = partInstances(grouped.singlePole, { position: [0, 0.55, 0] })
  const singleBoxes = partInstances(grouped.singlePole, { position: [0, 1.15, 0] })
  const megaPoles = pairedPartInstances(grouped.mega, [
    { position: [-0.7, 0.8, 0] },
    { position: [0.7, 0.8, 0] },
  ])
  const megaBoxes = partInstances(grouped.mega, { position: [0, 1.65, 0] })
  const megaTopBars = partInstances(grouped.mega, { position: [0, 2.04, 0.03] })
  const posterPoles = partInstances(grouped.poster, { position: [0, 0.45, 0] })
  const posterBoxes = pairedPartInstances(grouped.poster, [
    { position: [0, 0.85, 0.06] },
    { position: [0, 0.85, -0.06] },
  ])

  return (
    <group>
      <InstancedMeshBatch instances={classicPoles} geometry={assets.geometries.classicPole} material={assets.materials.classicPole} castShadow={false} />
      <InstancedMeshBatch instances={classicBoxes} geometry={assets.geometries.classicBox} material={assets.materials.classicBox} castShadow={false} />
      {colorGroups(grouped.classic, { position: [0, 1.0, 0.03] }).map(([color, instances]) => (
        <ColorPanelBatch key={`classic-${color}`} instances={instances} geometry={assets.geometries.classicFace} color={color} intensity={1.4} />
      ))}

      <InstancedMeshBatch instances={singlePoles} geometry={assets.geometries.singlePole} material={assets.materials.singlePole} castShadow={false} />
      <InstancedMeshBatch instances={singleBoxes} geometry={assets.geometries.singleBox} material={assets.materials.classicBox} castShadow={false} />
      {colorGroups(grouped.singlePole, { position: [0, 1.15, 0.045] }).map(([color, instances]) => (
        <ColorPanelBatch key={`single-${color}`} instances={instances} geometry={assets.geometries.singleFace} color={color} intensity={1.6} />
      ))}

      <InstancedMeshBatch instances={megaPoles} geometry={assets.geometries.megaPole} material={assets.materials.singlePole} castShadow={false} />
      <InstancedMeshBatch instances={megaBoxes} geometry={assets.geometries.megaBox} material={assets.materials.megaBox} castShadow={false} />
      {colorGroups(grouped.mega, { position: [0, 1.65, 0.04] }).map(([color, instances]) => (
        <ColorPanelBatch key={`mega-${color}`} instances={instances} geometry={assets.geometries.megaFace} color={color} intensity={2.4} />
      ))}
      <InstancedMeshBatch instances={megaTopBars} geometry={assets.geometries.megaTopBar} material={assets.materials.megaTopBar} />

      <InstancedMeshBatch instances={posterPoles} geometry={assets.geometries.posterPole} material={assets.materials.classicPole} castShadow={false} />
      <InstancedMeshBatch instances={posterBoxes} geometry={assets.geometries.posterBox} material={assets.materials.posterBox} castShadow={false} />
      {colorGroups(grouped.poster, { position: [0, 0.85, 0.082] }).map(([color, instances]) => (
        <ColorPanelBatch key={`poster-front-${color}`} instances={instances} geometry={assets.geometries.posterFace} color={color} intensity={1.2} />
      ))}
      {colorGroups(grouped.poster, { position: [0, 0.85, -0.082], rotation: [0, Math.PI, 0] }).map(([color, instances]) => (
        <ColorPanelBatch key={`poster-back-${color}`} instances={instances} geometry={assets.geometries.posterFace} color={color} intensity={1.2} />
      ))}
    </group>
  )
}
