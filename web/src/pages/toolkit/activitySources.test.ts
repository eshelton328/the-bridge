import { describe, expect, it } from 'vitest'
import { activityCounts, openCalled, openRun, showRun, sourceItems } from './blocks/activityPage.ts'
import {
  changeSource,
  chatItemLabel,
  chatLayer,
  closeChat,
  evalLayer,
  evalShare,
  linkLayer,
  listRows,
  narrowList,
  openChat,
  openEvalGroup,
  showAllLink,
  showAllRows,
  showChat,
  toolLayer,
} from './blocks/activitySources.ts'
import { openItem } from './screens/itemView.ts'
import { toolkitStates } from './states/index.ts'
import type { ToolkitActivityList, ToolkitActivityView, ToolkitData } from './types.ts'

const {
  toolkitActivityChats,
  toolkitActivityHeadless,
  toolkitActivityChat,
  toolkitActivityChatsTablet,
  toolkitActivityHeadlessTablet,
  toolkitActivityChatTablet,
  toolkitActivityChatsPhone,
  toolkitActivityHeadlessPhone,
  toolkitActivityChatPhone,
} = toolkitStates

const sourceStates = [
  toolkitActivityChats,
  toolkitActivityHeadless,
  toolkitActivityChat,
  toolkitActivityChatsTablet,
  toolkitActivityHeadlessTablet,
  toolkitActivityChatTablet,
  toolkitActivityChatsPhone,
  toolkitActivityHeadlessPhone,
  toolkitActivityChatPhone,
]

function viewOf(data: ToolkitData): ToolkitActivityView {
  if (data.activity === undefined) throw new Error('no activity')
  return data.activity
}

function listOf(view: ToolkitActivityView, source: 'chats' | 'headless'): ToolkitActivityList {
  const list = view.counts[source]?.list
  if (list === undefined) throw new Error(`no ${source} list`)
  return list
}

describe('the sources of D15 and D16', () => {
  it('enables every source in the states that have their counts', () => {
    for (const state of sourceStates) {
      expect(sourceItems(viewOf(state.data)).every((s) => !s.disabled)).toBe(true)
    }
  })

  it('counts the picked source, and a pick clears the open run, the open chat and Show all', () => {
    const view = viewOf(toolkitActivityChats.data)
    expect(activityCounts(view, toolkitActivityChats.ui)?.kpis.map((k) => k.value)).toEqual(['8', '25', '8', '5 · 3'])
    expect(activityCounts(view, toolkitActivityHeadless.ui)?.kpis[0]?.value).toBe('4,472')
    expect(changeSource('headless')).toEqual({ activitySource: 'headless' })
    expect('chat' in changeSource('all') && 'run' in changeSource('all')).toBe(true)
  })

  it('sums the chats and the evals to their key figures', () => {
    const view = viewOf(toolkitActivityHeadless.data)
    const evals = listOf(view, 'headless')
    if (evals.type !== 'evals') throw new Error('not evals')
    expect(evals.rows.reduce((n, g) => n + g.sessions, 0)).toBe(4472)
    expect(evals.rows.reduce((n, g) => n + g.loaded, 0)).toBe(1337)
    expect(evals.rows.reduce((n, g) => n + Number.parseInt(g.calls, 10), 0)).toBe(2027)
    const chats = listOf(view, 'chats')
    if (chats.type !== 'chats') throw new Error('not chats')
    const reviewer = chats.rows.flatMap((c) => c.items).filter((i) => i.name === 'writing-reviewer')
    expect(reviewer.reduce((n, i) => n + (i.times ?? 1), 0)).toBe(15)
  })

  it('narrows the list by the kind chip: the chats that used that kind, the evals of that kind', () => {
    const view = viewOf(toolkitActivityChats.data)
    const agents = activityCounts(view, { ...toolkitActivityChats.ui, filter: 'agent' })?.list
    expect(agents?.type === 'chats' ? agents.rows.map((c) => c.title) : []).toEqual([
      'Brain NC1701 project',
      'Deep research on evals',
      'Writer rules, skills, and agents',
    ])
    expect(narrowList(listOf(view, 'headless'), 'agent').rows).toHaveLength(0)
    expect(narrowList(listOf(view, 'headless'), 'skill').rows).toHaveLength(5)
  })
})

describe('Show all', () => {
  it('shows the first rows, then every row once pressed (D16 four, T12 seven)', () => {
    const desktop = listOf(viewOf(toolkitActivityHeadless.data), 'headless')
    expect(listRows(desktop, undefined)).toHaveLength(4)
    expect(listRows(desktop, true)).toHaveLength(7)
    expect(listRows(listOf(viewOf(toolkitActivityHeadlessTablet.data), 'headless'), undefined)).toHaveLength(7)
    expect(showAllRows()).toEqual({ activityShowAll: true })
  })

  it('links Show all 7 evals, waits on Show all 8 chats with five known, and hides it once all show', () => {
    expect(showAllLink(listOf(viewOf(toolkitActivityHeadlessPhone.data), 'headless'), undefined)).toEqual({
      label: 'Show all 7 evals',
    })
    const chats = showAllLink(listOf(viewOf(toolkitActivityChats.data), 'chats'), undefined)
    expect(chats?.label).toBe('Show all 8 chats')
    expect(chats?.waits).toContain('5 of the 8')
    expect(showAllLink(listOf(viewOf(toolkitActivityHeadlessTablet.data), 'headless'), undefined)).toBeNull()
    expect(showAllLink(listOf(viewOf(toolkitActivityChatsTablet.data), 'chats'), undefined)?.waits).toContain(
      '5 of the 8',
    )
    expect(showAllLink(listOf(viewOf(toolkitActivityHeadless.data), 'headless'), true)).toBeNull()
  })
})

