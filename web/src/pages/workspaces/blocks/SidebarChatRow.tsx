// One chat in the workspace sidebar (D2 105:643): the kind mark, the title,
// the model and context used, and the status. A subtask's chat is indented
// under the chat that started it (199:51). The row of a chat Erik drags
// onto the chat shown alone fades (D6 158:750). A fork is indented under its
// original too, with the branch mark before its kind mark (D16 417:697).
// On the phone the row ends with its ⋯, after the status (M1 146:2).
// Props only.
import { BranchIcon, ContextMeter, Inline, KindMark, ListRow, StatusPill } from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { SidebarChat } from '../types.ts'

// D6 158:750: the dragged chat's own row fades; `opacity.disabled` is the nearest token to Figma's look (d-100).
const faded = css({ opacity: 'disabled' })

export type SidebarChatRowProps = {
  chat: SidebarChat
  /** The Figma layer the row stands for, for the fidelity checks. */
  figma?: string | undefined
  /** The chat in the middle of the screen. */
  selected?: boolean | undefined
  /** The chat is being dragged from this row: the row fades (D6). */
  moving?: boolean | undefined
  onSelect?: (() => void) | undefined
  /** The row's ⋯ after the status, as the phone draws it (M1 146:2); the desktop sidebar has none. */
  menu?: ReactNode
}

export function SidebarChatRow({ chat, figma, selected, moving, onSelect, menu }: SidebarChatRowProps) {
  return (
    <div data-figma={figma} className={moving === true ? faded : undefined}>
      <ListRow
        variant="sidebar"
        density="compact"
        title={chat.title}
        leading={
          chat.mark?.kind === 'fork' ? (
            // D16 418:2: Figma draws the branch mark (13 px) in place of the ↳ and the kind mark 10 after it; the
            // library's row draws the ↳ of every nested row and its icons are 12 or 16 (LIBRARY_GAPS.md: Nested row
            // mark). 6 apart keeps the kind mark and the title where Figma has them.
            <Inline gap="6" align="center">
              <BranchIcon size="12" title={chat.mark.label} />
              <KindMark kind={chat.kind} size="16" />
            </Inline>
          ) : (
            <KindMark kind={chat.kind} size="16" />
          )
        }
        meta={
          <Inline gap="4" align="center">
            <span>{chat.model}</span>
            {/* d-100: a context of 75 or more is drawn in amber, as on the empty pane of D1. */}
            {chat.context === undefined ? null : <ContextMeter value={chat.context} high={chat.context >= 75} />}
          </Inline>
        }
        trailing={
          menu === undefined ? (
            <StatusPill label={chat.status.label} tone={chat.status.tone} dot />
          ) : (
            // M1 105:2361, 146:2: the ⋯ sits 8 after the status, on its line; the trailing slot stacks its children.
            <Inline gap="8" align="center">
              <StatusPill label={chat.status.label} tone={chat.status.tone} dot />
              {menu}
            </Inline>
          )
        }
        selected={selected}
        level={chat.level}
        onSelect={onSelect}
      />
    </div>
  )
}
