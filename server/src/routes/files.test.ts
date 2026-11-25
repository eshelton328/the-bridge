// API tests of /api/files, in process with the fake agents and a fake brain
// of made-up files.
import { ErrorBody, FilesResponse, FileTextResponse, MachineId, maxFileText } from '@bridge/contract'
import { err } from '@bridge/shared'
import { describe, expect, it } from 'vitest'
import { createFakeAgents } from '../adapters/fakeAgents.ts'
import { createFakeFiles } from '../adapters/fakeFiles.ts'
import { createApp } from '../app.ts'
import { memoryLogger } from '../logger.ts'
import { createFiles, fileIdOf } from '../services/files.ts'

const local = { Host: '127.0.0.1:5181' }
const tracked = {
  'toolkit/rules/writing.md': 'Twelve marker-5150 patterns.\n',
  'notes/binary.bin': 'a\0b',
  'notes/big.md': 'x'.repeat(maxFileText + 1),
}

function setup(store = createFakeFiles({ tracked, unreadable: ['notes/outside.md'] })) {
  const logger = memoryLogger()
  const app = createApp({
    agents: createFakeAgents(MachineId.parse('test-mac')),
    owner: 'owner@example.com',
    log: logger.log,
    files: createFiles(store),
  })
  const get = (path: string, headers: Record<string, string> = local) => app.request(path, { headers })
  return { get, logger }
}

const textOf = (path: string) => `/api/files/${fileIdOf('brain', path)}/text?root=brain`

describe('/api/files', () => {
  it("lists the brain's index with an ID for each file", async () => {
    const res = await setup().get('/api/files?root=brain')
    expect(res.status).toBe(200)
    const body = FilesResponse.parse(await res.json())
    expect(body.cut).toBe(false)
    expect(body.files).toContainEqual({
      id: fileIdOf('brain', 'toolkit/rules/writing.md'),
      path: 'toolkit/rules/writing.md',
    })
  })

  it('reads a text file by its ID', async () => {
    const res = await setup().get(textOf('toolkit/rules/writing.md'))
    expect(res.status).toBe(200)
    expect(FileTextResponse.parse(await res.json()).text).toBe('Twelve marker-5150 patterns.\n')
  })

  it('gives the same 404 for an unknown ID, a file it cannot read and a bad ID', async () => {
    const { get } = setup()
    const bodies: unknown[] = []
    for (const path of [textOf('notes/gone.md'), textOf('notes/outside.md'), '/api/files/not-an-id/text?root=brain']) {
      const res = await get(path)
      expect(res.status).toBe(404)
      // The request ID and the request's own path differ; the rest says nothing of which case it was.
      const { error } = ErrorBody.parse(await res.json())
      bodies.push({ ...error, requestId: '', ...('path' in error ? { path: '' } : {}) })
    }
    expect(bodies).toEqual([bodies[0], bodies[0], bodies[0]])
    // An encoded ".." reaches no route at all.
    expect((await get('/api/files/%2e%2e/text?root=brain')).status).toBe(404)
  })

  it('answers 415 for a binary file and 413 for a file over the cap', async () => {
    const { get } = setup()
    expect((await get(textOf('notes/binary.bin'))).status).toBe(415)
    expect((await get(textOf('notes/big.md'))).status).toBe(413)
  })

  it('answers 400 for a root it does not know', async () => {
    expect((await setup().get('/api/files?root=..')).status).toBe(400)
  })

  it('refuses a request from another Tailscale login on each route', async () => {
    const other = {
      Host: 'mac.tailnet.example',
      'X-Forwarded-For': '203.0.113.2',
      'Tailscale-User-Login': 'someone@example.com',
    }
    const { get } = setup()
    for (const path of ['/api/files?root=brain', textOf('toolkit/rules/writing.md')])
      expect((await get(path, other)).status).toBe(403)
  })

  it('logs a fault with its root and code, never a path or text', async () => {
    const failing = {
      list: () => Promise.resolve(err({ reason: 'failed' as const, code: 'EACCES' })),
      read: () => Promise.resolve(err({ reason: 'failed' as const, code: 'EACCES' })),
    }
    const { get, logger } = setup(failing)
    expect((await get(textOf('toolkit/rules/writing.md'))).status).toBe(500)
    const line = JSON.stringify(logger.lines())
    expect(line).toContain('files read failed')
    expect(line).toContain('EACCES')
    expect(line).not.toContain('writing.md')
  })
})
