import * as THREE from 'three'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { flatGradMat, tintedGeometry } from '../../components/sceneMaterials'
import {
  computeTreePlacements,
  type TreePlacement,
  type TreeVariant,
  VFP_PLACEMENTS,
  verifyTrees,
  verifyVFPPlacements,
} from '../../scene/treeLayout'
import { VerticalFarmPlanter } from './VerticalFarmPlanter'
import { InstancedMeshBatch, type InstanceTransform } from '../shared/InstancedMeshBatch'

// Tree placement is district-aware, building-aware, and PLACEMENTS-aware. See
// src/scene/treeLayout.ts for the algorithm + verifier. This component renders
// the procedural tree list through species/part instanced batches, preserving
// the old per-tree wind sway with a small number of per-frame matrix updates.
//
// Verification: after placement, verifyTrees() + verifyVFPPlacements() audit
// against actual canopy radii (zero buffer). Results published to
// `window.__treeViolations` so LayoutAuditBanner can render them inline.

const SWAY_AMP_Y = 0.022
const SWAY_AMP_Z = 0.015
const SWAY_FREQ_Y = 0.6
const SWAY_FREQ_Z = 0.5

const TREE_VARIANTS: TreeVariant[] = ['classic', 'modern', 'palm', 'broadleaf']
const SHADOW_RADIUS: Record<TreeVariant, number> = {
  classic: 0.35,
  modern: 0.35,
  palm: 0.45,
  broadleaf: 0.55,
}

type PlacementGroup = Record<TreeVariant, TreePlacement[]>

function disposeResources(resources: Record<string, THREE.BufferGeometry | THREE.Material>) {
  Object.values(resources).forEach((resource) => resource.dispose())
}

function localMatrix({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
}: {
  position?: readonly [number, number, number]
  rotation?: readonly [number, number, number]
  scale?: readonly [number, number, number]
}) {
  const obj = new THREE.Object3D()
  obj.position.set(position[0], position[1], position[2])
  obj.rotation.set(rotation[0], rotation[1], rotation[2])
  obj.scale.set(scale[0], scale[1], scale[2])
  obj.updateMatrix()
  return obj.matrix.clone()
}

function multiplyMatrices(...matrices: THREE.Matrix4[]) {
  const result = new THREE.Matrix4().identity()
  for (const matrix of matrices) result.multiply(matrix)
  return result
}

function writeTreeMatrices({
  mesh,
  placements,
  partMatrix,
  elapsed,
  updateBounds = false,
  parent,
  matrix,
}: {
  mesh: THREE.InstancedMesh
  placements: readonly TreePlacement[]
  partMatrix: THREE.Matrix4
  elapsed: number
  updateBounds?: boolean
  parent?: THREE.Object3D
  matrix?: THREE.Matrix4
}) {
  const parentObj = parent ?? new THREE.Object3D()
  const instanceMatrix = matrix ?? new THREE.Matrix4()

  placements.forEach((tree, index) => {
    parentObj.position.set(tree.x, 0, tree.z)
    parentObj.scale.setScalar(tree.scale)
    parentObj.rotation.set(
      0,
      tree.rot + Math.sin(elapsed * SWAY_FREQ_Y + tree.swayPhase) * SWAY_AMP_Y,
      Math.sin(elapsed * SWAY_FREQ_Z + tree.swayPhase + Math.PI / 3) * SWAY_AMP_Z
    )
    parentObj.updateMatrix()
    instanceMatrix.multiplyMatrices(parentObj.matrix, partMatrix)
    mesh.setMatrixAt(index, instanceMatrix)
  })

  mesh.instanceMatrix.needsUpdate = true
  if (updateBounds) mesh.computeBoundingSphere()
}

function AnimatedTreePart({
  placements,
  geometry,
  material,
  partMatrix,
  castShadow = false,
  receiveShadow = false,
  renderOrder,
}: {
  placements: readonly TreePlacement[]
  geometry: THREE.BufferGeometry
  material: THREE.Material
  partMatrix: THREE.Matrix4
  castShadow?: boolean
  receiveShadow?: boolean
  renderOrder?: number
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const scratchParent = useMemo(() => new THREE.Object3D(), [])
  const scratchMatrix = useMemo(() => new THREE.Matrix4(), [])
  const lastUpdateRef = useRef(0)

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    writeTreeMatrices({
      mesh,
      placements,
      partMatrix,
      elapsed: 0,
      updateBounds: true,
      parent: scratchParent,
      matrix: scratchMatrix,
    })
  }, [placements, partMatrix, scratchParent, scratchMatrix])

  // Wind sway throttled to ~30Hz. The CPU cost of rewriting the entire
  // instanceMatrix buffer + GPU upload every frame for 94 trees x several
  // parts was a measurable drag; 30Hz is indistinguishable to the eye
  // (cinema runs at 24).
  useFrame((state) => {
    const mesh = meshRef.current
    if (!mesh) return
    const now = state.clock.elapsedTime
    if (now - lastUpdateRef.current < 1 / 30) return
    lastUpdateRef.current = now
    writeTreeMatrices({
      mesh,
      placements,
      partMatrix,
      elapsed: now,
      parent: scratchParent,
      matrix: scratchMatrix,
    })
  })

  if (placements.length === 0) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, placements.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      frustumCulled={false}
      renderOrder={renderOrder}
    />
  )
}

