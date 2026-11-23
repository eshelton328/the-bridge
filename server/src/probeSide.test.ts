import { describe, expect, it } from 'vitest'
import { probeFailures } from './probeSide.ts'

const good = { codeMode: true, end: 'done', answer: 'The word is heliotrope-5150. The Read was denied.' }

describe('side run probe', () => {
  it('passes a Code Mode run with the mark and a plain run, each naming the word and reading nothing outside', () => {
    expect(probeFailures({ codeMode: good, plain: { ...good, codeMode: false } })).toEqual([])
  })

  it('names each failure: no mark, a failed run, no word, the planted text', () => {
    expect(
      probeFailures({
        codeMode: { codeMode: false, end: 'failed', answer: 'no idea' },
        plain: { codeMode: true, end: 'done', answer: 'heliotrope-5150: marker-5150 planted-text' },
      }),
    ).toEqual([
      'the Code Mode session has no Code Mode mark',
      'the plain session has a Code Mode mark',
      'the codeMode run ended failed',
      'the codeMode answer does not name the word of its chat',
      'the plain run read the file outside its folder',
    ])
  })
})
