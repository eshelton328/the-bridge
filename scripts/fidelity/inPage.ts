/// <reference lib="dom" />
// Runs inside the rendered page. Playwright sends a function to the page as
// its source text, so no function here may use anything from its module
// scope. collectPage measures what the three checks compare; the pure
// helpers above it make the decisions, are unit-tested in inPage.test.ts,
// and reach the page as collectPage's second argument (collectPageScript).

export type Box = { x: number; y: number; w: number; h: number }
type TextRun = Box & { text: string; selector: string }
export type FigmaBox = Box & { key: string; selector: string }
export type RuleFinding = { rule: string; selector: string; detail: string }
/** A rectangle by its edges, in viewport coordinates; an edge may be infinite. */
export type Edges = { left: number; top: number; right: number; bottom: number }

/**
 * True when a string is fully visible: it draws at least one rect, and each
 * rect it draws (one per line) lies inside the viewport and inside the clip
 * box of every ancestor that clips. A string cut by a scroll box, an
 * ellipsis or the viewport edge is not visible, even in part. The 1 px slack
 * absorbs sub-pixel rounding and a font's content area that reaches past a
 * tight line box; it is not enough to hide a clipped glyph.
 */
export function fullyVisible(rects: readonly Edges[], clips: readonly Edges[], viewport: Edges): boolean {
  const slack = 1
  const drawn = rects.filter((r) => r.right - r.left >= 1 && r.bottom - r.top >= 1)
  const inside = (r: Edges, c: Edges) =>
    r.left >= c.left - slack && r.top >= c.top - slack && r.right <= c.right + slack && r.bottom <= c.bottom + slack
  return drawn.length > 0 && drawn.every((r) => inside(r, viewport) && clips.every((c) => inside(r, c)))
}

/**
 * True when a direct child of body is portal content that a viewer sees with
 * the story: an Ark/Zag positioner, dialog backdrop or any other element a
 * React portal mounts in body. Storybook's own chrome (`sb-` classes,
 * `#storybook-…` ids), the element that holds the story root, and elements
 * that render nothing (script, style) are not.
 */
export function isPortalRoot(el: {
  tagName: string
  id: string
  classes: readonly string[]
  holdsStoryRoot: boolean
}): boolean {
  if (el.holdsStoryRoot) return false
  if (['SCRIPT', 'STYLE', 'LINK', 'META', 'NOSCRIPT', 'TEMPLATE'].includes(el.tagName.toUpperCase())) return false
  if (el.id.startsWith('storybook-')) return false
  return !el.classes.some((c) => c.startsWith('sb-'))
}

/**
 * The text a form field shows, whitespace collapsed: its value, else its
 * placeholder. The value of a checkbox, radio, hidden or password input is
 * not text a viewer reads (a form value such as "hono-rpc", or masked
 * characters), so it gives no text; its placeholder counts only while it
 * is empty.
 */
export function fieldText(field: { tagName: string; type: string; value: string; placeholder: string }): string {
  const collapse = (s: string) => s.replace(/\s+/g, ' ').trim()
  const valueHidden =
    field.tagName.toUpperCase() === 'INPUT' &&
    ['checkbox', 'radio', 'hidden', 'password'].includes(field.type.toLowerCase())
  // The browser shows the placeholder only while the field is empty.
  if (field.value !== '') return valueHidden ? '' : collapse(field.value)
  return collapse(field.placeholder)
}

type Helpers = { fullyVisible: typeof fullyVisible; isPortalRoot: typeof isPortalRoot; fieldText: typeof fieldText }

/** The source that page.evaluate runs: collectPage called with the helpers it needs. */
export function collectPageScript(rootSelector: string): string {
  return `(${collectPage.toString()})(${JSON.stringify(rootSelector)}, { fullyVisible: ${fullyVisible.toString()}, isPortalRoot: ${isPortalRoot.toString()}, fieldText: ${fieldText.toString()} })`
}

export type PageMeasure = {
  /** document textContent of the story root and its portals, whitespace collapsed. */
  textContent: string
  /** innerText of the story root and its portals (applies CSS text-transform), whitespace collapsed. */
  innerText: string
  /** Every non-empty text node, as rendered (text-transform applied), visible or not. */
  allTexts: string[]
  /** Placeholders and values of inputs and text areas (see fieldText). */
  fieldTexts: string[]
  /** Text runs that a viewer sees in full: inside the viewport and every clipping ancestor. */
  visibleTexts: TextRun[]
  /** Elements with data-figma, with their boxes in page coordinates. */
  figmaBoxes: FigmaBox[]
  rules: RuleFinding[]
  /** The box of the story's first element. */
  rootBox: Box
}

