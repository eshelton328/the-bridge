// Reads the XML that the Figma MCP tool get_metadata returns and turns one
// frame of it into a reference record (frame.json): every named layer with
// its box relative to the frame's top-left corner and, for a text layer,
// its characters. get_metadata names a new text layer after its characters,
// but a designer can rename one ("title"), and get_metadata does not return
// the characters. So the text is the layer's entry in `characters` (read
// from Figma with use_figma) and the name only when it has none. Pure
// functions; buildReferences.ts does the I/O.

export type XmlNode = {
  tag: string
  id: string
  name: string
  x: number
  y: number
  w: number
  h: number
  /** get_metadata's `hidden="true"`: Figma does not draw the layer or its children. */
  hidden?: boolean
  children: XmlNode[]
}

export type Layer = {
  id: string
  name: string
  type: string
  /** Box relative to the frame's top-left corner, in CSS pixels. */
  x: number
  y: number
  w: number
  h: number
  /** The layer names from the frame down to this layer's parent, joined with " > ". */
  path: string
  text?: string | undefined
}

type Exclusion = { id: string; text: string; reason: string }

export type FrameRef = {
  frameId: string
  code: string
  name: string
  node: string
  fileKey: string
  device: 'desktop' | 'tablet' | 'phone'
  w: number
  h: number
  /** Position tolerance in px for checkPosition; d-loop default 4. */
  tolerance: number
  source: string
  layers: Layer[]
  exclude: Exclusion[]
  /** Layers left out of `layers` and why, by name. */
  skipped: Record<string, number>
}

const entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body: string) => {
    if (body.startsWith('#x') || body.startsWith('#X')) return String.fromCodePoint(Number.parseInt(body.slice(2), 16))
    if (body.startsWith('#')) return String.fromCodePoint(Number.parseInt(body.slice(1), 10))
    return entities[body] ?? whole
  })
}

/** Parses get_metadata XML (one root element; text after it is ignored). */
export function parseMetadata(xml: string): XmlNode {
  const tagRe = /<(\/?)([a-z-]+)((?:\s+[a-zA-Z-]+="[^"]*")*)\s*(\/?)>/g
  const attrRe = /([a-zA-Z-]+)="([^"]*)"/g
  const stack: XmlNode[] = []
  let root: XmlNode | undefined
  for (const m of xml.matchAll(tagRe)) {
    const [, closing, tag = '', attrText = '', selfClosing] = m
    if (closing) {
      const done = stack.pop()
      if (done?.tag !== tag) throw new Error(`Unbalanced </${tag}> at ${String(m.index)}`)
      if (stack.length === 0) {
        root = done
        break
      }
      continue
    }
    const attrs: Record<string, string> = {}
    for (const a of attrText.matchAll(attrRe)) attrs[a[1] ?? ''] = decodeEntities(a[2] ?? '')
    const node: XmlNode = {
      tag,
      id: attrs.id ?? '',
      name: attrs.name ?? '',
      x: Number(attrs.x ?? 0),
      y: Number(attrs.y ?? 0),
      w: Number(attrs.width ?? 0),
      h: Number(attrs.height ?? 0),
      children: [],
    }
    if (attrs.hidden === 'true') node.hidden = true
    const parent = stack.at(-1)
    if (parent) parent.children.push(node)
    if (selfClosing) {
      if (!parent) return node
    } else stack.push(node)
  }
  if (root === undefined) throw new Error('No complete root element in the metadata')
  return root
}

function* walk(node: XmlNode): Generator<XmlNode> {
  yield node
  for (const c of node.children) yield* walk(c)
}

/** "D1 · Inbox, a next step" -> "D1"; null when the name has no frame code. */
export function frameCode(name: string): string | null {
  return /^([A-Z]\d+) · /.exec(name)?.[1] ?? null
}

/** "D1" -> "D01": two digits, so folders sort in Figma order. */
export function frameIdOf(code: string): string {
  const m = /^([A-Z])(\d+)$/.exec(code)
  if (!m) throw new Error(`Not a frame code: ${code}`)
  return `${m[1] ?? ''}${(m[2] ?? '').padStart(2, '0')}`
}

