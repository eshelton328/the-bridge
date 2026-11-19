import { describe, expect, it, onTestFinished, vi } from 'vitest'
import {
  dockedBox,
  experimentFromSearch,
  installKeyboardExperiment,
  KEYBOARD_EXPERIMENT_SWITCH_URL,
  type KeyboardExperiment,
  parseExperiment,
  pressedField,
  startKeyboardExperiment,
} from './keyboardExperiment.ts'

// The keyboard experiments of screen reviews R26 and R27 (dev only): a touch tap on a composer field focuses it with
// no document scroll, by 'prevent' or 'proxy'. Desktop Chromium draws no iOS keyboard and has no iOS scroll into
// view, so these tests prove the focus, the cancelled default, the move and the text; only the phone shows the slide.

function mountComposer(): { field: HTMLTextAreaElement; send: Element } {
  const footer = document.createElement('div')
  footer.className = 'scroll-frame__footer'
  // As ChatPane draws it: the field and Send share one data-keyboard-keep wrapper.
  footer.innerHTML =
    '<div data-keyboard-keep=""><textarea aria-label="Message" enterkeyhint="send"></textarea><button type="button"><span>Send</span></button></div>'
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

/** A finger's tap as iOS sends it: the pointer press, then the touchend whose default is the focus. */
function tap(target: Element, pointerType = 'touch') {
  target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType }))
  const end = new Event('touchend', { bubbles: true, cancelable: true })
  target.dispatchEvent(end)
  return end
}

const proxyOf = () => document.querySelector('[data-keyboard-experiment-proxy]')

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

  it('prevent: the tap cancels its touchend and focuses the field inside that same handler, with no await', () => {
    const { field } = mountComposer()
    run('prevent')
    const focus = vi.spyOn(field, 'focus')
    const end = tap(field)
    expect(end.defaultPrevented).toBe(true)
    // Synchronous: right after dispatchEvent returns, inside the gesture iOS needs to open the keyboard.
    expect(document.activeElement).toBe(field)
    expect(focus).toHaveBeenCalledWith({ preventScroll: true })
  })

  it('prevent: a tap in a composer that already has the focus keeps its default, so the caret and selection work', () => {
    const { field } = mountComposer()
    run('prevent')
    field.value = 'some text'
    field.focus()
    expect(tap(field).defaultPrevented).toBe(false)
    expect(document.activeElement).toBe(field)
  })

  it('proxy: the tap focuses a proxy at the docked place inside its handler, hidden from VoiceOver, then the field', async () => {
    const { field } = mountComposer()
    run('proxy')
    const end = tap(field)
    expect(end.defaultPrevented).toBe(true)
    const proxy = proxyOf()
    expect(proxy).toBeInstanceOf(HTMLTextAreaElement)
    // Synchronous, inside the gesture.
    expect(document.activeElement).toBe(proxy)
    expect(proxy?.getAttribute('aria-hidden')).toBe('true')
    expect(proxy?.getAttribute('tabindex')).toBe('-1')
    expect(proxy?.hasAttribute('aria-label')).toBe(false)
    expect(proxy?.getAttribute('enterkeyhint')).toBe('send')
    await expect.poll(() => document.activeElement).toBe(field)
    expect(proxyOf()).toBeNull()
  })

  it('proxy: text typed into the proxy before the move ends up in the field, after the text it had', async () => {
    const { field } = mountComposer()
    field.value = 'draft '
    const typed: string[] = []
    field.addEventListener('input', () => typed.push(field.value))
    run('proxy')
    tap(field)
    const proxy = proxyOf()
    if (!(proxy instanceof HTMLTextAreaElement)) throw new Error('no proxy')
    proxy.value = 'hi'
    await expect.poll(() => document.activeElement).toBe(field)
    expect(field.value).toBe('draft hi')
    expect(typed).toEqual(['draft hi'])
  })

  it('proxy: an IME composition holds the move until it ends, and its text moves whole', async () => {
    const { field } = mountComposer()
    run('proxy', 10)
    tap(field)
    const proxy = proxyOf()
    if (!(proxy instanceof HTMLTextAreaElement)) throw new Error('no proxy')
    proxy.dispatchEvent(new CompositionEvent('compositionstart', { data: '' }))
    proxy.value = 'か'
    // Well past the wait: the composition still holds the focus in the proxy.
    await new Promise((done) => setTimeout(done, 60))
    expect(document.activeElement).toBe(proxy)
    proxy.value = '漢'
    proxy.dispatchEvent(new CompositionEvent('compositionend', { data: '漢' }))
    expect(document.activeElement).toBe(field)
    expect(field.value).toBe('漢')
    expect(proxyOf()).toBeNull()
  })

  it('proxy: a proxy that loses the focus to something else goes, and the field stays unfocused', () => {
    const { field } = mountComposer()
    run('proxy', 5000)
    tap(field)
    const other = document.createElement('input')
    document.body.append(other)
    onTestFinished(() => {
      other.remove()
    })
    other.focus()
    expect(proxyOf()).toBeNull()
    expect(document.activeElement).toBe(other)
  })

  it('places the proxy where the shell docks the field: up by how far the keyboard covers the detail', () => {
    const detail = document.createElement('div')
    detail.className = 'app-shell__detail'
    detail.style.cssText = 'position:fixed;left:0;top:0;width:300px;height:' + String(window.innerHeight) + 'px'
    const field = document.createElement('textarea')
    field.style.cssText = 'position:absolute;left:10px;bottom:20px;width:200px;height:40px;margin:0'
    detail.append(field)
    document.body.append(detail)
    onTestFinished(() => {
      detail.remove()
    })
    const rect = field.getBoundingClientRect()
    expect(dockedBox(field, 300)).toEqual({ top: rect.top - 300, left: rect.left, width: rect.width, height: rect.height })
    expect(dockedBox(field, 0).top).toBe(rect.top)
  })

  it('leaves a mouse tap, a keep control, a touch that moves and a focused field alone', () => {
    const { field, send } = mountComposer()
    run('prevent')
    expect(tap(field, 'mouse').defaultPrevented).toBe(false)
    expect(tap(send).defaultPrevented).toBe(false)
    field.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', clientX: 0, clientY: 0 }))
    field.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'touch', clientX: 0, clientY: 40 }))
    const scrolled = new Event('touchend', { bubbles: true, cancelable: true })
    field.dispatchEvent(scrolled)
    expect(scrolled.defaultPrevented).toBe(false)
    expect(document.activeElement).not.toBe(field)
    field.focus()
    expect(tap(field).defaultPrevented).toBe(false)
  })

  it('does nothing with no experiment, or after its stop function runs', () => {
    const { field } = mountComposer()
    run(null)
    expect(tap(field).defaultPrevented).toBe(false)
    const stop = installKeyboardExperiment({ current: () => 'prevent' })
    stop()
    expect(tap(field).defaultPrevented).toBe(false)
  })
})

