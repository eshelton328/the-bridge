import { describe, expect, it } from 'vitest'
import {
  DriftRun,
  Idea,
  IdeaDetailResponse,
  IdeaFile,
  IdeaLink,
  IdeaStateRequest,
  maxIdeaLinks,
  MakeFeatureRequest,
  MakeFeatureResponse,
  maxProjectTitle,
  PinProjectRequest,
  ProjectDetailsRequest,
  ProjectDetailResponse,
  ProjectSlug,
  ProjectSummary,
  RepositoryDriftRun,
  RepositoryPath,
  RunDriftRequest,
  SlugResponse,
  RepositoryCiResponse,
} from './projects.ts'

const card = { slug: 'example-project', name: 'Example', purpose: 'marker-5150', icon: null, pinned: false }
const idea = {
  id: '0b7f2c1e-4d3a-4f6b-9a8c-1e2d3c4b5a69',
  title: 'An example idea',
  summary: 'One line.',
  tags: [],
  kind: 'idea',
  state: 'open',
  updated: '2026-11-21T10:00:00.000Z',
}

describe('the projects contract', () => {
  it('names a project by its folder name only, never a path', () => {
    expect(ProjectSlug.safeParse('example-project').success).toBe(true)
    expect(ProjectSlug.safeParse('/home/dev/projects/example-project').success).toBe(false)
    expect(ProjectSlug.safeParse('../example').success).toBe(false)
  })

  it('takes a card and refuses a card with an extra field, such as a path', () => {
    expect(ProjectSummary.safeParse(card).success).toBe(true)
    expect(ProjectSummary.safeParse({ ...card, folder: '/home/dev/projects/example-project' }).success).toBe(false)
  })

  it('takes a repository with a GitHub name or none, and a PR link on github.com only', () => {
    const detail = {
      project: card,
      repositories: [
        { id: 'example-repo', role: 'the app', github: { owner: 'example-owner', name: 'example-repo' } },
        { id: 'local-repo', role: 'a local folder', github: null },
      ],
      queue: {
        inProgress: [
          {
            repository: 'example-repo',
            number: 12,
            title: 'feat: an example',
            url: 'https://github.com/example-owner/example-repo/pull/12',
            branch: 'dev/ncc-1-example',
            status: 'inReview',
            updatedAt: '2026-11-21T10:00:00.000Z',
          },
        ],
        unread: ['local-repo'],
      },
    }
    expect(ProjectDetailResponse.safeParse(detail).success).toBe(true)
    const pull = detail.queue.inProgress[0]
    const elsewhere = { ...pull, url: 'https://example.com/pull/12' }
    expect(
      ProjectDetailResponse.safeParse({ ...detail, queue: { ...detail.queue, inProgress: [elsewhere] } }).success,
    ).toBe(false)
  })

  it('takes an idea with no tags and the state open, and refuses an unknown state', () => {
    expect(Idea.safeParse(idea).success).toBe(true)
    expect(Idea.safeParse({ ...idea, state: 'shipped' }).success).toBe(false)
  })

  it('lists findings only for a run with findings', () => {
    const at = '2026-11-21T10:00:00.000Z'
    expect(DriftRun.safeParse({ result: 'clean', checkedAt: at, findings: [] }).success).toBe(true)
    expect(DriftRun.safeParse({ result: 'findings', checkedAt: at, findings: [{ text: 'x' }] }).success).toBe(true)
    expect(DriftRun.safeParse({ result: 'findings', checkedAt: at, findings: [] }).success).toBe(false)
    expect(DriftRun.safeParse({ result: 'clean', checkedAt: at, findings: [{ text: 'x' }] }).success).toBe(false)
  })

  it('takes strict request bodies only', () => {
    expect(PinProjectRequest.safeParse({ pinned: true }).success).toBe(true)
    expect(PinProjectRequest.safeParse({ pinned: true, slug: 'x' }).success).toBe(false)
    expect(RunDriftRequest.safeParse({}).success).toBe(true)
    expect(RunDriftRequest.safeParse({ command: 'rm' }).success).toBe(false)
  })

  it('keeps a repository drift finding to a kind the check prints and a path from the repository root', () => {
    const run = (path: string, kind = 'over-budget') => ({
      result: 'findings',
      checkedAt: '2026-11-27T10:00:00.000Z',
      commit: 'a'.repeat(40),
      findings: [{ kind, path, detail: '(165 > 60 lines)' }],
      total: 1,
    })
    expect(RepositoryDriftRun.safeParse(run('contract/src/AGENTS.md')).success).toBe(true)
    expect(RepositoryDriftRun.safeParse(run('.', 'missing')).success).toBe(true)
    expect(RepositoryPath.safeParse('.').success).toBe(false)
    expect(RepositoryPath.safeParse('web/src').success).toBe(true)
    for (const path of [
      '/etc/AGENTS.md',
      '../AGENTS.md',
      'a/./AGENTS.md',
      'a//AGENTS.md',
      'a\x1b[31m/AGENTS.md',
      'a\x7f',
      'a\\b',
    ])
      expect(RepositoryDriftRun.safeParse(run(path)).success).toBe(false)
    expect(RepositoryDriftRun.safeParse(run('AGENTS.md', 'other')).success).toBe(false)
    expect(
      RepositoryDriftRun.safeParse({
        result: 'clean',
        checkedAt: '2026-11-27T10:00:00.000Z',
        commit: null,
        findings: [],
        total: 0,
      }).success,
    ).toBe(true)
    expect(RepositoryDriftRun.safeParse({ ...run('AGENTS.md'), result: 'clean' }).success).toBe(false)
    expect(RepositoryDriftRun.safeParse({ ...run('AGENTS.md'), total: 0 }).success).toBe(false)
    const many = Array.from({ length: 200 }, (_, i) => ({ kind: 'missing', path: `p${String(i)}`, detail: null }))
    expect(RepositoryDriftRun.safeParse({ ...run('AGENTS.md'), findings: many, total: 250 }).success).toBe(true)
    expect(RepositoryDriftRun.safeParse({ ...run('AGENTS.md'), findings: many.slice(1), total: 250 }).success).toBe(
      false,
    )
  })
})

