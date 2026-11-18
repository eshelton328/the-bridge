import { describe, expect, it } from 'vitest'
import { fileMode, fileModes, markdownSource, openFile, selectFile } from './blocks/filesView.ts'
import { toolkitStates } from './states/index.ts'

// The Files tab on a tablet (T4, T6): a Markdown file's Rendered and Source views, and the script that opens on a page
// of its own. filesView.test.ts checks the desktop's (D6, D10).
const { skillFiles, scriptExplained } = toolkitStates
const browser = skillFiles.data.details.find((d) => d.path === 'skills/writer/')?.browser
if (browser === undefined) throw new Error('D6 has no file browser')

describe('a Markdown file on the Files tab (T4)', () => {
  const tablet = toolkitStates.skillFilesTablet.data.details.find((d) => d.path === 'skills/writer/')?.browser
  if (tablet === undefined) throw new Error('T4 has no file browser')
  const doc = openFile(tablet).view

  it('opens doc.md rendered, with its source on Code (Source)', () => {
    expect(openFile(tablet).path).toBe('references/doc.md')
    expect(fileMode(doc)).toBe('rendered')
    expect(fileMode(doc, 'code')).toBe('code')
    expect(fileMode(doc, 'explain')).toBe('rendered')
  })

  it('names the switch of each kind of file: Rendered and Source, Explain and Code, or none', () => {
    expect(fileModes(doc).map((m) => m.label)).toEqual(['Rendered', 'Source'])
    const explained = scriptExplained.data.details.find((d) => d.path === 'skills/writer/')?.browser
    if (explained === undefined) throw new Error('D10 has no file browser')
    expect(fileModes(openFile(explained).view).map((m) => m.label)).toEqual(['Explain', 'Code'])
    expect(fileModes(openFile(browser).view)).toEqual([])
    expect(fileModes(undefined)).toEqual([])
  })

  it('writes the source back from the blocks, one blank line between them', () => {
    expect(
      markdownSource([
        { type: 'title', text: 'Docs' },
        { type: 'heading', text: 'Paths' },
        { type: 'paragraph', text: 'A line.' },
        { type: 'code', items: ['a.md', 'b.md'] },
        { type: 'pre', text: 'x\ny' },
      ]),
    ).toEqual(['# Docs', '', '## Paths', '', 'A line.', '', '`a.md`  `b.md`', '', '```', 'x', 'y', '```'])
  })
})

describe('selectFile', () => {
  const explained = scriptExplained.data.details.find((d) => d.path === 'skills/writer/')?.browser
  if (explained === undefined) throw new Error('D10 has no file browser')

  it('opens a script with an explanation on a page of its own on a tablet or phone (T6), in the viewer otherwise', () => {
    expect(selectFile(explained, 'scripts/check', true)).toEqual({
      file: 'scripts/check',
      fileView: undefined,
      filePage: true,
    })
    expect(selectFile(explained, 'scripts/check', false)).toEqual({
      file: 'scripts/check',
      fileView: undefined,
      filePage: undefined,
    })
    expect(selectFile(explained, 'references/doc.md', true).filePage).toBeUndefined()
  })
})

describe('selectFile on the phone (M5)', () => {
  const phone = toolkitStates.skillFilesPhone.data.details.find((d) => d.path === 'skills/writer/')?.browser
  if (phone === undefined) throw new Error('M5 has no file browser')

  it('opens every file with a view on a page of its own, and marks a file with none', () => {
    // check has D6's source but no explanation; on a tablet it opens under the tree, on the phone on its page.
    expect(selectFile(phone, 'scripts/check', true).filePage).toBeUndefined()
    expect(selectFile(phone, 'scripts/check', true, true)).toEqual({
      file: 'scripts/check',
      fileView: undefined,
      filePage: true,
    })
    expect(selectFile(phone, 'references/doc.md', true, true).filePage).toBe(true)
    expect(selectFile(phone, 'scripts/ste-dict', true, true)).toEqual({
      file: 'scripts/ste-dict',
      fileView: undefined,
      filePage: undefined,
    })
  })
})
