import { describe, expect, it } from 'vitest'
import { maxAttachments, maxPromptChars, SendPromptRequest, StopChatRequest } from './prompts.ts'

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
