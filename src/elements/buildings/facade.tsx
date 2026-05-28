import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { ACCENT_CYAN } from './catalog'

// =============================================================================
// Facade primitives library (M1).
//
// Reusable JSX components that render common building-facade decorations.
// Each component is rendered INSIDE a building's <group> (which carries the
// building's world position + rot), so all its coordinates are LOCAL to that
// building. It takes geometry hints (w, d, h derived from BuildingDef) plus
// style parameters with sensible defaults.
//
// Before M1 these patterns lived as ~30 LOC of inline mesh-spam inside each
// of the 6 building renderers, duplicated across 3 variants per type ≈ 18
// hand-tuned copies. The library lets a variant compose facade detail by
// rendering 3-5 small JSX components instead.
//
// Pure render. Zero state. No useFrame. Geometry+material are memoised so
// rerendering the same building doesn't recreate GPU resources.
// =============================================================================

// -----------------------------------------------------------------------------
// FacadeWindows — instanced window panes on N facades.
//
// Used by Office classic (the only existing instanced-windows pattern). API
// stays flexible so other variants can opt in by switching from per-mesh
// window planes to instanced rectangles.
// -----------------------------------------------------------------------------

interface FacadeWindowsProps {
  w: number; d: number; h: number
  /** Columns of windows per facade. Default 3. */
  cols?: number
  /** Rows = floor(h * rowsPerMeter). Default 1.4. */
  rowsPerMeter?: number
  /** Window pane color. Default dark navy glass. */
  color?: string
  /** Y of bottom window row centre. Default 0.45 (above ground floor). */
  bottomY?: number
  /** Fraction of `h` the window grid occupies vertically. Default 0.7. */
  heightFraction?: number
}

export function FacadeWindows({
  w, d, h,
  cols = 3,
  rowsPerMeter = 1.4,
  color = '#2c4868',
  bottomY = 0.45,
  heightFraction = 0.7
}: FacadeWindowsProps) {
  const ref = useRef<THREE.InstancedMesh>(null!)
  const rows = useMemo(() => Math.max(1, Math.floor(h * rowsPerMeter)), [h, rowsPerMeter])
  const count = h < 1.0 ? 0 : cols * rows * 4

  useEffect(() => {
    if (!ref.current || count === 0) return
    const dummy = new THREE.Object3D()
    let idx = 0
    const facades = [
      { rotY: 0,            nx: 0,            nz: d / 2 + 0.02, ux: 1,  uz: 0 },
      { rotY: Math.PI,      nx: 0,            nz: -d / 2 - 0.02, ux: -1, uz: 0 },
      { rotY: Math.PI / 2,  nx: w / 2 + 0.02, nz: 0,            ux: 0,  uz: -1 },
      { rotY: -Math.PI / 2, nx: -w / 2 - 0.02, nz: 0,            ux: 0,  uz: 1 }
    ]
    for (const f of facades) {
      const isLong = f.rotY === 0 || f.rotY === Math.PI
      const span = isLong ? w : d
      const cellW = (span * 0.78) / cols
      const cellH = (h * heightFraction) / rows
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const localX = (col - (cols - 1) / 2) * (cellW + 0.04)
          const localY = bottomY + row * (cellH + 0.06)
          const wx = f.nx + f.ux * localX
          const wz = f.nz + f.uz * localX
          dummy.position.set(wx, localY, wz)
          dummy.rotation.set(0, f.rotY, 0)
          dummy.scale.set(cellW, cellH, 0.04)
          dummy.updateMatrix()
          ref.current.setMatrixAt(idx++, dummy.matrix)
        }
      }
    }
    ref.current.instanceMatrix.needsUpdate = true
  }, [w, d, h, cols, rows, bottomY, heightFraction, count])

  if (count === 0) return null
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} castShadow={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshLambertMaterial color={color} />
    </instancedMesh>
  )
}

// -----------------------------------------------------------------------------
// FacadeCornices — horizontal slabs between floors, wrapping all 4 facades.
//
// One thin slab per row, slightly wider than the body so it reads as a slim
// architectural ledge from any angle. Used by Office classic (C7) and ports
// well to other variants that want a "designed" floor line reading.
// -----------------------------------------------------------------------------

