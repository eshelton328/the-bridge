// A Markdown quote as MarkdownText draws it: a GitHub alert, which
// remarkCallout tags with `data-callout`, is the library's Callout of that
// tone at the size of its MarkdownView; any other quote stays a plain
// blockquote, which MarkdownView styles. Props only.
import { Callout } from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import type { ExtraProps } from 'react-markdown'
import type { MarkdownSize } from './markdownTableParts.ts'
import { type CalloutKind, calloutTones } from './remarkCallout.ts'

/** The tone remarkCallout gave the quote, or undefined for a plain quote. */
function quoteTone(node: ExtraProps['node']): CalloutKind | undefined {
  const tag = node?.properties.dataCallout
  return calloutTones.find((tone) => tone === tag)
}

export type MarkdownQuoteProps = {
  /** The quote's hast node, from react-markdown. */
  node: ExtraProps['node']
  /** The size of the MarkdownView around it. */
  size: MarkdownSize
  children?: ReactNode
}

export function MarkdownQuote({ node, size, children }: MarkdownQuoteProps) {
  const tone = quoteTone(node)
  if (tone === undefined) return <blockquote>{children}</blockquote>
  return (
    <Callout tone={tone} size={size}>
      {children}
    </Callout>
  )
}
