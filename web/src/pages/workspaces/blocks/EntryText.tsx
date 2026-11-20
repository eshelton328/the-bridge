// The text of a chat's message or reply as Markdown: react-markdown parses it
// and the library's MarkdownView draws it, as the Inbox detail draws its
// text. HTML in the text stays text, and a link keeps only a safe URL
// (react-markdown's `defaultUrlTransform`: http, https, mailto and a few
// more; a `javascript:` URL becomes empty) and opens in a new tab. An image
// shows its alt text, so a transcript loads nothing from another site. The
// text renders in its own BlockBoundary, so text that fails to render shows
// an inline fallback in its entry. Props only.
import { MarkdownView } from '@eshelton328/component-library-1701'
import Markdown, { type Components } from 'react-markdown'
import { BlockBoundary } from '../../../errors/BlockBoundary.tsx'

const components: Components = {
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
  img: ({ alt }) => alt ?? null,
}

export type EntryTextProps = {
  /** The entry's text, as Markdown. */
  text: string
}

export function EntryText({ text }: EntryTextProps) {
  return (
    <BlockBoundary contentKey={text}>
      <MarkdownView padding="none">
        <Markdown components={components}>{text}</Markdown>
      </MarkdownView>
    </BlockBoundary>
  )
}
