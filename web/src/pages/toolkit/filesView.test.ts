import { describe, expect, it } from 'vitest'
import { fileMode, findFile, openFile } from './blocks/filesView.ts'
import { toolkitStates } from './states/index.ts'

const { skillFiles, scriptExplained } = toolkitStates
const writer = skillFiles.data.details.find((d) => d.path === 'skills/writer/')
const browser = writer?.browser
if (browser === undefined) throw new Error('D6 has no file browser')

describe('findFile', () => {
  it('finds a node at any depth, and nothing for a path the tree does not have', () => {
    expect(findFile(browser.tree, 'SKILL.md')?.name).toBe('SKILL.md')
    expect(findFile(browser.tree, 'scripts/check')?.type).toBe('code')
    expect(findFile(browser.tree, 'evals/ticket-scope/')?.type).toBe('folder')
    expect(findFile(browser.tree, 'scripts/nothing')).toBeUndefined()
  })
})

describe('openFile', () => {
  it('opens the browser’s selected file when ui.file is not set (D6: the script check, with its view)', () => {
    const open = openFile(browser)
    expect(open.path).toBe('scripts/check')
    expect(open.type).toBe('code')
    expect(open.view?.meta).toBe('Python · 437 lines · run, not read')
  })

  it('opens ui.file when the tree has it; a file with no view shows its bar only', () => {
    const open = openFile(browser, 'references/doc.md')
    expect(open).toEqual({ path: 'references/doc.md', type: 'file', view: undefined })
  })

  it('falls back to the selected file for a path the tree does not have', () => {
    expect(openFile(browser, 'scripts/gone').path).toBe('scripts/check')
  })
})

describe('fileMode', () => {
  const explained = scriptExplained.data.details.find((d) => d.path === 'skills/writer/')?.browser
  if (explained === undefined) throw new Error('D10 has no file browser')

  it('opens a script with an explanation on Explain, and on Code when ui.fileView asks for it (D10)', () => {
    const view = openFile(explained).view
    expect(fileMode(view)).toBe('explain')
    expect(fileMode(view, 'code')).toBe('code')
    expect(fileMode(view, 'explain')).toBe('explain')
  })

  it('shows Code for a script with no explanation (D6) and for a file with no view', () => {
    expect(fileMode(openFile(browser).view)).toBe('code')
    expect(fileMode(openFile(browser).view, 'explain')).toBe('code')
    expect(fileMode(undefined, 'explain')).toBe('code')
  })
})