/** The test browser is automated, and automation never asks the switch: these tests act as a person's browser. */
function notAutomated() {
  Object.defineProperty(navigator, 'webdriver', { configurable: true, value: false })
  onTestFinished(() => {
    Reflect.deleteProperty(navigator, 'webdriver')
  })
}

describe('keyboard experiment switch', () => {
  it('never asks the switch under automation', async () => {
    const fetchSwitch = vi.fn(() => Promise.resolve(new Response('{"experiment":"proxy"}')))
    const running = startKeyboardExperiment({ pollMs: 20, fetchSwitch })
    onTestFinished(running.stop)
    await new Promise((done) => setTimeout(done, 60))
    expect(fetchSwitch).not.toHaveBeenCalled()
    expect(running.current()).toBeNull()
  })

  it("takes the dev server's switch with no param, marks the root, and clears the mark at stop", async () => {
    notAutomated()
    let answer: unknown = { experiment: 'proxy' }
    const asked: string[] = []
    const running = startKeyboardExperiment({
      pollMs: 20,
      fetchSwitch: (url) => {
        asked.push(url)
        return Promise.resolve(new Response(JSON.stringify(answer)))
      },
    })
    onTestFinished(running.stop)
    await expect.poll(() => document.documentElement.dataset.kbExperiment).toBe('proxy')
    expect(running.current()).toBe('proxy')
    expect(asked[0]).toBe(KEYBOARD_EXPERIMENT_SWITCH_URL)
    answer = { experiment: 'prevent' }
    await expect.poll(running.current).toBe('prevent')
    answer = { experiment: 'other' }
    await expect.poll(running.current).toBeNull()
    expect(document.documentElement.dataset.kbExperiment).toBeUndefined()
    answer = { experiment: 'prevent' }
    await expect.poll(running.current).toBe('prevent')
    running.stop()
    expect(document.documentElement.dataset.kbExperiment).toBeUndefined()
    const count = asked.length
    await new Promise((done) => setTimeout(done, 60))
    expect(asked.length).toBe(count)
  })

  it('keeps the experiment when the switch fails, and lets the URL param win with no asking', async () => {
    const before = window.location.href
    onTestFinished(() => {
      window.history.replaceState(null, '', before)
    })
    notAutomated()
    let fail = false
    const running = startKeyboardExperiment({
      pollMs: 20,
      fetchSwitch: () =>
        fail ? Promise.reject(new Error('away')) : Promise.resolve(new Response(JSON.stringify({ experiment: 'prevent' }))),
    })
    onTestFinished(running.stop)
    await expect.poll(running.current).toBe('prevent')
    fail = true
    await new Promise((done) => setTimeout(done, 60))
    expect(running.current()).toBe('prevent')
    running.stop()
    window.history.replaceState(null, '', window.location.pathname + '?kb-experiment=proxy')
    const fetchSwitch = vi.fn(() => Promise.resolve(new Response('{}')))
    const fromUrl = startKeyboardExperiment({ pollMs: 20, fetchSwitch })
    onTestFinished(fromUrl.stop)
    expect(fromUrl.current()).toBe('proxy')
    expect(document.documentElement.dataset.kbExperiment).toBe('proxy')
    await new Promise((done) => setTimeout(done, 60))
    expect(fetchSwitch).not.toHaveBeenCalled()
  })
})
