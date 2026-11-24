// A reply that a Stop hook sent back (R62): a draft whose rewrite is in the
// transcript folds into the rewrite; a draft whose rewrite is not there shows
// as a reply. The page's mapping (`withTranscripts`, `chatEntryOf`) gives the
// rewrite its note and drafts.
import type { TranscriptEntry } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import { chatEntryOf, transcriptText } from './liveTranscript.ts'
import { foldDrafts } from './rewrittenReplies.ts'

type AssistantEntry = Extract<TranscriptEntry, { type: 'assistant' }>

const user = (id: string): TranscriptEntry => ({ type: 'user', id, text: `prompt ${id}`, cut: false })
const reply = (id: string, replacedBy?: string): AssistantEntry => ({
  type: 'assistant',
  id,
  text: `reply ${id}`,
  cut: false,
  ...(replacedBy === undefined ? {} : { replacedBy }),
})
const hook = (id: string): TranscriptEntry => ({ type: 'note', id, kind: 'hook', text: 'Stop hook: reply rewritten' })

/** Each shown entry's ID with the IDs of the drafts it carries. */
const shape = (entries: readonly TranscriptEntry[]) =>
  foldDrafts(entries).map(({ entry, drafts }) => [entry.id, drafts.map((d) => d.id)])

describe('foldDrafts (R62)', () => {
  it('folds a draft into its rewrite when the rewrite is in the transcript', () => {
    expect(shape([user('u1'), reply('a1', 'a2'), hook('n1'), reply('a2')])).toEqual([
      ['u1', []],
      ['n1', []],
      ['a2', ['a1']],
    ])
  })

  it('shows a draft as a reply when its rewrite is not in the transcript yet', () => {
    expect(shape([user('u1'), reply('a1', 'a2'), hook('n1')])).toEqual([
      ['u1', []],
      ['a1', []],
      ['n1', []],
    ])
  })

  it('folds a chain of rewrites into the last reply there, oldest first', () => {
    const chain = [user('u1'), reply('a1', 'a2'), hook('n1'), reply('a2', 'a3'), hook('n2'), reply('a3')]
    expect(shape(chain)).toEqual([
      ['u1', []],
      ['n1', []],
      ['n2', []],
      ['a3', ['a1', 'a2']],
    ])
    // The last rewrite has not come: the second draft shows, carrying the first.
    expect(shape(chain.slice(0, 5))).toEqual([
      ['u1', []],
      ['n1', []],
      ['a2', ['a1']],
      ['n2', []],
    ])
  })

  it('shows a draft whose mark names an entry that is not a reply, and ends a loop of marks', () => {
    expect(shape([user('u1'), reply('a1', 'u1')])).toEqual([
      ['u1', []],
      ['a1', []],
    ])
    expect(shape([reply('a1', 'a2'), reply('a2', 'a1')])).toEqual([
      ['a1', []],
      ['a2', []],
    ])
  })

  it('gives the rewrite its note and drafts, and a reply with none no note', () => {
    expect(chatEntryOf(reply('a2'), 'claude', [{ ...reply('a1', 'a2'), cut: true }])).toEqual({
      type: 'assistant',
      id: 'a2',
      kind: 'claude',
      name: 'Claude',
      text: 'reply a2',
      copy: 'Copy',
      rewritten: {
        label: transcriptText.rewritten,
        drafts: [{ id: 'a1', name: transcriptText.draft, text: 'reply a1', cut: transcriptText.cut }],
      },
    })
    expect(chatEntryOf(reply('a3'), 'claude')).not.toHaveProperty('rewritten')
  })
})
