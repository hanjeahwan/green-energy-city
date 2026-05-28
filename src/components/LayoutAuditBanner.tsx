import { X } from 'lucide-react'
import { useLayoutAudit } from '../hooks/useLayoutAudit'

/**
 * Runtime layout auditor — renders the red top banner when the runtime
 * audit detects violations. All polling + verification state lives in
 * `useLayoutAudit`; this file is just markup.
 *
 * Behavior:
 * - rAF poll up to 5s waiting for anchors to register; first commit
 * - re-audits every 1s for 60s in case anchors mount late (e.g. lazy CityScene)
 * - banner fades 6s after first appearance OR dismissible via X button
 * - console always carries the full violation list
 */
export default function LayoutAuditBanner() {
  const { violations, dismissed, faded, dismiss, onAutoFadeEnd } = useLayoutAudit()

  if (!violations || violations.length === 0) return null
  if (dismissed) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        background: 'linear-gradient(180deg, #5a0d0d 0%, #7a1313 100%)',
        color: '#fff',
        padding: '10px 16px',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 12,
        lineHeight: 1.5,
        borderBottom: '2px solid #ff5050',
        maxHeight: '45vh',
        overflowY: 'auto',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        opacity: faded ? 0 : 1,
        pointerEvents: faded ? 'none' : 'auto',
        transition: 'opacity 0.5s ease',
      }}
      onTransitionEnd={onAutoFadeEnd}
    >
      <button
        type="button"
        aria-label="Dismiss audit banner"
        onClick={dismiss}
        style={{
          position: 'absolute',
          top: 8,
          right: 10,
          width: 24,
          height: 24,
          display: 'grid',
          placeItems: 'center',
          background: 'rgba(0,0,0,0.25)',
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: 4,
          color: '#fff',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <X size={14} strokeWidth={2.25} />
      </button>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, paddingRight: 32 }}>
        LAYOUT AUDIT FAILED — {violations.length} ISSUE{violations.length === 1 ? '' : 'S'}
      </div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {violations.slice(0, 12).map((v, i) => (
          <li key={i}>
            <span style={{ color: '#ffb0b0', marginRight: 6 }}>[{v.kind}]</span>
            {v.msg}
          </li>
        ))}
        {violations.length > 12 && (
          <li style={{ opacity: 0.8 }}>... and {violations.length - 12} more — see console</li>
        )}
      </ul>
    </div>
  )
}