interface FacadeCornicesProps {
  w: number; d: number; h: number
  /** Vertical spacing between cornices. Default 1.0m. */
  spacing?: number
  /** Y of bottom cornice. Default 0.6 (above ground floor). */
  startY?: number
  /** Slab thickness. Default 0.025m. */
  thickness?: number
  /** Slab outset beyond body (each side). Default 0.02m. */
  outset?: number
  /** Slab color. Default light slate. */
  color?: string
}

export function FacadeCornices({
  w, d, h,
  spacing = 1.0,
  startY = 0.6,
  thickness = 0.025,
  outset = 0.02,
  color = '#cfd6e0'
}: FacadeCornicesProps) {
  const cornices = useMemo(() => {
    if (h < 1.2) return [] as number[]
    const out: number[] = []
    for (let y = startY; y < h - 0.2; y += spacing) out.push(y)
    return out
  }, [w, d, h, spacing, startY])
  return (
    <>
      {cornices.map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <boxGeometry args={[w + outset * 2, thickness, d + outset * 2]} />
          <meshLambertMaterial color={color} />
        </mesh>
      ))}
    </>
  )
}

// -----------------------------------------------------------------------------
// FacadeMullions — thin frame strips on a single facade, horizontal or vertical.
//
// Generates `count` evenly-spaced strips on the named facade (front/back/left/
// right). Used for glass-curtain divisions (Apartment modern vertical) and
// floor-band mullions (Skyscraper modern horizontal).
// -----------------------------------------------------------------------------

interface FacadeMullionsProps {
  w: number; d: number; h: number
  direction: 'horizontal' | 'vertical'
  /** Number of strips. */
  count: number
  /** Which facades to apply to. Default ['front','back'] (the camera-visible). */
  facades?: ('front' | 'back' | 'left' | 'right')[]
  /** Strip cross-section. Default 0.025m. */
  thickness?: number
  /** Strip color. Default mid steel. */
  color?: string
  /** Strip metalness. Default 0.4 (slightly reflective). */
  metalness?: number
  /** Vertical span of the strips as a fraction of h. Default 0.88. */
  heightFraction?: number
  /** Horizontal span as a fraction of facade width. Default 0.94. */
  widthFraction?: number
  /** Y centre (vertical-direction strips). Default h/2. */
  centerY?: number
}

export function FacadeMullions({
  w, d, h,
  direction,
  count,
  facades = ['front', 'back'],
  thickness = 0.025,
  color = '#5a6878',
  metalness = 0.4,
  heightFraction = 0.88,
  widthFraction = 0.94,
  centerY
}: FacadeMullionsProps) {
  const yc = centerY ?? h / 2

  const facadeData: Record<string, { pos: [number, number, number]; rotY: number; w: number }> = {
    front: { pos: [0, yc, d / 2 + 0.012], rotY: 0, w },
    back:  { pos: [0, yc, -d / 2 - 0.012], rotY: Math.PI, w },
    left:  { pos: [w / 2 + 0.012, yc, 0],  rotY: Math.PI / 2, w: d },
    right: { pos: [-w / 2 - 0.012, yc, 0], rotY: -Math.PI / 2, w: d }
  }

  return (
    <>
      {facades.flatMap((side) => {
        const f = facadeData[side]
        return Array.from({ length: count }).map((_, i) => {
          if (direction === 'vertical') {
            // Strip position is computed in the facade's LOCAL space then
            // rotated/translated into world space by the wrapper group.
            const xLocal = (-f.w / 2) + (f.w / Math.max(1, count - 1)) * i
            const len = h * heightFraction
            return (
              <group
                key={`${side}-${i}`}
                position={f.pos}
                rotation={[0, f.rotY, 0]}
              >
                <mesh position={[xLocal, 0, 0]}>
                  <boxGeometry args={[thickness, len, thickness]} />
                  <meshLambertMaterial color={color} />
                </mesh>
              </group>
            )
          } else {
            // horizontal — y position is computed independently of facade rot
            const y = 0.4 + (i + 1) * (h - 0.6) / (count + 1)
            return (
              <mesh
                key={`${side}-${i}`}
                position={[f.pos[0], y, f.pos[2]]}
                rotation={[0, f.rotY, 0]}
              >
                <planeGeometry args={[f.w * widthFraction, thickness * 1.6]} />
                <meshLambertMaterial color={color} />
              </mesh>
            )
          }
        })
      })}
    </>
  )
}

