import { describe, expect, it, vi } from 'vitest'
import { chatToOpen, listenForOpenChat, openChatType } from './openChatMessages.ts'

// A tap on a push with the app open (d-118): the worker posts the chat, and the page opens only a chat ID of the
// contract's shape.

const chat = 'mac-mini/5af4ed88-2e47-4bbb-aafa-f5206af29daf'

describe('the open-chat message', () => {
  it('opens a chat ID of the contract shape', () => {
    expect(chatToOpen({ type: openChatType, chat })).toBe(chat)
  })

  it.each([
    ['another type', { type: 'other', chat }],
    ['a URL as the chat', { type: openChatType, chat: 'https://evil.example/' }],
    ['a path as the chat', { type: openChatType, chat: 'mac/../x' }],
    ['no chat', { type: openChatType }],
    ['a string', chat],
    ['null', null],
  ])('ignores %s', (_, data) => {
    expect(chatToOpen(data)).toBeUndefined()
  })

  it('listens on the container until removed', () => {
    const container = new EventTarget()
    const open = vi.fn()
    const remove = listenForOpenChat(container, open)
    container.dispatchEvent(new MessageEvent('message', { data: { type: openChatType, chat } }))
    container.dispatchEvent(new MessageEvent('message', { data: { type: openChatType, chat: 'x' } }))
    remove()
    container.dispatchEvent(new MessageEvent('message', { data: { type: openChatType, chat } }))
    expect(open.mock.calls).toEqual([[chat]])
  })
})
