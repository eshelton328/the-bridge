// The Projects app (f-008, increments one and four, d-133): the brain's
// projects, the owner's pins, a project's open PRs, its idea records, its
// context drift, New project and Edit details and the idea actions; the
// Queue is in queue.ts. A URL names a project by its folder name (its slug) and an idea by
// its record ID, never by a path. No local path goes in a response: a
// repository gives its GitHub owner and name only, and a drift finding a
// path relative to the root of the chat tree.
import { z } from 'zod'
import { WorkspaceId } from './ids.ts'
import { ChatSummary } from './workspaces.ts'

/** The most characters of a project's name, an idea's title and a PR's title. */
export const maxProjectTitle = 200
/** The most characters of a project's purpose and an idea's summary. */
export const maxProjectSummary = 1_000
/** The most characters of an idea record's text in its detail. */
export const maxIdeaBody = 65_536
/** The most open PRs that the queue gives for one repository. */
export const maxRepositoryPulls = 50
/** The most findings that a drift run keeps. */
export const maxDriftFindings = 200

/** A project's folder name under the brain's `projects/`, such as "ncc-1701". */
export const ProjectSlug = z.string().regex(/^[a-z0-9][a-z0-9._-]{0,63}$/)
export type ProjectSlug = z.infer<typeof ProjectSlug>

/** The name of a library icon that the owner set for a project, such as "rocket"; null shows the name's first letter. */
export const ProjectIcon = z.string().regex(/^[a-z0-9][a-z0-9-]{0,39}$/)
export type ProjectIcon = z.infer<typeof ProjectIcon>

/** One card of the Projects home (R2, R3). */
export const ProjectSummary = z.strictObject({
  slug: ProjectSlug,
  name: z.string().min(1).max(maxProjectTitle),
  purpose: z.string().max(maxProjectSummary),
  icon: ProjectIcon.nullable(),
  /** The owner pinned it: it shows first on every device. */
  pinned: z.boolean(),
})
export type ProjectSummary = z.infer<typeof ProjectSummary>

/** The response of `GET /api/projects`: the pinned projects first, then the others, each part by name. */
export const ProjectsResponse = z.strictObject({ projects: z.array(ProjectSummary) })
export type ProjectsResponse = z.infer<typeof ProjectsResponse>

/** A repository's ID in `project.yaml`, such as "the-bridge". */
export const RepositoryId = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/)
export type RepositoryId = z.infer<typeof RepositoryId>

/** A GitHub owner or repository name. */
const GitHubName = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/)

/** One repository of a project, as `project.yaml` lists it. */
export const ProjectRepository = z.strictObject({
  id: RepositoryId,
  role: z.string().max(maxProjectSummary),
  /** The GitHub repository; null for one that is not on GitHub (a local folder), which has no PRs here. */
  github: z.strictObject({ owner: GitHubName, name: GitHubName }).nullable(),
})
export type ProjectRepository = z.infer<typeof ProjectRepository>

/**
 * The status pill of an open PR: a draft, a PR whose checks failed or still run, or one that waits for review
 * (its checks passed or it has none).
 */
export const PullStatus = z.enum(['draft', 'ciFailed', 'ciRunning', 'inReview'])
export type PullStatus = z.infer<typeof PullStatus>

/** One open PR of the Queue's "In progress" group (R6). */
export const ProjectPull = z.strictObject({
  repository: RepositoryId,
  number: z.number().int().positive(),
  title: z.string().max(maxProjectTitle),
  /** The PR's page on GitHub. */
  url: z.url({ protocol: /^https$/, hostname: /^github\.com$/ }),
  /** The PR's branch, which names its issue and so its owner chat. */
  branch: z.string().max(255),
  status: PullStatus,
  updatedAt: z.iso.datetime(),
})
export type ProjectPull = z.infer<typeof ProjectPull>

/** The response of `GET /api/projects/:slug`: the project, its repositories and its open PRs. */
export const ProjectDetailResponse = z.strictObject({
  project: ProjectSummary,
  repositories: z.array(ProjectRepository),
  queue: z.strictObject({
    /** The open PRs of each GitHub repository, the newest change first. */
    inProgress: z.array(ProjectPull),
    /** The repositories whose PRs the server could not read now; the page says so beside the group. */
    unread: z.array(RepositoryId),
  }),
})
export type ProjectDetailResponse = z.infer<typeof ProjectDetailResponse>

