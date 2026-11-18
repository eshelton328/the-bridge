import { describe, expect, it } from 'vitest'
import { arrowRows, selectedStep, stepHeading, stepRows } from './blocks/flowLayout.ts'
import { columnArrow } from './blocks/flowLayout.ts'
import { isFullPage, leaveFullPage, openFullPage } from './screens/flowView.ts'
import { canOpenFullPage } from './screens/flowView.ts'
import { openItem } from './screens/itemView.ts'
import { toolkitStates } from './states/index.ts'

const { workflowFullPage, workflowOpen } = toolkitStates
const { hookOpen, workflowOpenTablet, workflowOpenPhone } = toolkitStates
const page = workflowFullPage.data.details.find((d) => d.path === 'workflows/skill-eval-round.md')?.flowPage

describe('isFullPage', () => {
  it('fills the page only for a workflow with a page, opened with Open full page (D13)', () => {
    expect(isFullPage(openItem(workflowFullPage.data, workflowFullPage.ui), workflowFullPage.ui)).toBe(true)
    expect(isFullPage(openItem(workflowFullPage.data, workflowFullPage.ui), { flowFullPage: false })).toBe(false)
    // A hook has no page, so Open full page leaves it beside the list.
    expect(isFullPage(openItem(hookOpen.data, hookOpen.ui), { flowFullPage: true })).toBe(false)
    expect(isFullPage(null, { flowFullPage: true })).toBe(false)
  })

  it('opens on How it works, and a crumb goes back to the list, narrowed by the kind crumb', () => {
    expect(openFullPage()).toEqual({ flowFullPage: true, itemTab: 'how' })
    expect(leaveFullPage()).toEqual({ open: null, from: null, flowFullPage: false })
    expect(leaveFullPage('workflow')).toEqual({ open: null, from: null, flowFullPage: false, filter: 'workflow' })
  })
})

describe('Open full page', () => {
  it('shows the workflow page from the open workflow on every layout (D8, T18, M21)', () => {
    for (const state of [workflowOpen, workflowOpenTablet, workflowOpenPhone]) {
      const ui = { ...state.ui, ...openFullPage() }
      const open = openItem(state.data, ui)
      expect(isFullPage(open, ui)).toBe(true)
      expect(open?.tab).toBe('how')
      expect(open?.detail.flowPage?.stages.length).toBeGreaterThan(0)
    }
  })

  it('is unavailable for an item with no page, so it never lands on an empty tab', () => {
    expect(canOpenFullPage(openItem(workflowOpen.data, workflowOpen.ui))).toBe(true)
    expect(canOpenFullPage(openItem(hookOpen.data, hookOpen.ui))).toBe(false)
    expect(canOpenFullPage(null)).toBe(false)
  })
})

describe('the flow layout', () => {
  it('forks into a parallel stage and joins out of it in the tablet column (T8)', () => {
    expect(columnArrow(1, 1)).toBe('down')
    expect(columnArrow(1, 2)).toBe('fork')
    expect(columnArrow(2, 1)).toBe('join')
  })

  it('puts a single step across the middle rows and two parallel steps at the top and the bottom', () => {
    expect(stepRows(1)).toEqual(['2/4'])
    expect(stepRows(2)).toEqual(['1/3', '3/5'])
  })

  it('puts the arrows between stages at the cards of the stage with more steps', () => {
    expect(arrowRows(1, 1)).toEqual(['2/4'])
    expect(arrowRows(1, 2)).toEqual(['1/3', '3/5'])
    expect(arrowRows(2, 1)).toEqual(['1/3', '3/5'])
  })
})

describe('selectedStep', () => {
  it('selects the step in ui.flowStep, else the first step with fields', () => {
    expect(page).toBeDefined()
    if (page === undefined) return
    expect(selectedStep(page, '5')?.title).toBe('Second grades')
    expect(selectedStep(page, undefined)?.title).toBe('Primary grades')
    expect(selectedStep(page, 'nothing')?.title).toBe('Primary grades')
  })

  it('heads a numbered step with its number, a gate with its title', () => {
    expect(stepHeading({ type: 'step', mark: '4', title: 'Primary grades' })).toBe('Step 4 · Primary grades')
    expect(stepHeading({ type: 'gate', mark: '?', title: 'Owner decides' })).toBe('Owner decides')
  })
})
