// The text of a chat's message or reply as Markdown: MarkdownText parses it
// (with GitHub's tables, strikethrough, task lists and autolinks; its file
// says what it does with HTML, links and images) and the library's
// MarkdownView draws it, as the Inbox detail draws its text. The text keeps
// the message's colour: MarkdownView draws body text muted, as a file
// preview's, and has no prop for a message's colour (LIBRARY_GAPS.md: Chat
// Markdown). The text renders in its own BlockBoundary, so text that fails to render shows
// an inline fallback in its entry. Memoised by the text (review R28): parsing
// Markdown is the transcript's main cost, so it runs only when the text
// changes. Props only.
import { MarkdownView } from '@eshelton328/component-library-1701'
import { memo } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import { MarkdownText } from '../../../blocks/MarkdownText.tsx'
import { BlockBoundary } from '../../../errors/BlockBoundary.tsx'

// The message's own colour (`fg.default` in its body), in place of MarkdownView's muted body text.
const inMessage = css({ '& .markdown-view': { color: 'inherit' } })

export type EntryTextProps = {
  /** The entry's text, as Markdown. */
  text: string
}

export const EntryText = memo(function EntryText({ text }: EntryTextProps) {
  return (
    <BlockBoundary contentKey={text}>
      <div className={inMessage}>
        <MarkdownView padding="none">
          <MarkdownText text={text} />
        </MarkdownView>
      </div>
    </BlockBoundary>
  )
})
