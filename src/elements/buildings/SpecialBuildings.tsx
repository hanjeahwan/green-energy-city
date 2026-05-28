import * as THREE from 'three'
import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { tintedGeometry, flatGradMat } from '../../components/sceneMaterials'
import type { BuildingDef, ElementVariant } from '../types'
import { ACCENT_CYAN } from './catalog'
import { getPVPanelTexture, PV_BASE_COLOR } from '../shared/pvAsset'

interface SpecialBuildingFeatures {}

export const TOWNHOUSE_VARIANTS: Record<string, ElementVariant<SpecialBuildingFeatures>> = {
  classic: { id: 'classic', footprint: { halfW: 0.9, halfD: 0.45 } },
  modern: { id: 'modern', footprint: { halfW: 0.9, halfD: 0.45 } },
  industrial: { id: 'industrial', footprint: { halfW: 0.9, halfD: 0.45 } },
  green: { id: 'green', footprint: { halfW: 0.9, halfD: 0.45 } },
  compact: { id: 'compact', footprint: { halfW: 0.75, halfD: 0.42 } }
}

export const ENERGY_LAB_VARIANTS: Record<string, ElementVariant<SpecialBuildingFeatures>> = {
  classic: { id: 'classic', footprint: { halfW: 0.75, halfD: 0.55 } },
  modern: { id: 'modern', footprint: { halfW: 0.75, halfD: 0.55 } },
  industrial: { id: 'industrial', footprint: { halfW: 0.75, halfD: 0.55 } },
  green: { id: 'green', footprint: { halfW: 0.75, halfD: 0.55 } },
  compact: { id: 'compact', footprint: { halfW: 0.62, halfD: 0.48 } }
}

export const MICROGRID_CONTROL_VARIANTS: Record<string, ElementVariant<SpecialBuildingFeatures>> = {
  classic: { id: 'classic', footprint: { halfW: 0.5, halfD: 0.4 } },
  modern: { id: 'modern', footprint: { halfW: 0.5, halfD: 0.4 } },
  industrial: { id: 'industrial', footprint: { halfW: 0.5, halfD: 0.4 } },
  green: { id: 'green', footprint: { halfW: 0.5, halfD: 0.4 } },
  compact: { id: 'compact', footprint: { halfW: 0.42, halfD: 0.35 } }
}

export const PARKING_DECK_VARIANTS: Record<string, ElementVariant<SpecialBuildingFeatures>> = {
  classic: { id: 'classic', footprint: { halfW: 0.85, halfD: 0.5 } },
  modern: { id: 'modern', footprint: { halfW: 0.85, halfD: 0.5 } },
  industrial: { id: 'industrial', footprint: { halfW: 0.85, halfD: 0.5 } },
  green: { id: 'green', footprint: { halfW: 0.85, halfD: 0.5 } },
  compact: { id: 'compact', footprint: { halfW: 0.7, halfD: 0.45 } }
}

export const SERVICE_DEPOT_VARIANTS: Record<string, ElementVariant<SpecialBuildingFeatures>> = {
  classic: { id: 'classic', footprint: { halfW: 0.85, halfD: 0.5 } },
  modern: { id: 'modern', footprint: { halfW: 0.85, halfD: 0.5 } },
  industrial: { id: 'industrial', footprint: { halfW: 0.85, halfD: 0.5 } },
  green: { id: 'green', footprint: { halfW: 0.85, halfD: 0.5 } },
  compact: { id: 'compact', footprint: { halfW: 0.7, halfD: 0.42 } }
}

export const UTILITY_SHED_VARIANTS: Record<string, ElementVariant<SpecialBuildingFeatures>> = {
  classic: { id: 'classic', footprint: { halfW: 0.4, halfD: 0.35 } },
  modern: { id: 'modern', footprint: { halfW: 0.4, halfD: 0.35 } },
  industrial: { id: 'industrial', footprint: { halfW: 0.4, halfD: 0.35 } },
  green: { id: 'green', footprint: { halfW: 0.4, halfD: 0.35 } },
  compact: { id: 'compact', footprint: { halfW: 0.34, halfD: 0.3 } }
}

