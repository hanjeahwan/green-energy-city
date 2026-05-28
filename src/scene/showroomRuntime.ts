import { create } from 'zustand'
import type { CameraMode, CruisePauseReason, CruiseState } from './cameraMode'

export interface SceneCameraReadout {
  distance: number | null
  elevationDeg: number | null
  mode: CameraMode
  cruiseState: CruiseState
  pauseReason: CruisePauseReason | null
  cruiseRunId: number
}

interface ShowroomRuntimeStore {
  cameraReadout: SceneCameraReadout
  publishCameraReadout: (readout: SceneCameraReadout) => void
}

const DEFAULT_CAMERA_READOUT: SceneCameraReadout = {
  distance: null,
  elevationDeg: null,
  mode: 'cruise',
  cruiseState: 'running',
  pauseReason: null,
  cruiseRunId: 0
}

function sameCameraReadout(a: SceneCameraReadout, b: SceneCameraReadout) {
  return a.distance === b.distance &&
    a.elevationDeg === b.elevationDeg &&
    a.mode === b.mode &&
    a.cruiseState === b.cruiseState &&
    a.pauseReason === b.pauseReason &&
    a.cruiseRunId === b.cruiseRunId
}

export const useShowroomRuntimeStore = create<ShowroomRuntimeStore>((set) => ({
  cameraReadout: DEFAULT_CAMERA_READOUT,
  publishCameraReadout: (readout) => {
    set((state) => sameCameraReadout(state.cameraReadout, readout)
      ? state
      : { cameraReadout: readout })
  }
}))