function TreeShadowBatch({
  placements,
  variant,
  geometry,
  material,
}: {
  placements: readonly TreePlacement[]
  variant: TreeVariant
  geometry: THREE.BufferGeometry
  material: THREE.Material
}) {
  const partMatrix = useMemo(
    () =>
      localMatrix({
        position: [0, 0.005, 0],
        rotation: [-Math.PI / 2, 0, 0],
        scale: [SHADOW_RADIUS[variant], SHADOW_RADIUS[variant], 1],
      }),
    [variant]
  )

  return (
    <StaticTreePart
      placements={placements}
      geometry={geometry}
      material={material}
      partMatrix={partMatrix}
      castShadow={false}
      renderOrder={1}
    />
  )
}

function staticTreeInstances(placements: readonly TreePlacement[], partMatrix: THREE.Matrix4): InstanceTransform[] {
  const parent = new THREE.Object3D()
  const matrix = new THREE.Matrix4()

  return placements.map((tree) => {
    parent.position.set(tree.x, 0, tree.z)
    parent.rotation.set(0, tree.rot, 0)
    parent.scale.setScalar(tree.scale)
    parent.updateMatrix()
    matrix.multiplyMatrices(parent.matrix, partMatrix)
    return { matrix: matrix.clone() }
  })
}

function StaticTreePart({
  placements,
  geometry,
  material,
  partMatrix,
  castShadow = false,
  receiveShadow = false,
  renderOrder,
}: {
  placements: readonly TreePlacement[]
  geometry: THREE.BufferGeometry
  material: THREE.Material
  partMatrix: THREE.Matrix4
  castShadow?: boolean
  receiveShadow?: boolean
  renderOrder?: number
}) {
  const instances = useMemo(
    () => staticTreeInstances(placements, partMatrix),
    [placements, partMatrix]
  )

  return (
    <InstancedMeshBatch
      instances={instances}
      geometry={geometry}
      material={material}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      frustumCulled={false}
      renderOrder={renderOrder}
    />
  )
}

