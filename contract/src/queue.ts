// The Queue of the Projects app (f-008 increment four, d-133): a project's
// open PRs and its Linear projects and issues in priority order, and the
// priority and Move to Linear writes. An item is named by its hashed
// `QueueItemId` and an issue by its Linear key (`QaIssueId`), never by a
// path or a raw key in a URL.
import { z } from 'zod'
import { QueueItemId } from './ids.ts'
import { maxProjectTitle, maxRepositoryPulls, ProjectPull } from './projects.ts'
import { QaIssueId } from './qa.ts'

/** A Linear priority: 0 No priority, 1 Urgent, 2 High, 3 Medium, 4 Low. */
export const LinearPriority = z.int().min(0).max(4)
export type LinearPriority = z.infer<typeof LinearPriority>

/** The most issues that an "Up next" project lists. */
export const maxQueueIssues = 200

/** An issue under an "Up next" project (R10): Backlog or Todo, in issue priority order. */
export const QueueIssue = z.strictObject({
  id: QueueItemId,
  issue: QaIssueId,
  title: z.string().min(1).max(maxProjectTitle),
  state: z.string().min(1).max(50),
  priority: LinearPriority,
})
export type QueueIssue = z.infer<typeof QueueIssue>

/** A Linear project of "Up next" (R9), not completed or canceled. */
export const QueueProject = z.strictObject({
  kind: z.literal('linearProject'),
  id: QueueItemId,
  name: z.string().min(1).max(maxProjectTitle),
  status: z.string().min(1).max(50),
  priority: LinearPriority,
  openIssues: z.int().min(0),
  issues: z.array(QueueIssue).max(maxQueueIssues),
})
export type QueueProject = z.infer<typeof QueueProject>

/** An open PR of "In progress" (R11): with the Linear issue that its branch names, or local with none. */
export const QueuePull = z
  .strictObject({
    kind: z.enum(['pull', 'local']),
    id: QueueItemId,
    pull: ProjectPull,
    issue: QaIssueId.nullable(),
    priority: LinearPriority,
  })
  .refine((p) => (p.kind === 'local') === (p.issue === null), {
    message: 'only a PR with no issue is local',
    path: ['issue'],
  })
export type QueuePull = z.infer<typeof QueuePull>

/**
 * The response of `GET /api/projects/:slug/queue`, each group in priority order. `linear` is `ok`, `noTeam` when
 * `project.yaml` names no team (R14), or `notRead` when the server could not read Linear.
 */
export const QueueResponse = z.strictObject({
  inProgress: z.array(QueuePull).max(maxRepositoryPulls * 10),
  upNext: z.array(QueueProject).max(100),
  linear: z.enum(['ok', 'noTeam', 'notRead']),
})
export type QueueResponse = z.infer<typeof QueueResponse>

/** The body of `PUT /api/projects/:slug/queue/priority` (R12): the item and its new priority. */
export const QueuePriorityRequest = z.strictObject({ item: QueueItemId, priority: LinearPriority })
export type QueuePriorityRequest = z.infer<typeof QueuePriorityRequest>

/** The body of `POST /api/projects/:slug/queue/local/:item/linear` (R13). */
export const MoveToLinearRequest = z.strictObject({})
export type MoveToLinearRequest = z.infer<typeof MoveToLinearRequest>

/** The answer of a Move to Linear (201): the new issue's key. */
export const MoveToLinearResponse = z.strictObject({ issue: QaIssueId })
export type MoveToLinearResponse = z.infer<typeof MoveToLinearResponse>
