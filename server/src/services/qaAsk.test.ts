import { RepositoryId } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import { answerOf, askOf, isQaComment } from './qaAsk.ts'

const repos = [RepositoryId.parse('the-bridge')]
const comment = (body: string, createdAt = '2026-11-27T10:00:00.000Z') => ({ id: 'c', body, createdAt })
const ask = (repo: string, pr: string) =>
  comment(
    [
      'QA check',
      'Owner: bridge-projects',
      `Repository: ${repo}`,
      `PR: ${pr}`,
      '1. Open the QA tab.',
      '2. Tap a row.',
    ].join('\n'),
  )

describe('askOf (AC3)', () => {
  it('reads the repository, the PR, the steps and the time of the newest ask', () => {
    const older = { ...ask('the-bridge', '3'), createdAt: '2026-11-26T10:00:00.000Z' }
    expect(askOf([older, ask('the-bridge', '12'), comment('a plain comment')], repos)).toEqual({
      repository: 'the-bridge',
      pr: 12,
      steps: ['Open the QA tab.', 'Tap a row.'],
      at: '2026-11-27T10:00:00.000Z',
    })
  })
  it('gives no repository and no PR for a repository that project.yaml does not list', () => {
    expect(askOf([ask('other-repo', '12')], repos)).toMatchObject({ repository: null, pr: null })
  })
  it('gives no PR for a PR that is not an integer', () => {
    for (const pr of ['12a', '-1', '1.5', '0', ''])
      expect(askOf([ask('the-bridge', pr)], repos)).toMatchObject({ repository: 'the-bridge', pr: null })
  })
  it('gives null when no comment starts with the line QA check', () => {
    expect(askOf([comment('see the QA check below\nPR: 1')], repos)).toBeNull()
  })
})

describe('answerOf', () => {
  it('reads the newest answer and its time', () => {
    const answers = [
      comment('QA answer: Changes requested', '2026-11-27T11:00:00.000Z'),
      comment('QA answer: Approved\nThanks', '2026-11-27T12:00:00.000Z'),
      comment('QA answer: maybe', '2026-11-27T13:00:00.000Z'),
    ]
    expect(answerOf(answers)).toEqual({ answer: 'approve', at: '2026-11-27T12:00:00.000Z' })
    expect(answerOf([comment('no answer')])).toBeNull()
    expect(answers.map(isQaComment)).toEqual([true, true, false])
  })
})
