// The QA tab of the Projects app (f-008, increment three, d-126): the Linear
// issues that wait for the owner's check, a build of a branch to check
// (a launch), and the review threads with their drafts. An issue is named by
// its Linear key and a draft by a server ID, never by a path; a launch gives
// its tailnet URL only. Comment text goes only into an item page.
import { z } from 'zod'
import { ChatId, QaDraftId, QaFileId, UploadId } from './ids.ts'
import { maxProjectTitle, RepositoryId } from './projects.ts'
import { maxAttachments } from './prompts.ts'

/** The DNS suffix of every tailnet host; a launch URL names a host under it and no other. */
export const tailnetSuffix = '.ts.net'

/** A host name of the tailnet: labels of letters, digits and hyphens, then `tailnetSuffix`. */
const tailnetHost = /^[a-z0-9-]+(\.[a-z0-9-]+)*\.ts\.net$/

/** The most characters of one comment or draft. */
export const maxQaText = 10_000
/** The most characters of the part of the screen that a thread is about. */
export const maxQaAnchor = 200
/** The most steps of "What to check", and the characters of one. */
export const maxQaSteps = 30
export const maxQaStep = 500

/** A Linear issue's key, such as "NCC-123"; a path word such as "stop" is not one. */
export const QaIssueId = z
  .string()
  .max(32)
  .regex(/^[A-Z]+-[0-9]+$/)
export type QaIssueId = z.infer<typeof QaIssueId>

/** Before merge: the `Branch` label, in the state QA. After merge: the `Main` label, in the state Done. */
export const QaPhase = z.enum(['beforeMerge', 'afterMerge'])
export type QaPhase = z.infer<typeof QaPhase>

/** The item's status pill (R4). */
export const QaStatus = z.enum(['waiting', 'changesRequested', 'ciFailing', 'approved'])
export type QaStatus = z.infer<typeof QaStatus>

/** The item's worktree pill (R4); an after-merge item is on the served app. */
export const QaWorktree = z.enum(['stopped', 'starting', 'running', 'failed', 'servedApp'])
export type QaWorktree = z.infer<typeof QaWorktree>

/** Why Launch is off (R9): the PR's CI fails, the issue has no PR, the repository has no method, or no ask. */
export const QaLaunchBlock = z.enum(['ciFailing', 'noPr', 'noMethod', 'noAsk'])
export type QaLaunchBlock = z.infer<typeof QaLaunchBlock>

/** One row of the QA tab (R2 to R4). */
export const QaItem = z
  .strictObject({
    issue: QaIssueId,
    title: z.string().min(1).max(maxProjectTitle),
    phase: QaPhase,
    /** The repository that the ask names, when `project.yaml` lists it. */
    repository: RepositoryId.nullable(),
    pr: z.number().int().positive().nullable(),
    status: QaStatus,
    worktree: QaWorktree,
    comments: z.number().int().min(0),
    /** The time of the newest `QA check` comment; null when the issue has none. */
    askedAt: z.iso.datetime().nullable(),
    issueUrl: z.url({ protocol: /^https$/, hostname: /^linear\.app$/ }),
    launch: z.strictObject({
      /** The running build's tailnet URL. */
      url: z.url({ protocol: /^https$/, hostname: tailnetHost }).nullable(),
      blocked: QaLaunchBlock.nullable(),
    }),
  })
  .refine((i) => (i.phase === 'afterMerge') === (i.worktree === 'servedApp'), {
    message: 'only an after-merge item is on the served app',
    path: ['worktree'],
  })
export type QaItem = z.infer<typeof QaItem>

/** The response of `GET /api/projects/:slug/qa`. */
export const QaListResponse = z.strictObject({ items: z.array(QaItem) })
export type QaListResponse = z.infer<typeof QaListResponse>

/** A file of a comment; the page reads it from the server by its ID, never from Linear. */
export const QaAttachment = z.strictObject({
  id: QaFileId,
  name: z.string().min(1).max(255),
  kind: z.enum(['image', 'video', 'file']),
})
export type QaAttachment = z.infer<typeof QaAttachment>

