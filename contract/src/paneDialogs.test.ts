import { describe, expect, it } from 'vitest'
import { AnswerDialogRequest, maxDialogChars, PaneDialog, PaneDialogResponse } from './paneDialogs.ts'

const id = 'a1b2c3d4e5f60718'
const raw = 'Send this to Claude?\n1. Send structured\n2. Send original'

describe('PaneDialog', () => {
  it('takes a read dialog with its numbered options', () => {
    const dialog = {
      id,
      title: 'Send this to Claude?',
      options: [
        { n: 1, label: 'Send structured' },
        { n: 2, label: 'Send original' },
      ],
      raw,
    }
    expect(PaneDialog.parse(dialog)).toEqual(dialog)
  })

  it('takes an option detail of 1 to 500 characters and refuses an empty or longer one', () => {
    const withDetail = (detail: string) => ({ id, raw, options: [{ n: 1, label: 'Send original', detail }] })
    expect(PaneDialog.safeParse(withDetail('the notes as typed')).success).toBe(true)
    expect(PaneDialog.safeParse(withDetail('x'.repeat(500))).success).toBe(true)
    expect(PaneDialog.safeParse(withDetail('')).success).toBe(false)
    expect(PaneDialog.safeParse(withDetail('x'.repeat(501))).success).toBe(false)
  })

  it('takes a dialog with its text only, for a shape the server does not read for sure', () => {
    expect(PaneDialog.parse({ id, raw })).toEqual({ id, raw })
  })

  it('refuses two options with one number, an ID that is not a hash, no text and too much text', () => {
    const two = [
      { n: 1, label: 'a' },
      { n: 1, label: 'b' },
    ]
    expect(PaneDialog.safeParse({ id, raw, options: two }).success).toBe(false)
    expect(PaneDialog.safeParse({ id: '../w1:p2', raw }).success).toBe(false)
    expect(PaneDialog.safeParse({ id, raw: '' }).success).toBe(false)
    expect(PaneDialog.safeParse({ id, raw: 'x'.repeat(maxDialogChars + 1) }).success).toBe(false)
    expect(PaneDialog.safeParse({ id, raw, keys: 'Enter' }).success).toBe(false)
  })

  it('answers null when the screen shows no dialog', () => {
    expect(PaneDialogResponse.parse({ dialog: null })).toEqual({ dialog: null })
  })
})

describe('AnswerDialogRequest', () => {
  it('takes the dialog ID and one option number only', () => {
    expect(AnswerDialogRequest.parse({ id, n: 2 })).toEqual({ id, n: 2 })
    expect(AnswerDialogRequest.safeParse({ id, n: 0 }).success).toBe(false)
    expect(AnswerDialogRequest.safeParse({ id, n: 10 }).success).toBe(false)
    expect(AnswerDialogRequest.safeParse({ id, n: 1, keys: '1' }).success).toBe(false)
    expect(AnswerDialogRequest.safeParse({ n: 1 }).success).toBe(false)
  })
})
