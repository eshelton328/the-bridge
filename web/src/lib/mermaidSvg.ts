// Draws a Mermaid diagram as an SVG string, for MermaidDiagram (blocks/).
// Mermaid is about 700 KB, so it loads with a dynamic import the first time
// a message holds a mermaid block; the first chat paint does not carry it.
// Safety: securityLevel 'strict' turns off click handlers and encodes the
// labels' HTML, htmlLabels false keeps every label as SVG text (no
// foreignObject), and the caller shows the SVG only through an <img> with a
// blob: URL, where a browser runs no script and loads nothing else. The
// colours come from the library's tokens as the page has them now (the
// `dark` class on <html>, d-119): Mermaid's 'base' theme with the token
// values as its theme variables. An <img> cannot use the page's Geist font,
// so the diagram uses the system sans font, the same font Mermaid measures
// its labels in.

/** The CSS variables Panda writes for the library tokens that colour a diagram. */
const tokenVariables = {
  text: '--colors-fg-default',
  muted: '--colors-fg-muted',
  fill: '--colors-surface-raised',
  well: '--colors-surface-well',
  line: '--colors-fg-muted',
  border: '--colors-border-default',
  accent: '--colors-fg-accent',
} as const

/** The token colours a diagram takes, by the role each has in it. */
export type DiagramColours = Record<keyof typeof tokenVariables, string>

const systemFont = 'ui-sans-serif, system-ui, -apple-system, sans-serif'

/** The token colours as `style` resolves them now; an empty value means the page has no such variable. */
export function diagramColours(style: Pick<CSSStyleDeclaration, 'getPropertyValue'>): DiagramColours {
  const read = (name: string) => style.getPropertyValue(name).trim()
  return {
    text: read(tokenVariables.text),
    muted: read(tokenVariables.muted),
    fill: read(tokenVariables.fill),
    well: read(tokenVariables.well),
    line: read(tokenVariables.line),
    border: read(tokenVariables.border),
    accent: read(tokenVariables.accent),
  }
}

/**
 * The colours that have a value: a page with no token CSS (a test, a page
 * that failed to load it) gives '', which Mermaid refuses ("Unsupported
 * color format"), so such a colour keeps Mermaid's own value.
 */
function withoutEmpty(colours: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(colours).filter(([, value]) => value !== ''))
}

/** Mermaid's settings for one render: strict, SVG labels only, the 'base' theme in the token colours. */
function mermaidConfig(colours: DiagramColours, dark: boolean) {
  return {
    startOnLoad: false,
    securityLevel: 'strict',
    htmlLabels: false,
    flowchart: { htmlLabels: false },
    theme: 'base',
    darkMode: dark,
    fontFamily: systemFont,
    themeVariables: {
      ...withoutEmpty({
        background: colours.well,
        primaryColor: colours.fill,
        primaryTextColor: colours.text,
        primaryBorderColor: colours.accent,
        secondaryColor: colours.well,
        secondaryTextColor: colours.text,
        secondaryBorderColor: colours.border,
        tertiaryColor: colours.well,
        tertiaryTextColor: colours.text,
        tertiaryBorderColor: colours.border,
        lineColor: colours.line,
        textColor: colours.text,
        mainBkg: colours.fill,
        nodeBorder: colours.accent,
        clusterBkg: colours.well,
        clusterBorder: colours.border,
        edgeLabelBackground: colours.well,
        noteBkgColor: colours.fill,
        noteTextColor: colours.text,
        noteBorderColor: colours.border,
        actorBkg: colours.fill,
        actorBorder: colours.accent,
        actorTextColor: colours.text,
        signalColor: colours.text,
        signalTextColor: colours.text,
        labelTextColor: colours.text,
      }),
      darkMode: dark,
      fontFamily: systemFont,
    },
  } as const
}

/** A drawn diagram: the SVG text and its size in px. */
export type DrawnDiagram = { svg: string; width: number; height: number }

/** The result of a draw: the diagram, or the reason it did not draw. */
export type DrawResult = { ok: true; diagram: DrawnDiagram } | { ok: false; reason: string }

/**
 * Gives the SVG a fixed size from its viewBox, so an <img> of it has the
 * diagram's own size: Mermaid writes width="100%" and a max-width style,
 * which an image has no box for. Returns undefined when the text is not
 * an SVG with a viewBox.
 */
export function sizedSvg(svg: string, parser: DOMParser = new DOMParser()): DrawnDiagram | undefined {
  const doc = parser.parseFromString(svg, 'image/svg+xml')
  const root = doc.documentElement
  if (root.nodeName !== 'svg' || doc.querySelector('parsererror') !== null) return undefined
  const box = (root.getAttribute('viewBox') ?? '')
    .trim()
    .split(/[\s,]+/)
    .map(Number)
  const [, , width, height] = box
  if (box.length !== 4 || width === undefined || height === undefined || !(width > 0) || !(height > 0)) return undefined
  const w = Math.ceil(width)
  const h = Math.ceil(height)
  root.setAttribute('width', String(w))
  root.setAttribute('height', String(h))
  root.removeAttribute('style')
  return {
    svg: new XMLSerializer().serializeToString(root),
    width: w,
    height: h,
  }
}

// Mermaid's settings are global, so draws run one after another: each sets
// its theme, then draws.
let queue: Promise<unknown> = Promise.resolve()
let count = 0

/** Draws `source` with Mermaid in the given colours. It never throws: a parse error comes back as the reason. */
export function drawMermaid(source: string, colours: DiagramColours, dark: boolean): Promise<DrawResult> {
  const run = async (): Promise<DrawResult> => {
    try {
      const { default: mermaid } = await import('mermaid')
      mermaid.initialize(mermaidConfig(colours, dark))
      count += 1
      const { svg } = await mermaid.render(`bridge-mermaid-${String(count)}`, source)
      const sized = sizedSvg(svg)
      return sized === undefined ? { ok: false, reason: 'the diagram has no size' } : { ok: true, diagram: sized }
    } catch (error) {
      return {
        ok: false,
        reason: error instanceof Error ? (error.message.split('\n')[0] ?? error.message) : 'the diagram did not parse',
      }
    }
  }
  const next = queue.then(run, run)
  queue = next
  return next
}
