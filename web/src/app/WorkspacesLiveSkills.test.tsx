import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import type { ChatSkill } from '@bridge/contract'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { createClientErrorSender, type PostReport } from '../errors/clientErrorSender.ts'
import { ErrorTray } from '../errors/ErrorTray.tsx'
import { addSink, clearReports, getReports } from '../errors/reporter.ts'
import { rootErrorOptions } from '../errors/rootErrorOptions.ts'
import { RouteError } from '../errors/RouteError.tsx'
import { resetRetries } from '../errors/retryGuard.ts'
import { errorAnswer, type FakeTranscriptServer, fakeTranscriptServer } from '../lib/fakeTranscriptServer.ts'
import { fakeWorkspacesServer } from '../lib/fakeWorkspacesServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { markApp } from './appMarker.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// Review R34: a live Claude chat's "/" list is its own, read from the
// server's `GET /api/chats/:chat/skills` (backend #352) each time it opens,
// never the Figma sample. Each test takes the owner's path: it opens the app
// with no URL parameters, taps Workspaces and a live chat, with a stubbed
// server whose routes are the contract-checked fakes
// (lib/fakeTranscriptServer.ts for the chat routes and the skills,
// lib/fakeWorkspacesServer.ts for the list). The list starts with /compact
// and /clear, whose picks open their dialogs; /model and /effort never show;
// a miss or an empty list shows the commands alone. No report or posted
// client error holds a skill's name or description.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const workspace = 'mac-mini/w-live'
const plan = 'mac-mini/c1'
const review = 'mac-mini/c2'

const summary = (id: string, title: string, status: 'idle' | 'working') => ({
  id,
  kind: 'claude',
  title,
  model: 'claude-opus-5-5',
  contextUsed: null,
  modelId: 'opus',
  effort: null,
  pane: `${id}-pane`,
  status,
  parent: null,
})
const list = {
  machine: 'mac-mini',
  workspaces: [
    {
      id: workspace,
      label: 'live work',
      chats: [summary(plan, 'plan the slice', 'idle'), summary(review, 'review notes', 'working')],
    },
  ],
}

const skill = (name: string, description: string, source: ChatSkill['source'] = 'user'): ChatSkill => ({
  name,
  description,
  source,
})

/** The plan chat's skills, after the server's built-ins, in the server's order (by name). */
const planSkills = [
  skill('alpha-docs', 'Lay out a folder'),
  skill('docs-writer', 'Draft a doc from sources', 'project'),
  skill('engine:ambitious', 'Aim the task higher', 'plugin'),
  skill('zeta', 'Grade the docs of a repo'),
]

/** The Figma sample's skills: they must never show in a live chat. */
const sample = ['/writer', '/readme', '/pr-description']

/** The stubbed server: the fakes' routes, and a rejection for anything else. */
function withChats(): FakeTranscriptServer {
  const chats = fakeTranscriptServer()
  chats.set(plan, [])
  chats.set(review, [])
  chats.setSkills(plan, planSkills)
  const workspaces = fakeWorkspacesServer(chats, list)
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      const path = new URL(url, window.location.origin).pathname
      const answer = chats.handle(path, init) ?? workspaces.handle(path, init)
      if (answer !== undefined) return Promise.resolve(answer)
      return Promise.reject(new TypeError(`no stub for ${url}`))
    }),
  )
  return chats
}

let view: { unmount: () => Promise<void> } | undefined

stubLiveServer()

// A read that a page starts after its test ended gets no answer, not the real server (lib/lateServerReads.ts).
answerLateServerReads()

afterEach(async () => {
  await view?.unmount()
  view = undefined
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  resetRetries()
  queryClient.clear()
  clearReports()
  resetAllStores()
  window.sessionStorage.clear()
  await setViewport(1512, 982)
})

const phone = [390, 844] as const
const desktop = [1512, 982] as const

