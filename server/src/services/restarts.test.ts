import { ChatId, MachineId } from '@bridge/contract'
import { ok } from '@bridge/shared'
import { describe, expect, it } from 'vitest'
import { createFakeAgents } from '../adapters/fakeAgents.ts'
import { createRestarts } from './restarts.ts'

describe('restarts', () => {
  it('sends nothing when the confirm names another chat', async () => {
    const agents = createFakeAgents(MachineId.parse('test-mac'))
    let calls = 0
    const restarts = createRestarts({
      ...agents,
      restartModel: () => {
        calls += 1
        return Promise.resolve(ok('notFound' as const))
      },
    })
    const chat = ChatId.parse('test-mac/session-a')
    expect(await restarts.restart(chat, 'opus', ChatId.parse('test-mac/session-b'))).toEqual(ok('notConfirmed'))
    expect(calls).toBe(0)
  })

  it('holds the chat while its restart runs, and lets it go after', async () => {
    const agents = createFakeAgents(MachineId.parse('test-mac'))
    const chat = ChatId.parse('test-mac/session-a')
    let finish: () => void = () => undefined
    const restarts = createRestarts({
      ...agents,
      restartModel: () =>
        new Promise((resolve) => {
          finish = () => {
            resolve(ok({ state: 'ready' as const, chat }))
          }
        }),
    })
    const first = restarts.restart(chat, 'opus', chat)
    expect(restarts.enter(chat)).toBeUndefined()
    expect(await restarts.restart(chat, 'sonnet', chat)).toEqual(ok('restarting'))
    finish()
    expect(await first).toEqual(ok({ state: 'ready', chat }))
    const end = restarts.enter(chat)
    expect(end).toBeTypeOf('function')
    end?.()
  })
})
