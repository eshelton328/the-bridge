import { describe, expect, it } from 'vitest'
import { activityLayout, kpiCaption, kpiLayer, rowLayer, rowTap, tabScroll } from './blocks/activityView.ts'
import { openEvals } from './blocks/evalsView.ts'
import { openItem } from './screens/itemView.ts'
import { toolkitStates } from './states/index.ts'
import type { ToolkitActivity, ToolkitData, ToolkitUi } from './types.ts'

const { skillActivity, ruleActivity, agentActivity, workflowActivity, hookActivity } = toolkitStates
const { skillActivityTablet, skillActivityPhone, agentActivityTablet, agentActivityPhone } = toolkitStates

type State = { data: ToolkitData; ui: ToolkitUi }

function activityOf(state: State): ToolkitActivity {
  const open = openItem(state.data, state.ui)
  if (open?.detail.activity === undefined) throw new Error('no activity')
  return open.detail.activity
}

describe('activityLayout', () => {
  it('sets the key figures four in a row with captions on the desktop and a tablet (D17, T13)', () => {
    expect(activityLayout('desktop')).toEqual({ kpiColumns: 4, captions: true, bars: 'pair' })
    expect(activityLayout('tablet')).toEqual({ kpiColumns: 4, captions: true, bars: 'stack' })
  })

  it('sets them two by two with no caption on the phone, the bar panels one under the other (M15)', () => {
    expect(activityLayout('phone')).toEqual({ kpiColumns: 2, captions: false, bars: 'stack' })
    const calls = activityOf(skillActivityPhone).kpis[0]
    if (calls === undefined) throw new Error('no kpi')
    expect(kpiCaption(calls, 'phone')).toBeUndefined()
    expect(kpiCaption(calls, 'tablet')).toBe('since Oct 31')
  })
})

describe('the Figma keys', () => {
  it('names each key figure as Figma does (D17 474:585, D21 491:4632, D23 491:5832)', () => {
    expect(activityOf(skillActivity).kpis.map(kpiLayer)).toEqual([
      'panel · kpi calls',
      'panel · kpi headless',
      'panel · kpi from chats',
      'panel · kpi last used',
    ])
    expect(activityOf(ruleActivity).kpis.map(kpiLayer)).toEqual([
      'panel · kpi sessions',
      'panel · kpi headless',
      'panel · kpi from chats',
      'panel · kpi last loaded',
    ])
    expect(activityOf(workflowActivity).kpis.map(kpiLayer)[0]).toBe('panel · kpi Workflow runs')
  })

  it('names each row after its title (D17 474:650, D23 row · readme · cross-family x1)', () => {
    expect(activityOf(skillActivity).list.rows.map(rowLayer)[0]).toBe('row · Linear workflow setup for NCC team')
    expect(activityOf(workflowActivity).list.rows.map(rowLayer)[0]).toBe('row · readme · cross-family x1')
  })
})

describe('rowTap', () => {
  it('opens a round’s skill on its Evals tab (D23)', () => {
    expect(activityOf(workflowActivity).list.rows.map(rowTap)).toEqual([
      { action: 'openEvals', path: 'skills/readme/' },
      { action: 'openEvals', path: 'skills/writer/' },
      { action: 'openEvals', path: 'skills/ambitious/' },
      { action: 'openEvals', path: 'skills/pr-description/' },
    ])
  })

  it('gives a chat no tap: the chat panel (D18) is not drawn yet', () => {
    for (const state of [skillActivity, ruleActivity, agentActivity, hookActivity]) {
      expect(activityOf(state).list.rows.map(rowTap)).toEqual(
        activityOf(state).list.rows.map(() => ({ action: 'none' })),
      )
    }
  })
})

describe('tabScroll', () => {
  const list = { left: 12, right: 378, scrollLeft: 0 }

  it('scrolls a tab past the list’s end until it ends at the list’s end (M15 Activity)', () => {
    expect(tabScroll(list, { left: 388, right: 461 })).toBe(83)
  })

  it('scrolls a tab before the list’s start back to it', () => {
    expect(tabScroll({ ...list, scrollLeft: 83 }, { left: -71, right: 11 })).toBe(0)
  })

  it('keeps the list where it is when the tab’s middle shows, even with its end past the list’s end', () => {
    expect(tabScroll(list, { left: 327.5, right: 384.3 })).toBeNull()
    expect(tabScroll(list, { left: 15, right: 120 })).toBeNull()
  })
})

describe('the Activity tab’s data in every state', () => {
  const states: [string, State][] = Object.entries(toolkitStates)

  it('carries the activity of each item whose tabs list Activity, so the tab is never empty', () => {
    const paths = [
      'skills/writer/',
      'rules/skills.md',
      'agents/writing-reviewer.md',
      'workflows/skill-eval-round.md',
      'hooks/commit-msg',
    ]
    for (const [name, state] of states) {
      for (const path of paths) {
        const open = openItem(state.data, { open: path, itemTab: 'activity' })
        if (open?.detail.tabs.some((t) => t.value === 'activity') !== true) continue
        expect(open.detail.activity, `${name}: ${path}`).toBeDefined()
        expect(open.tab, `${name}: ${path}`).toBe('activity')
      }
    }
  })

  it('opens the Activity tab from each Overview state (D3, D4, D7, D8, D9), as the Activity states draw it', () => {
    const pairs: [State, State][] = [
      [toolkitStates.skillOpen, skillActivity],
      [toolkitStates.ruleOpen, ruleActivity],
      [toolkitStates.agentOpen, agentActivity],
      [toolkitStates.workflowOpen, workflowActivity],
      [toolkitStates.hookOpen, hookActivity],
      [toolkitStates.skillOpenTablet, skillActivityTablet],
      [toolkitStates.skillOpenPhone, skillActivityPhone],
    ]
    for (const [overview, activity] of pairs) {
      expect(activityOf({ data: overview.data, ui: { ...overview.ui, itemTab: 'activity' } })).toEqual(
        activityOf(activity),
      )
    }
  })

  it('has the target of every row tap in each state whose open item has one (D23 and every state with its data)', () => {
    let taps = 0
    for (const [name, state] of states) {
      for (const path of ['workflows/skill-eval-round.md']) {
        const open = openItem(state.data, { open: path, itemTab: 'activity' })
        if (open?.detail.activity === undefined) continue
        for (const row of open.detail.activity.list.rows) {
          const tap = rowTap(row)
          if (tap.action === 'none') continue
          taps += 1
          const target = openItem(state.data, { ...state.ui, ...openEvals(tap.path, path) })
          expect(target?.item.path, `${name}: ${row.title}`).toBe(tap.path)
          // writer has an Evals tab: the tap lands on it, with its results, as D20 draws it.
          if (tap.path === 'skills/writer/') {
            expect(target?.tab, name).toBe('evals')
            expect(target?.detail.results, name).toEqual(
              openItem(toolkitStates.skillEvals.data, toolkitStates.skillEvals.ui)?.detail.results,
            )
          }
        }
      }
    }
    expect(taps).toBeGreaterThanOrEqual(4)
  })

  it('names the item in the back row on a tablet and the phone only for writer (T13, M15; T20 keeps its header)', () => {
    expect(activityOf(skillActivityTablet).named).toBe(true)
    expect(activityOf(toolkitStates.ruleActivityTablet).named).toBeUndefined()
    expect(agentActivityTablet.ui.from).toBe('skills/writer/')
    expect('from' in agentActivityPhone.ui).toBe(false)
  })
})
