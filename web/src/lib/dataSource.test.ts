import { describe, expect, it } from 'vitest'
import { readState, readsLive } from './dataSource.ts'

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
