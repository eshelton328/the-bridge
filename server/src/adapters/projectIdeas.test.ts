import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { linkedPaths, readIdeas, readLinks, sourceOf, summaryOf } from './projectIdeas.ts'

const id = (n: number) => `0b7f2c1e-4d3a-4f6b-9a8c-1e2d3c4b5a6${String(n)}`
const record = (front: string[], body = '# A title\n\nThe summary, marker-5150.\n\n## Open questions\n\n- One?') =>
  ['---', 'schema_version: 1', 'type: idea', ...front, '---', body].join('\n')

let dir: string
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'bridge-ideas-'))
})
afterEach(() => rm(dir, { recursive: true, force: true }))

async function projectWith(files: Record<string, string>) {
  const project = join(dir, 'example-project')
  for (const [path, text] of Object.entries(files)) {
    await mkdir(join(project, path, '..'), { recursive: true })
    await writeFile(join(project, path), text)
  }
  return project
}

describe('the idea records', () => {
  it('gives a record with no tags or state no tags and the state open, the kind idea, and its body', async () => {
    const project = await projectWith({
      'ideas/plain.md': record([`id: ${id(1)}`, 'title: A plain idea', "created: '2026-11-13T15:13:28Z'"]),
    })
    expect(await readIdeas(project)).toEqual([
      {
        idea: {
          id: id(1),
          title: 'A plain idea',
          summary: 'The summary, marker-5150.',
          tags: [],
          kind: 'idea',
          state: 'open',
          updated: '2026-11-13T15:13:28.000Z',
        },
        body: '# A title\n\nThe summary, marker-5150.\n\n## Open questions\n\n- One?',
        file: 'ideas/plain.md',
        created: '2026-11-13T15:13:28.000Z',
        source: null,
      },
    ])
  })

  it('gives no file for a record whose file name IdeaFile refuses, and still gives the record', async () => {
    const project = await projectWith({
      'ideas/an idea.md': record([`id: ${id(9)}`, 'title: A spaced idea', "created: '2026-11-13T15:13:28Z'"]),
    })
    expect((await readIdeas(project)).map((i) => [i.idea.title, i.file])).toEqual([['A spaced idea', null]])
  })

  it('reads tags, kind, state and updated, and drops an unknown kind or state to the default', async () => {
    const project = await projectWith({
      'ideas/a.md': record([
        `id: ${id(2)}`,
        "title: 'A proposal: with a colon'",
        "created: '2026-11-13T15:13:28Z'",
        "updated: '2026-11-20T09:00:00Z'",
        'kind: proposal',
        'state: in-design',
        'tags:',
        '- the-bridge',
        '- design',
      ]),
      'ideas/b.md': record([
        `id: ${id(3)}`,
        'title: B',
        "created: '2026-11-13T15:13:28Z'",
        'kind: essay',
        'state: done',
      ]),
    })
    const ideas = await readIdeas(project)
    expect(ideas.map((i) => [i.idea.title, i.idea.kind, i.idea.state, i.idea.tags, i.idea.updated])).toEqual([
      ['A proposal: with a colon', 'proposal', 'in-design', ['the-bridge', 'design'], '2026-11-20T09:00:00.000Z'],
      ['B', 'idea', 'open', [], '2026-11-13T15:13:28.000Z'],
    ])
  })

  it('skips a record that is not an idea, has no ID or title, a symlink and the index files', async () => {
    const outside = join(dir, 'outside.md')
    await writeFile(outside, record([`id: ${id(4)}`, 'title: Outside', "created: '2026-11-13T15:13:28Z'"]))
    const project = await projectWith({
      'ideas/README.md': '# ideas\n',
      'ideas/AGENTS.md': '# ideas\n',
      'ideas/note.md': record([`id: ${id(5)}`, 'title: N', "created: '2026-11-13T15:13:28Z'"]).replace(
        'type: idea',
        'type: note',
      ),
      'ideas/no-id.md': record(['title: N', "created: '2026-11-13T15:13:28Z'"]),
      'ideas/no-title.md': record([`id: ${id(6)}`, "created: '2026-11-13T15:13:28Z'"]),
    })
    await symlink(outside, join(project, 'ideas', 'link.md'))
    expect(await readIdeas(project)).toEqual([])
  })

  it('gives none for a project with no ideas folder or a linked one', async () => {
    const project = await projectWith({ 'README.md': '# x' })
    expect(await readIdeas(project)).toEqual([])
    await mkdir(join(dir, 'elsewhere'))
    await symlink(join(dir, 'elsewhere'), join(project, 'ideas'))
    expect(await readIdeas(project)).toEqual([])
  })
})

