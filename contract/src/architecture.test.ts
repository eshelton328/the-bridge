import { describe, expect, it } from 'vitest'
import {
  ArchitectureModel,
  ArchitectureResponse,
  ArchitectureScope,
  ArchitectureScopeState,
  RegenerateRequest,
  maxArchitectureScopes,
  systemScope,
} from './architecture.ts'
import { errorStatus } from './errors.ts'
import { LiveEvent } from './liveEvents.ts'
import { RepositoryId, RepositoryPath } from './projects.ts'

const part = (id: string, extra: object = {}) => ({
  id,
  name: id,
  shape: 'service',
  ours: true,
  typeLine: 'Server · Hono on Node',
  ...extra,
})
const model = (extra: object = {}) => ({
  view: 'component',
  parts: [part('server'), part('web', { shape: 'webApp', boundary: 'mac' })],
  boundaries: [{ id: 'mac', label: 'The Mac', kind: 'machine' }],
  arrows: [{ from: 'web', to: 'server', label: 'reads /api' }],
  stack: [{ name: 'Styling', badges: ['Panda CSS'] }],
  ...extra,
})

describe('the Architecture contract', () => {
  it('has a system scope that no repository ID can take', () => {
    expect(RepositoryId.safeParse(systemScope).success).toBe(false)
    expect(ArchitectureScope.parse(systemScope)).toBe('@system')
    expect(ArchitectureScope.parse('system')).toBe('system')
    expect(ArchitectureScope.safeParse('../x').success).toBe(false)
  })

  it('takes a model whose arrows and boundaries name its own parts', () => {
    expect(ArchitectureModel.safeParse(model()).success).toBe(true)
    expect(ArchitectureModel.safeParse(model({ arrows: [{ from: 'web', to: 'db', label: 'x' }] })).success).toBe(false)
    expect(ArchitectureModel.safeParse(model({ boundaries: [] })).success).toBe(false)
    expect(ArchitectureModel.safeParse(model({ parts: [part('a'), part('a')], arrows: [] })).success).toBe(false)
    expect(ArchitectureModel.safeParse(model({ extra: 1 })).success).toBe(false)
  })

  it('names a folder or file part by a relative POSIX path only', () => {
    const named = (name: string) => model({ parts: [part('f', { shape: 'folder', name })], arrows: [], boundaries: [] })
    expect(ArchitectureModel.safeParse(named('web/src')).success).toBe(true)
    for (const bad of ['/Users/x', '../up', 'a/../b', 'a//b', 'a\\b', `a${String.fromCharCode(10)}b`])
      expect(ArchitectureModel.safeParse(named(bad)).success).toBe(false)
    expect(RepositoryPath.safeParse('tokens/build.ts').success).toBe(true)
  })

  it('caps each text and list', () => {
    expect(
      ArchitectureModel.safeParse(model({ parts: [part('a', { name: 'x'.repeat(201) })], arrows: [], boundaries: [] }))
        .success,
    ).toBe(false)
    const many = Array.from({ length: 201 }, (_, i) => part(`p${String(i)}`))
    expect(ArchitectureModel.safeParse(model({ parts: many, arrows: [], boundaries: [] })).success).toBe(false)
    expect(ArchitectureModel.safeParse(model({ stack: [{ name: 'Build', badges: ['b'.repeat(101)] }] })).success).toBe(
      false,
    )
  })

  it('gives a state with a 40-hex commit and an ISO time, or null for both', () => {
    const state = {
      scope: systemScope,
      title: 'How the system works',
      commit: null,
      generatedAt: null,
      stale: false,
      running: false,
    }
    expect(ArchitectureScopeState.safeParse(state).success).toBe(true)
    const kept = { ...state, commit: 'a'.repeat(40), generatedAt: '2026-11-28T07:30:00.000Z' }
    expect(ArchitectureScopeState.safeParse(kept).success).toBe(true)
    expect(ArchitectureScopeState.safeParse({ ...kept, commit: 'abc' }).success).toBe(false)
    expect(ArchitectureScopeState.safeParse({ ...kept, generatedAt: 'yesterday' }).success).toBe(false)
    expect(ArchitectureScopeState.safeParse({ ...kept, generatedAt: null }).success).toBe(false)
    expect(ArchitectureScopeState.safeParse({ ...state, commit: 'a'.repeat(40) }).success).toBe(false)
  })

  it('caps the scopes of a project', () => {
    const state = {
      scope: systemScope,
      title: 'How the system works',
      commit: null,
      generatedAt: null,
      stale: false,
      running: false,
    }
    expect(
      ArchitectureResponse.safeParse({ scopes: Array.from({ length: maxArchitectureScopes }, () => state) }).success,
    ).toBe(true)
    expect(
      ArchitectureResponse.safeParse({ scopes: Array.from({ length: maxArchitectureScopes + 1 }, () => state) })
        .success,
    ).toBe(false)
  })

  it('takes an empty regenerate body only, and answers a busy run with 409', () => {
    expect(RegenerateRequest.safeParse({}).success).toBe(true)
    expect(RegenerateRequest.safeParse({ scope: 'x' }).success).toBe(false)
    expect(errorStatus['architecture-busy']).toBe(409)
  })

  it('sends architecture.changed with the slug and scope only', () => {
    const event = {
      source: 'mac-mini/server',
      seq: 0,
      type: 'architecture.changed',
      data: { slug: 'ncc-1701', scope: systemScope },
    }
    expect(LiveEvent.safeParse(event).success).toBe(true)
    expect(LiveEvent.safeParse({ ...event, data: { ...event.data, path: '/x' } }).success).toBe(false)
  })
})