/** One comment of a thread (R12). */
export const QaComment = z.strictObject({
  /** Linear's comment ID. */
  id: z.uuid(),
  /** The owner, or the agent chat that wrote it. */
  author: z.strictObject({ kind: z.enum(['owner', 'agent']), name: z.string().min(1).max(100) }),
  at: z.iso.datetime(),
  text: z.string().max(maxQaText),
  attachments: z.array(QaAttachment).max(maxAttachments),
})
export type QaComment = z.infer<typeof QaComment>

/** A thread: its first comment and the replies, with the part of the screen it is about. */
export const QaThread = z.strictObject({
  anchor: z.string().max(maxQaAnchor).nullable(),
  comments: z.array(QaComment).min(1),
})
export type QaThread = z.infer<typeof QaThread>

/** A comment or reply that waits for Submit (R13). */
export const QaDraft = z.strictObject({
  id: QaDraftId,
  /** The first comment of the thread it answers; null for a new thread. */
  thread: z.uuid().nullable(),
  anchor: z.string().max(maxQaAnchor).nullable(),
  text: z.string().max(maxQaText),
  attachments: z.array(z.strictObject({ upload: UploadId, name: z.string().min(1).max(255) })).max(maxAttachments),
})
export type QaDraft = z.infer<typeof QaDraft>

/** The response of `GET /api/projects/:slug/qa/:issue` (R11 to R13). */
export const QaItemDetailResponse = z.strictObject({
  item: QaItem,
  steps: z.array(z.string().min(1).max(maxQaStep)).max(maxQaSteps),
  /** The launch method's label, such as "Web app over Tailscale"; null when the repository has none. */
  method: z.string().max(100).nullable(),
  /** The owner chat, when the workspace list has it now. */
  owner: ChatId.nullable(),
  threads: z.array(QaThread),
  drafts: z.array(QaDraft),
})
export type QaItemDetailResponse = z.infer<typeof QaItemDetailResponse>

/** The body of `PUT /api/projects/:slug/qa/:issue/drafts/:draft`: text or files, upload IDs only. */
export const QaDraftRequest = z
  .strictObject({
    thread: z.uuid().nullable(),
    anchor: z.string().trim().max(maxQaAnchor).nullable(),
    text: z.string().trim().max(maxQaText),
    attachments: z.array(UploadId).max(maxAttachments),
  })
  .refine((d) => d.text.length > 0 || d.attachments.length > 0, {
    message: 'a draft needs text or a file',
    path: ['text'],
  })
export type QaDraftRequest = z.infer<typeof QaDraftRequest>

/** The response of a draft save. */
export const QaDraftResponse = z.strictObject({ draft: QaDraft })
export type QaDraftResponse = z.infer<typeof QaDraftResponse>

/** The owner's answer (d-126): Approved, Changes requested or Denied. */
export const QaAnswer = z.enum(['approve', 'changes', 'deny'])
export type QaAnswer = z.infer<typeof QaAnswer>

/** The body of `POST /api/projects/:slug/qa/:issue/review` (R14). */
export const QaReviewRequest = z.strictObject({ answer: QaAnswer })
export type QaReviewRequest = z.infer<typeof QaReviewRequest>

/** The response of a review: how many drafts went to Linear, and whether the owner chat got its prompt. */
export const QaReviewResponse = z.strictObject({ posted: z.number().int().min(0), prompted: z.boolean() })
export type QaReviewResponse = z.infer<typeof QaReviewResponse>

/** The body of a launch, a stop and a stop of all. */
export const QaActionRequest = z.strictObject({})
export type QaActionRequest = z.infer<typeof QaActionRequest>

/** The response of a launch or a stop: the row as the tab shows it now. */
export const QaItemResponse = z.strictObject({ item: QaItem })
export type QaItemResponse = z.infer<typeof QaItemResponse>
