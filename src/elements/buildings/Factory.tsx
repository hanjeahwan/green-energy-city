import type { BuildingDef, ElementVariant } from '../types'
import { ACCENT_CYAN } from './catalog'

// =============================================================================
// Factory variants
//   classic    — green hydrogen plant: 3 cylindrical H2 tanks + domes + pipes + cyan H2 logo
//   modern     — modular pods: 4 rectangular modules (2×2 grid) + top walkway + corner stair
//   industrial — heavy plant: 1 tall hyperboloid cooling tower + steel walkway + smokestack
// Shared: base outline, low concrete platform, safety bollards at corners.
// =============================================================================

interface FactoryFeatures {}

export const FACTORY_VARIANTS: Record<string, ElementVariant<FactoryFeatures>> = {
  classic:    { id: 'classic',    footprint: { halfW: 0.8, halfD: 0.9 } },
  modern:     { id: 'modern',     footprint: { halfW: 0.8, halfD: 0.9 } },
  industrial: { id: 'industrial', footprint: { halfW: 0.8, halfD: 0.9 } }
}

export function Factory({ b }: { b: BuildingDef }) {
  const isModern = b.variant === 'modern'
  const isIndustrial = b.variant === 'industrial'
  return (
    <group position={[b.pos[0], 0, b.pos[1]]} rotation={[0, b.rot, 0]}>
      {/* base outline rendered centrally by InstancedBuildingOutlines */}
      {/* low concrete platform (shared) */}
      <mesh position={[0, 0.075, 0]} castShadow receiveShadow>
        <boxGeometry args={[b.w, 0.15, b.d]} />
        <meshLambertMaterial color="#3a4a5e" />
      </mesh>

      {isIndustrial
        ? <IndustrialCoolingTower b={b} />
        : isModern
        ? <ModernPods b={b} />
        : <ClassicH2Tanks b={b} />}

      {/* safety bollards at corners (shared) */}
      {[
        [-b.w / 2 + 0.1, -b.d / 2 + 0.1],
        [b.w / 2 - 0.1, -b.d / 2 + 0.1],
        [-b.w / 2 + 0.1, b.d / 2 - 0.1],
        [b.w / 2 - 0.1, b.d / 2 - 0.1]
      ].map(([x, z], i) => (
        <mesh key={`boll-${i}`} position={[x, 0.18, z]}>
          <cylinderGeometry args={[0.04, 0.04, 0.22, 6]} />
          <meshLambertMaterial color="#5dd4e8" emissive={ACCENT_CYAN} emissiveIntensity={0.5} />
        </mesh>
      ))}
    </group>
  )
}

