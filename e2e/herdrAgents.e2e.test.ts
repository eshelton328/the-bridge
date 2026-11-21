// The AgentPort contract suite on the herdr adapter and a real herdr
// session (d-113), as it runs on the fake adapter in server/.
import { ChatId, MachineId } from '@bridge/contract'
import { describe, expect, inject, it } from 'vitest'
import { describeAgentPort } from '../server/src/adapters/agentPortContract.ts'
import { createHerdrAgents } from '../server/src/adapters/herdrAgents.ts'
import { memoryLogger } from '../server/src/logger.ts'
import { appendTranscript } from './appendTranscript.ts'
import { dropNextEnter } from './dropEnter.ts'
import { clearInput, typeInput } from './paneInput.ts'
import { receivedBy } from './receivedBy.ts'
import { renameTab } from './renameTab.ts'
import { reportAgent } from './reportAgent.ts'

const machine = MachineId.parse('e2e-mac')
const { log } = memoryLogger()
const port = () =>
  createHerdrAgents({
    socket: inject('herdrSocket'),
    machine,
    log,
    claudeProjects: inject('claudeProjects'),
    home: '/home/dev',
  })

describeAgentPort('herdr (real session)', () =>
  Promise.resolve({
    port: port(),
    expected: {
      workspace: inject('fakeChat').workspace,
      chat: inject('statusChat').title,
      shell: inject('shellChat'),
    },
    setStatus: reportAgent,
    changeLayout: renameTab,
    transcript: { chat: inject('fakeChat').title, append: appendTranscript },
    received: () => receivedBy(inject('statusChat').title),
    typeInput,
    clearInput,
    dropNextEnter,
    unreachable: createHerdrAgents({
      socket: `${inject('herdrSocket')}.none`,
      machine,
      log,
      claudeProjects: inject('claudeProjects'),
      home: '/home/dev',
    }),
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
      modelId: 'opus',
      status: 'idle',
    })
  })

  it("reads the fake chat's transcript from its session file", async () => {
    const read = await port().readTranscript(ChatId.parse('e2e-mac/fake-e2e-session'))
    if (!read.ok || read.value === null) throw new Error('no transcript')
    // The contract suite's watch case can add prompts to this file first (appendTranscript.ts).
    expect(read.value.earlier).toBe(false)
    expect(read.value.entries.slice(0, 3)).toEqual([
      { type: 'user', id: 'e2e-u1', text: 'Say hello.', cut: false },
      { type: 'tool', id: 'e2e-t1', name: 'Bash', target: 'git', running: false },
      { type: 'assistant', id: 'e2e-a2:0', text: 'Hello.', cut: false },
    ])
  })
})
