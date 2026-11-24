import type { TranscriptEntry } from '@bridge/contract'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { clearReports, getReports } from '../errors/reporter.ts'
import { resetRetries } from '../errors/retryGuard.ts'
import { queryClient } from '../lib/queryClient.ts'
import { toolCall } from '../lib/fakeTranscriptServer.ts'
import { afterRendering, setViewport } from '../lib/rendering.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { markdownShown, openWorkspaces, stubLongChats } from './longLiveChat.ts'
import { stubLiveServer } from './liveServerStub.ts'

// the-bridge #476 CI: WorkspacesSendStaysEnd waited over its 1 s for the
// owner's entry to take the pending bubble's place. Each transcript change
// mapped the whole view to new entry objects, so every entry of a long chat
// (500 of them) rendered again for one new entry: about 220 ms here, over a
// second on a CPU 8 times slower, a long frame on a busy phone. An entry the
// server did not change now keeps its object, and only a new or changed entry
// renders. Each test takes the owner's path: the app with no URL parameters,
// Workspaces, a long live chat (over the 500-entry cap) at the phone's
// 390 px. Which entries rendered is read from React's fibers: an entry that
// did not render keeps the props object it had.
const plan = 'mac-mini/c1'
const title = 'plan the slice'
/** Entries in the chat: over the 500 the page keeps, as in the owner's long chats. */
const count = 600

let view: { unmount: () => Promise<void> } | undefined

stubLiveServer()

afterEach(async () => {
  await view?.unmount()
  view = undefined
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  resetRetries()
  queryClient.clear()
  clearReports()
  resetAllStores()
  window.sessionStorage.clear()
  await setViewport(1512, 982)
})

/** A React fiber, as far as these tests read one. */
type Fiber = {
  readonly key: unknown
  readonly elementType: unknown
  readonly memoizedProps: unknown
  readonly child: unknown
  readonly sibling: unknown
  readonly return: unknown
  readonly stateNode: unknown
}

const isFiber = (value: unknown): value is Fiber =>
  typeof value === 'object' &&
  value !== null &&
  'key' in value &&
  'elementType' in value &&
  'memoizedProps' in value &&
  'child' in value &&
  'sibling' in value &&
  'return' in value &&
  'stateNode' in value

/**
 * The props of each live transcript entry (`ChatEntryView`) React holds now, by its key: `TranscriptEntries` keys a
 * live entry `id-<entry ID>` and passes it as `entry`. The app's tests enter a page only through its index, so the
 * test finds the entries by that key, not by the component.
 */
function entryProps(inside: Element): Map<string, unknown> {
  const own = Object.keys(inside).find((name) => name.startsWith('__reactFiber$'))
  let root: unknown = own === undefined ? undefined : Reflect.get(inside, own)
  while (isFiber(root) && isFiber(root.return)) root = root.return
  // The fiber on a node may be the tree before the last commit: the root's `current` is the one on screen.
  const host = isFiber(root) ? root.stateNode : undefined
  const shown: unknown = typeof host === 'object' && host !== null ? Reflect.get(host, 'current') : undefined
  if (!isFiber(shown)) throw new Error('no React tree on the chat')
  const props = new Map<string, unknown>()
  const walk: unknown[] = [shown]
  while (walk.length > 0) {
    const fiber = walk.pop()
    if (!isFiber(fiber)) continue
    const { key, memoizedProps } = fiber
    if (
      typeof key === 'string' &&
      key.startsWith('id-') &&
      typeof memoizedProps === 'object' &&
      memoizedProps !== null &&
      'entry' in memoizedProps
    )
      props.set(key, memoizedProps)
    walk.push(fiber.child, fiber.sibling)
  }
  return props
}

/** The keys of the entries in both `before` and `after` that rendered again in between: their props are new. */
const renderedAgain = (before: Map<string, unknown>, after: Map<string, unknown>) =>
  [...before].filter(([key, props]) => after.has(key) && after.get(key) !== props).map(([key]) => key)

/** The text of each Markdown view in `scope`, by its element. */
const markdownTexts = (scope: Element) =>
  new Map([...scope.querySelectorAll('.markdown-view')].map((el) => [el, el.textContent]))

/** The Markdown views of `before` still in the page whose text changed. */
const rewritten = (before: Map<Element, string>) =>
  [...before].filter(([el, text]) => el.isConnected && el.textContent !== text).length

