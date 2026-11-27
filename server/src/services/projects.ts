// The Projects app (f-008, increment one): the brain's projects with the
// owner's pins, each project's open PRs, its idea records and its context
// drift, and its chats: those whose pane is tagged project=<slug> (d-120).
// Each part comes through a port that reads only when a request asks
// (d-112). The pins and the last drift run of each project are kept in
// stores, so every device sees the same pins and a restart keeps both.
import type {
  ChatTag,
  DriftFinding,
  DriftResponse,
  DriftRun,
  Idea,
  IdeaDetailResponse,
  IdeaId,
  IdeasResponse,
  ProjectChatsResponse,
  ProjectDetailResponse,
  ProjectPull,
  ProjectRepository,
  ProjectSlug,
  ProjectsResponse,
  ProjectSummary,
  RepositoryId,
} from '@bridge/contract'
import { maxDriftFindings } from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import type { AgentPort, AgentPortError } from './agentPort.ts'

export type ProjectFault = { readonly reason: 'failed'; readonly code: string }

/** A project folder of the brain, as its `project.yaml` gives it. */
export type ProjectRecord = {
  readonly slug: ProjectSlug
  readonly name: string
  readonly purpose: string
  readonly icon: string | null
  readonly repositories: readonly ProjectRepository[]
}

/** An idea record: its row and its Markdown after the front matter. */
export type IdeaRecord = { readonly idea: Idea; readonly body: string }

/** The brain's projects and their idea records. It only reads, and only when called. */
export type BrainProjects = {
  list(): Promise<Result<readonly ProjectRecord[], ProjectFault>>
  /** The idea records of one project folder; none for a folder with no `ideas/`. */
  ideas(slug: ProjectSlug): Promise<Result<readonly IdeaRecord[], ProjectFault>>
}

/** The slugs that the owner pinned, in the order of their pins. */
export type PinStore = {
  load(): Promise<Result<readonly ProjectSlug[], ProjectFault>>
  save(pins: readonly ProjectSlug[]): Promise<Result<void, ProjectFault>>
}

/** An open PR as the PR source gives it, before the service adds its repository. */
export type OpenPull = Omit<ProjectPull, 'repository'>

/** The open PRs of one GitHub repository. */
export type PullSource = {
  open(repository: {
    readonly owner: string
    readonly name: string
  }): Promise<Result<readonly OpenPull[], ProjectFault>>
}

/**
 * One run of the layout check (`ncc check`): each problem line, with each path in it relative to the root of the
 * chat tree. An empty list is a clean layout.
 */
export type LayoutCheck = { run(): Promise<Result<readonly string[], ProjectFault>> }

export type DriftRuns = Readonly<Record<string, DriftRun>>

export type DriftStore = {
  load(): Promise<Result<DriftRuns, ProjectFault>>
  save(runs: DriftRuns): Promise<Result<void, ProjectFault>>
}

type Deps = {
  readonly brain: BrainProjects
  readonly pins: PinStore
  readonly pulls: PullSource
  readonly check: LayoutCheck
  readonly drift: DriftStore
  /** The chats and their tags; none (each chats read fails) where an app has no agents to give. */
  readonly agents?: Pick<AgentPort, 'listWorkspaces' | 'chatTags'>
  readonly now?: () => Date
}

type NotFound = 'notFound'

/** A drift run's answer, and the fault code of a check that failed (for the log), else null. */
type DriftRunOutcome = { readonly drift: DriftResponse; readonly code: string | null }

export type Projects = {
  list(): Promise<Result<ProjectsResponse, ProjectFault>>
  get(slug: ProjectSlug): Promise<Result<ProjectDetailResponse | NotFound, ProjectFault>>
  pin(slug: ProjectSlug, pinned: boolean): Promise<Result<ProjectSummary | NotFound, ProjectFault>>
  ideas(slug: ProjectSlug): Promise<Result<IdeasResponse | NotFound, ProjectFault>>
  idea(slug: ProjectSlug, id: IdeaId): Promise<Result<IdeaDetailResponse | NotFound, ProjectFault>>
  drift(slug: ProjectSlug): Promise<Result<DriftResponse | NotFound, ProjectFault>>
  runDrift(slug: ProjectSlug): Promise<Result<DriftRunOutcome | NotFound, ProjectFault>>
  chats(slug: ProjectSlug): Promise<Result<ProjectChatsResponse | NotFound, ProjectFault>>
}

const tagKeys = ['project', 'area', 'role'] as const
const tagValue = /^[a-z0-9][a-z0-9._-]{0,63}$/

