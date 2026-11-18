import { describe, expect, it } from 'vitest'
import {
  badgeLayer,
  badgeLook,
  badgeResult,
  casesLabel,
  chartSeries,
  evalsRow,
  openEvals,
  roundsEnd,
} from './blocks/evalsView.ts'
import { openItem } from './screens/itemView.ts'
import { toolkitStates } from './states/index.ts'
import type { ToolkitData, ToolkitEvals, ToolkitUi } from './types.ts'

const { skillEvals, ruleEvals, agentEvals, workflowEvals, hookEvals } = toolkitStates
const { skillEvalsTablet, skillEvalsPhone, agentEvalsTablet, agentEvalsPhone } = toolkitStates

function evalsOf(state: { data: ToolkitData; ui: ToolkitUi }): ToolkitEvals {
  const open = openItem(state.data, state.ui)
  if (open?.detail.results === undefined) throw new Error('no evals')
  return open.detail.results
}

describe('badgeLook', () => {
  it('draws a pass in the done colour with a check, a fail in red with a cross, a wait in amber with no icon', () => {
    expect(badgeLook('pass')).toEqual({ tone: 'done', icon: 'check' })
    expect(badgeLook('fail')).toEqual({ tone: 'danger', icon: 'cross' })
    expect(badgeLook('waits')).toEqual({ tone: 'needsYou', icon: null })
  })

  it('names each badge as Figma does, a waiting criterion by its number only (D20 482:1923)', () => {
    const badges = evalsOf(skillEvals).status.badges ?? []
    expect(badges.map(badgeLayer)).toEqual([
      'badge · D1 Quality',
      'badge · D2 Value',
      'badge · D3 Known failures',
      'badge · D4 Triggering',
      'badge · D5 Reviewer',
      'badge · D6',
    ])
  })
})

describe('casesLabel', () => {
  it('counts the rows after the label (D20 CASES · 5, D26 DRAFTS · 9, D28 TEST GROUPS · 5)', () => {
    const label = (state: { data: ToolkitData; ui: ToolkitUi }) => {
      const cases = evalsOf(state).cases
      if (cases === undefined) throw new Error('no cases')
      return casesLabel(cases)
    }
    expect(label(skillEvals)).toBe('Cases · 5')
    expect(label(agentEvals)).toBe('Drafts · 9')
    expect(label(hookEvals)).toBe('Test groups · 5')
  })
})

describe('roundsEnd', () => {
  const end = (state: { data: ToolkitData; ui: ToolkitUi }) => {
    const rounds = evalsOf(state).rounds
    if (rounds === undefined) throw new Error('no rounds')
    return roundsEnd(rounds)
  }

  it('counts the rule’s ledgers, with no tap (D25 4 ledgers)', () => {
    expect(end(ruleEvals)).toEqual({ label: '4 ledgers', action: 'none' })
  })

  it('opens the workflow’s Files tab from "from the file" (D27)', () => {
    expect(end(workflowEvals)).toEqual({ label: 'from the file', action: 'tab', tab: 'files' })
  })

  it('keeps Open the ledger waiting for a design: the ledger is outside the toolkit (D20, D26)', () => {
    expect(end(skillEvals)).toEqual({ label: 'Open the ledger', action: 'waits' })
    expect(end(agentEvals)).toEqual({ label: 'Open the ledger', action: 'waits' })
  })

  it('shows nothing at the end of a header with no end', () => {
    expect(roundsEnd({ label: 'Rounds', items: [{ name: 'r1', meta: '', text: '' }] })).toBeNull()
  })
})

describe('evalsRow', () => {
  it('puts the chart and the cases side by side on the desktop only, and only when there are both', () => {
    expect(evalsRow(evalsOf(skillEvals), 'desktop')).toBe('pair')
    expect(evalsRow(evalsOf(skillEvalsTablet), 'tablet')).toBe('stack')
    expect(evalsRow(evalsOf(skillEvalsPhone), 'phone')).toBe('stack')
    expect(evalsRow(evalsOf(agentEvals), 'desktop')).toBe('stack')
    expect(evalsRow(evalsOf(hookEvals), 'desktop')).toBe('stack')
  })
})

