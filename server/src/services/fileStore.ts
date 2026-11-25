// The FileStore: git's tracked files in a root, such as the brain, for a
// message's file links. It reads only a tracked file whose real path stays
// in the root; `_local/` is not in it. Suite: adapters/fileStoreContract.ts.
import type { FileRoot } from '@bridge/contract'
import type { Result } from '@bridge/shared'

/** Why the store could not read, with its errno code or git's exit code when it has one; no message, which could name a file. */
export type FileStoreError = { readonly reason: 'failed'; readonly code: string | undefined }

export type FileStore = {
  /** The tracked files of `root`, as paths relative to it, in git's order. */
  list(root: FileRoot): Promise<Result<readonly string[], FileStoreError>>
  /** The bytes of `path` in `root`: `notFound` when untracked, no file or out of the root; `tooLarge` over `max`. */
  read(root: FileRoot, path: string, max: number): Promise<Result<Uint8Array | 'notFound' | 'tooLarge', FileStoreError>>
  /**
   * The root and root-relative path of the local absolute path `absolute`, after realpath: `notFound` when it is
   * missing or its real path is in no root. It does not say whether the root tracks the path; `read` does.
   */
  locate(
    absolute: string,
  ): Promise<Result<{ readonly root: FileRoot; readonly path: string } | 'notFound', FileStoreError>>
}
