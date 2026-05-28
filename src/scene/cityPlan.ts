import type { MasterplanSectorId } from './masterplan'
import { MASTERPLAN_SECTORS } from './masterplan'
import { ROAD_AVENUES_X, ROAD_AVENUES_Z, ROAD_HALF_WIDTH, STUB_RECTS } from './roads'

export type DistrictBand = 'core' | 'inner'
export type ParcelShape = 'cell' | 'bar' | 'block' | 'l' | 't' | 'strip' | 'yard'
export type RoadAxis = 'x' | 'z'
export type RoadTier = 'inner' | 'connector' | 'perimeter' | 'alley'

export interface RoadSegment {
  id: string
  tier: RoadTier
  axis: RoadAxis
  center: [number, number]
  length: number
  width: number
}

export interface ParcelFootprint {
  cellSize: number
  cells: readonly [number, number][]
}

export interface InnerCityParcel {
  id: string
  sector: MasterplanSectorId
  band: 'core' | 'inner'
  center: [number, number]
  rotation: number
  shape: ParcelShape
  footprint: ParcelFootprint
  color: string
  roadId: string
}

export type InnerParcelSummary = Record<MasterplanSectorId, Record<ParcelShape, number>>

interface PlacedCells {
  cells: [number, number][]
  shape: ParcelShape
}

interface InnerDistrictLayout {
  id: MasterplanSectorId
  origin: readonly [number, number]
  rows: readonly string[]
}

const INNER_CELL_SIZE = 1.35
const INNER_CELL_PAD_SCALE = 0.86

const SHAPE_CELLS = {
  cell: [[0, 0]],
  bar: [[0, 0], [1, 0]],
  block: [[0, 0], [1, 0], [0, 1], [1, 1]],
  l: [[0, 0], [0, 1], [1, 1]],
  t: [[0, 1], [1, 0], [1, 1], [2, 1]],
  strip: [[0, 0], [1, 0], [2, 0]],
  yard: [[0, 0], [1, 0], [0, 1]],
} as const satisfies Record<ParcelShape, readonly [number, number][]>

const INNER_SECTOR_SEED: Record<MasterplanSectorId, number> = {
  'north-emobility': 1100,
  'east-storage': 1200,
  'south-grid': 1300,
  'west-hydrogen': 1400,
  'ne-cbd': 1500,
  'nw-community': 1600,
  'se-logistics': 1700,
  'sw-wind-park': 1800,
  'n-edu-edge': 1900,
  'e-health-edge': 2000,
  's-culture-edge': 2100,
  'w-market-edge': 2200,
}

const INNER_SHAPES: readonly ParcelShape[] = ['l', 't', 'bar', 'block', 'strip', 'yard']
const INNER_TARGET_PARCELS_PER_SECTOR = 7

const INNER_DISTRICT_LAYOUTS = [
  {
    id: 'north-emobility',
    origin: [-6.75, 8.85],
    rows: ['###.####.#', '.########.', '####.#####', '##.#####..', '.####.##.#'],
  },
  {
    id: 'east-storage',
    origin: [8.85, -6.75],
    rows: ['###.#', '#####', '.####', '####.', '###.#', '.####', '#####', '##.##', '.###.', '####.'],
  },
  {
    id: 'south-grid',
    origin: [-6.75, -15.6],
    rows: ['.##.####.#', '####.###..', '###.#####.', '.#########', '####.###.#'],
  },
  {
    id: 'west-hydrogen',
    origin: [-15.6, -6.75],
    rows: ['.####', '#####', '###.#', '####.', '.####', '###.#', '#####', '.####', '##.##', '####.'],
  },
  {
    id: 'ne-cbd',
    origin: [8.85, 8.85],
    rows: ['###.#', '#####', '.####', '####.', '##.##'],
  },
  {
    id: 'nw-community',
    origin: [-15.6, 8.85],
    rows: ['.###.', '#####', '####.', '.####', '##.##'],
  },
  {
    id: 'se-logistics',
    origin: [8.85, -15.6],
    rows: ['##.##', '####.', '.####', '#####', '.###.'],
  },
  {
    id: 'sw-wind-park',
    origin: [-15.6, -15.6],
    rows: ['.####', '####.', '###.#', '#####', '##.##'],
  },
] as const satisfies readonly InnerDistrictLayout[]