// -----------------------------------------------------------------------------
// FacadeGlassCurtain — slightly-larger dark glass envelope around the body.
//
// Used by Office modern and Apartment modern. Renders as a transparent box
// just outside the body. Cheap one-mesh effect — the real glass-curtain look
// comes from combining this with FacadeMullions.
// -----------------------------------------------------------------------------

interface FacadeGlassCurtainProps {
  w: number; d: number; h: number
  color?: string
  opacity?: number
  metalness?: number
  /** Vertical span fraction. Default 0.94. */
  heightFraction?: number
}

export function FacadeGlassCurtain({
  w, d, h,
  // Default was #1a2c44 at 0.88 opacity — that wrapped every modern-variant
  // tower in a near-black skin and made the body topHex invisible. New
  // default is a mid blue-gray glass at lower opacity so the body shows
  // through. Callers can still pass darker colours for hero buildings
  // that genuinely want tinted glass.
  color = '#8a9eb0',
  opacity = 0.55,
  metalness = 0.5,
  heightFraction = 0.94
}: FacadeGlassCurtainProps) {
  return (
    <mesh position={[0, h / 2, 0]}>
      <boxGeometry args={[w + 0.01, h * heightFraction, d + 0.01]} />
      <meshLambertMaterial color={color} transparent opacity={opacity} />
    </mesh>
  )
}

// -----------------------------------------------------------------------------
// FacadeEmissiveBands — cyan emissive horizontal strips wrapping the body.
//
// Used by Warehouse classic (12 bands across 4 facades) and assorted "smart
// grid" highlights. count + spacing computed from `h * density`.
// -----------------------------------------------------------------------------

interface FacadeEmissiveBandsProps {
  w: number; d: number; h: number
  /** Bands per metre of height. Default 0.6 → ~6 bands on a 10m tower.
   *  Ignored when `bandRatios` or `count` is supplied. */
  density?: number
  /** Explicit number of bands. Overrides `density` when set. */
  count?: number
  /** Custom Y ratios (0..1 of h) for band placement. Overrides count+density.
   *  Use this when the bands need to land at exact heights like Warehouse
   *  classic's [0.3, 0.55, 0.8]. */
  bandRatios?: number[]
  /** Band emissive color. Default ACCENT_CYAN. */
  color?: string
  /** Emissive intensity. Default 1.2. */
  intensity?: number
  /** Apply to which facades. Default all 4. */
  facades?: ('front' | 'back' | 'left' | 'right')[]
  /** Band thickness (vertical). Default 0.03. */
  thickness?: number
}

export function FacadeEmissiveBands({
  w, d, h,
  density = 0.6,
  count,
  bandRatios,
  color = ACCENT_CYAN,
  intensity = 1.2,
  facades = ['front', 'back', 'left', 'right'],
  thickness = 0.03
}: FacadeEmissiveBandsProps) {
  // Resolve band Y positions in priority: explicit bandRatios → count → density.
  const ratios = useMemo(() => {
    if (bandRatios) return bandRatios
    const n = count ?? Math.max(1, Math.floor(h * density))
    return Array.from({ length: n }).map((_, i) => (i + 1) / (n + 1))
  }, [bandRatios, count, density, h])
  const bandCount = ratios.length
  const facadeData = {
    front: { rot: 0,            x: 0,             z: d / 2 + 0.02, span: w },
    back:  { rot: Math.PI,      x: 0,             z: -d / 2 - 0.02, span: w },
    left:  { rot: Math.PI / 2,  x: w / 2 + 0.02, z: 0,              span: d },
    right: { rot: -Math.PI / 2, x: -w / 2 - 0.02, z: 0,              span: d }
  } as const

  return (
    <>
      {facades.flatMap((side) => {
        const f = facadeData[side]
        return Array.from({ length: bandCount }).map((_, i) => {
          const yr = ratios[i]
          const y = h * yr
          return (
            <mesh
              key={`${side}-${i}`}
              position={[f.x, y, f.z]}
              rotation={[0, f.rot, 0]}
            >
              <planeGeometry args={[f.span * 0.92, thickness]} />
              <meshLambertMaterial color="#000" emissive={color} emissiveIntensity={intensity} />
            </mesh>
          )
        })
      })}
    </>
  )
}