/** A repository's visibility on GitHub (R2). */
export const RepositoryVisibility = z.enum(['public', 'private', 'internal'])
export type RepositoryVisibility = z.infer<typeof RepositoryVisibility>

/** A repository's newest GitHub release, pre-releases included (R2). */
export const RepositoryRelease = z.strictObject({
  tag: z.string().min(1).max(255),
  url: z.url({ protocol: /^https$/, hostname: /^github\.com$/ }),
  publishedAt: z.iso.datetime(),
})
export type RepositoryRelease = z.infer<typeof RepositoryRelease>

/** A part of a section not read now (R8): `about` (visibility, release), `pulls` or `worktrees`. */
export const RepositoryPart = z.enum(['about', 'pulls', 'worktrees'])
export type RepositoryPart = z.infer<typeof RepositoryPart>

/** One section of the Repositories tab (R2, R3, R5, R8). A part not read, or with no GitHub repository, is null. */
export const RepositorySection = z.strictObject({
  ...ProjectRepository.shape,
  visibility: RepositoryVisibility.nullable(),
  release: RepositoryRelease.nullable(),
  /** The open PRs, at most `maxRepositoryPulls`. */
  openPulls: z.number().int().min(0).max(maxRepositoryPulls).nullable(),
  /** The git worktrees in the repository's `-worktrees` folder of the chat root. */
  worktrees: z.number().int().min(0).nullable(),
  unread: z.array(RepositoryPart),
})
export type RepositorySection = z.infer<typeof RepositorySection>

/** The response of `GET /api/projects/:slug/repositories`: one section for each repository, in `project.yaml`'s order. */
export const RepositoriesResponse = z.strictObject({ repositories: z.array(RepositorySection) })
export type RepositoriesResponse = z.infer<typeof RepositoriesResponse>

/** The days of CI history that a repository's CI numbers cover (R4). */
export const ciWindowDays = 30
/** The most job names that a repository's CI numbers give. */
export const maxCiJobs = 50

/**
 * A repository's CI numbers (R4, R6) from its GitHub Actions runs since `since`: the last `ciWindowDays`, or less when
 * a busy repository has more runs than one read gives. A CI run is the push or pull_request workflow runs of one commit:
 * finished when each ended and none was cancelled (a skipped one is left out), green when each passed.
 */
export const RepositoryCi = z.strictObject({
  since: z.iso.datetime(),
  runs: z.strictObject({ green: z.number().int().min(0), finished: z.number().int().min(0) }),
  /** The median minutes of a green CI run, its first start to its last end; null with no green run, never 0. */
  runMinutes: z.number().min(0).nullable(),
  /** The PRs merged in the window, with the median and p90 hours from open to merge; each null with no PR, never 0. */
  merge: z.strictObject({
    count: z.number().int().min(0),
    medianHours: z.number().min(0).nullable(),
    p90Hours: z.number().min(0).nullable(),
  }),
  /** Each job's median minutes in the newest green CI runs, the slowest first. */
  jobs: z.array(z.strictObject({ name: z.string().min(1).max(200), medianMinutes: z.number().min(0) })).max(maxCiJobs),
  /** How many green CI runs the job medians come from. */
  jobRuns: z.number().int().min(0),
})
export type RepositoryCi = z.infer<typeof RepositoryCi>

/**
 * The response of `GET /api/projects/:slug/repositories/:repo/ci`: the last answer the server keeps, at once.
 * - `ci` null with `reading` false: not read, as a part in a `RepositorySection`'s `unread` (GitHub did not
 *   answer, or the repository is not on it). The page shows "not read", never "no CI".
 * - `ci` null with `reading` true: the first read of the repository runs; `projects.changed` follows when it ends.
 * - `ci` not null with `reading` true: a refresh runs; the page shows the kept numbers meanwhile.
 * `readAt` is the time of the GitHub read that gave `ci`, null exactly when `ci` is null; the page shows it when
 * it is older than 10 minutes.
 */
export const RepositoryCiResponse = z
  .strictObject({
    ci: RepositoryCi.nullable(),
    readAt: z.iso.datetime({ offset: true }).nullable(),
    reading: z.boolean(),
  })
  .refine((response) => (response.ci === null) === (response.readAt === null), {
    message: 'readAt is null exactly when ci is null',
    path: ['readAt'],
  })
export type RepositoryCiResponse = z.infer<typeof RepositoryCiResponse>

