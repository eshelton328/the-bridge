import { describe, expect, it, onTestFinished } from 'vitest'
import { KEYBOARD_PROXY_EVENT } from '../lib/keyboardProxyEvent.ts'
import { dockedBox, installKeyboardProxy, pressedField, proxyFocusApplies } from './keyboardProxy.ts'

// The composer's focus through a proxy field (screen reviews R26, R27 and R37): a touch tap on a composer field
// focuses a transparent field at the docked place, with no document scroll, then moves the focus to the field. Desktop
// Chromium draws no iOS keyboard and has no iOS scroll into view, so these tests prove the focus, the cancelled
// default, the move and the text; only the phone shows the slide.

function mountComposer(): { field: HTMLTextAreaElement; send: Element; box: Element; chip: Element } {
  const footer = document.createElement('div')
  footer.className = 'scroll-frame__footer'
  // As ChatPane draws it: the field and Send share one data-keyboard-keep wrapper.
  footer.innerHTML =
    '<div data-keyboard-keep="" class="box"><div class="chips"><span class="chip">a.png<button type="button" class="remove">x</button></span></div><textarea aria-label="Message" enterkeyhint="send"></textarea><div role="button" class="chip-model">Model</div><button type="button"><span>Send</span></button></div>'
  document.body.append(footer)
  onTestFinished(() => {
    footer.remove()
  })
  const field = footer.querySelector('textarea')
  const send = footer.querySelector('button span')
  const box = footer.querySelector('.chips')
  const chip = footer.querySelector('.remove')
  if (field === null || send === null || box === null || chip === null) throw new Error('no composer')
  return { field, send, box, chip }
}

function run(proxyWaitMs = 30) {
  const stop = installKeyboardProxy({ proxyWaitMs })
  onTestFinished(stop)
}

/** A finger's tap as iOS sends it: the pointer press, then the touchend whose default is the focus. */
function tap(target: Element, pointerType = 'touch') {
  target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType }))
  const end = new Event('touchend', { bubbles: true, cancelable: true })
  target.dispatchEvent(end)
  return end
}

/** A finger held down 'ms' before its release: past 500 ms iOS shows its magnifier and paste menu. */
async function hold(target: Element, ms: number) {
  target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: 'touch' }))
  await new Promise((done) => setTimeout(done, ms))
  const end = new Event('touchend', { bubbles: true, cancelable: true })
  target.dispatchEvent(end)
  return end
}

const proxyOf = () => document.querySelector('[data-keyboard-proxy]')

