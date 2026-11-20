import { describe, expect, it } from 'vitest'
import { maxPromptChars, SendPromptRequest, StopChatRequest } from './prompts.ts'

describe('prompt requests', () => {
  it('reads a prompt with text, up to the limit', () => {
    expect(SendPromptRequest.parse({ text: 'Run the tests.' })).toEqual({ text: 'Run the tests.' })
    expect(SendPromptRequest.safeParse({ text: 'x'.repeat(maxPromptChars) }).success).toBe(true)
  })

  it('refuses an empty prompt, one of only spaces, one over the limit and other fields', () => {
    for (const body of [
      { text: '' },
      { text: ' \n\t' },
      { text: 'x'.repeat(maxPromptChars + 1) },
      { text: 'Go.', chat: 'mac-mini/other' },
      {},
    ])
      expect(SendPromptRequest.safeParse(body).success).toBe(false)
  })
})

describe('StopChatRequest', () => {
  it('takes only an empty object', () => {
    expect(StopChatRequest.safeParse({}).success).toBe(true)
    expect(StopChatRequest.safeParse({ text: 'Stop.' }).success).toBe(false)
  })
})
