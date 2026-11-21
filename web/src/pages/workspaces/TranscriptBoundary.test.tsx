import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import type { ComponentProps } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { resetRetries } from '../../errors/retryGuard.ts'
import { testRender } from '../../lib/testRender.ts'
import { WorkspacesScreen } from './screens/WorkspacesScreen.tsx'
import { workspacesStates } from './states/index.ts'

// Audit P-1: one bad transcript entry or terminal shows an inline fallback in
// its own block, and the pane's header, its composer and the other panes
// keep working. The entry view and the terminal throw while `crash` names
// them.
const crash = vi.hoisted(() => ({ entry: false, terminal: false }))

vi.mock('./blocks/ChatEntryView.tsx', async (importOriginal) => {
  const real = await importOriginal<typeof import('./blocks/ChatEntryView.tsx')>()
  // ChatEntryView is memoised (review R28), so the stand-in renders it as an element.
  const Real = real.ChatEntryView
  return {
    ChatEntryView: (props: ComponentProps<typeof Real>) => {
      if (crash.entry) throw new Error('an entry crashed on purpose')
      return <Real {...props} />
    },
  }
})

vi.mock('@eshelton328/component-library-1701', async (importOriginal) => {
  const real = await importOriginal<typeof import('@eshelton328/component-library-1701')>()
  return {
    ...real,
    TerminalLines: (props: Parameters<typeof real.TerminalLines>[0]) => {
      if (crash.terminal) throw new Error('the terminal crashed on purpose')
      return real.TerminalLines(props)
    },
  }
})

document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const blockFallbacks = () => page.getByRole('alert').filter({ hasText: 'This part failed to render.' })
const paneFallback = () => page.getByRole('heading', { name: 'This pane failed to render' })

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  crash.entry = false
  crash.terminal = false
  resetRetries()
  vi.restoreAllMocks()
  await page.viewport(1512, 982)
})

describe('the Workspaces transcripts and terminal', () => {
  it('keeps each chat pane and its composer when an entry throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await page.viewport(1512, 982)
    crash.entry = true
    const { data, ui } = workspacesStates.threePanes
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="desktop" />)
    await expect.element(blockFallbacks().first()).toBeVisible()
    await expect.element(paneFallback()).not.toBeInTheDocument()
    await expect.element(page.getByText('bridge themes', { exact: true }).first()).toBeVisible()
    expect(page.getByRole('textbox').elements().length).toBeGreaterThan(0)
    await expect.element(page.getByRole('log', { name: 'brain git' })).toBeVisible()
  })

  it('keeps the shell pane and the chats when the terminal throws', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await page.viewport(1512, 982)
    crash.terminal = true
    const { data, ui } = workspacesStates.threePanes
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="desktop" />)
    await expect.element(blockFallbacks()).toBeVisible()
    await expect.element(paneFallback()).not.toBeInTheDocument()
    await expect.element(page.getByText('brain git', { exact: true }).first()).toBeVisible()
    await expect.element(page.getByText('bridge themes', { exact: true }).first()).toBeVisible()
  })

  it("keeps a subagent's transcript header and note on the phone when an entry throws", async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await page.viewport(390, 806)
    crash.entry = true
    const { data, ui } = workspacesStates.phoneSubagentTranscript
    view = await testRender(<WorkspacesScreen data={data} ui={ui} viewport="phone" />)
    await expect.element(blockFallbacks()).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Stop' })).toBeVisible()
  })
})
