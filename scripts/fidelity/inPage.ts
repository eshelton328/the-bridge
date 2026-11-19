/// <reference lib="dom" />
// Runs inside the rendered page. Playwright sends a function to the page as
// its source text, so no function here may use anything from its module
// scope. collectPage measures what the three checks compare; the pure
// helpers above it make the decisions, are unit-tested in inPage.test.ts,
// and reach the page as collectPage's second argument (collectPageScript).

export type Box = { x: number; y: number; w: number; h: number }
type TextRun = Box & {
  text: string
  selector: string
  /** Another element draws over part of the run in the render, such as an open menu (see coveredAt). */
  covered: boolean
}
export type FigmaBox = Box & { key: string; selector: string }
export type RuleFinding = { rule: string; selector: string; detail: string }
/** A drawn icon (an outermost svg the viewer sees), in page coordinates. */
export type IconBox = {
  selector: string
  x: number
  y: number
  w: number
  h: number
  /** Another element draws over the icon's centre (see coveredAt). */
  covered: boolean
}
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

/**
 * The points where coveredAt tests a text run: the middle of each line it
 * draws, at a tenth, half and nine tenths of the line's width.
 */
export function samplePoints(rects: readonly Edges[]): { x: number; y: number }[] {
  return rects
    .filter((r) => r.right - r.left >= 1 && r.bottom - r.top >= 1)
    .flatMap((r) => [0.1, 0.5, 0.9].map((f) => ({ x: r.left + (r.right - r.left) * f, y: (r.top + r.bottom) / 2 })))
}

/**
 * The lines a form field's text takes inside its box, each as wide as its
 * text and placed by text-align within the content box (the box less border
 * and padding). An input has one line, its whole height. A text area's
 * lines run down from the top of its content box, `lineHeight` each: each
 * paragraph of its text (`paragraphWidths`, one per line break) wraps at
 * the content width; a blank paragraph gives no line, and lines below the
 * content box are left out.
 */
export function fieldTextLines(field: {
  box: Edges
  startInset: number
  endInset: number
  topInset: number
  bottomInset: number
  lineHeight: number
  paragraphWidths: readonly number[]
  multiline: boolean
  textAlign: string
}): Edges[] {
  const left = field.box.left + field.startInset
  const right = field.box.right - field.endInset
  const room = Math.max(0, right - left)
  const place = (width: number, top: number, bottom: number): Edges => {
    const w = Math.max(0, Math.min(width, room))
    if (field.textAlign === 'center') {
      const middle = (left + right) / 2
      return { left: middle - w / 2, top, right: middle + w / 2, bottom }
    }
    if (field.textAlign === 'right' || field.textAlign === 'end') return { left: right - w, top, right, bottom }
    return { left, top, right: left + w, bottom }
  }
  if (!field.multiline) return [place(field.paragraphWidths[0] ?? 0, field.box.top, field.box.bottom)]
  const widths = field.paragraphWidths.flatMap((w) => {
    if (room <= 0 || w <= 0) return [0]
    const n = Math.ceil(w / room)
    return [...Array.from({ length: n - 1 }, () => room), w - (n - 1) * room]
  })
  const top = field.box.top + field.topInset
  const bottom = field.box.bottom - field.bottomInset
  return widths.flatMap((w, i) => {
    const lineTop = top + i * field.lineHeight
    const lineBottom = lineTop + field.lineHeight
    return w > 0 && lineBottom <= bottom + 1 ? [place(w, lineTop, lineBottom)] : []
  })
}

/**
 * True when an element draws something of its own over what lies beneath:
 * a background colour that is not fully transparent, a background image,
 * a backdrop filter, or replaced content (an image, SVG, canvas, video or
 * frame). A transparent box, such as a positioner or a layout wrapper,
 * lets the text under it show through.
 */
export function paints(el: {
  tagName: string
  backgroundColor: string
  backgroundImage: string
  backdropFilter: string
}): boolean {
  if (['IMG', 'SVG', 'CANVAS', 'VIDEO', 'IFRAME', 'OBJECT', 'EMBED'].includes(el.tagName.toUpperCase())) return true
  if (el.backgroundImage !== 'none' && el.backgroundImage !== '') return true
  if (el.backdropFilter !== 'none' && el.backdropFilter !== '') return true
  const color = el.backgroundColor.trim()
  if (color === '' || color === 'transparent') return false
  const args = /\(([^)]*)\)/.exec(color)?.[1]
  if (args === undefined) return true
  // rgba(r, g, b, a), rgb(r g b / a), color(srgb r g b / a): the alpha is last.
  const alpha = args.includes('/')
    ? args.split('/').at(-1)
    : args.split(',').length === 4
      ? args.split(',').at(-1)
      : '1'
  const a = (alpha ?? '1').trim()
  const value = a.endsWith('%') ? Number.parseFloat(a) / 100 : Number.parseFloat(a)
  return Number.isNaN(value) || value > 0
}