describe('keyboard proxy', () => {
  it('takes a composer field in its keep wrapper, never its Send control or a field outside a footer', () => {
    const { field, send } = mountComposer()
    expect(pressedField(field)).toBe(field)
    expect(pressedField(send)).toBeNull()
    expect(pressedField(document.querySelector('.chip-model'))).toBeNull()
    const outside = document.createElement('textarea')
    document.body.append(outside)
    onTestFinished(() => {
      outside.remove()
    })
    expect(pressedField(outside)).toBeNull()
  })

  it('a tap on a control in the box (a chip remove, the model chip) keeps its default and focuses nothing', () => {
    const { field, chip } = mountComposer()
    run()
    for (const control of [chip, document.querySelector('.chip-model')]) {
      if (control === null) throw new Error('no control')
      expect(tap(control).defaultPrevented).toBe(false)
      expect(document.activeElement).not.toBe(field)
      expect(proxyOf()).toBeNull()
    }
  })

  it('a tap on the box of a focused composer keeps its default, so the caret and selection stay', () => {
    const { field, box } = mountComposer()
    run()
    field.value = 'some text'
    field.focus()
    field.setSelectionRange(2, 6)
    expect(tap(box).defaultPrevented).toBe(false)
    expect([field.selectionStart, field.selectionEnd]).toEqual([2, 6])
  })

  it('a long press on the field or its box keeps its default, so iOS shows its magnifier and paste menu', async () => {
    const { field, box } = mountComposer()
    run()
    expect((await hold(field, 520)).defaultPrevented).toBe(false)
    expect((await hold(box, 520)).defaultPrevented).toBe(false)
    expect(document.activeElement).not.toBe(field)
  })

  it('a tap on the composer box goes through the proxy to the field too', async () => {
    const { field, box } = mountComposer()
    run()
    expect(tap(box).defaultPrevented).toBe(true)
    expect(proxyOf()).not.toBeNull()
    await expect.poll(() => document.activeElement).toBe(field)
  })

  it('the tap focuses a proxy at the docked place inside its handler, hidden from VoiceOver, then the field', async () => {
    const { field } = mountComposer()
    run()
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

  it('starts as a copy of the draft, and its edits (typing, Backspace) end up in the field', async () => {
    const { field } = mountComposer()
    field.value = 'draft'
    const changes: string[] = []
    field.addEventListener('input', () => changes.push(field.value))
    run()
    tap(field)
    const proxy = proxyOf()
    if (!(proxy instanceof HTMLTextAreaElement)) throw new Error('no proxy')
    expect(proxy.value).toBe('draft')
    expect(proxy.selectionStart).toBe(5)
    // Backspace twice, then typing.
    proxy.value = 'dra'
    proxy.value = 'drafts hi'
    proxy.setSelectionRange(9, 9)
    await expect.poll(() => document.activeElement).toBe(field)
    expect(field.value).toBe('drafts hi')
    expect(field.selectionStart).toBe(9)
    expect(changes).toEqual(['drafts hi'])
  })

  it('a Backspace into an existing draft before the move shortens the draft', async () => {
    const { field } = mountComposer()
    field.value = 'draft'
    run()
    tap(field)
    const proxy = proxyOf()
    if (!(proxy instanceof HTMLTextAreaElement)) throw new Error('no proxy')
    proxy.value = 'draf'
    await expect.poll(() => document.activeElement).toBe(field)
    expect(field.value).toBe('draf')
  })

  it('an IME composition holds the move until it ends, and its text moves whole', async () => {
    const { field } = mountComposer()
    run(10)
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

  it('a proxy that loses the focus to something else goes, the field stays unfocused and keeps the text', () => {
    const { field } = mountComposer()
    run(5000)
    tap(field)
    const proxy = proxyOf()
    if (!(proxy instanceof HTMLTextAreaElement)) throw new Error('no proxy')
    proxy.value = 'typed then dismissed'
    const other = document.createElement('input')
    document.body.append(other)
    onTestFinished(() => {
      other.remove()
    })
    other.focus()
    expect(proxyOf()).toBeNull()
    expect(document.activeElement).toBe(other)
    expect(field.value).toBe('typed then dismissed')
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
    expect(dockedBox(field, 300)).toEqual({
      top: rect.top - 300,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    })
    expect(dockedBox(field, 0).top).toBe(rect.top)
  })

  it('leaves a mouse tap, a keep control, a touch that moves and a focused field alone', () => {
    const { field, send } = mountComposer()
    run()
    expect(tap(field, 'mouse').defaultPrevented).toBe(false)
    expect(tap(send).defaultPrevented).toBe(false)
    field.dispatchEvent(
      new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', clientX: 0, clientY: 0 }),
    )
    field.dispatchEvent(
      new PointerEvent('pointermove', { bubbles: true, pointerType: 'touch', clientX: 0, clientY: 40 }),
    )
    const scrolled = new Event('touchend', { bubbles: true, cancelable: true })
    field.dispatchEvent(scrolled)
    expect(scrolled.defaultPrevented).toBe(false)
    expect(document.activeElement).not.toBe(field)
    field.focus()
    expect(tap(field).defaultPrevented).toBe(false)
  })

  it('does nothing after its stop function runs', () => {
    const { field } = mountComposer()
    const stop = installKeyboardProxy()
    stop()
    expect(tap(field).defaultPrevented).toBe(false)
    expect(proxyOf()).toBeNull()
  })

  it('tells the composer at the tap that the proxy holds its focus, and nothing more when the field takes it', async () => {
    const { field } = mountComposer()
    const told: unknown[] = []
    const listener = (event: Event) => {
      if (event instanceof CustomEvent) told.push(event.detail)
    }
    // The composer's wrapper hears it: the event bubbles from the field.
    const wrapper = field.closest('[data-keyboard-keep]')
    wrapper?.addEventListener(KEYBOARD_PROXY_EVENT, listener)
    onTestFinished(() => wrapper?.removeEventListener(KEYBOARD_PROXY_EVENT, listener))
    run()
    tap(field)
    // Synchronous, before the proxy's focus: the composer expands at the tap (R31), not at the move (R37).
    expect(told).toEqual([true])
    await expect.poll(() => document.activeElement).toBe(field)
    expect(told).toEqual([true])
  })

  it('tells the composer when the proxy loses the focus to something else, so a collapsible composer collapses again', () => {
    const { field } = mountComposer()
    const told: unknown[] = []
    field.addEventListener(KEYBOARD_PROXY_EVENT, (event) => {
      if (event instanceof CustomEvent) told.push(event.detail)
    })
    run(5000)
    tap(field)
    const other = document.createElement('input')
    document.body.append(other)
    onTestFinished(() => {
      other.remove()
    })
    other.focus()
    expect(told).toEqual([true, false])
  })

  it("moves the focus once the keyboard is reported only after the shell's dock has stopped (keyboardEnd)", async () => {
    const { field } = mountComposer()
    // The field sits high on the page, so it is above the shrunk visible area from the start: only the dock's end holds
    // the move.
    const shell = document.createElement('div')
    shell.className = 'app-shell__root'
    const footer = field.closest('.scroll-frame__footer')
    if (footer === null || window.visualViewport === null) throw new Error('no footer or visual viewport')
    footer.before(shell)
    shell.append(footer)
    const vv = window.visualViewport
    const full = vv.height
    let height = full
    Object.defineProperty(vv, 'height', { configurable: true, get: () => height })
    onTestFinished(() => {
      Reflect.deleteProperty(vv, 'height')
      document.body.append(footer)
      shell.remove()
    })
    shell.dataset.keyboardEnd = String(performance.now() + 5000)
    run(5000)
    tap(field)
    const proxy = proxyOf()
    // The keyboard's report: the visible area shrinks by a keyboard.
    height = full - 300
    vv.dispatchEvent(new Event('resize'))
    await new Promise((done) => setTimeout(done, 80))
    // Docked, but the dock still moves: the focus stays in the proxy.
    expect(document.activeElement).toBe(proxy)
    shell.dataset.keyboardEnd = String(performance.now())
    await expect.poll(() => document.activeElement).toBe(field)
    expect(proxyOf()).toBeNull()
  })

  it('applies only on a touch screen with no VirtualKeyboard API (iOS)', () => {
    const win = (coarse: boolean, virtualKeyboard: boolean) => ({
      matchMedia: (query: string) => ({ matches: query === '(pointer: coarse)' && coarse }),
      navigator: virtualKeyboard ? { virtualKeyboard: {} } : {},
    })
    expect(proxyFocusApplies(win(true, false))).toBe(true)
    expect(proxyFocusApplies(win(true, true))).toBe(false)
    expect(proxyFocusApplies(win(false, false))).toBe(false)
  })
})