// -----------------------------------------------------------------------------
// FacadeCornerAccents — 4 vertical emissive strips at the body corners.
//
// Used by Skyscraper modern (C7 splits each into 3 segments). API supports
// either single full-height strip or N-segment split via `segments`.
// -----------------------------------------------------------------------------

interface FacadeCornerAccentsProps {
  w: number; d: number; h: number
  /** Corner offset as a fraction of half-width. Default 0.86 (slightly inset). */
  offsetFrac?: number
  /** Strip cross-section. Default 0.04. */
  thickness?: number
  /** Number of segments per corner. 1 = single full-height strip; 3 = deco "broken line". */
  segments?: number
  /** Gap between segments as a fraction of h. Default 0.05 (5%). */
  gapFrac?: number
  /** Emissive color. Default ACCENT_CYAN. */
  color?: string
  /** Emissive intensity. Default 1.0 (multiplied for top segment when segments>1). */
  intensity?: number
}

export function FacadeCornerAccents({
  w, d, h,
  offsetFrac = 0.86,
  thickness = 0.04,
  segments = 1,
  gapFrac = 0.05,
  color = ACCENT_CYAN,
  intensity = 1.0
}: FacadeCornerAccentsProps) {
  const cornerOffsetX = (w / 2) * offsetFrac
  const cornerOffsetZ = (d / 2) * offsetFrac
  const corners: [number, number][] = [
    [cornerOffsetX, cornerOffsetZ],
    [-cornerOffsetX, cornerOffsetZ],
    [cornerOffsetX, -cornerOffsetZ],
    [-cornerOffsetX, -cornerOffsetZ]
  ]
  // Compute segment y-centres and lengths.
  const segLen = (h * (1 - gapFrac * (segments - 1))) / segments
  const segs = Array.from({ length: segments }).map((_, i) => {
    const yc = segLen / 2 + i * (segLen + h * gapFrac)
    // Brighter at top segment for visual lift.
    const intensityMul = 1 + i * 0.15
    return { yc, len: segLen, intensity: intensity * intensityMul }
  })
  return (
    <>
      {corners.map(([x, z], ci) =>
        segs.map((s, si) => (
          <mesh key={`${ci}-${si}`} position={[x, s.yc, z]}>
            <boxGeometry args={[thickness, s.len, thickness]} />
            <meshLambertMaterial color="#000" emissive={color} emissiveIntensity={s.intensity} />
          </mesh>
        ))
      )}
    </>
  )
}

// -----------------------------------------------------------------------------
// FacadeBalconies — segmented balcony bays on a chosen facade.
//
// Used by Apartment modern. Each row has `bayCount` slim bay segments
// (concrete floor + glass railing + steel top rail).
// -----------------------------------------------------------------------------

interface FacadeBalconiesProps {
  w: number; d: number; h: number
  /** Y of each balcony row (computed by caller from floors). */
  rows: number[]
  /** Bays per row. Default 3. */
  bayCount?: number
  /** Which facade. Default 'front'. */
  facade?: 'front' | 'back' | 'left' | 'right'
  /** Glass tint colour. Default cyan. */
  glassColor?: string
  /** Glass opacity. Default 0.35. */
  glassOpacity?: number
}

