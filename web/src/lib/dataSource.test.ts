import { describe, expect, it, onTestFinished, vi } from 'vitest'
import { isNotBuilt, readState, readsLive, readsLiveServer } from './dataSource.ts'

const states = { first: { n: 1 }, second: { n: 2 } }

describe('readState', () => {
  it('reads the fixtures when no source is named: the state file object itself', () => {
    const read = readState(states, { state: 'second', source: undefined })
    expect(read).toEqual({ ok: true, value: { key: 'second', state: states.second } })
    if (read.ok) expect(read.value.state).toBe(states.second)
    expect(readState(states, { state: 'second', source: 'fixtures' })).toEqual(read)
  })

  it('reads the fallback, else the first state, when no state is named', () => {
    expect(readState(states, { state: undefined, source: undefined })).toEqual({
      ok: true,
      value: { key: 'first', state: states.first },
    })
    expect(readState(states, { state: undefined, source: undefined }, 'second')).toEqual({
      ok: true,
      value: { key: 'second', state: states.second },
    })
  })

  it('reads a home of its own when no state is named, and the state file when one is', () => {
    const home = { key: 'home', state: { n: 0 } }
    expect(readState(states, { state: undefined, source: undefined }, home)).toEqual({ ok: true, value: home })
    expect(readState(states, { state: 'first', source: undefined }, home)).toEqual({
      ok: true,
      value: { key: 'first', state: states.first },
    })
  })

  it('misses for a source that is not built, an unknown source and an unknown state', () => {
    expect(readState(states, { state: 'first', source: 'mock-api' })).toEqual({
      ok: false,
      error: { reason: 'notBuilt', source: 'mock-api' },
    })
    expect(readState(states, { state: 'first', source: 'live' })).toEqual({
      ok: false,
      error: { reason: 'notBuilt', source: 'live' },
    })
    expect(readState(states, { state: 'first', source: 'nowhere' })).toEqual({
      ok: false,
      error: { reason: 'unknownSource', source: 'nowhere' },
    })
    expect(readState(states, { state: 'third', source: undefined })).toEqual({
      ok: false,
      error: { reason: 'unknownState', state: 'third' },
    })
  })

  it('reads the same state with live: true for a page that built live, and still misses mock-api there', () => {
    const home = { key: 'home', state: { n: 0 } }
    const built = { built: ['live'] } as const
    expect(readState(states, { state: undefined, source: 'live' }, home, built)).toEqual({
      ok: true,
      value: { key: 'home', state: home.state, live: true },
    })
    expect(readState(states, { state: 'second', source: 'live' }, home, built)).toEqual({
      ok: true,
      value: { key: 'second', state: states.second, live: true },
    })
    expect(readState(states, { state: undefined, source: undefined }, home, built)).toEqual({ ok: true, value: home })
    expect(readState(states, { state: 'first', source: 'mock-api' }, home, built)).toEqual({
      ok: false,
      error: { reason: 'notBuilt', source: 'mock-api' },
    })
  })

  it("reads a page's default source for its home, and the fixtures for a ?state= or ?source=fixtures (d-117)", () => {
    const home = { key: 'home', state: { n: 0 } }
    const options = { built: ['live'], default: 'live' } as const
    expect(readState(states, { state: undefined, source: undefined }, home, options)).toEqual({
      ok: true,
      value: { key: 'home', state: home.state, live: true },
    })
    expect(readState(states, { state: 'second', source: undefined }, home, options)).toEqual({
      ok: true,
      value: { key: 'second', state: states.second },
    })
    expect(readState(states, { state: undefined, source: 'fixtures' }, home, options)).toEqual({
      ok: true,
      value: home,
    })
    expect(readState(states, { state: 'second', source: 'live' }, home, options)).toEqual({
      ok: true,
      value: { key: 'second', state: states.second, live: true },
    })
  })

  it('says when a request reads live: the default with no ?state=, or ?source=live', () => {
    const options = { built: ['live'], default: 'live' } as const
    expect(readsLive({ state: undefined, source: undefined }, options)).toBe(true)
    expect(readsLive({ state: 'second', source: undefined }, options)).toBe(false)
    expect(readsLive({ state: undefined, source: 'fixtures' }, options)).toBe(false)
    expect(readsLive({ state: 'second', source: 'live' }, options)).toBe(true)
    expect(readsLive({ state: undefined, source: undefined }, { built: ['live'] })).toBe(false)
    expect(readsLive({ state: undefined, source: 'live' })).toBe(false)
  })
})

describe('readsLiveServer (d-134)', () => {
  const build = (mode: string) => {
    vi.stubEnv('DEV', false)
    vi.stubEnv('MODE', mode)
    onTestFinished(() => {
      vi.unstubAllEnvs()
    })
  }
  const live = { built: ['live' as const], default: 'live' as const }

  it('reads the live server in development and in a served build, not in another build', () => {
    expect(readsLiveServer()).toBe(true)
    build('served')
    expect(readsLiveServer()).toBe(true)
    build('production')
    expect(readsLiveServer()).toBe(false)
  })

  it("reads a served build's live home for a ?state=, as only development reads ?state=", () => {
    build('served')
    expect(readsLive({ state: 'second', source: undefined }, live)).toBe(true)
    expect(readState(states, { state: 'second', source: undefined }, 'first', live)).toEqual({
      ok: true,
      value: { key: 'first', state: states.first, live: true },
    })
    expect(readsLive({ state: undefined, source: 'fixtures' }, live)).toBe(false)
  })
})

describe('isNotBuilt (audit W-8)', () => {
  it('accepts a notBuilt miss with a known source', () => {
    expect(isNotBuilt({ reason: 'notBuilt', source: 'mock-api' })).toBe(true)
    const miss = readState(states, { state: undefined, source: 'mock-api' })
    expect(!miss.ok && isNotBuilt(miss.error)).toBe(import.meta.env.DEV)
  })

  it('rejects a notBuilt reason with no source, an unknown source or a source that is not a string', () => {
    expect(isNotBuilt({ reason: 'notBuilt' })).toBe(false)
    expect(isNotBuilt({ reason: 'notBuilt', source: 'ftp' })).toBe(false)
    expect(isNotBuilt({ reason: 'notBuilt', source: 3 })).toBe(false)
  })

  it('rejects the other misses and values that are no miss', () => {
    expect(isNotBuilt({ reason: 'unknownSource', source: 'ftp' })).toBe(false)
    expect(isNotBuilt({ reason: 'unknownState', state: 'x' })).toBe(false)
    expect(isNotBuilt(undefined)).toBe(false)
    expect(isNotBuilt('notBuilt')).toBe(false)
  })
})
