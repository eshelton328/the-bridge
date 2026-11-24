import { describe, expect, it } from 'vitest'
import { maxEntryText } from './transcripts.ts'
import { maxSideQuestion, SideAnswer, SideChangedEvent, SideId, SideQuestionRequest } from './sideAnswers.ts'

const answer = { side: 'a1b2c3d4e5f60718', chat: 'test-mac/c1', state: 'answering', text: '', cut: false }

describe('side answers', () => {
  it('takes a trimmed question of 1 to maxSideQuestion characters, and no other field', () => {
    expect(SideQuestionRequest.parse({ question: '  Why did the build fail?  ' })).toEqual({
      question: 'Why did the build fail?',
    })
    expect(SideQuestionRequest.safeParse({ question: '   ' }).success).toBe(false)
    expect(SideQuestionRequest.safeParse({ question: 'x'.repeat(maxSideQuestion + 1) }).success).toBe(false)
    expect(SideQuestionRequest.safeParse({ question: 'Why?', model: 'opus' }).success).toBe(false)
  })

  it('takes a side ID of 16 hex characters only', () => {
    expect(SideId.safeParse('a1b2c3d4e5f60718').success).toBe(true)
    expect(SideId.safeParse('A1B2C3D4E5F60718').success).toBe(false)
    expect(SideId.safeParse('a1b2').success).toBe(false)
  })

  it('takes an answer of a known state with text up to maxEntryText, in the event envelope', () => {
    expect(SideAnswer.parse(answer)).toEqual(answer)
    expect(SideAnswer.safeParse({ ...answer, state: 'stopped' }).success).toBe(true)
    expect(SideAnswer.safeParse({ ...answer, state: 'paused' }).success).toBe(false)
    expect(SideAnswer.safeParse({ ...answer, text: 'x'.repeat(maxEntryText + 1) }).success).toBe(false)
    const event = { source: 'test-mac/side', seq: 0, type: 'side.changed', data: { ...answer, state: 'done' } }
    expect(SideChangedEvent.parse(event)).toEqual(event)
  })
})
