// One message of an item's discussion (D5): the owner's question (`message · the owner`
// 438:25) or Claude's answer (`message · Claude` 438:27), with the files and
// lines it cites as chips under the text and Copy under them. The library
// Message draws the bubble, the Claude mark and the name. Props only.
import { Button, CopyIcon, FileIcon, Message, MetaChip, Stack } from '@eshelton328/component-library-1701'
import type { Ref } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitDiscussEntry as Entry } from '../types.ts'

// 438:32: Regular 14/20, four lines in the 378 px panel: `body`.
const text = css({ textStyle: 'body', color: 'fg.default', m: '0' })
// The owner's message keeps the line breaks and indents he typed in the reply box.
const typed = css({ whiteSpace: 'pre-wrap' })
// 438:33: the cites stand one under the other, 6 apart, each as wide as its text. Figma's chips are 25 high with the
// text 17 high; `MetaChip size="sm"` (24 high, `monoSm`) keeps their height, `md` would be 30 (LIBRARY_GAPS.md, Cite chip).
const sources = css({ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6' })

export type ToolkitDiscussEntryProps = {
  entry: Entry
  /** Copies the answer's text. */
  onCopy?: ((text: string) => void) | undefined
  /** The message's root, such as for scrolling a sent message into view. */
  ref?: Ref<HTMLDivElement> | undefined
}

export function ToolkitDiscussEntry({ entry, onCopy, ref }: ToolkitDiscussEntryProps) {
  if (entry.type === 'user')
    return (
      <div ref={ref} data-figma="message · Erik">
        <Message from="user">
          <span className={typed}>{entry.text}</span>
        </Message>
      </div>
    )
  return (
    <div ref={ref} data-figma="message · Claude">
      <Message
        from="assistant"
        kind="claude"
        // D5 438:29: a 15 px author mark, drawn at 16.
        markSize="16"
        name={entry.name}
        actions={
          <span data-figma="button · Copy">
            <Button
              size="xs"
              textSize="xs"
              onClick={() => {
                onCopy?.(entry.text)
              }}
            >
              <CopyIcon size="12" />
              {entry.copy}
            </Button>
          </span>
        }
      >
        <Stack gap="6">
          <p className={text}>{entry.text}</p>
          <div className={sources} data-figma="sources">
            {entry.sources.map((source) => (
              <span key={source} data-figma={`source · ${source}`}>
                <MetaChip label={source} size="sm" tone="muted" icon={<FileIcon size="12" />} />
              </span>
            ))}
          </div>
        </Stack>
      </Message>
    </div>
  )
}
