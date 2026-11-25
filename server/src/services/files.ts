// The files a chat message can link to: each root's index, the files that
// the FileStore lists (git's tracked files), with an ID for each, and the
// text of one listed file by its ID. The index is the boundary: a file
// that is not listed has no ID and no text. A text read is `binary` (415)
// for a NUL byte in the first 8 KiB or bad UTF-8, and `tooLarge` (413)
// over `maxFileText` bytes, never a cut text. An image read takes its type
// from the extension's allowlist, and the file's first bytes must match it
// (PNG, JPEG, GIF, WebP; never SVG).
import { createHash } from 'node:crypto'
import {
  type FileRawQuery,
  FileId,
  type FileRoot,
  type FilesResponse,
  type FileTextResponse,
  maxFileText,
  maxImageBytes,
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

/** The image types an image read sends, by their first bytes; never SVG, which can run script. */
export type ImageType = 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp'

const startsWith = (bytes: Uint8Array, head: readonly number[], at = 0) => head.every((b, i) => bytes[at + i] === b)
const ascii = (text: string) => Array.from(new TextEncoder().encode(text))

/** The image type each allowed extension names; any other extension is no image. */
const typeByExtension: Readonly<Record<string, ImageType>> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
}

/** The image type the extension of `path` names, from the allowlist; undefined for any other extension. */
const extensionTypeOf = (path: string): ImageType | undefined =>
  typeByExtension[/\.([a-z]+)$/i.exec(path)?.[1]?.toLowerCase() ?? '']

/** The image type of `bytes` from their first bytes; undefined for any other type. */
export function imageTypeOf(bytes: Uint8Array): ImageType | undefined {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png'
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg'
  if (startsWith(bytes, ascii('GIF87a')) || startsWith(bytes, ascii('GIF89a'))) return 'image/gif'
  if (startsWith(bytes, ascii('RIFF')) && startsWith(bytes, ascii('WEBP'), 8)) return 'image/webp'
  return undefined
}

export type Files = {
  /** The root's index: its listed files with their IDs, at most `maxIndexFiles`; `notFound` for a chat root. */
  index(root: FileRoot): Promise<Result<FilesResponse | 'notFound', FileStoreError>>
  /** The text of the file `id` of `root`. */
  text(
    root: FileRoot,
    id: FileId,
  ): Promise<Result<FileTextResponse | 'notFound' | 'tooLarge' | 'binary', FileStoreError>>
  /**
   * The bytes and type of an image that the root's index lists, by a root and path or an absolute path in a root:
   * `notFound` as a text read, `unsupported` for any type but PNG, JPEG, GIF and WebP, and `tooLarge` over
   * `maxImageBytes`.
   */
  image(
    query: FileRawQuery,
  ): Promise<
    Result<
      { readonly bytes: Uint8Array; readonly type: ImageType } | 'notFound' | 'unsupported' | 'tooLarge',
      FileStoreError
    >
  >
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
    async image(query) {
      const at = 'root' in query ? ok({ root: query.root, path: query.path }) : await store.locate(query.path)
      if (!at.ok) return at
      if (at.value === 'notFound') return ok('notFound')
      const listed = await paths(at.value.root)
      if (!listed.ok) return listed
      if (!listed.value.slice(0, maxIndexFiles).includes(at.value.path)) return ok('notFound')
      // The type comes from the extension's allowlist, before any read, and the first bytes must be that type too.
      const type = extensionTypeOf(at.value.path)
      if (type === undefined) return ok('unsupported')
      const read = await store.read(at.value.root, at.value.path, maxImageBytes)
      if (!read.ok) return read
      if (typeof read.value === 'string') return ok(read.value)
      return ok(imageTypeOf(read.value) === type ? { bytes: read.value, type } : 'unsupported')
    },
  }
}
