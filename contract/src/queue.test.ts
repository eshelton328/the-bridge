import { describe, expect, it } from 'vitest'
import { MoveToLinearRequest, QueuePriorityRequest, QueuePull, QueueResponse } from './queue.ts'

describe('the Queue contract', () => {
  const pull = {
    repository: 'example-repo',
    number: 7,
    title: 'Add the lobby',
    url: 'https://github.com/example-owner/example-repo/pull/7',
    branch: 'example/ncc-42-add-the-lobby',
    status: 'inReview',
    updatedAt: '2026-11-27T10:00:00.000Z',
  }

  it('takes a priority from 0 to 4 only', () => {
    expect(QueuePriorityRequest.safeParse({ item: '0123456789abcdef', priority: 0 }).success).toBe(true)
    expect(QueuePriorityRequest.safeParse({ item: '0123456789abcdef', priority: 4 }).success).toBe(true)
    expect(QueuePriorityRequest.safeParse({ item: '0123456789abcdef', priority: 5 }).success).toBe(false)
    expect(QueuePriorityRequest.safeParse({ item: '0123456789abcdef', priority: 1.5 }).success).toBe(false)
    expect(QueuePriorityRequest.safeParse({ item: 'pr:the-bridge#7', priority: 1 }).success).toBe(false)
  })

  it('makes a PR local only when it has no issue', () => {
    const row = { kind: 'pull', id: '0123456789abcdef', pull, issue: 'NCC-42', priority: 2 }
    expect(QueuePull.safeParse(row).success).toBe(true)
    expect(QueuePull.safeParse({ ...row, kind: 'local', issue: null, priority: 0 }).success).toBe(true)
    expect(QueuePull.safeParse({ ...row, kind: 'local' }).success).toBe(false)
    expect(QueuePull.safeParse({ ...row, issue: null }).success).toBe(false)
    expect(QueuePull.safeParse({ ...row, issue: 'ncc-42' }).success).toBe(false)
    expect(QueuePull.safeParse({ ...row, issue: `NCC-${'1'.repeat(29)}` }).success).toBe(false)
  })

  it('lists Up next projects with their issues and the Linear read state', () => {
    const project = {
      kind: 'linearProject',
      id: 'fedcba9876543210',
      name: 'Projects app: increment four',
      status: 'Backlog',
      priority: 2,
      openIssues: 1,
      issues: [{ id: '0123456789abcdef', issue: 'NCC-160', title: 'Add the schemas', state: 'Todo', priority: 0 }],
    }
    expect(QueueResponse.safeParse({ inProgress: [], upNext: [project], linear: 'ok' }).success).toBe(true)
    expect(QueueResponse.safeParse({ inProgress: [], upNext: [], linear: 'noTeam' }).success).toBe(true)
    expect(QueueResponse.safeParse({ inProgress: [], upNext: [], linear: 'gone' }).success).toBe(false)
  })

  it('takes a strict empty Move to Linear body only', () => {
    expect(MoveToLinearRequest.safeParse({}).success).toBe(true)
    expect(MoveToLinearRequest.safeParse({ title: 'x' }).success).toBe(false)
  })
})