// -----------------------------------------------------------------------------
// Classic: 3 cylindrical H2 tanks with hemispherical domes + connecting pipes + H2 logo
// -----------------------------------------------------------------------------
function ClassicH2Tanks({ b }: { b: BuildingDef }) {
  const radius = Math.min(b.w, b.d) * 0.22
  const tankH = b.h * 0.85
  const tanks: Array<{ p: [number, number, number] }> = [
    { p: [-b.w * 0.3, tankH / 2 + 0.15, 0] },
    { p: [0, tankH / 2 + 0.15, -b.d * 0.18] },
    { p: [b.w * 0.3, tankH / 2 + 0.15, 0] }
  ]
  return (
    <>
      {tanks.map((t, i) => (
        <group key={i} position={t.p}>
          <mesh castShadow>
            <cylinderGeometry args={[radius, radius, tankH, 24]} />
            <meshLambertMaterial color="#eef2f7" />
          </mesh>
          <mesh position={[0, tankH / 2, 0]} castShadow>
            <sphereGeometry args={[radius, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshLambertMaterial color="#eef2f7" />
          </mesh>
          <mesh position={[0, -tankH / 2 + 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[radius + 0.005, 0.01, 6, 24]} />
            <meshLambertMaterial color="#3a4a5e" />
          </mesh>
        </group>
      ))}
      {/* H2 emissive logo */}
      <mesh position={[0, tankH * 0.6 + 0.15, -b.d * 0.18 + radius + 0.005]}>
        <planeGeometry args={[0.3, 0.18]} />
        <meshLambertMaterial color="#000" emissive={ACCENT_CYAN} emissiveIntensity={1.2} />
      </mesh>
      {/* connecting pipes */}
      {[0.4, tankH * 0.6].map((y, i) => (
        <mesh key={`pipe-${i}`} position={[0, y, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, b.w * 0.7, 8]} />
          <meshLambertMaterial color="#c8d0db" />
        </mesh>
      ))}
    </>
  )
}

// -----------------------------------------------------------------------------
// Industrial: 1 tall hyperboloid cooling tower (waisted cylinder via two cones
// stacked) + low slate boiler box + tall thin smokestack with cyan beacon.
// "Industrial cool palette" — concrete grey + slate, no warm rust tones.
// -----------------------------------------------------------------------------
function IndustrialCoolingTower({ b }: { b: BuildingDef }) {
  const towerH = b.h * 1.4
  const towerRBottom = Math.min(b.w, b.d) * 0.32
  const towerRWaist = towerRBottom * 0.7
  const towerRTop = towerRBottom * 0.85
  const towerX = -b.w * 0.22
  const towerZ = -b.d * 0.1
  return (
    <>
      {/* low boiler / utility box covering the front-right area */}
      <mesh position={[b.w * 0.2, b.h * 0.55 + 0.15, b.d * 0.1]} castShadow>
        <boxGeometry args={[b.w * 0.55, b.h * 0.95, b.d * 0.6]} />
        <meshLambertMaterial color="#3a4654" />
      </mesh>
      {/* utility box top hatch / vent */}
      <mesh position={[b.w * 0.2, b.h + 0.18, b.d * 0.1]}>
        <boxGeometry args={[b.w * 0.5, 0.04, b.d * 0.55]} />
        <meshLambertMaterial color="#22354f" />
      </mesh>
      {/* cyan utility logo on box front */}
      <mesh position={[b.w * 0.2, b.h * 0.55 + 0.15, b.d * 0.1 + b.d * 0.3 + 0.003]}>
        <planeGeometry args={[b.w * 0.18, b.h * 0.18]} />
        <meshLambertMaterial color="#000" emissive={ACCENT_CYAN} emissiveIntensity={1.0} />
      </mesh>

      {/* cooling tower bottom half — cone narrowing upward to waist */}
      <mesh position={[towerX, 0.15 + towerH * 0.3, towerZ]} castShadow>
        <cylinderGeometry args={[towerRWaist, towerRBottom, towerH * 0.6, 18]} />
        <meshLambertMaterial color="#c8d0db" />
      </mesh>
      {/* cooling tower top half — cone widening from waist to rim */}
      <mesh position={[towerX, 0.15 + towerH * 0.8, towerZ]} castShadow>
        <cylinderGeometry args={[towerRTop, towerRWaist, towerH * 0.4, 18]} />
        <meshLambertMaterial color="#c8d0db" />
      </mesh>
      {/* dark rim around the open top */}
      <mesh position={[towerX, 0.15 + towerH + 0.01, towerZ]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[towerRTop, 0.025, 6, 18]} />
        <meshLambertMaterial color="#3a4654" />
      </mesh>
      {/* dark "hollow" disc inside the rim — implies the open shaft */}
      <mesh position={[towerX, 0.15 + towerH, towerZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[towerRTop * 0.92, 18]} />
        <meshLambertMaterial color="#1a2230" />
      </mesh>

      {/* thin smokestack at back-left corner */}
      <mesh position={[-b.w * 0.42, b.h * 1.2, -b.d * 0.42]} castShadow>
        <cylinderGeometry args={[0.06, 0.07, b.h * 2.2, 10]} />
        <meshLambertMaterial color="#5a6878" />
      </mesh>
      {/* dark band near top of smokestack */}
      <mesh position={[-b.w * 0.42, b.h * 2.0, -b.d * 0.42]}>
        <cylinderGeometry args={[0.065, 0.065, 0.08, 10]} />
        <meshLambertMaterial color="#22354f" />
      </mesh>
      {/* cyan aviation beacon on smokestack tip */}
      <mesh position={[-b.w * 0.42, b.h * 2.32, -b.d * 0.42]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshLambertMaterial color="#000" emissive={ACCENT_CYAN} emissiveIntensity={2.5} />
      </mesh>

      {/* steel walkway between tower and utility box at mid-height */}
      <mesh position={[-b.w * 0.02, b.h * 0.85, 0]} castShadow>
        <boxGeometry args={[b.w * 0.35, 0.04, 0.14]} />
        <meshLambertMaterial color="#5a6878" />
      </mesh>
      {/* walkway railing top */}
      <mesh position={[-b.w * 0.02, b.h * 0.85 + 0.13, 0.075]}>
        <boxGeometry args={[b.w * 0.35, 0.018, 0.018]} />
        <meshLambertMaterial color="#3a4654" />
      </mesh>
    </>
  )
}

// -----------------------------------------------------------------------------
// Modern: 4 rectangular modules (2×2 grid) + top walkway connecting them + corner staircase
// -----------------------------------------------------------------------------
function ModernPods({ b }: { b: BuildingDef }) {
  const podH = b.h * 0.85
  const podW = b.w * 0.38
  const podD = b.d * 0.36
  const offsets: Array<[number, number]> = [
    [-b.w * 0.22, -b.d * 0.2],
    [b.w * 0.22, -b.d * 0.2],
    [-b.w * 0.22, b.d * 0.2],
    [b.w * 0.22, b.d * 0.2]
  ]
  return (
    <>
      {offsets.map(([x, z], i) => (
        <group key={i} position={[x, podH / 2 + 0.15, z]}>
          {/* pod body */}
          <mesh castShadow>
            <boxGeometry args={[podW, podH, podD]} />
            <meshLambertMaterial color="#eef2f7" />
          </mesh>
          {/* pod top trim */}
          <mesh position={[0, podH / 2 + 0.015, 0]}>
            <boxGeometry args={[podW + 0.02, 0.03, podD + 0.02]} />
            <meshLambertMaterial color="#3a4a5e" />
          </mesh>
          {/* side accent: 2 vertical cyan strips */}
          {[-podW * 0.3, podW * 0.3].map((sx, j) => (
            <mesh key={`acc-${j}`} position={[sx, 0, podD / 2 + 0.02]}>
              <planeGeometry args={[0.03, podH * 0.7]} />
              <meshLambertMaterial color="#000" emissive={ACCENT_CYAN} emissiveIntensity={1.0} />
            </mesh>
          ))}
        </group>
      ))}
      {/* connecting walkway between all 4 pods (cross shape on top) */}
      <mesh position={[0, podH + 0.18, 0]} castShadow>
        <boxGeometry args={[b.w * 0.7, 0.05, 0.15]} />
        <meshLambertMaterial color="#5a6878" />
      </mesh>
      <mesh position={[0, podH + 0.18, 0]} castShadow>
        <boxGeometry args={[0.15, 0.05, b.d * 0.65]} />
        <meshLambertMaterial color="#5a6878" />
      </mesh>
      {/* corner staircase — diagonal strip with steps suggestion */}
      <mesh
        position={[b.w * 0.42, podH * 0.5 + 0.15, b.d * 0.42]}
        rotation={[0, Math.PI / 4, 0]}
      >
        <boxGeometry args={[0.08, podH, 0.16]} />
        <meshLambertMaterial color="#5a6878" />
      </mesh>
      {/* central H2 emissive plate on walkway */}
      <mesh position={[0, podH + 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.25, 0.16]} />
        <meshLambertMaterial color="#000" emissive={ACCENT_CYAN} emissiveIntensity={1.4} />
      </mesh>
    </>
  )
}
