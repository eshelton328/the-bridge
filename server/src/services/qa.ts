// The QA tab (f-008 increment three, d-126): the Linear issues of a project's
// team that wait for the owner's check, read through a port only when a
// request asks (d-112).
import {
  maxProjectTitle,
  maxQaText,
  type ProjectSlug,
  type QaComment,
  type QaIssueId,
  QaItem,
  QaItemDetailResponse,
  type QaListResponse,
  type QaThread,
} from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import { z } from 'zod'
import type { BrainProjects, ProjectRecord } from './projects.ts'
import { answerOf, askOf, isQaComment, type QaCommentText } from './qaAsk.ts'

/** An issue as the Linear port gives it: its key, title, link, state name, label names and comments. */
export type LinearIssue = {
  readonly key: string
  readonly title: string
  readonly url: string
  readonly state: string
  readonly labels: readonly string[]
  readonly comments: readonly QaCommentText[]
}

/** Linear does not answer, answers with what the server does not read, or the key file fails (500). */
export type LinearFault = { readonly reason: 'unavailable' | 'badReply' | 'failed'; readonly code: string }

/** The issues of one team with one of the labels, in any state, with their comments. */
export type LinearIssues = {
  qaIssues(team: string, labels: readonly string[]): Promise<Result<readonly LinearIssue[], LinearFault>>
}

/** The QA labels of d-126. */
const qaLabels = { beforeMerge: 'Branch', afterMerge: 'Main' } as const
/** How long one read of a team's issues is kept (backend-coord). */
const linearKeptMs = 30_000

type NotFound = 'notFound'
export type Qa = {
  list(slug: ProjectSlug): Promise<Result<QaListResponse | NotFound, LinearFault>>
  /** One item's page (R11 to R13): its row, steps and threads; `notFound` for an issue not in the list. */
  item(slug: ProjectSlug, issue: QaIssueId): Promise<Result<QaItemDetailResponse | NotFound, LinearFault>>
}

/** The service of an app with none: each read is `unavailable`, so each QA route answers 503. */
export const noQa: Qa = {
  list: () => Promise.resolve(err({ reason: 'unavailable', code: 'no-qa' })),
  item: () => Promise.resolve(err({ reason: 'unavailable', code: 'no-qa' })),
}

/** Each team's answer kept `linearKeptMs` from its end; one in flight is shared, a failed one not kept, a throw `threw`. */
function kept(linear: LinearIssues, now: () => Date): LinearIssues {
  type Entry = { at: number | null; readonly answer: ReturnType<LinearIssues['qaIssues']> }
  const last = new Map<string, Entry>()
  return {
    qaIssues(team, labels) {
      const entry = last.get(team)
      if (entry !== undefined && (entry.at === null || now().getTime() - entry.at < linearKeptMs)) return entry.answer
      const answer = Promise.resolve()
        .then(() => linear.qaIssues(team, labels))
        .catch(() => err({ reason: 'failed' as const, code: 'threw' }))
      const fresh: Entry = { at: null, answer }
      last.set(team, fresh)
      void answer.then((result) => {
        if (last.get(team) !== fresh) return
        if (result.ok) fresh.at = now().getTime()
        else last.delete(team)
      })
      return answer
    },
  }
}

const isoTime = z.iso.datetime()

/**
 * The IDs of the comments the server posted (answers and drafts). Submit (PR 11) records them; until then none, so
 * each row waits and each comment's author is `agent`.
 */
const recordedPosts: ReadonlySet<string> = new Set()

/** The row of an issue, null when it is not in either table, or 'bad' when the contract does not take it. */
function builtOf(project: ProjectRecord, issue: LinearIssue): QaItem | null | 'bad' {
  const comments = timed(issue.comments)
  const answer = answerOf(comments, recordedPosts)
  const phase =
    issue.labels.includes(qaLabels.beforeMerge) && issue.state === 'QA'
      ? 'beforeMerge'
      : issue.labels.includes(qaLabels.afterMerge) && issue.state === 'Done' && answer === null
        ? 'afterMerge'
        : null
  if (phase === null) return null
  const ask = askOf(
    comments,
    project.repositories.map((r) => r.id),
  )
  const answered =
    answer !== null && (ask === null || Date.parse(answer.at) > Date.parse(ask.at)) ? answer.answer : null
  const item = QaItem.safeParse({
    issue: issue.key,
    title: issue.title.slice(0, maxProjectTitle),
    phase,
    repository: ask?.repository ?? null,
    pr: ask?.pr ?? null,
    status: answered === 'approve' ? 'approved' : answered === 'changes' ? 'changesRequested' : 'waiting',
    worktree: phase === 'afterMerge' ? 'servedApp' : 'stopped',
    comments: comments.filter((c) => !isQaComment(c)).length,
    askedAt: ask?.at ?? null,
    issueUrl: issue.url,
    // The launch methods come with the facts' `qa` part (build plan PR 4), so no repository has one yet.
    launch: {
      url: null,
      blocked: phase === 'afterMerge' ? null : ask === null ? 'noAsk' : ask.pr === null ? 'noPr' : 'noMethod',
    },
  })
  return item.success ? item.data : 'bad'
}

