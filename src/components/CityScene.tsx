import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { memo, useEffect, useRef } from 'react'
import { CameraDirector } from './CameraDirector'
import { RoadMarkings } from '../elements/road/RoadMarkings'
import { ShowroomMetricsProbe } from './ShowroomMetricsProbe'
import { InteractiveAnchor } from '../elements/InteractiveAnchor'
import { useSelectionStore } from '../scene/selection'
import { useCameraMode } from '../scene/cameraMode'
import { plants } from '../data'
import { Buildings } from '../elements/buildings/Buildings'
import { PeripheralStyleCommandTower } from '../elements/buildings/CommandTower'
import { TwinSolarOffice } from '../elements/facilities/TwinSolarOffice'
import { CommunityPark } from '../elements/facilities/CommunityPark'
import { SHOWROOM_ANCHOR_REGISTRY, SHOWROOM_WEATHER_PRESET } from '../scene/showroomContract'
import { DEFAULT_CAMERA_POSITION, DEFAULT_CAMERA_TARGET } from '../scene/cameraMotion'
import * as THREE from 'three'
import { CORE_BLUE } from '../scene/palette'

// Decomposed scene element imports (extracted from CityScene 2026-05-25):
import { Ground } from '../elements/ground/Ground'
import { MasterplanGround } from '../elements/parcels/MasterplanGround'
import { EnergyPlaza } from '../elements/parcels/EnergyPlaza'
import { CityRoadNetwork } from '../elements/road/CityRoadNetwork'
import { LampPosts } from '../elements/road/LampPosts'
import { SmartCityProps } from '../elements/facilities/SmartCityProps'
import { WindFarm } from '../elements/facilities/WindFarm'
import { TransmissionTowers } from '../elements/facilities/TransmissionTowers'
import { ContainerYard } from '../elements/facilities/ContainerYard'
import { WaterTanks } from '../elements/facilities/WaterTanks'
import { PVHotspot } from '../elements/facilities/PVHotspot'
import { BenchPlanters } from '../elements/street/BenchPlanters'
import { Billboards } from '../elements/street/Billboards'
import { Trees } from '../elements/nature/Trees'
import { People } from '../elements/people/People'
import { ServiceVan } from '../elements/vehicles/ServiceVan'
import { Sedan } from '../elements/vehicles/Sedan'
import { Truck } from '../elements/vehicles/Truck'
import { Drone } from '../elements/vehicles/Drone'
import { CommandAgentRoutes } from '../elements/fx/CommandAgentRoutes'
import { AssignmentCueLine } from '../elements/fx/AssignmentCueLine'
import { SkyDome } from '../elements/fx/SkyDome'
import { University } from '../elements/facilities/University'
import { Hospital } from '../elements/facilities/Hospital'
import { MuseumPlaza } from '../elements/facilities/MuseumPlaza'
import { Market } from '../elements/facilities/Market'
import { SportsComplex } from '../elements/facilities/SportsComplex'
import { TransitHub } from '../elements/facilities/TransitHub'
import { ResearchPark } from '../elements/facilities/ResearchPark'
import { DataCenter } from '../elements/facilities/DataCenter'

// =============================================================================
// SOLAR INDUSTRIAL PARK — tight diorama, vertex-color shading, post-processed
// =============================================================================

const showroomAnchor = SHOWROOM_ANCHOR_REGISTRY
const ENABLE_CANVAS_PERFORMANCE_METRICS = true

// ---------- scene root ----------

