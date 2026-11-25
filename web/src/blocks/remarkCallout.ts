// GitHub's alert syntax as a callout: a quote whose first line is only
// [!NOTE], [!TIP], [!IMPORTANT], [!WARNING] or [!CAUTION] (any case) is a
// callout of that tone. The plugin takes the marker out and tags the quote
// with `data-callout`, and MarkdownText draws a tagged quote with the
// library's Callout. A quote with any other first line, an unknown tag or
// text after the tag on the same line stays a quote, as GitHub draws it.
// No dependency: the plugin edits the mdast tree itself.

/** The tones of a callout, as GitHub names them. */
export const calloutTones = ['note', 'tip', 'important', 'warning', 'caution'] as const

export type CalloutKind = (typeof calloutTones)[number]

/** The part of an mdast node the plugin reads and changes. */
type MdNode = {
  type: string
  value?: string
  children?: MdNode[]
  data?: { hProperties?: Record<string, unknown> } & Record<string, unknown>
}

const marker = /^\[!(note|tip|important|warning|caution)\][ \t]*(?:\r\n|\r|\n|$)/i

const isTone = (value: string): value is CalloutKind => calloutTones.some((tone) => tone === value)

/** The tone a quote's marker names, after it takes the marker out of the quote; undefined for a plain quote. */
function takeMarker(quote: MdNode): CalloutKind | undefined {
  const [first] = quote.children ?? []
  const lines = first?.type === 'paragraph' ? (first.children ?? []) : []
  const [text, after] = lines
  if (first === undefined || text?.type !== 'text' || text.value === undefined) return undefined
  const found = marker.exec(text.value)
  const tone = found?.[1]?.toLowerCase()
  if (found === null || tone === undefined || !isTone(tone)) return undefined
  // The marker's line ends at a line break in the text (LF, CRLF or a lone CR, as CommonMark reads each), at a hard break (two spaces), or at the paragraph's end.
  const rest = text.value.slice(found[0].length)
  const endsLine = /[\r\n]$/.test(found[0]) || after === undefined || after.type === 'break'
  if (!endsLine) return undefined
  const kept = [
    ...(rest === '' ? [] : [{ ...text, value: rest }]),
    ...lines.slice(after?.type === 'break' && rest === '' ? 2 : 1),
  ]
  if (kept.length === 0) quote.children = quote.children?.slice(1) ?? []
  else first.children = kept
  return tone
}

function walk(node: MdNode): void {
  for (const child of node.children ?? []) {
    if (child.type === 'blockquote') {
      const tone = takeMarker(child)
      if (tone !== undefined)
        child.data = { ...child.data, hProperties: { ...child.data?.hProperties, dataCallout: tone } }
    }
    walk(child)
  }
}

/** The remark plugin: tags each GitHub alert quote with its tone. */
export const remarkCallout = () => (tree: MdNode) => {
  walk(tree)
}
