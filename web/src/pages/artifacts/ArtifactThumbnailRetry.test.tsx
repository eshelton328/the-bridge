import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import type { ReactElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { resetRetries } from '../../errors/retryGuard.ts'
import { testRender } from '../../lib/testRender.ts'
import { ArtifactRow } from './blocks/ArtifactRow.tsx'
import { LibraryCard } from './blocks/LibraryCard.tsx'
import { LibraryRow } from './blocks/LibraryRow.tsx'
import { artifactsStates } from './states/index.ts'
import type { ArtifactCard } from './types.ts'

// d-084: a card's or row's preview sits in a BlockBoundary. A card or row that opens its artifact draws its title
// button's hit area over the whole card (an `::after` at inset 0), so the fallback's Retry must sit above it: a real
// click on Retry resets the boundary and does not open the artifact.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const thumb = vi.hoisted(() => ({ crash: false, renders: 0 }))

vi.mock(import('@eshelton328/component-library-1701'), async (importOriginal) => {
  const original = await importOriginal()
  return {
    ...original,
    Thumbnail: (props: Parameters<typeof original.Thumbnail>[0]) => {
      thumb.renders += 1
      if (thumb.crash) throw new Error('thumbnail crash')
      return original.Thumbnail(props)
    },
  }
})

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  thumb.crash = false
  thumb.renders = 0
  resetRetries()
  vi.restoreAllMocks()
})

async function retryWithoutOpening(render: (card: ArtifactCard, onOpen: (id: string) => void) => ReactElement) {
  const card = artifactsStates.library.data.groups[0]?.cards[0]
  if (card === undefined) throw new Error('the library state has no card')
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  await page.viewport(1512, 982)
  const onOpen = vi.fn<(id: string) => void>()
  thumb.crash = true
  view = await testRender(render(card, onOpen))
  const fallback = page.getByRole('alert').getByText('This part failed to render.')
  await expect.element(fallback).toBeVisible()
  // The next render succeeds, so a Retry that reaches the boundary shows the preview again.
  thumb.crash = false
  const before = thumb.renders
  await page.getByRole('button', { name: 'Retry' }).click()
  await expect.element(fallback).not.toBeInTheDocument()
  expect(thumb.renders).toBeGreaterThan(before)
  expect(onOpen).not.toHaveBeenCalled()
}

describe("a card's or row's failed preview", () => {
  it('retries from the card without opening the artifact', async () => {
    await retryWithoutOpening((card, onOpen) => <LibraryCard card={card} onOpen={onOpen} />)
  })

  it('retries from a row beside the open artifact without opening it', async () => {
    await retryWithoutOpening((card, onOpen) => <ArtifactRow card={card} onOpen={onOpen} />)
  })

  it('retries from a phone row without opening the artifact', async () => {
    await retryWithoutOpening((card, onOpen) => <ArtifactRow card={card} layout="phone" onOpen={onOpen} />)
  })

  it("retries from the list view's row without opening the artifact", async () => {
    await retryWithoutOpening((card, onOpen) => <LibraryRow card={card} query="" onOpen={onOpen} />)
  })
})
