// MarkdownText's render once the rich text features are known: react-markdown
// with the plugins (`markdownPlugins.ts`) and the element maps
// (`markdownComponents.tsx`) for those features, the chats a text may
// mention and the math plugins. The math parse loads for a text with a `$`,
// also with `math` off, so a formula keeps its TeX (markdownComponents.ts). MarkdownText is the entry; this file only draws. Props only.
import Markdown, { defaultUrlTransform, type Options } from 'react-markdown'
import type { RichTextFeatures } from '../lib/deviceSettings.ts'
import type { CopyCode } from './MarkdownCodeFence.tsx'
import { MarkdownChatsContext } from './markdownChats.ts'
import { componentsFor } from './markdownComponents.ts'
import { pluginsFor } from './markdownPlugins.ts'
import type { MarkdownSize } from './markdownTableParts.ts'
import { useMathPlugins } from './useMathPlugins.ts'

// react-markdown's own rule, except that an image keeps a `file:` URL, which `imageUrl` reads as a brain file. A link
// with one still goes through the default rule, and `linkUrl` keeps only http, https and mailto.
const urlTransform: NonNullable<Options['urlTransform']> = (url, key) =>
  key === 'src' && /^file:/i.test(url.trim()) ? url : defaultUrlTransform(url)

export type MarkdownMarkupProps = {
  text: string
  size: MarkdownSize
  onCopyCode: CopyCode | undefined
  features: RichTextFeatures
}

// The chats are read with the Consumer, not `use` or useContext: the canvas runs React 18, which has no `use`.
// useMathPlugins uses only hooks React 18 has.
export function MarkdownMarkup({ text, size, onCopyCode, features }: MarkdownMarkupProps) {
  const math = useMathPlugins(text)
  return (
    <MarkdownChatsContext.Consumer>
      {({ chats }) => (
        <Markdown
          urlTransform={urlTransform}
          remarkPlugins={pluginsFor(features, chats, math.plugins)}
          components={componentsFor(size, onCopyCode, features)}
        >
          {math.text}
        </Markdown>
      )}
    </MarkdownChatsContext.Consumer>
  )
}
