import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { clearReports, getReports } from '../errors/reporter.ts'
import { errorAnswer, fakeTranscriptServer } from '../lib/fakeTranscriptServer.ts'
import { type FakeWorkspacesServer, fakeWorkspacesServer } from '../lib/fakeWorkspacesServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { queryClient } from '../lib/queryClient.ts'
import { setViewport } from '../lib/rendering.ts'
import { testRender } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { stubLiveServer } from './liveServerStub.ts'
import { routeTree } from './routeTree.gen.ts'

// W4 (R59 part 2, backend #471): New workspace on the live page. The phone's and the tablet's + menu and the desktop
// sidebar's + open one dialog with an optional name; Create posts `POST /api/workspaces` with the contract's
// `CreateWorkspaceRequest`, and the new workspace shows in the list and opens once the list read shows it. A 400 is
// the name field's error; herdr's 502 and 503 are a line with Retry, which posts again. Each test takes the owner's
// path: the app with no URL, then Workspaces, with the contract-checked fakes as the server.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const orchard = 'test-box/w-orchard'
const sketch = 'test-box/c1'

const list = {
  machine: 'test-box',
  workspaces: [
    {
      id: orchard,
      label: 'orchard',
      chats: [
        {
          id: sketch,
          kind: 'claude' as const,
          title: 'sketch the plan',
          model: 'claude-opus-5-5',
          contextUsed: null,
          modelId: 'opus',
          effort: null,
          pane: `${sketch}-pane`,
          status: 'idle' as const,
          parent: null,
        },
      ],
    },
  ],
}

/** The stubbed server: the fakes' routes, and a rejection for anything else. */
function withServer(): FakeWorkspacesServer {
  const chats = fakeTranscriptServer()
  chats.set(sketch, [])
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
  return workspaces
}

let view: { unmount: () => Promise<void> } | undefined

stubLiveServer()
answerLateServerReads()

afterEach(async () => {
  await view?.unmount()
  view = undefined
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  queryClient.clear()
  resetAllStores()
  clearReports()
  await setViewport(1512, 982)
})

const sizes = [
  ['phone', [390, 844]],
  ['tablet', [744, 1133]],
  ['desktop', [1512, 982]],
] as const
type Size = (typeof sizes)[number][0]

/** Opens the app at `size` with no URL and taps Workspaces in the tab bar or the rail. */
async function tapWorkspaces(size: readonly [number, number]) {
  await setViewport(size[0], size[1])
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/'] }) })
  view = await testRender(<RouterProvider router={router} />)
  await userEvent.click(page.getByRole('button', { name: 'Workspaces', exact: true }))
  await expect.poll(() => router.state.location.pathname).toBe('/workspaces')
  expect(router.state.location.searchStr).toBe('')
  await expect.element(page.getByText('sketch the plan', { exact: true }).first()).toBeVisible()
}

const dialog = () => page.getByRole('dialog', { name: 'New workspace' })
const nameField = () => dialog().getByRole('textbox', { name: 'Name (optional)' })

/** Opens New workspace: the + menu's row on the phone and the tablet, the sidebar's + on the desktop. */
async function openNewWorkspace(size: Size) {
  if (size === 'desktop') await userEvent.click(page.getByRole('button', { name: 'New workspace', exact: true }))
  else {
    await userEvent.click(page.getByRole('button', { name: 'New chat or workspace' }))
    await userEvent.click(page.getByRole('menuitem', { name: 'New workspace' }))
  }
  await expect.element(dialog()).toBeVisible()
}

/** The new workspace shows in the list and opens: the desktop shows its tab, the list shows it on the phone. */
async function expectOpen(size: Size, name: string) {
  if (size === 'desktop') {
    await expect.element(page.getByRole('tab', { name: new RegExp(name) })).toHaveAttribute('aria-selected', 'true')
    await expect.element(page.getByText('zsh', { exact: true }).first()).toBeVisible()
  } else await expect.element(page.getByText(name, { exact: true })).toBeVisible()
}

