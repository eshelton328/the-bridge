import { describe, expect, it } from 'vitest'
import {
  ChatCommandRequest,
  maxAttachments,
  maxCompactChars,
  maxPromptChars,
  SendPromptRequest,
  StopChatRequest,
  SetEffortRequest,
} from './prompts.ts'

const upload = 'AAAAAAAAAAAAAAAAAAAAAA'

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

describe('prompt attachments', () => {
  it('takes up to the limit of upload IDs, and an empty text with a file', () => {
    expect(SendPromptRequest.parse({ text: '', attachments: [upload] })).toEqual({ text: '', attachments: [upload] })
    const most = Array.from({ length: maxAttachments }, () => upload)
    expect(SendPromptRequest.safeParse({ text: 'Look.', attachments: most }).success).toBe(true)
  })

  it('refuses an empty text with no file, more files than the limit, and a path in place of an ID', () => {
    for (const body of [
      { text: '', attachments: [] },
      { text: ' ', attachments: [] },
      { text: 'Look.', attachments: Array.from({ length: maxAttachments + 1 }, () => upload) },
      { text: 'Look.', attachments: ['/home/dev/a.png'] },
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

describe('command requests', () => {
  it('reads a /compact with or without one line of instructions, up to the limit, and a /clear', () => {
    expect(ChatCommandRequest.parse({ command: 'compact' })).toEqual({ command: 'compact' })
    const most = { command: 'compact', instructions: 'x'.repeat(maxCompactChars) }
    expect(ChatCommandRequest.parse(most)).toEqual(most)
    expect(ChatCommandRequest.parse({ command: 'clear' })).toEqual({ command: 'clear' })
  })

  it('refuses another command, instructions of two lines or over the limit, and other fields', () => {
    for (const body of [
      { command: 'model', model: 'opus' },
      { command: 'compact', instructions: 'one\ntwo' },
      { command: 'compact', instructions: 'one\rtwo' },
      { command: 'compact', instructions: 'x'.repeat(maxCompactChars + 1) },
      { command: 'clear', instructions: 'keep it' },
      { command: 'clear', chat: 'mac-mini/other' },
      {},
    ])
      expect(ChatCommandRequest.safeParse(body).success).toBe(false)
  })
})

describe('the send ID of a prompt', () => {
  it('takes a UUID from the page, and refuses an ID with other characters', () => {
    expect(
      SendPromptRequest.safeParse({ text: 'Reply OK.', sendId: 'b9a7c1e2-0d4f-4f5e-9a3b-5150c0ffee00' }).success,
    ).toBe(true)
    expect(SendPromptRequest.safeParse({ text: 'Reply OK.', sendId: '../etc' }).success).toBe(false)
    expect(SendPromptRequest.safeParse({ text: 'Reply OK.', sendId: 'short' }).success).toBe(false)
  })
})

describe('SetEffortRequest', () => {
  it('takes a level that the effort keys reach, and nothing else', () => {
    for (const effort of ['low', 'medium', 'high', 'xhigh'])
      expect(SetEffortRequest.safeParse({ effort }).success).toBe(true)
    for (const body of [{ effort: 'max' }, { effort: 'auto' }, {}, { effort: 'low', save: true }])
      expect(SetEffortRequest.safeParse(body).success).toBe(false)
  })
})
