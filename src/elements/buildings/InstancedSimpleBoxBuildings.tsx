import * as THREE from 'three'
import { useMemo } from 'react'
import type { BuildingDef } from '../types'
import { InstancedMeshBatch, type InstanceTransform } from '../shared/InstancedMeshBatch'

// =============================================================================
// InstancedSimpleBoxBuildings
//
// For the four high-count "small box" building types (house, utility-shed,
// service-depot, microgrid-control), batches:
//   - body  : BoxGeometry(b.w, b.h, b.d) at y=b.h/2, color=b.topHex
//   - roof  : BoxGeometry(b.w+pad, 0.045, b.d+pad) at y=b.h+0.025
//
// House gets its body batched in ALL variants (body is a simple box for
// classic / modern / industrial). Roof is only batched for classic
// (flat slab) — modern / industrial have variant-specific roof geometries
// that the per-component renderer still handles.
//
// utility-shed / service-depot / microgrid-control: <Shell> body+roof both
// batched in all variants.
//
// Townhouse: NOT eligible — its body is built from 1-3 sub-unit boxes,
// not a single box. Skipping keeps this batch's invariants simple.
//
// Visual trade vs the per-component <Shell> + tintedGeometry path:
//   - Body no longer has the top-light / bottom-dark vertex gradient
//     (factor 0.82). Bodies read slightly flatter / brighter on shaded
//     faces. Hemisphere light still gives sun/ground tint.
//   - Roof color compressed to one shared dark slate (#3a4a5e); the
//     per-variant utility-shed industrial accent (#22354f) is dropped.
//
// Decorations (windows, doors, gables, vertical-garden plane, signatures,
// pyramid roof, sloped shed roof) stay in the per-component renderer —
// they're rendered AROUND this batch via the same building component, just
// with the `instanced` prop telling that component to skip body+roof.
// =============================================================================

export const INSTANCED_BODY_TYPES = new Set([
  'house',
  'utility-shed',
  'service-depot',
  'microgrid-control',
])

function rooflessBuilding(b: BuildingDef): boolean {
  // House modern (pyramid) + industrial (shed) have non-slab roofs that the
  // per-component renderer draws. Skip them from the roof batch.
  if (b.type === 'house' && b.variant !== 'classic') return true
  return false
}

const ROOF_PAD = 0.045
const ROOF_THICKNESS = 0.045
const ROOF_COLOR = '#3a4a5e'

export function InstancedSimpleBoxBuildings({ buildings }: { buildings: readonly BuildingDef[] }) {
  const eligible = useMemo(
    () => buildings.filter((b) => INSTANCED_BODY_TYPES.has(b.type)),
    [buildings]
  )

  const bodyInstances = useMemo<InstanceTransform[]>(() => {
    const t = new THREE.Matrix4()
    const r = new THREE.Matrix4()
    const s = new THREE.Matrix4()
    return eligible.map((b) => {
      t.makeTranslation(b.pos[0], b.h / 2, b.pos[1])
      r.makeRotationY(b.rot)
      s.makeScale(b.w, b.h, b.d)
      const m = new THREE.Matrix4().multiplyMatrices(t, r).multiply(s)
      return { matrix: m, color: b.topHex }
    })
  }, [eligible])

  const roofInstances = useMemo<InstanceTransform[]>(() => {
    const t = new THREE.Matrix4()
    const r = new THREE.Matrix4()
    const s = new THREE.Matrix4()
    return eligible
      .filter((b) => !rooflessBuilding(b))
      .map((b) => {
        t.makeTranslation(b.pos[0], b.h + 0.025, b.pos[1])
        r.makeRotationY(b.rot)
        s.makeScale(b.w + ROOF_PAD, ROOF_THICKNESS, b.d + ROOF_PAD)
        const m = new THREE.Matrix4().multiplyMatrices(t, r).multiply(s)
        return { matrix: m }
      })
  }, [eligible])

  const bodyGeom = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])
  const bodyMat = useMemo(() => new THREE.MeshLambertMaterial(), [])
  const roofGeom = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])
  const roofMat = useMemo(() => new THREE.MeshLambertMaterial({ color: ROOF_COLOR }), [])

  return (
    <group>
      <InstancedMeshBatch instances={bodyInstances} geometry={bodyGeom} material={bodyMat} frustumCulled={false} />
      <InstancedMeshBatch instances={roofInstances} geometry={roofGeom} material={roofMat} frustumCulled={false} />
    </group>
  )
}