/** Accepts "D1", "D01" or "d1" and returns "D01". */
export function normaliseFrameId(id: string): string {
  return frameIdOf(id.toUpperCase().replace(/^([A-Z])0*(\d)/, '$1$2'))
}

const deviceOf = (code: string): FrameRef['device'] =>
  code.startsWith('D') ? 'desktop' : code.startsWith('T') ? 'tablet' : 'phone'

/** Decorative layers that carry no design meaning: the backdrop's stars. */
const decorative = new Set(['star'])

/** The `exclude` reason of the iOS status bar's text; checkPosition finds the bar by it. */
export const statusBarReason = 'iOS status bar (design-only chrome, d-089)'

// Design-only chrome (d-089): the iOS status bar, keyboard and home
// indicator are drawn in Figma but are not app UI, so their text is not
// expected in a render of the page.
const chromeRules: { test: (path: string[], text: string, top: XmlNode | undefined) => boolean; reason: string }[] = [
  {
    test: (_path, _text, top) =>
      top?.y === 0 && top.h <= 40 && [...walk(top)].some((n) => /^\d{1,2}:\d{2}$/.test(n.name)),
    reason: statusBarReason,
  },
  {
    test: (path) => path.some((p) => p === 'keyboard' || p.startsWith('keyboard (iOS')),
    reason: 'iOS keyboard (design-only chrome, d-089)',
  },
]

/**
 * Builds the reference record of one frame. `characters` maps a text
 * layer's node id to its characters, for each layer whose name is not its
 * text; a text layer with no entry takes its name.
 */
export function buildFrameRef(
  frame: XmlNode,
  fileKey: string,
  source: string,
  characters: ReadonlyMap<string, string> = new Map(),
): FrameRef {
  const code = frameCode(frame.name)
  if (code === null) throw new Error(`Frame "${frame.name}" has no code such as D1`)
  const layers: Layer[] = []
  const exclude: Exclusion[] = []
  const skipped: Record<string, number> = {}
  const visit = (node: XmlNode, ox: number, oy: number, path: string[], top: XmlNode | undefined) => {
    for (const child of node.children) {
      const x = ox + child.x
      const y = oy + child.y
      if (child.tag === 'ellipse' && decorative.has(child.name)) {
        skipped[child.name] = (skipped[child.name] ?? 0) + 1
        continue
      }
      // A hidden layer is not drawn, so neither it nor its children are in the frame.
      if (child.hidden) {
        skipped.hidden = (skipped.hidden ?? 0) + 1
        continue
      }
      const layer: Layer = {
        id: child.id,
        name: child.name,
        type: child.tag,
        x,
        y,
        w: child.w,
        h: child.h,
        path: path.join(' > '),
      }
      if (child.tag === 'text') {
        const text = characters.get(child.id) ?? child.name
        layer.text = text
        const rule = chromeRules.find((r) => r.test(path, text, top))
        if (rule) exclude.push({ id: child.id, text, reason: rule.reason })
      }
      layers.push(layer)
      visit(child, x, y, [...path, child.name], top ?? child)
    }
  }
  visit(frame, 0, 0, [], undefined)
  return {
    frameId: frameIdOf(code),
    code,
    name: frame.name,
    node: frame.id,
    fileKey,
    device: deviceOf(code),
    w: frame.w,
    h: frame.h,
    tolerance: 4,
    source,
    layers,
    exclude,
    skipped,
  }
}

/** The note frames ("note·D1 · Inbox, a next step") by the frame name they annotate. */
export function findNotes(root: XmlNode): Map<string, string> {
  const notes = new Map<string, string>()
  for (const n of walk(root)) {
    if (!n.name.startsWith('note·')) continue
    const texts = [...walk(n)].filter((t) => t.tag === 'text').map((t) => t.name)
    notes.set(n.name.slice('note·'.length), texts.join('\n'))
  }
  return notes
}

/** Every frame on the page that carries a frame code, in document order. */
export function findFrames(root: XmlNode): XmlNode[] {
  return [...walk(root)].filter((n) => n.tag === 'frame' && frameCode(n.name) !== null)
}
