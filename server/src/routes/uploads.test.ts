// API tests of the upload routes (slice W1b, d-113): POST
// /api/chats/:chat/uploads and /api/uploads/*, in process with the fake
// agents and the fake upload store.
import { ErrorBody, MachineId, maxUploadBytes, StartUploadResponse } from '@bridge/contract'
import { err } from '@bridge/shared'
import { describe, expect, it } from 'vitest'
import { createFakeAgents } from '../adapters/fakeAgents.ts'
import { createFakeUploads } from '../adapters/fakeUploads.ts'
import { createApp } from '../app.ts'
import { maxSmallJsonBytes } from './jsonBody.ts'
import { memoryLogger } from '../logger.ts'
import type { UploadStore } from '../services/uploadStore.ts'

const machine = MachineId.parse('test-mac')
const owner = 'owner@example.com'
const local = { Host: '127.0.0.1:5181' }
const json = { ...local, 'Content-Type': 'application/json' }
const octets = { ...local, 'Content-Type': 'application/octet-stream' }
const startPath = (chat: string) => `/api/chats/${encodeURIComponent(chat)}/uploads`
/** A file name that must never reach a log line. */
const secretName = 'MARKER-not-a-real-name.png'

function setup(store: UploadStore = createFakeUploads(4)) {
  const logger = memoryLogger()
  const app = createApp({ agents: createFakeAgents(machine), owner, log: logger.log, uploads: store })
  const start = (chat: string, body: unknown) =>
    app.request(startPath(chat), { method: 'POST', headers: json, body: JSON.stringify(body) })
  const put = (upload: string, n: number | string, body: string, headers: Record<string, string> = octets) =>
    app.request(`/api/uploads/${upload}/chunks/${String(n)}`, { method: 'PUT', headers, body })
  const complete = (upload: string) =>
    app.request(`/api/uploads/${upload}/complete`, { method: 'POST', headers: json, body: '{}' })
  const remove = (upload: string) => app.request(`/api/uploads/${upload}`, { method: 'DELETE', headers: local })
  return { app, logger, start, put, complete, remove }
}

const kindOf = async (res: Response) => ErrorBody.parse(await res.json()).error

