// The files a chat message can link to: each root's index, the files that
// the FileStore lists (git's tracked files), with an ID for each, and the
// text of one listed file by its ID. The index is the boundary: a file
// that is not listed has no ID and no text. A text read is `binary` (415)
// for a NUL byte in the first 8 KiB or bad UTF-8, and `tooLarge` (413)
// over `maxFileText` bytes, never a cut text.
import { createHash } from 'node:crypto'
import {
  FileId,
  type FileRoot,
  type FilesResponse,
  type FileTextResponse,
  maxFileText,
  maxIndexFiles,
  RootFilePath,
} from '@bridge/contract'
import { ok, type Result } from '@bridge/shared'
import type { FileStore, FileStoreError } from './fileStore.ts'

/** The ID of `path` in `root`: 16 hex characters of a sha256 of both. */
export const fileIdOf = (root: FileRoot, path: string): FileId =>
  FileId.parse(createHash('sha256').update(`${root}\0${path}`).digest('hex').slice(0, 16))

/** How many first bytes a text read looks at for a NUL. */
const sniffBytes = 8192

/** The text of `bytes`, or undefined when they hold a NUL in the first 8 KiB or are not UTF-8. */
function textOf(bytes: Uint8Array): string | undefined {
  if (bytes.subarray(0, sniffBytes).includes(0)) return undefined
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return undefined
  }
}

export type Files = {
  /** The root's index: its listed files with their IDs, at most `maxIndexFiles`; `notFound` for a chat root. */
  index(root: FileRoot): Promise<Result<FilesResponse | 'notFound', FileStoreError>>
  /** The text of the file `id` of `root`. */
  text(
    root: FileRoot,
    id: FileId,
  ): Promise<Result<FileTextResponse | 'notFound' | 'tooLarge' | 'binary', FileStoreError>>
}

/** The roots the store serves: the brain only, until a chat root has its git repository (B1c). */
const served = (root: FileRoot) => root === 'brain'

export function createFiles(store: FileStore): Files {
  /** The listed paths that the contract can carry, in the store's order; none for a root it does not serve. */
  const paths = async (root: FileRoot) => {
    if (!served(root)) return ok([])
    const listed = await store.list(root)
    return listed.ok ? ok(listed.value.filter((p) => RootFilePath.safeParse(p).success)) : listed
  }
  return {
    async index(root) {
      if (!served(root)) return ok('notFound')
      const listed = await paths(root)
      if (!listed.ok) return listed
      const files = listed.value.slice(0, maxIndexFiles).map((path) => ({ id: fileIdOf(root, path), path }))
      return ok({ root, files, cut: listed.value.length > maxIndexFiles })
    },
    async text(root, id) {
      const listed = await paths(root)
      if (!listed.ok) return listed
      const path = listed.value.slice(0, maxIndexFiles).find((p) => fileIdOf(root, p) === id)
      if (path === undefined) return ok('notFound')
      const read = await store.read(root, path, maxFileText)
      if (!read.ok) return read
      if (typeof read.value === 'string') return ok(read.value)
      const text = textOf(read.value)
      return ok(text === undefined ? 'binary' : { id, path, text })
    },
  }
}
