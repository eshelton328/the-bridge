import { mkdir, mkdtemp, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { InboxId } from '@bridge/contract'
import { err, ok } from '@bridge/shared'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { InboxMarks } from '../services/inbox.ts'
import { createBrainRequests, createDiskInboxMarks, splitRecord } from './diskInbox.ts'

const record = (front: string, body = '# A request\n\n## Requested input\n\nmarker-5150') =>
  `---\nschema_version: 1\ntype: attention-request\n${front}\n---\n${body}\n`
const open = record(
  [
    "title: 'Example: a request'",
    "created: '2026-11-21T10:50:00Z'",
    'kind: question',
    'status: open',
    'tags:',
    '- global/human-input',
    '- project/example-project/web',
    'sources: []',
    'snoozed_until: null',
  ].join('\n'),
)

let dir: string
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'bridge-inbox-'))
})
afterEach(() => rm(dir, { recursive: true, force: true }))

async function brainWith(files: Record<string, string>) {
  const brain = join(dir, 'brain')
  for (const [path, text] of Object.entries(files)) {
    await mkdir(join(brain, path, '..'), { recursive: true })
    await writeFile(join(brain, path), text)
  }
  return createBrainRequests(brain)
}

describe('the brain requests', () => {
  it('reads an open request from its front matter, with the project from its folder', async () => {
    const brain = await brainWith({ 'projects/example-project/inbox/a.md': open })
    const listed = await brain.list()
    expect(listed.ok && listed.value.map((r) => r.id)).toEqual([expect.stringMatching(/^[0-9a-f]{16}$/)])
    expect(listed.ok && listed.value.map((r) => ({ ...r, id: 'hashed' }))).toEqual([
      {
        id: 'hashed',
        kind: 'question',
        title: 'Example: a request',
        project: 'example-project',
        tags: ['global/human-input', 'project/example-project/web'],
        created: '2026-11-21T10:50:00.000Z',
        snoozedUntil: null,
      },
    ])
  })

  it('gives the body after the front matter by ID, and null for an ID it does not have', async () => {
    const brain = await brainWith({ 'projects/example-project/inbox/a.md': open })
    const listed = await brain.list()
    const id = listed.ok ? listed.value[0]?.id : undefined
    if (id === undefined) throw new Error('no request')
    expect(await brain.body(id)).toEqual(ok('# A request\n\n## Requested input\n\nmarker-5150'))
    expect(await brain.body(InboxId.parse('0000000000000000'))).toEqual(ok(null))
  })

  it('lists only open and snoozed attention requests', async () => {
    const brain = await brainWith({
      'projects/p/inbox/resolved.md': open.replace('status: open', 'status: resolved'),
      'projects/p/inbox/snoozed.md': open
        .replace('status: open', 'status: snoozed')
        .replace('snoozed_until: null', "snoozed_until: '2026-11-22T09:00:00Z'"),
      'projects/p/inbox/note.md': open.replace('type: attention-request', 'type: note'),
      'projects/p/inbox/AGENTS.md': '# inbox\n',
      'projects/p/inbox/no-title.md': open.replace("title: 'Example: a request'", 'title:'),
    })
    const listed = await brain.list()
    expect(listed.ok && listed.value.map((r) => r.snoozedUntil)).toEqual(['2026-11-22T09:00:00.000Z'])
  })

  it('skips a symlink, a linked inbox folder and a file outside a project inbox', async () => {
    const outside = join(dir, 'outside')
    await mkdir(join(outside, 'inbox'), { recursive: true })
    await writeFile(join(outside, 'a.md'), open)
    await writeFile(join(outside, 'inbox', 'a.md'), open)
    const brain = await brainWith({ 'projects/p/notes/a.md': open, 'projects/q/README.md': 'x' })
    await mkdir(join(dir, 'brain', 'projects', 'p', 'inbox'), { recursive: true })
    await symlink(join(outside, 'a.md'), join(dir, 'brain', 'projects', 'p', 'inbox', 'link.md'))
    await symlink(join(outside, 'inbox'), join(dir, 'brain', 'projects', 'q', 'inbox'))
    expect(await brain.list()).toEqual(ok([]))
  })

  it('gives no project for a folder name the contract does not take, and maps an unknown kind to action', async () => {
    const brain = await brainWith({ 'projects/Odd Name/inbox/a.md': open.replace('kind: question', 'kind: decision') })
    const listed = await brain.list()
    expect(listed.ok && listed.value.map((r) => [r.project, r.kind])).toEqual([[null, 'action']])
  })

  it('reads an empty list when the brain has no projects folder', async () => {
    expect(await createBrainRequests(join(dir, 'none')).list()).toEqual(ok([]))
  })
})

describe('splitRecord', () => {
  it('reads quoted values and gives null for text with no front matter', () => {
    expect(splitRecord('---\ntitle: \'It\'\'s here\'\nnote: "a \\"b\\""\n---\nbody')).toEqual({
      front: { title: "It's here", note: 'a "b"' },
      body: 'body',
    })
    expect(splitRecord('# no front matter')).toBeNull()
    expect(splitRecord('---\ntitle: x\n')).toBeNull()
  })
})

describe('the inbox marks', () => {
  const id = '0123456789abcdef'

  it('reads no marks before the first save, then the saved marks, from a 0600 file in a 0700 folder', async () => {
    const root = join(dir, 'store')
    const marks = createDiskInboxMarks(root)
    expect(await marks.load()).toEqual(ok({}))
    const saved: InboxMarks = { [id]: { state: 'snoozed', until: '2026-11-22T09:00:00.000Z' } }
    expect(await marks.save(saved)).toEqual(ok(undefined))
    expect(await marks.load()).toEqual(ok(saved))
    expect((await stat(join(root, 'inbox.json'))).mode & 0o777).toBe(0o600)
    expect((await stat(root)).mode & 0o777).toBe(0o700)
  })

  it('gives EBADDATA for a file it cannot read, and keeps the file', async () => {
    const root = join(dir, 'store')
    await mkdir(root)
    await writeFile(join(root, 'inbox.json'), '{"x": {"state": "gone"}}')
    expect(await createDiskInboxMarks(root).load()).toEqual(err({ reason: 'failed', code: 'EBADDATA' }))
    await writeFile(join(root, 'inbox.json'), '{not json')
    expect(await createDiskInboxMarks(root).load()).toEqual(err({ reason: 'failed', code: 'EBADDATA' }))
    expect(await readFile(join(root, 'inbox.json'), 'utf8')).toBe('{not json')
  })
})
