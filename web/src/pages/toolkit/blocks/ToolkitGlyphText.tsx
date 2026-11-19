// A line of toolkit text with Figma's ✗ (U+2717) and ✓ (U+2713) in it, such
// as the hook's test line (D28 492:2185) or its Test card's caption (D9
// "runs the rule’s ✗ and ✓ examples"). The text fonts have neither
// character, so each one is the library's `Glyph`, which keeps the character
// in the text and draws Figma's mark in the text's colour; the rest of the
// text stays as it is. Props only.
import { Glyph, type GlyphSymbol } from '@eshelton328/component-library-1701'
import { Fragment } from 'react'

const symbols: Readonly<Record<string, GlyphSymbol>> = { '✗': 'cross', '✓': 'check' }

export type ToolkitGlyphTextProps = { text: string }

export function ToolkitGlyphText({ text }: ToolkitGlyphTextProps) {
  // Each run of the line keeps its place in it, so where it starts keys it.
  let at = 0
  return text.split(/([✗✓])/u).map((run) => {
    const start = at
    at += run.length
    const symbol = symbols[run]
    if (symbol !== undefined) return <Glyph key={start} symbol={symbol} />
    return run === '' ? null : <Fragment key={start}>{run}</Fragment>
  })
}
