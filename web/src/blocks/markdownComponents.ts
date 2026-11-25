// The element overrides of MarkdownText, one map for each size, copy
// callback and set of rich text features (markdownFeatures.ts). A page
// passes one stable copy callback, so each element keeps its component
// across renders. The Copy is a prop, never a context, as the Claude Design
// canvas runs React 18 (Codex review of #511).
//
// A link is a link only with an http, https or mailto URL (review R56). A
// brain image is the library's ImageFigure (`MarkdownImage.tsx`), or with
// `images` off a link to it (`MarkdownImageLink.tsx`). A fence is
// MarkdownCodeFence, which takes `code`, `mermaid` and `math`. A GitHub
// alert is a Callout (`MarkdownQuote.tsx`), a table the library's Table.
import { createElement, Fragment, type ReactNode } from 'react'
import type { Components, ExtraProps } from 'react-markdown'
import type { RichTextFeatures } from '../lib/deviceSettings.ts'
import { ChatMention } from './ChatMention.tsx'
import { codeOf } from './fence.ts'
import { type CopyCode, MarkdownCodeFence } from './MarkdownCodeFence.tsx'
import { featuresKey } from './markdownFeatures.ts'
import { hasShownImage, holdsImage, MarkdownImage, textWithAlts } from './MarkdownImage.tsx'
import { MarkdownImageLink } from './MarkdownImageLink.tsx'
import { MarkdownQuote } from './MarkdownQuote.tsx'
import { type MarkdownSize, markdownTableParts } from './markdownTableParts.ts'
import { MathFormula } from './MathFormula.tsx'

/** The length of the Markdown source a link came from, or undefined when the parser gave no position. */
const sourceLength = (node: ExtraProps['node']): number | undefined => {
  const start = node?.position?.start.offset
  const end = node?.position?.end.offset
  return start === undefined || end === undefined ? undefined : end - start
}

/**
 * The URL a link opens, or undefined when it is not http, https or mailto. A bare `www.` autolink goes to https: its
 * source is its text alone, where a Markdown link `[www.…](http://www.…)` keeps the URL its author wrote.
 */
function linkUrl(href: string | undefined, children: ReactNode, node: ExtraProps['node']): string | undefined {
  if (href === undefined) return undefined
  const www =
    typeof children === 'string' &&
    children.startsWith('www.') &&
    href === `http://${children}` &&
    sourceLength(node) === children.length
  const url = www ? `https://${children}` : href
  return /^(https?:\/\/|mailto:)/i.test(url) ? url : undefined
}

const webLink = (url: string, children: ReactNode) =>
  createElement('a', { href: url, target: '_blank', rel: 'noopener noreferrer' }, children)

// The mention plugin's element (remarkChatMentions.ts), which is not an HTML element, so `Components` has no key for it.
const mentionParts = { 'chat-mention': ChatMention }

function build(size: MarkdownSize, onCopy: CopyCode | undefined, features: RichTextFeatures): Components {
  const images = features.images
  return {
    a: ({ href, children, node }) => {
      const url = linkUrl(href, children, node)
      // With images off, an image in a link is its alt text inside the link: never a link in a link.
      if (!images) {
        const text = holdsImage(node) ? textWithAlts(node) : children
        return url === undefined ? text : webLink(url, text)
      }
      // A link round a shown image: the picture, then the link with its alt text, so each has its own target.
      if (url !== undefined && hasShownImage(node)) {
        return createElement(Fragment, null, children, ' ', webLink(url, textWithAlts(node)))
      }
      return url === undefined ? children : webLink(url, children)
    },
    img: ({ src, alt }) => createElement(images ? MarkdownImage : MarkdownImageLink, { src, alt }),
    // A paragraph with a shown image is a div, as the image is a figure, which may not sit in a p.
    p: ({ node, children }) => createElement(images && hasShownImage(node) ? 'div' : 'p', null, children),
    pre: ({ node, children }) =>
      createElement(
        MarkdownCodeFence,
        { node, onCopy, colours: features.code, diagrams: features.mermaid, math: features.math },
        children,
      ),
    // Inline math (remark-math, for a text with a $) is a code element labelled math; any other code stays code.
    // With `math` off it is its source as text: the TeX as written, in the `$` or `$$` it had (Codex review of #532).
    code: ({ node, children, ...props }) => {
      const code = codeOf(node)
      if (code?.language !== 'math') return createElement('code', props, children)
      if (features.math) return createElement(MathFormula, { tex: code.code, display: false })
      const length = sourceLength(node)
      const dollars = length !== undefined && length - code.code.length >= 4 ? '$$' : '$'
      return `${dollars}${code.code}${dollars}`
    },
    // remark-gfm writes a task list's box with no label (axe: label); the box is read-only, so its name is its state.
    input: ({ type, checked, disabled }) =>
      createElement('input', {
        type,
        checked,
        disabled,
        readOnly: true,
        'aria-label': type === 'checkbox' ? (checked === true ? 'Task done' : 'Task not done') : undefined,
      }),
    ...mentionParts,
    ...markdownTableParts[size],
    blockquote: ({ node, children }) => createElement(MarkdownQuote, { node, size }, children),
  }
}

const noCopy = new Map<string, Components>()
const withCopy = new WeakMap<CopyCode, Map<string, Components>>()

/** The element map for a size, a copy callback and a set of features; the same inputs give the same map. */
export function componentsFor(
  size: MarkdownSize,
  onCopy: CopyCode | undefined,
  features: RichTextFeatures,
): Components {
  let maps = onCopy === undefined ? noCopy : withCopy.get(onCopy)
  if (maps === undefined) {
    maps = new Map<string, Components>()
    if (onCopy !== undefined) withCopy.set(onCopy, maps)
  }
  const key = `${size}:${featuresKey(features)}`
  const known = maps.get(key)
  if (known !== undefined) return known
  const made = build(size, onCopy, features)
  maps.set(key, made)
  return made
}
