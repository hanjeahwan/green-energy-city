import * as THREE from 'three'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useThrottledFrame } from '../../scene/throttledFrame'
import { rng } from '../../components/sceneMaterials'
import { AlarmCluster } from '../../components/AlarmCluster'
import { StatusRing, type Status } from '../StatusRing'
import type { ElementVariant } from '../types'
import { CORE_BLUE } from '../../scene/palette'
import { getPVPanelTexture } from '../shared/pvAsset'

// =============================================================================
// SolarFarm variants
//   classic — grid of tilted panels on mount legs (rows × cols)
//   modern  — dual-axis pole tracker: single central column + tilted panel array on top
// Footprint depends on rows/cols (procedural — not catalog-checked).
// =============================================================================

interface SolarFarmFeatures {}

export const SOLARFARM_VARIANTS: Record<string, ElementVariant<SolarFarmFeatures>> = {
  classic: { id: 'classic', footprint: { halfW: 1.5, halfD: 1.5 } },
  modern:  { id: 'modern',  footprint: { halfW: 1.5, halfD: 1.5 } }
}

const CLASSIC_PANEL_SPACING_X = 0.5
const CLASSIC_ROW_SPACING_Z = 0.62
const CLASSIC_PANEL_WIDTH = 0.48
const CLASSIC_PANEL_DEPTH = 0.38
const CLASSIC_FRAME_WIDTH = 0.51
const CLASSIC_FRAME_DEPTH = 0.42
const TRACKER_PANEL_SPACING_X = 0.46
const TRACKER_ROW_SPACING_Z = 0.34
const TRACKER_PANEL_WIDTH = 0.42
const TRACKER_PANEL_DEPTH = 0.31

type ClassicInstancedPartKind = 'rowBeam' | 'frame' | 'panel' | 'frontLeftLeg' | 'frontRightLeg' | 'rearLeg'

function ClassicInstancedPart({
  rows,
  cols,
  geometry,
  material,
  kind,
  castShadow = false,
}: {
  rows: number
  cols: number
  geometry: THREE.BufferGeometry
  material: THREE.Material
  kind: ClassicInstancedPartKind
  castShadow?: boolean
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const count = kind === 'rowBeam' ? rows : rows * cols

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return

    const obj = new THREE.Object3D()
    let index = 0

    for (let r = 0; r < rows; r += 1) {
      const rowZ = (r - rows / 2 + 0.5) * CLASSIC_ROW_SPACING_Z

      if (kind === 'rowBeam') {
        obj.position.set(0, 0.05, rowZ + 0.18)
        obj.rotation.set(0, 0, 0)
        obj.updateMatrix()
        mesh.setMatrixAt(index, obj.matrix)
        index += 1
        continue
      }

      for (let c = 0; c < cols; c += 1) {
        const x = (c - cols / 2 + 0.5) * CLASSIC_PANEL_SPACING_X
        const jitter = (rng(r * 31 + c) - 0.5) * 0.03
        obj.position.set(x + jitter, 0, rowZ)
        obj.rotation.set(0, 0, 0)

        if (kind === 'frame') {
          obj.position.y = 0.218
          obj.rotation.x = -Math.PI / 2 + 0.32
        } else if (kind === 'panel') {
          obj.position.y = 0.22
          obj.rotation.x = -Math.PI / 2 + 0.32
        } else if (kind === 'frontLeftLeg') {
          obj.position.x -= 0.11
          obj.position.y = 0.055
          obj.position.z += 0.1
        } else if (kind === 'frontRightLeg') {
          obj.position.x += 0.11
          obj.position.y = 0.055
          obj.position.z += 0.1
        } else {
          obj.position.y = 0.12
          obj.position.z -= 0.12
        }

        obj.updateMatrix()
        mesh.setMatrixAt(index, obj.matrix)
        index += 1
      }
    }

    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [rows, cols, kind])

  if (count === 0) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      castShadow={castShadow}
      receiveShadow={false}
      frustumCulled={false}
    />
  )
}

