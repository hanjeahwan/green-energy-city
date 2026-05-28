import { create } from 'zustand'
import type { OperatorRuntimeAnchor } from '../elements/InteractiveOperatorAnchor'

interface OperatorAnchorStore {
  anchors: OperatorRuntimeAnchor[]
  signature: string
  publishOperatorAnchors: (anchors: Record<string, OperatorRuntimeAnchor>) => void
  clearOperatorAnchors: () => void
}

function anchorSignature(anchors: readonly OperatorRuntimeAnchor[]) {
  return anchors
    .map((anchor) => [
      anchor.id,
      Math.round(anchor.screenCenter.x),
      Math.round(anchor.screenCenter.y),
      anchor.visible ? 1 : 0,
      anchor.occludedBy ?? ''
    ].join(':'))
    .sort()
    .join('|')
}

export const useOperatorAnchorStore = create<OperatorAnchorStore>((set) => ({
  anchors: [],
  signature: '',
  publishOperatorAnchors: (anchorMap) => {
    const anchors = Object.values(anchorMap)
    const signature = anchorSignature(anchors)
    set((state) => state.signature === signature
      ? state
      : { anchors, signature })
  },
  clearOperatorAnchors: () => {
    set((state) => state.anchors.length === 0 ? state : { anchors: [], signature: '' })
  }
}))
