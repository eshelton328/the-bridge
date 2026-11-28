import { describe, expect, it } from 'vitest'
import { ideaPrompt } from './ideaChat.ts'
import type { IdeaPage } from './types.ts'

const idea: IdeaPage = {
  row: {
    id: '3f0c6a52-6a1e-4d55-9a4e-2f1b8f1d0a01',
    title: 'Sample idea',
    tags: [],
    kind: 'idea',
    state: 'open',
    age: '2d',
  },
  body: '',
  file: 'ideas/sample-idea.md',
}

describe('ideaPrompt', () => {
  it("names the record from the chat's start folder, <chat root>/projects/<slug>", () => {
    expect(ideaPrompt('alpha', idea)).toBe(
      `Let's talk about the idea "Sample idea". Its record is ../../engine/projects/alpha/ideas/sample-idea.md. ` +
        'Read it first, then ask me what I want to do with it.',
    )
  })

  it('names the ideas folder and the ID when the server gives no file', () => {
    expect(ideaPrompt('alpha', { ...idea, file: null })).toContain(
      'Its record is in ../../engine/projects/alpha/ideas/, with `id: 3f0c6a52-6a1e-4d55-9a4e-2f1b8f1d0a01` in its front matter.',
    )
  })
})
