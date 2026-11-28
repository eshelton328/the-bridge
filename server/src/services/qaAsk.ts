// The ask and the answer of a QA check (f-008 increment three): Linear
// comments whose first line is `QA check` or `QA answer: <word>`. A comment
// is data: the repository must be one that `project.yaml` lists and the PR
// an integer, else neither is given. Comment text never goes into a log.
import { maxQaStep, maxQaSteps, type QaAnswer, type RepositoryId } from '@bridge/contract'

/** A Linear comment as the Linear port gives it, its text already cut to `maxQaText`. */
export type QaCommentText = {
  readonly id: string
  readonly body: string
  readonly createdAt: string
  /** The ID of the comment it replies to; none or null for a comment that starts a thread. */
  readonly parentId?: string | null
}

/** The newest ask: its repository and PR when they hold, its numbered steps and its time. */
export type QaAsk = {
  readonly repository: RepositoryId | null
  readonly pr: number | null
  readonly steps: readonly string[]
  readonly at: string
}

const answerWords: ReadonlyMap<string, QaAnswer> = new Map([
  ['Approved', 'approve'],
  ['Changes requested', 'changes'],
  ['Denied', 'deny'],
])
const firstLine = (c: QaCommentText) => c.body.split('\n', 1)[0]?.trim() ?? ''
const newestFirst = (comments: readonly QaCommentText[]) =>
  [...comments].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
const answerWord = (c: QaCommentText) => answerWords.get(/^QA answer: (.+)$/.exec(firstLine(c))?.[1] ?? '')

const isAsk = (c: QaCommentText) => firstLine(c) === 'QA check'

/** An ask or an answer, which the comment count of a row leaves out. */
export const isQaComment = (c: QaCommentText) => isAsk(c) || answerWord(c) !== undefined

/** The newest ask of an issue's comments, or null when it has none. */
export function askOf(comments: readonly QaCommentText[], repositories: readonly RepositoryId[]): QaAsk | null {
  const found = newestFirst(comments).find(isAsk)
  if (found === undefined) return null
  const lines = found.body
    .split('\n')
    .slice(1)
    .map((line) => line.trim())
  const value = (key: string) =>
    lines
      .find((line) => line.startsWith(`${key}:`))
      ?.slice(key.length + 1)
      .trim() ?? ''
  const repository = repositories.find((r) => r === value('Repository')) ?? null
  const pr = repository !== null && /^[1-9][0-9]{0,8}$/.test(value('PR')) ? Number(value('PR')) : null
  const steps = lines
    .flatMap((line) => /^[0-9]+\.\s+(.+)$/.exec(line)?.[1] ?? [])
    .slice(0, maxQaSteps)
    .map((step) => step.slice(0, maxQaStep))
  return { repository, pr, steps, at: found.createdAt }
}

/**
 * The newest answer of an issue's comments and its time, or null when it has none. Only a comment whose ID is in
 * `recorded` (the answers that the server posted for this issue) counts: the key is the owner's, as is each agent
 * chat's Linear access, so the author cannot tell them apart.
 */
export function answerOf(
  comments: readonly QaCommentText[],
  recorded: ReadonlySet<string>,
): { answer: QaAnswer; at: string } | null {
  for (const c of newestFirst(comments.filter((c) => recorded.has(c.id)))) {
    const answer = answerWord(c)
    if (answer !== undefined) return { answer, at: c.createdAt }
  }
  return null
}