function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

function masterplanSectorById(id: MasterplanSectorId) {
  const sector = MASTERPLAN_SECTORS.find((item) => item.id === id)
  if (!sector) throw new Error(`Unknown masterplan sector ${id}`)
  return sector
}

function innerLayoutCells(layout: InnerDistrictLayout): [number, number][] {
  const cells: [number, number][] = []
  const rows = [...layout.rows].reverse()
  rows.forEach((row, rowIndex) => {
    Array.from(row).forEach((char, colIndex) => {
      if (char === '#') cells.push([colIndex, rowIndex])
    })
  })
  return cells
}

function innerCellWorld(layout: InnerDistrictLayout, col: number, row: number): [number, number] {
  return [
    layout.origin[0] + (col + 0.5) * INNER_CELL_SIZE,
    layout.origin[1] + (row + 0.5) * INNER_CELL_SIZE,
  ]
}

function rotateCells(cells: readonly [number, number][], quarterTurns: number): [number, number][] {
  const turns = ((quarterTurns % 4) + 4) % 4
  const rotated = cells.map(([col, row]) => {
    if (turns === 1) return [-row, col] as [number, number]
    if (turns === 2) return [-col, -row] as [number, number]
    if (turns === 3) return [row, -col] as [number, number]
    return [col, row] as [number, number]
  })
  const minCol = Math.min(...rotated.map(([col]) => col))
  const minRow = Math.min(...rotated.map(([, row]) => row))
  return rotated.map(([col, row]) => [col - minCol, row - minRow])
}

function boundsForCells(cells: readonly [number, number][]) {
  const cols = cells.map(([col]) => col)
  const rows = cells.map(([, row]) => row)
  return {
    minCol: Math.min(...cols),
    maxCol: Math.max(...cols),
    minRow: Math.min(...rows),
    maxRow: Math.max(...rows),
  }
}

function occupiedKey(col: number, row: number) {
  return `${col}:${row}`
}

function candidateFitsInnerLayout(cells: readonly [number, number][], occupied: ReadonlySet<string>, mask: ReadonlySet<string>) {
  for (const [col, row] of cells) {
    const key = occupiedKey(col, row)
    if (!mask.has(key)) return false
    if (occupied.has(key)) return false
  }
  return true
}

function chooseInnerShape(index: number, seed: number): PlacedCells {
  const shape = INNER_SHAPES[Math.floor(rand(seed + index * 23) * INNER_SHAPES.length)]
  const quarterTurns = Math.floor(rand(seed + index * 29 + 3) * 4)
  return { cells: rotateCells(SHAPE_CELLS[shape], quarterTurns), shape }
}

function placeInnerLayoutCells(layout: InnerDistrictLayout, index: number, seed: number, occupied: Set<string>): PlacedCells {
  const maskCells = innerLayoutCells(layout)
  const mask = new Set(maskCells.map(([col, row]) => occupiedKey(col, row)))

  for (let attempt = 0; attempt < 260; attempt++) {
    const shapePick = chooseInnerShape(attempt + index * 9, seed)
    const anchor = maskCells[Math.floor(rand(seed + attempt * 17 + index * 23) * maskCells.length)]
    const cells = shapePick.cells.map(([dx, dz]) => [anchor[0] + dx, anchor[1] + dz] as [number, number])

    if (candidateFitsInnerLayout(cells, occupied, mask)) {
      for (const [cellCol, cellRow] of cells) occupied.add(occupiedKey(cellCol, cellRow))
      return { cells, shape: shapePick.shape }
    }
  }

  for (const [col, row] of maskCells) {
    const key = occupiedKey(col, row)
    if (!occupied.has(key)) {
      occupied.add(key)
      return { cells: [[col, row]], shape: 'cell' }
    }
  }

  throw new Error(`Unable to place inner layout parcel ${index} in ${layout.id}`)
}