export function FacadeBalconies({
  w, d, h, rows,
  bayCount = 3,
  facade = 'front',
  glassColor = '#5dd4e8',
  glassOpacity = 0.35
}: FacadeBalconiesProps) {
  void h // unused; kept to keep API parallel with other primitives
  const facadeData = {
    front: { z: d / 2 + 0.08, rotY: 0,            spanW: w },
    back:  { z: -d / 2 - 0.08, rotY: Math.PI,      spanW: w },
    left:  { z: 0,             rotY: Math.PI / 2,  spanW: d },
    right: { z: 0,             rotY: -Math.PI / 2, spanW: d }
  } as const
  const f = facadeData[facade]
  const baySpacing = f.spanW / bayCount
  const bayW = baySpacing * 0.8
  return (
    <>
      {rows.flatMap((y, ri) =>
        Array.from({ length: bayCount }).map((_, bi) => {
          const localX = (bi - (bayCount - 1) / 2) * baySpacing
          const isAxialFacade = facade === 'front' || facade === 'back'
          const wx = isAxialFacade ? localX : (facade === 'left' ? w / 2 + 0.08 : -w / 2 - 0.08)
          const wz = isAxialFacade ? f.z : localX
          return (
            <group key={`${ri}-${bi}`} position={[wx, y, wz]} rotation={[0, f.rotY, 0]}>
              {/* concrete floor */}
              <mesh castShadow>
                <boxGeometry args={[bayW, 0.04, 0.14]} />
                <meshLambertMaterial color="#cfd6e0" />
              </mesh>
              {/* glass railing panel */}
              <mesh position={[0, 0.1, 0.06]}>
                <planeGeometry args={[bayW, 0.18]} />
                <meshLambertMaterial
                  color={glassColor}
                  transparent
                  opacity={glassOpacity}
                  emissive={ACCENT_CYAN}
                  emissiveIntensity={0.2}
                />
              </mesh>
              {/* top rail */}
              <mesh position={[0, 0.19, 0.07]}>
                <boxGeometry args={[bayW, 0.012, 0.012]} />
                <meshLambertMaterial color="#22354f" />
              </mesh>
            </group>
          )
        })
      )}
    </>
  )
}

// -----------------------------------------------------------------------------
// FacadePortal — entry door / pilasters on a chosen facade ground floor.
//
// Used by Office classic (C7). Two slim pilasters + lintel + recessed door
// panel + optional cyan top accent.
// -----------------------------------------------------------------------------

interface FacadePortalProps {
  w: number; d: number; h: number
  /** Which facade. Default 'front'. */
  facade?: 'front' | 'back' | 'left' | 'right'
  /** Door panel color. Default near-black. */
  doorColor?: string
  /** Pilaster color. Default light slate. */
  pilasterColor?: string
  /** Top accent cyan band on/off. Default true. */
  cyanAccent?: boolean
}

export function FacadePortal({
  w, d, h,
  facade = 'front',
  doorColor = '#0e1a28',
  pilasterColor = '#cfd6e0',
  cyanAccent = true
}: FacadePortalProps) {
  void h // unused — portal sits at ground-floor regardless of building height
  const facadeData = {
    front: { x: 0,             z: d / 2 + 0.012, rotY: 0,            spanW: w },
    back:  { x: 0,             z: -d / 2 - 0.012, rotY: Math.PI,      spanW: w },
    left:  { x: w / 2 + 0.012, z: 0,             rotY: Math.PI / 2,  spanW: d },
    right: { x: -w / 2 - 0.012, z: 0,             rotY: -Math.PI / 2, spanW: d }
  } as const
  const f = facadeData[facade]
  return (
    <group position={[f.x, 0, f.z]} rotation={[0, f.rotY, 0]}>
      {/* left pilaster */}
      <mesh position={[-f.spanW * 0.13, 0.22, 0]} castShadow>
        <boxGeometry args={[0.06, 0.44, 0.05]} />
        <meshLambertMaterial color={pilasterColor} />
      </mesh>
      {/* right pilaster */}
      <mesh position={[f.spanW * 0.13, 0.22, 0]} castShadow>
        <boxGeometry args={[0.06, 0.44, 0.05]} />
        <meshLambertMaterial color={pilasterColor} />
      </mesh>
      {/* lintel */}
      <mesh position={[0, 0.46, 0]} castShadow>
        <boxGeometry args={[f.spanW * 0.34, 0.05, 0.06]} />
        <meshLambertMaterial color="#22354f" />
      </mesh>
      {/* recessed door */}
      <mesh position={[0, 0.21, -0.005]}>
        <planeGeometry args={[f.spanW * 0.22, 0.42]} />
        <meshLambertMaterial color={doorColor} />
      </mesh>
      {cyanAccent && (
        <mesh position={[0, 0.42, 0.001]}>
          <planeGeometry args={[f.spanW * 0.22, 0.012]} />
          <meshLambertMaterial color="#000" emissive={ACCENT_CYAN} emissiveIntensity={1.2} />
        </mesh>
      )}
    </group>
  )
}
