export type AlertConePosition = [number, number, number]

// PS-02 has an asymmetric alarm footprint: a larger 4x5 solar array at origin
// and the surviving BatteryBank north of it. The alert cones deliberately wrap
// the south + side service edge instead of using a full circle that clips
// through panels or the battery slab.
export const PENANG_ALERT_CONE_POSITIONS: AlertConePosition[] = [
  [-1.58, 0, -1.02],
  [-0.85, 0, -1.62],
  [0.85, 0, -1.62],
  [1.58, 0, -1.02],
  [-1.58, 0, 0.56],
  [1.58, 0, 0.56]
]
