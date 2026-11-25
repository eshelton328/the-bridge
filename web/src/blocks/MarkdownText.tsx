// Markdown text as the app renders it, in a chat's transcript (Workspaces
// EntryText) and in a brain item's record (Inbox LiveDetail): react-markdown
// with GitHub's extensions (remark-gfm: tables, strikethrough, task lists
// and autolinks, review R51), inside the caller's MarkdownView. HTML in the
// text stays text. A link is a link only with an http, https or mailto URL,
// and opens in a new tab (review R56): a bare URL, a `www.` link (which
// remark-gfm gives `http://`) and a bare email become links, the `www.` one
// to https; a link with any other URL (`javascript:`, `data:`, a relative
// path) stays plain text. MarkdownView draws a link in the accent colour, underlined,
// and breaks a long URL anywhere, so it wraps in its column. An image of a
// file in the brain is the library's ImageFigure through the server's image
// route (`MarkdownImage.tsx`, `imageUrl.ts`); any other image shows its alt
// text, so the text loads nothing from another site. A task list's
// box is named by its state ("Task done", "Task not done"). A table is the
// library's Table part (`markdownTableParts.ts`) at the caller's `size`, the
// size of its MarkdownView. A GitHub alert (`> [!NOTE]`) is the library's
// Callout (`remarkCallout.ts`, `MarkdownQuote.tsx`). A live chat's name
// becomes a mention that opens the chat (remarkChatMentions.ts), with the
// chats from MarkdownChatsContext. A fenced code block is the library's
// MarkdownCodeBlock (`MarkdownCodeFence.tsx`: its label, syntax colours,
// sideways scroll, a diff's tints, a fold and Copy with `onCopyCode`). TeX (`$…// Markdown text as the app renders it, in a chat's transcript (Workspaces
// EntryText) and in a brain item's record (Inbox LiveDetail): react-markdown
// with GitHub's extensions (remark-gfm: tables, strikethrough, task lists
// and autolinks, review R51), inside the caller's MarkdownView. HTML in the
// text stays text. A link is a link only with an http, https or mailto URL,
// and opens in a new tab (review R56): a bare URL, a `www.` link (which
// remark-gfm gives `http://`) and a bare email become links, the `www.` one
// to https; a link with any other URL (`javascript:`, `data:`, a relative
// path) stays plain text. MarkdownView draws a link in the accent colour, underlined,
// and breaks a long URL anywhere, so it wraps in its column. An image of a
// file in the brain is the library's ImageFigure through the server's image
// route (`MarkdownImage.tsx`, `imageUrl.ts`); any other image shows its alt
// text, so the text loads nothing from another site. A task list's
// box is named by its state ("Task done", "Task not done"). A table is the
// library's Table part (`markdownTableParts.ts`) at the caller's `size`, the
// size of its MarkdownView. A GitHub alert (`> [!NOTE]`) is the library's
// Callout (`remarkCallout.ts`, `MarkdownQuote.tsx`). A live chat's name
// becomes a mention that opens the chat (remarkChatMentions.ts), with the
// chats from MarkdownChatsContext. A fenced code block is the library's
// MarkdownCodeBlock (`MarkdownCodeFence.tsx`: its label, syntax colours,
// sideways scroll, a diff's tints, a fold and Copy with `onCopyCode`). TeX (`$…$`, `$$…$$`)
// draws with KaTeX (`useMathPlugins.ts`, `MathFormula.tsx`). Each of these
// rich text features can be off (Settings → Rich text): the `features` prop,
// or else MarkdownFeaturesContext, says which are on, and one that is off
// draws its plain Markdown and hides no text (`markdownFeatures.ts`). The
// plugins are in `markdownPlugins.ts`, the element maps in
// `markdownComponents.ts`. The caller wraps it in a BlockBoundary.
import type { RichTextFeatures } from '../lib/deviceSettings.ts'
import type { CopyCode } from './MarkdownCodeFence.tsx'
import { MarkdownFeaturesContext } from './markdownFeatures.ts'
import { MarkdownMarkup } from './MarkdownMarkup.tsx'
import type { MarkdownSize } from './markdownTableParts.ts'

export type MarkdownTextProps = {
  /** The text, as Markdown. */
  text: string
  /** The size of the MarkdownView around it, for a table's text: `md` (the default) or `sm`. */
  size?: MarkdownSize | undefined
  /** Copies a code block's code (the page's copyText); without it a code block has no copy button. */
  onCopyCode?: CopyCode | undefined
  /** The rich text features that are on; MarkdownFeaturesContext's when not set (every feature with no provider). */
  features?: RichTextFeatures | undefined
}

// The context is read with its Consumer, not `use` or useContext: the canvas runs React 18, which has no `use`.
export function MarkdownText({ text, size = 'md', onCopyCode, features }: MarkdownTextProps) {
  if (features !== undefined)
    return <MarkdownMarkup text={text} size={size} onCopyCode={onCopyCode} features={features} />
  return (
    <MarkdownFeaturesContext.Consumer>
      {(fromSettings) => <MarkdownMarkup text={text} size={size} onCopyCode={onCopyCode} features={fromSettings} />}
    </MarkdownFeaturesContext.Consumer>
  )
}
