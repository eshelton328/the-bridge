// The FileStore's fake: one brain's tracked files in memory; an unreadable path is listed, never read.
import { ok } from '@bridge/shared'
import type { FileStore } from '../services/fileStore.ts'

export type FakeFilesOptions = {
  /** The tracked files of the brain and their text, `_local/` too, as git tracks it. */
  readonly tracked: Readonly<Record<string, string>>
  /** Tracked paths that are not a file in the root, such as a symlink out of it. */
  readonly unreadable?: readonly string[] | undefined
}

export function createFakeFiles({ tracked, unreadable = [] }: FakeFilesOptions): FileStore {
  const listed = [...Object.keys(tracked), ...unreadable].filter((p) => !p.startsWith('_local/'))
  const bytes = new Map<string, Uint8Array>()
  for (const path of listed) {
    const text = tracked[path]
    if (text !== undefined) bytes.set(path, new TextEncoder().encode(text))
  }
  return {
    list: (root) => Promise.resolve(ok(root === 'brain' ? listed : [])),
    read: (root, path, max) => {
      const found = root === 'brain' ? bytes.get(path) : undefined
      const value: Uint8Array | 'notFound' | 'tooLarge' =
        found === undefined ? 'notFound' : found.length > max ? 'tooLarge' : found
      return Promise.resolve(ok(value))
    },
  }
}
