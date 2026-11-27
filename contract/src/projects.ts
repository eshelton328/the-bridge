// The Projects app (f-008, increment one, d-133): the brain's projects, the
// owner's pins, a project's open PRs, its idea records and its context
// drift. A URL names a project by its folder name (its slug) and an idea by
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

/** The response of `GET /api/projects/:slug/ideas/:id`: the row and the record's Markdown after its front matter (R11). */
export const IdeaDetailResponse = z.strictObject({ idea: Idea, body: z.string().max(maxIdeaBody) })
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
