import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import { describe, expect, it } from 'vitest'

// testSetup.ts loads every declared face before a file's tests (loadFonts.ts), so a test that measures text never
// gets a fallback font's layout.
describe('the fonts a test file declares', () => {
  it('have all loaded when its first test starts', () => {
    const geist = [...document.fonts].filter((face) => face.family.startsWith('Geist'))
    expect(geist.length).toBeGreaterThan(0)
    expect(
      geist.filter((face) => face.status !== 'loaded').map((face) => `${face.family} ${face.unicodeRange}`),
    ).toEqual([])
  })
})
