import { ChatId, MachineId, PaneId, SendId, sendResultMs, type StartChatResponse } from '@bridge/contract'
import { err, ok } from '@bridge/shared'
import { describe, expect, it } from 'vitest'
import { createFakeAgents } from '../adapters/fakeAgents.ts'
import type { AgentPort } from './agentPort.ts'
import { createNewChats } from './newChats.ts'

const machine = MachineId.parse('test-mac')
const answer: StartChatResponse = {
  pane: PaneId.parse('test-mac/pane-new'),
  chat: ChatId.parse('test-mac/new'),
  state: 'ready',
}
const request = {
  kind: 'claude',
  place: { in: 'split', beside: ChatId.parse('test-mac/bridge-themes'), direction: 'row' },
  createId: SendId.parse('create-0001'),
} as const

/** A port whose starts wait until the test answers them, and that counts them. */
function heldPort() {
  const answers: ((value: Awaited<ReturnType<AgentPort['startChat']>>) => void)[] = []
  const port: AgentPort = {
    ...createFakeAgents(machine),
    startChat: () => new Promise((resolve) => answers.push(resolve)),
  }
  return { port, answers }
}

describe('new chats', () => {
  it('answers duplicateCreate while a start with the create ID runs, and its first answer after it', async () => {
    const { port, answers } = heldPort()
    const chats = createNewChats(port)
    const first = chats.start(request)
    expect(await chats.start(request)).toEqual(ok('duplicateCreate'))
    answers[0]?.(ok(answer))
    expect(await first).toEqual(ok({ started: answer, again: false }))
    expect(await chats.start(request)).toEqual(ok({ started: answer, again: true }))
    expect(answers).toHaveLength(1)
  })

  it('frees the create ID after a refusal, keeps it after a herdr failure, and forgets it after the kept time', async () => {
    const { port, answers } = heldPort()
    let now = 0
    const chats = createNewChats(port, () => now)
    const refused = chats.start(request)
    answers[0]?.(ok('nameTaken'))
    expect(await refused).toEqual(ok('nameTaken'))
    const failed = chats.start(request)
    expect(answers).toHaveLength(2)
    answers[1]?.(err({ reason: 'unreachable', message: 'socket closed' }))
    expect((await failed).ok).toBe(false)
    expect(await chats.start(request)).toEqual(ok('duplicateCreate'))
    now = sendResultMs
    const later = chats.start(request)
    answers[2]?.(ok(answer))
    expect(await later).toEqual(ok({ started: answer, again: false }))
  })
})