/** The comments whose time is ISO, so none reaches a sort as NaN. */
const timed = (comments: readonly QaCommentText[]) => comments.filter((c) => isoTime.safeParse(c.createdAt).success)

const byTime = (a: { at: string }, b: { at: string }) => Date.parse(a.at) - Date.parse(b.at)

/**
 * The review threads (R12): the comments that are not an ask or an answer, each reply under the first comment of
 * its parent's thread, in time order. A reply whose parent is an ask, an answer or not in the read starts its own
 * thread. The author is a fixed name, as the key is the owner's and Linear's name would be the owner's on each one.
 */
export function threadsOf(comments: readonly QaCommentText[]): QaThread[] {
  const shown = comments.filter((c) => !isQaComment(c))
  const parentOf = new Map(shown.map((c) => [c.id, c.parentId ?? null]))
  const rootOf = (id: string): string => {
    const seen = new Set([id])
    let at = id
    for (;;) {
      const parent = parentOf.get(at)
      if (parent === undefined || parent === null || !parentOf.has(parent) || seen.has(parent)) return at
      seen.add(parent)
      at = parent
    }
  }
  const threads = new Map<string, QaComment[]>()
  for (const c of shown) {
    const comment: QaComment = {
      id: c.id,
      author: recordedPosts.has(c.id) ? { kind: 'owner', name: 'You' } : { kind: 'agent', name: 'Agent' },
      at: c.createdAt,
      text: c.body.slice(0, maxQaText),
      attachments: [],
    }
    const root = rootOf(c.id)
    threads.set(root, [...(threads.get(root) ?? []), comment])
  }
  return [...threads.values()]
    .map((list) => list.sort(byTime))
    .sort((a, b) => Date.parse(a[0]?.at ?? '') - Date.parse(b[0]?.at ?? ''))
    .map((list) => ({ anchor: null, comments: list }))
}

const newestAsk = (a: QaItem, b: QaItem) =>
  (b.askedAt === null ? 0 : Date.parse(b.askedAt)) - (a.askedAt === null ? 0 : Date.parse(a.askedAt))

export function createQa({
  brain,
  linear,
  now = () => new Date(),
}: {
  readonly brain: BrainProjects
  /** Linear; null when the server has no key, so each read is `unavailable`. */
  readonly linear: LinearIssues | null
  readonly now?: () => Date
}): Qa {
  const source = linear === null ? null : kept(linear, now)
  /** The project's QA rows with each issue's comments that have an ISO time, or the fault. */
  const rowsOf = async (
    slug: ProjectSlug,
  ): Promise<Result<readonly { item: QaItem; comments: readonly QaCommentText[] }[] | NotFound, LinearFault>> => {
    const projects = await brain.list()
    if (!projects.ok) return err({ reason: 'failed', code: projects.error.code })
    const project = projects.value.find((p) => p.slug === slug)
    if (project === undefined) return ok('notFound')
    if (project.linearTeam === undefined) return ok([])
    if (source === null) return err({ reason: 'unavailable', code: 'no-key' })
    const issues = await source.qaIssues(project.linearTeam, Object.values(qaLabels))
    if (!issues.ok) return issues
    const rows: { item: QaItem; comments: readonly QaCommentText[] }[] = []
    for (const issue of issues.value) {
      const one = builtOf(project, issue)
      if (one === 'bad') return err({ reason: 'badReply', code: 'item' })
      if (one !== null) rows.push({ item: one, comments: timed(issue.comments) })
    }
    return ok(rows)
  }
  const list = async (slug: ProjectSlug): Promise<Result<QaListResponse | NotFound, LinearFault>> => {
    const rows = await rowsOf(slug)
    if (!rows.ok) return rows
    if (rows.value === 'notFound') return ok('notFound')
    return ok({ items: rows.value.map((r) => r.item).sort(newestAsk) })
  }
  const item = async (
    slug: ProjectSlug,
    issue: QaIssueId,
  ): Promise<Result<QaItemDetailResponse | NotFound, LinearFault>> => {
    const rows = await rowsOf(slug)
    if (!rows.ok) return rows
    if (rows.value === 'notFound') return ok('notFound')
    const row = rows.value.find((r) => r.item.issue === issue)
    if (row === undefined) return ok('notFound')
    const detail = QaItemDetailResponse.safeParse({
      item: row.item,
      steps: askOf(row.comments, [])?.steps ?? [],
      // The launch methods come with the facts' `qa` part (build plan PR 4); the owner chat with the Workspaces join.
      method: null,
      owner: null,
      threads: threadsOf(row.comments),
      drafts: [],
    })
    return detail.success ? ok(detail.data) : err({ reason: 'badReply', code: 'detail' })
  }
  return { list, item }
}
