// The upload store on disk (slice W1b). Each upload is a folder under
// `root`: `state.json` (the chat, the safe name, the size and the chunks
// that came), `chunks/<n>` (one file for each chunk) and, once complete,
// `file/<safe name>` (and for a HEIC photo its JPEG copy beside it, made
// by `convert`). Each start first removes the uploads past their time. A chunk goes to a temporary file first, and takes
// its place only when its length is right, so a short retry never changes
// a chunk that came. The state file is replaced in one rename, so a read
// never sees half of it. Complete joins the chunks in order, in turn with
// the chunks' renames. The folders are 0700 and the files 0600, so only
// the owner's account reads them. The store never runs a file and reads
// its bytes only to join the chunks. A fault gives only its errno code,
// as its message can hold a path with the file name.
import { randomBytes } from 'node:crypto'
import { chmod, type FileHandle, mkdir, open, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ChatId, type UploadId, UploadId as UploadIdSchema } from '@bridge/contract'
import { err, ok, type Result } from '@bridge/shared'
import { z } from 'zod'
import {
  chunkCount,
  chunkLength,
  defaultChunkBytes,
  expired,
  isHeic,
  jpegName,
  safeFileName,
  type UploadStore,
  type UploadStoreError,
} from '../services/uploadStore.ts'

const State = z.object({
  chat: ChatId,
  name: z.string(),
  size: z.number().int().min(1),
  received: z.array(z.number().int()),
  startedAt: z.number(),
  /** When it became complete; null before that. */
  completedAt: z.number().nullable(),
  /** The name of the file the chat reads: the safe name, or its JPEG copy's. */
  file: z.string().nullable(),
})
type State = z.infer<typeof State>

/** The state that the store wrote before it kept times (#303): `complete`, and no start or complete time. */
const LegacyState = z.object({
  chat: ChatId,
  name: z.string(),
  size: z.number().int().min(1),
  received: z.array(z.number().int()),
  complete: z.boolean(),
})

export type DiskUploadsOptions = {
  /** The folder of all uploads, such as ~/.local/share/the-bridge/uploads; made 0700 when missing. */
  readonly root: string
  readonly chunkSize?: number
  /** Makes the JPEG copy of a HEIC photo at `jpeg`; false when it cannot. main.ts gives `sipsConvert`. */
  readonly convert: (heic: string, jpeg: string) => Promise<boolean>
  readonly now?: () => number
}

const errnoCode = (error: unknown): string | undefined => {
  const code: unknown = error instanceof Error ? Object.getOwnPropertyDescriptor(error, 'code')?.value : undefined
  return typeof code === 'string' ? code : undefined
}

/** A fault as the port gives it: `full` when the disk has no space. */
const faultOf = (error: unknown): UploadStoreError => ({
  reason: errnoCode(error) === 'ENOSPC' ? 'full' : 'failed',
  code: errnoCode(error),
})

/** Writes all of `bytes` at the file's end; a write can take fewer bytes than it gets. */
async function writeAll(file: FileHandle, bytes: Uint8Array): Promise<void> {
  for (let done = 0; done < bytes.length; ) {
    const { bytesWritten } = await file.write(bytes, done, bytes.length - done)
    done += bytesWritten
  }
}

/** A name for a temporary file that no other request uses. */
const tempName = (base: string) => `${base}.${randomBytes(6).toString('hex')}.part`

/** Runs `work`, and gives a fault for anything it throws. */
async function guarded<T>(work: () => Promise<T>): Promise<Result<T, UploadStoreError>> {
  try {
    return ok(await work())
  } catch (error) {
    return err(faultOf(error))
  }
}

