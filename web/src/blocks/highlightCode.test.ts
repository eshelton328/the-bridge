import { describe, expect, it } from 'vitest'
import { grammarOf } from './codeLanguages.ts'
import { highlightCode } from './highlightCode.ts'

// The syntax colours of a fenced block (chat rich text): each line's pieces join to exactly that line, so the block
// copies the original code, and highlight.js classes map to the library's five code colours. The code is made up.
const joined = (lines: ReturnType<typeof highlightCode>) => lines.map((line) => line.map((p) => p.text).join(''))

describe('highlightCode', () => {
  it('keeps every line whole, a comment that spans lines too', () => {
    const code = ['/* a sample', '   note */', 'const total = sum(2, "x")', '', 'return total'].join('\n')
    const lines = highlightCode(code, 'typescript')
    expect(joined(lines)).toEqual(code.split('\n'))
    expect(lines[0]?.every((p) => p.kind === 'comment')).toBe(true)
    expect(lines[1]?.every((p) => p.kind === 'comment')).toBe(true)
  })

  it('maps keywords, strings, numbers and names to their code colours', () => {
    const [line] = highlightCode('const total = sum(2, "x")', 'typescript')
    const kindOf = (text: string) => line?.find((p) => p.text === text)?.kind
    expect(kindOf('const')).toBe('keyword')
    expect(kindOf('"x"')).toBe('string')
    expect(kindOf('2')).toBe('number')
    const python = highlightCode('def sample():\n    return None', 'python')
    expect(python[0]?.find((p) => p.text === 'sample')?.kind).toBe('function')
  })

  it('leaves a piece with no mapped class plain, as a diff line that MarkdownCodeBlock tints', () => {
    const lines = highlightCode('+added line\n-removed line', 'diff')
    expect(joined(lines)).toEqual(['+added line', '-removed line'])
    expect(lines.flat().every((p) => p.kind === undefined)).toBe(true)
  })
})

describe('grammarOf', () => {
  it('knows the ten languages by their usual labels, in any case, and nothing else', () => {
    expect(['ts', 'TSX', 'js', 'json', 'sh', 'py', 'css', 'html', 'yml', 'md', 'patch'].map(grammarOf)).toEqual([
      'typescript',
      'typescript',
      'javascript',
      'json',
      'bash',
      'python',
      'css',
      'xml',
      'yaml',
      'markdown',
      'diff',
    ])
    expect(grammarOf('rust')).toBeUndefined()
    expect(grammarOf(undefined)).toBeUndefined()
  })
})