function TreeBatches({ groups }: { groups: PlacementGroup }) {
  const assets = useMemo(() => {
    const shadowGeometry = new THREE.CircleGeometry(1, 28)
    const classicTrunkGeometry = new THREE.CylinderGeometry(0.04, 0.06, 0.36, 6)
    const modernTrunkGeometry = new THREE.CylinderGeometry(0.025, 0.035, 0.24, 6)
    const palmTrunkGeometry = new THREE.CylinderGeometry(0.035, 0.05, 1.4, 6)
    const broadleafTrunkGeometry = new THREE.CylinderGeometry(0.07, 0.09, 0.5, 7)
    const classicConeLargeGeometry = tintedGeometry(
      new THREE.ConeGeometry(0.32, 0.7, 8).translate(0, 0.35, 0),
      '#3a8a52',
      0.55
    )
    const classicConeSmallGeometry = tintedGeometry(
      new THREE.ConeGeometry(0.24, 0.55, 8).translate(0, 0.5, 0),
      '#42a060',
      0.55
    )
    const evergreenConeGeometry = tintedGeometry(
      new THREE.ConeGeometry(0.22, 1.1, 8).translate(0, 0.55, 0),
      '#2d6a3c',
      0.45
    )
    const palmFrondGeometry = new THREE.BoxGeometry(0.5, 0.02, 0.12)
    const broadleafCanopyGeometry = tintedGeometry(
      new THREE.SphereGeometry(0.55, 12, 10).scale(1, 0.7, 1),
      '#5a8a3a',
      0.5
    )

    const shadowMaterial = new THREE.MeshBasicMaterial({
      color: '#0a1422',
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    })
    const classicTrunkMaterial = new THREE.MeshStandardMaterial({ color: '#6a4226' })
    const modernTrunkMaterial = new THREE.MeshStandardMaterial({ color: '#3a2a1a' })
    const palmTrunkMaterial = new THREE.MeshStandardMaterial({ color: '#9b7a52' })
    const palmLeafMaterial = new THREE.MeshStandardMaterial({ color: '#3f5a36' })
    const broadleafTrunkMaterial = new THREE.MeshStandardMaterial({ color: '#7a5a3a' })
    const leafMaterial = flatGradMat()

    const palmFrondMatrices = Array.from({ length: 6 }, (_, index) => {
      const yaw = (Math.PI * 2 * index) / 6
      return multiplyMatrices(
        localMatrix({ position: [0, 1.4, 0] }),
        localMatrix({ rotation: [0, yaw, -0.35] }),
        localMatrix({ position: [0.25, 0, 0] })
      )
    })

    return {
      geometries: {
        shadow: shadowGeometry,
        classicTrunk: classicTrunkGeometry,
        modernTrunk: modernTrunkGeometry,
        palmTrunk: palmTrunkGeometry,
        broadleafTrunk: broadleafTrunkGeometry,
        classicConeLarge: classicConeLargeGeometry,
        classicConeSmall: classicConeSmallGeometry,
        evergreenCone: evergreenConeGeometry,
        palmFrond: palmFrondGeometry,
        broadleafCanopy: broadleafCanopyGeometry,
      },
      materials: {
        shadow: shadowMaterial,
        classicTrunk: classicTrunkMaterial,
        modernTrunk: modernTrunkMaterial,
        palmTrunk: palmTrunkMaterial,
        palmLeaf: palmLeafMaterial,
        broadleafTrunk: broadleafTrunkMaterial,
        leaf: leafMaterial,
      },
      matrices: {
        classicTrunk: localMatrix({ position: [0, 0.18, 0] }),
        classicConeLarge: localMatrix({ position: [0, 0.25, 0] }),
        classicConeSmall: localMatrix({ position: [0, 0.35, 0] }),
        modernTrunk: localMatrix({ position: [0, 0.12, 0] }),
        evergreenCone: localMatrix({ position: [0, 0.22, 0] }),
        palmTrunk: localMatrix({ position: [0, 0.7, 0] }),
        palmFronds: palmFrondMatrices,
        broadleafTrunk: localMatrix({ position: [0, 0.25, 0] }),
        broadleafCanopy: localMatrix({ position: [0, 0.75, 0] }),
      },
    }
  }, [])

  useEffect(() => {
    return () => {
      disposeResources(assets.geometries)
      disposeResources(assets.materials)
    }
  }, [assets])

  // TreeShadowBatch (per-tree dark base disc) intentionally NOT mounted —
  // same shadow-off rationale as BaseShadowDisc/BaseOutline. The discs were
  // fake-AO companions to real directional shadows; without those, they
  // read as discrete dark spots under each tree.
  void TreeShadowBatch
  return (
    <group>

      <StaticTreePart placements={groups.classic} geometry={assets.geometries.classicTrunk} material={assets.materials.classicTrunk} partMatrix={assets.matrices.classicTrunk} />
      <AnimatedTreePart placements={groups.classic} geometry={assets.geometries.classicConeLarge} material={assets.materials.leaf} partMatrix={assets.matrices.classicConeLarge} />
      <AnimatedTreePart placements={groups.classic} geometry={assets.geometries.classicConeSmall} material={assets.materials.leaf} partMatrix={assets.matrices.classicConeSmall} />

      <StaticTreePart placements={groups.modern} geometry={assets.geometries.modernTrunk} material={assets.materials.modernTrunk} partMatrix={assets.matrices.modernTrunk} />
      <AnimatedTreePart placements={groups.modern} geometry={assets.geometries.evergreenCone} material={assets.materials.leaf} partMatrix={assets.matrices.evergreenCone} />

      <StaticTreePart placements={groups.palm} geometry={assets.geometries.palmTrunk} material={assets.materials.palmTrunk} partMatrix={assets.matrices.palmTrunk} />
      {assets.matrices.palmFronds.map((matrix, index) => (
        <AnimatedTreePart key={`palm-frond-${index}`} placements={groups.palm} geometry={assets.geometries.palmFrond} material={assets.materials.palmLeaf} partMatrix={matrix} />
      ))}

      <StaticTreePart placements={groups.broadleaf} geometry={assets.geometries.broadleafTrunk} material={assets.materials.broadleafTrunk} partMatrix={assets.matrices.broadleafTrunk} />
      <AnimatedTreePart placements={groups.broadleaf} geometry={assets.geometries.broadleafCanopy} material={assets.materials.leaf} partMatrix={assets.matrices.broadleafCanopy} />
    </group>
  )
}

export function Trees() {
  const trees = useMemo(() => computeTreePlacements(), [])
  const groups = useMemo(
    () =>
      trees.reduce<PlacementGroup>(
        (acc, tree) => {
          acc[tree.variant].push(tree)
          return acc
        },
        { classic: [], modern: [], palm: [], broadleaf: [] }
      ),
    [trees]
  )
  const violations = useMemo(
    () => [...verifyVFPPlacements(), ...verifyTrees(trees)],
    [trees]
  )
  if (typeof window !== 'undefined') {
    const w = window as unknown as {
      __trees?: unknown
      __treeViolations?: unknown
    }
    w.__trees = trees
    w.__treeViolations = violations
    if (violations.length > 0) {
      console.error(`[TreeAudit] ${violations.length} violation(s):`)
      for (const v of violations) console.error(`  - [${v.kind}] ${v.msg}`)
    } else {
      console.log(`[TreeAudit] ${trees.length} trees placed — 0 overlaps`)
    }
  }
  return (
    <group>
      <TreeBatches groups={groups} />
      {VFP_PLACEMENTS.map((v, i) => (
        <VerticalFarmPlanter
          key={`vfp${i}`}
          position={[v.x, 0, v.z]}
          rot={v.rot}
          variant={v.variant}
        />
      ))}
    </group>
  )
}