/** The tags the app reads (d-120), in key order: `project`, `area` and `role` with a value written as a slug is. */
function chatTagsOf(tokens: Readonly<Record<string, string>>): ChatTag[] {
  return tagKeys.flatMap((key) => {
    const value = Object.hasOwn(tokens, key) ? tokens[key] : undefined
    return value !== undefined && tagValue.test(value) ? [{ key, value }] : []
  })
}

const agentFault = (error: AgentPortError): ProjectFault => ({ reason: 'failed', code: `agents-${error.reason}` })

/** How long the open PRs of one repository are kept before `gh` runs again for it. */
export const pullsKeptMs = 30_000

/**
 * The pull source with each repository's answer kept for `pullsKeptMs`, and one run shared by the requests that
 * ask while it runs, so a reload or a second device starts no new `gh` run. A failed run is not kept.
 */
export function keptPulls(source: PullSource, now: () => Date): PullSource {
  type Kept = { readonly at: number; readonly answer: Promise<Result<readonly OpenPull[], ProjectFault>> }
  const kept = new Map<string, Kept>()
  return {
    open(repository) {
      const key = `${repository.owner}/${repository.name}`
      const at = now().getTime()
      const last = kept.get(key)
      if (last !== undefined && at - last.at < pullsKeptMs) return last.answer
      const answer = source.open(repository)
      const entry = { at, answer }
      kept.set(key, entry)
      void answer.then((result) => {
        if (!result.ok && kept.get(key) === entry) kept.delete(key)
      })
      return answer
    },
  }
}

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * The lines of a layout check that are about one project: a path in `projects/<slug>` (the code folder or the
 * brain's notes folder), a line that names "project <slug>", or one that names one of its repositories by its folder
 * name alone, as the git hook lines do ("no commit-msg hook in the-bridge").
 */
export function findingsFor(
  slug: ProjectSlug,
  repositories: readonly string[],
  lines: readonly string[],
): DriftFinding[] {
  const s = escape(slug)
  const about = new RegExp(`(^|[\\s/:])projects/${s}([/\\s):]|$)|\\bproject ${s}([\\s:,]|$)`)
  const repos = repositories.map((r) => new RegExp(`(^|\\s)${escape(r)}(\\s|$)`))
  return lines
    .map((line) => line.trim())
    .filter((line) => line !== '' && (about.test(line) || repos.some((r) => r.test(line))))
    .slice(0, maxDriftFindings)
    .map((line) => ({ text: line.slice(0, 1_000) }))
}

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name)

