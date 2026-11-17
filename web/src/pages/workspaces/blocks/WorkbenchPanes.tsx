// The current workspace's panes in the split, clockwise from the top left
// (D1 105:174): each chat or shell in a `PaneFrame` with its menu, and an
// empty pane as it is. Props only; `ui` says which pane is focused and
// which menu or skill list is open.
import { SplitPanes } from '@eshelton328/component-library-1701'
import type { WorkbenchPane, WorkspacesData, WorkspacesUi } from '../types.ts'
import { ChatPane } from './ChatPane.tsx'
import { EmptyPane } from './EmptyPane.tsx'
import { PaneFrame } from './PaneFrame.tsx'
import { PaneMenu } from './PaneMenu.tsx'
import { ShellPane } from './ShellPane.tsx'

// The Figma layers of the panes by their place in the split, and of the chat composers.
const paneLayers = ['105:177', '105:262', '105:347', '105:316']
const composerLayers = ['105:230', '105:304']

export type WorkbenchPanesProps = {
  data: WorkspacesData
  ui: WorkspacesUi
  onUiChange?: ((change: Partial<WorkspacesUi>) => void) | undefined
}

export function WorkbenchPanes({ data, ui, onUiChange }: WorkbenchPanesProps) {
  const targets = data.workspaces.filter((w) => w.id !== data.current)
  let chats = 0
  const render = (pane: WorkbenchPane, place: number) => {
    if (pane.type === 'empty') return <EmptyPane {...pane} />
    const menu = (
      <PaneMenu
        title={pane.head.title}
        actions={data.paneMenu}
        targets={targets}
        newWorkspace={data.newWorkspace}
        open={ui.menuFor === pane.id}
        onOpenChange={(open) => onUiChange?.({ menuFor: open ? pane.id : null, moveOpen: false })}
        moveOpen={ui.menuFor === pane.id && ui.moveOpen}
        onMoveOpenChange={(open) => onUiChange?.({ moveOpen: open })}
      />
    )
    const composerLayer = pane.type === 'chat' ? (composerLayers[chats++] ?? pane.id) : pane.id
    return (
      <PaneFrame
        head={pane.head}
        figma={paneLayers[place] ?? pane.id}
        focused={ui.focusedPane === pane.id}
        onActivate={() => onUiChange?.({ focusedPane: pane.id })}
        menu={menu}
      >
        {pane.type === 'chat' ? (
          <ChatPane
            composerFigma={composerLayer}
            entries={pane.entries}
            composer={pane.composer}
            skills={{
              label: data.skillsLabel,
              items: data.skills,
              value: ui.skill,
              open: ui.skillsFor === pane.id,
            }}
            onSkillsOpenChange={(open) => onUiChange?.({ skillsFor: open ? pane.id : null })}
          />
        ) : (
          <ShellPane label={pane.head.title} lines={pane.lines} prompt={pane.prompt} />
        )}
      </PaneFrame>
    )
  }
  return <SplitPanes panes={data.panes.map((pane, i) => ({ id: pane.id, content: render(pane, i) }))} />
}