/**
 * One element at a sample point, from the top of the stack down: whether it
 * holds the run or is one of its ancestors (`related`), whether it shows at
 * all (`shown`: not opacity 0 or hidden) and whether it paints (see paints).
 */
export type Hit = { related: boolean; shown: boolean; paints: boolean }

/**
 * True when another element covers a text run at any of its sample points:
 * going down the stack of elements at the point (elementsFromPoint), one
 * that is not the run's own element or one of its ancestors (a child of it
 * counts), shows and paints
 * comes before the run's own element or an ancestor of it. A point with no
 * element (outside the viewport) is not covered here; fullyVisible judges
 * the viewport.
 */
export function coveredAt(stacks: readonly (readonly Hit[])[]): boolean {
  return stacks.some((stack) => {
    for (const hit of stack) {
      if (hit.related) return false
      if (hit.shown && hit.paints) return true
    }
    return false
  })
}

/**
 * Whether an element in the stack over an icon draws there: a shape of
 * another svg (elementsFromPoint returns a shape only where it paints), or
 * an element with a fill of its own. An svg element counts only by its
 * own background, as it is hit over its whole box, transparent parts too.
 */
export function iconHitPaints(
  el: {
    tagName: string
    isSvgShape: boolean
    backgroundColor: string
    backgroundImage: string
    backdropFilter: string
  },
  fills: typeof paints,
): boolean {
  if (el.isSvgShape) return true
  return fills({ ...el, tagName: el.tagName.toLowerCase() === 'svg' ? 'g' : el.tagName })
}

/** What iconHasMark reads from one shape of an icon (a path, a circle, a use). */
export type IconShape = {
  /** checkVisibility with opacity and visibility: not hidden, not opacity 0. */
  shown: boolean
  width: number
  height: number
  /** The computed stroke and fill: 'none', a colour or a paint server url. */
  stroke: string
  fill: string
}

/**
 * True when an icon draws a mark: one of its shapes shows, has a box (a
 * straight line has one side of zero) and strokes or fills with a colour
 * that is not none or fully transparent (paints judges the colour). An svg
 * with a size but no shape, hidden shapes or unpainted ones draws nothing.
 */
export function iconHasMark(shapes: readonly IconShape[], fills: typeof paints): boolean {
  const colours = (c: string) =>
    c.trim() !== 'none' && fills({ tagName: 'g', backgroundColor: c, backgroundImage: 'none', backdropFilter: 'none' })
  return shapes.some((s) => s.shown && (s.width > 0 || s.height > 0) && (colours(s.stroke) || colours(s.fill)))
}

/**
 * True when a text node's element is the character of a library Glyph (a
 * `glyph__char` span in a `glyph__root`): the ✗ or ✓ that the Glyph keeps
 * in the text at font size 0 and transparent, while its icon, an SVG beside
 * the character in the root, draws the mark. Such a character counts as
 * shown only when that icon passes the same rules as text (fullyVisible
 * and not covered); a zero-size run anywhere else is still not shown.
 */
export function isGlyphChar(el: { classes: readonly string[]; parentClasses: readonly string[] }): boolean {
  return el.classes.includes('glyph__char') && el.parentClasses.includes('glyph__root')
}

/** What scrollBars reads from one element: its computed overflow and its sizes. */
export type ScrollBox = {
  overflowX: string
  overflowY: string
  clientHeight: number
  /** offsetWidth less clientWidth and the side borders: the width a vertical bar takes. */
  barWidth: number
  /** offsetHeight less clientHeight and the top and bottom borders: the height a horizontal bar takes. */
  barHeight: number
}

/**
 * The scroll bars an element shows, as the detail of a scrollBar finding,
 * or '' when it shows none: a bar that takes space (more than 0.5 px), on
 * an axis whose overflow is auto or scroll. A box that scrolls its overflow
 * with no bar that takes space is correct design (d-107). The axis must
 * scroll because Chrome leaves an input's padding out of its clientWidth,
 * so a padded input (overflow clip) has that space with no bar.
 */
export function scrollBars(el: ScrollBox): string {
  if (el.clientHeight <= 0) return ''
  const scrolls = (v: string) => v === 'auto' || v === 'scroll'
  const bars: string[] = []
  if (scrolls(el.overflowY) && el.barWidth > 0.5)
    bars.push(`vertical ${String(el.barWidth)} px, overflow-y ${el.overflowY}`)
  if (scrolls(el.overflowX) && el.barHeight > 0.5)
    bars.push(`horizontal ${String(el.barHeight)} px, overflow-x ${el.overflowX}`)
  return bars.join(', ')
}

