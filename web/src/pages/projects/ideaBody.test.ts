import { describe, expect, it } from 'vitest'
import { splitIdeaBody } from './ideaBody.ts'

describe('splitIdeaBody', () => {
  it('takes the Open questions list out of the text and keeps the sections round it', () => {
    const text =
      'Intro.\n\n## Open questions\n\n- Which engine?\n- Where the list\n  lives.\n\n## Test plan\n\nA lab.\n'
    expect(splitIdeaBody(text)).toEqual({
      text: 'Intro.\n\n## Test plan\n\nA lab.\n',
      questions: ['Which engine?', 'Where the list lives.'],
    })
  })

  it('takes a last section to the end of the text', () => {
    expect(splitIdeaBody('Intro.\n\n## Open Questions\n\n* One\n+ Two\n')).toEqual({
      text: 'Intro.\n',
      questions: ['One', 'Two'],
    })
  })

  it('keeps all the text when the section holds more than a list, or no list, or there is no section', () => {
    const prose = 'Intro.\n\n## Open questions\n\nNone yet, but:\n\n- One\n'
    expect(splitIdeaBody(prose)).toEqual({ text: prose, questions: [] })
    const empty = 'Intro.\n\n## Open questions\n\n## Next\n'
    expect(splitIdeaBody(empty)).toEqual({ text: empty, questions: [] })
    expect(splitIdeaBody('Intro.\n')).toEqual({ text: 'Intro.\n', questions: [] })
  })

  it('reads only a level-two heading, and a level-three heading stays inside the section', () => {
    const deeper = '### Open questions\n\n- One\n'
    expect(splitIdeaBody(deeper)).toEqual({ text: deeper, questions: [] })
    expect(splitIdeaBody('## Open questions\n- One\n### Sub\n').questions).toEqual([])
  })
})
