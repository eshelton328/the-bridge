// The tabs the workbench shows (`shownTabs.ts`): what the screen gets back when only the ui changes (#520's review, note 1).
import { ChatSummary, LayoutNode, TabLayout, chatsOf } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import { workspacesHome } from './home.ts'
import { liveTabsOf } from './liveLayout.ts'
import { withShownTabs } from './shownTabs.ts'

const pane = (local: string) => ({ kind: 'pane', chat: `mac-mini/${local}` }) as const
type Raw = ReturnType<typeof pane> | { kind: 'split'; direction: 'row'; ratio: number; first: Raw; second: Raw }
const row = (first: Raw, second: Raw): Raw => ({ kind: 'split', direction: 'row', ratio: 0.5, first, second })

/** herdr's active tab of five panes, a to e, with e focused. */
function fiveTab() {
  const root = LayoutNode.parse(row(pane('a'), row(pane('b'), row(pane('c'), row(pane('d'), pane('e'))))))
  const [live] = liveTabsOf([
    TabLayout.parse({
      id: 'mac-mini/w:e',
      label: 'main',
      active: true,
      root,
      focusedChat: 'mac-mini/e',
      zoomed: false,
      chats: chatsOf(root).map((id) =>
        ChatSummary.parse({
          id,
          kind: 'claude',
          title: id,
          model: null,
          contextUsed: null,
          modelId: null,
          effort: null,
          pane: `${id}-pane`,
          status: 'idle',
          parent: null,
        }),
      ),
    }),
  ])
  if (live === undefined) throw new Error('no tab')
  return live
}

describe('withShownTabs', () => {
  it('keeps the data object when it only draws the active tab around an opened chat (R74)', () => {
    const data = { ...workspacesHome.data, current: 'w', liveTabs: { w: [fiveTab()] } }
    // The owner opened b, which the four drawn panes leave out.
    const ui = {
      ...workspacesHome.ui,
      workspace: 'w',
      focusedPane: 'b',
      layouts: { w: { panes: ['a', 'c', 'd', 'e'] } },
    }
    const shown = withShownTabs(data, ui)
    expect(shown.ui.layouts?.w?.panes).toContain('b')
    expect(shown.data).toBe(data)
  })

  it('gives back both objects when nothing changes', () => {
    const data = { ...workspacesHome.data, current: 'w', liveTabs: { w: [fiveTab()] } }
    const ui = {
      ...workspacesHome.ui,
      workspace: 'w',
      focusedPane: 'b',
      layouts: { w: { panes: ['a', 'b', 'c', 'e'] } },
    }
    const shown = withShownTabs(data, ui)
    expect(shown.data).toBe(data)
    expect(shown.ui).toBe(ui)
  })
})
