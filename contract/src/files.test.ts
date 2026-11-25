import { describe, expect, it } from 'vitest'
import { FileRawQuery, FilesQuery, RootFilePath } from './files.ts'

describe('RootFilePath', () => {
  it.each(['README.md', 'toolkit/rules/writing.md', '.github/ci.yml'])('takes %s', (path) => {
    expect(RootFilePath.safeParse(path).success).toBe(true)
  })

  it.each(['', '/etc/hosts', '../x', 'a/../b', 'a//b', './a', 'a/'])('refuses %j', (path) => {
    expect(RootFilePath.safeParse(path).success).toBe(false)
  })
})

describe('FilesQuery', () => {
  it('takes the brain or a chat ID as its root, with no other key', () => {
    expect(FilesQuery.safeParse({ root: 'brain' }).success).toBe(true)
    expect(FilesQuery.safeParse({ root: 'test-mac/chat-a' }).success).toBe(true)
    expect(FilesQuery.safeParse({ root: 'other' }).success).toBe(false)
    expect(FilesQuery.safeParse({ root: 'brain', path: 'x' }).success).toBe(false)
  })
})

describe('FileRawQuery', () => {
  it('takes a root and a path, or an absolute path', () => {
    expect(FileRawQuery.safeParse({ root: 'brain', path: 'images/a.png' }).success).toBe(true)
    expect(FileRawQuery.safeParse({ path: '/tmp/a.png' }).success).toBe(true)
  })

  it.each([
    ['a relative path with no root', { path: 'images/a.png' }],
    ['an absolute path with a root', { root: 'brain', path: '/tmp/a.png' }],
    ['a path with a NUL', { path: '/tmp/a\0.png' }],
    ['another key', { path: '/tmp/a.png', type: 'png' }],
  ])('refuses %s', (_, query) => {
    expect(FileRawQuery.safeParse(query).success).toBe(false)
  })
})
