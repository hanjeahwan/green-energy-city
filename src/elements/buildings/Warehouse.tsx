import * as THREE from 'three'
import { useMemo } from 'react'
import { tintedGeometry, flatGradMat } from '../../components/sceneMaterials'
import type { BuildingDef, ElementVariant } from '../types'
import { ACCENT_CYAN } from './catalog'
import { FacadeStack } from './facadeVariants'
import { getPVPanelTexture, PV_BASE_COLOR } from '../shared/pvAsset'

// =============================================================================
// Warehouse variants
//   classic    — data center: 12 cyan LED bands (4 facades × 3) + 2 cooling towers + 5 fins
//   modern     — logistics warehouse: gable roof + cargo door + 2 vent pipes, no LED
//   industrial — sawtooth roof: 4 angled glass-clerestory teeth + long side windows
// Shared: base outline, body box, optional rooftop PV.
// =============================================================================

interface WarehouseFeatures {}

export const WAREHOUSE_VARIANTS: Record<string, ElementVariant<WarehouseFeatures>> = {
  classic:    { id: 'classic',    footprint: { halfW: 1.0, halfD: 0.8 } },
  modern:     { id: 'modern',     footprint: { halfW: 1.0, halfD: 0.8 } },
  industrial: { id: 'industrial', footprint: { halfW: 1.0, halfD: 0.8 } }
}

export function Warehouse({ b }: { b: BuildingDef }) {
  const bodyGeom = useMemo(() => {
    const g = new THREE.BoxGeometry(b.w, b.h, b.d)
    g.translate(0, b.h / 2, 0)
    return tintedGeometry(g, b.topHex, 0.82)
  }, [b.w, b.h, b.d, b.topHex])
  const bodyMat = useMemo(() => flatGradMat({ roughness: 0.75 }), [])

  const isModern = b.variant === 'modern'
  const isIndustrial = b.variant === 'industrial'

  return (
    <group position={[b.pos[0], 0, b.pos[1]]} rotation={[0, b.rot, 0]}>
      {/* base outline rendered centrally by InstancedBuildingOutlines */}
      {/* body (shared) */}
      <mesh geometry={bodyGeom} material={bodyMat} castShadow receiveShadow />

      {isIndustrial
        ? <IndustrialSawtooth b={b} />
        : isModern
        ? <ModernGableRoof b={b} />
        : <ClassicDataCenter b={b} />}

      {/* optional rooftop solar — only flat-roof variants (classic) carry the panel
          modern uses the gable slope, industrial uses its sawtooth glazing instead */}
      {b.hasPV && !isModern && !isIndustrial && (
        <mesh position={[0, b.h + 0.16, -b.d * 0.25]} rotation={[-Math.PI / 2 + 0.12, 0, 0]} castShadow>
          <boxGeometry args={[b.w * 0.7, b.d * 0.4, 0.025]} />
          <meshLambertMaterial color={PV_BASE_COLOR} map={getPVPanelTexture()} />
        </mesh>
      )}
      {/* modern gable variant places smaller PV strip ON the south-facing slope */}
      {b.hasPV && isModern && (
        <mesh
          position={[0, b.h + b.w * 0.18 + 0.04, b.d * 0.18]}
          rotation={[-Math.PI / 6, 0, 0]}
          castShadow
        >
          <boxGeometry args={[b.w * 0.6, b.d * 0.45, 0.022]} />
          <meshLambertMaterial color={PV_BASE_COLOR} map={getPVPanelTexture()} />
        </mesh>
      )}
    </group>
  )
}

