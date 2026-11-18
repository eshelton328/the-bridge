import { describe, expect, it } from 'vitest'
import { type ScreenMap, screenMapProblems, screenStates } from './screenMap.ts'

const frame = (viewport: 'desktop' | 'tablet' | 'phone') => [{ id: 'X1', node: '1:1', viewport }] as const
const states = {
  list: { frames: frame('desktop') },
  listPhone: { frames: frame('phone') },
  sheet: { frames: frame('phone') },
}
type State = keyof typeof states

describe('screenMapProblems', () => {
  it('is empty when every state is in one screen on its own device', () => {
    const map: ScreenMap<State> = {
      list: { title: 'List', desktop: 'list', phone: 'listPhone' },
      sheet: { title: 'Sheet', phone: 'sheet' },
    }
    expect(screenMapProblems(states, map)).toEqual([])
  })

  it('names a state in no screen', () => {
    const map: ScreenMap<State> = { list: { title: 'List', desktop: 'list', phone: 'listPhone' } }
    expect(screenMapProblems(states, map)).toEqual(['sheet is in no screen'])
  })

  it('names a state in two screens', () => {
    const map: ScreenMap<State> = {
      list: { title: 'List', desktop: 'list', phone: 'listPhone' },
      sheet: { title: 'Sheet', phone: 'sheet' },
      again: { title: 'Again', phone: 'listPhone' },
    }
    expect(screenMapProblems(states, map)).toEqual(['listPhone is in the screens list and again'])
  })

  it('names a state on a device its frames are not', () => {
    const map: ScreenMap<State> = {
      list: { title: 'List', desktop: 'list', tablet: 'listPhone' },
      sheet: { title: 'Sheet', phone: 'sheet' },
    }
    expect(screenMapProblems(states, map)).toEqual(['list.tablet is listPhone, whose frames are phone'])
  })
})

describe('screenStates', () => {
  it('lists the devices desktop first and leaves out the missing ones', () => {
    expect(screenStates({ title: 'List', phone: 'listPhone', desktop: 'list' })).toEqual([
      { device: 'desktop', state: 'list' },
      { device: 'phone', state: 'listPhone' },
    ])
  })
})
