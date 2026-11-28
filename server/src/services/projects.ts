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
  IdeaFile,
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
  RepositoryCi,
  RepositoryCiResponse,
  RepositoryDriftFinding,
  RepositoryDriftResponse,
  RepositoryDriftRun,
  RepositoryId,
  RepositoryPart,
  RepositoryRelease,
  RepositorySection,
  RepositoryVisibility,
} from '@bridge/contract'
import { ciWindowDays, maxDriftFindings } from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import type { AgentPort, AgentPortError } from './agentPort.ts'
import { createSnapshotLock, type SnapshotLock, snapshotKey } from './snapshotLock.ts'
import {
  type CiSource,
  type CiStore,
  ciOf,
  ciRunsOf,
  type JobRun,
  jobRunsOf,
  type KeptCi,
  windowOf,
} from './repositoryCi.ts'

export type ProjectFault = { readonly reason: 'failed'; readonly code: string }

/** A project folder of the brain, as its `project.yaml` gives it. */
export type ProjectRecord = {
  readonly slug: ProjectSlug
  readonly name: string
  readonly purpose: string
  readonly icon: string | null
  readonly repositories: readonly ProjectRepository[]
  /** The key of the first team of its `linear:` list (the QA tab's issues), such as "NCC"; none when it names none. */
  readonly linearTeam?: string
}

/** An idea record: its row, its Markdown after the front matter and its file (`ideas/<name>.md`, from the folder entry's name, never its text). */
export type IdeaRecord = { readonly idea: Idea; readonly body: string; readonly file: IdeaFile | null }

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

/** A repository's snapshot on `main`: its folder, for the adapters only, and its commit. */
type RepositorySnapshot = { readonly dir: string; readonly commit: string }

/** The server's own shallow clones of the GitHub repositories, one for each GitHub repository. */
export type SnapshotSource = {
  sync(github: { readonly owner: string; readonly name: string }): Promise<Result<RepositorySnapshot, ProjectFault>>
}

/** The `agents-md` check of a snapshot folder: its first findings and the count of all of them. */
export type RepositoryCheck = {
  run(
    dir: string,
  ): Promise<Result<{ readonly findings: readonly RepositoryDriftFinding[]; readonly total: number }, ProjectFault>>
}

/** The last drift run of each repository, by project slug and repository ID. */
export type RepositoryDriftRuns = Readonly<Record<string, Readonly<Record<string, RepositoryDriftRun>>>>

export type RepositoryDriftStore = {
  load(): Promise<Result<RepositoryDriftRuns, ProjectFault>>
  save(runs: RepositoryDriftRuns): Promise<Result<void, ProjectFault>>
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
  /** The last CI answer of each repository across restarts; with none, it is kept in memory only. */
  readonly ciStore?: CiStore
  /** Where a CI read tells a fault code or a part's duration; never a repository's owner or name. */
  readonly ciLog?: CiLog
  /** A repository's drift check (R7); with none, each repository drift read fails. */
  readonly repositoryDrift?: {
    readonly snapshots: SnapshotSource
    readonly check: RepositoryCheck
    readonly store: RepositoryDriftStore
  }
  /** The chats and their tags; none (each chats read fails) where an app has no agents to give. */
  readonly agents?: Pick<AgentPort, 'listWorkspaces' | 'chatTags'>
  /** The lock of each snapshot, shared with the Architecture runner; with none, the service has its own. */
  readonly snapshotLock?: SnapshotLock
  readonly now?: () => Date
}

type NotFound = 'notFound'

/** What a CI read tells the log: a fault code, or the milliseconds of one part. */
type CiLog = (
  event:
    | { readonly kind: 'failed'; readonly code: string }
    | { readonly kind: 'timed'; readonly part: 'runs' | 'merged' | 'jobs'; readonly ms: number },
) => void

/** A drift run's answer, and the fault code of a check that failed (for the log), else null. */
type DriftRunOutcome = { readonly drift: DriftResponse; readonly code: string | null }

/** A repository drift run's answer, and the fault code of a run that failed (for the log), else null. */
type RepositoryDriftOutcome = { readonly drift: RepositoryDriftResponse; readonly code: string | null }