describe('New workspace on the live page (W4)', () => {
  for (const [size, viewport] of sizes) {
    it(`makes a named workspace, which shows in the list and opens, on the ${size}`, async () => {
      const server = withServer()
      await tapWorkspaces(viewport)
      await openNewWorkspace(size)
      await userEvent.fill(nameField(), '  harbour  ')
      await userEvent.click(dialog().getByRole('button', { name: 'Create' }))
      await expect.element(dialog()).not.toBeInTheDocument()
      expect(server.creates).toEqual([{ name: 'harbour' }])
      await expectOpen(size, 'harbour')
      expect(server.workspaces().map((w) => w.label)).toEqual(['orchard', 'harbour'])
    })

    it(`sends no name when the field stays empty, so the server names it untitled, on the ${size}`, async () => {
      const server = withServer()
      await tapWorkspaces(viewport)
      await openNewWorkspace(size)
      await userEvent.keyboard('{Enter}')
      await expect.element(dialog()).not.toBeInTheDocument()
      expect(server.creates).toEqual([{}])
      await expectOpen(size, 'untitled')
    })
  }

  it('keeps a name the Label rule refuses on the page, with the field’s error, and Cancel sends nothing', async () => {
    const server = withServer()
    await tapWorkspaces([390, 844])
    await openNewWorkspace('phone')
    await userEvent.fill(nameField(), 'x'.repeat(65))
    await expect.element(dialog().getByText(/A name has 1 to 64 characters/)).toBeVisible()
    await expect.element(dialog().getByRole('button', { name: 'Create' })).toBeDisabled()
    await userEvent.click(dialog().getByRole('button', { name: 'Cancel' }))
    await expect.element(dialog()).not.toBeInTheDocument()
    expect(server.creates).toEqual([])
  })

  it('shows a 400 as the name field’s error and makes it with the next Create', async () => {
    const server = withServer()
    server.answerCreates(() =>
      errorAnswer(
        { kind: 'invalid-input', issues: ['name'], message: 'herdr has a workspace by that name', requestId: 'r-1' },
        400,
      ),
    )
    await tapWorkspaces([744, 1133])
    await openNewWorkspace('tablet')
    await userEvent.fill(nameField(), 'orchard')
    await userEvent.click(dialog().getByRole('button', { name: 'Create' }))
    await expect.element(dialog().getByText('herdr has a workspace by that name')).toBeVisible()
    expect(page.getByRole('button', { name: 'Retry' }).elements()).toHaveLength(0)
    server.answerCreates(undefined)
    await userEvent.fill(nameField(), 'orchard two')
    await userEvent.click(dialog().getByRole('button', { name: 'Create' }))
    await expect.element(dialog()).not.toBeInTheDocument()
    await expectOpen('tablet', 'orchard two')
    expect(getReports()).toEqual([])
  })

  for (const [status, kind] of [
    [503, 'herdr-unavailable'],
    [502, 'herdr-bad-reply'],
  ] as const) {
    it(`shows herdr's ${String(status)} as a line with Retry, which posts the same name again`, async () => {
      const server = withServer()
      server.answerCreates(() => errorAnswer({ kind, message: 'herdr', requestId: 'r-5' }, status))
      await tapWorkspaces([1512, 982])
      await openNewWorkspace('desktop')
      await userEvent.fill(nameField(), 'harbour')
      await userEvent.click(dialog().getByRole('button', { name: 'Create' }))
      await expect.element(dialog().getByText(`Not made — ${kind}`, { exact: true })).toBeVisible()
      expect(server.workspaces().map((w) => w.label)).toEqual(['orchard'])
      // report() gets the kind and the status, never the name.
      await expect.poll(() => getReports().length).toBe(1)
      expect(JSON.stringify(getReports())).not.toContain('harbour')
      server.answerCreates(undefined)
      await userEvent.click(dialog().getByRole('button', { name: 'Retry' }))
      await expect.element(dialog()).not.toBeInTheDocument()
      expect(server.creates).toEqual([{ name: 'harbour' }, { name: 'harbour' }])
      await expectOpen('desktop', 'harbour')
    })
  }

  it('opens a workspace herdr made before a 503, on Retry, with no second post (PR #489 review)', async () => {
    const server = withServer()
    // herdr made it; the server's list read after the create missed, so it answered 503.
    server.answerCreates(
      () => errorAnswer({ kind: 'herdr-unavailable', message: 'herdr', requestId: 'r-6' }, 503),
      true,
    )
    await tapWorkspaces([1512, 982])
    await openNewWorkspace('desktop')
    await userEvent.fill(nameField(), 'harbour')
    await userEvent.click(dialog().getByRole('button', { name: 'Create' }))
    await expect.element(dialog().getByText('Not made — herdr-unavailable', { exact: true })).toBeVisible()
    await expect.poll(() => page.getByText('harbour', { exact: true }).elements().length).toBeGreaterThan(0)
    server.answerCreates(undefined)
    await userEvent.click(dialog().getByRole('button', { name: 'Retry' }))
    await expect.element(dialog()).not.toBeInTheDocument()
    expect(server.creates).toEqual([{ name: 'harbour' }])
    expect(server.workspaces().map((w) => w.label)).toEqual(['orchard', 'harbour'])
    await expectOpen('desktop', 'harbour')
  })

  it('sends nothing more after a 201 it cannot read, and the list shows the workspace (PR #489 review)', async () => {
    const server = withServer()
    server.answerCreates(() => new Response('not json', { status: 201 }), true)
    await tapWorkspaces([744, 1133])
    await openNewWorkspace('tablet')
    await userEvent.fill(nameField(), 'harbour')
    await userEvent.click(dialog().getByRole('button', { name: 'Create' }))
    await expect
      .element(dialog().getByText('Sent, no answer — the list shows the workspace if it was made', { exact: true }))
      .toBeVisible()
    expect(dialog().getByRole('button', { name: 'Retry' }).elements()).toHaveLength(0)
    await expect.element(dialog().getByRole('button', { name: 'Create' })).toBeDisabled()
    await userEvent.click(nameField())
    await userEvent.keyboard('{Enter}')
    await expect.poll(() => page.getByText('harbour', { exact: true }).elements().length).toBeGreaterThan(0)
    expect(server.creates).toEqual([{ name: 'harbour' }])
  })

  it('keeps a dialog opened again after Cancel when the first create answers (PR #489 review)', async () => {
    const server = withServer()
    const served = globalThis.fetch
    let answer: () => void = () => undefined
    const held = new Promise<void>((resolve) => {
      answer = resolve
    })
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        if (init?.method === 'POST' && url.endsWith('/api/workspaces')) await held
        return served(input, init)
      }),
    )
    await tapWorkspaces([390, 844])
    await openNewWorkspace('phone')
    await userEvent.fill(nameField(), 'harbour')
    await userEvent.click(dialog().getByRole('button', { name: 'Create' }))
    await expect.element(dialog().getByRole('button', { name: 'Creating…' })).toBeVisible()
    await userEvent.click(dialog().getByRole('button', { name: 'Cancel' }))
    await expect.element(dialog()).not.toBeInTheDocument()
    await openNewWorkspace('phone')
    await userEvent.fill(nameField(), 'second thought')
    answer()
    await expect.poll(() => server.creates).toEqual([{ name: 'harbour' }])
    await expect.poll(() => page.getByText('harbour', { exact: true }).elements().length).toBeGreaterThan(0)
    await expect.element(nameField()).toHaveValue('second thought')
  })

  it('opens the workspace with the list read after the 201 when no event comes', async () => {
    const server = withServer()
    server.quietCreates(true)
    await tapWorkspaces([390, 844])
    await openNewWorkspace('phone')
    await userEvent.fill(nameField(), 'harbour')
    await userEvent.click(dialog().getByRole('button', { name: 'Create' }))
    await expect.element(dialog()).not.toBeInTheDocument()
    await expectOpen('phone', 'harbour')
  })
})
