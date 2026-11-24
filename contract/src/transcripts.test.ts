import { describe, expect, it } from 'vitest'
import { maxAttachments } from './prompts.ts'
import {
  maxEntryFileName,
  maxEntryText,
  maxErrorText,
  maxTranscriptEntries,
  TranscriptChangedEvent,
  TranscriptEntry,
  TranscriptQuery,
  TranscriptResponse,
  UserEntry,
  maxNoteFrom,
  maxNoteText,
} from './transcripts.ts'

const user = { type: 'user', id: 'u1', text: 'Fix the build', cut: false }
const assistant = { type: 'assistant', id: 'a1', text: '**Done.**', cut: false }
const tool = { type: 'tool', id: 't1', name: 'Bash', target: 'pnpm', running: true }
const response = { chat: 'mac-mini/session-a', entries: [user, tool, assistant], earlier: false }
const event = {
  source: 'mac-mini/transcripts',
  seq: 0,
  type: 'transcript.changed',
  data: { chat: 'mac-mini/session-a', entries: [{ ...tool, running: false }] },
}

describe('transcripts', () => {
  it('parses each entry kind and a response in order', () => {
    expect(TranscriptResponse.parse(response)).toEqual(response)
    expect(TranscriptEntry.parse(tool)).toEqual(tool)
  })

  it('parses a change event, and refuses one with no entry', () => {
    expect(TranscriptChangedEvent.parse(event)).toEqual(event)
    expect(TranscriptChangedEvent.safeParse({ ...event, data: { ...event.data, entries: [] } }).success).toBe(false)
    expect(TranscriptChangedEvent.parse({ ...event, data: { ...event.data, added: 1 } }).data.added).toBe(1)
    expect(TranscriptChangedEvent.safeParse({ ...event, data: { ...event.data, added: 2 } }).success).toBe(false)
  })

  it('refuses an entry ID twice in a response or an event', () => {
    expect(TranscriptResponse.safeParse({ ...response, entries: [user, { ...assistant, id: 'u1' }] }).success).toBe(
      false,
    )
    expect(TranscriptChangedEvent.safeParse({ ...event, data: { ...event.data, entries: [tool, tool] } }).success).toBe(
      false,
    )
  })

  it('refuses text over the limit, more entries than the limit and a long target', () => {
    expect(TranscriptEntry.safeParse({ ...user, text: 'x'.repeat(maxEntryText), cut: true }).success).toBe(true)
    expect(TranscriptEntry.safeParse({ ...user, text: 'x'.repeat(maxEntryText + 1) }).success).toBe(false)
    const many = Array.from({ length: maxTranscriptEntries + 1 }, (_, i) => ({ ...user, id: `u${String(i)}` }))
    expect(TranscriptResponse.safeParse({ ...response, entries: many, earlier: true }).success).toBe(false)
    expect(TranscriptEntry.safeParse({ ...tool, target: 'x'.repeat(201) }).success).toBe(false)
  })

  it("takes a user entry's file names, and refuses an empty list, too many files or a long name", () => {
    const entry = { type: 'user', id: 'u1', text: 'Look.', cut: false }
    expect(UserEntry.safeParse({ ...entry, files: ['plan.pdf'] }).success).toBe(true)
    expect(UserEntry.safeParse({ ...entry, files: [] }).success).toBe(false)
    expect(
      UserEntry.safeParse({ ...entry, files: Array.from({ length: maxAttachments + 1 }, () => 'a.png') }).success,
    ).toBe(false)
    expect(UserEntry.safeParse({ ...entry, files: ['a'.repeat(maxEntryFileName + 1)] }).success).toBe(false)
  })

  it('takes an error entry of text only, and refuses empty or long text', () => {
    const error = { type: 'error', id: 'e1', text: 'Error: compact failed', cut: false }
    expect(TranscriptEntry.safeParse(error).success).toBe(true)
    expect(TranscriptEntry.safeParse({ ...error, text: '' }).success).toBe(false)
    expect(TranscriptEntry.safeParse({ ...error, text: 'x'.repeat(maxErrorText + 1) }).success).toBe(false)
  })

  it('refuses an unknown kind, a chat ID without its machine and an entry with no ID', () => {
    expect(TranscriptEntry.safeParse({ ...user, type: 'progress' }).success).toBe(false)
    expect(TranscriptResponse.safeParse({ ...response, chat: 'session-a' }).success).toBe(false)
    expect(TranscriptEntry.safeParse({ ...user, id: '' }).success).toBe(false)
  })

  it('takes a note entry of a known kind with a short text, and no other kind (R46)', () => {
    const note = { type: 'note', id: 'n1', kind: 'task', text: 'Background task finished: tests pass' }
    expect(TranscriptEntry.parse(note)).toEqual(note)
    expect(TranscriptEntry.safeParse({ ...note, kind: 'owner' }).success).toBe(false)
    expect(TranscriptEntry.safeParse({ ...note, text: '' }).success).toBe(false)
    expect(TranscriptEntry.safeParse({ ...note, text: 'x'.repeat(maxNoteText + 1) }).success).toBe(false)
  })

  it('takes a message from another chat on a peer note only, with a short sender name (R55)', () => {
    const message = { from: 'sample-coord', via: 'prompt', text: 'Run the tests', cut: false }
    const peer = { type: 'note', id: 'n2', kind: 'peer', text: 'Message from sample-coord', message }
    expect(TranscriptEntry.parse(peer)).toEqual(peer)
    expect(TranscriptEntry.parse({ ...peer, message: { ...message, from: null, via: 'message' } })).toBeDefined()
    expect(TranscriptEntry.safeParse({ ...peer, kind: 'task' }).success).toBe(false)
    expect(TranscriptEntry.safeParse({ ...peer, message: { ...message, from: '' } }).success).toBe(false)
    expect(
      TranscriptEntry.safeParse({ ...peer, message: { ...message, from: 'x'.repeat(maxNoteFrom + 1) } }).success,
    ).toBe(false)
    expect(TranscriptEntry.safeParse({ ...peer, message: { ...message, via: 'owner' } }).success).toBe(false)
    expect(
      TranscriptEntry.safeParse({ ...peer, message: { ...message, text: 'x'.repeat(maxEntryText + 1) } }).success,
    ).toBe(false)
  })

  it('takes the ID of the reply that replaced a draft that a Stop hook sent back (R62)', () => {
    expect(TranscriptEntry.parse({ ...assistant, replacedBy: 'a2' })).toEqual({ ...assistant, replacedBy: 'a2' })
    expect(TranscriptEntry.safeParse({ ...assistant, replacedBy: '' }).success).toBe(false)
  })
})

describe('TranscriptQuery', () => {
  it('takes no key, a limit of 1 to maxTranscriptEntries, an entry ID, or both, and drops other keys', () => {
    expect(TranscriptQuery.parse({})).toEqual({})
    expect(TranscriptQuery.parse({ limit: '100' })).toEqual({ limit: 100 })
    expect(TranscriptQuery.parse({ limit: String(maxTranscriptEntries) })).toEqual({ limit: maxTranscriptEntries })
    expect(TranscriptQuery.parse({ before: 'u1:0' })).toEqual({ before: 'u1:0' })
    expect(TranscriptQuery.parse({ limit: '1', before: 'toolu_1', t: '5150' })).toEqual({ limit: 1, before: 'toolu_1' })
  })

  it('refuses a limit that is not a whole number in range, and an empty or long entry ID', () => {
    for (const limit of ['0', String(maxTranscriptEntries + 1), '-1', '1.5', '01', 'ten', '', '1e2'])
      expect(TranscriptQuery.safeParse({ limit }).success).toBe(false)
    expect(TranscriptQuery.safeParse({ before: '' }).success).toBe(false)
    expect(TranscriptQuery.safeParse({ before: 'x'.repeat(201) }).success).toBe(false)
  })
})
