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
  RepositoriesResponse,
  RepositoryCiResponse,
  RepositoryId,
  RepositoryPart,
  RepositoryRelease,
  RepositorySection,
  RepositoryVisibility,
} from '@bridge/contract'
import { ciWindowDays, maxDriftFindings } from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import type { AgentPort, AgentPortError } from './agentPort.ts'
import { type CiSource, ciOf, ciRunsOf, type JobRun, jobRunsOf, windowOf } from './repositoryCi.ts'

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

/** A GitHub repository's visibility and newest release (R2). */
export type RepositoryAbout = { readonly visibility: RepositoryVisibility; readonly release: RepositoryRelease | null }

/** What GitHub says about one repository. */
export type RepositoryFacts = {
  about(repository: { readonly owner: string; readonly name: string }): Promise<Result<RepositoryAbout, ProjectFault>>
}

/** The number of git worktrees of one repository of a project, in its `-worktrees` folder of the chat root. */
export type WorktreeCount = {
  count(slug: ProjectSlug, repository: RepositoryId): Promise<Result<number, ProjectFault>>
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
  /** GitHub's facts and the worktree counts; with none, that part is not read. */
  readonly facts?: RepositoryFacts
  readonly worktrees?: WorktreeCount
  /** GitHub's CI runs, merged PRs and jobs; with none, each CI read is null. */
  readonly ci?: CiSource
  /** The chats and their tags; none (each chats read fails) where an app has no agents to give. */
  readonly agents?: Pick<AgentPort, 'listWorkspaces' | 'chatTags'>
  readonly now?: () => Date
}

type NotFound = 'notFound'

/** A CI read's answer, and the fault code of a GitHub read that failed (for the log), else null. */
type CiOutcome = { readonly response: RepositoryCiResponse; readonly code: string | null }

/** A drift run's answer, and the fault code of a check that failed (for the log), else null. */
type DriftRunOutcome = { readonly drift: DriftResponse; readonly code: string | null }

export type Projects = {
  list(): Promise<Result<ProjectsResponse, ProjectFault>>
  get(slug: ProjectSlug): Promise<Result<ProjectDetailResponse | NotFound, ProjectFault>>
  pin(slug: ProjectSlug, pinned: boolean): Promise<Result<ProjectSummary | NotFound, ProjectFault>>
  ideas(slug: ProjectSlug): Promise<Result<IdeasResponse | NotFound, ProjectFault>>
  idea(slug: ProjectSlug, id: IdeaId): Promise<Result<IdeaDetailResponse | NotFound, ProjectFault>>
  drift(slug: ProjectSlug): Promise<Result<DriftResponse | NotFound, ProjectFault>>
  /** The Repositories tab (R2, R5, R8): a part that does not read is named in `unread`, never a fault. */
  repositories(slug: ProjectSlug): Promise<Result<RepositoriesResponse | NotFound, ProjectFault>>
  /** A repository's CI numbers (R4, R6), kept `ciKeptMs`; null when GitHub did not answer. */
  ci(slug: ProjectSlug, repository: RepositoryId): Promise<Result<CiOutcome | NotFound, ProjectFault>>
  runDrift(slug: ProjectSlug): Promise<Result<DriftRunOutcome | NotFound, ProjectFault>>
  /** A fault of the agents is the port's own, so the route answers it as the workspaces routes do. */
  chats(slug: ProjectSlug): Promise<Result<ProjectChatsResponse | NotFound, ProjectFault | AgentPortError>>
  /** Calls `onChange` each time a run in the background finds other open PRs (NCC-156); the result stops it. */
  watch(onChange: () => void): () => void
}

const tagKeys = ['project', 'area', 'role'] as const
const tagValue = /^[a-z0-9][a-z0-9._-]{0,63}$/

/**
 * The tags the app reads (d-120), in key order: `project`, `area` and `role` with a value written as a slug is. The
 * Inbox reads a chat's project with it too.
 */
