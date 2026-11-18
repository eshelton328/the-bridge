import { afterEach, describe, expect, it, vi } from 'vitest'
import { testRender } from '../../lib/testRender.ts'
import { useTabInView } from './blocks/useTabInView.ts'

// The item's tabs keep the selected tab in view when the tab list narrows with no tab change (a tablet resized to
// the phone's width with Activity selected, M15): the list scrolls again when its width changes. Five 100 px tabs,
// the last selected, in a list that first holds them all and then is 150 wide.
let view: { unmount: () => Promise<void> } | undefined
afterEach(async () => {
  await view?.unmount()
  view = undefined
  vi.restoreAllMocks()
})

const tabs = ['overview', 'how', 'files', 'links', 'activity']

function Tabs({ tab }: { tab: string }) {
  const ref = useTabInView(tab)
  return (
    <section ref={ref}>
      <div role="tablist" data-testid="tabs">
        {tabs.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={t === tab}>
            {t}
          </button>
        ))}
      </div>
    </section>
  )
}

// The fixture's sizes, set on the rendered list: a 600 wide row of 100 wide tabs that scrolls sideways.
function list() {
  const found = document.querySelector('[data-testid="tabs"]')
  if (!(found instanceof HTMLElement)) throw new Error('no tab list')
  return found
}

async function renderTabs(tab: string) {
  const rendered = await testRender(<Tabs tab={tab} />)
  const el = list()
  Object.assign(el.style, { display: 'flex', overflowX: 'auto', width: '600px' })
  for (const t of el.querySelectorAll('[role="tab"]')) {
    if (t instanceof HTMLElement) t.style.flex = '0 0 100px'
  }
  return { rendered, el }
}

function selectedMiddleInside(el: HTMLElement) {
  const selected = el.querySelector('[role="tab"][aria-selected="true"]')
  if (selected === null) throw new Error('no selected tab')
  const box = el.getBoundingClientRect()
  const tab = selected.getBoundingClientRect()
  const middle = (tab.left + tab.right) / 2
  return middle >= box.left && middle <= box.right
}

describe('useTabInView', () => {
  it('scrolls the selected tab back into view when the tab list narrows', async () => {
    const { rendered, el } = await renderTabs('activity')
    view = rendered
    expect(el.scrollLeft).toBe(0)
    expect(selectedMiddleInside(el)).toBe(true)
    el.style.width = '150px'
    await expect.poll(() => el.scrollLeft).toBeGreaterThan(0)
    expect(selectedMiddleInside(el)).toBe(true)
  })

  it('stops watching the tab list when it unmounts', async () => {
    const disconnect = vi.spyOn(ResizeObserver.prototype, 'disconnect')
    view = (await renderTabs('activity')).rendered
    await view.unmount()
    view = undefined
    expect(disconnect).toHaveBeenCalled()
  })
})