export function createDiskUploads({
  root,
  chunkSize = defaultChunkBytes,
  convert,
  now = Date.now,
}: DiskUploadsOptions): UploadStore {
  const folder = (upload: UploadId) => join(root, upload)
  const statePath = (upload: UploadId) => join(folder(upload), 'state.json')
  const chunksPath = (upload: UploadId) => join(folder(upload), 'chunks')
  const chunkPath = (upload: UploadId, n: number) => join(chunksPath(upload), String(n))
  /** Each upload's state change waits for the one before it, so two chunks never lose each other's mark. */
  const queues = new Map<UploadId, Promise<unknown>>()
  const inTurn = <T>(upload: UploadId, work: () => Promise<T>): Promise<T> => {
    const run = (queues.get(upload) ?? Promise.resolve()).then(work, work)
    queues.set(
      upload,
      run.then(
        () => undefined,
        () => undefined,
      ),
    )
    return run
  }
  /** The upload's state; null when it has none. */
  const readState = async (upload: UploadId): Promise<State | null> => {
    const text = await readFile(statePath(upload), 'utf8').catch((error: unknown) => {
      if (errnoCode(error) === 'ENOENT') return null
      throw error
    })
    if (text === null) return null
    const json: unknown = JSON.parse(text)
    const state = State.safeParse(json)
    if (state.success) return state.data
    // An upload of the earlier store: its state file's time stands for its start and its complete.
    const legacy = LegacyState.safeParse(json)
    if (!legacy.success) return null
    const { complete, ...rest } = legacy.data
    const { mtimeMs } = await stat(statePath(upload))
    return { ...rest, startedAt: mtimeMs, completedAt: complete ? mtimeMs : null, file: complete ? rest.name : null }
  }
  /** Replaces the state file in one rename, so a read sees the old state or the new one, never part of one. */
  const writeState = async (upload: UploadId, state: State) => {
    const temp = tempName(statePath(upload))
    await writeFile(temp, JSON.stringify(state), { mode: 0o600 })
    await rename(temp, statePath(upload))
  }
  /** Removes each upload past its time; a folder whose state it cannot read stays. */
  const sweep = async () => {
    const entries = await readdir(root, { withFileTypes: true })
    for (const entry of entries) {
      const id = UploadIdSchema.safeParse(entry.name)
      if (!entry.isDirectory() || !id.success) continue
      const state = await readState(id.data).catch(() => null)
      if (state === null || !expired(state.startedAt, state.completedAt, now())) continue
      // Read again in the upload's turn: a complete just before it may have made the upload new again.
      await inTurn(id.data, async () => {
        const current = await readState(id.data).catch(() => null)
        if (current !== null && expired(current.startedAt, current.completedAt, now()))
          await rm(folder(id.data), { recursive: true, force: true })
      })
    }
  }
  /** Writes chunk `n` to a temporary file: its path, or null when its length is not `length` (the file is gone then). */
  const receive = async (
    upload: UploadId,
    n: number,
    length: number,
    bytes: AsyncIterable<Uint8Array>,
  ): Promise<string | null> => {
    const temp = tempName(chunkPath(upload, n))
    const file = await open(temp, 'wx', 0o600)
    let read = 0
    let fits = true
    try {
      for await (const piece of bytes) {
        if (read + piece.length > length) {
          fits = false
          break
        }
        await writeAll(file, piece)
        read += piece.length
      }
    } catch (error) {
      await file.close()
      await rm(temp, { force: true })
      throw error
    }
    await file.close()
    if (fits && read === length) return temp
    await rm(temp, { force: true })
    return null
  }

  return {
    chunkSize,
    start: (chat, name, size) =>
      guarded(async () => {
        await mkdir(root, { recursive: true, mode: 0o700 })
        await chmod(root, 0o700)
        await sweep()
        const upload = UploadIdSchema.parse(randomBytes(16).toString('base64url'))
        await mkdir(folder(upload), { mode: 0o700 })
        await mkdir(chunksPath(upload), { mode: 0o700 })
        await writeState(upload, {
          chat,
          name: safeFileName(name),
          size,
          received: [],
          startedAt: now(),
          completedAt: null,
          file: null,
        })
        return upload
      }),
    writeChunk: (upload, n, bytes) =>
      guarded(async () => {
        const state = await readState(upload)
        if (state === null) return 'notFound' as const
        const length = chunkLength(state.size, chunkSize, n)
        if (state.completedAt !== null || length === null) return 'conflict' as const
        const temp = await receive(upload, n, length, bytes)
        if (temp === null) return 'conflict' as const
        return inTurn(upload, async () => {
          const current = await readState(upload)
          if (current?.completedAt !== null) {
            await rm(temp, { force: true })
            return current === null ? ('notFound' as const) : ('conflict' as const)
          }
          await rename(temp, chunkPath(upload, n))
          if (!current.received.includes(n))
            await writeState(upload, { ...current, received: [...current.received, n] })
          return 'written' as const
        })
      }),
    complete: (upload) =>
      guarded(() =>
        inTurn(upload, async () => {
          const state = await readState(upload)
          if (state === null) return 'notFound' as const
          if (state.completedAt !== null) return 'complete' as const
          if (state.received.length !== chunkCount(state.size, chunkSize)) return 'conflict' as const
          const files = join(folder(upload), 'file')
          // Recursive, so a complete that failed after it made the folder can run again.
          await mkdir(files, { recursive: true, mode: 0o700 })
          const temp = tempName(join(files, state.name))
          const out = await open(temp, 'w', 0o600)
          try {
            for (let n = 0; n < chunkCount(state.size, chunkSize); n++)
              await writeAll(out, await readFile(chunkPath(upload, n)))
          } catch (error) {
            await out.close()
            await rm(temp, { force: true })
            throw error
          }
          await out.close()
          await rename(temp, join(files, state.name))
          let file = state.name
          if (isHeic(state.name)) {
            // A photo that does not convert keeps its chunks, so a later complete can try again.
            file = jpegName(state.name)
            if (!(await convert(join(files, state.name), join(files, file)))) return 'unsupported' as const
            await chmod(join(files, file), 0o600)
          }
          await writeState(upload, { ...state, completedAt: now(), file })
          await rm(chunksPath(upload), { recursive: true, force: true })
          return 'complete' as const
        }),
      ),
    remove: (upload) =>
      guarded(() =>
        inTurn(upload, async () => {
          if ((await readState(upload)) === null) return 'notFound' as const
          await rm(folder(upload), { recursive: true, force: true })
          return 'removed' as const
        }),
      ),
    attachment: (upload, chat) =>
      guarded(async () => {
        const state = await readState(upload)
        if (typeof state?.file !== 'string' || state.completedAt === null || state.chat !== chat) return null
        return join(folder(upload), 'file', state.file)
      }),
  }
}
