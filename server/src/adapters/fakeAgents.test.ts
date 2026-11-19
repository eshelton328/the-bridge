import { MachineId } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import { describeAgentPort } from './agentPortContract.ts'
import { createFakeAgents } from './fakeAgents.ts'

const machine = MachineId.parse('test-mac')

describeAgentPort('fake', () =>
  Promise.resolve({ port: createFakeAgents(machine), expected: { workspace: 'omni-brain', chat: 'drift check' } }),
)

describe('fake agents', () => {
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
})
