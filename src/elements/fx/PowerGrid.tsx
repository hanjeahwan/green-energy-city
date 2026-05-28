import { plants } from '../../data'
import { useSelectionStore } from '../../scene/selection'
import { CLEAN_GREEN } from '../../scene/palette'
import { PowerFlowLine } from './PowerFlowLine'

export function PowerGrid() {
  const selectedTarget = useSelectionStore((state) => state.selectedTarget)
  const selectedId = selectedTarget?.id ?? null
  return (
    <group>
      {plants.map((p) => {
        const isSelected = selectedId === p.id
        // Selected cable: push toward CLEAN_GREEN (energy flowing OK to the
        // tower), boost amplitude. Non-selected when SOMETHING ELSE is
        // selected: dim to 0.4 so the highlight reads clearly. No selection:
        // default per-status colour + 1.0 intensity.
        const someoneSelected = selectedId !== null
        const color = isSelected
          ? CLEAN_GREEN
          : p.status === 'crit'
            ? '#e8504a'
            : p.status === 'warn'
              ? '#e8a634'
              : '#2bbd84'
        const intensity = isSelected
          ? 2.0
          : someoneSelected
            ? 0.4
            : 1.0
        return (
          <PowerFlowLine
            key={p.id}
            from={[p.position[0], 0.2, p.position[2]]}
            to={[0, 3.6, 0]}
            color={color}
            speed={p.status === 'crit' ? 1.0 : 0.4}
            intensity={intensity}
          />
        )
      })}
    </group>
  )
}
