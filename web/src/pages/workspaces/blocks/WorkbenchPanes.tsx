// The current workspace's panes in the split, clockwise from the top left
// (D1 105:174): each chat or shell in a `PaneFrame` with its menu, and an
// empty pane as it is. An open side chat shows inside the pane it belongs
// to (D5), and a chat dragged from the sidebar over a pane shows the drop
// zone over the part of the pane where it would open (D8). With `data.split`
// `rows` the split is rows first (D14), and a dragged handle shows its
// readout over the pane before it; with `stack` the panes are one above the
// other. Each handle's sizes are in `ui.splitSizes`.
// The empty pane's Close pane reports the pane closed (`onClosePane`).
// A chat's composer starts from the owner's draft (`ui.drafts`) and reports what
// he types, so the draft outlives the pane: a page visit, a closed pane. Its
// Send goes to `onSend` with the chat's id.
// Props only; `ui` says which pane is focused and which menu,
// skill list or side chat is open.
import { SplitPanes } from '@eshelton328/component-library-1701'
import type { ResizePart, WorkbenchPane, WorkspacesData, WorkspacesUi } from '../types.ts'
import { ChatPane } from './ChatPane.tsx'
import { withDraft } from './chatDraft.ts'
import { EmptyPane } from './EmptyPane.tsx'
import { PaneDropZone } from './PaneDropZone.tsx'
import { PaneFrame } from './PaneFrame.tsx'
import { PaneMenu } from './PaneMenu.tsx'
import { ResizeReadout } from './ResizeReadout.tsx'
import { RowsSplit } from './RowsSplit.tsx'
import { ShellPane } from './ShellPane.tsx'
import { SideChatPanel } from './SideChatPanel.tsx'

// D1's Figma layers of the panes by their place in the split, and of the chats' composers and entries; a state's
// `layers` replace them.
const paneLayers = ['105:177', '105:262', '105:347', '105:316']
const chatLayers = [
  { composer: '105:230', entries: ['105:210', undefined, '105:215'] },
  { composer: '105:304', entries: [undefined, '105:291'] },
]

// The pane before each handle of a rows-first split, by its place in `panes`, and where its readout sits.
const readoutPane: Record<ResizePart, { place: number; placement: 'end' | 'bottom' }> = {
  rows: { place: 0, placement: 'bottom' },
  top: { place: 0, placement: 'end' },
  bottom: { place: 3, placement: 'end' },
}

export type WorkbenchPanesProps = {
  data: WorkspacesData
  ui: WorkspacesUi
  onUiChange?: ((change: Partial<WorkspacesUi>) => void) | undefined
  /** Called with a pane's id when the owner closes it with the empty pane's Close pane (D13). */
  onClosePane?: ((pane: string) => void) | undefined
  /** Sets a chat's draft (`ui.drafts`), merged into the latest drafts, so a send that ends late clears only its chat. */
  onDraftChange: (chat: string, text: string) => void
  /** Sends a chat's message; resolves `false` when the send failed, and the composer keeps the draft (ChatPane). */
  onSend?: ((chat: string, text: string) => Promise<boolean>) | undefined
}