export function createProjects({
  brain,
  pins,
  pulls: source,
  check,
  drift,
  agents,
  now = () => new Date(),
}: Deps): Projects {
  const pulls = keptPulls(source, now)
  // One store change at a time, so two pins or two runs that cross keep both.
  let queue: Promise<unknown> = Promise.resolve()
  const serial = <T>(work: () => Promise<T>): Promise<T> => {
    const next = queue.then(work, work)
    queue = next.catch(() => undefined)
    return next
  }
  // One layout check at a time: a second Run check while one runs gets that run's result.
  let running: Promise<Result<readonly string[], ProjectFault>> | undefined

  const summaries = async (): Promise<Result<ProjectSummary[], ProjectFault>> => {
    const [records, pinned] = await Promise.all([brain.list(), pins.load()])
    if (!records.ok) return records
    if (!pinned.ok) return pinned
    const order = new Map(pinned.value.map((slug, i) => [slug, i]))
    const cards = records.value.map((r) => ({
      slug: r.slug,
      name: r.name,
      purpose: r.purpose,
      icon: r.icon,
      pinned: order.has(r.slug),
    }))
    const first = cards.filter((c) => c.pinned).sort(byName)
    const rest = cards.filter((c) => !c.pinned).sort(byName)
    return ok([...first, ...rest])
  }

  const recordOf = async (slug: ProjectSlug): Promise<Result<ProjectRecord | NotFound, ProjectFault>> => {
    const records = await brain.list()
    if (!records.ok) return records
    return ok(records.value.find((r) => r.slug === slug) ?? 'notFound')
  }

  const queueOf = async (repositories: readonly ProjectRepository[]) => {
    const read = await Promise.all(
      repositories.map(async (repository) => {
        if (repository.github === null) return { repository: repository.id, pulls: [], failed: false }
        const open = await pulls.open(repository.github)
        return open.ok
          ? { repository: repository.id, pulls: open.value, failed: false }
          : { repository: repository.id, pulls: [], failed: true }
      }),
    )
    const inProgress: ProjectPull[] = read
      .flatMap((r) => r.pulls.map((p) => ({ ...p, repository: r.repository })))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    const unread: RepositoryId[] = read.filter((r) => r.failed).map((r) => r.repository)
    return { inProgress, unread }
  }

  return {
    async list() {
      const cards = await summaries()
      return cards.ok ? ok({ projects: cards.value }) : cards
    },

    async get(slug) {
      const [cards, record] = await Promise.all([summaries(), recordOf(slug)])
      if (!cards.ok) return cards
      if (!record.ok) return record
      const project = cards.value.find((c) => c.slug === slug)
      if (record.value === 'notFound' || project === undefined) return ok('notFound')
      return ok({
        project,
        repositories: [...record.value.repositories],
        queue: await queueOf(record.value.repositories),
      })
    },

    pin: (slug, pinned) =>
      serial(async () => {
        const record = await recordOf(slug)
        if (!record.ok) return record
        if (record.value === 'notFound') return ok('notFound')
        const stored = await pins.load()
        if (!stored.ok) return stored
        const others = stored.value.filter((s) => s !== slug)
        const next = pinned ? [...others, slug] : others
        if (next.length !== stored.value.length || pinned !== stored.value.includes(slug)) {
          const saved = await pins.save(next)
          if (!saved.ok) return saved
        }
        const r = record.value
        return ok({ slug: r.slug, name: r.name, purpose: r.purpose, icon: r.icon, pinned })
      }),

    async ideas(slug) {
      const record = await recordOf(slug)
      if (!record.ok) return record
      if (record.value === 'notFound') return ok('notFound')
      const ideas = await brain.ideas(slug)
      if (!ideas.ok) return ideas
      const rows = ideas.value.map((i) => i.idea).sort((a, b) => b.updated.localeCompare(a.updated))
      return ok({ ideas: rows })
    },

    async idea(slug, id) {
      const record = await recordOf(slug)
      if (!record.ok) return record
      if (record.value === 'notFound') return ok('notFound')
      const ideas = await brain.ideas(slug)
      if (!ideas.ok) return ideas
      const found = ideas.value.find((i) => i.idea.id === id)
      return ok(found === undefined ? 'notFound' : { idea: found.idea, body: found.body })
    },

    async drift(slug) {
      const record = await recordOf(slug)
      if (!record.ok) return record
      if (record.value === 'notFound') return ok('notFound')
      const runs = await drift.load()
      if (!runs.ok) return runs
      return ok({ last: Object.hasOwn(runs.value, slug) ? (runs.value[slug] ?? null) : null })
    },

    async runDrift(slug) {
      const record = await recordOf(slug)
      if (!record.ok) return record
      if (record.value === 'notFound') return ok('notFound')
      const started = running ?? check.run()
      running = started
      const lines = await started.finally(() => {
        if (running === started) running = undefined
      })
      const checkedAt = now().toISOString()
      const repositories = record.value.repositories.map((r) => r.id)
      const findings = lines.ok ? findingsFor(slug, repositories, lines.value) : []
      const run: DriftRun = {
        result: !lines.ok ? 'failed' : findings.length > 0 ? 'findings' : 'clean',
        checkedAt,
        findings,
      }
      return serial(async () => {
        const runs = await drift.load()
        if (!runs.ok) return runs
        const saved = await drift.save({ ...runs.value, [slug]: run })
        if (!saved.ok) return saved
        return ok({ drift: { last: run }, code: lines.ok ? null : lines.error.code })
      })
    },
    async chats(slug) {
      const record = await recordOf(slug)
      if (!record.ok) return record
      if (record.value === 'notFound') return ok('notFound')
      if (agents === undefined) return err({ reason: 'failed', code: 'no-agents' })
      const [spaces, tags] = await Promise.all([agents.listWorkspaces(), agents.chatTags()])
      if (!spaces.ok) return err(agentFault(spaces.error))
      if (!tags.ok) return err(agentFault(tags.error))
      const chats = spaces.value.flatMap((w) =>
        w.chats.flatMap((c) => {
          const kept = chatTagsOf(tags.value.get(c.pane) ?? {})
          if (!kept.some((t) => t.key === 'project' && t.value === slug)) return []
          const { id, kind, title, model, contextUsed, status, pane } = c
          return [
            { id, kind, title, model, contextUsed, status, pane, workspace: { id: w.id, label: w.label }, tags: kept },
          ]
        }),
      )
      return ok({ chats })
    },
  }
}

/** The service of an app with none: each call fails, so each projects route answers 500 and is logged. */
export const noProjects: Projects = (() => {
  const fault = () => Promise.resolve(err({ reason: 'failed' as const, code: 'no-store' }))
  return { list: fault, get: fault, pin: fault, ideas: fault, idea: fault, drift: fault, runDrift: fault, chats: fault }
})()
