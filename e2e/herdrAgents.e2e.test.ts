// The AgentPort contract suite on the herdr adapter and a real herdr
// session (d-113), as it runs on the fake adapter in server/.
import { MachineId } from '@bridge/contract'
import { describe, expect, inject, it } from 'vitest'
import { describeAgentPort } from '../server/src/adapters/agentPortContract.ts'
import { createHerdrAgents } from '../server/src/adapters/herdrAgents.ts'
import { reportAgent } from './reportAgent.ts'

const machine = MachineId.parse('e2e-mac')
const port = () =>
  createHerdrAgents({ socket: inject('herdrSocket'), machine, claudeProjects: inject('claudeProjects') })

describeAgentPort('herdr (real session)', () =>
  Promise.resolve({
    port: port(),
    expected: { workspace: inject('fakeChat').workspace, chat: inject('statusChat').title },
    setStatus: reportAgent,
  }),
)

describe('herdr adapter on a real session', () => {
  it("reads the fake chat's model from its session file and its status from herdr", async () => {
    const read = await port().listWorkspaces()
    if (!read.ok) throw new Error(read.error.message)
    const chat = read.value.flatMap((w) => w.chats).find((c) => c.title === inject('fakeChat').title)
    expect(chat).toMatchObject({
      id: 'e2e-mac/fake-e2e-session',
      kind: 'claude',
      model: 'claude-opus-5-5',
      status: 'idle',
    })
  })
})
