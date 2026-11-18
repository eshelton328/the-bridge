// The Workspaces page on the phone (Figma M1 to M23): one view at a time over
// the shared tab bar, which More turns into the More drawer. M1 is the home:
// every workspace and its chats (PhoneWorkspaceList). Later phone frames
// (edit mode, a chat, its actions, the side chat sheet, subagents, New chat,
// folders) add their views here. Props only; WorkspacesScreen keeps the ui
// and passes `onUiChange`.
import { AppShell, Backdrop } from '@eshelton328/component-library-1701'
import { useState } from 'react'
import { AppTabBar } from '../../../blocks/AppTabBar.tsx'
import { MoreDrawer } from '../../../blocks/MoreDrawer.tsx'
import { PhoneWorkspaceList } from '../blocks/PhoneWorkspaceList.tsx'
import type { PhoneText, WorkspacesData, WorkspacesUi } from '../types.ts'

export type WorkspacesPhoneProps = {
  /** The state's data, with the names Erik gave chats in place of their titles. */
  data: WorkspacesData
  /** The phone's labels. */
  text: PhoneText
  ui: WorkspacesUi
  onNavigate?: ((page: string) => void) | undefined
  onUiChange: (change: Partial<WorkspacesUi>) => void
}

export function WorkspacesPhone({ data, text, ui, onNavigate, onUiChange }: WorkspacesPhoneProps) {
  // The tab bar's More opens the More drawer over it (Toolkit M4); picking a page navigates.
  const [moreOpen, setMoreOpen] = useState(false)
  return (
    <Backdrop size="phone">
      <AppShell
        size="phone"
        view="list"
        tabBar={
          <AppTabBar
            selected="workspaces"
            device="phone"
            inboxBadge={data.railBadge}
            onSelect={(next) => {
              if (next === 'more') setMoreOpen(true)
              else onNavigate?.(next)
            }}
          />
        }
        list={
          <PhoneWorkspaceList
            text={text}
            workspaces={data.workspaces}
            selected={ui.focusedPane}
            openable={data.panes.flatMap((p) => (p.type === 'chat' ? [p.id] : []))}
            ui={ui}
            onUiChange={onUiChange}
            layers={data.layers}
          />
        }
      />
      <MoreDrawer open={moreOpen} onOpenChange={setMoreOpen} onNavigate={onNavigate} />
    </Backdrop>
  )
}
