import { useEffect, useState } from 'react'
import { verifyLayout, type Violation, type Placement } from '../scene/layout'
import {
  SHOWROOM_ANCHOR_REGISTRY,
  SHOWROOM_CONTRACT,
  type ShowroomAnchorSpec,
} from '../scene/showroomContract'

// =============================================================================
// useLayoutAudit — polls window.__placementExtras / __showroomAnchors /
// __treeViolations every rAF (up to 5s) for the first audit, then every 1s
// for 60s in case anchors mount late (e.g. lazy CityScene or a busy GPU).
//
// Extracted from LayoutAuditBanner.tsx in the G-stage refactor so the
// component file only renders, while the polling state machine + anchor-
// contract verification live here. Public API matches what the banner needs:
// `{ violations, dismiss }`. Auto-fade is owned by the hook so the component
// is purely declarative.
// =============================================================================

const ANCHOR_AUDIT_TIMEOUT_MS = 5000
const ANCHOR_TOLERANCE = 0.01
const RE_AUDIT_INTERVAL_MS = 1000
const RE_AUDIT_MAX_RUNS = 60 // 60s total observation window
const AUTO_FADE_MS = 6000

function anchorAuditViolation(anchorCount: number, missingAnchorIds: readonly string[]): Violation {
  return {
    kind: 'reserved',
    msg: `Runtime anchors not fully registered: ${anchorCount}/${SHOWROOM_CONTRACT.requiredAnchorIds.length}. Missing: ${missingAnchorIds.join(', ')}. Check Canvas or InteractiveAnchor mount.`,
    ids: [...missingAnchorIds],
  }
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function vectorMatches(actual: unknown, expected: readonly number[]) {
  return Array.isArray(actual)
    && actual.length === expected.length
    && actual.every((value, index) => isNumber(value) && Math.abs(value - expected[index]) <= ANCHOR_TOLERANCE)
}

function numberMatches(actual: unknown, expected: number) {
  return isNumber(actual) && Math.abs(actual - expected) <= ANCHOR_TOLERANCE
}

function runtimeAnchorContractViolations(
  anchors: Record<string, unknown>,
  missingAnchorIds: readonly string[],
): Violation[] {
  if (missingAnchorIds.length > 0) return []

  const violations: Violation[] = []
  for (const id of SHOWROOM_CONTRACT.requiredAnchorIds) {
    const actual = anchors[id] as Partial<ShowroomAnchorSpec> | undefined
    const expected = SHOWROOM_ANCHOR_REGISTRY[id]
    if (!actual || !expected) continue

    const mismatches: string[] = []
    if (!vectorMatches(actual.position, expected.position)) mismatches.push('position')
    if (!numberMatches(actual.rotationY, expected.rotationY)) mismatches.push('rotationY')
    if (!vectorMatches(actual.cardOffset, expected.cardOffset)) mismatches.push('cardOffset')
    if (actual.showLabel !== expected.showLabel) mismatches.push('showLabel')

    const actualBound = actual.bound
    if (!actualBound || typeof actualBound !== 'object') {
      mismatches.push('bound')
    } else {
      const bound = actualBound as unknown as Record<string, unknown>
      for (const key of ['w', 'h', 'd', 'cy'] as const) {
        const expectedValue = expected.bound[key]
        if (expectedValue !== undefined && !numberMatches(bound[key], expectedValue)) {
          mismatches.push(`bound.${key}`)
        }
      }
    }

    if (mismatches.length > 0) {
      violations.push({
        kind: 'reserved',
        msg: `${id} runtime anchor mismatches showroom contract: ${mismatches.join(', ')}`,
        ids: [id],
      })
    }
  }

  return violations
}

export interface LayoutAuditState {
  /** Latest violation list. `null` while still polling (initial mount). */
  violations: Violation[] | null
  /** Whether the user dismissed the banner via the close button. */
  dismissed: boolean
  /** Whether the auto-fade timer has fired. The component opacity-fades
   *  to 0 on this; the next transitionEnd flips dismissed to fully unmount. */
  faded: boolean
  /** Click handler for the dismiss × button. */
  dismiss: () => void
  /** transitionEnd handler that finalises auto-fade by setting dismissed. */
  onAutoFadeEnd: () => void
}

export function useLayoutAudit(): LayoutAuditState {
  const [violations, setViolations] = useState<Violation[] | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [faded, setFaded] = useState(false)

  useEffect(() => {
    let rafHandle = 0
    let intervalHandle: number | undefined
    let runCount = 0
    let cancelled = false
    const startedAt = performance.now()

    const readDebugWindow = () => {
      const debugWindow = window as unknown as {
        __placementExtras?: Placement[]
        __showroomAnchors?: Record<string, unknown>
        __treeViolations?: Violation[]
      }
      const extras: Placement[] = debugWindow.__placementExtras ?? []
      const treeViolations: Violation[] = debugWindow.__treeViolations ?? []
      const anchors = debugWindow.__showroomAnchors ?? {}
      const anchorCount = Object.keys(anchors).length
      const missingAnchorIds = SHOWROOM_CONTRACT.requiredAnchorIds.filter((id) => !anchors[id])
      const anchorContractViolations = runtimeAnchorContractViolations(anchors, missingAnchorIds)
      const hasRequiredAnchors = missingAnchorIds.length === 0 && anchorContractViolations.length === 0
      return { extras, treeViolations, anchorCount, missingAnchorIds, anchorContractViolations, hasRequiredAnchors }
    }

    const runAudit = () => {
      const ctx = readDebugWindow()
      if (!ctx.hasRequiredAnchors && performance.now() - startedAt < ANCHOR_AUDIT_TIMEOUT_MS) {
        rafHandle = requestAnimationFrame(runAudit)
        return
      }
      if (cancelled) return
      commit(ctx)
    }

    const commit = (ctx: ReturnType<typeof readDebugWindow>) => {
      const { extras, treeViolations, anchorCount, missingAnchorIds, anchorContractViolations, hasRequiredAnchors } = ctx
      const layoutViolations = verifyLayout({ extra: extras })
      const v = [
        ...layoutViolations,
        ...treeViolations,
        ...(missingAnchorIds.length > 0 ? [anchorAuditViolation(anchorCount, missingAnchorIds)] : []),
        ...anchorContractViolations,
      ]
      document.documentElement.dataset.layoutViolations = String(v.length)
      document.documentElement.dataset.placementExtras = String(extras.length)
      document.documentElement.dataset.treeViolations = String(treeViolations.length)
      document.documentElement.dataset.showroomAnchors = String(anchorCount)
      document.documentElement.dataset.showroomAnchorStatus = hasRequiredAnchors ? 'pass' : 'fail'
      setViolations(v)
      if (v.length > 0) {
        console.error(`[LayoutAudit] ${v.length} violation(s) (incl ${treeViolations.length} tree):`)
        for (const x of v) console.error(`  - [${x.kind}] ${x.msg}`)
      } else {
        console.log(`[LayoutAudit] 0 violations — layout PASSED; anchors=${anchorCount}; extras=${extras.length}; trees clean`)
      }
    }

    const reAudit = () => {
      runCount++
      if (cancelled) return
      commit(readDebugWindow())
      if (runCount >= RE_AUDIT_MAX_RUNS && intervalHandle !== undefined) {
        window.clearInterval(intervalHandle)
        intervalHandle = undefined
      }
    }

    rafHandle = requestAnimationFrame(runAudit)
    intervalHandle = window.setInterval(reAudit, RE_AUDIT_INTERVAL_MS)
    return () => {
      cancelled = true
      cancelAnimationFrame(rafHandle)
      if (intervalHandle !== undefined) window.clearInterval(intervalHandle)
    }
  }, [])

  // Auto-fade once banner is visible
  useEffect(() => {
    if (!violations || violations.length === 0) return
    const t = window.setTimeout(() => setFaded(true), AUTO_FADE_MS)
    return () => window.clearTimeout(t)
  }, [violations])

  return {
    violations,
    dismissed,
    faded,
    dismiss: () => setDismissed(true),
    onAutoFadeEnd: () => {
      if (faded) setDismissed(true)
    },
  }
}
