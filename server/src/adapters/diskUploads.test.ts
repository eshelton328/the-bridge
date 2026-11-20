import { mkdirSync, mkdtempSync, readdirSync, statSync } from 'node:fs'
import { copyFile, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { ChatId } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import { createDiskUploads } from './diskUploads.ts'
import { sipsConvert } from './sipsConvert.ts'
import { describeUploadStore } from './uploadStoreContract.ts'

const oneChunk = async function* (value: string) {
  yield await Promise.resolve(new TextEncoder().encode(value))
}
const chat = ChatId.parse('test-mac/chat-a')
/** A converter that copies the bytes, or fails. */
const copying = (works: boolean) => async (heic: string, jpeg: string) => {
  if (!works) return false
  await copyFile(heic, jpeg)
  return true
}
const newRoot = () => join(mkdtempSync(join(tmpdir(), 'bridge-uploads-')), 'uploads')

describeUploadStore('disk', ({ now, heicConverts }) => {
  const store = createDiskUploads({ root: newRoot(), chunkSize: 4, convert: copying(heicConverts), now })
  return Promise.resolve({
    store,
    file: async (upload) => {
      const path = await store.attachment(upload, chat)
      if (!path.ok || path.value === null) return null
      return { name: basename(path.value), bytes: await readFile(path.value) }
    },
  })
})

describe('the disk upload store', () => {
  it('makes its folders 0700 and its files 0600, so only the owner reads them', async () => {
    const root = newRoot()
    const store = createDiskUploads({ root, chunkSize: 4, convert: copying(true) })
    const upload = await store.start(ChatId.parse('test-mac/chat-a'), 'a.heic', 2)
    if (!upload.ok) throw new Error(`the store failed: ${upload.error.reason}`)
    const bytes = async function* () {
      yield await Promise.resolve(new TextEncoder().encode('ab'))
    }
    await store.writeChunk(upload.value, 0, bytes())
    const mode = (path: string) => statSync(path).mode & 0o777
    /** Each folder under `dir` is 0700 and each file 0600. */
    const checkTree = (dir: string) => {
      expect(mode(dir)).toBe(0o700)
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) checkTree(join(dir, entry.name))
        else expect(mode(join(dir, entry.name))).toBe(0o600)
      }
    }
    expect(readdirSync(join(root, upload.value, 'chunks'))).toEqual(['0'])
    checkTree(root)
    await store.complete(upload.value)
    expect(readdirSync(join(root, upload.value)).sort()).toEqual(['file', 'state.json'])
    expect(readdirSync(join(root, upload.value, 'file')).sort()).toEqual(['a.heic', 'a.jpg'])
    checkTree(root)
  })

  it('reads an upload that another server process started, from its state file', async () => {
    const root = newRoot()
    const first = createDiskUploads({ root, chunkSize: 4, convert: copying(true) })
    const upload = await first.start(ChatId.parse('test-mac/chat-a'), 'a.txt', 2)
    if (!upload.ok) throw new Error(`the store failed: ${upload.error.reason}`)
    const second = createDiskUploads({ root, chunkSize: 4, convert: copying(true) })
    const bytes = async function* () {
      yield await Promise.resolve(new TextEncoder().encode('ab'))
    }
    expect(await second.writeChunk(upload.value, 0, bytes())).toEqual({ ok: true, value: 'written' })
  })

  it('completes after a complete that failed once its file folder was made', async () => {
    const root = newRoot()
    const store = createDiskUploads({ root, chunkSize: 4, convert: copying(true) })
    const upload = await store.start(ChatId.parse('test-mac/chat-a'), 'a.txt', 2)
    if (!upload.ok) throw new Error(`the store failed: ${upload.error.reason}`)
    await store.writeChunk(upload.value, 0, oneChunk('ab'))
    mkdirSync(join(root, upload.value, 'file'), { mode: 0o700 })
    expect(await store.complete(upload.value)).toEqual({ ok: true, value: 'complete' })
    expect(await readFile(join(root, upload.value, 'file', 'a.txt'), 'utf8')).toBe('ab')
  })

  it('refuses a retry that is still sending when the upload completes, and keeps the file as it was', async () => {
    const root = newRoot()
    const store = createDiskUploads({ root, chunkSize: 4, convert: copying(true) })
    const upload = await store.start(ChatId.parse('test-mac/chat-a'), 'a.txt', 4)
    if (!upload.ok) throw new Error(`the store failed: ${upload.error.reason}`)
    await store.writeChunk(upload.value, 0, oneChunk('abcd'))
    let resume: () => void = () => undefined
    const paused = new Promise<void>((resolve) => {
      resume = resolve
    })
    const slow = async function* () {
      yield await Promise.resolve(new TextEncoder().encode('wx'))
      await paused
      yield new TextEncoder().encode('yz')
    }
    const retry = store.writeChunk(upload.value, 0, slow())
    await new Promise((r) => setTimeout(r, 20))
    expect(await store.complete(upload.value)).toEqual({ ok: true, value: 'complete' })
    resume()
    expect(await retry).toEqual({ ok: true, value: 'conflict' })
    expect(await readFile(join(root, upload.value, 'file', 'a.txt'), 'utf8')).toBe('abcd')
  })

  it('takes many chunks at the same time and keeps each mark', async () => {
    const root = newRoot()
    const store = createDiskUploads({ root, chunkSize: 1, convert: copying(true) })
    const text = 'abcdefghijklmnopqrst'
    const upload = await store.start(ChatId.parse('test-mac/chat-a'), 'a.txt', text.length)
    if (!upload.ok) throw new Error(`the store failed: ${upload.error.reason}`)
    const written = await Promise.all(
      Array.from({ length: text.length }, (_, n) => store.writeChunk(upload.value, n, oneChunk(text.slice(n, n + 1)))),
    )
    expect(written.every((w) => w.ok && w.value === 'written')).toBe(true)
    expect(await store.complete(upload.value)).toEqual({ ok: true, value: 'complete' })
    expect(await readFile(join(root, upload.value, 'file', 'a.txt'), 'utf8')).toBe(text)
  })

  it('completes a HEIC photo after a failed conversion when the next one works', async () => {
    const root = newRoot()
    const failing = createDiskUploads({ root, chunkSize: 4, convert: copying(false) })
    const upload = await failing.start(chat, 'a.heic', 2)
    if (!upload.ok) throw new Error(`the store failed: ${upload.error.reason}`)
    await failing.writeChunk(upload.value, 0, oneChunk('ab'))
    expect(await failing.complete(upload.value)).toEqual({ ok: true, value: 'unsupported' })
    const working = createDiskUploads({ root, chunkSize: 4, convert: copying(true) })
    expect(await working.complete(upload.value)).toEqual({ ok: true, value: 'complete' })
    expect(readdirSync(join(root, upload.value, 'file')).sort()).toEqual(['a.heic', 'a.jpg'])
  })
})

// sips is a macOS tool; CI runs on Linux, where this case does not run.
describe.runIf(process.platform === 'darwin')('sipsConvert', () => {
  it('converts an image to a JPEG, and gives false for a file that is not an image', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'bridge-sips-'))
    // A 1 × 1 PNG.
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
      'base64',
    )
    await writeFile(join(dir, 'a.png'), png)
    expect(await sipsConvert(join(dir, 'a.png'), join(dir, 'a.jpg'))).toBe(true)
    expect((await readFile(join(dir, 'a.jpg'))).subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8]))
    await writeFile(join(dir, 'b.heic'), 'not an image')
    expect(await sipsConvert(join(dir, 'b.heic'), join(dir, 'b.jpg'))).toBe(false)
  })
})
