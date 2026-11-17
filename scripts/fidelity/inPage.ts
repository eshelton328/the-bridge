/// <reference lib="dom" />
// Runs inside the rendered page (Playwright's page.evaluate), so it must
// not use anything from its module scope: every helper is declared inside
// collectPage. It measures what the three checks compare.

export type Box = { x: number; y: number; w: number; h: number }
type TextRun = Box & { text: string; selector: string }
export type FigmaBox = Box & { key: string; selector: string }
export type RuleFinding = { rule: string; selector: string; detail: string }

export type PageMeasure = {
  /** document textContent of the story root, whitespace collapsed. */
  textContent: string
  /** innerText of the story root (applies CSS text-transform), whitespace collapsed. */
  innerText: string
  /** Every non-empty text node, as rendered (text-transform applied), visible or not. */
  allTexts: string[]
  /** Placeholders and values of inputs and text areas. */
  fieldTexts: string[]
  /** Text runs that a viewer sees: inside the viewport and not clipped by an ancestor. */
  visibleTexts: TextRun[]
  /** Elements with data-figma, with their boxes in page coordinates. */
  figmaBoxes: FigmaBox[]
  rules: RuleFinding[]
  /** The box of the story's first element. */
  rootBox: Box
}

export function collectPage(rootSelector: string): PageMeasure {
  const root = document.querySelector(rootSelector)
  if (root === null) throw new Error(`No element ${rootSelector}`)
  const collapse = (s: string) => s.replace(/\s+/g, ' ').trim()
  const vw = window.innerWidth
  const vh = window.innerHeight

  const selectorOf = (el: Element): string => {
    const parts: string[] = []
    for (let e: Element | null = el; e !== null && e !== root && parts.length < 5; e = e.parentElement) {
      const figma = e.getAttribute('data-figma')
      if (figma !== null) {
        parts.unshift(`[data-figma="${figma}"]`)
        break
      }
      const cls = [...e.classList].find((c) => /^[a-z][a-z0-9-]*(__[a-z-]+)?$/i.test(c))
      const parent = e.parentElement
      const same = parent ? [...parent.children].filter((c) => c.tagName === e.tagName) : []
      const nth = same.length > 1 ? `:nth-of-type(${String(same.indexOf(e) + 1)})` : ''
      parts.unshift(`${e.tagName.toLowerCase()}${cls ? `.${cls}` : ''}${nth}`)
    }
    return parts.join(' > ')
  }

  const transform = (text: string, el: Element): string => {
    const t = getComputedStyle(el).textTransform
    if (t === 'uppercase') return text.toUpperCase()
    if (t === 'lowercase') return text.toLowerCase()
    if (t === 'capitalize') return text.replace(/\b\p{L}/gu, (c) => c.toUpperCase())
    return text
  }

  const clips = (el: Element): boolean => {
    const s = getComputedStyle(el)
    return s.overflowX !== 'visible' || s.overflowY !== 'visible'
  }

  /** The part of `rect` that is inside the viewport and every clipping ancestor. */
  const visiblePart = (rect: DOMRect, from: Element): Box | null => {
    let x1 = Math.max(rect.left, 0)
    let y1 = Math.max(rect.top, 0)
    let x2 = Math.min(rect.right, vw)
    let y2 = Math.min(rect.bottom, vh)
    for (let e: Element | null = from; e !== null; e = e.parentElement) {
      if (!clips(e)) continue
      const r = e.getBoundingClientRect()
      x1 = Math.max(x1, r.left)
      y1 = Math.max(y1, r.top)
      x2 = Math.min(x2, r.right)
      y2 = Math.min(y2, r.bottom)
    }
    // Under 2 px is the screen-reader-only pattern (a 1 px clipped box), not visible text.
    return x2 - x1 >= 2 && y2 - y1 >= 2 ? { x: x1, y: y1, w: x2 - x1, h: y2 - y1 } : null
  }

  const shown = (el: Element) => el.checkVisibility({ opacityProperty: true, visibilityProperty: true })

  // ---- text ----
  const allTexts: string[] = []
  const visibleTexts: TextRun[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode(); n !== null; n = walker.nextNode()) {
    const parent = n.parentElement
    const raw = collapse(n.textContent ?? '')
    if (parent === null || raw === '' || ['SCRIPT', 'STYLE', 'TEXTAREA'].includes(parent.tagName)) continue
    const text = transform(raw, parent)
    allTexts.push(text)
    if (!shown(parent)) continue
    const range = document.createRange()
    range.selectNodeContents(n)
    const rect = range.getBoundingClientRect()
    if (rect.width < 1 || rect.height < 1) continue
    const part = visiblePart(rect, parent)
    if (part === null) continue
    visibleTexts.push({ text, ...part, selector: selectorOf(parent) })
  }
  const fieldTexts: string[] = []
  for (const f of root.querySelectorAll('input, textarea')) {
    if (!(f instanceof HTMLInputElement || f instanceof HTMLTextAreaElement)) continue
    const value = collapse(f.value)
    const placeholder = collapse(f.placeholder)
    const text = value || placeholder
    if (text === '') continue
    fieldTexts.push(text)
    const part = shown(f) ? visiblePart(f.getBoundingClientRect(), f) : null
    if (part !== null) visibleTexts.push({ text, ...part, selector: selectorOf(f) })
  }

  // ---- data-figma boxes ----
  const figmaBoxes: FigmaBox[] = [...root.querySelectorAll('[data-figma]')].map((el) => {
    const r = el.getBoundingClientRect()
    return {
      key: el.getAttribute('data-figma') ?? '',
      selector: selectorOf(el),
      x: r.left + window.scrollX,
      y: r.top + window.scrollY,
      w: r.width,
      h: r.height,
    }
  })

  // ---- rules ----
  const rules: RuleFinding[] = []
  const hasTooltip = (el: Element): boolean => {
    for (let e: Element | null = el; e !== null && e !== root.parentElement; e = e.parentElement)
      if (e.hasAttribute('title') || e.hasAttribute('aria-describedby') || e.hasAttribute('data-tooltip')) return true
    return false
  }
  for (const el of [root, ...root.querySelectorAll('*')]) {
    if (!(el instanceof HTMLElement) || !shown(el)) continue
    const s = getComputedStyle(el)
    const hidden = (v: string) => v === 'hidden' || v === 'clip'
    const text = collapse(el.textContent)
    // 1. Text cut off by an element that hides its overflow. A box of 1 px
    // or less is the screen-reader-only pattern, which hides text on purpose.
    const srOnly = el.clientWidth <= 1 || el.clientHeight <= 1
    if (text !== '' && !srOnly && !hasTooltip(el)) {
      if (hidden(s.overflowX) && el.scrollWidth > el.clientWidth + 1)
        rules.push({
          rule: 'hiddenOverflow',
          selector: selectorOf(el),
          detail: `scrollWidth ${String(el.scrollWidth)} > clientWidth ${String(el.clientWidth)}, overflow-x ${s.overflowX}, text "${text.slice(0, 60)}"`,
        })
      else if (hidden(s.overflowY) && el.scrollHeight > el.clientHeight + 1)
        rules.push({
          rule: 'hiddenOverflow',
          selector: selectorOf(el),
          detail: `scrollHeight ${String(el.scrollHeight)} > clientHeight ${String(el.clientHeight)}, overflow-y ${s.overflowY}, text "${text.slice(0, 60)}"`,
        })
    }
    // 2. A scroll bar that takes space (classic scroll bars; Figma draws none).
    const borderX = Number.parseFloat(s.borderLeftWidth) + Number.parseFloat(s.borderRightWidth)
    const borderY = Number.parseFloat(s.borderTopWidth) + Number.parseFloat(s.borderBottomWidth)
    const barY = el.offsetWidth - el.clientWidth - borderX
    const barX = el.offsetHeight - el.clientHeight - borderY
    if ((barY > 0.5 || barX > 0.5) && el.clientHeight > 0)
      rules.push({
        rule: 'scrollBar',
        selector: selectorOf(el),
        detail: `${barY > 0.5 ? `vertical ${String(barY)} px` : ''}${barY > 0.5 && barX > 0.5 ? ', ' : ''}${barX > 0.5 ? `horizontal ${String(barX)} px` : ''}`,
      })
    // 4. A badge or pill stretched to its container's width.
    const badge =
      [...el.classList].some((c) => /(pill|badge|chip)(__root|__item)?$/i.test(c) && !/chips$/i.test(c)) ||
      /\b(pill|badge)\b/i.test(el.getAttribute('data-figma') ?? '')
    const parent = el.parentElement
    if (badge && parent !== null) {
      const ps = getComputedStyle(parent)
      const parentContent = parent.clientWidth - Number.parseFloat(ps.paddingLeft) - Number.parseFloat(ps.paddingRight)
      const range = document.createRange()
      range.selectNodeContents(el)
      const content =
        range.getBoundingClientRect().width +
        Number.parseFloat(s.paddingLeft) +
        Number.parseFloat(s.paddingRight) +
        borderX
      const width = el.getBoundingClientRect().width
      if (width >= parentContent - 1 && width > content + 2)
        rules.push({
          rule: 'badgeFullWidth',
          selector: selectorOf(el),
          detail: `width ${width.toFixed(1)} fills its container (${parentContent.toFixed(1)}); content needs ${content.toFixed(1)}`,
        })
    }
  }
  // The document itself must not scroll: the frame is the viewport.
  const doc = document.documentElement
  if (doc.scrollHeight > vh + 1 || doc.scrollWidth > vw + 1)
    rules.push({
      rule: 'scrollBar',
      selector: 'html',
      detail: `the page scrolls: ${String(doc.scrollWidth)}x${String(doc.scrollHeight)} in a ${String(vw)}x${String(vh)} frame`,
    })

  const first = root.firstElementChild ?? root
  const r = first.getBoundingClientRect()
  return {
    textContent: collapse(root.textContent),
    innerText: root instanceof HTMLElement ? collapse(root.innerText) : '',
    allTexts,
    fieldTexts,
    visibleTexts,
    figmaBoxes,
    rules,
    rootBox: { x: r.left, y: r.top, w: r.width, h: r.height },
  }
}