export function SolarFarm({
  position,
  rows = 3,
  cols = 4,
  rotation = 0,
  variant = 'classic',
  status
}: {
  position: [number, number, number]
  rows?: number
  cols?: number
  rotation?: number
  variant?: string
  status?: Status
}) {
  // Panel texture sourced from the shared PV asset (see
  // src/elements/shared/pvAsset.ts) so SolarFarm + every other PV-bearing
  // building / facility use the same 8×6 cell + silver-blue gridlines.
  const panelTexture = useMemo(() => getPVPanelTexture(), [])

  const isModern = variant === 'modern'
  const radius = Math.max(1.15, cols * 0.28, rows * 0.34)

  // Shared, animated material across every panel in this farm. Pre-this
  // change panels were a static dark slab — looked dead under the new cool
  // lighting. A very subtle CORE_BLUE emissive that breathes at 0.05 Hz
  // ("PV reflection sparkle") gives them visible life without bloom.
  // Material base color tuned to multiply with the new lighter texture so
  // the finished panel reads as mid navy (real PV), not the previous
  // near-black slab. Roughness slightly lower to keep specular hint.
  const panelMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#2e4a7a'),
      roughness: 0.32,
      metalness: 0.5,
      map: panelTexture,
      emissive: new THREE.Color(CORE_BLUE),
      emissiveIntensity: 0.05,
    })
  }, [panelTexture])
  // Dispose the material on unmount so HMR + unmounted farms don't leak.
  useEffect(() => () => panelMaterial.dispose(), [panelMaterial])
  useThrottledFrame((s) => {
    const t = s.clock.getElapsedTime()
    // ±0.05 range around base 0.05 → emissiveIntensity oscillates 0.0..0.1.
    panelMaterial.emissiveIntensity = 0.05 + 0.05 * Math.sin(t * 0.3)
  }, 20)

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {isModern ? (
        <ModernDualAxisTracker rows={rows} cols={cols} panelMaterial={panelMaterial} />
      ) : (
        <ClassicTiltedGrid rows={rows} cols={cols} panelMaterial={panelMaterial} />
      )}
      {status && <StatusRing status={status} radius={radius} />}
      {status === 'crit' && <AlarmCluster position={[0, 0, 0]} radius={radius + 0.2} height={2.0} />}
    </group>
  )
}

function ClassicTiltedGrid({
  rows,
  cols,
  panelMaterial
}: {
  rows: number
  cols: number
  panelMaterial: THREE.MeshStandardMaterial
}) {
  const assets = useMemo(() => {
    const rowBeamGeometry = new THREE.BoxGeometry(cols * CLASSIC_PANEL_SPACING_X + 0.08, 0.03, 0.03)
    const frameGeometry = new THREE.BoxGeometry(CLASSIC_FRAME_WIDTH, CLASSIC_FRAME_DEPTH, 0.015)
    const panelGeometry = new THREE.BoxGeometry(CLASSIC_PANEL_WIDTH, CLASSIC_PANEL_DEPTH, 0.02)
    const frontLegGeometry = new THREE.CylinderGeometry(0.014, 0.014, 0.12, 6)
    const rearLegGeometry = new THREE.CylinderGeometry(0.014, 0.014, 0.24, 6)
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: '#c8d0db',
      roughness: 0.4,
      metalness: 0.7,
    })
    const supportMaterial = new THREE.MeshStandardMaterial({
      color: '#5d6b7d',
      roughness: 0.55,
      metalness: 0.4,
    })
    const rowBeamMaterial = new THREE.MeshStandardMaterial({
      color: '#5d6b7d',
      roughness: 0.6,
      metalness: 0.3,
    })

    return {
      geometries: {
        rowBeam: rowBeamGeometry,
        frame: frameGeometry,
        panel: panelGeometry,
        frontLeg: frontLegGeometry,
        rearLeg: rearLegGeometry,
      },
      materials: {
        rowBeam: rowBeamMaterial,
        frame: frameMaterial,
        support: supportMaterial,
      },
    }
  }, [cols])

  useEffect(() => {
    return () => {
      Object.values(assets.geometries).forEach((geometry) => geometry.dispose())
      Object.values(assets.materials).forEach((material) => material.dispose())
    }
  }, [assets])

  return (
    <>
      <ClassicInstancedPart rows={rows} cols={cols} geometry={assets.geometries.rowBeam} material={assets.materials.rowBeam} kind="rowBeam" />
      <ClassicInstancedPart rows={rows} cols={cols} geometry={assets.geometries.frame} material={assets.materials.frame} kind="frame" castShadow={false} />
      <ClassicInstancedPart rows={rows} cols={cols} geometry={assets.geometries.panel} material={panelMaterial} kind="panel" castShadow={false} />
      <ClassicInstancedPart rows={rows} cols={cols} geometry={assets.geometries.frontLeg} material={assets.materials.support} kind="frontLeftLeg" />
      <ClassicInstancedPart rows={rows} cols={cols} geometry={assets.geometries.frontLeg} material={assets.materials.support} kind="frontRightLeg" />
      <ClassicInstancedPart rows={rows} cols={cols} geometry={assets.geometries.rearLeg} material={assets.materials.support} kind="rearLeg" />
    </>
  )
}

