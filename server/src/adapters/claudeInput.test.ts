import { describe, expect, it } from 'vitest'
import { bareText, inputBoxOf } from './claudeInput.ts'
import { claudeScreen } from './fakeHerdrSocket.ts'

const esc = String.fromCharCode(27)
const line = `${esc}[0m${esc}[38;2;136;136;136m${'─'.repeat(60)}${esc}[0m`
// Screens as herdr's pane.read gives them with format "ansi", from a Claude Code 2.1 pane.
const screen = (...box: string[]) =>
  ['Claude Code', '', line, ...box, line, `  ${esc}[0m${esc}[38;2;255;193;7m⏵⏵ auto mode on${esc}[0m`].join('\r\n')

describe('inputBoxOf', () => {
  it('reads an empty box, with or without its dim placeholder', () => {
    expect(inputBoxOf(screen(`❯ ${esc}[0m${esc}[2mTry "fix lint errors"${esc}[0m`))).toEqual({ text: '', lines: 1 })
    expect(inputBoxOf(screen('❯ '))).toEqual({ text: '', lines: 1 })
  })

  it('reads the text of each line, with the indent of each next line taken off', () => {
    expect(inputBoxOf(screen('❯ First line: write a story.', '  Second line: use plain text.'))).toEqual({
      text: 'First line: write a story.\nSecond line: use plain text.',
      lines: 2,
    })
    expect(inputBoxOf(screen('❯ First line.', '  '))).toEqual({ text: 'First line.', lines: 2 })
  })

  it('reads the last box when the screen shows earlier rules above it', () => {
    expect(inputBoxOf(`${line}\r\nold output\r\n${screen('❯ draft')}`)).toEqual({ text: 'draft', lines: 1 })
  })

  it('gives null for a screen with no box, such as a dialog', () => {
    expect(inputBoxOf('Quick safety check: Is this a project you trust?\r\n ❯ No, exit')).toBeNull()
    expect(inputBoxOf(screen('  1. Yes', '  2. No'))).toBeNull()
  })

  it('reads the screen that the fake socket gives', () => {
    expect(inputBoxOf(claudeScreen(''))).toEqual({ text: '', lines: 1 })
    expect(inputBoxOf(claudeScreen('Run the tests.'))).toEqual({ text: 'Run the tests.', lines: 1 })
  })
})

describe('bareText', () => {
  it('matches a prompt to the box that shows it wrapped', () => {
    expect(bareText('line A xx\n  xx end')).toBe(bareText('line A xxxx end'))
  })
})