// A stand-in for window.visualViewport that the test moves as iOS Safari does when its keyboard opens: the layout keeps
// its height, and only the visual viewport shrinks (as in WorkspacesChatDock.test.tsx).
class FakeViewport extends EventTarget {
  height = document.documentElement.clientHeight
  width = document.documentElement.clientWidth
  offsetTop = 0
  offsetLeft = 0
  scale = 1
  move(change: { height: number }) {
    this.height = change.height
    this.dispatchEvent(new Event('resize'))
  }
}

/** Puts a FakeViewport in place of window.visualViewport until the test ends. */
function fakeKeyboard(): FakeViewport {
  const viewport = new FakeViewport()
  const own = Object.getOwnPropertyDescriptor(window, 'visualViewport')
  Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport })
  onTestFinished(() => {
    if (own) Object.defineProperty(window, 'visualViewport', own)
    else Reflect.deleteProperty(window, 'visualViewport')
  })
  return viewport
}

/** Opens the app at `size` with no URL parameters and taps Workspaces in the rail or the tab bar. */
async function tapWorkspaces(size: readonly [number, number]) {
  await setViewport(size[0], size[1])
  const before = new Set(document.body.children)
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/'] }),
    defaultErrorComponent: RouteError,
  })
  view = await testRender(
    <>
      <RouterProvider router={router} />
      <ErrorTray />
    </>,
    rootErrorOptions,
  )
  // The app gets the window's height, as main.ts gives it, so the chat lays out as on the phone.
  const container = [...document.body.children].find((child) => !before.has(child))
  if (container !== undefined) {
    container.id = 'root'
    onTestFinished(() => {
      container.removeAttribute('id')
    })
  }
  onTestFinished(markApp())
  await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
  await expect.poll(() => router.state.location.pathname).toBe('/workspaces')
  expect(router.state.location.searchStr).toBe('')
}

/** Taps the live chat `title` in the phone's list. */
async function tapChat(title: string) {
  await userEvent.click(page.getByText(title, { exact: true }).first())
  await expect.element(page.getByRole('heading', { name: title })).toBeVisible()
}

/** The message box of the chat `title`. */
function boxOf(title: string): HTMLTextAreaElement {
  // The chat alone is a region with its title; a workbench pane is the box around its Maximise button.
  const region = page.getByRole('region', { name: title }).elements()[0]
  const pane = page
    .getByRole('button', { name: `Maximise ${title}`, exact: true })
    .elements()[0]
    ?.closest('[data-figma]')
  const box = (region ?? pane)?.querySelector('textarea') ?? null
  if (box === null) throw new Error(`no message box in ${title}`)
  return box
}

/** The open "/" list's group of rows; none while the list is closed (its popover stays in the page, hidden). */
const skillGroup = () =>
  [...document.querySelectorAll('[role="radiogroup"][aria-label^="SKILLS"]')].find(
    (group) => group.closest('[data-part="content"]')?.getAttribute('data-state') === 'open',
  ) ?? null

/** The names the open "/" list shows, in order: each row's value is its /name. */
const shownNames = () =>
  [...(skillGroup()?.querySelectorAll<HTMLInputElement>('input[type="radio"]') ?? [])].map((input) => input.value)

/** The popover box that holds the list, which scrolls. */
function listBox(): HTMLElement {
  const box = skillGroup()?.closest<HTMLElement>('[data-part="content"]')
  if (!box) throw new Error('no skill list')
  return box
}

/** Focuses the box of `title` and types `text`, as the owner does. */
async function typeIn(title: string, text: string) {
  // The live list may still be loading: the chat's box shows once it has.
  await expect.poll(() => boxOf(title)).toBeInstanceOf(HTMLTextAreaElement)
  const box = boxOf(title)
  await userEvent.click(box)
  await userEvent.keyboard(text)
  await expect.poll(() => box.value).toBe(text)
  return box
}

/** The commands a live Claude chat lists first. */
const commands = ['/compact', '/clear']

