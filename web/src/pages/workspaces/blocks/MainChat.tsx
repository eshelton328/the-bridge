// The chat shown alone beside the workspace sidebar (D2 105:784): its
// two-row header, the transcript and the composer. Props only. The chat
// actions menu (D2b) comes from the caller, and so does a drop zone over
// the chat while a chat is dragged onto it (D6), and so does a toast over the
// composer (D20), and so does the name field while the owner renames the chat (D21).
// A tap on its header sends a live chat's focus to herdr (`onHeaderTap`, W2).
import type { MouseEvent, ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { ChatWidth } from '../../../lib/deviceSettings.ts'
import type { SidebarLayers, WorkbenchPane } from '../types.ts'
import type { ChatSkills } from './useSkillRows.ts'
import { ChatHead } from './ChatHead.tsx'
import type { EffortControl } from './EffortPicker.tsx'
import type { CopyReply } from './ChatEntryView.tsx'
import type { ChatDialog } from './chatDialog.ts'
import { ChatPane, type ChatFiles, type ChatPending, type TranscriptWatch } from './ChatPane.tsx'
import type { DraftBook } from './draftBook.ts'
import { isHeaderTap } from './headerTap.ts'
import type { ComposerAnswer } from './useComposerActions.ts'

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
  skills: ChatSkills
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
  /** The page's drafts by chat (draftBook.ts): the composer starts from its chat's draft and sets it as the owner types. */
  drafts?: DraftBook | undefined
  /** Sends the composer's message; resolves `true` once sent, else `false` or the composer's line (ChatPane `onSend`). */
  onSend?: ((text: string) => Promise<ComposerAnswer>) | undefined
  /** Stops the chat: the running composer's Stop (ChatPane `onStop`). */
  onStop?: (() => Promise<ComposerAnswer>) | undefined
  /** The chat's effort picker (W10), when it is a live Claude chat (ChatHead `effortPicker`). */
  effort?: EffortControl | undefined
  /** The chat's files (W1b), when it is a live Claude chat (ChatPane `files`). */
  files?: ChatFiles | undefined
  /** The chat's pending send, when it is a live Claude chat (ChatPane `pending`). */
  pending?: ChatPending | undefined
  /** The chat's terminal dialog while it needs the owner, when it is a live Claude chat (ChatPane `dialog`, R69). */
  dialog?: ChatDialog | undefined
  /** Reads each live chat's transcript while its pane shows (ChatPane); fixtures have none. */
  transcripts?: TranscriptWatch | undefined
  /** How wide the chat draws on the tablet and the desktop (Settings → Appearance); full when not set. */
  chatWidth?: ChatWidth | undefined
  /** A reply's Copy: the page writes the clipboard, and the button shows the result (audit P-4). */
  onCopy?: CopyReply | undefined
  /** A tap or click on the header itself, not on a button in it (W2): the page focuses the chat in herdr. */
  onHeaderTap?: (() => void) | undefined
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
    drafts,
    onSend,
    onStop,
    files,
    effort,
    pending,
    dialog,
    transcripts,
    chatWidth,
    onCopy,
    onHeaderTap,
  } = props
  // The header is the section's first child.
  const tap =
    onHeaderTap === undefined
      ? undefined
      : (event: MouseEvent<HTMLElement>) => {
          if (isHeaderTap(event.target, event.currentTarget.firstElementChild)) onHeaderTap()
        }
  return (
    <section data-figma={layers?.mainChat ?? '105:784'} aria-label={pane.head.title} className={column} onClick={tap}>
      <ChatHead
        // Keyed by chat (not the composer's key, its sibling), so the effort picker's line and pending pick stay with
        // the chat they were for.
        key={`head:${pane.id}`}
        head={pane.head}
        effortPicker={effort}
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
        chatId={pane.id}
        figma={{
          composer: layers?.composer ?? '105:889',
          entries: layers?.entries ?? ['105:869', undefined, '105:874'],
        }}
        entries={pane.entries}
        notLive={pane.notLive}
        liveChat={pane.liveChat}
        transcripts={transcripts}
        chatWidth={chatWidth}
        onCopy={onCopy}
        earlier={pane.earlier}
        empty={pane.empty}
        problem={pane.problem}
        loading={pane.loading === undefined ? undefined : { label: pane.loading }}
        composer={pane.composer}
        drafts={drafts}
        onSend={onSend}
        onStop={onStop}
        files={files}
        pending={pending}
        dialog={dialog}
        skills={skills}
        onSkillsOpenChange={onSkillsOpenChange}
        folders={folders}
        above={above}
      />
      {overlay}
    </section>
  )
}
