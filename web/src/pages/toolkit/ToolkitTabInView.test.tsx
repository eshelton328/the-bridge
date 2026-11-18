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

  // M15: the list first scrolls while the web fonts load, with narrower labels, so Activity ended 1 px past the
  // list's end with its middle inside it; the hook scrolls again once `document.fonts.ready` resolves, measured from
  // the unscrolled list. Here the tabs widen from 100 to 105 before the fonts resolve, with no change to the list's
  // size: Activity's middle stays inside the list and its end 25 px past it.
  it('scrolls the selected tab into view again when the fonts have loaded', async () => {
    let fontsLoaded: (fonts: FontFaceSet) => void = () => undefined
    const ready = new Promise<FontFaceSet>((resolve) => {
      fontsLoaded = resolve
    })
    vi.spyOn(document.fonts, 'ready', 'get').mockReturnValue(ready)
    const { rendered, el } = await renderTabs('activity')
    view = rendered
    el.style.width = '150px'
    await expect.poll(() => el.scrollLeft).toBe(350)
    for (const t of el.querySelectorAll('[role="tab"]')) {
      if (t instanceof HTMLElement) t.style.flex = '0 0 105px'
    }
    expect(selectedMiddleInside(el)).toBe(true)
    fontsLoaded(document.fonts)
    await expect.poll(() => el.scrollLeft).toBe(375)
    expect(selectedMiddleInside(el)).toBe(true)
  })
})
