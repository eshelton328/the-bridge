import { ChatId, MachineId, WorkspaceId } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import { describeAgentPort } from './agentPortContract.ts'
import { createFakeAgents } from './fakeAgents.ts'

const machine = MachineId.parse('test-mac')
let appended = 0

describeAgentPort('fake', () => {
  const port = createFakeAgents(machine)
  return Promise.resolve({
    port,
    expected: { workspace: 'omni-brain', chat: 'drift check', shell: { workspace: 'omni', program: 'zsh' } },
    setStatus: (status) => {
      port.setStatus(ChatId.parse('test-mac/drift-check'), status)
      return Promise.resolve()
    },
    transcript: {
      chat: 'bridge themes',
      append: () => {
        appended += 1
        port.changeTranscript(ChatId.parse('test-mac/bridge-themes'), {
          type: 'user',
          id: `appended-${String(appended)}`,
          text: 'Go on.',
          cut: false,
        })
        return Promise.resolve()
      },
    },
    changeLayout: () => {
      port.changeLayout(WorkspaceId.parse('test-mac/omni-brain'))
      return Promise.resolve()
    },
    typeInput: (text) => {
      port.typeInput(ChatId.parse('test-mac/drift-check'), text)
      return Promise.resolve()
    },
    clearInput: () => {
      port.typeInput(ChatId.parse('test-mac/drift-check'), '')
      return Promise.resolve()
    },
    dropNextEnter: () => {
      port.dropNextEnter(ChatId.parse('test-mac/drift-check'))
      return Promise.resolve()
    },
    received: () =>
      Promise.resolve(
        port
          .inputs()
          .filter((i) => i.chat === ChatId.parse('test-mac/drift-check'))
          .map((i) => ('text' in i ? `text:${i.text}` : 'stop')),
      ),
    unreachable: createFakeAgents(machine, { error: { reason: 'unreachable', message: 'herdr socket: ENOENT' } }),
  })
})

describe('fake agents', () => {
  it('sends no prompt to a chat that waits for the owner', async () => {
    const port = createFakeAgents(machine)
    const chat = ChatId.parse('test-mac/drift-check')
    expect(await port.sendPrompt(chat, 'Go on.')).toEqual({ ok: true, value: 'needsYou' })
    expect(port.inputs()).toEqual([])
  })

  it('fails with the error it was given', async () => {
    const port = createFakeAgents(machine, { error: { reason: 'unreachable', message: 'no socket' } })
    expect(await port.listWorkspaces()).toEqual({ ok: false, error: { reason: 'unreachable', message: 'no socket' } })
  })

  it('gives a copy each time, so a caller cannot change its data', async () => {
    const port = createFakeAgents(machine)
    const first = await port.listWorkspaces()
    if (first.ok) first.value.pop()
    const second = await port.listWorkspaces()
    expect(second.ok && second.value).toHaveLength(2)
    expect(port.reads()).toBe(2)
  })

  it('lists the status setStatus gave, and ends each subscription with endAll', async () => {
    const port = createFakeAgents(machine)
    const ends: string[] = []
    port.subscribe(
      () => undefined,
      (e) => ends.push(e.message),
    )
    port.setStatus(ChatId.parse('test-mac/drift-check'), 'done')
    const read = await port.listWorkspaces()
    expect(read.ok && read.value[0]?.chats[1]?.status).toBe('done')
    port.endAll({ reason: 'unreachable', message: 'gone' })
    expect(ends).toEqual(['gone'])
    expect(port.subscriptions()).toBe(0)
  })

  it('ends a subscription at once when it has an error to give', async () => {
    const port = createFakeAgents(machine, { error: { reason: 'unreachable', message: 'no socket' } })
    const ends: string[] = []
    await port.subscribe(
      () => undefined,
      (e) => ends.push(e.message),
    ).ready
    await Promise.resolve()
    expect(ends).toEqual(['no socket'])
  })
})
