import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { ArtifactsScreen } from './screens/ArtifactsScreen.tsx'
import { artifactsStates } from './states/index.ts'
import type { ArtifactsData, ArtifactsUi } from './types.ts'

// The open artifact's project chip (D2 403:472, T2 405:440): a button with the folder, the project and a chevron
// (403:476) that opens the project menu; picking a project files the artifact in it. The phone's chip (M2) stays text,
// as its ⋯ opens File in a project (M7).
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
})

function Harness({
  data,
  start,
  viewport,
}: {
  data: ArtifactsData
  start: ArtifactsUi
  viewport: 'desktop' | 'tablet' | 'phone'
}) {
  const [ui, setUi] = useState(start)
  return (
    <ArtifactsScreen
      data={data}
      ui={ui}
      viewport={viewport}
      onUiChange={(change) => {
        setUi((now) => ({ ...now, ...change }))
      }}
    />
  )
}

function chip(): HTMLElement {
  const el = document.querySelector<HTMLElement>('[data-figma="project · File in a project"] > *')
  if (el === null) throw new Error('no project chip')
  return el
}

describe('the project chip', () => {
  it('opens the project menu and files the artifact on the desktop (D2)', async () => {
    await page.viewport(1512, 982)
    const { data, ui } = artifactsStates.artifactOpen
    view = await testRender(<Harness data={data} start={ui} viewport="desktop" />)
    expect(chip().tagName).toBe('BUTTON')
    expect(chip().getAttribute('aria-label')).toBe('File in a project: skill-evals')
    // D2 403:476: the chevron after the project.
    expect(chip().querySelectorAll('svg')).toHaveLength(2)
    await userEvent.click(chip())
    await expect
      .element(page.getByRole('menuitemradio', { name: 'skill-evals' }))
      .toHaveAttribute('aria-checked', 'true')
    await expect.element(page.getByRole('menuitemradio', { name: 'Not in a project' })).toBeVisible()
    await userEvent.click(page.getByRole('menuitemradio', { name: 'omni', exact: true }))
    await expect.poll(() => chip().getAttribute('aria-label')).toBe('File in a project: omni')
  })

  it('opens the project menu on the tablet (T2)', async () => {
    await page.viewport(756, 1024)
    const { data, ui } = artifactsStates.artifactTablet
    view = await testRender(<Harness data={data} start={ui} viewport="tablet" />)
    await userEvent.click(chip())
    await expect.element(page.getByRole('menuitemradio', { name: 'skill-evals' })).toBeVisible()
  })

  it('stays text on the phone (M2)', async () => {
    await page.viewport(390, 844)
    const { data, ui } = artifactsStates.artifactPhone
    view = await testRender(<Harness data={data} start={ui} viewport="phone" />)
    expect(chip().tagName).not.toBe('BUTTON')
  })
})
