import { describe, expect, it } from 'vitest'
import { FilesQuery, RootFilePath } from './files.ts'

describe('RootFilePath', () => {
  it.each(['README.md', 'toolkit/rules/writing.md', '.github/ci.yml'])('takes %s', (path) => {
    expect(RootFilePath.safeParse(path).success).toBe(true)
  })

  it.each(['', '/etc/hosts', '../x', 'a/../b', 'a//b', './a', 'a/'])('refuses %j', (path) => {
    expect(RootFilePath.safeParse(path).success).toBe(false)
  })
})

describe('FilesQuery', () => {
  it('takes the brain root only, with no other key', () => {
    expect(FilesQuery.safeParse({ root: 'brain' }).success).toBe(true)
    expect(FilesQuery.safeParse({ root: 'other' }).success).toBe(false)
    expect(FilesQuery.safeParse({ root: 'brain', path: 'x' }).success).toBe(false)
  })
})