function collectPage(rootSelector: string, helpers: Helpers): PageMeasure {
  const root = document.querySelector(rootSelector)
  if (root === null) throw new Error(`No element ${rootSelector}`)
  // An open popover, menu or dialog renders in a portal: a direct child of
  // body outside the story root (Ark UI's Portal, any createPortal). The
  // viewer sees it, so its text, boxes and rules count with the root's.
  const portals = [...document.body.children].filter((e) =>
    helpers.isPortalRoot({ tagName: e.tagName, id: e.id, classes: [...e.classList], holdsStoryRoot: e.contains(root) }),
  )
  const roots = [root, ...portals]
  const collapse = (s: string) => s.replace(/\s+/g, ' ').trim()
  const vw = window.innerWidth
  const vh = window.innerHeight

  const selectorOf = (el: Element): string => {
    const parts: string[] = []
    for (
      let e: Element | null = el;
      e !== null && !roots.includes(e) && e !== document.body && parts.length < 5;
      e = e.parentElement
    ) {
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

  const viewport = { left: 0, top: 0, right: vw, bottom: vh }
  /**
   * The clip box (padding box) of each ancestor of `from` that clips, below
   * body; the viewport stands for html and body. An axis whose overflow is
   * visible does not clip.
   */
  const clipsOf = (from: Element) => {
    const out: { left: number; top: number; right: number; bottom: number }[] = []
    for (let e: Element | null = from; e !== null && e !== document.body; e = e.parentElement) {
      if (!clips(e)) continue
      const s = getComputedStyle(e)
      const r = e.getBoundingClientRect()
      const left = r.left + e.clientLeft
      const top = r.top + e.clientTop
      const byX = s.overflowX !== 'visible'
      const byY = s.overflowY !== 'visible'
      out.push({
        left: byX ? left : -Infinity,
        right: byX ? left + e.clientWidth : Infinity,
        top: byY ? top : -Infinity,
        bottom: byY ? top + e.clientHeight : Infinity,
      })
    }
    return out
  }
  const boxOf = (rects: readonly DOMRect[]): Box => {
    const left = Math.min(...rects.map((r) => r.left))
    const top = Math.min(...rects.map((r) => r.top))
    return {
      x: left,
      y: top,
      w: Math.max(...rects.map((r) => r.right)) - left,
      h: Math.max(...rects.map((r) => r.bottom)) - top,
    }
  }

  const shown = (el: Element) => el.checkVisibility({ opacityProperty: true, visibilityProperty: true })

  // ---- text ----
  const allTexts: string[] = []
  const visibleTexts: TextRun[] = []
  const textNodes: Node[] = []
  for (const r of roots) {
    const walker = document.createTreeWalker(r, NodeFilter.SHOW_TEXT)
    for (let n = walker.nextNode(); n !== null; n = walker.nextNode()) textNodes.push(n)
  }
  for (const n of textNodes) {
    const parent = n.parentElement
    const raw = collapse(n.textContent ?? '')
    if (parent === null || raw === '' || ['SCRIPT', 'STYLE', 'TEXTAREA'].includes(parent.tagName)) continue
    const text = transform(raw, parent)
    allTexts.push(text)
    if (!shown(parent)) continue
    const range = document.createRange()
    range.selectNodeContents(n)
    const rects = [...range.getClientRects()]
    // Every line of the string must be in view: a sentence that a scroll box
    // or an ellipsis cuts is not visible, though part of it shows.
    if (!helpers.fullyVisible(rects, clipsOf(parent), viewport)) continue
    visibleTexts.push({ text, ...boxOf(rects), selector: selectorOf(parent) })
  }
  const fieldTexts: string[] = []
  for (const f of roots.flatMap((r) => [...r.querySelectorAll('input, textarea')])) {
    if (!(f instanceof HTMLInputElement || f instanceof HTMLTextAreaElement)) continue
    const text = helpers.fieldText({ tagName: f.tagName, type: f.type, value: f.value, placeholder: f.placeholder })
    if (text === '') continue
    fieldTexts.push(text)
    const rect = f.getBoundingClientRect()
    if (shown(f) && helpers.fullyVisible([rect], clipsOf(f.parentElement ?? f), viewport))
      visibleTexts.push({ text, ...boxOf([rect]), selector: selectorOf(f) })
  }

  // ---- data-figma boxes ----
  const figmaBoxes: FigmaBox[] = roots
    .flatMap((r) => [...r.querySelectorAll('[data-figma]')])
    .map((el) => {
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
    for (let e: Element | null = el; e !== null && e !== document.body; e = e.parentElement)
      if (e.hasAttribute('title') || e.hasAttribute('aria-describedby') || e.hasAttribute('data-tooltip')) return true
    return false
  }
  for (const el of roots.flatMap((r) => [r, ...r.querySelectorAll('*')])) {
    if (!(el instanceof HTMLElement) || !shown(el)) continue
    const s = getComputedStyle(el)
    // A scroll box counts too: with overlay scroll bars (macOS, headless
    // Chromium) nothing shows that its content goes on, so the viewer sees
    // the text cut off, as in a popover held to the space beside its trigger.
    const hidden = (v: string) => v === 'hidden' || v === 'clip' || v === 'auto' || v === 'scroll'
    const text = collapse(el.textContent)
    // 1. Text cut off by an element that hides or scrolls its overflow. A box
    // of 1 px or less is the screen-reader-only pattern, which hides text on
    // purpose.
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
    textContent: collapse(roots.map((r) => r.textContent).join(' ')),
    innerText: collapse(roots.map((r) => (r instanceof HTMLElement ? r.innerText : '')).join(' ')),
    allTexts,
    fieldTexts,
    visibleTexts,
    figmaBoxes,
    rules,
    rootBox: { x: r.left, y: r.top, w: r.width, h: r.height },
  }
}
