import { describe, expect, it } from 'vitest'
import {
  reconcileCruiseVisibility,
  type CruiseVisibilitySnapshot,
} from '../cameraMode'

function snapshot(overrides: Partial<CruiseVisibilitySnapshot> = {}): CruiseVisibilitySnapshot {
  return {
    mode: 'cruise',
    cruiseState: 'running',
    pauseReason: null,
    cruiseRunId: 7,
    resumeCruiseOnVisible: false,
    ...overrides,
  }
}

describe('camera cruise visibility transitions', () => {
  it('pauses cruise when the tab becomes hidden', () => {
    const transition = reconcileCruiseVisibility(snapshot(), 'hidden')

    expect(transition.action).toBe('pause-tab-hidden')
    expect(transition.state).toMatchObject({
      mode: 'manual',
      cruiseState: 'paused',
      pauseReason: 'tab-hidden',
      cruiseRunId: 7,
      resumeCruiseOnVisible: true,
    })
  })

  it('resumes cruise when the tab becomes visible after tab-hidden pause', () => {
    const transition = reconcileCruiseVisibility(snapshot({
      mode: 'manual',
      cruiseState: 'paused',
      pauseReason: 'tab-hidden',
      resumeCruiseOnVisible: true,
    }), 'visible')

    expect(transition.action).toBe('resume-tab-visible')
    expect(transition.state).toMatchObject({
      mode: 'cruise',
      cruiseState: 'running',
      pauseReason: null,
      cruiseRunId: 8,
      resumeCruiseOnVisible: false,
    })
  })

  it('does not overwrite a manual cruise pause when the tab becomes hidden', () => {
    const transition = reconcileCruiseVisibility(snapshot({
      mode: 'manual',
      cruiseState: 'paused',
      pauseReason: 'cruise-toggle',
    }), 'hidden')

    expect(transition.action).toBe('none')
    expect(transition.state).toMatchObject({
      mode: 'manual',
      cruiseState: 'paused',
      pauseReason: 'cruise-toggle',
      cruiseRunId: 7,
      resumeCruiseOnVisible: false,
    })
  })

  it('does not mark non-cruise camera modes for automatic resume', () => {
    const transition = reconcileCruiseVisibility(snapshot({
      mode: 'focus-transition',
      cruiseState: 'running',
    }), 'hidden')

    expect(transition.action).toBe('none')
    expect(transition.state).toMatchObject({
      mode: 'focus-transition',
      cruiseState: 'running',
      pauseReason: null,
      cruiseRunId: 7,
      resumeCruiseOnVisible: false,
    })
  })

  it('does not resume a manual cruise pause when the tab becomes visible', () => {
    const transition = reconcileCruiseVisibility(snapshot({
      mode: 'manual',
      cruiseState: 'paused',
      pauseReason: 'cruise-toggle',
    }), 'visible')

    expect(transition.action).toBe('none')
    expect(transition.state).toMatchObject({
      mode: 'manual',
      cruiseState: 'paused',
      pauseReason: 'cruise-toggle',
      cruiseRunId: 7,
      resumeCruiseOnVisible: false,
    })
  })
})
