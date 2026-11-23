import { afterEach, describe, expect, it, vi } from 'vitest'
import { defaultSettings, settingsKey } from '../lib/deviceSettings.ts'
import { resetAllStores } from './resetStores.ts'
import { settingsStore, startSettingsStorage } from './settingsStore.ts'

/** A storage double that holds one key, or throws on each use when blocked. */
function fakeStorage(start: string | null = null, blocked = false) {
  const data = new Map<string, string>(start === null ? [] : [[settingsKey, start]])
  const keys: string[] = []
  return {
    keys,
    data,
    storage: {
      getItem: (key: string) => {
        keys.push(key)
        if (blocked) throw new DOMException('blocked', 'SecurityError')
        return data.get(key) ?? null
      },
      setItem: (key: string, value: string) => {
        keys.push(key)
        if (blocked) throw new DOMException('full', 'QuotaExceededError')
        data.set(key, value)
      },
    },
  }
}

const stops: (() => void)[] = []
afterEach(() => {
  for (const stop of stops.splice(0)) stop()
  resetAllStores()
})

describe('settingsStore', () => {
  it('starts at the defaults, Dark', () => {
    const { mode, textSize, chatWidth, nav, chat, pushPreview } = settingsStore.getState()
    expect({ mode, textSize, chatWidth, nav, chat, pushPreview }).toEqual(defaultSettings)
    expect(pushPreview).toBe(true)
  })

  it('sets the mode, the text size and the chat defaults and keeps the actions object', () => {
    const { actions } = settingsStore.getState()
    actions.setMode('system')
    actions.setTextSize('large')
    actions.setChatDefaults({ effort: 'max' })
    const s = settingsStore.getState()
    expect([s.mode, s.textSize, s.chat]).toEqual(['system', 'large', { ...defaultSettings.chat, effort: 'max' }])
    expect(s.actions).toBe(actions)
  })

  it('moves a nav page and refuses to hide the page on screen or the last shown page', () => {
    const { actions } = settingsStore.getState()
    actions.moveNavPage('toolkit', -1)
    expect(
      settingsStore
        .getState()
        .nav.slice(-3)
        .map((e) => e.page),
    ).toEqual(['toolkit', 'artifacts', 'settings'])
    expect(actions.setNavPageVisible('inbox', false, 'inbox')).toBe('currentPage')
    expect(settingsStore.getState().nav.find((e) => e.page === 'inbox')?.visible).toBe(true)
    for (const page of ['inbox', 'workspaces', 'projects', 'artifacts'] as const)
      expect(actions.setNavPageVisible(page, false, 'home')).toBeUndefined()
    expect(actions.setNavPageVisible('toolkit', false, 'home')).toBe('noVisiblePage')
    expect(
      settingsStore
        .getState()
        .nav.filter((e) => e.visible)
        .map((e) => e.page),
    ).toEqual(['home', 'toolkit', 'settings'])
  })

  it('sets the message preview choice', () => {
    settingsStore.getState().actions.setPushPreview(false)
    expect(settingsStore.getState().pushPreview).toBe(false)
  })

  it('sets the chat width', () => {
    settingsStore.getState().actions.setChatWidth('wide')
    expect(settingsStore.getState().chatWidth).toBe('wide')
  })

  it('goes back to the defaults on reset', () => {
    const { actions } = settingsStore.getState()
    actions.setMode('light')
    actions.reset()
    expect(settingsStore.getState().mode).toBe('dark')
  })
})

describe('startSettingsStorage', () => {
  it('loads the saved settings, saves each change under the one key and calls onChange', () => {
    const fake = fakeStorage(JSON.stringify({ ...defaultSettings, mode: 'light' }))
    const onChange = vi.fn()
    const report = vi.fn()
    stops.push(startSettingsStorage({ storage: () => fake.storage, report, onChange }))
    expect(settingsStore.getState().mode).toBe('light')
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ mode: 'light' }))
    settingsStore.getState().actions.setMode('system')
    expect(JSON.parse(fake.data.get(settingsKey) ?? '{}')).toEqual({ ...defaultSettings, mode: 'system' })
    expect(onChange).toHaveBeenLastCalledWith({ ...defaultSettings, mode: 'system' })
    settingsStore.getState().actions.setChatWidth('narrow')
    expect(JSON.parse(fake.data.get(settingsKey) ?? '{}')).toEqual({
      ...defaultSettings,
      mode: 'system',
      chatWidth: 'narrow',
    })
    expect(new Set(fake.keys)).toEqual(new Set([settingsKey]))
    expect(report).not.toHaveBeenCalled()
  })

  it('gives the defaults for a bad saved value, with no report', () => {
    const fake = fakeStorage('{"mode":')
    const report = vi.fn()
    stops.push(startSettingsStorage({ storage: () => fake.storage, report }))
    expect(settingsStore.getState().mode).toBe('dark')
    expect(report).not.toHaveBeenCalled()
  })

  it('keeps the settings in memory and reports each failed read and write when storage is blocked', () => {
    const fake = fakeStorage(null, true)
    const report = vi.fn()
    stops.push(startSettingsStorage({ storage: () => fake.storage, report }))
    expect(settingsStore.getState().mode).toBe('dark')
    settingsStore.getState().actions.setMode('light')
    expect(settingsStore.getState().mode).toBe('light')
    expect(report).toHaveBeenCalledTimes(2)
  })

  it('reports a storage getter that throws, as Safari does with storage blocked', () => {
    const report = vi.fn()
    stops.push(
      startSettingsStorage({
        storage: () => {
          throw new DOMException('blocked', 'SecurityError')
        },
        report,
      }),
    )
    expect(settingsStore.getState().mode).toBe('dark')
    expect(report).toHaveBeenCalledTimes(1)
  })

  it('writes nothing after its stop', () => {
    const fake = fakeStorage()
    startSettingsStorage({ storage: () => fake.storage, report: vi.fn() })()
    settingsStore.getState().actions.setMode('light')
    expect(fake.data.size).toBe(0)
  })
})
