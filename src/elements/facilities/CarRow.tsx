import * as THREE from 'three'
import { useEffect, useMemo } from 'react'
import { rng } from '../../components/sceneMaterials'
import { BaseShadowDisc } from '../../components/scenePrimitives'
import { AlarmCluster } from '../../components/AlarmCluster'
import { StatusRing, type Status } from '../StatusRing'
import type { ElementVariant } from '../types'
import { ACCENT_CYAN } from '../buildings/catalog'
import { ENERGY_CYAN, STEEL_LIGHT, STEEL_SLATE, STEEL_DARK, CORE_NAVY } from './palette'
import { InstancedMeshBatch, composeInstanceTransform, type InstanceTransform } from '../shared/InstancedMeshBatch'

// CarRow-specific tones (window glass, headlight, parking-lot tarmac).
const CAR_WINDOW = '#2a3340'   // smoked glass cabin
const CAR_HEADLIGHT = '#5aa0d0' // headlight bulb
const CAR_MIDNIGHT = '#22354f'  // navy-blue body
const CAR_NAVY_DARK = '#1a3a5c' // alt navy body
const CAR_WHITE = '#ffffff'     // white body
const LANE_PAINT = '#dde3ec'    // white stall divider

// =============================================================================
// CarRow variants
//   classic — `count` small EVs in a row, varied palette, jitter rotation
//   modern  — fewer wider stalls under a cable tray overhead (charging berths)
// Footprint depends on `count` (procedural — not catalog-checked).
// =============================================================================

interface CarRowFeatures {}

export const CARROW_VARIANTS: Record<string, ElementVariant<CarRowFeatures>> = {
  classic: { id: 'classic', footprint: { halfW: 1.6, halfD: 0.5 } },
  modern:  { id: 'modern',  footprint: { halfW: 1.6, halfD: 0.5 } }
}

export function CarRow({
  position,
  count = 6,
  variant = 'classic',
  status
}: {
  position: [number, number, number]
  count?: number
  variant?: string
  status?: Status
}) {
  const shadowRadius = variant === 'modern'
    ? Math.max(1.1, Math.ceil(count / 2) * 0.38)
    : count * 0.32

  return (
    <group position={position}>
      <BaseShadowDisc position={[0, 0.005, 0]} radius={shadowRadius} opacity={0.18} />
      {variant === 'modern' ? <ModernChargingBerths count={count} /> : <ClassicCars count={count} />}
      {status && <StatusRing status={status} radius={shadowRadius} />}
      {status === 'crit' && <AlarmCluster position={[0, 0, 0]} radius={shadowRadius + 0.12} height={1.4} />}
    </group>
  )
}

function ClassicCars({ count }: { count: number }) {
  const palette = [CORE_NAVY, ENERGY_CYAN, STEEL_LIGHT, CAR_WHITE, CAR_MIDNIGHT, ENERGY_CYAN, STEEL_SLATE, CORE_NAVY]
  const assets = useMemo(() => {
    const bodyGeometry = new THREE.BoxGeometry(0.42, 0.16, 0.86)
    const windowGeometry = new THREE.BoxGeometry(0.36, 0.14, 0.5)
    const headlightGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.16, 6)

    const bodyMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5 })
    const windowMaterial = new THREE.MeshStandardMaterial({ color: CAR_WINDOW, roughness: 0.4 })
    const headlightMaterial = new THREE.MeshStandardMaterial({ color: CAR_HEADLIGHT })

    return {
      geometries: { body: bodyGeometry, window: windowGeometry, headlight: headlightGeometry },
      materials: { body: bodyMaterial, window: windowMaterial, headlight: headlightMaterial },
    }
  }, [])

  useEffect(() => {
    return () => {
      Object.values(assets.geometries).forEach((geometry) => geometry.dispose())
      Object.values(assets.materials).forEach((material) => material.dispose())
    }
  }, [assets])

  const cars = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        position: [
          (i - count / 2 + 0.5) * 0.55 + (rng(i) - 0.5) * 0.05,
          0.08,
          (rng(i + 5) - 0.5) * 0.08,
        ] as const,
        rotation: [0, (rng(i + 9) - 0.5) * 0.08, 0] as const,
        color: palette[i % palette.length],
      })),
    [count, palette]
  )
  const carParents = cars.map((car) => ({ position: car.position, rotation: car.rotation }))
  const bodies: InstanceTransform[] = cars.map((car) => ({
    ...composeInstanceTransform({ position: car.position, rotation: car.rotation }, {}),
    color: car.color,
  }))
  const windows = carParents.map((parent) =>
    composeInstanceTransform(parent, { position: [0, 0.12, -0.05] })
  )
  const headlights = carParents.map((parent) =>
    composeInstanceTransform(parent, { position: [0, 0.04, 0.5] })
  )

  return (
    <>
      <InstancedMeshBatch instances={bodies} geometry={assets.geometries.body} material={assets.materials.body} castShadow={false} />
      <InstancedMeshBatch instances={windows} geometry={assets.geometries.window} material={assets.materials.window} />
      <InstancedMeshBatch instances={headlights} geometry={assets.geometries.headlight} material={assets.materials.headlight} />
    </>
  )
}

