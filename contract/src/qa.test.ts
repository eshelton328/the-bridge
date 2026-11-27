import { describe, expect, it } from 'vitest'
import { ErrorBody, errorStatus } from './errors.ts'
import { QaDraftId } from './ids.ts'
import { LiveEvent } from './liveEvents.ts'
import {
  QaDraftRequest,
  QaIssueId,
  QaItem,
  QaItemDetailResponse,
  QaListResponse,
  QaReviewRequest,
  tailnetSuffix,
} from './qa.ts'

const item = {
  issue: 'NCC-12',
  title: 'Show the release badge next to the name',
  phase: 'beforeMerge',
  repository: 'example-repo',
  pr: 41,
  status: 'waiting',
  worktree: 'stopped',
  comments: 2,
  askedAt: '2026-11-27T10:00:00.000Z',
  issueUrl: 'https://linear.app/example/issue/NCC-12/show-the-badge',
  launch: { url: null, blocked: null },
}
const upload = 'AbCdEfGhIjKlMnOpQrStUv'

describe('the QA contract', () => {
  it('names an issue by its Linear key only, so a word such as "stop" is never an issue', () => {
    expect(QaIssueId.safeParse('NCC-123').success).toBe(true)
    for (const bad of ['stop', 'ncc-1', 'NCC-', '-12', 'NCC-12/../x'])
      expect(QaIssueId.safeParse(bad).success).toBe(false)
    expect(QaDraftId.safeParse('0123456789abcdef').success).toBe(true)
    expect(QaDraftId.safeParse('0123456789ABCDEF').success).toBe(false)
  })

  it('takes a list item and refuses one with an extra key, such as a path', () => {
    expect(QaItem.safeParse(item).success).toBe(true)
    expect(QaItem.safeParse({ ...item, worktreePath: '/home/dev/x' }).success).toBe(false)
    expect(QaListResponse.safeParse({ items: [item] }).success).toBe(true)
  })

  it('takes only the four statuses and the five worktree states', () => {
    for (const status of ['waiting', 'changesRequested', 'ciFailing', 'approved'])
      expect(QaItem.safeParse({ ...item, status }).success).toBe(true)
    expect(QaItem.safeParse({ ...item, status: 'denied' }).success).toBe(false)
    for (const worktree of ['stopped', 'starting', 'running', 'failed'])
      expect(QaItem.safeParse({ ...item, worktree }).success).toBe(true)
    expect(QaItem.safeParse({ ...item, worktree: 'paused' }).success).toBe(false)
  })

  it('shows an after-merge item on the served app, and a before-merge item never there', () => {
    const after = { ...item, phase: 'afterMerge', worktree: 'servedApp' }
    expect(QaItem.safeParse(after).success).toBe(true)
    expect(QaItem.safeParse({ ...after, worktree: 'running' }).success).toBe(false)
    expect(QaItem.safeParse({ ...item, worktree: 'servedApp' }).success).toBe(false)
  })

  it('gives a launch URL over https on the tailnet only, and a Linear link only', () => {
    // A made-up host under the contract's own suffix; the test names no real machine.
    const url = `https://qa.example${tailnetSuffix}:5190`
    const running = { ...item, worktree: 'running', launch: { url, blocked: null } }
    expect(QaItem.safeParse(running).success).toBe(true)
    for (const url of ['https://qa.example.com:5190', `https://qa.example${tailnetSuffix}.example.com:5190`])
      expect(QaItem.safeParse({ ...running, launch: { url, blocked: null } }).success).toBe(false)
    expect(QaItem.safeParse({ ...running, launch: { url: 'http://host:5190', blocked: null } }).success).toBe(false)
    expect(QaItem.safeParse({ ...item, issueUrl: 'https://example.com/NCC-12' }).success).toBe(false)
    expect(QaItem.safeParse({ ...item, launch: { url: null, blocked: 'noPr' } }).success).toBe(true)
    expect(QaItem.safeParse({ ...item, launch: { url: null, blocked: 'busy' } }).success).toBe(false)
  })

  it('takes a draft with text or files, upload IDs only, never a path or an extra key', () => {
    const draft = { thread: null, anchor: 'Home list · chat row', text: 'A scroll opens.', attachments: [upload] }
    expect(QaDraftRequest.safeParse(draft).success).toBe(true)
    expect(QaDraftRequest.safeParse({ ...draft, text: '' }).success).toBe(true)
    expect(QaDraftRequest.safeParse({ ...draft, text: '  ', attachments: [] }).success).toBe(false)
    expect(QaDraftRequest.safeParse({ ...draft, attachments: ['/home/dev/shot.png'] }).success).toBe(false)
    expect(QaDraftRequest.safeParse({ ...draft, path: '/home/dev' }).success).toBe(false)
  })

  it('takes a review with one answer only', () => {
    for (const answer of ['approve', 'changes', 'deny'])
      expect(QaReviewRequest.safeParse({ answer }).success).toBe(true)
    expect(QaReviewRequest.safeParse({ answer: 'approve', text: 'x' }).success).toBe(false)
    expect(QaReviewRequest.safeParse({ answer: 'merge' }).success).toBe(false)
  })

  it('gives an item page with steps, threads and drafts', () => {
    const comment = {
      id: '0b7f2c1e-4d3a-4f6b-9a8c-1e2d3c4b5a69',
      author: { kind: 'owner', name: 'You' },
      at: '2026-11-27T10:00:00.000Z',
      text: 'A scroll opens the menu.',
      attachments: [{ id: '0123456789abcdef', name: 'scroll.mov', kind: 'video' }],
    }
    const detail = {
      item,
      steps: ['Open Home on the phone.'],
      method: 'Web app over Tailscale',
      owner: 'mac/c1',
      threads: [{ anchor: 'Home list · chat row', comments: [comment] }],
      drafts: [{ id: '0123456789abcdef', thread: comment.id, anchor: null, text: 'Still opens.', attachments: [] }],
    }
    expect(QaItemDetailResponse.safeParse(detail).success).toBe(true)
    expect(QaItemDetailResponse.safeParse({ ...detail, threads: [{ anchor: null, comments: [] }] }).success).toBe(false)
    const linked = { ...comment, attachments: [{ ...comment.attachments[0], url: 'https://x' }] }
    const threads = [{ anchor: null, comments: [linked] }]
    expect(QaItemDetailResponse.safeParse({ ...detail, threads }).success).toBe(false)
  })

  it('answers a launch that cannot start with 409 and its reason, and a Linear fault with 502 or 503', () => {
    const body = (state: string) => ({ error: { kind: 'qa-not-ready', state, message: 'm', requestId: 'r' } })
    for (const state of ['launchLimit', 'launching', 'noMethod', 'noAsk'])
      expect(ErrorBody.parse(body(state))).toEqual(body(state))
    expect(ErrorBody.safeParse(body('busy')).success).toBe(false)
    expect(errorStatus['qa-not-ready']).toBe(409)
    expect(errorStatus['linear-unavailable']).toBe(503)
    expect(errorStatus['linear-bad-reply']).toBe(502)
  })

  it('says which QA list changed', () => {
    const event = { source: 'mac-mini/server', seq: 1, type: 'qa.changed', data: { project: 'ncc-1701' } }
    expect(LiveEvent.safeParse(event).success).toBe(true)
    expect(LiveEvent.safeParse({ ...event, data: { project: '../x' } }).success).toBe(false)
  })
})
