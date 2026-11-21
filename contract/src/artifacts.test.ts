import { describe, expect, it } from 'vitest'
import { AddArtifactRequest, Artifact, ArtifactsResponse, FileArtifactRequest } from './artifacts.ts'
import { ArtifactId } from './ids.ts'

const found = {
  id: '0123456789abcdef',
  link: 'https://claude.ai/artifact/Example_Artifact-0001xy',
  source: 'claude',
  title: 'Example report',
  description: '',
  project: 'example-project',
  chat: 'test-mac/0b7f2c1e-4d3a-4f6b-9a8c-1e2d3c4b5a69',
  publishedAt: '2026-11-20T10:00:00.000Z',
  foundAt: '2026-11-20T10:05:00.000Z',
  foundBy: 'session',
}

describe('the artifacts contract', () => {
  it('names an artifact by 16 hex characters only', () => {
    expect(ArtifactId.safeParse('0123456789abcdef').success).toBe(true)
    expect(ArtifactId.safeParse('https://claude.ai/artifact/x').success).toBe(false)
    expect(ArtifactId.safeParse('0123456789ABCDEF').success).toBe(false)
  })

  it('takes a found artifact only with a claude.ai artifact link', () => {
    expect(Artifact.safeParse(found).success).toBe(true)
    expect(Artifact.safeParse({ ...found, link: 'https://example.com/site' }).success).toBe(false)
    expect(Artifact.safeParse({ ...found, link: 'http://claude.ai/artifact/x' }).success).toBe(false)
    expect(Artifact.safeParse({ ...found, source: 'codex' }).success).toBe(false)
    expect(Artifact.safeParse({ ...found, path: '/home/dev/x.html' }).success).toBe(false)
  })

  it('takes a found artifact only with the chat that published it', () => {
    expect(Artifact.safeParse({ ...found, chat: null }).success).toBe(false)
  })

  it('takes an owner link on any https host, and no http link', () => {
    const owned = { ...found, link: 'https://example.com/site', source: 'codex', chat: null, foundBy: 'owner' }
    expect(Artifact.safeParse(owned).success).toBe(true)
    expect(Artifact.safeParse({ ...owned, link: 'http://example.com/site' }).success).toBe(false)
  })

  it('lists the artifacts with the last read, the last look and whether the read was partial', () => {
    expect(
      ArtifactsResponse.safeParse({ checkedAt: null, lastSeenAt: null, partial: false, artifacts: [found] }).success,
    ).toBe(true)
    expect(ArtifactsResponse.safeParse({ checkedAt: null, lastSeenAt: null, artifacts: [] }).success).toBe(false)
  })

  it('adds a Codex site on any https host and a Claude artifact only on claude.ai', () => {
    expect(
      AddArtifactRequest.safeParse({ link: 'https://example.com/site', source: 'codex', title: 'Site' }).success,
    ).toBe(true)
    expect(
      AddArtifactRequest.safeParse({ link: 'https://example.com/site', source: 'claude', title: 'Site' }).success,
    ).toBe(false)
    expect(
      AddArtifactRequest.safeParse({ link: 'http://example.com/site', source: 'codex', title: 'Site' }).success,
    ).toBe(false)
    expect(
      AddArtifactRequest.safeParse({ link: 'https://example.com/site', source: 'codex', title: '  ' }).success,
    ).toBe(false)
  })

  it('files an artifact in a project or in none, and refuses a path', () => {
    expect(FileArtifactRequest.safeParse({ project: 'example-project' }).success).toBe(true)
    expect(FileArtifactRequest.safeParse({ project: null }).success).toBe(true)
    expect(FileArtifactRequest.safeParse({ project: '/home/dev/x' }).success).toBe(false)
  })
})