/** A chat tag the app reads (d-120): the key `project`, `area` or `role`, and a value written as a slug is. */
export const ChatTag = z.strictObject({
  key: z.enum(['project', 'area', 'role']),
  value: z.string().regex(/^[a-z0-9][a-z0-9._-]{0,63}$/),
})
export type ChatTag = z.infer<typeof ChatTag>
/** The most tags a chat shows: one for each key. */
export const maxChatTags = 3

/** One chat of a project's Chats panel (R7): the chat, its workspace and its tags, `project` among them. */
export const ProjectChat = z.strictObject({
  ...ChatSummary.pick({ id: true, kind: true, title: true, model: true, contextUsed: true, status: true, pane: true })
    .shape,
  workspace: z.strictObject({ id: WorkspaceId, label: z.string() }),
  tags: z.array(ChatTag).max(maxChatTags),
})
export type ProjectChat = z.infer<typeof ProjectChat>

/** The response of `GET /api/projects/:slug/chats`: the chats tagged with the project, in the workspaces' order. */
export const ProjectChatsResponse = z.strictObject({ chats: z.array(ProjectChat) })
export type ProjectChatsResponse = z.infer<typeof ProjectChatsResponse>

/** The body of `PUT /api/projects/:slug/pin`. */
export const PinProjectRequest = z.strictObject({ pinned: z.boolean() })
export type PinProjectRequest = z.infer<typeof PinProjectRequest>

/** The response of `PUT /api/projects/:slug/pin`: the card as the home shows it now. */
export const PinProjectResponse = z.strictObject({ project: ProjectSummary })
export type PinProjectResponse = z.infer<typeof PinProjectResponse>

/** An idea record's ID, the UUID in its front matter. */
export const IdeaId = z.uuid()
export type IdeaId = z.infer<typeof IdeaId>

/** The kind of an idea record (`kind` in its front matter); a record with none is an idea. */
export const IdeaKind = z.enum(['idea', 'proposal', 'audit'])
export type IdeaKind = z.infer<typeof IdeaKind>

/** The state of an idea record (`state` in its front matter); a record with none is open. */
export const IdeaState = z.enum(['open', 'in-design', 'needs-you', 'decided', 'parked'])
export type IdeaState = z.infer<typeof IdeaState>

/** One row of the Ideas tab (R10). */
export const Idea = z.strictObject({
  id: IdeaId,
  title: z.string().min(1).max(maxProjectTitle),
  /** The record's first paragraph after its heading, as one line; empty when it has none. */
  summary: z.string().max(maxProjectSummary),
  /** The record's `tags`; none when it has no such key. */
  tags: z.array(z.string().min(1).max(100)).max(20),
  kind: IdeaKind,
  state: IdeaState,
  /** The record's `updated`, else its `created`. */
  updated: z.iso.datetime(),
})
export type Idea = z.infer<typeof Idea>

/** The response of `GET /api/projects/:slug/ideas`: the project's idea records, the newest change first. */
export const IdeasResponse = z.strictObject({ ideas: z.array(Idea) })
export type IdeasResponse = z.infer<typeof IdeasResponse>

/**
 * An idea record's file, relative to its project's brain folder: `ideas/<name>.md`, one plain name, so never `..`,
 * a leading `/` or a folder. "Chat about this idea" names it in the chat's first message (NCC-132 AC2). The one
 * path in a Projects response: never in a URL, a log or an error body.
 */
export const IdeaFile = z.string().regex(/^ideas\/[A-Za-z0-9._-]+\.md$/)
export type IdeaFile = z.infer<typeof IdeaFile>

/**
 * Where an idea came from, by its `source` key: a chat with the owner ("<owner>'s discussion" or a request), a capture
 * record, the vault inbox, or another source. Only the kind: the source text can hold the owner's name.
 */
export const IdeaSource = z.enum(['chat', 'capture', 'inbox', 'other'])
export type IdeaSource = z.infer<typeof IdeaSource>

/** The most links an idea's detail gives. */
export const maxIdeaLinks = 50

/**
 * A brain record that an idea's body links to: another idea (with its ID, so the page can open it), a decision or a
 * feature (with its `d-NNN` or `f-NNN`), and the record's title. No path: links to other files are left out.
 */
export const IdeaLink = z
  .strictObject({
    kind: z.enum(['idea', 'decision', 'feature']),
    ref: z
      .string()
      .regex(/^[df]-\d{3}$/)
      .nullable(),
    title: z.string().min(1).max(maxProjectTitle),
    idea: IdeaId.nullable(),
  })
  .refine((l) => (l.kind === 'idea') === (l.idea !== null) && (l.kind === 'idea') === (l.ref === null), {
    message: 'an idea link has an idea ID and no ref; a decision or feature link has a ref and no idea ID',
  })
  .refine((l) => l.ref === null || l.ref.startsWith(l.kind === 'decision' ? 'd-' : 'f-'), {
    message: 'a decision ref is d-NNN and a feature ref f-NNN',
    path: ['ref'],
  })
