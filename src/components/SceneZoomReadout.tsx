import { useShowroomRuntimeStore } from '../scene/showroomRuntime'

/**
 * Bottom-left scene HUD line. Replaces the old static
 * "VIEW · ISO 38° · ZOOM 1.0× · TWIN COORDS 3.139 / 101.687" — both the
 * "ISO 38°" angle and the "ZOOM 1.0×" were hard-coded and the twin-coords
 * were fake. Now BOTH are live, sampled by ShowroomMetricsProbe:
 *   - ↕ {elev}°  = the camera's vertical view angle (up/down tilt) above the
 *     horizon — replaces the meaningless "ISO" (isometric) label.
 *   - ZOOM {x}×  = ZOOM_REFERENCE / camera-distance, so the farthest allowed
 *     zoom-out (OrbitControls maxDistance) reads ≈ 1.00× and zooming in climbs.
 * Keep ZOOM_REFERENCE in sync with maxDistance in CityScene.
 */
const ZOOM_REFERENCE = 28

export function SceneZoomReadout() {
  const dist = useShowroomRuntimeStore((state) => state.cameraReadout.distance)
  const elev = useShowroomRuntimeStore((state) => state.cameraReadout.elevationDeg)

  const zoom = dist && dist > 0 ? ZOOM_REFERENCE / dist : null

  return (
    <div className="scene-coords absolute bottom-5 left-6 font-sans text-ui-caption text-text-mute tracking-ui-label pointer-events-none">
      VIEW · ↕ {elev == null ? '—' : `${elev}°`} · ZOOM {zoom == null ? '—' : `${zoom.toFixed(2)}×`}
    </div>
  )
}