function nearestInnerRoadId(x: number, z: number) {
  let id = `inner-ns-${ROAD_AVENUES_X[0]}`
  let distance = Number.POSITIVE_INFINITY

  for (const roadX of ROAD_AVENUES_X) {
    const nextDistance = Math.abs(x - roadX)
    if (nextDistance < distance) {
      id = `inner-ns-${roadX}`
      distance = nextDistance
    }
  }

  for (const roadZ of ROAD_AVENUES_Z) {
    const nextDistance = Math.abs(z - roadZ)
    if (nextDistance < distance) {
      id = `inner-ew-${roadZ}`
      distance = nextDistance
    }
  }

  return id
}

function makeInnerParcel(layout: InnerDistrictLayout, index: number, occupied: Set<string>): InnerCityParcel {
  const sector = masterplanSectorById(layout.id)
  const seed = INNER_SECTOR_SEED[layout.id] + index * 71
  const placed = placeInnerLayoutCells(layout, index, seed, occupied)
  const bounds = boundsForCells(placed.cells)
  const [minWorldX, minWorldZ] = innerCellWorld(layout, bounds.minCol, bounds.minRow)
  const [maxWorldX, maxWorldZ] = innerCellWorld(layout, bounds.maxCol, bounds.maxRow)
  const centerX = (minWorldX + maxWorldX) / 2 + (rand(seed + 12) - 0.5) * 0.08
  const centerZ = (minWorldZ + maxWorldZ) / 2 + (rand(seed + 13) - 0.5) * 0.08

  return {
    id: `inner-${layout.id}-${index}`,
    sector: layout.id,
    band: 'inner',
    center: [centerX, centerZ],
    rotation: (rand(seed + 19) - 0.5) * 0.12,
    shape: placed.shape,
    footprint: {
      cellSize: INNER_CELL_SIZE * INNER_CELL_PAD_SCALE,
      cells: placed.cells.map(([col, row]) => [
        innerCellWorld(layout, col, row)[0] - centerX,
        innerCellWorld(layout, col, row)[1] - centerZ,
      ]),
    },
    color: sector.color,
    roadId: nearestInnerRoadId(centerX, centerZ),
  }
}

function innerRoad(
  id: string,
  tier: RoadTier,
  axis: RoadAxis,
  center: [number, number],
  length: number,
  width: number,
): RoadSegment {
  return { id, tier, axis, center, length, width }
}