/** Opens the long live chat on the phone once its stream is open; returns the chat's region and the fake. */
async function openLongChat() {
  const server = stubLongChats(count)
  view = await openWorkspaces([390, 844])
  await userEvent.click(page.getByText(title, { exact: true }).first())
  await markdownShown(500)
  await expect.poll(() => server.openStreams()).toContain(plan)
  return { server, chat: page.getByRole('region', { name: title }).element() }
}

describe('a long live chat reads its transcript a page at a time', () => {
  it('reads one page on open; at the top it puts the older page above, renders no shown entry again and keeps the place, on the phone', async () => {
    const server = stubLongChats(count, true)
    view = await openWorkspaces([390, 844])
    await userEvent.click(page.getByText(title, { exact: true }).first())
    await markdownShown(100)
    expect(server.readQueries).toEqual([{ limit: '100' }])
    const chat = page.getByRole('region', { name: title }).element()
    const scroller = chat.querySelector('.scroll-frame__body')
    const first = scroller?.querySelector('article')
    if (!(scroller instanceof HTMLElement) || !(first instanceof HTMLElement)) throw new Error('no transcript')
    const before = entryProps(chat)
    const offset = () => first.getBoundingClientRect().top - scroller.getBoundingClientRect().top
    // The reader scrolls to the top: a wheel turn makes the scroll theirs, and the earlier line comes into view.
    scroller.dispatchEvent(new WheelEvent('wheel', { bubbles: true }))
    scroller.scrollTop = 0
    const top = offset()
    await markdownShown(200)
    await afterRendering()
    expect(server.readQueries).toEqual([{ limit: '100' }, { limit: '100', before: 'plan-u500' }])
    expect(first.isConnected).toBe(true)
    expect(Math.abs(offset() - top)).toBeLessThanOrEqual(1)
    expect(renderedAgain(before, entryProps(chat))).toEqual([])
    // A reconnect reads the 200 the view holds again, and the reader keeps the place.
    server.drop(plan)
    await expect.poll(() => server.readQueries.at(-1)).toEqual({ limit: '200' })
    await afterRendering()
    expect(Math.abs(offset() - top)).toBeLessThanOrEqual(1)
    expect(getReports()).toEqual([])
  })

  it('holds an older page that answers while the reader scrolls, and puts it in once the scroll rests, on the phone', async () => {
    const server = stubLongChats(count, true)
    view = await openWorkspaces([390, 844])
    await userEvent.click(page.getByText(title, { exact: true }).first())
    await markdownShown(100)
    const chat = page.getByRole('region', { name: title }).element()
    const scroller = chat.querySelector('.scroll-frame__body')
    const first = scroller?.querySelector('article')
    if (!(scroller instanceof HTMLElement) || !(first instanceof HTMLElement)) throw new Error('no transcript')
    const offset = () => first.getBoundingClientRect().top - scroller.getBoundingClientRect().top
    scroller.dispatchEvent(new WheelEvent('wheel', { bubbles: true }))
    scroller.scrollTop = 0
    const top = offset()
    // iOS's momentum scroll goes on after the read answers: scroll events every 40 ms for 600 ms.
    const shown = () => chat.querySelectorAll('.markdown-view').length
    for (let i = 0; i < 15; i += 1) {
      scroller.dispatchEvent(new Event('scroll'))
      await new Promise((resolve) => setTimeout(resolve, 40))
    }
    expect(server.readQueries).toEqual([{ limit: '100' }, { limit: '100', before: 'plan-u500' }])
    expect(shown()).toBe(100)
    await markdownShown(200)
    await afterRendering()
    expect(Math.abs(offset() - top)).toBeLessThanOrEqual(1)
    expect(server.readQueries).toHaveLength(2)
  })

  it('stays at the end when a short chat at its end loads the older page by itself, on the phone', async () => {
    const server = stubLongChats(count, true)
    // 99 tool calls draw as one group row, so the newest page does not fill the screen and the earlier line is in view.
    const calls = Array.from({ length: 99 }, (_, i) =>
      toolCall(`t${String(i)}`, 'Read', { kind: 'read', title: 'Read' }),
    )
    const older = Array.from(
      { length: 50 },
      (_, i): TranscriptEntry => ({ type: 'user', id: `q${String(i)}`, text: 'go', cut: false }),
    )
    server.set(plan, [...older, ...calls, { type: 'assistant', id: 'end', text: 'done', cut: false }])
    view = await openWorkspaces([390, 844])
    await userEvent.click(page.getByText(title, { exact: true }).first())
    await expect.poll(() => server.readQueries).toEqual([{ limit: '100' }, { limit: '100', before: 't0' }])
    await markdownShown(51)
    await afterRendering()
    const scroller = page.getByRole('region', { name: title }).element().querySelector('.scroll-frame__body')
    if (!(scroller instanceof HTMLElement)) throw new Error('no transcript')
    expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight * 2)
    expect(scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight).toBeLessThanOrEqual(1)
    expect(page.getByRole('button', { name: 'Scroll to the newest message' }).query()).toBeNull()
    // A reconnect reads the view's 150 again, and the chat stays at its end.
    server.drop(plan)
    await expect.poll(() => server.readQueries.at(-1)).toEqual({ limit: '150' })
    await afterRendering()
    expect(scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight).toBeLessThanOrEqual(1)
    expect(getReports()).toEqual([])
  })
})

