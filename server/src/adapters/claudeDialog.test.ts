import { PaneDialog } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import { dialogKeys, dialogOf } from './claudeDialog.ts'
import { claudeScreen, questionScreen, switchModelScreen } from './fakeHerdrSocket.ts'

describe('dialogOf', () => {
  it('reads the title, the question and the options of one choice, with no option that needs typing', () => {
    const shown = dialogOf(questionScreen(2))
    expect(shown?.picked).toBe(2)
    expect(PaneDialog.parse(shown?.dialog)).toMatchObject({
      title: 'Colour',
      body: 'Which colour for marker-5150?',
      options: [
        { n: 1, label: 'Red', detail: 'Use red for marker-5150.' },
        { n: 2, label: 'Green', detail: 'Use green for marker-5150.' },
        { n: 3, label: 'Blue', detail: 'Use blue for marker-5150.' },
      ],
    })
    // The text above the dialog's edge is the chat's, so it is not in the dialog.
    expect(shown?.dialog.raw).not.toContain('example text')
    expect(shown?.dialog.raw).toContain('Chat about this')
  })

  it('gives a description as the detail of its option only when it differs from the label, case aside', () => {
    const screen = questionScreen(1)
      .replace('Use red for marker-5150.', 'red')
      .replace('Use blue for marker-5150.', 'Blue')
    expect(dialogOf(screen)?.dialog.options).toEqual([
      { n: 1, label: 'Red' },
      { n: 2, label: 'Green', detail: 'Use green for marker-5150.' },
      { n: 3, label: 'Blue' },
    ])
  })

  it('keeps the question and the options when "Chat about this", under an edge, is marked', () => {
    const shown = dialogOf(questionScreen(1).replace('❯ 1.', '  1.').replace('  5. Chat', '❯ 5. Chat'))
    expect([shown?.picked, shown?.dialog.title, shown?.dialog.options?.length]).toEqual([5, 'Colour', 3])
    if (shown !== null) expect(dialogKeys(shown, 1)).toEqual(['up', 'up', 'up', 'up', 'enter'])
  })

  it('takes the last "❯" on the screen, not one that earlier text quotes', () => {
    const quoted = `❯ 1. Ship the plan\r\n  2. Wait\r\n${'─'.repeat(40)}\r\n${questionScreen(2)}`
    const shown = dialogOf(quoted)
    expect([shown?.picked, shown?.dialog.options?.length]).toEqual([2, 3])
    expect(shown?.dialog.raw).not.toContain('Ship the plan')
  })

  it('gives options to no block that another edge follows, as it is not the last block', () => {
    const quoted = `  Question?\r\n❯ 1. Yes\r\n  2. No\r\n${'─'.repeat(40)}\r\n  Press Enter to go on`
    expect(dialogOf(quoted)?.dialog).toMatchObject({ raw: '  Press Enter to go on' })
    expect(dialogOf(quoted)?.dialog.options).toBeUndefined()
  })

  it('gives "Switch model?" its options', () => {
    expect(dialogOf(switchModelScreen())?.dialog).toMatchObject({
      title: 'Switch model?',
      options: [
        { n: 1, label: 'Yes, switch to Sonnet 5.5' },
        { n: 2, label: 'No, go back' },
      ],
    })
  })

  it('gives a multi-select dialog its text only, as Enter there only marks an option', () => {
    const shown = dialogOf(questionScreen(1, true))
    expect(shown?.dialog.options).toBeUndefined()
    expect(shown?.dialog.raw).toContain('Which colour for marker-5150?')
  })

  it('gives a dialog with no marked option the text below its edge, and the whole screen with no edge', () => {
    const asked = ['  older text', '─'.repeat(40), '  Allow this?', '  1. Yes', '  2. No'].join('\r\n')
    expect(dialogOf(asked)?.dialog).toMatchObject({ raw: '  Allow this?\n  1. Yes\n  2. No' })
    expect(dialogOf(asked)?.dialog.options).toBeUndefined()
    expect(dialogOf('  Press Enter to go on')?.dialog.raw).toBe('  Press Enter to go on')
  })

  it('reads no dialog on a screen with the input box, or with no text', () => {
    expect(dialogOf(claudeScreen(''))).toBeNull()
    expect(dialogOf('\r\n  \r\n')).toBeNull()
  })

  it('gives another ID when the screen marks another option', () => {
    expect(dialogOf(questionScreen(1))?.dialog.id).not.toBe(dialogOf(questionScreen(2))?.dialog.id)
    expect(dialogOf(questionScreen(1))?.dialog.id).toBe(dialogOf(questionScreen(1))?.dialog.id)
  })
})

describe('dialogKeys', () => {
  it('moves from the marked option to the tapped one, then presses Enter', () => {
    const shown = dialogOf(questionScreen(2))
    if (shown === null) throw new Error('no dialog')
    expect(dialogKeys(shown, 3)).toEqual(['down', 'enter'])
    expect(dialogKeys(shown, 1)).toEqual(['up', 'enter'])
    expect(dialogKeys(shown, 2)).toEqual(['enter'])
  })

  it('gives no keys for an option the dialog does not offer, or for a dialog with no options', () => {
    const shown = dialogOf(questionScreen(1))
    const multi = dialogOf(questionScreen(1, true))
    if (shown === null || multi === null) throw new Error('no dialog')
    expect(dialogKeys(shown, 4)).toBeNull()
    expect(dialogKeys(shown, 5)).toBeNull()
    expect(dialogKeys(multi, 1)).toBeNull()
  })
})