describe('the "/" list of a live Claude chat (review R34)', () => {
  it("reads the open chat's list from the server and shows its skills after the commands, never the sample", async () => {
    const chats = withChats()
    await tapWorkspaces(phone)
    await tapChat('plan the slice')
    expect(chats.skillReads).toEqual([])
    await typeIn('plan the slice', '/')
    await expect.poll(shownNames).toEqual([...commands, '/alpha-docs', '/docs-writer', '/engine:ambitious', '/zeta'])
    expect(chats.skillReads).toEqual([plan])
    // The chat ID goes in the path URL-encoded once.
    expect(chats.skillPaths).toEqual(['/api/chats/mac-mini%2Fc1/skills'])
    for (const name of [...sample, '/model', '/effort']) expect(shownNames()).not.toContain(name)
    // A project's and a plugin's skill name their source.
    const group = page.getByRole('radiogroup', { name: 'SKILLS' })
    await expect.element(group.getByText('project', { exact: true })).toBeVisible()
    await expect.element(group.getByText('plugin', { exact: true })).toBeVisible()
    expect(getReports()).toEqual([])
  })

  it('reads the list again each time it opens, and shows the last list at once while the read runs', async () => {
    const chats = withChats()
    await tapWorkspaces(phone)
    await tapChat('plan the slice')
    const box = await typeIn('plan the slice', '/')
    await expect.poll(shownNames).toContain('/zeta')
    await userEvent.keyboard('{Escape}')
    await expect.poll(skillGroup).toBeNull()
    // The next read waits; the list shows the last one meanwhile, with no spinner.
    let release: () => void = () => undefined
    chats.answerSkills(
      () =>
        new Promise<Response>((resolve) => {
          release = () => {
            resolve(
              errorAnswer(
                { kind: 'not-found', path: '/api/chats/mac-mini%2Fc1/skills', message: 'gone', requestId: 'r-404' },
                404,
              ),
            )
          }
        }),
    )
    await userEvent.clear(box)
    await userEvent.keyboard('/')
    await expect.poll(() => chats.skillReads).toEqual([plan, plan])
    expect(shownNames()).toContain('/zeta')
    release()
    // A miss lists the commands alone, never the older list.
    await expect.poll(shownNames).toEqual(commands)
  })

  it('scrolls 60 skills inside the list above the composer at 390 × 844 with the keyboard up, and keeps the box focused', async () => {
    const chats = withChats()
    chats.setSkills(
      plan,
      Array.from({ length: 60 }, (_, i) => skill(`skill-${String(i).padStart(2, '0')}`, `Step ${String(i)}`)),
    )
    const keyboard = fakeKeyboard()
    await tapWorkspaces(phone)
    await tapChat('plan the slice')
    const box = boxOf('plan the slice')
    await userEvent.click(box)
    keyboard.move({ height: 544 })
    await userEvent.keyboard('/')
    await expect.poll(() => shownNames().length).toBe(62)
    const list = listBox()
    // The list scrolls inside its box, which stays between the window's top and the composer's top.
    await expect.poll(() => list.scrollHeight > list.clientHeight + 100).toBe(true)
    const combobox = box.closest('[role="combobox"]')
    if (combobox === null) throw new Error('no composer')
    // The composer rides on the keyboard's top.
    await expect.poll(() => combobox.getBoundingClientRect().bottom <= 544 + 1).toBe(true)
    await expect.poll(() => list.getBoundingClientRect().bottom <= combobox.getBoundingClientRect().top + 1).toBe(true)
    expect(list.getBoundingClientRect().top).toBeGreaterThanOrEqual(0)
    // The arrow keys move the highlight down the list and keep it in view; the box keeps the focus (the keyboard stays).
    for (let i = 0; i < 30; i += 1) await userEvent.keyboard('{ArrowDown}')
    const row = () => list.querySelector('[data-part="item"][data-state="checked"]')
    await expect.poll(() => row()?.querySelector('input')?.value).toBe('/skill-28')
    await expect
      .poll(() => {
        const at = row()?.getBoundingClientRect()
        const frame = list.getBoundingClientRect()
        return at !== undefined && at.top >= frame.top - 1 && at.bottom <= frame.bottom + 1
      })
      .toBe(true)
    expect(document.activeElement).toBe(box)
    // A tap on a row picks it and leaves the focus in the box.
    await userEvent.click(page.getByRole('radio', { name: '/skill-03' }).element().closest('[data-part="item"]') ?? box)
    await expect.poll(() => box.value).toBe('/skill-03 ')
    expect(document.activeElement).toBe(box)
  })

  it('filters by what the owner types: names that start with it, then names that hold it, then descriptions', async () => {
    withChats()
    await tapWorkspaces(phone)
    await tapChat('plan the slice')
    await typeIn('plan the slice', '/DOC')
    await expect.poll(shownNames).toEqual(['/docs-writer', '/alpha-docs', '/zeta'])
    await userEvent.keyboard('Q')
    await expect.poll(shownNames).toEqual([])
    await expect.element(page.getByText('No match', { exact: true })).toBeVisible()
  })

  it('puts a picked skill in the box with a space after it', async () => {
    withChats()
    await tapWorkspaces(phone)
    await tapChat('plan the slice')
    const box = await typeIn('plan the slice', '/eng')
    await expect.poll(shownNames).toEqual(['/engine:ambitious'])
    await userEvent.keyboard('{Enter}')
    await expect.poll(() => box.value).toBe('/engine:ambitious ')
    expect(skillGroup()).toBeNull()
    expect(document.activeElement).toBe(box)
  })

  it('opens the Compact and Clear dialogs from /compact and /clear, and takes the "/" word out of the box', async () => {
    const chats = withChats()
    await tapWorkspaces(phone)
    await tapChat('plan the slice')
    const box = await typeIn('plan the slice', '/comp')
    await expect.poll(shownNames).toEqual(['/compact'])
    await userEvent.keyboard('{Enter}')
    const compact = page.getByRole('dialog', { name: 'Compact the context' })
    await expect.element(compact).toBeVisible()
    expect(box.value).toBe('')
    await userEvent.click(compact.getByRole('button', { name: 'Cancel' }))
    await expect.element(compact).not.toBeInTheDocument()
    await typeIn('plan the slice', '/cle')
    await expect.poll(shownNames).toEqual(['/clear'])
    await userEvent.click(page.getByText('/clear', { exact: true }))
    const clear = page.getByRole('alertdialog', { name: 'Clear the context?' })
    await expect.element(clear).toBeVisible()
    await userEvent.click(clear.getByRole('button', { name: 'Cancel' }))
    // Nothing was sent: the dialogs post only on their own buttons.
    expect(chats.commands).toEqual([])
    expect(chats.prompts).toEqual([])
  })

  it('shows /compact and /clear off in a chat that works', async () => {
    withChats()
    await tapWorkspaces(phone)
    await tapChat('review notes')
    await typeIn('review notes', '/')
    await expect.poll(shownNames).toEqual(commands)
    await expect.element(page.getByRole('radio', { name: '/compact' })).toBeDisabled()
    await expect.element(page.getByRole('radio', { name: '/clear' })).toBeDisabled()
  })

  it('shows the commands alone for an empty list, a 404 and a 503, and reports only the 503 by its kind', async () => {
    const chats = withChats()
    const sunk: string[] = []
    onTestFinished(addSink((r) => sunk.push(JSON.stringify([r.error.name, r.error.message, r.error.stack]))))
    const posted: string[] = []
    const post = vi.fn<PostReport>((body) => {
      posted.push(body)
      return Promise.resolve(204)
    })
    onTestFinished(addSink(createClientErrorSender({ post })))
    await tapWorkspaces(phone)
    await tapChat('plan the slice')
    const answers: (() => Response)[] = [
      () => new Response(JSON.stringify({ chat: plan, skills: [] }), { status: 200 }),
      () =>
        errorAnswer(
          { kind: 'not-found', path: '/api/chats/mac-mini%2Fc1/skills', message: 'No chat', requestId: 'r-404' },
          404,
        ),
      () => errorAnswer({ kind: 'invalid-input', issues: ['chat'], message: 'Bad', requestId: 'r-400' }, 400),
    ]
    const box = boxOf('plan the slice')
    for (const answer of answers) {
      chats.answerSkills(answer)
      await typeIn('plan the slice', '/')
      await expect.poll(shownNames).toEqual(commands)
      for (const name of sample) expect(shownNames()).not.toContain(name)
      await userEvent.clear(box)
      await expect.poll(skillGroup).toBeNull()
    }
    expect(getReports()).toEqual([])
    chats.answerSkills(() => errorAnswer({ kind: 'herdr-unavailable', message: 'herdr down', requestId: 'r-503' }, 503))
    await typeIn('plan the slice', '/')
    await expect.poll(() => getReports().length).toBe(1)
    expect(shownNames()).toEqual(commands)
    expect(getReports()[0]?.error.message).toBe("A chat's skills read missed: herdr-unavailable")
    // No report holds a skill's name or description, or the chat.
    const all = JSON.stringify([sunk, posted])
    for (const s of planSkills) {
      expect(all).not.toContain(s.name)
      expect(all).not.toContain(s.description)
    }
    expect(all).not.toContain('mac-mini')
  })

  it('ignores an answer that comes after the list closed, and one for another chat', async () => {
    const chats = withChats()
    chats.setSkills(review, [skill('review-only', 'A skill of the other chat')])
    const held: (() => void)[] = []
    // Each read of the review chat waits until the test lets it answer.
    chats.answerSkills((chat) =>
      chat === review
        ? new Promise<Response>((resolve) => {
            held.push(() => {
              resolve(
                new Response(
                  JSON.stringify({ chat: review, skills: [skill('review-only', 'A skill of the other chat')] }),
                  { status: 200 },
                ),
              )
            })
          })
        : new Response(JSON.stringify({ chat: plan, skills: planSkills }), { status: 200 }),
    )
    await tapWorkspaces(desktop)
    await userEvent.click(page.getByRole('button', { name: 'Hide the workspace sidebar' }))
    await typeIn('review notes', '/')
    await expect.poll(() => chats.skillReads).toEqual([review])
    await userEvent.keyboard('{Escape}')
    await expect.poll(skillGroup).toBeNull()
    // The plan chat's list opens; the review chat's answer comes now, for a list that closed.
    await typeIn('plan the slice', '/')
    await expect.poll(shownNames).toContain('/zeta')
    for (const release of held.splice(0)) release()
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(shownNames()).not.toContain('/review-only')
    await userEvent.keyboard('{Escape}')
    // The review chat's next read waits too: the late answer never became its list.
    await userEvent.clear(boxOf('review notes'))
    await typeIn('review notes', '/')
    await expect.poll(() => chats.skillReads).toEqual([review, plan, review])
    await expect.poll(shownNames).toEqual(commands)
  })

  it('moves the highlight with the arrow keys and picks with Enter on the desktop; Escape closes and keeps the focus', async () => {
    withChats()
    await tapWorkspaces(desktop)
    const box = await typeIn('plan the slice', '/')
    await expect.poll(shownNames).toContain('/zeta')
    const highlighted = () =>
      listBox().querySelector('[data-part="item"][data-state="checked"] input')?.getAttribute('value')
    await expect.poll(highlighted).toBe('/compact')
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}')
    await expect.poll(highlighted).toBe('/docs-writer')
    await userEvent.keyboard('{ArrowUp}')
    await expect.poll(highlighted).toBe('/alpha-docs')
    await userEvent.keyboard('{Enter}')
    await expect.poll(() => box.value).toBe('/alpha-docs ')
    expect(document.activeElement).toBe(box)
    await userEvent.keyboard('/')
    await expect.poll(skillGroup).not.toBeNull()
    await userEvent.keyboard('{Escape}')
    await expect.poll(skillGroup).toBeNull()
    expect(document.activeElement).toBe(box)
  })
})