export const GREEN_APARTMENT_VARIANTS: Record<string, ElementVariant<SpecialBuildingFeatures>> = {
  classic: { id: 'classic', footprint: { halfW: 0.65, halfD: 0.65 } },
  modern: { id: 'modern', footprint: { halfW: 0.65, halfD: 0.65 } },
  industrial: { id: 'industrial', footprint: { halfW: 0.65, halfD: 0.65 } },
  green: { id: 'green', footprint: { halfW: 0.65, halfD: 0.65 } },
  compact: { id: 'compact', footprint: { halfW: 0.55, halfD: 0.55 } }
}

function BuildingFrame({ b, children }: { b: BuildingDef; children: ReactNode }) {
  // base outline rendered centrally by InstancedBuildingOutlines
  return (
    <group position={[b.pos[0], 0, b.pos[1]]} rotation={[0, b.rot, 0]}>
      {children}
      <SpecialShapeSignature b={b} />
    </group>
  )
}

function Shell({ b, roofColor = '#3a4654', instanced = false }: { b: BuildingDef; roofColor?: string; instanced?: boolean }) {
  const bodyGeom = useMemo(() => {
    if (instanced) return null
    const g = new THREE.BoxGeometry(b.w, b.h, b.d)
    g.translate(0, b.h / 2, 0)
    return tintedGeometry(g, b.topHex, 0.82)
  }, [b.w, b.h, b.d, b.topHex, instanced])
  const bodyMat = useMemo(() => (instanced ? null : flatGradMat({ roughness: 0.78 })), [instanced])
  // body + slab roof handled by <InstancedSimpleBoxBuildings> when
  // `instanced` is true. The per-caller `roofColor` accent (service-depot
  // dark slate etc.) collapses to the batch's shared #3a4a5e — accepted
  // trade for the draw-call save.
  if (instanced) {
    void roofColor
    return null
  }
  return (
    <>
      {bodyGeom && bodyMat && <mesh geometry={bodyGeom} material={bodyMat} castShadow receiveShadow />}
      <mesh position={[0, b.h + 0.025, 0]} castShadow>
        <boxGeometry args={[b.w + 0.04, 0.05, b.d + 0.04]} />
        <meshLambertMaterial color={roofColor} />
      </mesh>
    </>
  )
}

function RooftopPV({ b, width = 0.72, depth = 0.58 }: { b: BuildingDef; width?: number; depth?: number }) {
  if (!b.hasPV) return null
  return (
    <mesh position={[0, b.h + 0.09, 0]} rotation={[-Math.PI / 2 + 0.12, 0, 0]} castShadow>
      <boxGeometry args={[b.w * width, b.d * depth, 0.025]} />
      <meshLambertMaterial color={PV_BASE_COLOR} map={getPVPanelTexture()} />
    </mesh>
  )
}

