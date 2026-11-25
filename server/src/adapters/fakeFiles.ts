// The FileStore's fake: one brain's tracked files in memory; an unreadable path is listed, never read.
import { ok } from '@bridge/shared'
import type { FileStore } from '../services/fileStore.ts'

export type FakeFilesOptions = {
  /** The tracked files of the brain and their text or bytes, `_local/` too, as git tracks it. */
  readonly tracked: Readonly<Record<string, string | Uint8Array>>
  /** The brain's folder, for `locate`: an absolute path under it is in the brain. */
  readonly dir?: string | undefined
  /** Tracked paths that are not a file in the root, such as a symlink out of it. */
  readonly unreadable?: readonly string[] | undefined
}

export function createFakeFiles({ tracked, unreadable = [], dir = '/fake/brain' }: FakeFilesOptions): FileStore {
  const listed = [...Object.keys(tracked), ...unreadable].filter((p) => !p.startsWith('_local/'))
  const bytes = new Map<string, Uint8Array>()
  for (const path of listed) {
    const value = tracked[path]
    if (value !== undefined) bytes.set(path, typeof value === 'string' ? new TextEncoder().encode(value) : value)
  }
  return {
    list: (root) => Promise.resolve(ok(root === 'brain' ? listed : [])),
    locate: (absolute) => {
      const path = absolute.startsWith(`${dir}/`) ? absolute.slice(dir.length + 1) : undefined
      const found: { readonly root: 'brain'; readonly path: string } | 'notFound' =
        path !== undefined && (path in tracked || unreadable.includes(path)) ? { root: 'brain', path } : 'notFound'
      return Promise.resolve(ok(found))
    },
    read: (root, path, max) => {
      const found = root === 'brain' ? bytes.get(path) : undefined
      const value: Uint8Array | 'notFound' | 'tooLarge' =
        found === undefined ? 'notFound' : found.length > max ? 'tooLarge' : found
      return Promise.resolve(ok(value))
    },
  }
}
