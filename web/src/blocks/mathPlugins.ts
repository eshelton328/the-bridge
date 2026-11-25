// The remark plugins for math, loaded only for a text that holds a `$`
// (useMathPlugins): remark-math reads `$…$` as inline math and `$$…$$` as
// a display formula, and the guard below gives a price back its text.
// remark-math reads "$5 and $10" as the formula "5 and ", so a one-dollar
// formula keeps Pandoc's rules: no space just inside either `$`, and no
// digit just after the closing one. A formula that breaks a rule goes back
// to its source text. `$$…$$` keeps remark-math's own rules.
import remarkMath from 'remark-math'

/** The part of an mdast node the guard reads: its type, its children and where its source starts and ends. */
type MdNode = {
  type: string
  value?: string
  children?: MdNode[]
  position?: { start: { offset?: number | undefined }; end: { offset?: number | undefined } } | undefined
}

/** The source text of an inline formula with one `$` on each side, or undefined for another node. */
function singleDollarSource(node: MdNode, text: string): string | undefined {
  if (node.type !== 'inlineMath') return undefined
  const start = node.position?.start.offset
  const end = node.position?.end.offset
  if (start === undefined || end === undefined) return undefined
  const source = text.slice(start, end)
  return source.startsWith('$$') ? undefined : source
}

/** Whether a one-dollar formula breaks Pandoc's rules, so it is a price or other text. */
export function isNotMath(source: string, after: string | undefined): boolean {
  const inner = source.slice(1, -1)
  return inner === '' || /^\s/.test(inner) || /\s$/.test(inner) || (after !== undefined && /^[0-9]/.test(after))
}

function guard(node: MdNode, text: string): void {
  if (node.children === undefined) return
  node.children = node.children.map((child): MdNode => {
    const source = singleDollarSource(child, text)
    const end = child.position?.end.offset
    if (source !== undefined && end !== undefined && isNotMath(source, text.charAt(end) || undefined)) {
      return { type: 'text', value: source, position: child.position }
    }
    guard(child, text)
    return child
  })
}

/** Gives a one-dollar formula that breaks Pandoc's rules back as text. Runs after remark-math. */
const remarkMathGuard = () => (tree: MdNode, file: { value: unknown }) => {
  guard(tree, String(file.value))
}

/** The math plugins, in order. */
export const mathPlugins = [remarkMath, remarkMathGuard] as const
