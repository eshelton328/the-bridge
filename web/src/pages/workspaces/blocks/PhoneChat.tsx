// A chat opened on the phone (M3 105:2723): the header with the back
// button, the kind mark, the title over its workspace, the status and the
// ⋯, then the model and the context used (ChatHead); under it the transcript
// and the composer (ChatPane), whose "/" lists the skills as wide as the
// composer. The header and the composer stay put and only the transcript
// scrolls (d-107). The chat actions behind the ⋯ come from the caller, which
// gets the ⋯ as their trigger (M4), and the folders chip with its sheet
// (M8). While the keyboard is up the header shrinks to one line, `meta`
// under the title (M10). `focusMessage` puts the focus in the message box with
// the skills closed (M17). `above` sits over the composer, such as the toast
// after a move (M22). `rename` takes the title's place while the owner renames the
// chat, such as the name field (M23). At a tablet's width (T2 105:1810,
// `device="tablet"`) the header is 12 under the status bar, as the chat alone
// draws it, and the transcript 16 under the rule and 24 in from the sides.
// The chat is one ScrollFrame, the header its header, straight in the
// AppShell detail, which docks the composer on the keyboard (R20). Props only.
import { Button, ChevronLeftIcon, MoreIcon } from '@eshelton328/component-library-1701'
import type { ReactElement, ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { SidebarLayers, Skill, WorkbenchPane } from '../types.ts'
import { ChatHead } from './ChatHead.tsx'
import { ChatPane } from './ChatPane.tsx'
import { withDraft } from './chatDraft.ts'

// Figma draws the back chevron and the ⋯ bare, 20 and 18 px (105:2750, 105:2765): the back in the accent colour, as a
// text button draws its icon, and the ⋯ in the text colour. Each button is 24 square. The ⋯ is Figma's icon layer, not
// a button, so its 20 px icon carries the layer, and the button reaches 2 into the header's end padding so the icon
// ends where Figma's does (the icon set has no 18 px size). Like every trigger of a menu, popover or sheet, it draws
// border.active while its sheet is open (M4).
const moreButton = css({ color: 'fg.default', me: '-2' })
const icon = css({ display: 'flex' })
// Figma's back chevron is 20 wide at the header's start (105:2750, x 16) and the kind mark 8 after it (105:2752). The
// 24 px button reaches 2 out on each side, so the chevron is centred where Figma's is and the mark starts at x 44.
const backButton = css({ mx: '-2' })

export type PhoneChatProps = {
  pane: Extract<WorkbenchPane, { type: 'chat' }>
  workspace: string
  contextLabel: string
  /** The accessible name of the back button. */
  backLabel: string
  onBack?: (() => void) | undefined
  skills: {
    label: string
    matching?: string | undefined
    items: readonly Skill[]
    value: string | null
    open: boolean
  }
  onSkillsOpenChange?: ((open: boolean) => void) | undefined
  /** The chat actions, such as the sheet of M4, given the ⋯ as their trigger; the bare ⋯ when not set. */
  renderMenu?: ((trigger: ReactElement) => ReactNode) | undefined
  /** Without the chat actions: the header has no ⋯ (M8 128:672). */
  noActions?: boolean | undefined
  /**
   * Drawn in the header after the context used, in place of its label, such as the folders chip and its sheet (M8);
   * on a tablet after the label (T5 128:520).
   */
  folders?: ReactNode
  /**
   * The header on one line, this under the title in place of the workspace and the model row, such as "Opus 5.5 ·
   * 42% · 2 folders" while the keyboard is up (M10 147:53).
   */
  meta?: string | undefined
  /** Put the focus in the message box even with the skills closed (M17 402:10841). */
  focusMessage?: boolean | undefined
  /** Drawn between the transcript and the composer, such as the toast after a move (M22 422:819). */
  above?: ReactNode
  /** Drawn in the header in place of the title while the owner renames the chat, such as the name field (M23 422:925). */
  rename?: ReactNode
  /** The device whose width the chat has: the phone (the default), or a tablet (T2). */
  device?: 'phone' | 'tablet' | undefined
  /** The frame's Figma layers. */
  layers?: SidebarLayers | undefined
  /** The owner's draft in the composer, in place of the data's text (`ui.drafts`), so Back and a tap on the chat keep it. */
  draft?: string | undefined
  /** Called with the composer's text as the owner types. */
  onTextChange?: ((text: string) => void) | undefined
  /** Sends the composer's message; resolves `false` when the send failed (ChatPane `onSend`). */
  onSend?: ((text: string) => Promise<boolean>) | undefined
}

export function PhoneChat(props: PhoneChatProps) {
  const {
    pane,
    workspace,
    contextLabel,
    backLabel,
    onBack,
    skills,
    onSkillsOpenChange,
    renderMenu,
    noActions,
    folders,
    meta,
    focusMessage = false,
    above,
    rename,
    device = 'phone',
    layers,
    draft,
    onTextChange,
    onSend,
  } = props
  const more = (
    <Button variant="text" size="xs" iconOnly className={moreButton} aria-label={`${pane.head.title} actions`}>
      <span className={icon} data-figma={layers?.chatActions}>
        <MoreIcon size="20" />
      </span>
    </Button>
  )
  const head = (
    <ChatHead
      size={device === 'tablet' ? 'full' : 'phone'}
      head={pane.head}
      workspace={workspace}
      contextLabel={contextLabel}
      back={
        <Button
          variant="text"
          size="xs"
          iconOnly
          keepIconSize
          className={backButton}
          aria-label={backLabel}
          onClick={onBack}
          data-figma={layers?.phoneBack}
        >
          <ChevronLeftIcon size="20" />
        </Button>
      }
      menu={noActions === true ? null : renderMenu === undefined ? more : renderMenu(more)}
      extra={folders}
      extraAfterLabel={device === 'tablet'}
      meta={meta}
      rename={rename}
      figma={{ head: layers?.chatHead, actions: layers?.chatActions }}
    />
  )
  return (
    <ChatPane
      // Each chat its own composer, whose text is its state, so a typed message never carries to another chat.
      key={pane.id}
      size={device}
      header={head}
      label={pane.head.title}
      figma={{ composer: layers?.composer, entries: layers?.entries, skills: layers?.skills }}
      entries={pane.entries}
      composer={withDraft(pane.composer, draft)}
      onTextChange={onTextChange}
      onSend={onSend}
      skills={skills}
      onSkillsOpenChange={onSkillsOpenChange}
      autoFocus={skills.open || focusMessage}
      above={above}
    />
  )
}
