import type { TranscriptEntry } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import { cutAtWord, looksSecret, plainText, previewOf } from './pushPreview.ts'

const user = (text: string): TranscriptEntry => ({ type: 'user', id: `u-${text}`, text, cut: false })
const reply = (text: string, id = 'a1'): TranscriptEntry => ({ type: 'assistant', id, text, cut: false })
const tool = (over: Partial<Extract<TranscriptEntry, { type: 'tool' }>> = {}): TranscriptEntry => ({
  type: 'tool',
  id: 't1',
  name: 'Bash',
  target: 'pnpm',
  running: false,
  kind: 'shell',
  label: 'Run the full verify',
  ...over,
})

describe('the push preview line', () => {
  it('says the first sentence of the last reply when a chat is done', () => {
    expect(previewOf('done', [user('go'), reply('Merged #457 as 6ff335c0. Next is the reseal.')])).toBe(
      'Merged #457 as 6ff335c0.',
    )
  })

  it('takes plain text from Markdown and drops code blocks', () => {
    const text =
      '## Done\n\n**All nine** frames [sealed](https://x.test/a) with `check:reviews`.\n\n```sh\npnpm verify\n```'
    expect(previewOf('done', [reply(text)])).toBe('Done All nine frames sealed with check:reviews.')
    expect(plainText('```\nconst a = 1\n```')).toBe('')
    expect(plainText('- one\n- two\n> quoted')).toBe('one two quoted')
  })

  it('says the tool a chat waits on, and never its result', () => {
    expect(previewOf('needsYou', [reply('I run the checks.'), tool()])).toBe('Wants to run: pnpm')
    expect(previewOf('needsYou', [tool({ target: '' })])).toBe('Wants to run: Run the full verify')
    expect(previewOf('needsYou', [tool({ name: 'Edit', kind: 'edit', target: 'web/src/a.ts' })])).toBe(
      'Wants to use Edit: web/src/a.ts',
    )
  })

  it('says the last question of the reply when a chat waits with no tool', () => {
    expect(previewOf('needsYou', [reply('Two options. Should I merge #460 now? Or wait?')])).toBe('Or wait?')
    expect(previewOf('needsYou', [reply('Should I merge #460 now?')])).toBe('Should I merge #460 now?')
    expect(previewOf('needsYou', [reply('I stopped here.')])).toBeNull()
  })

  it('gives no line for a turn with no reply after the last prompt, or an empty one', () => {
    expect(previewOf('done', [reply('Old reply.'), user('next')])).toBeNull()
    expect(previewOf('done', [])).toBeNull()
    expect(previewOf('done', [reply('```\nonly code\n```')])).toBeNull()
  })

  it('gives no line when the text looks like a secret', () => {
    // Built at run time, so this file holds no token shape for the secret scan.
    for (const secret of [
      `The key is ${'gh' + 'p_' + 'a'.repeat(20)}.`,
      `Set it to ${'s' + 'k-' + 'a'.repeat(21)}.`,
      `Use ${'AK' + 'IA' + 'A'.repeat(16)} for it.`,
      'password: hunter2 works.',
      `The value is ${'Q'.repeat(40)}.`,
    ]) {
      expect(looksSecret(secret), secret).toBe(true)
      expect(previewOf('done', [reply(secret)]), secret).toBeNull()
    }
    expect(looksSecret('Merged #457 as 6ff335c0.')).toBe(false)
  })

  it('cuts a long line at a word to at most 140 code points, never inside an emoji', () => {
    const long = `${'word '.repeat(40)}end.`
    const cut = previewOf('done', [reply(long)]) ?? ''
    expect(Array.from(cut).length).toBeLessThanOrEqual(140)
    expect(cut.endsWith('word…')).toBe(true)
    const emoji = cutAtWord('😀'.repeat(200))
    expect(Array.from(emoji)).toHaveLength(140)
    expect(emoji.endsWith('😀…')).toBe(true)
  })
})