export type Projects = {
  list(): Promise<Result<ProjectsResponse, ProjectFault>>
  get(slug: ProjectSlug): Promise<Result<ProjectDetailResponse | NotFound, ProjectFault>>
  pin(slug: ProjectSlug, pinned: boolean): Promise<Result<ProjectSummary | NotFound, ProjectFault>>
  ideas(slug: ProjectSlug): Promise<Result<IdeasResponse | NotFound, ProjectFault>>
  idea(slug: ProjectSlug, id: IdeaId): Promise<Result<IdeaDetailResponse | NotFound, ProjectFault>>
  drift(slug: ProjectSlug): Promise<Result<DriftResponse | NotFound, ProjectFault>>
  /** The Repositories tab (R2, R5, R8): a part that does not read is named in `unread`, never a fault. */
  repositories(slug: ProjectSlug): Promise<Result<RepositoriesResponse | NotFound, ProjectFault>>
  /**
   * A repository's CI numbers (R4, R6): the kept answer at once, and one read in the background when there is none or
   * it is `ciKeptMs` old.
   */
  ci(slug: ProjectSlug, repository: RepositoryId): Promise<Result<RepositoryCiResponse | NotFound, ProjectFault>>
  runDrift(slug: ProjectSlug): Promise<Result<DriftRunOutcome | NotFound, ProjectFault>>
  /** The last drift check of one repository of the project (R7), null before the first. */
  repositoryDrift(
    slug: ProjectSlug,
    repository: RepositoryId,
  ): Promise<Result<RepositoryDriftResponse | NotFound, ProjectFault>>
  /** Syncs the repository's snapshot and checks it; a part that fails is a `failed` run, never a fault. */
  runRepositoryDrift(
    slug: ProjectSlug,
    repository: RepositoryId,
  ): Promise<Result<RepositoryDriftOutcome | NotFound, ProjectFault>>
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

/** How old a repository's kept CI numbers may be before a read starts a new gh read for it. */
const ciKeptMs = 600_000

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
  ciStore,
  ciLog = () => undefined,
  repositoryDrift,
  snapshotLock = createSnapshotLock(),
  now = () => new Date(),
}: Deps): Projects {
  const watchers = new Set<() => void>()
  const changed = () => {
    for (const watcher of [...watchers]) watcher()
  }
  const pulls = keptPulls(source, now, changed)
  const facts = factsSource === undefined ? undefined : keptFacts(factsSource, now)
  const notRead = Promise.resolve(err({ reason: 'failed' as const, code: 'no-source' }))

  type GithubName = { readonly owner: string; readonly name: string }
  /** `failedAt`: the time (ms) of the last read that failed, else null; no read starts within `ciKeptMs` of it. */
  type CiEntry = { kept: KeptCi | null; loaded: Promise<void> | null; running: boolean; failedAt: number | null }
  const ciEntries = new Map<string, CiEntry>()
  const timed = async <T>(part: 'runs' | 'merged' | 'jobs', read: Promise<T>): Promise<T> => {
    const start = performance.now()
    const value = await read
    ciLog({ kind: 'timed', part, ms: Math.round(performance.now() - start) })
    return value
  }
  const readCi = async (source: CiSource, github: GithubName): Promise<Result<RepositoryCi, ProjectFault>> => {
    const since = new Date(now().getTime() - ciWindowDays * 86_400_000).toISOString()
    const [runs, merged] = await Promise.all([
      timed('runs', source.runs(github, since)),
      timed('merged', source.merged(github, since)),
    ])
    if (!runs.ok) return runs
    if (!merged.ok) return merged
    const ciRuns = ciRunsOf(runs.value)
    const reads = await timed(
      'jobs',
      Promise.all(jobRunsOf(ciRuns).map((run) => Promise.all(run.runs.map((r) => source.jobs(github, r.id))))),
    )
    const jobs: JobRun[][] = []
    for (const read of reads) {
      const got: JobRun[] = []
      for (const r of read) {
        if (!r.ok) return r
        got.push(...r.value)
      }
      jobs.push(got)
    }
    return ok(ciOf(windowOf(since, runs.value), ciRuns, merged.value, jobs))
  }
  /** Removes the kept answers of the repositories no project names; only after a list read that succeeded. */
  const pruneCi = async () => {
    if (ciStore === undefined) return
    const listed = await brain.list()
    if (!listed.ok) return
    const pruned = await ciStore.prune(
      listed.value.flatMap((p) => p.repositories.flatMap((r) => (r.github === null ? [] : [r.github]))),
    )
    if (!pruned.ok) ciLog({ kind: 'failed', code: pruned.error.code })
  }
  /**
   * One read of a repository in the background, as `keptPulls` runs one: a read that throws is the fault `threw`, so
   * no rejection is left unhandled, and a failed read keeps the old answer. The watchers hear of each read that ends,
   * good or failed, so a page that showed `reading` reads the end and the new `readAt`.
   */
  const refreshCi = (source: CiSource, entry: CiEntry, github: GithubName) => {
    entry.running = true
    const readAt = now().toISOString()
    void readCi(source, github)
      .catch((): Result<RepositoryCi, ProjectFault> => err({ reason: 'failed', code: 'threw' }))
      .then(async (read) => {
        if (!read.ok) {
          ciLog({ kind: 'failed', code: read.error.code })
          entry.failedAt = now().getTime()
          return
        }
        entry.failedAt = null
        entry.kept = { ci: read.value, readAt }
        const saved = await ciStore?.save(github, entry.kept)
        if (saved !== undefined && !saved.ok) ciLog({ kind: 'failed', code: saved.error.code })
        await pruneCi()
      })
      .catch(() => undefined)
      .then(() => {
        entry.running = false
        changed()
      })
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

  type Checked = { readonly commit: string | null; readonly run: Awaited<ReturnType<RepositoryCheck['run']>> }
  // One request for a snapshot while its run waits or runs gets that run. The shared lock holds the sync and the
  // check, so no sync (of a drift run or a diagram run) changes files that a check reads. A diagram run does not
  // join a drift run, so a drift run can wait in the lock's chain behind one (NCC-182 item 2).
  const snapshotRuns = new Map<string, Promise<Checked>>()
  const checkSnapshot = (repository: ProjectRepository): Promise<Checked> => {
    const github = repository.github
    const key = github === null ? `id:${repository.id}` : snapshotKey(github)
    const joined = snapshotRuns.get(key)
    if (joined !== undefined) return joined
    const work = async (): Promise<Checked> => {
      if (repositoryDrift === undefined) return { commit: null, run: err({ reason: 'failed', code: 'no-source' }) }
      // No snapshot can come from a repository off GitHub: the file protocol is off, and a main clone is never read.
      if (github === null) return { commit: null, run: err({ reason: 'failed', code: 'no-github' }) }
      const snapshot = await repositoryDrift.snapshots.sync(github)
      if (!snapshot.ok) return { commit: null, run: snapshot }
      return { commit: snapshot.value.commit, run: await repositoryDrift.check.run(snapshot.value.dir) }
    }
    const started = snapshotLock.hold(key, work)
    snapshotRuns.set(key, started)
    void started
      .catch(() => undefined)
      .then(() => {
        if (snapshotRuns.get(key) === started) snapshotRuns.delete(key)
      })
    return started
  }
  const repositoryOf = async (
    slug: ProjectSlug,
    id: RepositoryId,
  ): Promise<Result<ProjectRepository | NotFound, ProjectFault>> => {
    const record = await recordOf(slug)
    if (!record.ok) return record
    if (record.value === 'notFound') return ok('notFound')
    return ok(record.value.repositories.find((r) => r.id === id) ?? 'notFound')
  }

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
      return ok(found === undefined ? 'notFound' : { idea: found.idea, body: found.body, file: found.file })
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
      if (github === null) return ok({ ci: null, readAt: null, reading: false })
      const key = `${github.owner}/${github.name}`.toLowerCase()
      const entry = ciEntries.get(key) ?? { kept: null, loaded: null, running: false, failedAt: null }
      ciEntries.set(key, entry)
      // The store is read once for each repository; a server that restarts answers from it at once.
      entry.loaded ??= (ciStore?.load(github) ?? Promise.resolve(null)).then(
        (stored) => {
          entry.kept ??= stored
        },
        () => undefined,
      )
      await entry.loaded
      const kept = entry.kept
      const at = now().getTime()
      const old = kept === null || at - Date.parse(kept.readAt) >= ciKeptMs
      // A read that failed holds the next one off for ciKeptMs, so a GitHub fault and its event never loop.
      const failedNow = entry.failedAt !== null && at - entry.failedAt < ciKeptMs
      if (ci !== undefined && !entry.running && old && !failedNow) refreshCi(ci, entry, github)
      return ok({ ci: kept?.ci ?? null, readAt: kept?.readAt ?? null, reading: entry.running })
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
    async repositoryDrift(slug, id) {
      const repository = await repositoryOf(slug, id)
      if (!repository.ok) return repository
      if (repository.value === 'notFound') return ok('notFound')
      if (repositoryDrift === undefined) return err({ reason: 'failed', code: 'no-source' })
      const runs = await repositoryDrift.store.load()
      if (!runs.ok) return runs
      const ofProject = Object.hasOwn(runs.value, slug) ? runs.value[slug] : undefined
      return ok({ last: ofProject !== undefined && Object.hasOwn(ofProject, id) ? (ofProject[id] ?? null) : null })
    },

    async runRepositoryDrift(slug, id) {
      const repository = await repositoryOf(slug, id)
      if (!repository.ok) return repository
      if (repository.value === 'notFound') return ok('notFound')
      if (repositoryDrift === undefined) return err({ reason: 'failed', code: 'no-source' })
      const store = repositoryDrift.store
      const { commit, run: checked } = await checkSnapshot(repository.value)
      const findings = checked.ok ? checked.value.findings : []
      const run: RepositoryDriftRun = {
        result: !checked.ok ? 'failed' : findings.length > 0 ? 'findings' : 'clean',
        checkedAt: now().toISOString(),
        commit,
        findings: [...findings],
        total: checked.ok ? checked.value.total : 0,
      }
      return serial(async () => {
        const runs = await store.load()
        if (!runs.ok) return runs
        const ofProject = Object.hasOwn(runs.value, slug) ? runs.value[slug] : undefined
        const saved = await store.save({ ...runs.value, [slug]: { ...ofProject, [id]: run } })
        if (!saved.ok) return saved
        return ok({ drift: { last: run }, code: checked.ok ? null : checked.error.code })
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
    repositoryDrift: fault,
    runRepositoryDrift: fault,
    chats: fault,
    watch,
  }
})()