function buildPrimaryInnerRoads(): RoadSegment[] {
  return [
    innerRoad('inner-core-east', 'inner', 'z', [8, 0], 16, ROAD_HALF_WIDTH * 2),
    innerRoad('inner-core-west', 'inner', 'z', [-8, 0], 16, ROAD_HALF_WIDTH * 2),
    innerRoad('inner-core-north', 'inner', 'x', [0, 8], 16, ROAD_HALF_WIDTH * 2),
    innerRoad('inner-core-south', 'inner', 'x', [0, -8], 16, ROAD_HALF_WIDTH * 2),

    innerRoad('inner-north-spoke-w-outer', 'inner', 'z', [-16, 14.4], 11.2, 1.42),
    innerRoad('inner-north-spoke-w-inner', 'inner', 'z', [-8, 14.15], 12.3, 1.48),
    innerRoad('inner-north-spoke-e-inner', 'inner', 'z', [8, 13.25], 10.5, 1.42),
    innerRoad('inner-north-spoke-e-outer', 'inner', 'z', [16, 14.1], 11.8, 1.48),
    innerRoad('inner-south-spoke-w-outer', 'inner', 'z', [-16, -14.1], 11.8, 1.48),
    innerRoad('inner-south-spoke-w-inner', 'inner', 'z', [-8, -13.1], 10.2, 1.42),
    innerRoad('inner-south-spoke-e-inner', 'inner', 'z', [8, -14.4], 11.2, 1.48),
    innerRoad('inner-south-spoke-e-outer', 'inner', 'z', [16, -13.7], 10.8, 1.42),

    innerRoad('inner-east-spoke-n-outer', 'inner', 'x', [14.4, 16], 11.2, 1.44),
    innerRoad('inner-east-spoke-n-inner', 'inner', 'x', [14.1, 8], 12.2, 1.48),
    innerRoad('inner-east-spoke-s-inner', 'inner', 'x', [13.2, -8], 10.4, 1.42),
    innerRoad('inner-east-spoke-s-outer', 'inner', 'x', [14.05, -16], 11.9, 1.48),
    innerRoad('inner-west-spoke-n-outer', 'inner', 'x', [-13.9, 16], 12.2, 1.48),
    innerRoad('inner-west-spoke-n-inner', 'inner', 'x', [-13.1, 8], 10.2, 1.42),
    innerRoad('inner-west-spoke-s-inner', 'inner', 'x', [-14.35, -8], 11.3, 1.48),
    innerRoad('inner-west-spoke-s-outer', 'inner', 'x', [-13.65, -16], 10.9, 1.42),

    innerRoad('inner-edge-north-w', 'inner', 'x', [-16.9, 16], 6.2, 1.28),
    innerRoad('inner-edge-north-mw', 'inner', 'x', [-6.6, 16], 8.4, 1.26),
    innerRoad('inner-edge-north-me', 'inner', 'x', [7.4, 16], 6.4, 1.26),
    innerRoad('inner-edge-north-e', 'inner', 'x', [16.7, 16], 6.6, 1.28),
    innerRoad('inner-edge-south-w', 'inner', 'x', [-17.1, -16], 5.8, 1.28),
    innerRoad('inner-edge-south-mw', 'inner', 'x', [-6.1, -16], 7.4, 1.26),
    innerRoad('inner-edge-south-me', 'inner', 'x', [5.9, -16], 8.0, 1.26),
    innerRoad('inner-edge-south-e', 'inner', 'x', [16.9, -16], 6.0, 1.28),
    innerRoad('inner-edge-east-n', 'inner', 'z', [16, 16.85], 6.3, 1.28),
    innerRoad('inner-edge-east-mn', 'inner', 'z', [16, 6.5], 8.6, 1.26),
    innerRoad('inner-edge-east-ms', 'inner', 'z', [16, -7.2], 6.8, 1.26),
    innerRoad('inner-edge-east-s', 'inner', 'z', [16, -16.7], 6.6, 1.28),
    innerRoad('inner-edge-west-n', 'inner', 'z', [-16, 16.4], 7.2, 1.28),
    innerRoad('inner-edge-west-mn', 'inner', 'z', [-16, 5.6], 7.6, 1.26),
    innerRoad('inner-edge-west-ms', 'inner', 'z', [-16, -7.0], 7.0, 1.26),
    innerRoad('inner-edge-west-s', 'inner', 'z', [-16, -16.4], 6.8, 1.28),

    innerRoad('inner-outer-w-trunk', 'inner', 'z', [-24, 0], 44, ROAD_HALF_WIDTH * 2),
    innerRoad('inner-outer-e-trunk', 'inner', 'z', [24, 0], 44, ROAD_HALF_WIDTH * 2),
    innerRoad('inner-outer-n-trunk', 'inner', 'x', [0, 22], 48, ROAD_HALF_WIDTH * 2),
    innerRoad('inner-outer-s-trunk', 'inner', 'x', [0, -22], 48, ROAD_HALF_WIDTH * 2),

    innerRoad('inner-ext-z8-w', 'inner', 'x', [-21.1, 8], 5.8, 1.48),
    innerRoad('inner-ext-z8-e', 'inner', 'x', [21.1, 8], 5.8, 1.48),
    innerRoad('inner-ext-zn8-w', 'inner', 'x', [-21.1, -8], 5.8, 1.48),
    innerRoad('inner-ext-zn8-e', 'inner', 'x', [21.1, -8], 5.8, 1.48),
    innerRoad('inner-ext-z16-w', 'inner', 'x', [-22, 16], 4.0, 1.28),
    innerRoad('inner-ext-z16-e', 'inner', 'x', [22, 16], 4.0, 1.28),
    innerRoad('inner-ext-zn16-w', 'inner', 'x', [-22, -16], 4.0, 1.28),
    innerRoad('inner-ext-zn16-e', 'inner', 'x', [22, -16], 4.0, 1.28),
    innerRoad('inner-ext-x8-n', 'inner', 'z', [8, 20.25], 3.5, 1.42),
    innerRoad('inner-ext-xn8-n', 'inner', 'z', [-8, 21.15], 1.7, 1.48),
    innerRoad('inner-ext-x16-n', 'inner', 'z', [16, 21], 2.0, 1.48),
    innerRoad('inner-ext-xn16-n', 'inner', 'z', [-16, 21], 2.0, 1.48),
    innerRoad('inner-ext-x8-s', 'inner', 'z', [8, -21], 2.0, 1.42),
    innerRoad('inner-ext-xn8-s', 'inner', 'z', [-8, -20.1], 3.8, 1.48),
    innerRoad('inner-ext-x16-s', 'inner', 'z', [16, -21], 2.0, 1.48),
    innerRoad('inner-ext-xn16-s', 'inner', 'z', [-16, -20.9], 2.2, 1.48),

    innerRoad('inner-mid-zn16', 'inner', 'x', [-0.25, -16], 4.6, 1.28),
    innerRoad('inner-mid-z16', 'inner', 'x', [0.9, 16], 6.9, 1.28),
    innerRoad('inner-mid-xn16', 'inner', 'z', [-16, -0.85], 5.6, 1.28),
    innerRoad('inner-mid-x16', 'inner', 'z', [16, -0.8], 6.2, 1.28),
    innerRoad('inner-fill-zn8-e', 'inner', 'x', [19.3, -8], 2.0, 1.48),
    innerRoad('inner-fill-xn8-s', 'inner', 'z', [-8, -19.1], 2.0, 1.48),
    innerRoad('inner-fill-zn8-mid', 'inner', 'x', [-8.4, -8], 0.9, 1.48),
    innerRoad('inner-fill-x8-mid', 'inner', 'z', [8, -8.4], 1.0, 1.48),

    ...STUB_RECTS.map((s) =>
      innerRoad(
        `inner-${s.id}`,
        'inner',
        s.halfX >= s.halfZ ? 'x' : 'z',
        [s.cx, s.cz],
        2 * Math.max(s.halfX, s.halfZ),
        2 * Math.min(s.halfX, s.halfZ),
      ),
    ),
  ]
}

