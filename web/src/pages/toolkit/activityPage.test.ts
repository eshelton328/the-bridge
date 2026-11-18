import { describe, expect, it } from 'vitest'
import {
  activityCounts,
  activitySource,
  activityViewLayout,
  axisLabels,
  calledLayer,
  changeView,
  closeRun,
  dailyBars,
  kpiViewLayer,
  logLayer,
  openCalled,
  openRun,
  panelLayer,
  runLayer,
  seriesTone,
  showRun,
  sourceItems,
} from './blocks/activityPage.ts'
import { openItem } from './screens/itemView.ts'
import { toolkitStates } from './states/index.ts'
import type { ToolkitActivityView, ToolkitData } from './types.ts'

const { toolkitActivity, toolkitActivityRun, toolkitActivityTablet, toolkitActivityPhone } = toolkitStates

function viewOf(data: ToolkitData): ToolkitActivityView {
  if (data.activity === undefined) throw new Error('no activity')
  return data.activity
}

describe('activitySource and activityCounts', () => {
  const view = viewOf(toolkitActivity.data)

  it('counts All sessions when no source is picked (D11)', () => {
    expect(activitySource(view, {})).toBe('all')
    expect(activityCounts(view, { filter: 'all' })?.kpis[0]?.value).toBe('2,052')
  })

  it('counts the picked source in D11, and falls back to All for a source with no counts', () => {
    expect(activitySource(view, { activitySource: 'chats' })).toBe('chats')
    expect(activitySource(view, { activitySource: 'headless' })).toBe('headless')
    const all = view.counts.all
    if (all === undefined) throw new Error('no counts')
    expect(activitySource({ ...view, counts: { all } }, { activitySource: 'chats' })).toBe('all')
  })

  it('keeps only the picked kind in the runs, Most called and the log, and every key figure', () => {
    const agents = activityCounts(view, { filter: 'agent' })
    expect(agents?.running.rows.map((r) => r.name)).toEqual(['writing-reviewer', 'pr-description-checker'])
    expect(agents?.mostCalled.rows.every((r) => r.kind === 'agent')).toBe(true)
    expect(agents?.log?.rows.map((r) => r.time)).toEqual(['01:16:40', '01:08:47'])
    expect(agents?.kpis).toEqual(view.counts.all?.kpis)
  })

  it('has no counts for a view with none for All', () => {
    expect(activityCounts({ ...view, counts: {} }, { filter: 'all' })).toBeUndefined()
  })
})

describe('sourceItems', () => {
  it('enables every source in D11, D12, T9 and M10, and disables one with no counts (D11 444:491)', () => {
    expect(sourceItems(viewOf(toolkitActivity.data))).toEqual([
      { value: 'all', label: 'All sessions', disabled: false },
      { value: 'chats', label: 'Chats', disabled: false },
      { value: 'headless', label: 'Headless runs', disabled: false },
    ])
    for (const state of [toolkitActivityRun, toolkitActivityTablet, toolkitActivityPhone]) {
      expect(sourceItems(viewOf(state.data)).every((s) => !s.disabled)).toBe(true)
    }
    const all = viewOf(toolkitActivity.data).counts.all
    if (all === undefined) throw new Error('no counts')
    expect(sourceItems({ ...viewOf(toolkitActivity.data), counts: { all } }).map((s) => s.disabled)).toEqual([
      false,
      true,
      true,
    ])
    expect(sourceItems(viewOf(toolkitActivityTablet.data)).map((s) => s.label)).toEqual(['All', 'Chats', 'Headless'])
  })
})

describe('the run taps', () => {
  it('opens a run by its id and closes it again (D11 to D12 and back)', () => {
    const view = viewOf(toolkitActivityRun.data)
    expect(openRun(view, toolkitActivityRun.ui)?.detail?.fields).toHaveLength(9)
    expect(openRun(view, {})).toBeNull()
    expect(openRun(view, { run: 'nothing' })).toBeNull()
    expect({ ...toolkitActivity.ui, ...showRun('writing-reviewer') }).toEqual(toolkitActivityRun.ui)
    expect({ ...toolkitActivityRun.ui, ...closeRun() }.run).toBeUndefined()
  })

  it('opens every run of every Activity state, the ones with no detail on what their row says', () => {
    for (const state of [toolkitActivity, toolkitActivityRun, toolkitActivityTablet, toolkitActivityPhone]) {
      const view = viewOf(state.data)
      for (const r of view.counts.all?.running.rows ?? []) expect(openRun(view, showRun(r.id))?.id).toBe(r.id)
    }
  })

  it('keys D12 by its page header, its panel header and its button, which the frame names twice', () => {
    expect(openRun(viewOf(toolkitActivityRun.data), toolkitActivityRun.ui)?.detail?.layers).toEqual({
      pageHeader: '445:154',
      header: '445:466',
      openSession: '445:478',
    })
    expect(openRun(viewOf(toolkitActivity.data), showRun('writing-reviewer'))?.detail?.layers).toBeUndefined()
  })
})