type Helpers = {
  fullyVisible: typeof fullyVisible
  isPortalRoot: typeof isPortalRoot
  fieldText: typeof fieldText
  scrollBars: typeof scrollBars
  samplePoints: typeof samplePoints
  fieldTextLines: typeof fieldTextLines
  paints: typeof paints
  coveredAt: typeof coveredAt
  iconHitPaints: typeof iconHitPaints
  isGlyphChar: typeof isGlyphChar
  iconHasMark: typeof iconHasMark
}

/** The source that page.evaluate runs: collectPage called with the helpers it needs. */
export function collectPageScript(rootSelector: string): string {
  return `(${collectPage.toString()})(${JSON.stringify(rootSelector)}, { fullyVisible: ${fullyVisible.toString()}, isPortalRoot: ${isPortalRoot.toString()}, fieldText: ${fieldText.toString()}, scrollBars: ${scrollBars.toString()}, samplePoints: ${samplePoints.toString()}, fieldTextLines: ${fieldTextLines.toString()}, paints: ${paints.toString()}, coveredAt: ${coveredAt.toString()}, iconHitPaints: ${iconHitPaints.toString()}, isGlyphChar: ${isGlyphChar.toString()}, iconHasMark: ${iconHasMark.toString()} })`
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
  /**
   * Text runs inside the viewport and every clipping ancestor; `covered` marks
   * the runs another element draws over in the render.
   */
  visibleTexts: TextRun[]
  /** Elements with data-figma, with their boxes in page coordinates. */
  figmaBoxes: FigmaBox[]
  /** Every outermost svg that is shown and has a size: the icons the rules check compares with Figma's. */
  iconBoxes: IconBox[]
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
  // A run is covered when another element paints over it (an open menu over
  // a pane). Hit testing follows paint order, so for the test every element
  // takes pointer events: an element with pointer-events none still paints.
  const hitStyle = document.createElement('style')
  hitStyle.textContent = '*, *::before, *::after { pointer-events: auto !important; }'
  document.head.append(hitStyle)
  const stackAt = (x: number, y: number, own: Element) => {
    const hits: { related: boolean; shown: boolean; paints: boolean }[] = []
    for (const t of document.elementsFromPoint(x, y)) {
      // The run's own element and its ancestors only: a child of that element
      // (a positioned badge) can paint over the element's own text.
      const related = t.contains(own)
      const ts = getComputedStyle(t)
      hits.push({
        related,
        shown: shown(t),
        paints: helpers.paints({
          tagName: t.tagName,
          backgroundColor: ts.backgroundColor,
          backgroundImage: ts.backgroundImage,
          backdropFilter: ts.backdropFilter,
        }),
      })
      if (related) break
    }
    return hits
  }
  // The stack over an icon's centre. The icon's own shapes are its own; an
  // svg element itself is hit over its whole box, so only a shape another
  // svg paints there (a path, a circle) covers the icon, as does any
  // element with a fill (helpers.paints).
  const iconStackAt = (x: number, y: number, own: Element) => {
    const hits: { related: boolean; shown: boolean; paints: boolean }[] = []
    for (const t of document.elementsFromPoint(x, y)) {
      const related = t.contains(own) || own.contains(t)
      const ts = getComputedStyle(t)
      hits.push({
        related,
        shown: shown(t),
        paints: helpers.iconHitPaints(
          {
            tagName: t.tagName,
            isSvgShape: t instanceof SVGGeometryElement,
            backgroundColor: ts.backgroundColor,
            backgroundImage: ts.backgroundImage,
            backdropFilter: ts.backdropFilter,
          },
          helpers.paints,
        ),
      })
      if (t.contains(own)) break
    }
    return hits
  }
  // A Glyph's run is its icon, so its stacks are read as an icon's: a
  // transparent svg box over it does not cover it (iconStackAt).
  const coveredRun = (rects: readonly Edges[], own: Element, stack = stackAt) =>
    helpers.coveredAt(helpers.samplePoints(rects).map((p) => stack(p.x, p.y, own)))
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
    // A Glyph's character draws nothing; its icon, beside it in the Glyph's
    // root, shows it. So the icon is measured in its place, by the same
    // rules: shown, in view, at least 1 px and not covered. No icon, no run.
    const glyphRoot = parent.parentElement
    const glyph =
      glyphRoot !== null &&
      helpers.isGlyphChar({ classes: [...parent.classList], parentClasses: [...glyphRoot.classList] })
    const own = glyph ? glyphRoot.querySelector(':scope > svg') : parent
    if (own === null || !shown(own)) continue
    // A sized icon with no shape, or only hidden or unpainted ones, shows no mark.
    if (
      glyph &&
      !helpers.iconHasMark(
        [...own.querySelectorAll('path, circle, rect, line, polyline, polygon, ellipse, use')].map((s) => {
          const box = s.getBoundingClientRect()
          const ss = getComputedStyle(s)
          return { shown: shown(s), width: box.width, height: box.height, stroke: ss.stroke, fill: ss.fill }
        }),
        helpers.paints,
      )
    )
      continue
    let rects: DOMRect[]
    if (glyph) rects = [own.getBoundingClientRect()]
    else {
      const range = document.createRange()
      range.selectNodeContents(n)
      rects = [...range.getClientRects()]
    }
    // Every line of the string must be in view: a sentence that a scroll box
    // or an ellipsis cuts is not visible, though part of it shows.
    if (!helpers.fullyVisible(rects, clipsOf(glyph ? glyphRoot : parent), viewport)) continue
    visibleTexts.push({
      text,
      ...boxOf(rects),
      selector: selectorOf(parent),
      covered: coveredRun(rects, own, glyph ? iconStackAt : stackAt),
    })
  }
  const fieldTexts: string[] = []
  for (const f of roots.flatMap((r) => [...r.querySelectorAll('input, textarea')])) {
    if (!(f instanceof HTMLInputElement || f instanceof HTMLTextAreaElement)) continue
    const text = helpers.fieldText({ tagName: f.tagName, type: f.type, value: f.value, placeholder: f.placeholder })
    if (text === '') continue
    fieldTexts.push(text)
    const rect = f.getBoundingClientRect()
    if (shown(f) && helpers.fullyVisible([rect], clipsOf(f.parentElement ?? f), viewport)) {
      // A field's box holds more than its text (an icon over its padding, a
      // menu over its empty end or below its last line), so only the lines
      // its text takes are tested.
      const fs = getComputedStyle(f)
      const context = document.createElement('canvas').getContext('2d')
      if (context !== null) context.font = fs.font
      const multiline = f instanceof HTMLTextAreaElement
      const shownText = f.value !== '' ? f.value : f.placeholder
      const paragraphs = multiline ? shownText.split('\n') : [text]
      const lineHeight =
        fs.lineHeight === 'normal' ? Number.parseFloat(fs.fontSize) * 1.2 : Number.parseFloat(fs.lineHeight)
      const lines = helpers.fieldTextLines({
        box: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
        startInset: Number.parseFloat(fs.borderLeftWidth) + Number.parseFloat(fs.paddingLeft),
        endInset: Number.parseFloat(fs.borderRightWidth) + Number.parseFloat(fs.paddingRight),
        topInset: Number.parseFloat(fs.borderTopWidth) + Number.parseFloat(fs.paddingTop),
        bottomInset: Number.parseFloat(fs.borderBottomWidth) + Number.parseFloat(fs.paddingBottom),
        lineHeight,
        paragraphWidths: paragraphs.map((p) => (context === null ? rect.width : context.measureText(p).width)),
        multiline,
        textAlign: fs.textAlign,
      })
      const covered = helpers.coveredAt(helpers.samplePoints(lines).map((p) => stackAt(p.x, p.y, f)))
      visibleTexts.push({ text, ...boxOf([rect]), selector: selectorOf(f), covered })
    }
  }
  // Each outermost svg that is shown, and whether another element draws
  // over its centre (an svg under a scrim or a side panel is not an icon
  // the viewer sees; the stack is read with pointer events on, above).
  const iconBoxes: IconBox[] = roots
    .flatMap((r) => [...r.querySelectorAll('svg')])
    .filter((el) => el.parentElement?.closest('svg') == null && shown(el))
    .map((el) => {
      const r = el.getBoundingClientRect()
      return {
        selector: selectorOf(el),
        x: r.left + window.scrollX,
        y: r.top + window.scrollY,
        w: r.width,
        h: r.height,
        covered: helpers.coveredAt([iconStackAt(r.left + r.width / 2, r.top + r.height / 2, el)]),
      }
    })
    .filter((b) => b.w > 0 && b.h > 0)
  hitStyle.remove()

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
    const bars = helpers.scrollBars({
      overflowX: s.overflowX,
      overflowY: s.overflowY,
      clientHeight: el.clientHeight,
      barWidth: el.offsetWidth - el.clientWidth - borderX,
      barHeight: el.offsetHeight - el.clientHeight - borderY,
    })
    if (bars !== '') rules.push({ rule: 'scrollBar', selector: selectorOf(el), detail: bars })
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
    iconBoxes,
    rules,
    rootBox: { x: r.left, y: r.top, w: r.width, h: r.height },
  }
}
