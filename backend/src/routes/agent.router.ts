import { createRouter, type Handler } from '../http/router.js'
import { getAgentEarnings } from '../services/agent.service.js'

export const agentRouter = createRouter()

// GET /api/agents/:agentId/earnings?from=YYYY-MM-DD&to=YYYY-MM-DD
agentRouter.get('/:agentId/earnings', (async (ctx) => {
  const agentId = ctx.params.agentId
  const from = (ctx.query.from as string | undefined) || undefined
  const to   = (ctx.query.to as string | undefined)   || undefined

  const data = await getAgentEarnings(agentId, from, to)
  return { status: 200, body: { success: true, data } }
}) as Handler)
