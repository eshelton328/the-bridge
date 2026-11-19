import '../../index.css'
import { afterEach, describe, expect, it } from 'vitest'
import { testRender } from '../../lib/testRender.ts'
import { ToolkitGlyphText } from './blocks/ToolkitGlyphText.tsx'

// The line splits at each ✗ and ✓ only. A run that is the name of an
// object's inherited property must stay plain text and not crash.
let view: { unmount: () => Promise<void> } | undefined
afterEach(async () => {
  await view?.unmount()
  view = undefined
})

describe('ToolkitGlyphText', () => {
  it.each(['constructor', 'toString', '__proto__', 'hasOwnProperty'])('keeps %s as plain text', async (word) => {
    view = await testRender(<ToolkitGlyphText text={word} />)
    expect(document.body.textContent).toContain(word)
    expect(document.querySelectorAll('.glyph__root')).toHaveLength(0)
  })

  it('draws a glyph for each ✗ and ✓ and keeps the other text', async () => {
    view = await testRender(<ToolkitGlyphText text="constructor ✗ toString ✓" />)
    expect(document.querySelectorAll('.glyph__root')).toHaveLength(2)
    expect(document.body.textContent).toContain('constructor ✗ toString ✓')
  })
})