describe('openCalled and changeView', () => {
  it('opens each Most called item on its page from the list, in every Activity state', () => {
    for (const state of [toolkitActivity, toolkitActivityTablet, toolkitActivityPhone]) {
      for (const r of viewOf(state.data).counts.all?.mostCalled.rows ?? []) {
        const ui = { ...state.ui, ...openCalled(r.path) }
        expect(ui.view).toBe('list')
        expect(openItem(state.data, ui)?.item.name).toBe(r.name)
      }
    }
  })

  it('closes the run when the view changes (the switch, the tablet’s Back to Toolkit)', () => {
    expect(changeView('list')).toEqual({ view: 'list', run: undefined })
    expect(openCalled('skills/writer/').run).toBeUndefined()
  })
})

describe('the calls per day', () => {
  const perDay = viewOf(toolkitActivity.data).counts.all?.perDay
  if (perDay === undefined) throw new Error('no calls per day')

  it('gives 16 days from Oct 31 to Nov 15, the counts summing to the key figures', () => {
    const headless = dailyBars(perDay, 0)
    expect(headless).toHaveLength(16)
    expect(headless[0]).toEqual({ date: '2026-10-31', label: 'Oct 31', value: 0 })
    expect(headless[9]).toEqual({ date: '2026-11-09', label: 'Nov 9', value: 1777 })
    expect(headless.at(-1)?.label).toBe('Nov 15')
    expect(headless.reduce((n, d) => n + d.value, 0)).toBe(2027)
    expect(dailyBars(perDay, 1).reduce((n, d) => n + d.value, 0)).toBe(25)
    expect(dailyBars(perDay, 5).every((d) => d.value === 0)).toBe(true)
  })

  it('draws the headless runs violet and the chats cyan', () => {
    expect(seriesTone('headless')).toBe('running')
    expect(seriesTone('chats')).toBe('accent')
  })

  it('names the days under the last chart only, with the middle day on the desktop', () => {
    expect(axisLabels('desktop', false)).toBe('none')
    expect(axisLabels('desktop', true)).toBe('endsAndMiddle')
    expect(axisLabels('tablet', true)).toBe('ends')
    expect(axisLabels('phone', true)).toBe('ends')
  })
})

describe('activityViewLayout and the Figma keys', () => {
  it('sets the key figures and the panels by layout (D11, T9, M10)', () => {
    expect(activityViewLayout('desktop')).toEqual({ kpiColumns: 4, kpiGap: '12', panels: true })
    expect(activityViewLayout('tablet')).toEqual({ kpiColumns: 4, kpiGap: '8', panels: false })
    expect(activityViewLayout('phone')).toEqual({ kpiColumns: 2, kpiGap: '8', panels: false })
  })

  it('names the parts as the frames do', () => {
    expect(kpiViewLayer({ label: 'toolkit calls' })).toBe('kpi · toolkit calls')
    expect(runLayer({ name: 'writing-reviewer' })).toBe('run · writing-reviewer')
    expect(calledLayer({ name: 'writer' })).toBe('bar · writer')
    expect(logLayer({ time: '01:16:40' })).toBe('log · 01:16:40')
    expect(panelLayer('Running now', 'desktop')).toBe('panel · RUNNING NOW')
    expect(panelLayer('Calls per day', 'tablet')).toBe('panel · calls per day')
  })

  it('shows the phone two runs and the tablet three, with no chips (M10, T9)', () => {
    expect(viewOf(toolkitActivityPhone.data).counts.all?.running.rows.map((r) => r.meta)).toEqual([
      'omni-brain · f-005',
      'step 4 of 8 · writer round 7',
    ])
    expect(viewOf(toolkitActivityTablet.data).counts.all?.running.rows.every((r) => r.chips === undefined)).toBe(true)
  })
})
