import { describe, expect, it, onTestFinished } from 'vitest'
import {
  experimentFromSearch,
  installKeyboardExperiment,
  type KeyboardExperiment,
  parseExperiment,
  pressedField,
} from './keyboardExperiment.ts'

// The keyboard experiments of screen review R26 (dev only): a touch press on a
// composer field focuses it with no document scroll, by `prevent` or `proxy`.

function mountComposer(): { field: HTMLTextAreaElement; send: Element } {
  const footer = document.createElement('div')
  footer.className = 'scroll-frame__footer'
  // As ChatPane draws it: the field and Send share one data-keyboard-keep wrapper.
  footer.innerHTML =
    '<div data-keyboard-keep=""><textarea aria-label="Message"></textarea><button type="button"><span>Send</span></button></div>'
  document.body.append(footer)
  onTestFinished(() => {
    footer.remove()
  })
  const field = footer.querySelector('textarea')
  const send = footer.querySelector('button span')
  if (field === null || send === null) throw new Error('no composer')
  return { field, send }
}

function run(experiment: KeyboardExperiment | null, proxyWaitMs = 30) {
  const stop = installKeyboardExperiment({ current: () => experiment, proxyWaitMs })
  onTestFinished(stop)
}

const press = (target: Element, pointerType = 'touch') => {
  const event = new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType })
  target.dispatchEvent(event)
  return event
}

describe('keyboard experiment', () => {
  it('reads only the two names, from the param or a switch value', () => {
    expect(experimentFromSearch('?kb-experiment=proxy')).toBe('proxy')
    expect(experimentFromSearch('?state=chat&kb-experiment=prevent')).toBe('prevent')
    expect(experimentFromSearch('?kb-experiment=other')).toBeNull()
    expect(experimentFromSearch('')).toBeNull()
    expect(parseExperiment(1)).toBeNull()
  })

  it('takes a composer field in its keep wrapper, never its Send control or a field outside a footer', () => {
    const { field, send } = mountComposer()
    expect(pressedField(field)).toBe(field)
    expect(pressedField(send)).toBeNull()
    const outside = document.createElement('textarea')
    document.body.append(outside)
    onTestFinished(() => {
      outside.remove()
    })
    expect(pressedField(outside)).toBeNull()
  })

  it('prevent: a touch press focuses the field in the press and cancels its default', () => {
    const { field } = mountComposer()
    run('prevent')
    const event = press(field)
    expect(event.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(field)
  })

  it('proxy: a touch press focuses a hidden top input first, then the field, and removes the input', async () => {
    const { field } = mountComposer()
    run('proxy')
    const event = press(field)
    expect(event.defaultPrevented).toBe(true)
    const proxy = document.querySelector('[data-keyboard-experiment-proxy]')
    expect(proxy).not.toBeNull()
    expect(document.activeElement).toBe(proxy)
    await expect.poll(() => document.activeElement).toBe(field)
    expect(document.querySelector('[data-keyboard-experiment-proxy]')).toBeNull()
  })

  it('leaves a mouse press, a keep control and a focused field alone', () => {
    const { field, send } = mountComposer()
    run('prevent')
    expect(press(field, 'mouse').defaultPrevented).toBe(false)
    expect(press(send).defaultPrevented).toBe(false)
    field.focus()
    expect(press(field).defaultPrevented).toBe(false)
  })

  it('does nothing with no experiment, or after its stop function runs', () => {
    const { field } = mountComposer()
    run(null)
    expect(press(field).defaultPrevented).toBe(false)
    const stop = installKeyboardExperiment({ current: () => 'prevent' })
    stop()
    expect(press(field).defaultPrevented).toBe(false)
  })
})