export function WorkbenchPanes({ data, ui, onUiChange, onClosePane, onDraftChange, onSend }: WorkbenchPanesProps) {
  const targets = data.workspaces.filter((w) => w.id !== data.current)
  const panes = data.layers?.panes ?? paneLayers
  const chatsLayers = data.layers?.paneChats ?? chatLayers
  const side = ui.sideChatOpen === true ? data.sideChat : undefined
  const drag = ui.paneDrag
  const dragged = data.workspaces.flatMap((w) => w.chats ?? []).find((c) => c.id === drag?.chat)
  const resize = data.split === 'rows' ? (ui.resize ?? undefined) : undefined
  // Each handle keeps its own sizes; the dragged one's are the latest.
  const sizes = resize === undefined ? ui.splitSizes : { ...ui.splitSizes, [resize.part]: resize.sizes }
  const readout =
    resize !== undefined && data.resizeHint !== undefined
      ? {
          ...readoutPane[resize.part],
          label: data.resizeHint.replace('{ratio}', resize.sizes.map((s) => Math.round(s)).join(' : ')),
        }
      : undefined
  let chats = 0
  const render = (pane: WorkbenchPane, place: number) => {
    if (pane.type === 'empty')
      return (
        <EmptyPane
          {...pane}
          onClose={() => onClosePane?.(pane.id)}
          figma={{ pane: data.layers?.panes?.[place], rows: data.layers?.emptyRows, close: data.layers?.emptyClose }}
        />
      )
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
        highlighted={ui.menuHighlight}
        onHighlightChange={(menuHighlight) => onUiChange?.({ menuHighlight })}
        moveTarget={ui.moveTarget}
        onMoveTargetChange={(moveTarget) => onUiChange?.({ moveTarget })}
      />
    )
    const layers = pane.type === 'chat' ? (chatsLayers[chats++] ?? { composer: pane.id }) : { composer: pane.id }
    return (
      <PaneFrame
        head={pane.head}
        figma={panes[place] ?? pane.id}
        focused={ui.focusedPane === pane.id}
        onActivate={() => onUiChange?.({ focusedPane: pane.id })}
        menu={menu}
        overlay={
          drag?.pane === pane.id && dragged !== undefined && data.paneDrop !== undefined ? (
            <PaneDropZone
              edge={drag.edge}
              chat={dragged}
              target={pane.head.title}
              drop={data.paneDrop}
              placement="pane"
              figma={data.layers?.dropZone}
            />
          ) : readout?.place === place ? (
            <ResizeReadout label={readout.label} placement={readout.placement} figma={data.layers?.resizeHint} />
          ) : undefined
        }
      >
        {pane.type === 'chat' ? (
          <ChatPane
            // Each chat its own composer, whose text is its state: a pane that shows another chat starts from its draft.
            key={pane.id}
            chatId={pane.id}
            figma={layers}
            entries={pane.entries}
            notLive={pane.notLive}
            composer={withDraft(pane.composer, ui.drafts?.[pane.id])}
            onTextChange={(text) => {
              onDraftChange(pane.id, text)
            }}
            onSend={onSend && ((text) => onSend(pane.id, text))}
            skills={{
              label: data.skillsLabel,
              matching: data.skillsMatching,
              items: data.skills,
              value: ui.skill,
              open: ui.skillsFor === pane.id,
            }}
            onSkillsOpenChange={(open) => onUiChange?.({ skillsFor: open ? pane.id : null })}
            overlay={
              side?.pane === pane.id ? (
                <SideChatPanel
                  chat={side}
                  placement="pane"
                  layers={data.layers}
                  onClose={() => onUiChange?.({ sideChatOpen: false })}
                />
              ) : undefined
            }
          />
        ) : (
          <ShellPane
            paneId={pane.id}
            label={pane.head.title}
            lines={pane.lines}
            prompt={pane.prompt}
            notLive={pane.notLive}
            figma={data.layers?.shell}
          />
        )}
      </PaneFrame>
    )
  }
  const shown = data.panes.map((pane, i) => ({ id: pane.id, content: render(pane, i) }))
  if (data.split === 'stack')
    return (
      <RowsSplit
        stack
        panes={shown}
        sizes={ui.splitSizes}
        onSizeChange={(part, next) => onUiChange?.({ splitSizes: { ...ui.splitSizes, [part]: next } })}
      />
    )
  if (data.split === 'rows')
    return (
      <RowsSplit
        panes={shown}
        sizes={sizes}
        onSizeChange={(part, next) =>
          onUiChange?.({ resize: { part, sizes: next }, splitSizes: { ...sizes, [part]: next } })
        }
      />
    )
  return (
    <SplitPanes
      panes={shown}
      sizes={ui.splitSizes}
      onSizeChange={(part, next) => onUiChange?.({ splitSizes: { ...ui.splitSizes, [part]: next } })}
    />
  )
}