function buildInnerRoadNetwork(): RoadSegment[] {
  return [
    innerRoad('inner-alley-north-market-a', 'alley', 'x', [-3.45, 11.15], 7.1, 0.48),
    innerRoad('inner-alley-north-market-b', 'alley', 'x', [4.325, 13.75], 5.35, 0.44),
    innerRoad('inner-alley-north-yard-a', 'alley', 'z', [-4.65, 13.0], 4.0, 0.42),
    innerRoad('inner-alley-north-yard-b', 'alley', 'z', [2.95, 12.2], 3.5, 0.4),

    innerRoad('inner-alley-east-plaza-a', 'alley', 'z', [11.15, 3.5], 7.0, 0.48),
    innerRoad('inner-alley-east-plaza-b', 'alley', 'z', [13.85, -4.325], 5.35, 0.44),
    innerRoad('inner-alley-east-yard-a', 'alley', 'x', [13.0, 4.65], 4.0, 0.42),
    innerRoad('inner-alley-east-yard-b', 'alley', 'x', [12.2, -2.95], 3.5, 0.4),

    innerRoad('inner-alley-south-service-a', 'alley', 'x', [3.45, -11.15], 7.1, 0.48),
    innerRoad('inner-alley-south-service-b', 'alley', 'x', [-4.325, -13.75], 5.35, 0.44),
    innerRoad('inner-alley-south-yard-a', 'alley', 'z', [4.65, -13.0], 4.0, 0.42),
    innerRoad('inner-alley-south-yard-b', 'alley', 'z', [-2.95, -12.2], 3.5, 0.4),

    innerRoad('inner-alley-west-community-a', 'alley', 'z', [-11.15, -3.5], 7.0, 0.48),
    innerRoad('inner-alley-west-community-b', 'alley', 'z', [-13.85, 4.325], 5.35, 0.44),
    innerRoad('inner-alley-west-yard-a', 'alley', 'x', [-13.0, -4.65], 4.0, 0.42),
    innerRoad('inner-alley-west-yard-b', 'alley', 'x', [-12.2, 2.95], 3.5, 0.4),

    innerRoad('inner-alley-ne-lane-a', 'alley', 'x', [12.35, 10.75], 5.1, 0.42),
    innerRoad('inner-alley-ne-lane-b', 'alley', 'z', [10.55, 12.9], 4.1, 0.42),
    innerRoad('inner-alley-nw-lane-a', 'alley', 'x', [-12.2, 13.55], 5.6, 0.42),
    innerRoad('inner-alley-nw-lane-b', 'alley', 'z', [-10.55, 11.1], 4.2, 0.4),
    innerRoad('inner-alley-se-lane-a', 'alley', 'x', [12.4, -13.15], 5.2, 0.42),
    innerRoad('inner-alley-se-lane-b', 'alley', 'z', [14.05, -10.925], 3.85, 0.4),
    innerRoad('inner-alley-sw-lane-a', 'alley', 'x', [-12.55, -10.8], 5.0, 0.42),
    innerRoad('inner-alley-sw-lane-b', 'alley', 'z', [-14.05, -13.05], 3.9, 0.4),
  ]
}

