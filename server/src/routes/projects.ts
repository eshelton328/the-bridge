// /api/projects (f-008, increments one and two): the Projects home, a project's page,
// its pin, its idea records, its context drift, its tagged chats, its repositories and their CI numbers. A URL names a project by
// its slug and an idea by its record ID; a param the contract does not take
// is 404, as no project or idea has it. A fault logs its errno code only,
// never a title, a record's text or a path.
import {
  DriftResponse,
  IdeaDetailResponse,
  IdeaId,
  IdeasResponse,
  PinProjectRequest,
  PinProjectResponse,
  ProjectChatsResponse,
  ProjectDetailResponse,
  ProjectSlug,
  ProjectsResponse,
  RepositoriesResponse,
  RepositoryCiResponse,
  RepositoryId,
  RunDriftRequest,
} from '@bridge/contract'
import { type Context, Hono } from 'hono'
import { type AppEnv, agentErrorJson, errorJson, internalMessage } from '../errors.ts'
import type { Logger } from '../logger.ts'
import type { ProjectFault, Projects } from '../services/projects.ts'
import { jsonBody, jsonOnly, smallJson } from './jsonBody.ts'

export function projectsRoutes(projects: Projects, log: Logger) {
  const failed = (c: Context<AppEnv>, error: ProjectFault) => {
    log.error('projects read failed', { requestId: c.get('requestId'), code: error.code })
    return errorJson(c, 'internal', { message: internalMessage })
  }
  const noProject = (c: Context<AppEnv>) =>
    errorJson(c, 'not-found', { path: c.req.path, message: 'no project has this name' })
  const noIdea = (c: Context<AppEnv>) =>
    errorJson(c, 'not-found', { path: c.req.path, message: 'the project has no idea with this ID' })
  const noRepository = (c: Context<AppEnv>) =>
    errorJson(c, 'not-found', { path: c.req.path, message: 'no project has a repository with this name' })
  const slugOf = (c: Context<AppEnv>) => ProjectSlug.safeParse(c.req.param('slug'))

  return new Hono<AppEnv>()
    .get('/', async (c) => {
      const listed = await projects.list()
      if (!listed.ok) return failed(c, listed.error)
      return c.json(ProjectsResponse.parse(listed.value), 200)
    })
    .get('/:slug', async (c) => {
      const slug = slugOf(c)
      if (!slug.success) return noProject(c)
      const found = await projects.get(slug.data)
      if (!found.ok) return failed(c, found.error)
      if (found.value === 'notFound') return noProject(c)
      return c.json(ProjectDetailResponse.parse(found.value), 200)
    })
    .put('/:slug/pin', smallJson, jsonOnly, jsonBody(PinProjectRequest), async (c) => {
      const slug = slugOf(c)
      if (!slug.success) return noProject(c)
      const pinned = await projects.pin(slug.data, c.req.valid('json').pinned)
      if (!pinned.ok) return failed(c, pinned.error)
      if (pinned.value === 'notFound') return noProject(c)
      return c.json(PinProjectResponse.parse({ project: pinned.value }), 200)
    })
    .get('/:slug/chats', async (c) => {
      const slug = slugOf(c)
      if (!slug.success) return noProject(c)
      const chats = await projects.chats(slug.data)
      // herdr's fault is 503 or 502, as on the workspaces routes; a fault of the brain is 500.
      if (!chats.ok) return chats.error.reason === 'failed' ? failed(c, chats.error) : agentErrorJson(c, chats.error)
      if (chats.value === 'notFound') return noProject(c)
      return c.json(ProjectChatsResponse.parse(chats.value), 200)
    })
    .get('/:slug/ideas', async (c) => {
      const slug = slugOf(c)
      if (!slug.success) return noProject(c)
      const ideas = await projects.ideas(slug.data)
      if (!ideas.ok) return failed(c, ideas.error)
      if (ideas.value === 'notFound') return noProject(c)
      return c.json(IdeasResponse.parse(ideas.value), 200)
    })
    .get('/:slug/ideas/:id', async (c) => {
      const slug = slugOf(c)
      if (!slug.success) return noProject(c)
      const id = IdeaId.safeParse(c.req.param('id'))
      if (!id.success) return noIdea(c)
      const idea = await projects.idea(slug.data, id.data)
      if (!idea.ok) return failed(c, idea.error)
      if (idea.value === 'notFound') return noIdea(c)
      return c.json(IdeaDetailResponse.parse(idea.value), 200)
    })
    .get('/:slug/repositories', async (c) => {
      const slug = slugOf(c)
      if (!slug.success) return noProject(c)
      const sections = await projects.repositories(slug.data)
      if (!sections.ok) return failed(c, sections.error)
      if (sections.value === 'notFound') return noProject(c)
      return c.json(RepositoriesResponse.parse(sections.value), 200)
    })
    .get('/:slug/repositories/:repo/ci', async (c) => {
      const slug = slugOf(c)
      const repo = RepositoryId.safeParse(c.req.param('repo'))
      if (!slug.success || !repo.success) return noRepository(c)
      const read = await projects.ci(slug.data, repo.data)
      if (!read.ok) return failed(c, read.error)
      if (read.value === 'notFound') return noRepository(c)
      return c.json(RepositoryCiResponse.parse(read.value.response), 200)
    })
    .get('/:slug/drift', async (c) => {
      const slug = slugOf(c)
      if (!slug.success) return noProject(c)
      const drift = await projects.drift(slug.data)
      if (!drift.ok) return failed(c, drift.error)
      if (drift.value === 'notFound') return noProject(c)
      return c.json(DriftResponse.parse(drift.value), 200)
    })
    .post('/:slug/drift', smallJson, jsonOnly, jsonBody(RunDriftRequest), async (c) => {
      const slug = slugOf(c)
      if (!slug.success) return noProject(c)
      const run = await projects.runDrift(slug.data)
      if (!run.ok) return failed(c, run.error)
      if (run.value === 'notFound') return noProject(c)
      // A check that did not run is a `failed` run the page shows; its code goes to the log only.
      if (run.value.code !== null)
        log.warn('drift check failed', { requestId: c.get('requestId'), code: run.value.code })
      return c.json(DriftResponse.parse(run.value.drift), 200)
    })
}
