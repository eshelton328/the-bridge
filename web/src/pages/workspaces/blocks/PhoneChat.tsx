// A chat opened on the phone (M3 105:2723): the header with the back
// button, the kind mark, the title over its workspace, the status and the
// ⋯, then the model and the context used (ChatHead); under it the transcript
// and the composer (ChatPane), whose "/" lists the skills as wide as the
// composer. The header and the composer stay put and only the transcript
// scrolls (d-107). The chat actions behind the ⋯ come from the caller, which
// gets the ⋯ as their trigger (M4).
// Props only.
import { Button, ChevronLeftIcon, MoreIcon } from '@eshelton328/component-library-1701'
import type { ReactElement, ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { SidebarLayers, Skill, WorkbenchPane } from '../types.ts'
import { ChatHead } from './ChatHead.tsx'
import { ChatPane } from './ChatPane.tsx'

// The detail slot is a flex column; the chat fills it.
const column = css({ display: 'flex', flexDirection: 'column', flex: '1', minW: '[0]', minH: '[0]' })
// Figma draws the back chevron and the ⋯ bare, 20 and 18 px (105:2750, 105:2765): the back in the accent colour, as a
// text button draws its icon, and the ⋯ in the text colour. Each button is 24 square. The ⋯ is Figma's icon layer, not
// a button, so its 20 px icon carries the layer, and the button reaches 2 into the header's end padding so the icon
// ends where Figma's does (the icon set has no 18 px size). Every Button variant draws the expanded border while its
// sheet is open; Figma keeps the ⋯ bare under M4's sheet (105:2891), so the border stays transparent.
const moreButton = css({ color: 'fg.default', me: '-2', _expanded: { borderColor: 'transparent' } })
const icon = css({ display: 'flex' })

export type PhoneChatProps = {
  pane: Extract<WorkbenchPane, { type: 'chat' }>
  workspace: string
  contextLabel: string
  /** The accessible name of the back button. */
  backLabel: string
  onBack?: (() => void) | undefined
  skills: { label: string; items: readonly Skill[]; value: string | null; open: boolean }
  onSkillsOpenChange?: ((open: boolean) => void) | undefined
  /** The chat actions, such as the sheet of M4, given the ⋯ as their trigger; the bare ⋯ when not set. */
  renderMenu?: ((trigger: ReactElement) => ReactNode) | undefined
  /** The frame's Figma layers. */
  layers?: SidebarLayers | undefined
}

export function PhoneChat(props: PhoneChatProps) {
  const { pane, workspace, contextLabel, backLabel, onBack, skills, onSkillsOpenChange, renderMenu, layers } = props
  const more = (
    <Button variant="text" size="xs" iconOnly className={moreButton} aria-label={`${pane.head.title} actions`}>
      <span className={icon} data-figma={layers?.chatActions}>
        <MoreIcon size="20" />
      </span>
    </Button>
  )
  return (
    <section aria-label={pane.head.title} className={column}>
      <ChatHead
        size="phone"
        head={pane.head}
        workspace={workspace}
        contextLabel={contextLabel}
        back={
          <Button
            variant="text"
            size="xs"
            iconOnly
            aria-label={backLabel}
            onClick={onBack}
            data-figma={layers?.phoneBack}
          >
            <ChevronLeftIcon size="20" />
          </Button>
        }
        menu={renderMenu === undefined ? more : renderMenu(more)}
        figma={{ head: layers?.chatHead, actions: layers?.chatActions }}
      />
      <ChatPane
        size="phone"
        figma={{ composer: layers?.composer, entries: layers?.entries, skills: layers?.skills }}
        entries={pane.entries}
        composer={pane.composer}
        skills={skills}
        onSkillsOpenChange={onSkillsOpenChange}
        autoFocus={skills.open}
      />
    </section>
  )
}