// -----------------------------------------------------------------------------
// Classic: flat roof + 4×3 cyan LED bands + 2 cooling towers + 5 ventilation fins
// -----------------------------------------------------------------------------
function ClassicDataCenter({ b }: { b: BuildingDef }) {
  return (
    <>
      {/* flat roof slab */}
      <mesh position={[0, b.h + 0.03, 0]} castShadow>
        <boxGeometry args={[b.w + 0.04, 0.06, b.d + 0.04]} />
        <meshLambertMaterial color="#3a4654" />
      </mesh>
      {/* M6: cyan LED bands now come from FacadeStack (data table entry
          for warehouse_classic with bandRatios=[0.3, 0.55, 0.8]). */}
      <FacadeStack b={b} />
      <mesh position={[-b.w * 0.22, b.h + 0.22, b.d * 0.18]} castShadow>
        <cylinderGeometry args={[0.11, 0.13, 0.4, 14]} />
        <meshLambertMaterial color="#c8d0db" />
      </mesh>
      <mesh position={[b.w * 0.22, b.h + 0.22, b.d * 0.18]} castShadow>
        <cylinderGeometry args={[0.11, 0.13, 0.4, 14]} />
        <meshLambertMaterial color="#c8d0db" />
      </mesh>
      {[-0.3, -0.15, 0, 0.15, 0.3].map((zr, i) => (
        <mesh key={`fin-${i}`} position={[0, b.h + 0.1, b.d * zr]}>
          <boxGeometry args={[b.w * 0.7, 0.04, 0.05]} />
          <meshLambertMaterial color="#3a4a5e" />
        </mesh>
      ))}
    </>
  )
}

// -----------------------------------------------------------------------------
// Industrial: sawtooth roof — 4 angled "teeth" running along the x axis. Each
// tooth is a steep glass clerestory facing north (so they read as factory roof
// glazing) plus a shallower opaque back slope. Side facade also gets a long
// horizontal window strip for "factory floor" feel.
// -----------------------------------------------------------------------------
function IndustrialSawtooth({ b }: { b: BuildingDef }) {
  const toothCount = 4
  const toothH = b.w * 0.22                // each tooth's vertical extent
  const toothDepth = b.d / toothCount
  const glassAngle = Math.atan2(toothH, toothDepth * 0.4)  // steep glazing
  const slopeAngle = Math.atan2(toothH, toothDepth * 0.6)  // shallow back
  const glassLen   = Math.hypot(toothH, toothDepth * 0.4) + 0.04
  const slopeLen   = Math.hypot(toothH, toothDepth * 0.6) + 0.04
  return (
    <>
      {/* sawtooth teeth running along z axis */}
      {Array.from({ length: toothCount }).map((_, i) => {
        const z0 = -b.d / 2 + i * toothDepth
        const glassCenterZ = z0 + toothDepth * 0.2
        const slopeCenterZ = z0 + toothDepth * 0.7
        return (
          <group key={`tooth-${i}`}>
            {/* steep north-facing glazing (clerestory window) */}
            <mesh
              position={[0, b.h + toothH / 2 + 0.02, glassCenterZ]}
              rotation={[-glassAngle, 0, 0]}
              castShadow
            >
              <boxGeometry args={[b.w + 0.04, 0.04, glassLen]} />
              <meshLambertMaterial color="#22354f" />
            </mesh>
            {/* shallower opaque back slope */}
            <mesh
              position={[0, b.h + toothH / 2 + 0.02, slopeCenterZ]}
              rotation={[slopeAngle, 0, 0]}
              castShadow
            >
              <boxGeometry args={[b.w + 0.04, 0.04, slopeLen]} />
              <meshLambertMaterial color="#3a4654" />
            </mesh>
            {/* vertical end-cap on west side filling triangular gap */}
            <mesh position={[b.w / 2 + 0.02, b.h + toothH * 0.5, z0 + toothDepth / 2]}>
              <planeGeometry args={[toothDepth, toothH]} />
              <meshLambertMaterial color={b.topHex} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[-b.w / 2 - 0.02, b.h + toothH * 0.5, z0 + toothDepth / 2]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[toothDepth, toothH]} />
              <meshLambertMaterial color={b.topHex} side={THREE.DoubleSide} />
            </mesh>
          </group>
        )
      })}
      {/* long horizontal window strip on each side facade — factory floor look */}
      {[
        { p: [b.w / 2 + 0.02, b.h * 0.55, 0] as [number, number, number],  rot: Math.PI / 2 },
        { p: [-b.w / 2 - 0.02, b.h * 0.55, 0] as [number, number, number], rot: -Math.PI / 2 }
      ].map((s, i) => (
        <mesh key={`strip-${i}`} position={s.p} rotation={[0, s.rot, 0]}>
          <planeGeometry args={[b.d * 0.9, b.h * 0.18]} />
          <meshLambertMaterial color="#22354f" />
        </mesh>
      ))}
      {/* loading dock door on front facade */}
      <mesh position={[0, b.h * 0.32, b.d / 2 + 0.02]}>
        <planeGeometry args={[b.w * 0.5, b.h * 0.6]} />
        <meshLambertMaterial color="#1c2638" />
      </mesh>
      {/* dock door horizontal panel lines */}
      {[0.18, 0.36, 0.54].map((yr, i) => (
        <mesh key={`dock-${i}`} position={[0, b.h * 0.32 - b.h * 0.3 + b.h * yr, b.d / 2 + 0.02]}>
          <planeGeometry args={[b.w * 0.48, 0.012]} />
          <meshLambertMaterial color="#3a4654" />
        </mesh>
      ))}
    </>
  )
}