describe('summaryOf', () => {
  it('takes the first paragraph after the heading as one line', () => {
    expect(summaryOf('# T\n\nOne line\nand the next.\n\nA second paragraph.')).toBe('One line and the next.')
  })

  it('skips lists and subheadings before the paragraph, and gives an empty summary when there is none', () => {
    expect(summaryOf('# T\n\n## Sub\n\n- a list\n\nThe text.')).toBe('The text.')
    expect(summaryOf('# T\n\n- only a list')).toBe('')
  })

  it('cuts a long paragraph to the most characters', () => {
    expect(summaryOf(`# T\n\n${'a'.repeat(2_000)}`)).toHaveLength(1_000)
  })
})

describe("an idea's source kind and links", () => {
  it('gives the kind of each source the brain writes, never its text', () => {
    expect(sourceOf("marker-owner's discussion, 2026-11-23")).toBe('chat')
    expect(sourceOf("marker-owner's request through bridge-coord, 2026-11-19")).toBe('chat')
    expect(sourceOf('../captures/inbox-intake.md')).toBe('capture')
    expect(sourceOf('captures/factory.md')).toBe('capture')
    expect(sourceOf('inbox/note.md in the vault inbox; moved on 2026-11-13')).toBe('inbox')
    expect(sourceOf('a talk at a meetup')).toBe('other')
    expect(sourceOf(null)).toBe(null)
    expect(sourceOf('  ')).toBe(null)
  })

  it('takes each relative Markdown link once, in body order, and no URL, absolute path or folder above', () => {
    const body = [
      '[a](a.md) [d](../decisions/d-001-x.md#why) [a again](./a.md)',
      '[web](https://example.com/x.md) [abs](/etc/x.md) [up](../../../x.md) [png](pic.png)',
      '[f](../product/features/f-008-projects-app/README.md)',
      '[titled](b.md "The B record") [single](c.md \'C\') [angle](<d.md>)',
    ].join('\n')
    expect(linkedPaths(body)).toEqual([
      'ideas/a.md',
      'decisions/d-001-x.md',
      'product/features/f-008-projects-app/README.md',
      'ideas/b.md',
      'ideas/c.md',
      'ideas/d.md',
    ])
  })

  it('reads each linked idea, decision and feature record for its title, and leaves out any other file', async () => {
    const other = id(7)
    const project = await projectWith({
      'ideas/b.md': record([`id: ${other}`, 'title: Idea B', "created: '2026-11-13T15:13:28Z'"]),
      'ideas/no-title.md': record([`id: ${id(8)}`, "created: '2026-11-13T15:13:28Z'"]),
      'decisions/d-112-push.md': ['---', 'type: decision', 'title: Push and machine load', '---', '# d'].join('\n'),
      'decisions/d-113-wrong-type.md': ['---', 'type: idea', 'title: Not a decision', '---'].join('\n'),
      'product/features/f-008-projects-app/README.md': [
        '---',
        'id: f-008',
        'type: feature',
        'title: Projects app',
        '---',
      ].join('\n'),
      'product/features/f-003-inbox.md': ['---', 'type: feature', 'title: Attention inbox', '---'].join('\n'),
      'notes/plain.md': ['---', 'type: note', 'title: A note', '---'].join('\n'),
    })
    const body = [
      '[B](b.md) [none](no-title.md) [gone](missing.md) [d](../decisions/d-112-push.md)',
      '[bad](../decisions/d-113-wrong-type.md) [f](../product/features/f-008-projects-app/README.md)',
      '[f3](../product/features/f-003-inbox.md) [note](../notes/plain.md)',
    ].join('\n')
    expect(await readLinks(project, body)).toEqual([
      { kind: 'idea', ref: null, title: 'Idea B', idea: other },
      { kind: 'decision', ref: 'd-112', title: 'Push and machine load', idea: null },
      { kind: 'feature', ref: 'f-008', title: 'Projects app', idea: null },
      { kind: 'feature', ref: 'f-003', title: 'Attention inbox', idea: null },
    ])
  })

  it('follows no link whose real path leaves the project folder', async () => {
    const outside = await projectWith({
      'ideas/x.md': record([`id: ${id(5)}`, 'title: X', "created: '2026-11-13T15:13:28Z'"]),
    })
    const project = join(dir, 'linked-project')
    await mkdir(join(project, 'ideas'), { recursive: true })
    await symlink(join(outside, 'ideas', 'x.md'), join(project, 'ideas', 'y.md'))
    expect(await readLinks(project, '[y](y.md)')).toEqual([])
  })
})
