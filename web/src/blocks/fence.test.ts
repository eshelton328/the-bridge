import type { ExtraProps } from 'react-markdown'
import { describe, expect, it } from 'vitest'
import { fenceOf } from './fence.ts'

// The hast node react-markdown gives a `pre`, as remark writes a fence. The code is made up.
type Pre = NonNullable<ExtraProps['node']>
const pre = (children: Pre['children']): Pre => ({ type: 'element', tagName: 'pre', properties: {}, children })
const code = (className: string[] | undefined, ...texts: string[]): Pre['children'][number] => ({
  type: 'element',
  tagName: 'code',
  properties: className === undefined ? {} : { className },
  children: texts.map((value) => ({ type: 'text', value })),
})

describe('fenceOf', () => {
  it('reads the code without its final line break and the label of its language class', () => {
    expect(fenceOf(pre([code(['language-ts'], 'const a = 1\n', 'const b = 2\n')]))).toEqual({
      code: 'const a = 1\nconst b = 2',
      language: 'ts',
    })
  })

  it('reads a fence with no label', () => {
    expect(fenceOf(pre([code(undefined, 'plain\n')]))).toEqual({ code: 'plain', language: undefined })
  })

  it('is undefined for a pre that is not one code element of text alone', () => {
    expect(fenceOf(undefined)).toBeUndefined()
    expect(fenceOf(pre([]))).toBeUndefined()
    expect(fenceOf(pre([code(['language-ts'], 'a'), code(undefined, 'b')]))).toBeUndefined()
    expect(fenceOf(pre([{ type: 'text', value: 'loose text' }]))).toBeUndefined()
    const nested = code(['language-ts'])
    if (nested.type !== 'element') throw new Error('not an element')
    nested.children.push({ type: 'element', tagName: 'span', properties: {}, children: [] })
    expect(fenceOf(pre([nested]))).toBeUndefined()
  })
})