// -----------------------------------------------------------------------------
// Modern: gable roof (two sloped slabs meeting at apex) + cargo door on front + 2 vent pipes
// -----------------------------------------------------------------------------
function ModernGableRoof({ b }: { b: BuildingDef }) {
  // Apex height — gable rises 0.35× building width above the eaves
  const apexH = b.w * 0.35
  const slopeAngle = Math.atan2(apexH, b.w / 2) // angle from horizontal up to apex
  const slopeLen = Math.hypot(b.w / 2, apexH) + 0.05
  return (
    <>
      {/* left slope */}
      <mesh
        position={[-b.w / 4, b.h + apexH / 2 + 0.02, 0]}
        rotation={[0, 0, slopeAngle]}
        castShadow
      >
        <boxGeometry args={[slopeLen, 0.06, b.d + 0.06]} />
        <meshLambertMaterial color="#3a4654" />
      </mesh>
      {/* right slope */}
      <mesh
        position={[b.w / 4, b.h + apexH / 2 + 0.02, 0]}
        rotation={[0, 0, -slopeAngle]}
        castShadow
      >
        <boxGeometry args={[slopeLen, 0.06, b.d + 0.06]} />
        <meshLambertMaterial color="#3a4654" />
      </mesh>
      {/* triangular gable end walls (front + back) — closes the void */}
      <mesh position={[0, b.h, b.d / 2 + 0.02]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([
              -b.w / 2, 0, 0,
              b.w / 2, 0, 0,
              0, apexH, 0
            ]), 3]}
          />
          <bufferAttribute attach="index" args={[new Uint16Array([0, 1, 2]), 1]} />
        </bufferGeometry>
        <meshLambertMaterial color={b.topHex} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, b.h, -b.d / 2 - 0.02]} rotation={[0, Math.PI, 0]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([
              -b.w / 2, 0, 0,
              b.w / 2, 0, 0,
              0, apexH, 0
            ]), 3]}
          />
          <bufferAttribute attach="index" args={[new Uint16Array([0, 1, 2]), 1]} />
        </bufferGeometry>
        <meshLambertMaterial color={b.topHex} side={THREE.DoubleSide} />
      </mesh>
      {/* cargo door on front facade — large dark rectangle with cyan emissive frame */}
      <mesh position={[0, b.h * 0.4, b.d / 2 + 0.02]}>
        <planeGeometry args={[b.w * 0.4, b.h * 0.7]} />
        <meshLambertMaterial color="#1c2638" />
      </mesh>
      {/* cyan door frame (thin emissive border via 4 strips) */}
      {[
        { p: [0, b.h * 0.4 + b.h * 0.35, b.d / 2 + 0.02], w: b.w * 0.4, h: 0.02 },
        { p: [0, b.h * 0.4 - b.h * 0.35, b.d / 2 + 0.02], w: b.w * 0.4, h: 0.02 },
        { p: [-b.w * 0.2, b.h * 0.4, b.d / 2 + 0.02],     w: 0.02,      h: b.h * 0.7 },
        { p: [b.w * 0.2, b.h * 0.4, b.d / 2 + 0.02],      w: 0.02,      h: b.h * 0.7 }
      ].map((s, i) => (
        <mesh key={`frame-${i}`} position={s.p as [number, number, number]}>
          <planeGeometry args={[s.w, s.h]} />
          <meshLambertMaterial color="#000" emissive={ACCENT_CYAN} emissiveIntensity={1.2} />
        </mesh>
      ))}
      {/* 2 vent pipes on roof apex */}
      {[-b.w * 0.18, b.w * 0.18].map((x, i) => (
        <mesh key={`vent-${i}`} position={[x, b.h + apexH + 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.06, 0.3, 8]} />
          <meshLambertMaterial color="#5a6878" />
        </mesh>
      ))}
    </>
  )
}