describe('chartSeries', () => {
  it('draws the skill’s bars in the accent colour and the baseline grey (D20 482:1933, 482:1934)', () => {
    const chart = evalsOf(skillEvals).chart
    if (chart === undefined) throw new Error('no chart')
    expect(chartSeries(chart)).toEqual([
      { name: 'with the skill', tone: 'accent' },
      { name: 'without the skill', tone: 'muted' },
    ])
    expect(chart.groups.map((g) => g.label)).toEqual(['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'x1'])
    expect(chart.groups.every((g) => g.values.every((v) => v <= chart.max))).toBe(true)
  })
})

describe('openEvals', () => {
  it('opens the agent from writer’s D5 Reviewer on its Evals tab, as T25 shows it', () => {
    const badge = evalsOf(skillEvalsTablet).status.badges?.find((b) => b.label === 'D5 Reviewer')
    if (badge?.open === undefined) throw new Error('no badge')
    const ui = { ...skillEvalsTablet.ui, ...openEvals(badge.open, 'skills/writer/') }
    expect(ui).toMatchObject({ open: agentEvalsTablet.ui.open, from: agentEvalsTablet.ui.from, itemTab: 'evals' })
    // The tap gives T25's agent: the same details as the agent's own Evals state.
    expect(openItem(skillEvalsTablet.data, ui)?.detail).toEqual(
      openItem(agentEvalsTablet.data, agentEvalsTablet.ui)?.detail,
    )
  })

  it('opens writer from the rule’s first ledger with D20’s Evals tab, though the rule’s list has no skills', () => {
    const ledger = evalsOf(ruleEvals).rounds?.items.find((r) => r.name === 'writer')
    if (ledger?.open === undefined) throw new Error('no ledger')
    const open = openItem(ruleEvals.data, { ...ruleEvals.ui, ...openEvals(ledger.open, 'rules/skills.md') })
    expect(open?.tab).toBe('evals')
    expect(open?.detail.results).toEqual(evalsOf(skillEvals))
  })

  it('opens a ledger’s skill with no Evals tab on its first tab', () => {
    const open = openItem(ruleEvals.data, { ...ruleEvals.ui, ...openEvals('skills/ambitious/', 'rules/skills.md') })
    expect(open?.item.name).toBe('ambitious')
    expect(open?.tab).toBe('overview')
  })

  it('clears the Files tab’s file and line, and records no way back to the item itself', () => {
    expect(openEvals('skills/writer/', 'skills/writer/')).toEqual({
      open: 'skills/writer/',
      from: null,
      itemTab: 'evals',
      file: undefined,
      fileView: undefined,
      filePage: undefined,
      line: undefined,
    })
  })

  it('gives the phone’s agent the tablet’s evals, with no breadcrumb (M28, as M20)', () => {
    expect(evalsOf(agentEvalsPhone)).toEqual(evalsOf(agentEvalsTablet))
    expect('from' in agentEvalsPhone.ui).toBe(false)
    expect(agentEvalsTablet.ui.from).toBe('skills/writer/')
  })
})

// Every open item a state can show with an Evals tab: the item each of its details names, resolved as a tap opens it.
function evalsTaps(): {
  state: string
  s: { data: ToolkitData; ui: ToolkitUi }
  path: string
  evals: ToolkitEvals
}[] {
  return Object.entries(toolkitStates).flatMap(([state, s]) => {
    const data: ToolkitData = s.data
    return (data.details ?? []).flatMap((d) => {
      const evals = openItem(data, { ...s.ui, open: d.path })?.detail.results
      return evals === undefined ? [] : [{ state, s, path: d.path, evals }]
    })
  })
}

describe('the targets of the Evals taps in every state', () => {
  it('gives each badge that opens another item that item’s Evals results (D3 Skill evals, then D5 Reviewer)', () => {
    const missing = evalsTaps().flatMap(({ state, s, path, evals }) =>
      (evals.status.badges ?? []).flatMap((b) => {
        if (b.open === undefined) return []
        const target = openItem(s.data, { ...s.ui, ...openEvals(b.open, path) })
        return target?.detail.results === undefined ? [`${state}: ${path} › ${b.label}`] : []
      }),
    )
    expect(missing).toEqual([])
    expect(evalsTaps().some((t) => t.state === 'skillOpen' && t.path === 'skills/writer/')).toBe(true)
  })
})

describe('the Files tab that "from the file" opens in every state', () => {
  it('gives each item whose rounds end opens its Files tab a file browser (D8 Evals, then "from the file")', () => {
    const missing = evalsTaps().flatMap(({ state, s, path, evals }) => {
      const end = evals.rounds === undefined ? null : roundsEnd(evals.rounds)
      if (end?.action !== 'tab' || end.tab !== 'files') return []
      const open = openItem(s.data, { ...s.ui, open: path, itemTab: 'files' })
      return open?.detail.browser === undefined ? [`${state}: ${path}`] : []
    })
    expect(missing).toEqual([])
    expect(evalsTaps().some((t) => t.state === 'workflowOpen')).toBe(true)
  })
})

describe('badgeResult', () => {
  it('gives each badge its state as text, unless its label ends with it (D20, D28)', () => {
    expect(badgeResult({ label: 'D1 Quality', state: 'fail' })).toBe('failed')
    expect(badgeResult({ label: 'D2 Value', state: 'pass' })).toBe('passed')
    expect(badgeResult({ label: 'D6', state: 'waits' })).toBe('waits')
    expect(badgeResult({ label: 'D6 Real use · waits', state: 'waits' })).toBeNull()
    expect(badgeResult({ label: '43 of 43 pass', state: 'pass' })).toBeNull()
  })
})