function ModernDualAxisTracker({
  rows,
  cols,
  panelMaterial
}: {
  rows: number
  cols: number
  panelMaterial: THREE.MeshStandardMaterial
}) {
  // Single central pole carrying a compact panel array (3×4 typical) on a 2-axis pivot.
  // Cover the same footprint envelope as classic but with 1 dramatic vertical column.
  // Compact array on tracker — fewer panels but bigger
  const arrayCols = Math.min(cols, 3)
  const arrayRows = Math.min(rows, 2)
  return (
    <>
      {/* central foundation block */}
      <mesh position={[0, 0.15, 0]} castShadow={false}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshLambertMaterial color="#5a6878" />
      </mesh>
      {/* central pole */}
      <mesh position={[0, 0.85, 0]} castShadow={false}>
        <cylinderGeometry args={[0.05, 0.06, 1.1, 8]} />
        <meshLambertMaterial color="#c8d0db" />
      </mesh>
      {/* 2-axis pivot housing (sphere) */}
      <mesh position={[0, 1.45, 0]} castShadow={false}>
        <sphereGeometry args={[0.09, 12, 10]} />
        <meshLambertMaterial color="#3a4a5e" />
      </mesh>
      {/* horizontal axis arm */}
      <mesh position={[0, 1.45, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, arrayCols * TRACKER_PANEL_SPACING_X + 0.16, 6]} />
        <meshLambertMaterial color="#5a6878" />
      </mesh>
      {/* tracker panel array — tilted at ~25° toward 'sun' */}
      <group position={[0, 1.55, 0]} rotation={[-Math.PI / 6, 0, 0]}>
        {/* backing frame */}
        <mesh castShadow={false}>
          <boxGeometry args={[arrayCols * TRACKER_PANEL_SPACING_X + 0.05, 0.02, arrayRows * TRACKER_ROW_SPACING_Z + 0.05]} />
          <meshLambertMaterial color="#5d6b7d" />
        </mesh>
        {/* individual panels in array */}
        {Array.from({ length: arrayRows }).map((_, r) =>
          Array.from({ length: arrayCols }).map((_, c) => {
            const x = (c - arrayCols / 2 + 0.5) * TRACKER_PANEL_SPACING_X
            const z = (r - arrayRows / 2 + 0.5) * TRACKER_ROW_SPACING_Z
            return (
              <mesh
                key={`${r}-${c}`}
                position={[x, 0.015, z]}
                castShadow={false}
                material={panelMaterial}
              >
                <boxGeometry args={[TRACKER_PANEL_WIDTH, 0.02, TRACKER_PANEL_DEPTH]} />
              </mesh>
            )
          })
        )}
      </group>
    </>
  )
}
