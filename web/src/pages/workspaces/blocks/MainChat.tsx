// The chat shown alone beside the workspace sidebar (D2 105:784): its
// two-row header, the transcript and the composer. Props only. The chat
// actions menu (D2b) comes from the caller.
import type { ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { SidebarLayers, Skill, WorkbenchPane } from '../types.ts'
import { ChatHead } from './ChatHead.tsx'
import { ChatPane } from './ChatPane.tsx'

// The detail slot is a flex column; the chat fills it.
const column = css({ display: 'flex', flexDirection: 'column', flex: '1', minW: '[0]', minH: '[0]' })

export type MainChatProps = {
  pane: Extract<WorkbenchPane, { type: 'chat' }>
  workspace: string
  contextLabel: string
  skills: { label: string; items: readonly Skill[]; value: string | null; open: boolean }
  onSkillsOpenChange?: ((open: boolean) => void) | undefined
  /** The chat actions menu with its trigger; a plain ⋯ button when not set. */
  menu?: ReactNode
  /** The frame's Figma layers; D2's when not set. */
  layers?: SidebarLayers | undefined
}

export function MainChat({ pane, workspace, contextLabel, skills, onSkillsOpenChange, menu, layers }: MainChatProps) {
  return (
    <section data-figma={layers?.mainChat ?? '105:784'} aria-label={pane.head.title} className={column}>
      <ChatHead
        head={pane.head}
        workspace={workspace}
        contextLabel={contextLabel}
        menu={menu}
        figma={{ head: layers?.chatHead, actions: layers?.chatActions }}
      />
      <ChatPane
        size="full"
        figma={{
          composer: layers?.composer ?? '105:889',
          entries: layers?.entries ?? ['105:869', undefined, '105:874'],
        }}
        entries={pane.entries}
        composer={pane.composer}
        skills={skills}
        onSkillsOpenChange={onSkillsOpenChange}
      />
    </section>
  )
}
