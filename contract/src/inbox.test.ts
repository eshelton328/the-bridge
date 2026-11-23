import { describe, expect, it } from 'vitest'
import { InboxId } from './ids.ts'
import { InboxDetailResponse, InboxItem, InboxResponse, SnoozeInboxRequest } from './inbox.ts'

const chatItem = {
  id: '0123456789abcdef',
  source: 'chat',
  kind: 'question',
  title: 'example-chat',
  project: 'example-project',
  tags: [],
  needsYou: true,
  snoozedUntil: null,
  createdAt: '2026-11-21T10:00:00.000Z',
  chat: 'test-mac/0b7f2c1e-4d3a-4f6b-9a8c-1e2d3c4b5a69',
  origin: null,
  actions: ['snooze', 'done', 'dismiss'],
}
const brainItem = {
  ...chatItem,
  id: 'fedcba9876543210',
  source: 'brain',
  kind: 'review',
  title: 'Example request',
  tags: ['global/review', 'project/example-project/web'],
  chat: null,
  origin: null,
  actions: [],
}

describe('the inbox contract', () => {
  it('names an item by 16 hex characters only, never a path', () => {
    expect(InboxId.safeParse('0123456789abcdef').success).toBe(true)
    expect(InboxId.safeParse('/home/dev/projects/x/inbox/a.md').success).toBe(false)
  })

  it('takes a chat item with its chat and a brain item with none', () => {
    expect(InboxItem.safeParse(chatItem).success).toBe(true)
    expect(InboxItem.safeParse(brainItem).success).toBe(true)
    expect(InboxItem.safeParse({ ...chatItem, chat: null }).success).toBe(false)
    expect(InboxItem.safeParse({ ...brainItem, chat: chatItem.chat }).success).toBe(false)
  })

  it('gives only a brain item an origin chat, live or not', () => {
    const origin = { chat: chatItem.chat, live: false }
    expect(InboxItem.safeParse({ ...brainItem, origin }).success).toBe(true)
    expect(InboxItem.safeParse({ ...brainItem, origin: { ...origin, live: true } }).success).toBe(true)
    expect(InboxItem.safeParse({ ...chatItem, origin }).success).toBe(false)
    expect(InboxItem.safeParse({ ...brainItem, origin: { chat: 'no-machine', live: true } }).success).toBe(false)
  })

  it('allows no action on a brain item', () => {
    expect(InboxItem.safeParse({ ...brainItem, actions: ['done'] }).success).toBe(false)
  })

  it('takes no field it does not list, such as a path or prompt text', () => {
    expect(InboxItem.safeParse({ ...brainItem, path: '/home/dev/x.md' }).success).toBe(false)
    expect(InboxItem.safeParse({ ...chatItem, prompt: 'marker-5150' }).success).toBe(false)
  })

  it('lists the items with the badge count and the total', () => {
    const list = { items: [chatItem, brainItem], counts: { needsYou: 2, total: 2 } }
    expect(InboxResponse.safeParse(list).success).toBe(true)
    expect(InboxResponse.safeParse({ items: [] }).success).toBe(false)
  })

  it("gives the detail of the item's own source", () => {
    const chatDetail = { source: 'chat', chat: null }
    expect(InboxDetailResponse.safeParse({ item: chatItem, detail: chatDetail }).success).toBe(true)
    expect(InboxDetailResponse.safeParse({ item: brainItem, detail: { source: 'brain', body: '# A' } }).success).toBe(
      true,
    )
    expect(InboxDetailResponse.safeParse({ item: brainItem, detail: chatDetail }).success).toBe(false)
  })

  it('snoozes until a time', () => {
    expect(SnoozeInboxRequest.safeParse({ until: '2026-11-22T09:00:00.000Z' }).success).toBe(true)
    expect(SnoozeInboxRequest.safeParse({ until: 'tomorrow' }).success).toBe(false)
  })
})