export function chatTagsOf(tokens: Readonly<Record<string, string>>): ChatTag[] {
  return tagKeys.flatMap((key) => {
    const value = Object.hasOwn(tokens, key) ? tokens[key] : undefined
    return value !== undefined && tagValue.test(value) ? [{ key, value }] : []
  })
}

/** How old a repository's kept answer may be before a read starts a new `gh` run for it. */
export const pullsKeptMs = 30_000

/**
 * The pull source with each repository's last answer kept (NCC-156): the first read waits for its run, and the
 * requests that cross share it; a failed first run is not kept. After that a read gets the kept answer at once,
 * at any age, and a read of one older than `pullsKeptMs` also starts one run in the background, one at a time.
 * When that run's PRs differ from the kept ones, `changed` is called; a failed one keeps the answer. A run that
 * throws is a failed one (`threw`), so no rejection is left unhandled; its message, which can name a path, is not kept.
 */
export function keptPulls(source: PullSource, now: () => Date, changed: () => void = () => undefined): PullSource {
  type Answer = Result<readonly OpenPull[], ProjectFault>
  type Kept = { at: number; answer: Promise<Answer>; running: boolean }
  const kept = new Map<string, Kept>()
  const run = (repository: Parameters<PullSource['open']>[0]): Promise<Answer> =>
    source.open(repository).catch((): Answer => err({ reason: 'failed', code: 'threw' }))
  const refresh = (entry: Kept, repository: Parameters<PullSource['open']>[0]) => {
    entry.running = true
    void Promise.all([entry.answer, run(repository)])
      .then(([before, after]) => {
        if (!after.ok) return
        entry.at = now().getTime()
        entry.answer = Promise.resolve(after)
        if (!before.ok || JSON.stringify(before.value) !== JSON.stringify(after.value)) changed()
      })
      .finally(() => {
        entry.running = false
      })
  }
  return {
    open(repository) {
      const key = `${repository.owner}/${repository.name}`
      const at = now().getTime()
      const last = kept.get(key)
      if (last !== undefined) {
        if (!last.running && at - last.at >= pullsKeptMs) refresh(last, repository)
        return last.answer
      }
      const entry: Kept = { at, answer: run(repository), running: true }
      kept.set(key, entry)
      void entry.answer.then((result) => {
        entry.running = false
        if (!result.ok && kept.get(key) === entry) kept.delete(key)
      })
      return entry.answer
    },
  }
}

/** How long a repository's CI numbers are kept before gh runs again for it. */
const ciKeptMs = 600_000

/**
 * One answer for each key, kept `keptMs` and shared by the requests that ask while it runs; an answer `keep` refuses
 * is not kept, so the next request reads again. A read that throws is not kept either.
 */
function keptAnswers<T>(keptMs: number, now: () => Date, keep: (answer: T) => boolean) {
  const kept = new Map<string, { readonly at: number; readonly answer: Promise<T> }>()
  return (key: string, read: () => Promise<T>): Promise<T> => {
    const at = now().getTime()
    const last = kept.get(key)
    if (last !== undefined && at - last.at < keptMs) return last.answer
    const entry = { at, answer: read() }
    kept.set(key, entry)
    const drop = () => {
      if (kept.get(key) === entry) kept.delete(key)
    }
    void entry.answer.then((answer) => {
      if (!keep(answer)) drop()
    }, drop)
    return entry.answer
  }
}

/** How long a repository's visibility and release are kept before gh runs again for it. */
export const aboutKeptMs = 300_000