describe('the increment four contract', () => {
  const details = { name: 'After dark', purpose: 'A party game.', icon: 'rocket' }

  it('takes a one-line name and purpose with an icon or none, and refuses line breaks and control characters', () => {
    expect(ProjectDetailsRequest.safeParse(details).success).toBe(true)
    expect(ProjectDetailsRequest.safeParse({ ...details, purpose: '', icon: null }).success).toBe(true)
    expect(ProjectDetailsRequest.safeParse({ ...details, name: '' }).success).toBe(false)
    expect(ProjectDetailsRequest.safeParse({ ...details, name: 'two\nlines' }).success).toBe(false)
    expect(ProjectDetailsRequest.safeParse({ ...details, purpose: 'bell\u{7}' }).success).toBe(false)
    expect(ProjectDetailsRequest.safeParse({ ...details, purpose: 'a\u{2028}b' }).success).toBe(false)
    expect(ProjectDetailsRequest.safeParse({ ...details, name: 'x'.repeat(maxProjectTitle + 1) }).success).toBe(false)
    expect(ProjectDetailsRequest.safeParse({ ...details, slug: 'after-dark' }).success).toBe(false)
  })

  it('gives a slug or none for a name', () => {
    expect(SlugResponse.safeParse({ slug: 'after-dark', free: true }).success).toBe(true)
    expect(SlugResponse.safeParse({ slug: null, free: false }).success).toBe(true)
    expect(SlugResponse.safeParse({ slug: '../x', free: true }).success).toBe(false)
  })

  it('takes Park and Reopen only, and a feature ID of the f-NNN form', () => {
    expect(IdeaStateRequest.safeParse({ state: 'parked' }).success).toBe(true)
    expect(IdeaStateRequest.safeParse({ state: 'open' }).success).toBe(true)
    expect(IdeaStateRequest.safeParse({ state: 'decided' }).success).toBe(false)
    expect(MakeFeatureResponse.safeParse({ feature: 'f-009', idea: { ...idea, state: 'in-design' } }).success).toBe(
      true,
    )
    expect(MakeFeatureResponse.safeParse({ feature: 'f-9', idea }).success).toBe(false)
  })

  it('takes strict empty bodies only', () => {
    expect(MakeFeatureRequest.safeParse({}).success).toBe(true)
    expect(MakeFeatureRequest.safeParse({ path: 'x' }).success).toBe(false)
  })
})

