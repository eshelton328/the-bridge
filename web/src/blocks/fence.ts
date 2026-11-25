// The fenced code block a react-markdown `pre` holds, read from its hast
// node: one `code` element of text alone. MarkdownCodeFence draws it, and
// the rich text plugins (diagrams, math) pick theirs by its label. Pure.
import type { ExtraProps } from 'react-markdown'

/** A fence: its code without the final line break, and its label (`ts` for a fence opened with three backticks and `ts`). */
export type Fence = { readonly code: string; readonly language: string | undefined }

/** The fence a `pre` holds, or undefined when it holds anything but one `code` element of text alone. */
export function fenceOf(node: ExtraProps['node']): Fence | undefined {
  const [code, ...rest] = node?.children ?? []
  if (code === undefined || rest.length > 0 || code.type !== 'element' || code.tagName !== 'code') return undefined
  let text = ''
  for (const child of code.children) {
    if (child.type !== 'text') return undefined
    text += child.value
  }
  const className = code.properties.className
  const label = Array.isArray(className)
    ? className.map(String).find((name) => name.startsWith('language-'))
    : undefined
  return { code: text.endsWith('\n') ? text.slice(0, -1) : text, language: label?.slice('language-'.length) }
}
