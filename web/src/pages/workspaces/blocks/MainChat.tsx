// The chat shown alone beside the workspace sidebar (D2 105:784): its
// two-row header, the transcript and the composer. Props only. The chat
// actions menu (D2b) comes from the caller, and so does a drop zone over
// the chat while a chat is dragged onto it (D6), and so does a toast over the
// composer (D20), and so does the name field while the owner renames the chat (D21).
import type { ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { SidebarLayers, Skill, WorkbenchPane } from '../types.ts'
import { ChatHead } from './ChatHead.tsx'
import { ChatPane } from './ChatPane.tsx'
import { withDraft } from './chatDraft.ts'

// The detail slot is a flex column; the chat fills it.
const column = css({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  flex: '1',
  minW: '[0]',
  minH: '[0]',
})

export type MainChatProps = {
  pane: Extract<WorkbenchPane, { type: 'chat' }>
  workspace: string
  contextLabel: string
  skills: { label: string; matching?: string | undefined; items: readonly Skill[]; value: string | null; open: boolean }
  onSkillsOpenChange?: ((open: boolean) => void) | undefined
  /** The chat actions menu with its trigger; a plain ⋯ button when not set, and none when `null`. */
  menu?: ReactNode
  /** The folders control under the prompt box (D4). */
  folders?: ReactNode
  /** The frame's Figma layers; D2's when not set. */
  layers?: SidebarLayers | undefined
  /** Drawn in the header in place of the chat's name while the owner renames it (D21 417:2442). */
  rename?: ReactNode
  /** Drawn between the transcript and the composer, such as the toast after a move (D20 417:2135). */
  above?: ReactNode
  /** Drawn over the whole chat, header included, such as the drop zone of a dragged chat (D6 158:1025). */
  overlay?: ReactNode
  /** The owner's draft in the composer, in place of the data's text (`ui.drafts`). */
  draft?: string | undefined
  /** Called with the composer's text as the owner types. */
  onTextChange?: ((text: string) => void) | undefined
  /** Sends the composer's message; resolves `false` when the send failed (ChatPane `onSend`). */
  onSend?: ((text: string) => Promise<boolean>) | undefined
}

export function MainChat(props: MainChatProps) {
  const {
    pane,
    workspace,
    contextLabel,
    skills,
    onSkillsOpenChange,
    menu,
    folders,
    layers,
    rename,
    above,
    overlay,
    draft,
    onTextChange,
    onSend,
  } = props
  return (
    <section data-figma={layers?.mainChat ?? '105:784'} aria-label={pane.head.title} className={column}>
      <ChatHead
        head={pane.head}
        workspace={workspace}
        contextLabel={contextLabel}
        menu={menu}
        rename={rename}
        figma={{ head: layers?.chatHead, actions: layers?.chatActions }}
      />
      <ChatPane
        // The composer keeps what the owner types in its own state, so each chat gets its own: switching the chat shown
        // alone (a fork and its original) mounts the other chat's composer from its draft.
        key={pane.id}
        size="full"
        figma={{
          composer: layers?.composer ?? '105:889',
          entries: layers?.entries ?? ['105:869', undefined, '105:874'],
        }}
        entries={pane.entries}
        composer={withDraft(pane.composer, draft)}
        onTextChange={onTextChange}
        onSend={onSend}
        skills={skills}
        onSkillsOpenChange={onSkillsOpenChange}
        folders={folders}
        above={above}
      />
      {overlay}
    </section>
  )
}