describe('IdeaFile', () => {
  it('takes one plain .md name in ideas/ and refuses any other path', () => {
    expect(IdeaFile.safeParse('ideas/speech-to-text.md').success).toBe(true)
    for (const bad of [
      'ideas/../secret.md',
      '../ideas/a.md',
      '/ideas/a.md',
      'ideas/sub/a.md',
      'ideas/a.txt',
      'ideas/a',
      'a.md',
    ])
      expect(IdeaFile.safeParse(bad).success, bad).toBe(false)
  })
})

describe('RepositoryCiResponse', () => {
  const ci = {
    since: '2026-10-23T09:00:00.000Z',
    runs: { green: 1, finished: 2 },
    runMinutes: 4,
    merge: { count: 1, medianHours: 2, p90Hours: 2 },
    jobs: [],
    jobRuns: 0,
  }

  it('takes ci null with reading false (not read) and with reading true (the first read runs)', () => {
    expect(RepositoryCiResponse.safeParse({ ci: null, readAt: null, reading: false }).success).toBe(true)
    expect(RepositoryCiResponse.safeParse({ ci: null, readAt: null, reading: true }).success).toBe(true)
  })

  it('takes numbers with their read time, with reading true while a refresh runs', () => {
    expect(RepositoryCiResponse.safeParse({ ci, readAt: '2026-11-22T09:00:00.000Z', reading: false }).success).toBe(
      true,
    )
    expect(RepositoryCiResponse.safeParse({ ci, readAt: '2026-11-22T09:00:00.000Z', reading: true }).success).toBe(true)
  })

  it('refuses a read time with no numbers, numbers with no read time, and a missing reading', () => {
    expect(
      RepositoryCiResponse.safeParse({ ci: null, readAt: '2026-11-22T09:00:00.000Z', reading: false }).success,
    ).toBe(false)
    expect(RepositoryCiResponse.safeParse({ ci, readAt: null, reading: false }).success).toBe(false)
    expect(RepositoryCiResponse.safeParse({ ci: null, readAt: null }).success).toBe(false)
  })
})

describe("an idea's detail", () => {
  const detail = { idea, body: '# An example idea', file: 'ideas/an-idea.md', created: null, source: null, links: [] }
  const ideaLink = { kind: 'idea', ref: null, title: 'Another idea', idea: '5d0c9e2a-7b61-4c3f-9e8d-2a1b3c4d5e6f' }
  const decision = { kind: 'decision', ref: 'd-112', title: 'Push and machine load', idea: null }

  it('takes its created time, its source kind and its links, and needs each key', () => {
    expect(IdeaDetailResponse.safeParse(detail).success).toBe(true)
    const full = { ...detail, created: '2026-11-23T09:00:00.000Z', source: 'chat', links: [ideaLink, decision] }
    expect(IdeaDetailResponse.safeParse(full).success).toBe(true)
    for (const key of ['created', 'source', 'links'] as const) {
      const missing = Object.fromEntries(Object.entries(full).filter(([k]) => k !== key))
      expect(IdeaDetailResponse.safeParse(missing).success, key).toBe(false)
    }
    expect(IdeaDetailResponse.safeParse({ ...full, source: "marker-owner's discussion" }).success).toBe(false)
    const many = Array.from({ length: maxIdeaLinks + 1 }, () => decision)
    expect(IdeaDetailResponse.safeParse({ ...full, links: many }).success).toBe(false)
  })

  it('gives an idea link its idea ID only, and a decision or feature link its own ref only', () => {
    expect(IdeaLink.safeParse(ideaLink).success).toBe(true)
    expect(IdeaLink.safeParse(decision).success).toBe(true)
    expect(IdeaLink.safeParse({ kind: 'feature', ref: 'f-008', title: 'Projects app', idea: null }).success).toBe(true)
    for (const bad of [
      { ...ideaLink, idea: null },
      { ...ideaLink, ref: 'd-112' },
      { ...decision, ref: null },
      { ...decision, ref: 'f-008' },
      { ...decision, idea: ideaLink.idea },
      { ...decision, ref: 'd-12' },
      { ...decision, title: '' },
      { ...decision, path: 'decisions/d-112.md' },
    ])
      expect(IdeaLink.safeParse(bad).success).toBe(false)
  })
})
