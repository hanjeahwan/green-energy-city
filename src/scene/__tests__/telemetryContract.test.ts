import { describe, expect, it } from 'vitest'
import { kpis } from '../../data'
import { LIVE_NODE_STATUS } from '../../hooks/useLiveKpis'

describe('telemetry contract', () => {
  it('keeps the showroom node strip on the four active PV/V2G nodes', () => {
    expect(LIVE_NODE_STATUS.map((node) => node.id)).toEqual(['PS-01', 'PS-02', 'PS-04', 'PS-05'])
  })

  it('preserves PS-05 as a warning node for the customer demo', () => {
    expect(kpis.nodeStatus.find((node) => node.id === 'PS-05')).toEqual({ id: 'PS-05', ok: false })
    expect(LIVE_NODE_STATUS.find((node) => node.id === 'PS-05')).toEqual({ id: 'PS-05', ok: false })
  })
})