function ModernChargingBerths({ count }: { count: number }) {
  // Reduce to ~half the count, make each stall wider (0.95m vs 0.55m classic).
  // Overhead cable tray spans the whole row at y=1.2m.
  const stallCount = Math.max(2, Math.ceil(count / 2))
  const stallW = 0.95
  const totalW = stallCount * stallW
  const palette = [CORE_NAVY, CAR_MIDNIGHT, CAR_NAVY_DARK, STEEL_SLATE]
  const assets = useMemo(() => {
    const dividerGeometry = new THREE.BoxGeometry(0.03, 0.005, 1.1)
    const bodyGeometry = new THREE.BoxGeometry(0.6, 0.18, 0.9)
    const windowGeometry = new THREE.BoxGeometry(0.5, 0.14, 0.55)
    const postGeometry = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6)
    const cableGeometry = new THREE.CylinderGeometry(0.018, 0.018, 0.7, 6)

    const dividerMaterial = new THREE.MeshStandardMaterial({ color: LANE_PAINT, roughness: 0.95 })
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5 })
    const windowMaterial = new THREE.MeshStandardMaterial({ color: CAR_WINDOW, roughness: 0.4 })
    const postMaterial = new THREE.MeshStandardMaterial({ color: STEEL_LIGHT, roughness: 0.6 })
    const cableMaterial = new THREE.MeshStandardMaterial({ color: STEEL_DARK })

    return {
      geometries: { divider: dividerGeometry, body: bodyGeometry, window: windowGeometry, post: postGeometry, cable: cableGeometry },
      materials: { divider: dividerMaterial, body: bodyMaterial, window: windowMaterial, post: postMaterial, cable: cableMaterial },
    }
  }, [])

  useEffect(() => {
    return () => {
      Object.values(assets.geometries).forEach((geometry) => geometry.dispose())
      Object.values(assets.materials).forEach((material) => material.dispose())
    }
  }, [assets])

  const dividers = useMemo(
    () =>
      Array.from({ length: stallCount + 1 }).map((_, i) => ({
        // Painted pad at 0.015; dividers lifted 1cm above so the depth
        // buffer can resolve them at zoom-out (was 3mm gap -> flicker).
        position: [(i - stallCount / 2) * stallW, 0.028, 0] as const,
      })),
    [stallCount]
  )
  const cars = useMemo(
    () =>
      Array.from({ length: stallCount }).map((_, i) => ({
        position: [(i - stallCount / 2 + 0.5) * stallW, 0.1, 0] as const,
        color: palette[i % palette.length],
      })),
    [stallCount, palette]
  )
  const bodies = cars.map((car) => ({ position: car.position, color: car.color }))
  const windows = cars.map((car) =>
    composeInstanceTransform({ position: car.position }, { position: [0, 0.13, -0.08] })
  )
  const posts = [
    { position: [-totalW / 2 + 0.05, 0.6, -0.55] as const },
    { position: [totalW / 2 - 0.05, 0.6, -0.55] as const },
  ]
  const cables = useMemo(
    () =>
      Array.from({ length: stallCount }).map((_, i) => ({
        position: [(i - stallCount / 2 + 0.5) * stallW, 0.65, -0.45] as const,
      })),
    [stallCount]
  )

  return (
    <>
      {/* painted parking pad */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[totalW + 0.2, 1.2]} />
        <meshLambertMaterial color={STEEL_SLATE} />
      </mesh>
      {/* white painted stall divider lines */}
      <InstancedMeshBatch instances={dividers} geometry={assets.geometries.divider} material={assets.materials.divider} />
      {/* wider parked cars (1 per stall) */}
      <InstancedMeshBatch instances={bodies} geometry={assets.geometries.body} material={assets.materials.body} castShadow={false} />
      <InstancedMeshBatch instances={windows} geometry={assets.geometries.window} material={assets.materials.window} />
      {/* overhead cable tray (2 posts + horizontal bar + cable drops) */}
      <InstancedMeshBatch instances={posts} geometry={assets.geometries.post} material={assets.materials.post} castShadow={false} />
      <mesh position={[0, 1.15, -0.55]} castShadow={false}>
        <boxGeometry args={[totalW, 0.08, 0.1]} />
        <meshLambertMaterial color={STEEL_SLATE} />
      </mesh>
      {/* cyan emissive strip under tray (signature) */}
      <mesh position={[0, 1.1, -0.5]}>
        <boxGeometry args={[totalW - 0.05, 0.012, 0.04]} />
        <meshLambertMaterial color="#000" emissive={ACCENT_CYAN} emissiveIntensity={1.2} />
      </mesh>
      {/* cable drops over each stall */}
      <InstancedMeshBatch instances={cables} geometry={assets.geometries.cable} material={assets.materials.cable} />
    </>
  )
}