export type IdeaLink = z.infer<typeof IdeaLink>

/**
 * The response of `GET /api/projects/:slug/ideas/:id`: the row, the record's Markdown after its front matter (R11),
 * its file (null when the file's name does not fit `IdeaFile`), its `created` time and source kind (each null when
 * the record has none) and the records its body links to, in body order.
 */
export const IdeaDetailResponse = z.strictObject({
  idea: Idea,
  body: z.string().max(maxIdeaBody),
  file: IdeaFile.nullable(),
  created: z.iso.datetime().nullable(),
  source: IdeaSource.nullable(),
  links: z.array(IdeaLink).max(maxIdeaLinks),
})
export type IdeaDetailResponse = z.infer<typeof IdeaDetailResponse>

/** One problem that `ncc check` found in the project's part of the layout. */
export const DriftFinding = z.strictObject({
  /** The problem's line, with each path in it relative to the root of the chat tree. */
  text: z.string().min(1).max(1_000),
})
export type DriftFinding = z.infer<typeof DriftFinding>

/**
 * The result of one `ncc check` run (R9): `clean` with no finding for the project, `findings`, or `failed` when the
 * command did not run or gave no answer the server reads.
 */
export const DriftRun = z
  .strictObject({
    result: z.enum(['clean', 'findings', 'failed']),
    checkedAt: z.iso.datetime(),
    findings: z.array(DriftFinding).max(maxDriftFindings),
  })
  .refine((r) => (r.result === 'findings') === r.findings.length > 0, {
    message: 'only a run with findings lists findings',
    path: ['findings'],
  })
export type DriftRun = z.infer<typeof DriftRun>

/** The response of `GET` and `POST /api/projects/:slug/drift`: the last run, null before the first. */
export const DriftResponse = z.strictObject({ last: DriftRun.nullable() })
export type DriftResponse = z.infer<typeof DriftResponse>

/** The body of `POST /api/projects/:slug/drift`. */
export const RunDriftRequest = z.strictObject({})
export type RunDriftRequest = z.infer<typeof RunDriftRequest>

// Increment four (f-008): New project, Edit details, the Queue on Linear priorities and the idea actions.

/** A line break, a control character or a Unicode line or paragraph separator. */
const notOneLine = /[\p{Cc}\p{Zl}\p{Zp}]/u

/** One line of text that the owner types: trimmed, no line break and no control character. */
const oneLine = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .refine((s) => !notOneLine.test(s), 'one line, with no control characters')

/**
 * The body of `POST /api/projects` (New project, R2) and `PATCH /api/projects/:slug` (Edit details, R8): the name,
 * the description (`purpose` in `project.yaml`, may be empty) and the icon, or null for the name's first letter. The
 * server makes the slug from the name and checks that the library has the icon (R4).
 */
export const ProjectDetailsRequest = z.strictObject({
  name: oneLine(1, maxProjectTitle),
  purpose: oneLine(0, maxProjectSummary),
  icon: ProjectIcon.nullable(),
})
export type ProjectDetailsRequest = z.infer<typeof ProjectDetailsRequest>

/** The answer of a create (201) or an edit (200): the project's card. */
export const ProjectDetailsResponse = z.strictObject({ project: ProjectSummary })
export type ProjectDetailsResponse = z.infer<typeof ProjectDetailsResponse>

/** The query of `GET /api/projects/-/slug`: the name as the owner types it. */
export const SlugQuery = z.strictObject({ name: z.string().max(maxProjectTitle) })
export type SlugQuery = z.infer<typeof SlugQuery>

/**
 * The answer of `GET /api/projects/-/slug` (R2, R3): the slug of the name, or null when the name gives no valid
 * slug, and whether no brain project or machine folder has it.
 */
export const SlugResponse = z.strictObject({ slug: ProjectSlug.nullable(), free: z.boolean() })
export type SlugResponse = z.infer<typeof SlugResponse>

/** The body of `PUT /api/projects/:slug/ideas/:id/state` (R17): Park or Reopen only. */
export const IdeaStateRequest = z.strictObject({ state: z.enum(['parked', 'open']) })
export type IdeaStateRequest = z.infer<typeof IdeaStateRequest>

