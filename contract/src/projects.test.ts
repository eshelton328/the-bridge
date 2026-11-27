import { describe, expect, it } from 'vitest'
import {
  DriftRun,
  Idea,
  PinProjectRequest,
  ProjectDetailResponse,
  ProjectSlug,
  ProjectSummary,
  RunDriftRequest,
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
})