/** The facts source with each repository's answer kept for `aboutKeptMs`, as `keptPulls` keeps the PRs. */
export function keptFacts(source: RepositoryFacts, now: () => Date): RepositoryFacts {
  type Kept = { readonly at: number; readonly answer: Promise<Result<RepositoryAbout, ProjectFault>> }
  const kept = new Map<string, Kept>()
  return {
    about(repository) {
      const key = `${repository.owner}/${repository.name}`
      const at = now().getTime()
      const last = kept.get(key)
      if (last !== undefined && at - last.at < aboutKeptMs) return last.answer
      const answer = source.about(repository)
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
  facts: factsSource,
  worktrees,
  ci,
  now = () => new Date(),
}: Deps): Projects {
  const keptCi = keptAnswers<CiOutcome>(ciKeptMs, now, (answer) => answer.code === null)
  const watchers = new Set<() => void>()
  const pulls = keptPulls(source, now, () => {
    for (const watcher of [...watchers]) watcher()
  })
  const facts = factsSource === undefined ? undefined : keptFacts(factsSource, now)
  const notRead = Promise.resolve(err({ reason: 'failed' as const, code: 'no-source' }))

  const readCi = async (github: { readonly owner: string; readonly name: string }): Promise<CiOutcome> => {
    const none = (code: string) => ({ response: { ci: null }, code })
    const source = ci
    if (source === undefined) return none('no-source')
    const since = new Date(now().getTime() - ciWindowDays * 86_400_000).toISOString()
    const [runs, merged] = await Promise.all([source.runs(github, since), source.merged(github, since)])
    if (!runs.ok) return none(runs.error.code)
    if (!merged.ok) return none(merged.error.code)
    const ciRuns = ciRunsOf(runs.value)
    const reads = await Promise.all(
      jobRunsOf(ciRuns).map((run) => Promise.all(run.runs.map((r) => source.jobs(github, r.id)))),
    )
    const jobs: JobRun[][] = []
    for (const read of reads) {
      const got: JobRun[] = []
      for (const r of read) {
        if (!r.ok) return none(r.error.code)
        got.push(...r.value)
      }
      jobs.push(got)
    }
    return { response: { ci: ciOf(windowOf(since, runs.value), ciRuns, merged.value, jobs) }, code: null }
  }

  const sectionOf = async (slug: ProjectSlug, repository: ProjectRepository): Promise<RepositorySection> => {
    const github = repository.github
    const [about, open, count] = await Promise.all([
      github === null ? null : (facts?.about(github) ?? notRead),
      github === null ? null : pulls.open(github),
      worktrees?.count(slug, repository.id) ?? notRead,
    ])
    const unread: RepositoryPart[] = []
    if (about !== null && !about.ok) unread.push('about')
    if (open !== null && !open.ok) unread.push('pulls')
    if (!count.ok) unread.push('worktrees')
    return {
      ...repository,
      visibility: about?.ok === true ? about.value.visibility : null,
      release: about?.ok === true ? about.value.release : null,
      openPulls: open?.ok === true ? open.value.length : null,
      worktrees: count.ok ? count.value : null,
      unread,
    }
  }
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

    async repositories(slug) {
      const record = await recordOf(slug)
      if (!record.ok) return record
      if (record.value === 'notFound') return ok('notFound')
      return ok({ repositories: await Promise.all(record.value.repositories.map((r) => sectionOf(slug, r))) })
    },

    async ci(slug, id) {
      const record = await recordOf(slug)
      if (!record.ok) return record
      if (record.value === 'notFound') return ok('notFound')
      const repository = record.value.repositories.find((r) => r.id === id)
      if (repository === undefined) return ok('notFound')
      const github = repository.github
      if (github === null) return ok({ response: { ci: null }, code: null })
      // A read that throws is the fault `threw`, so no rejection is left unhandled; its message is not kept.
      const read = () => readCi(github).catch((): CiOutcome => ({ response: { ci: null }, code: 'threw' }))
      return ok(await keptCi(`${github.owner}/${github.name}`, read))
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
      if (!spaces.ok) return spaces
      if (!tags.ok) return tags
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

    watch(onChange) {
      const watcher = () => {
        onChange()
      }
      watchers.add(watcher)
      return () => {
        watchers.delete(watcher)
      }
    },
  }
}

/** The service of an app with none: each call fails, so each projects route answers 500 and is logged. */
export const noProjects: Projects = (() => {
  const fault = () => Promise.resolve(err({ reason: 'failed' as const, code: 'no-store' }))
  const watch = () => () => undefined
  return {
    list: fault,
    get: fault,
    pin: fault,
    ideas: fault,
    idea: fault,
    drift: fault,
    repositories: fault,
    ci: fault,
    runDrift: fault,
    chats: fault,
    watch,
  }
})()