/** The answer of an idea state change: the idea's row. */
export const IdeaStateResponse = z.strictObject({ idea: Idea })
export type IdeaStateResponse = z.infer<typeof IdeaStateResponse>

/** A feature's ID, such as "f-009". */
export const FeatureId = z.string().regex(/^f-[0-9]{3,}$/)
export type FeatureId = z.infer<typeof FeatureId>

/** The body of `POST /api/projects/:slug/ideas/:id/feature` (R15). */
export const MakeFeatureRequest = z.strictObject({})
export type MakeFeatureRequest = z.infer<typeof MakeFeatureRequest>

/** The answer of Make a feature (201): the new feature's ID and the idea's row, now In design (R16). */
export const MakeFeatureResponse = z.strictObject({ feature: FeatureId, idea: Idea })
export type MakeFeatureResponse = z.infer<typeof MakeFeatureResponse>

/**
 * The kinds of problem that the `agents-md` check prints (increment two, R7); the panel groups the findings by kind. A
 * kind the check adds later fails the run (`unknown-kind`) until it is added here.
 */
export const AgentsMdKind = z.enum([
  'missing',
  'shim',
  'stray',
  'unlinked',
  'dead-link',
  'old-pointer',
  'over-budget',
  'stub',
  'exempt',
])
export type AgentsMdKind = z.infer<typeof AgentsMdKind>

/** True when `p` has a control character (code below 32, or 127). */
const hasControl = (p: string) => {
  for (let i = 0; i < p.length; i += 1) {
    const code = p.charCodeAt(i)
    if (code < 32 || code === 127) return true
  }
  return false
}

/**
 * A path in a repository, from its root: no leading "/", no empty, "." or ".." part, no control character and no
 * backslash, as a file name may hold an escape character. The one schema for such a path: a field that may name the
 * root folder takes `RepositoryPathOrRoot`.
 */
export const RepositoryPath = z
  .string()
  .min(1)
  .max(500)
  .refine((p) => !p.includes('\\') && !hasControl(p), { message: 'no control character or backslash' })
  .refine((p) => p.split('/').every((part) => part !== '' && part !== '.' && part !== '..'), {
    message: 'a path from the repository root',
  })
export type RepositoryPath = z.infer<typeof RepositoryPath>

/** A `RepositoryPath`, or "." for the repository's root folder. */
export const RepositoryPathOrRoot = z.union([z.literal('.'), RepositoryPath])
export type RepositoryPathOrRoot = z.infer<typeof RepositoryPathOrRoot>

/** One problem of the `agents-md` check on a repository's snapshot: its kind, its path and the rest of its line. */
export const RepositoryDriftFinding = z.strictObject({
  kind: AgentsMdKind,
  path: RepositoryPathOrRoot,
  /** The text after the path, such as "(165 > 60 lines)", with any local path masked; null when the line has none. */
  detail: z.string().min(1).max(500).nullable(),
})
export type RepositoryDriftFinding = z.infer<typeof RepositoryDriftFinding>

/**
 * One `agents-md` check of a repository (R7): `clean`, `findings` or `failed` (no snapshot, or no answer the server
 * reads), with the snapshot's commit on `main` (null when the snapshot did not sync). `findings` holds the first
 * `maxDriftFindings` and `total` counts them all, so the page can say "200 of N".
 */
export const RepositoryDriftRun = z
  .strictObject({
    result: z.enum(['clean', 'findings', 'failed']),
    checkedAt: z.iso.datetime(),
    commit: z
      .string()
      .regex(/^[0-9a-f]{40}$/)
      .nullable(),
    findings: z.array(RepositoryDriftFinding).max(maxDriftFindings),
    total: z.number().int().nonnegative(),
  })
  .refine((r) => (r.result === 'findings') === r.findings.length > 0, {
    message: 'only a run with findings lists findings',
    path: ['findings'],
  })
  .refine((r) => r.findings.length === Math.min(r.total, maxDriftFindings), {
    message: 'the run lists its first findings and counts them all',
    path: ['total'],
  })
export type RepositoryDriftRun = z.infer<typeof RepositoryDriftRun>

/** The response of `GET` and `POST /api/projects/:slug/repositories/:repo/drift`: the last run, null before the first. */
export const RepositoryDriftResponse = z.strictObject({ last: RepositoryDriftRun.nullable() })
export type RepositoryDriftResponse = z.infer<typeof RepositoryDriftResponse>
