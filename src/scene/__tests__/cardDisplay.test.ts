import { describe, expect, it } from 'vitest'
import { formatOperatorStatusValue } from '../cardDisplay'

describe('operator card display values', () => {
  it('compresses assigned incident statuses for card KPI cells', () => {
    expect(formatOperatorStatusValue('On-site repair · PS-02')).toBe('Repair')
    expect(formatOperatorStatusValue('Supporting crew · PS-02')).toBe('Supporting')
    expect(formatOperatorStatusValue('Dispatch watch · vat-S-W')).toBe('Watch')
    expect(formatOperatorStatusValue('ETA 04 min · h2-W-NW')).toBe('ETA 04 min')
  })

  it('compresses default operator locations to the action state', () => {
    expect(formatOperatorStatusValue('Walking · Central admin')).toBe('Walking')
    expect(formatOperatorStatusValue('Standing by · PS-02 perimeter')).toBe('Standby')
    expect(formatOperatorStatusValue('Monitoring · Command desk')).toBe('Monitoring')
  })
})
