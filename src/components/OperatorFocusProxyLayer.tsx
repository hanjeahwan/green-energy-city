import { useRef } from 'react'
import { useCameraMode } from '../scene/cameraMode'
import { getOperatorProfile } from '../scene/operatorMetadata'
import { useSelectionStore } from '../scene/selection'
import { useOperatorAnchorStore } from '../scene/operatorAnchorStore'

export function OperatorFocusProxyLayer() {
  const rootRef = useRef<HTMLDivElement>(null)
  const anchors = useOperatorAnchorStore((state) => state.anchors)
  const setSelected = useSelectionStore((state) => state.setSelected)
  const { pauseCruise } = useCameraMode()

  const rootRect = rootRef.current?.getBoundingClientRect()

  return (
    <div ref={rootRef} className="operator-focus-proxies" aria-label="Operator focus targets">
      {anchors.map((anchor) => {
        const profile = getOperatorProfile(anchor.id)
        const hidden = !anchor.visible || Boolean(anchor.occludedBy) || !rootRect
        const left = rootRect ? anchor.screenBox.left - rootRect.left : -9999
        const top = rootRect ? anchor.screenBox.top - rootRect.top : -9999
        return (
          <button
            key={anchor.id}
            type="button"
            className="operator-focus-proxy"
            style={{
              left,
              top,
              width: anchor.screenBox.width,
              height: anchor.screenBox.height
            }}
            hidden={hidden}
            aria-label={`${profile.title} · ${profile.defaultStatus}`}
            data-operator-proxy-id={anchor.id}
            onFocus={() => {
              document.documentElement.dataset.operatorProxyFocus = anchor.id
            }}
            onClick={(event) => {
              event.preventDefault()
              pauseCruise('operator-keyboard-focus')
              setSelected(anchor.id, 'operator')
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return
              event.preventDefault()
              pauseCruise('operator-keyboard-focus')
              setSelected(anchor.id, 'operator')
            }}
          />
        )
      })}
    </div>
  )
}
