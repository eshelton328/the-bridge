import { describe, expect, it } from 'vitest'
import { isHeic, jpegName, safeFileName, sentFileName } from './fileNames.ts'

describe('safeFileName', () => {
  it('keeps letters, digits and . _ - and drops the folder', () => {
    expect(safeFileName('notes-1.md')).toBe('notes-1.md')
    expect(safeFileName('a/b\\plan v2.pdf')).toBe('plan_v2.pdf')
  })

  it('drops leading dots and underscores, keeps the last 100 characters and names an empty one "file"', () => {
    expect(safeFileName('..hidden')).toBe('hidden')
    expect(safeFileName(`${'x'.repeat(120)}.txt`)).toBe(`${'x'.repeat(96)}.txt`)
    expect(safeFileName('...')).toBe('file')
  })
})

describe('sentFileName', () => {
  it('gives a HEIC or HEIF photo the name of its JPEG copy', () => {
    expect(isHeic('IMG 1.HEIC')).toBe(true)
    expect(jpegName('IMG_1.heif')).toBe('IMG_1.jpg')
    expect(sentFileName('IMG 1.HEIC')).toBe('IMG_1.jpg')
  })

  it('gives any other file its safe name', () => {
    expect(sentFileName('my notes.txt')).toBe('my_notes.txt')
  })
})