describe('the upload routes', () => {
  it('start, take each chunk, complete and remove a file of a Claude chat', async () => {
    const store = createFakeUploads(4)
    const { start, put, complete, remove } = setup(store)
    const res = await start('test-mac/bridge-themes', { name: secretName, size: 6, type: 'image/png' })
    expect(res.status).toBe(201)
    const { upload, chunkSize } = StartUploadResponse.parse(await res.json())
    expect(chunkSize).toBe(4)
    expect((await put(upload, 1, 'ef')).status).toBe(204)
    expect((await put(upload, 0, 'abcd')).status).toBe(204)
    const done = await complete(upload)
    expect(done.status).toBe(200)
    expect(await done.json()).toEqual({ attachment: upload })
    expect(new TextDecoder().decode(store.file(upload)?.bytes)).toBe('abcdef')
    expect((await remove(upload)).status).toBe(204)
    expect((await remove(upload)).status).toBe(404)
  })

  it('answers 400 to a start, a complete, a stop or an input clear whose JSON body is over 4 KiB', async () => {
    const { app, start } = setup()
    const res = await start('test-mac/bridge-themes', { name: 'a.txt', size: 2, type: '' })
    const { upload } = StartUploadResponse.parse(await res.json())
    const padded = (body: string) => `${body}${' '.repeat(maxSmallJsonBytes)}`
    const post = (path: string, body: string) => app.request(path, { method: 'POST', headers: json, body })
    for (const [path, body] of [
      [startPath('test-mac/bridge-themes'), JSON.stringify({ name: 'a.txt', size: 2, type: '' })],
      [`/api/uploads/${upload}/complete`, '{}'],
      ['/api/chats/test-mac%2Fbridge-themes/stop', '{}'],
      ['/api/chats/test-mac%2Fbridge-themes/input/clear', '{}'],
    ] as const) {
      const big = await post(path, padded(body))
      expect([path, big.status, (await kindOf(big)).kind]).toEqual([path, 400, 'invalid-input'])
    }
  })

  it('answers a shell 409 shell, a Codex chat 409 noAttachments, an unknown chat 404 and a large file 413', async () => {
    const { start } = setup()
    const file = { name: 'a.txt', size: 1, type: '' }
    const shell = await start('test-mac/brain-git', file)
    expect(shell.status).toBe(409)
    expect(await kindOf(shell)).toMatchObject({ kind: 'chat-not-ready', state: 'shell' })
    const codex = await start('test-mac/drift-check', file)
    expect(codex.status).toBe(409)
    expect(await kindOf(codex)).toMatchObject({ kind: 'chat-not-ready', state: 'noAttachments' })
    expect((await start('test-mac/no-such-chat', file)).status).toBe(404)
    expect((await start('no-machine', file)).status).toBe(400)
    const large = await start('test-mac/bridge-themes', { ...file, size: maxUploadBytes + 1 })
    expect(large.status).toBe(413)
    expect((await kindOf(large)).kind).toBe('too-large')
  })

  it('refuses a start that is not JSON or not the contract, such as one with a path', async () => {
    const { app, start } = setup()
    const form = await app.request(startPath('test-mac/bridge-themes'), {
      method: 'POST',
      headers: { ...local, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'name=a',
    })
    expect(form.status).toBe(400)
    const extra = await start('test-mac/bridge-themes', { name: 'a', size: 1, type: '', path: '/home/dev/a' })
    expect(extra.status).toBe(400)
  })

  it('answers a wrong chunk or an early complete 409 upload-conflict, and an unknown upload 404', async () => {
    const { start, put, complete } = setup()
    const res = await start('test-mac/bridge-themes', { name: 'a.bin', size: 6, type: '' })
    const { upload } = StartUploadResponse.parse(await res.json())
    const wrong = await put(upload, 0, 'abc')
    expect(wrong.status).toBe(409)
    expect((await kindOf(wrong)).kind).toBe('upload-conflict')
    expect((await put(upload, 2, 'ab')).status).toBe(409)
    expect((await complete(upload)).status).toBe(409)
    expect((await put('AAAAAAAAAAAAAAAAAAAAAA', 0, 'abcd')).status).toBe(404)
    expect((await complete('AAAAAAAAAAAAAAAAAAAAAA')).status).toBe(404)
  })

  it('refuses a chunk that is not raw bytes, a bad chunk number or a bad upload ID with 400', async () => {
    const { start, put } = setup()
    const res = await start('test-mac/bridge-themes', { name: 'a.bin', size: 4, type: '' })
    const { upload } = StartUploadResponse.parse(await res.json())
    expect((await put(upload, 0, 'abcd', { ...local, 'Content-Type': 'text/plain' })).status).toBe(400)
    expect((await put(upload, '-1', 'abcd')).status).toBe(400)
    expect((await put(upload, '1e3', 'abcd')).status).toBe(400)
    expect((await put('not-an-id', 0, 'abcd')).status).toBe(400)
  })

  it('answers a full disk 507 storage-full and another fault 500, and logs no file name', async () => {
    const failing = (reason: 'full' | 'failed'): UploadStore => ({
      ...createFakeUploads(4),
      start: () => Promise.resolve(err({ reason, code: reason === 'full' ? 'ENOSPC' : 'EIO' })),
    })
    const full = setup(failing('full'))
    const res = await full.start('test-mac/bridge-themes', { name: secretName, size: 1, type: '' })
    expect(res.status).toBe(507)
    expect((await kindOf(res)).kind).toBe('storage-full')
    expect(full.logger.lines()).toContainEqual(expect.objectContaining({ msg: 'upload failed', code: 'ENOSPC' }))
    expect(full.logger.text()).not.toContain('MARKER')
    const other = setup(failing('failed'))
    expect((await other.start('test-mac/bridge-themes', { name: secretName, size: 1, type: '' })).status).toBe(500)
    expect(other.logger.text()).not.toContain('MARKER')
  })

  it('answers 500 when the app has no store', async () => {
    const app = createApp({ agents: createFakeAgents(machine), owner, log: memoryLogger().log })
    const res = await app.request(startPath('test-mac/bridge-themes'), {
      method: 'POST',
      headers: json,
      body: JSON.stringify({ name: 'a', size: 1, type: '' }),
    })
    expect(res.status).toBe(500)
  })
})
