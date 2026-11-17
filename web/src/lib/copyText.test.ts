import { describe, expect, it } from 'vitest'
import { copyText } from './copyText.ts'

describe('copyText', () => {
  it('writes the text when the page has a clipboard', () => {
    const written: string[] = []
    copyText('toolkit/skills/writer/', {
      writeText: (text) => {
        written.push(text)
        return Promise.resolve()
      },
    })
    expect(written).toEqual(['toolkit/skills/writer/'])
  })

  it('copies nothing and throws nothing without a clipboard', () => {
    expect(() => {
      copyText('toolkit/rules/skills.md', undefined)
    }).not.toThrow()
  })

  it('throws nothing when the write throws or rejects', () => {
    expect(() => {
      copyText('a', {
        writeText: () => {
          throw new Error('denied')
        },
      })
      copyText('b', { writeText: () => Promise.reject(new Error('denied')) })
    }).not.toThrow()
  })
})