export function Townhouse({ b }: { b: BuildingDef }) {
  const singleHome = b.shapeId === 'low-bungalow' || b.shapeId === 'low-courtyard-house' || b.shapeId === 'low-roof-garden-villa'
  const unitCount = singleHome ? 1 : b.variant === 'compact' ? 2 : 3
  const unitW = b.w / unitCount
  const roofRise = b.h * 0.25
  return (
    <BuildingFrame b={b}>
      {Array.from({ length: unitCount }).map((_, i) => {
        const x = -b.w / 2 + unitW * (i + 0.5)
        return (
          <group key={i} position={[x, 0, 0]}>
            <mesh position={[0, b.h / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[unitW - 0.04, b.h, b.d]} />
              <meshLambertMaterial color={i % 2 === 0 ? b.topHex : '#dfe8ef'} />
            </mesh>
            <mesh position={[0, b.h + roofRise / 2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
              <cylinderGeometry args={[0.0001, Math.hypot(unitW, b.d) / 2, roofRise, 4, 1]} />
              <meshLambertMaterial color="#3a4654" flatShading />
            </mesh>
            <mesh position={[0, b.h * 0.38, b.d / 2 + 0.02]}>
              <planeGeometry args={[unitW * 0.22, b.h * 0.58]} />
              <meshLambertMaterial color="#22354f" />
            </mesh>
            <mesh position={[unitW * 0.24, b.h * 0.58, b.d / 2 + 0.008]}>
              <planeGeometry args={[unitW * 0.24, b.h * 0.28]} />
              <meshLambertMaterial color="#143258" emissive={ACCENT_CYAN} emissiveIntensity={0.25} />
            </mesh>
          </group>
        )
      })}
      {b.variant === 'green' && (
        <mesh position={[-b.w * 0.42, b.h * 0.55, b.d / 2 + 0.01]}>
          <planeGeometry args={[b.w * 0.08, b.h * 0.86]} />
          <meshLambertMaterial color="#3a7a4a" />
        </mesh>
      )}
    </BuildingFrame>
  )
}

export function EnergyLab({ b }: { b: BuildingDef }) {
  return (
    <BuildingFrame b={b}>
      {/* Green variant used to get a #4d7c64 sage roof — removed in the
          rooftop-greening cleanup so the lab no longer reads as having a
          grass-coloured top. All variants share the default slate roof now. */}
      <Shell b={b} />
      <mesh position={[0, b.h * 0.55, b.d / 2 + 0.02]}>
        <planeGeometry args={[b.w * 0.82, b.h * 0.62]} />
        <meshLambertMaterial color="#142844" />
      </mesh>
      <mesh position={[b.w * 0.24, b.h + 0.22, -b.d * 0.18]} castShadow>
        <boxGeometry args={[b.w * 0.32, 0.34, b.d * 0.36]} />
        <meshLambertMaterial color="#dfe8ef" />
      </mesh>
      <mesh position={[b.w * 0.24, b.h + 0.42, -b.d * 0.18]}>
        <boxGeometry args={[b.w * 0.28, 0.04, b.d * 0.32]} />
        <meshLambertMaterial color="#3a7a4a" />
      </mesh>
      <RooftopPV b={b} width={0.48} depth={0.45} />
    </BuildingFrame>
  )
}

export function MicrogridControlRoom({ b, instanced = false }: { b: BuildingDef; instanced?: boolean }) {
  return (
    <BuildingFrame b={b}>
      <Shell b={b} instanced={instanced} />
      <mesh position={[0, b.h * 0.55, b.d / 2 + 0.02]}>
        <planeGeometry args={[b.w * 0.7, b.h * 0.34]} />
        <meshLambertMaterial color="#000" emissive={ACCENT_CYAN} emissiveIntensity={0.75} />
      </mesh>
      <mesh position={[-b.w * 0.25, b.h + 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.55, 6]} />
        <meshLambertMaterial color="#5a6878" />
      </mesh>
      <mesh position={[-b.w * 0.25, b.h + 0.6, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshLambertMaterial color="#000" emissive={ACCENT_CYAN} emissiveIntensity={2.0} />
      </mesh>
      <RooftopPV b={b} width={0.62} depth={0.5} />
    </BuildingFrame>
  )
}

export function ParkingDeck({ b }: { b: BuildingDef }) {
  const levels = b.variant === 'compact' ? 2 : 3
  return (
    <BuildingFrame b={b}>
      {Array.from({ length: levels }).map((_, i) => (
        <mesh key={i} position={[0, 0.18 + i * 0.38, 0]} castShadow receiveShadow>
          <boxGeometry args={[b.w, 0.08, b.d]} />
          <meshLambertMaterial color={i === levels - 1 ? '#dfe6ee' : '#9aa6b4'} />
        </mesh>
      ))}
      {[-0.42, 0.42].map((x, i) => (
        <mesh key={i} position={[b.w * x, b.h * 0.42, -b.d * 0.36]} castShadow>
          <boxGeometry args={[0.08, b.h * 0.84, 0.08]} />
          <meshLambertMaterial color="#5a6878" />
        </mesh>
      ))}
      <mesh position={[b.w * 0.18, 0.42, b.d * 0.2]} rotation={[0, 0, -0.22]} castShadow>
        <boxGeometry args={[b.w * 0.58, 0.05, b.d * 0.18]} />
        <meshLambertMaterial color="#c8d0db" />
      </mesh>
      {[-0.28, 0, 0.28].map((x, i) => (
        <mesh key={`car-${i}`} position={[b.w * x, b.h + 0.07, b.d * 0.16]} castShadow>
          <boxGeometry args={[0.22, 0.09, 0.38]} />
          <meshLambertMaterial color={i === 1 ? '#22354f' : '#eef2f7'} />
        </mesh>
      ))}
    </BuildingFrame>
  )
}

export function ServiceDepot({ b, instanced = false }: { b: BuildingDef; instanced?: boolean }) {
  return (
    <BuildingFrame b={b}>
      <Shell b={b} roofColor="#22354f" instanced={instanced} />
      {[-0.3, 0, 0.3].map((x, i) => (
        <mesh key={i} position={[b.w * x, b.h * 0.45, b.d / 2 + 0.02]}>
          <planeGeometry args={[b.w * 0.18, b.h * 0.62]} />
          <meshLambertMaterial color="#1c2638" />
        </mesh>
      ))}
      <mesh position={[0, b.h + 0.18, -b.d * 0.18]} castShadow>
        <boxGeometry args={[b.w * 0.65, 0.18, b.d * 0.24]} />
        <meshLambertMaterial color="#5a6878" />
      </mesh>
      <mesh position={[0, b.h * 0.68, b.d / 2 + 0.008]}>
        <planeGeometry args={[b.w * 0.78, 0.04]} />
        <meshLambertMaterial color="#000" emissive={ACCENT_CYAN} emissiveIntensity={0.85} />
      </mesh>
    </BuildingFrame>
  )
}

export function UtilityShed({ b, instanced = false }: { b: BuildingDef; instanced?: boolean }) {
  return (
    <BuildingFrame b={b}>
      <Shell b={b} roofColor={b.variant === 'industrial' ? '#22354f' : '#3a4654'} instanced={instanced} />
      <mesh position={[b.w * 0.22, b.h * 0.55, b.d / 2 + 0.02]}>
        <planeGeometry args={[b.w * 0.24, b.h * 0.38]} />
        <meshLambertMaterial color="#143258" emissive={ACCENT_CYAN} emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[-b.w * 0.24, b.h + 0.12, 0]} castShadow>
        <boxGeometry args={[b.w * 0.28, 0.14, b.d * 0.34]} />
        <meshLambertMaterial color="#8a96a6" />
      </mesh>
    </BuildingFrame>
  )
}

export function GreenApartment({ b }: { b: BuildingDef }) {
  const floors = Math.max(3, Math.floor(b.h / 0.62))
  return (
    <BuildingFrame b={b}>
      <Shell b={b} roofColor="#4d7c64" />
      {Array.from({ length: floors }).map((_, f) => {
        const y = ((f + 0.5) / floors) * b.h
        return (
          <group key={f}>
            <mesh position={[0, y, b.d / 2 + 0.08]} castShadow>
              <boxGeometry args={[b.w * 0.78, 0.045, 0.16]} />
              <meshLambertMaterial color="#dfe6ee" />
            </mesh>
            <mesh position={[-b.w * 0.34, y + 0.04, b.d / 2 + 0.17]}>
              <boxGeometry args={[b.w * 0.12, 0.08, 0.04]} />
              <meshLambertMaterial color="#3a7a4a" />
            </mesh>
          </group>
        )
      })}
      <mesh position={[b.w / 2 + 0.02, b.h * 0.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[b.d * 0.72, b.h * 0.84]} />
        <meshLambertMaterial color="#3a7a4a" />
      </mesh>
      <RooftopPV b={b} width={0.62} depth={0.52} />
    </BuildingFrame>
  )
}

function SpecialShapeSignature({ b }: { b: BuildingDef }) {
  switch (b.shapeId) {
    case 'low-bungalow':
      return (
        <>
          <mesh position={[0, b.h * 0.24, b.d / 2 + 0.13]} castShadow>
            <boxGeometry args={[b.w * 0.86, 0.07, 0.22]} />
            <meshLambertMaterial color="#e5ece8" />
          </mesh>
          <mesh position={[0, b.h + 0.08, 0]} scale={[1.08, 1, 1.08]} castShadow>
            <boxGeometry args={[b.w, 0.05, b.d]} />
            <meshLambertMaterial color="#506472" />
          </mesh>
        </>
      )
    case 'low-courtyard-house':
      return (
        <>
          <mesh position={[b.w * 0.34, b.h * 0.34, -b.d * 0.24]} castShadow receiveShadow>
            <boxGeometry args={[b.w * 0.24, b.h * 0.68, b.d * 0.52]} />
            <meshLambertMaterial color="#dbe8df" />
          </mesh>
          <mesh position={[-b.w * 0.12, 0.035, b.d * 0.34]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[b.w * 0.48, b.d * 0.28]} />
            <meshLambertMaterial color="#c7d9c8" />
          </mesh>
        </>
      )
    case 'low-roof-garden-villa':
      // Rooftop garden geometry removed (user request 2026-05-25): the green
      // grass patch + shrub planters made the building's top read as a
      // uniform green slab. Falls through to no shape-specific decoration.
      return null
    case 'mid-standard-block':
      return (
        <mesh position={[0, 0.24, b.d / 2 + 0.08]} castShadow>
          <boxGeometry args={[b.w * 0.52, 0.22, 0.16]} />
          <meshLambertMaterial color="#e5ece8" />
        </mesh>
      )
    case 'mid-student-apartment':
      return (
        <>
          <mesh position={[0, b.h * 0.52, b.d / 2 + 0.12]} castShadow>
            <boxGeometry args={[b.w * 0.86, 0.06, 0.18]} />
            <meshLambertMaterial color="#9aa6b4" />
          </mesh>
          {[-0.36, -0.18, 0, 0.18, 0.36].map((x, i) => (
            <mesh key={i} position={[b.w * x, b.h * 0.72, b.d / 2 + 0.02]}>
              <planeGeometry args={[0.08, 0.08]} />
              <meshLambertMaterial color="#143258" emissive={ACCENT_CYAN} emissiveIntensity={0.28} />
            </mesh>
          ))}
        </>
      )
    case 'mid-old-estate-slab':
      return (
        <>
          <mesh position={[0, b.h * 0.5, b.d / 2 + 0.12]} castShadow>
            <boxGeometry args={[b.w * 0.96, 0.04, 0.2]} />
            <meshLambertMaterial color="#9aa6b4" />
          </mesh>
          <mesh position={[b.w / 2 + 0.045, b.h * 0.48, -b.d / 2 - 0.025]} castShadow>
            <cylinderGeometry args={[0.025, 0.025, b.h * 0.86, 8]} />
            <meshLambertMaterial color="#5a6878" />
          </mesh>
        </>
      )
    case 'mid-courtyard-apartment':
      return (
        <>
          <mesh position={[b.w * 0.36, b.h * 0.42, -b.d * 0.18]} castShadow receiveShadow>
            <boxGeometry args={[b.w * 0.28, b.h * 0.84, b.d * 0.58]} />
            <meshLambertMaterial color="#dbe8df" />
          </mesh>
          <mesh position={[-b.w * 0.16, 0.04, b.d * 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[b.w * 0.44, b.d * 0.28]} />
            <meshLambertMaterial color="#c7d9c8" />
          </mesh>
        </>
      )
    case 'mid-roof-garden-block':
      // Was a sage grass patch + green shrubs. Replaced with a plain
      // concrete roof terrace + parapet so the shape stays distinguishable
      // from mid-standard-block (showroom contract requires ≥ 5 distinct
      // mid-rise shapes) without re-introducing rooftop green.
      return (
        <>
          <mesh position={[0, b.h + 0.06, 0]} castShadow>
            <boxGeometry args={[b.w * 0.78, 0.045, b.d * 0.68]} />
            <meshLambertMaterial color="#c8cdd2" />
          </mesh>
          {/* low parapet ring */}
          <mesh position={[0, b.h + 0.13, b.d * 0.34]}>
            <boxGeometry args={[b.w * 0.78, 0.1, 0.04]} />
            <meshLambertMaterial color="#9fa6ad" />
          </mesh>
          <mesh position={[0, b.h + 0.13, -b.d * 0.34]}>
            <boxGeometry args={[b.w * 0.78, 0.1, 0.04]} />
            <meshLambertMaterial color="#9fa6ad" />
          </mesh>
        </>
      )
    case 'support-guard-booth':
      return (
        <>
          <mesh position={[0, b.h * 0.58, b.d / 2 + 0.08]}>
            <planeGeometry args={[b.w * 0.6, b.h * 0.34]} />
            <meshLambertMaterial color="#143258" emissive={ACCENT_CYAN} emissiveIntensity={0.28} />
          </mesh>
          <mesh position={[0, b.h + 0.09, b.d * 0.14]} castShadow>
            <boxGeometry args={[b.w * 0.88, 0.06, b.d * 0.42]} />
            <meshLambertMaterial color="#506472" />
          </mesh>
        </>
      )
    case 'support-garage-entry':
      return (
        <>
          <mesh position={[0, 0.06, b.d / 2 + 0.12]} rotation={[-0.22, 0, 0]} castShadow>
            <boxGeometry args={[b.w * 0.76, 0.05, b.d * 0.5]} />
            <meshLambertMaterial color="#7d8994" />
          </mesh>
          <mesh position={[0, 0.42, b.d / 2 + 0.05]}>
            <boxGeometry args={[b.w * 0.7, 0.08, 0.08]} />
            <meshLambertMaterial color="#253241" />
          </mesh>
        </>
      )
    case 'support-community-center':
      return (
        <>
          <mesh position={[0, b.h * 0.52, b.d / 2 + 0.01]}>
            <planeGeometry args={[b.w * 0.74, b.h * 0.58]} />
            <meshLambertMaterial color="#dce5ec" transparent opacity={0.82} />
          </mesh>
          <mesh position={[0, 0.22, b.d / 2 + 0.16]} castShadow>
            <boxGeometry args={[b.w * 0.84, 0.07, 0.26]} />
            <meshLambertMaterial color="#e5ece8" />
          </mesh>
        </>
      )
    case 'support-energy-service-station':
      return (
        <>
          <mesh position={[0, 0.34, b.d / 2 + 0.16]} castShadow>
            <boxGeometry args={[b.w * 0.86, 0.08, 0.28]} />
            <meshLambertMaterial color="#506472" />
          </mesh>
          <mesh position={[b.w * 0.28, b.h * 0.62, b.d / 2 + 0.012]}>
            <planeGeometry args={[b.w * 0.28, b.h * 0.24]} />
            <meshLambertMaterial color="#000" emissive={ACCENT_CYAN} emissiveIntensity={0.72} />
          </mesh>
        </>
      )
    case 'support-management-kiosk':
      return (
        <>
          <mesh position={[0, b.h * 0.62, b.d / 2 + 0.01]}>
            <planeGeometry args={[b.w * 0.52, b.h * 0.3]} />
            <meshLambertMaterial color="#000" emissive={ACCENT_CYAN} emissiveIntensity={0.62} />
          </mesh>
          <mesh position={[-b.w * 0.32, b.h + 0.32, 0]} castShadow>
            <cylinderGeometry args={[0.018, 0.018, 0.5, 6]} />
            <meshLambertMaterial color="#506472" />
          </mesh>
          <mesh position={[-b.w * 0.32, b.h + 0.6, 0]}>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshLambertMaterial color="#000" emissive={ACCENT_CYAN} emissiveIntensity={1.8} />
          </mesh>
        </>
      )
    case 'logistics-depot':
      return (
        <>
          {[-0.3, 0, 0.3].map((x, i) => (
            <mesh key={i} position={[b.w * x, b.h * 0.42, b.d / 2 + 0.01]}>
              <planeGeometry args={[b.w * 0.18, b.h * 0.45]} />
              <meshLambertMaterial color="#111d2e" />
            </mesh>
          ))}
          <mesh position={[0, b.h * 0.74, b.d / 2 + 0.016]}>
            <planeGeometry args={[b.w * 0.82, 0.04]} />
            <meshLambertMaterial color="#000" emissive={ACCENT_CYAN} emissiveIntensity={0.52} />
          </mesh>
        </>
      )
    default:
      return null
  }
}