function CitySceneInner() {
  // Ref shared with CameraDirector so it can lerp controls.target without
  // re-mounting OrbitControls. Type is `any` because drei's exported type
  // is an internal class — we only need .target and .update().
  const controlsRef = useRef<any>(null)
  const setSelected = useSelectionStore((state) => state.setSelected)
  const { pauseCruise } = useCameraMode()
  const directionalPosition = SHOWROOM_WEATHER_PRESET.directionalPosition

  useEffect(() => {
    const debugWindow = window as Window & { __showroomWeather?: typeof SHOWROOM_WEATHER_PRESET }
    debugWindow.__showroomWeather = SHOWROOM_WEATHER_PRESET
    document.documentElement.dataset.showroomWeatherPreset = SHOWROOM_WEATHER_PRESET.id
    document.documentElement.dataset.showroomFogRange = `${SHOWROOM_WEATHER_PRESET.fogNear}-${SHOWROOM_WEATHER_PRESET.fogFar}`
    document.documentElement.dataset.showroomVignetteDarkness = String(SHOWROOM_WEATHER_PRESET.vignette.darkness)
  }, [])

  return (
    <Canvas
      // shadows disabled: even with the small-element caster cull, shadow
      // pass re-renders the scene from the sun's POV every frame —
      // largest single GPU cost in the budget. With flat-shaded
      // Lambert/Basic materials and a directional sun this is the move
      // with the highest FPS-per-line ROI. BaseShadowDisc primitives
      // under each facility / tree already provide contact shading.
      shadows={false}
      // toneMapping ACES_FILMIC baked into the renderer (zero extra pass)
      // instead of going through EffectComposer + ToneMapping effect, which
      // forced a fullscreen post-pass + framebuffer copy every frame.
      gl={{
        antialias: false,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        // Logarithmic depth buffer: distributes depth precision uniformly
        // across the whole near-far range instead of bunching it near the
        // near plane. Standard 24-bit depth at near=1/far=110 still gives
        // sub-mm precision at 50m, but when focused close (5-10m), the
        // standard buffer's precision is still high but per-fragment
        // gl_FragDepth writes from log-depth eliminate ALL z-fight modes —
        // including alpha-blend sort flips between transparent surfaces
        // that happen at any distance. Costs ~5% FPS but kills the
        // remaining facility-focus + container-yard + sports-complex
        // flicker reports that survived per-mesh offset fixes.
        // logarithmicDepthBuffer: true,
      }}
      camera={{
        position: [DEFAULT_CAMERA_POSITION.x, DEFAULT_CAMERA_POSITION.y, DEFAULT_CAMERA_POSITION.z],
        fov: 36,
        // Near/far tightened from 0.1/200 (2000:1 ratio) to 1.0/110 (110:1).
        // Depth precision in WebGL is ~ d² × (f - n) / (n × f × 2^24), so at
        // 50m distance precision goes from ~1.5mm to ~0.15mm. This is the
        // global root cause for all the zoom-out z-fight reports (Sport
        // Complex floor, Container Yard strips, apartment balcony glass,
        // etc.) — those facilities all had 2-10mm coplanar offsets sitting
        // right at the precision limit. Tighter frustum makes per-mesh
        // offset fixes unnecessary.
        //
        // Safety:
        //   - near 1.0: OrbitControls.minDistance=10 keeps camera ≥ 8m
        //     from the nearest building face — no clipping.
        //   - far 110: SkyDome at radius 70 from origin + camera max 28
        //     from origin = farthest visible point ~98m. 110 leaves margin.
        near: 1.0,
        far: 110
      }}
      // dpr fixed at 1: Retina-class screens at 1.5x render 2.25x pixels
      // per frame, which on integrated GPUs wipes out every other perf
      // gain. If a future change wants sharper edges, pair it with a
      // per-device opt-in, not a blanket range.
      dpr={1}
      onCreated={({ gl }) => {
        // Exposure bumped +0.14 over the preset value (1.16 -> 1.30) to
        // compensate for the lost Environment-HDR IBL ambient + Lambert's
        // missing specular highlights. Together with the hemisphere/ambient
        // bumps above this restores roughly the original showroom
        // brightness without re-introducing the HDR cubemap cost.
        gl.toneMappingExposure = SHOWROOM_WEATHER_PRESET.toneMappingExposure + 0.14
      }}
      onPointerDown={() => {
        pauseCruise('canvas-pointer')
      }}
      onWheel={(event) => {
        pauseCruise('canvas-wheel')
        if (event.deltaY > 0 && useSelectionStore.getState().selectedTarget !== null) setSelected(null)
      }}
      // V3 selection algorithm: clicks that miss every interactive mesh
      // (e.g. on the sky, fog, or a procedural building without an anchor)
      // also exit zoom. Pairs with InteractiveAnchor's "any click while
      // zoomed → setSelected(null)" rule for a fully consistent
      // any-click-to-exit behaviour.
      onPointerMissed={() => {
        pauseCruise('empty-click')
        if (useSelectionStore.getState().selectedTarget !== null) setSelected(null)
      }}
    >
      <color attach="background" args={[SHOWROOM_WEATHER_PRESET.background]} />
      <fog attach="fog" args={[SHOWROOM_WEATHER_PRESET.fog, SHOWROOM_WEATHER_PRESET.fogNear, SHOWROOM_WEATHER_PRESET.fogFar]} />

      {/* HDR <Environment preset="city"> was providing ~0.84 worth of IBL
          ambient on the old MeshStandardMaterial path; after removing it
          AND switching the scene to MeshLambertMaterial (no specular /
          fresnel) the city read noticeably darker than the original.
          Hemisphere 1.5 + ambient 0.32 + the exposure bump in onCreated
          below put the brightness back to roughly pre-perf-sweep levels.
          (Earlier rounds settled on 1.2/0.18 but that still came up
          short.) */}
      <hemisphereLight
        args={[
          SHOWROOM_WEATHER_PRESET.hemisphereSky,
          SHOWROOM_WEATHER_PRESET.hemisphereGround,
          1.5
        ]}
      />
      <ambientLight intensity={0.32} />
      <directionalLight
        position={[directionalPosition[0], directionalPosition[1], directionalPosition[2]]}
        intensity={SHOWROOM_WEATHER_PRESET.directionalIntensity}
        color={SHOWROOM_WEATHER_PRESET.directionalColor}
      />
      {/* Hero fill near CommandTower — a deep-blue point light that wraps
          the central plaza in a faint colour halo. Distance-limited so it
          never bleeds into outer blocks. Doesn't cast shadows (cost). */}
      <pointLight position={[0, 6, 0]} intensity={SHOWROOM_WEATHER_PRESET.commandFillIntensity} color={CORE_BLUE} distance={14} />

      {/* Edge treatment: SkyDome wraps the scene so zooming out never reveals
          the ground-plate edge / void, and Ground's radial fade dissolves the
          80x80 plate edge into the horizon. */}
      <SkyDome />
      <Ground />
      <MasterplanGround />
      <EnergyPlaza />
      <CommandAgentRoutes />
      <AssignmentCueLine />
      <CityRoadNetwork />
      <RoadMarkings />
      <Buildings />
      <SmartCityProps />
      <WindFarm />
      <Trees />
      <LampPosts />
      <People />
      <BenchPlanters />
      <Billboards />
      <WaterTanks />
      <TransmissionTowers />
      <ContainerYard />
      {/* Twin Solar Office — NE CBD hero. Original geometry is 4.6×3.6m on
          XZ; shrunk via scale [0.65, 1, 0.65] to ~3.0×2.34m so the four
          corner skyscrapers can grow from 1.0×1.0 to 1.5×1.5 without
          clipping. Height (Y) preserved at 1.0 so the office still reads
          as full-storey, not a doll-house. Footprint values in
          PLACEMENTS / anchor.bound updated to match. */}
      <InteractiveAnchor {...showroomAnchor['twin-office-NE']}>
        <group scale={[0.65, 1, 0.65]}>
          <TwinSolarOffice />
        </group>
      </InteractiveAnchor>
      {/* Community park — replaces the previous Crane construction set-piece
          in the NW residential corner (user request 2026-05-25). Anchor id
          renamed `crane` → `nw-park` to keep the showroom contract honest. */}
      <InteractiveAnchor {...showroomAnchor['nw-park']}>
        <CommunityPark />
      </InteractiveAnchor>
      {/* Command tower — central plaza hero. showLabel pins a 3D dot at
          tower top + pill hanging below it (always-on, like the 5 PVs). */}
      <InteractiveAnchor {...showroomAnchor['command-tower']}>
        <PeripheralStyleCommandTower />
      </InteractiveAnchor>
      {/* PowerGrid removed (user request, 2026-05-23): the bezier cables
          arcing from each PV station up to the CommandTower were visually
          noisy and crossed the central plaza. The energy-flow story is
          now told by the always-on facility labels alone. */}
      <ServiceVan />
      <Sedan />
      <Truck />
      {/* Drone count cut from 5 to 2 (scan + cargo). Each Drone has its own
          useFrame + group transforms + emissive trail — five overlapping
          futurist accents were perf overhead with no narrative gain. Scan
          covers central plaza, cargo covers the N-S delivery corridor. */}
      <Drone variant="scan" center={[0, 8, 0]} phase={2.4} />
      <Drone variant="cargo" center={[3, 9.2, 12]} endpoint={[12, 9.2, 12]} phase={0.7} />

      {/* ===== Outer-ring civic landmarks (z>16 / x>16 / etc.) ===== */}
      <InteractiveAnchor {...showroomAnchor['university-N']}>
        <University />
      </InteractiveAnchor>
      <InteractiveAnchor {...showroomAnchor['hospital-E']}>
        <Hospital />
      </InteractiveAnchor>
      <InteractiveAnchor {...showroomAnchor['museum-S']}>
        <MuseumPlaza />
      </InteractiveAnchor>
      <InteractiveAnchor {...showroomAnchor['market-W']}>
        <Market />
      </InteractiveAnchor>

      {/* ===== Phase 2 outer-ring landmarks (irregular grid expansion) ===== */}
      <InteractiveAnchor {...showroomAnchor['sports-NW']}>
        <SportsComplex />
      </InteractiveAnchor>
      <InteractiveAnchor {...showroomAnchor['transit-W']}>
        <TransitHub />
      </InteractiveAnchor>
      <InteractiveAnchor {...showroomAnchor['research-NE']}>
        <ResearchPark />
      </InteractiveAnchor>
      <InteractiveAnchor {...showroomAnchor['data-W']}>
        <DataCenter />
      </InteractiveAnchor>

      {/* PV station hotspots — each is an InteractiveAnchor positioned at the
          plant's world coords, with PVHotspot rendering content at local origin.
          showLabel pins a 3D dot at the facility centre with the pill hanging
          below. PV anchor bounds are intentionally compact so the click shield
          and hover halo match the tightened PV equipment footprint. */}
      {plants.map((p) => (
        <InteractiveAnchor key={p.id} {...showroomAnchor[p.id]}>
          <PVHotspot plant={p} />
        </InteractiveAnchor>
      ))}

      <OrbitControls
        ref={controlsRef}
        target={[DEFAULT_CAMERA_TARGET.x, DEFAULT_CAMERA_TARGET.y, DEFAULT_CAMERA_TARGET.z]}
        enablePan={false}
        // min/max distance tuned to the scene's actual scale:
        //   city occupies r≈22 (BLOCKS at ±16, backdrop at ±20).
        //   - min 10: closest sane zoom — single facility plus its pill
        //     fits in frame, can't dive INTO equipment geometry
        //   - max 28: enough for the operating district, tight enough that
        //     zoom-out cannot reveal the empty apron around the model
        minDistance={10}
        // Phase 2 bumped 36 → 50 to cover the expanded city. 2026-05-27:
        // pulled back to 28 for a product-demo lens: users can zoom out to
        // orient, but not far enough to make the city feel like a small island.
        maxDistance={28}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 5}
        autoRotate={false}
        // Inertia after the user releases the mouse — smoother orbit feel,
        // especially when CameraDirector hands control back mid-transition.
        enableDamping
        dampingFactor={0.08}
      />

      {/* CameraDirector lerps camera + controls.target when selectedId
          changes. Mounted INSIDE the Canvas so it can useFrame/useThree. */}
      <CameraDirector controlsRef={controlsRef} />
      <ShowroomMetricsProbe enablePerformanceMetrics={ENABLE_CANVAS_PERFORMANCE_METRICS} />
    </Canvas>
  )
}

// Memoized: CityScene has 0 props, so it should never re-render from parent
// state churn. This matters because App.tsx now ticks state every 2-6s (event
// stream + live KPI), and a parent re-render was destabilizing the
// InteractiveAnchor click → select transition at desktop-1280 (intermittent).
const CityScene = memo(CitySceneInner)
export default CityScene
