import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { resetRetries } from '../../errors/retryGuard.ts'
import { testRender } from '../../lib/testRender.ts'
import { ArtifactsScreen } from './screens/ArtifactsScreen.tsx'
import { artifactsStates } from './states/index.ts'

// d-084 and audit P-9: each rich block of the open artifact sits in its own BlockBoundary, so one block that fails
// to render shows the block's fallback and the rest of the screen stays. Each test makes one kind of block throw:
// the preview, one message of the discussion, the proposal with its diff.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const crash = vi.hoisted(() => ({ preview: false, message: false, proposal: false }))

vi.mock(import('./blocks/ArtifactPreview.tsx'), async (importOriginal) => {
  const original = await importOriginal()
  return {
    ...original,
    ArtifactPreview: (props: Parameters<typeof original.ArtifactPreview>[0]) => {
      if (crash.preview) throw new Error('preview crash')
      return original.ArtifactPreview(props)
    },
  }
})

vi.mock(import('./blocks/ArtifactProposal.tsx'), async (importOriginal) => {
  const original = await importOriginal()
  return {
    ...original,
    ArtifactProposal: (props: Parameters<typeof original.ArtifactProposal>[0]) => {
      if (crash.proposal) throw new Error('proposal crash')
      return original.ArtifactProposal(props)
    },
  }
})

vi.mock(import('./blocks/DiscussionEntry.tsx'), async (importOriginal) => {
  const original = await importOriginal()
  return {
    ...original,
    DiscussionEntry: (props: Parameters<typeof original.DiscussionEntry>[0]) => {
      if (crash.message && props.entry.type === 'user') throw new Error('message crash')
      return original.DiscussionEntry(props)
    },
  }
})

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  crash.preview = false
  crash.message = false
  crash.proposal = false
  resetRetries()
  vi.restoreAllMocks()
})

const fallback = () => page.getByRole('alert').getByText('This part failed to render.')

async function renderChangeProposed() {
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  await page.viewport(1512, 982)
  const { data, ui } = artifactsStates.changeProposed
  view = await testRender(<ArtifactsScreen data={data} ui={ui} viewport="desktop" />)
}

describe('the Artifacts block boundaries', () => {
  it("keeps the artifact's title and bar when its preview fails", async () => {
    crash.preview = true
    await renderChangeProposed()
    await expect.element(fallback()).toBeVisible()
    await expect.element(page.getByRole('heading', { name: 'Skill eval pass rates' })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Discuss' })).toBeVisible()
    // The discussion beside it still renders its entries.
    await expect.element(page.getByText('Proposed · Update this artifact')).toBeVisible()
  })

  it('keeps the other entries when one message of the discussion fails', async () => {
    crash.message = true
    await renderChangeProposed()
    await expect.element(fallback()).toBeVisible()
    await expect.element(page.getByText(/The pass rates come from the method log/)).toBeVisible()
    await expect.element(page.getByText('Proposed · Update this artifact')).toBeVisible()
    await expect.element(page.getByRole('heading', { name: 'Skill eval pass rates' })).toBeVisible()
  })

  it('keeps the messages when the proposal with its diff fails', async () => {
    crash.proposal = true
    await renderChangeProposed()
    await expect.element(fallback()).toBeVisible()
    await expect.element(page.getByText(/Add a dashed line at the median pass rate/)).toBeVisible()
    await expect.element(page.getByText(/The pass rates come from the method log/)).toBeVisible()
    await expect.element(page.getByRole('heading', { name: 'Skill eval pass rates' })).toBeVisible()
  })
})
