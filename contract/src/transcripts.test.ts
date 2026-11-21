import { describe, expect, it } from 'vitest'
import { maxAttachments } from './prompts.ts'
import {
  maxEntryFileName,
  maxEntryText,
  maxTranscriptEntries,
  TranscriptChangedEvent,
  TranscriptEntry,
  TranscriptResponse,
  UserEntry,
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

  it('refuses an unknown kind, a chat ID without its machine and an entry with no ID', () => {
    expect(TranscriptEntry.safeParse({ ...user, type: 'progress' }).success).toBe(false)
    expect(TranscriptResponse.safeParse({ ...response, chat: 'session-a' }).success).toBe(false)
    expect(TranscriptEntry.safeParse({ ...user, id: '' }).success).toBe(false)
  })
})
