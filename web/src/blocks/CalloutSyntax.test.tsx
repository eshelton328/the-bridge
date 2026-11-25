import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { afterEach, describe, expect, it } from 'vitest'
import { testRender } from '../lib/testRender.ts'
import { remarkCallout } from './remarkCallout.ts'

// The plugin alone, through react-markdown: a tagged quote has data-callout. The texts are made up.
let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
})

async function quotes(text: string): Promise<{ tone: string | null; html: string }[]> {
  view = await testRender(<Markdown remarkPlugins={[remarkGfm, remarkCallout]}>{text}</Markdown>)
  return [...document.querySelectorAll('blockquote')].map((q) => ({
    tone: q.getAttribute('data-callout'),
    html: q.innerHTML.trim(),
  }))
}

describe('remarkCallout', () => {
  it('tags each of the five GitHub alerts and takes the marker out', async () => {
    const tones = ['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION']
    const found = await quotes(tones.map((t) => `> [!${t}]\n> Text of the ${t.toLowerCase()}.`).join('\n\n'))
    expect(found.map((q) => q.tone)).toEqual(['note', 'tip', 'important', 'warning', 'caution'])
    for (const q of found) expect(q.html).not.toContain('[!')
    expect(found[0]?.html).toContain('Text of the note.')
  })
  it('takes any case, and a marker alone in the quote', async () => {
    const found = await quotes('> [!note]\n> Lower case.\n\n> [!Tip]')
    expect(found.map((q) => q.tone)).toEqual(['note', 'tip'])
    expect(found[1]?.html).toBe('')
  })
  it('reads a marker line that ends in CRLF or a lone CR, as CommonMark does', async () => {
    const found = await quotes('> [!NOTE]\r\n> Windows line.\r\n\r\n> [!TIP]\r> Old Mac line.')
    expect(found.map((q) => q.tone)).toEqual(['note', 'tip'])
    expect(found.map((q) => q.html.includes('[!'))).toEqual([false, false])
  })

  it('keeps formatting on the line after the marker, and a hard break after it', async () => {
    const found = await quotes('> [!WARNING]\n> **Bold** start.\n\n> [!CAUTION]  \n> After a hard break.')
    expect(found[0]?.html).toContain('<strong>Bold</strong> start.')
    expect(found[1]?.tone).toBe('caution')
    expect(found[1]?.html).not.toContain('<br>')
    expect(found[1]?.html).toContain('After a hard break.')
  })
  it('leaves a plain quote, an unknown tag and a marker with text on its line as quotes', async () => {
    const found = await quotes(
      '> A plain quote.\n\n> [!DANGER]\n> Unknown.\n\n> [!NOTE] same line\n\n> Text\n> [!NOTE]',
    )
    expect(found.map((q) => q.tone)).toEqual([null, null, null, null])
    expect(found[2]?.html).toContain('[!NOTE] same line')
  })
  it('tags a callout inside a list item, and keeps HTML as text', async () => {
    const found = await quotes('- item\n\n  > [!TIP]\n  > <img src=x onerror=alert(1)>')
    expect(found[0]?.tone).toBe('tip')
    expect(document.querySelector('img')).toBeNull()
  })
})
