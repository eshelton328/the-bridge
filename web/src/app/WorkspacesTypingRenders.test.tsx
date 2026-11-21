import type { ReactNode } from 'react'
import Markdown from 'react-markdown'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { clearReports, getReports } from '../errors/reporter.ts'
import { resetRetries } from '../errors/retryGuard.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { boxIn, markdownShown, openWorkspaces, stubLongChats, typeAfter } from './longLiveChat.ts'
import { stubLiveServer } from './liveServerStub.ts'

// Review R28: typing in a long live chat was slow on the phone, as each
// keystroke rendered every transcript entry again and react-markdown parsed
// each message and reply. The entries are memoised now (TranscriptEntries,
// ChatEntryView, EntryText), so a keystroke parses no Markdown. Each test
// takes the owner's path with generated transcripts (longLiveChat.ts) and
// counts react-markdown's renders (one per message or reply) while the owner
// types. The drafts live in a draft book (blocks/draftBook.ts), so the screen
// (one render per page render) and the chat header are counted too.
const { renders, counted } = vi.hoisted(() => {
  const renders = { screen: 0, header: 0 }
  type Module = Record<string, (props: object) => ReactNode>
  /** The module with its component `name` counting its renders in `renders[key]`. */
  const counted = (real: Module, name: string, key: keyof typeof renders): Module => ({
    ...real,
    [name]: (props: object) => ((renders[key] += 1), real[name]?.(props)),
  })
  return { renders, counted }
})
vi.mock('react-markdown', { spy: true })
vi.mock('../pages/workspaces/screens/WorkspacesScreen.tsx', async (original) =>
  counted(await original(), 'WorkspacesScreen', 'screen'),
)
vi.mock('../pages/workspaces/blocks/ChatHead.tsx', async (original) => counted(await original(), 'ChatHead', 'header'))

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

/** The renders of the screen, the chat header and react-markdown while the owner types `text` into `box`. */
async function rendersWhileTyping(box: HTMLTextAreaElement, text: string) {
  await typeAfter(box, text, () => {
    vi.mocked(Markdown).mockClear()
    renders.screen = 0
    renders.header = 0
  })
  return { screen: renders.screen, header: renders.header, markdown: vi.mocked(Markdown).mock.calls.length }
}

const none = { screen: 0, header: 0, markdown: 0 }

const chat = (title: string) => boxIn(page.getByRole('region', { name: title }).element())

describe('a keystroke in a long live chat renders only its composer (review R28)', () => {
  it('renders no transcript entry on the phone, in a chat of 500 Markdown entries', async () => {
    stubLongChats(500)
    view = await openWorkspaces([390, 844])
    await userEvent.click(page.getByText('plan the slice', { exact: true }).first())
    await markdownShown(500)
    expect(await rendersWhileTyping(chat('plan the slice'), 'quick note')).toEqual(none)
    expect(getReports()).toEqual([])
  })

  it('renders no transcript entry on the tablet', async () => {
    stubLongChats(40)
    view = await openWorkspaces([756, 1129])
    await userEvent.click(page.getByText('plan the slice', { exact: true }).first())
    await markdownShown(40)
    expect(await rendersWhileTyping(chat('plan the slice'), 'quick note')).toEqual(none)
  })

  it("renders no transcript entry in the desktop's chat beside the sidebar", async () => {
    stubLongChats(40)
    view = await openWorkspaces([1512, 982])
    await markdownShown(40)
    expect(await rendersWhileTyping(chat('plan the slice'), 'quick note')).toEqual(none)
  })

  it("renders no transcript entry in the desktop workbench's panes", async () => {
    stubLongChats(40)
    view = await openWorkspaces([1512, 982])
    await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
    await markdownShown(80)
    const pane = page
      .getByRole('button', { name: 'Maximise review notes', exact: true })
      .element()
      .closest('[data-figma]')
    if (pane === null) throw new Error('no pane for review notes')
    expect(await rendersWhileTyping(boxIn(pane), 'quick note')).toEqual(none)
  })
})