const reply = (id: string, text: string, replacedBy?: string): TranscriptEntry => ({
  type: 'assistant',
  id,
  text,
  cut: false,
  ...(replacedBy === undefined ? {} : { replacedBy }),
})

describe('a long live chat renders only the entries a transcript change brings (the-bridge #476 CI)', () => {
  it('renders no older entry again when one entry comes, on the phone', async () => {
    const { server, chat } = await openLongChat()
    const before = entryProps(chat)
    expect(before.size).toBe(500)
    const texts = markdownTexts(chat)
    server.push(plan, [reply('fresh-1', 'A fresh reply at the end.')])
    await expect.element(page.getByText('A fresh reply at the end.')).toBeInTheDocument()
    await afterRendering()
    const after = entryProps(chat)
    expect(after.has('id-fresh-1')).toBe(true)
    expect(renderedAgain(before, after)).toEqual([])
    expect(rewritten(texts)).toBe(0)
    expect(getReports()).toEqual([])
  })

  it('renders a streamed reply again as it grows, and only it, on the phone', async () => {
    const { server, chat } = await openLongChat()
    const parts = ['The build broke in one file.', 'I fixed the lint step.', 'The checks pass now.']
    server.push(plan, [reply('stream-1', parts[0] ?? '')])
    await expect.element(page.getByText(parts[0] ?? '')).toBeInTheDocument()
    await afterRendering()
    for (let step = 2; step <= parts.length; step++) {
      const before = entryProps(chat)
      const text = parts.slice(0, step).join('\n\n')
      server.push(plan, [reply('stream-1', text)])
      await expect.element(page.getByText(parts[step - 1] ?? '')).toBeInTheDocument()
      await afterRendering()
      expect(renderedAgain(before, entryProps(chat))).toEqual(['id-stream-1'])
    }
    const last = [...chat.querySelectorAll('article.message__root')].at(-1)
    for (const part of parts) expect(last?.textContent).toContain(part)
    expect(getReports()).toEqual([])
  })

  it('folds a draft into its rewrite when the server marks it after both came, on the phone', async () => {
    const { server, chat } = await openLongChat()
    const draftText = 'Draft answer 7 lists four steps.'
    const rewriteText = 'Rewritten answer 7 lists three steps.'
    const hook: TranscriptEntry = { type: 'note', id: 'n-hook', kind: 'hook', text: 'Stop hook: reply rewritten' }
    server.push(plan, [reply('a-draft', draftText), hook, reply('a-rewrite', rewriteText)])
    await expect.element(page.getByText(rewriteText)).toBeInTheDocument()
    await expect.element(page.getByText(draftText)).toBeInTheDocument()
    await afterRendering()
    expect(chat.querySelector('[data-rewritten-note]')).toBeNull()
    const before = entryProps(chat)
    // The server marks the draft: the same entry, now naming its rewrite. The rewrite's entry is the one it was.
    server.push(plan, [reply('a-draft', draftText, 'a-rewrite')])
    await expect.element(page.getByRole('button', { name: 'Reply rewritten' })).toBeVisible()
    await afterRendering()
    const after = entryProps(chat)
    expect(after.has('id-a-draft')).toBe(false)
    expect(renderedAgain(before, after)).toEqual(['id-a-rewrite'])
    const replies = [...chat.querySelectorAll('article.message__root')]
    expect(replies.filter((m) => m.textContent.includes(rewriteText))).toHaveLength(1)
    expect(replies.filter((m) => m.textContent.includes(draftText))).toEqual([])
    expect(getReports()).toEqual([])
  })
})
