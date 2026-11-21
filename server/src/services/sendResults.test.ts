import { ChatId, SendId, sendResultMs } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import { createSendResults, resultOf } from './sendResults.ts'

const chat = ChatId.parse('test-mac/c1')
const other = ChatId.parse('test-mac/c2')
const send = (n: number) => SendId.parse(`send-0000-${String(n)}`)

describe('the send results', () => {
  it('keeps pending, then the result, for its chat only, and refuses the same ID again', () => {
    const results = createSendResults(() => 0)
    expect(results.begin(chat, send(1))).toBe('new')
    expect(results.get(chat, send(1))).toBe('pending')
    expect(results.get(other, send(1))).toBeUndefined()
    results.finish(chat, send(1), 'sent')
    expect(results.get(chat, send(1))).toBe('sent')
    expect(results.begin(chat, send(1))).toBe('duplicate')
    expect(results.begin(other, send(1))).toBe('new')
  })

  it('forgets a result after the kept time, and the oldest past 500', () => {
    let time = 0
    const results = createSendResults(() => time)
    results.begin(chat, send(1))
    time = sendResultMs
    expect(results.get(chat, send(1))).toBeUndefined()
    for (let n = 2; n <= 502; n += 1) results.begin(chat, send(n))
    expect(results.get(chat, send(2))).toBeUndefined()
    expect(results.get(chat, send(502))).toBe('pending')
  })

  it('counts only a send refused before any text was typed as notSent', () => {
    expect(resultOf('sent')).toBe('sent')
    expect(resultOf('notSubmitted')).toBe('notSubmitted')
    expect(resultOf('needsYou')).toBe('notSent')
    expect(resultOf('shell')).toBe('notSent')
    // Both can come after the text was typed: text that stayed, or a dialog that stayed open.
    expect(resultOf('inputNotEmpty')).toBe('unknown')
    expect(resultOf('inputUnreadable')).toBe('unknown')
  })
})
