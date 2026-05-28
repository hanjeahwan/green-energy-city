import { COMMAND_AGENT_ROUTES } from '../../scene/agentRoutes'
import { AgentRouteLine } from './AgentRouteLine'

export function CommandAgentRoutes() {
  return (
    <group>
      {COMMAND_AGENT_ROUTES.map((route) => (
        <AgentRouteLine key={route.id} route={route} />
      ))}
    </group>
  )
}