const INNER_TIER_WIDTH: Partial<Record<RoadTier, number>> = {
  inner: ROAD_HALF_WIDTH * 2,
  alley: 0.44,
}

export function buildRoadNetwork(): RoadSegment[] {
  const roads: RoadSegment[] = []
  roads.push(...buildPrimaryInnerRoads())
  roads.push(...buildInnerRoadNetwork())

  return roads.map((road) => {
    const width = INNER_TIER_WIDTH[road.tier]
    return width == null ? road : { ...road, width }
  })
}

export function buildInnerParcels(): InnerCityParcel[] {
  const parcels: InnerCityParcel[] = []

  for (const layout of INNER_DISTRICT_LAYOUTS) {
    const occupied = new Set<string>()
    for (let index = 0; index < INNER_TARGET_PARCELS_PER_SECTOR; index++) {
      parcels.push(makeInnerParcel(layout, index, occupied))
    }
  }

  return parcels
}

export function buildInnerParcelSummary(parcels: readonly InnerCityParcel[]): InnerParcelSummary {
  const summary = {} as InnerParcelSummary
  for (const sector of MASTERPLAN_SECTORS) {
    summary[sector.id] = {} as Record<ParcelShape, number>
    for (const shape of Object.keys(SHAPE_CELLS) as ParcelShape[]) summary[sector.id][shape] = 0
  }
  for (const parcel of parcels) summary[parcel.sector][parcel.shape]++
  return summary
}
