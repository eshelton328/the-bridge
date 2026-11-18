// A chat that used the toolkit, in the Chats list of the Activity view
// (Figma `chat · Linear workflow setup for NCC team`, D15 477:520; T11
// 477:1474; M13 477:2209): the library's `ListRow` with the chat icon, the
// title, when and where it ran, the items it used (`ToolkitChatItems` in the
// row's actions, so a tap on one opens that item and not the chat) and the
// chevron. A tap on the row opens the chat (D18); the open chat's row is
// selected. Hover lights the row's line: the fill is on the list item,
// behind the row, whose own surface is clear. On the desktop the line on
// when and where it ran starts the chips' line, as Figma's (477:525); on a
// tablet or phone it is the row's own line over the chips (T11 477:1479),
// in the small style (ListRow's meta is mono; LIBRARY_GAPS.md, Activity chat
// row). Props only.
import { ChatIcon, ChevronRightIcon, ListRow } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitActivityChat } from '../types.ts'
import { chatLayer } from './activitySources.ts'
import { ToolkitChatItems } from './ToolkitChatItems.tsx'

const item = css({ borderRadius: 'lg', _hover: { bg: 'surface.selected' } })
const lead = css({ textStyle: 'small', color: 'fg.muted' })

export type ToolkitChatRowProps = {
  chat: ToolkitActivityChat
  layout: Viewport
  selected?: boolean | undefined
  onOpen?: ((id: string) => void) | undefined
  /** Opens an item the chat used on its page, by its path. */
  onOpenItem?: ((path: string) => void) | undefined
}

export function ToolkitChatRow({ chat, layout, selected = false, onOpen, onOpenItem }: ToolkitChatRowProps) {
  const desktop = layout === 'desktop'
  return (
    <li className={item} data-figma={chatLayer(chat)}>
      <ListRow
        title={chat.title}
        leading={<ChatIcon size="16" />}
        trailing={<ChevronRightIcon size="16" />}
        // D15 477:520: the icon and the title 7 under the row's top; `sm` pads 8, the nearest.
        padding="sm"
        selected={selected}
        onSelect={() => {
          onOpen?.(chat.id)
        }}
        actions={
          <ToolkitChatItems
            items={chat.items}
            lead={desktop ? <span className={lead}>{chat.meta}</span> : undefined}
            onOpen={onOpenItem}
          />
        }
      >
        {desktop ? undefined : <span>{chat.meta}</span>}
      </ListRow>
    </li>
  )
}
