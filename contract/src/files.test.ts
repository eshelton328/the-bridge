import { describe, expect, it } from 'vitest'
import { FileRawQuery, FilesQuery, RootFilePath } from './files.ts'

describe('RootFilePath', () => {
  it.each([
    ...['README.md', 'toolkit/rules/writing.md', '.github/ci.yml'].map((p): [string, boolean] => [p, true]),
    ...['', '/etc/hosts', '../x', 'a/../b', 'a//b', './a', 'a/'].map((p): [string, boolean] => [p, false]),
  ])('gives %j %s', (path, valid) => {
    expect(RootFilePath.safeParse(path).success).toBe(valid)
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
  it.each([
    [true, { root: 'brain', path: 'images/a.png' }],
    [true, { path: '/tmp/a.png' }],
    [false, { path: 'images/a.png' }],
    [false, { root: 'brain', path: '/tmp/a.png' }],
    [false, { path: '/tmp/a\0.png' }],
    [false, { path: '/tmp/a.png', type: 'png' }],
  ])('gives %s for %j', (valid, query) => {
    expect(FileRawQuery.safeParse(query).success).toBe(valid)
  })
})
