import { ChatId, MachineId, maxEntryText, type SideAnswer } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import { createFakeAgents } from '../adapters/fakeAgents.ts'
import type { Result } from '@bridge/shared'
import type { AgentPortError } from './agentPort.ts'
import { createSideAnswers, type SideAsk } from './sideAnswers.ts'

const machine = MachineId.parse('test-mac')
const themes = ChatId.parse('test-mac/bridge-themes')
const until = async (check: () => boolean) => {
  for (let i = 0; i < 100 && !check(); i++) await new Promise((r) => setTimeout(r, 5))
}
/** The side ID of a started answer; a test fails on a refusal. */
const sideOf = (asked: Result<SideAsk, AgentPortError>) => {
  if (!asked.ok || typeof asked.value === 'string') throw new Error('no answer')
  return asked.value.side
}
const valueOf = (asked: Result<SideAsk, AgentPortError>) => (asked.ok ? asked.value : asked.error)
let ids = 0
const newId = () => {
  ids += 1
  return ids.toString(16).padStart(16, '0')
}

describe('side answers', () => {
  it('keeps the text as it comes, cut at maxEntryText, and tells each watch', async () => {
    const agents = createFakeAgents(machine)
    agents.setSideAnswer(themes, [
      { text: 'x'.repeat(maxEntryText - 2) },
      { text: 'abcd' },
      { text: 'more' },
      { end: 'done' },
    ])
    const sides = createSideAnswers(agents, { newId })
    const side = sideOf(await sides.ask(themes, 'Why?'))
    const seen: SideAnswer[] = []
    sides.watch(themes, side, (a) => seen.push(a))
    await until(() => sides.get(themes, side)?.state === 'done')
    const answer = sides.get(themes, side)
    expect(answer?.text.length).toBe(maxEntryText)
    expect(answer?.cut).toBe(true)
    expect(seen.at(-1)?.state).toBe('done')
    expect(sides.get(ChatId.parse('test-mac/other'), side)).toBeUndefined()
  })

  it('stops an answer at the time limit as timedOut, and frees the chat for its next question', async () => {
    const agents = createFakeAgents(machine)
    agents.setSideAnswer(themes, [{ text: 'Part' }, 'hang'])
    const sides = createSideAnswers(agents, { timeoutMs: 30, newId })
    const side = sideOf(await sides.ask(themes, 'Why?'))
    expect(valueOf(await sides.ask(themes, 'Again?'))).toBe('busy')
    await until(() => sides.get(themes, side)?.state !== 'answering')
    expect(sides.get(themes, side)).toMatchObject({ state: 'timedOut', text: 'Part' })
    agents.setSideAnswer(themes, [{ end: 'failed' }])
    const next = sideOf(await sides.ask(themes, 'Again?'))
    await until(() => sides.get(themes, next)?.state !== 'answering')
    expect(sides.get(themes, next)?.state).toBe('failed')
  })

  it('runs at most maxRunning questions in all, keeps the last answers only, and passes refusals on', async () => {
    const agents = createFakeAgents(machine)
    // A second Claude chat: a fork of the fake's one.
    const forked = await agents.forkChat(themes, { direction: 'row' })
    const b = forked.ok && typeof forked.value !== 'string' ? forked.value.chat : undefined
    if (b === undefined) throw new Error('the fake made no second Claude chat')
    const a = themes
    agents.setSideAnswer(a, ['hang'])
    const sides = createSideAnswers(agents, { maxRunning: 1, keep: 0, newId })
    expect(valueOf(await sides.ask(ChatId.parse('test-mac/no-such-chat'), 'Why?'))).toBe('notFound')
    expect(valueOf(await sides.ask(ChatId.parse('test-mac/brain-git'), 'Why?'))).toBe('noSession')
    const done = sideOf(await sides.ask(b, 'Done?'))
    await until(() => sides.get(b, done)?.state === 'done')
    const first = sideOf(await sides.ask(a, 'One?'))
    expect(valueOf(await sides.ask(b, 'Two?'))).toBe('busy')
    // A running answer stays past `keep`; a finished one goes.
    expect(sides.get(a, first)?.state).toBe('answering')
    expect(sides.get(b, done)).toBeUndefined()
  })
})
