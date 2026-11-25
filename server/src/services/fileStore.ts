// The FileStore: the files that git tracks in a root, such as the brain,
// for the file links of a chat message. A path is relative to its root.
// The store reads only a tracked file whose real path stays in the root,
// so an ignored file (such as `.env`) and a symlink out of the root are not
// there; the brain's `_local/` is not in it either. Its contract suite is
// adapters/fileStoreContract.ts.
import type { FileRoot } from '@bridge/contract'
import type { Result } from '@bridge/shared'

/** Why the store could not read, with its errno code or git's exit code when it has one; no message, which could name a file. */
export type FileStoreError = { readonly reason: 'failed'; readonly code: string | undefined }

export type FileStore = {
  /** The tracked files of `root`, as paths relative to it, in git's order. */
  list(root: FileRoot): Promise<Result<readonly string[], FileStoreError>>
  /**
   * The bytes of the tracked file `path` of `root`: `notFound` when the root does not track it, it is not a file, or
   * its real path leaves the root; `tooLarge` when it has more than `max` bytes.
   */
  read(root: FileRoot, path: string, max: number): Promise<Result<Uint8Array | 'notFound' | 'tooLarge', FileStoreError>>
}
