// /api/projects/:slug/architecture (f-008 increment two, R9 to R15): a
// project's diagram scopes, one scope's kept diagram, and a regenerate that
// starts a run (202). A scope that the contract does not parse, or that is not
// `@system` or a repository of that project's `project.yaml`, is 404. A
// regenerate while a run of another scope goes is 409 architecture-busy. A
// fault logs its code only.
import {
  ArchitectureResponse,
  ArchitectureScope,
  ArchitectureScopeResponse,
  ProjectSlug,
  RegenerateRequest,
  RegenerateResponse,
} from '@bridge/contract'
import { type Context, Hono } from 'hono'
import { type AppEnv, errorJson, internalMessage } from '../errors.ts'
import type { Logger } from '../logger.ts'
import type { Architecture } from '../services/architecture.ts'
import type { ProjectFault } from '../services/projects.ts'
import { jsonBody, jsonOnly, smallJson } from './jsonBody.ts'

export function architectureRoutes(architecture: Architecture, log: Logger) {
  const failed = (c: Context<AppEnv>, error: ProjectFault) => {
    log.error('architecture read failed', { requestId: c.get('requestId'), code: error.code })
    return errorJson(c, 'internal', { message: internalMessage })
  }
  const noScope = (c: Context<AppEnv>) =>
    errorJson(c, 'not-found', { path: c.req.path, message: 'no project has a diagram with this name' })
  const keyOf = (c: Context<AppEnv>) => {
    const slug = ProjectSlug.safeParse(c.req.param('slug'))
    const scope = ArchitectureScope.safeParse(c.req.param('scope'))
    return slug.success && scope.success ? { slug: slug.data, scope: scope.data } : null
  }

  return new Hono<AppEnv>()
    .get('/:slug/architecture', async (c) => {
      const slug = ProjectSlug.safeParse(c.req.param('slug'))
      if (!slug.success) return noScope(c)
      const listed = await architecture.scopes(slug.data)
      if (!listed.ok) return failed(c, listed.error)
      if (listed.value === 'notFound') return noScope(c)
      return c.json(ArchitectureResponse.parse(listed.value), 200)
    })
    .get('/:slug/architecture/:scope', async (c) => {
      const key = keyOf(c)
      if (key === null) return noScope(c)
      const read = await architecture.scope(key.slug, key.scope)
      if (!read.ok) return failed(c, read.error)
      if (read.value === 'notFound') return noScope(c)
      return c.json(ArchitectureScopeResponse.parse(read.value), 200)
    })
    .post('/:slug/architecture/:scope/regenerate', smallJson, jsonOnly, jsonBody(RegenerateRequest), async (c) => {
      const key = keyOf(c)
      if (key === null) return noScope(c)
      const run = await architecture.regenerate(key.slug, key.scope)
      if (!run.ok) return failed(c, run.error)
      if (run.value === 'notFound') return noScope(c)
      if (run.value === 'busy')
        return errorJson(c, 'architecture-busy', {
          message: 'a diagram of another scope is running; try again after it',
        })
      return c.json(RegenerateResponse.parse(run.value), 202)
    })
}
