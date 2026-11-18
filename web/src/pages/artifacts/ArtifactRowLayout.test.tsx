import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { ArtifactsScreen } from './screens/ArtifactsScreen.tsx'
import { artifactsStates } from './states/index.ts'

document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
  await page.viewport(1512, 982)
})

// The colour a token resolves to, as the browser computes it.
function tokenColor(token: string): string {
  const probe = document.createElement('div')
  probe.style.color = `var(--colors-${token})`
  document.body.append(probe)
  const color = getComputedStyle(probe).color
  probe.remove()
  return color
}

function tokenBackground(token: string): string {
  const probe = document.createElement('div')
  probe.style.backgroundColor = `var(--colors-${token})`
  document.body.append(probe)
  const color = getComputedStyle(probe).backgroundColor
  probe.remove()
  return color
}

// The ListRow inside the element marked as Figma's row.
function listRow(title: string): HTMLElement {
  const row = document.querySelector(`[data-figma="artifact row · ${title}"] .list-row__root`)
  if (!(row instanceof HTMLElement)) throw new Error(`no ListRow for ${title}`)
  return row
}

// A ListRow slot, such as its leading, title or body.
function slot(row: HTMLElement, name: string): HTMLElement {
  const el = row.querySelector(`.list-row__${name}`)
  if (!(el instanceof HTMLElement)) throw new Error(`no list-row__${name}`)
  return el
}

// Figma's rows (Artifacts D2 403:219, D4 403:8216) are drawn by ListRow's padding, surface, trailingAlign and dot
// props (library #147), not by a box and a dot of the page's own.
describe('the artifact rows', () => {
  it('pads a D2 row 8 inside its border, 58 high, with the New dot in the title row', async () => {
    await page.viewport(1512, 982)
    const { data, ui } = artifactsStates.artifactOpen
    view = await testRender(<ArtifactsScreen data={data} ui={ui} viewport="desktop" />)
    await expect.element(page.getByText('Hono server spike', { exact: true })).toBeVisible()
    const row = listRow('Hono server spike')
    expect(row.getBoundingClientRect().height).toBe(58)
    expect(getComputedStyle(row).paddingTop).toBe('8px')
    expect(getComputedStyle(row).paddingLeft).toBe('8px')
    const dot = row.querySelector('[role="img"][aria-label="New"]')
    expect(dot).not.toBeNull()
    expect(dot?.closest('.list-row__titleRow')).not.toBeNull()
    expect(dot?.getBoundingClientRect().width).toBe(6)
    // The next row starts 2 under this one (403:219 to 403:245).
    const next = listRow('Inbox task lifecycle')
    expect(next.getBoundingClientRect().top - row.getBoundingClientRect().bottom).toBe(2)
  })

  it('draws a D4 row as a card: the pane fill in a 1 px border.default border, padded 12, 98 high', async () => {
    await page.viewport(1512, 982)
    const { data, ui } = artifactsStates.searchList
    view = await testRender(<ArtifactsScreen data={data} ui={ui} viewport="desktop" />)
    await expect.element(page.getByRole('button', { name: 'Open Skill eval pass rates' })).toBeVisible()
    const row = listRow('Skill eval pass rates')
    const style = getComputedStyle(row)
    expect(style.borderTopWidth).toBe('1px')
    expect(style.borderTopColor).toBe(tokenColor('border-default'))
    expect(style.backgroundColor).toBe(tokenBackground('surface-pane'))
    expect(style.paddingTop).toBe('12px')
    expect(row.getBoundingClientRect().height).toBe(98)
    const dot = row.querySelector('[role="img"][aria-label="New"]')
    expect(dot?.closest('.list-row__titleRow')).not.toBeNull()
  })

  it('starts a D4 row title 16 after the preview and centres its body down the row', async () => {
    await page.viewport(1512, 982)
    const { data, ui } = artifactsStates.searchList
    view = await testRender(<ArtifactsScreen data={data} ui={ui} viewport="desktop" />)
    await expect.element(page.getByRole('button', { name: 'Open Skill eval pass rates' })).toBeVisible()
    const row = listRow('Skill eval pass rates')
    const preview = slot(row, 'leading').getBoundingClientRect()
    const title = slot(row, 'title').getBoundingClientRect()
    const body = slot(row, 'body').getBoundingClientRect()
    const box = row.getBoundingClientRect()
    // Figma's preview (403:8217) ends at x 237 and the title (403:8232) starts at 253.
    expect(title.left - preview.right).toBe(16)
    // Figma's 62 px text frame (403:8230) is 18 under the top of the 98 px row (403:8216): centred down it.
    expect(body.top - box.top).toBeCloseTo(box.bottom - body.bottom, 0)
    expect(body.top - box.top).toBeGreaterThan(13)
  })
})
