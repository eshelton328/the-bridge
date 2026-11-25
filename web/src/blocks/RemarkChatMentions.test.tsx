import type { ReactNode } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { afterEach, describe, expect, it } from 'vitest'
import { testRender } from '../lib/testRender.ts'
import { mentionIndex, remarkChatMentions } from './remarkChatMentions.ts'

// The plugin alone, drawn with react-markdown and a plain element for each mention, so a test reads which words
// became mentions and of which chat. The chat IDs and titles are made up.
const chats = new Map([
  ['m1/p1', 'bridge-coord'],
  ['m1/p2', 'routing'],
  ['m1/p3', 'The-bridge review chat'],
  ['m1/p4', 'twin-chat'],
  ['m1/p5', 'Twin-Chat'],
])

// The plugin's element as a plain mark; `Components` has no key for it, so it is spread in.
const mentionParts = {
  'chat-mention': ({ chat, children }: { chat?: unknown; children?: ReactNode }) => (
    <mark data-chat={typeof chat === 'string' ? chat : ''}>{children}</mark>
  ),
}

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
})

/** The mentions `text` draws, as `chat=text`. */
async function mentions(text: string): Promise<string[]> {
  view = await testRender(
    <Markdown remarkPlugins={[remarkGfm, [remarkChatMentions, chats]]} components={{ ...mentionParts, p: 'p' }}>
      {text}
    </Markdown>,
  )
  const out = [...document.querySelectorAll('mark')].map((m) => `${m.dataset.chat ?? ''}=${m.textContent}`)
  await view.unmount()
  view = undefined
  return out
}

describe('remarkChatMentions', () => {
  it('links a hyphenated or two-word title with or without @', async () => {
    expect(await mentions('Ask bridge-coord, then @bridge-coord and the-bridge review chat.')).toEqual([
      'm1/p1=bridge-coord',
      'm1/p1=@bridge-coord',
      'm1/p3=the-bridge review chat',
    ])
  })

  it('links a one-word title only with @', async () => {
    expect(await mentions('The routing rule; ask @routing.')).toEqual(['m1/p2=@routing'])
  })

  it('leaves an unknown name, a shared title and a name after a word as text', async () => {
    expect(await mentions('@backend-coord and twin-chat and x@bridge-coord')).toEqual([])
  })

  it('leaves code, a link and a path as text', async () => {
    const text = [
      '`bridge-coord` in code, [bridge-coord](https://example.com) in a link,',
      'bridge-coord.md and x/bridge-coord in a path',
      '',
      '```',
      'bridge-coord',
      '```',
    ].join('\n')
    expect(await mentions(text)).toEqual([])
  })

  it('finds a mention in emphasis and a list item', async () => {
    expect(await mentions('- **bridge-coord** owns it')).toEqual(['m1/p1=bridge-coord'])
  })
})

describe('mentionIndex', () => {
  it('drops the titles two chats share and empty titles', () => {
    const index = mentionIndex(new Map([...chats, ['m1/p6', ' ']]))
    expect([...index]).toEqual([
      ['bridge-coord', 'm1/p1'],
      ['routing', 'm1/p2'],
      ['the-bridge review chat', 'm1/p3'],
    ])
  })
})