describe('the chat taps', () => {
  it('opens a chat by its id and closes it again (D15 to D18 and back), in a run’s place', () => {
    const view = viewOf(toolkitActivityChat.data)
    expect(openChat(view, toolkitActivityChat.ui)?.detail?.tools).toHaveLength(5)
    expect(openChat(view, { activitySource: 'chats' })).toBeNull()
    expect(openChat(view, { activitySource: 'headless', chat: toolkitActivityChat.ui.chat })).toBeNull()
    expect({ ...toolkitActivityChats.ui, ...showChat('writer-rules-skills-agents') }).toEqual(toolkitActivityChat.ui)
    expect({ ...toolkitActivityChat.ui, ...closeChat() }.chat).toBeUndefined()
    expect({ ...toolkitActivityChat.ui, ...showRun('writing-reviewer') }.chat).toBeUndefined()
    expect({ ...toolkitActivityChat.ui, ...showChat('harness-status') }.run).toBeUndefined()
  })

  it('opens every chat of every state, the ones with no detail on what their row says', () => {
    for (const state of sourceStates) {
      const view = viewOf(state.data)
      const list = view.counts.chats?.list
      if (list?.type !== 'chats') throw new Error('no chats')
      for (const c of list.rows) {
        expect(openChat(view, { activitySource: 'chats', ...showChat(c.id) })?.id).toBe(c.id)
      }
    }
  })

  it('keys D18 by its page header, its panel header and its button, and the phone’s chat has no sources', () => {
    expect(openChat(viewOf(toolkitActivityChat.data), toolkitActivityChat.ui)?.detail?.layers).toEqual({
      pageHeader: '478:192',
      header: '475:374',
      openSession: '475:386',
      items: ['478:485'],
    })
    expect(
      openChat(viewOf(toolkitActivityChatTablet.data), toolkitActivityChatTablet.ui)?.detail?.layers,
    ).toBeUndefined()
    const phone = openChat(viewOf(toolkitActivityChatPhone.data), toolkitActivityChatPhone.ui)
    expect(phone?.detail?.fields.every((f) => f.source === undefined)).toBe(true)
  })

  it('opens every run of the sources, and every item a chat or an eval names, from the list', () => {
    for (const state of sourceStates) {
      const view = viewOf(state.data)
      for (const source of ['chats', 'headless'] as const) {
        const counts = view.counts[source]
        for (const r of counts?.running.rows ?? []) {
          expect(openRun(view, { activitySource: source, ...showRun(r.id) })?.id).toBe(r.id)
        }
        const list = counts?.list
        const paths =
          list?.type === 'chats'
            ? list.rows.flatMap((c) => c.items.map((i) => i.path))
            : (list?.rows.flatMap((g) => (g.skill === undefined ? [] : [g.skill.path])) ?? [])
        for (const path of paths) {
          expect(openItem(state.data, { ...state.ui, ...openCalled(path) })?.item.path).toBe(path)
          expect(openItem(state.data, { ...state.ui, ...openEvalGroup(path) })?.item.path).toBe(path)
        }
      }
    }
  })

  it('opens an eval’s skill on its Evals tab from the list', () => {
    expect(openEvalGroup('skills/writer/')).toEqual({
      view: 'list',
      open: 'skills/writer/',
      from: null,
      itemTab: 'evals',
      run: undefined,
      chat: undefined,
    })
  })
})

describe('the labels and the Figma keys', () => {
  it('names an item with its times when more than once, and an eval’s bar is its loaded share', () => {
    expect(chatItemLabel({ name: 'writer' })).toBe('writer')
    expect(chatItemLabel({ name: 'writing-reviewer', times: 9 })).toBe('writing-reviewer ×9')
    expect(evalShare({ sessions: 945, loaded: 348 })).toBe(36.8)
    expect(evalShare({ sessions: 515, loaded: 0 })).toBe(0)
  })

  it('names the parts as the frames do', () => {
    expect(chatLayer({ title: 'Brain NC1701 project' })).toBe('chat · Brain NC1701 project')
    expect(evalLayer({ name: 'writer' })).toBe('eval · writer')
    expect(linkLayer({ name: 'project-setup' })).toBe('link · project-setup')
    expect(toolLayer({ name: 'Bash' })).toBe('tool · Bash')
  })

  it('shows the phone one run of each source, and the tablet and the desktop two', () => {
    const phone = viewOf(toolkitActivityChatsPhone.data)
    expect(phone.counts.chats?.running.rows.map((r) => r.meta)).toEqual(['omni-brain · f-005'])
    expect(phone.counts.headless?.running.rows.map((r) => r.meta)).toEqual(['step 4 of 8 · writer round 7'])
    expect(viewOf(toolkitActivityChatsTablet.data).counts.headless?.running.rows.map((r) => r.name)).toEqual([
      'skill-eval-round',
      'readme-cold-reader',
    ])
    expect(viewOf(toolkitActivityHeadless.data).counts.headless?.running.rows[1]?.chips).toEqual([
      'omni-brain',
      'readme round 3',
    ])
  })
})
