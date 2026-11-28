// The QA tab (f-008 increment three, d-126): the Linear issues of a project's
// team that wait for the owner's check. Before merge is the `Branch` label in
// the state QA; after merge is the `Main` label in the state Done with no
// answer yet. Linear is read through a port only when a request asks (d-112),
// and one read of a team is kept for `linearKeptMs`.
import { maxProjectTitle, type ProjectSlug, QaItem, type QaListResponse } from '@bridge/contract'
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
}

/** The service of an app with none: each read is `unavailable`, so each QA route answers 503. */
export const noQa: Qa = {
  list: () => Promise.resolve(err({ reason: 'unavailable', code: 'no-qa' })),
}

/** The port with each team's answer kept for `linearKeptMs`; a read in flight is shared, and a failed one is not kept. */
function kept(linear: LinearIssues, now: () => Date): LinearIssues {
  const last = new Map<string, { at: number; answer: ReturnType<LinearIssues['qaIssues']> }>()
  return {
    qaIssues(team, labels) {
      const at = now().getTime()
      const entry = last.get(team)
      if (entry !== undefined && at - entry.at < linearKeptMs) return entry.answer
      const fresh = { at, answer: linear.qaIssues(team, labels) }
      last.set(team, fresh)
      void fresh.answer.then((result) => {
        if (!result.ok && last.get(team) === fresh) last.delete(team)
      })
      return fresh.answer
    },
  }
}

const isoTime = z.iso.datetime()

/**
 * The answers that the server posted, by issue key and comment ID. Submit (build plan PR 11) records them; until
 * then the record is empty, so no comment is an answer and each row waits.
 */
const recordedAnswers: ReadonlySet<string> = new Set()

/** The row of an issue, null when it is not in either table, or 'bad' when the contract does not take it. */
function builtOf(project: ProjectRecord, issue: LinearIssue): QaItem | null | 'bad' {
  // A comment with a time that is not ISO never reaches a sort as NaN.
  const comments = issue.comments.filter((c) => isoTime.safeParse(c.createdAt).success)
  const answer = answerOf(comments, recordedAnswers)
  const has = (label: string) => issue.labels.includes(label)
  const phase =
    has(qaLabels.beforeMerge) && issue.state === 'QA'
      ? 'beforeMerge'
      : has(qaLabels.afterMerge) && issue.state === 'Done' && answer === null
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
  const read = async (slug: ProjectSlug): Promise<Result<readonly QaItem[] | NotFound, LinearFault>> => {
    const projects = await brain.list()
    if (!projects.ok) return err({ reason: 'failed', code: projects.error.code })
    const project = projects.value.find((p) => p.slug === slug)
    if (project === undefined) return ok('notFound')
    if (project.linearTeam === undefined) return ok([])
    if (source === null) return err({ reason: 'unavailable', code: 'no-key' })
    const issues = await source.qaIssues(project.linearTeam, Object.values(qaLabels))
    if (!issues.ok) return issues
    const built: QaItem[] = []
    for (const issue of issues.value) {
      const one = builtOf(project, issue)
      if (one === 'bad') return err({ reason: 'badReply', code: 'item' })
      if (one !== null) built.push(one)
    }
    return ok(built.sort(newestAsk))
  }
  return {
    async list(slug) {
      const built = await read(slug)
      if (!built.ok) return built
      return ok(built.value === 'notFound' ? built.value : { items: [...built.value] })
    },
  }
}
