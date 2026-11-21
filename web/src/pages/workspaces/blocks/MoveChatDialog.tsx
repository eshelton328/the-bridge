// The dialog of Move to tab… on a live chat's pane (slice W2d): the tab
// picked in the menu's list, then two choices, where the pane goes in that
// tab (beside the tab's focused pane, the default, or beside one of its
// panes) and on which side (Right, a `row` split, or Below, a `column`
// split), and Move. Move hands the choices to `onMove` and closes the
// dialog; the pane moves when the server's `layout.changed` brings the new
// layout, and a miss shows in the status bar. No Figma frame draws it (D01
// deviations), so it is the library's `Dialog` with a `SelectField` and a
// `ViewSwitch`. Props only.
import type { SplitDirection } from '@bridge/contract'
import { Button, Dialog, DialogClose, SelectField, Stack, ViewSwitch } from '@eshelton328/component-library-1701'
import { useState } from 'react'

/** The place choice of the tab's focused pane: it sends no `beside`. Each other choice is `pane:<local chat ID>`. */
const focusedPlace = 'focused'
const paneValue = (chat: string) => `pane:${chat}`

const sides: readonly { value: SplitDirection; label: string }[] = [
  { value: 'row', label: 'Right' },
  { value: 'column', label: 'Below' },
]

export type MoveChatDialogProps = {
  /** The chat's name, in the title. */
  chat: string
  /** The name of the tab it moves to. */
  tab: string
  /** The panes of that tab, by local chat ID, with their names. */
  panes: readonly { readonly id: string; readonly title: string }[]
  onOpenChange: (open: boolean) => void
  /** Moves the chat: beside the pane of `beside` (a local chat ID), or the tab's focused pane, to its right or below it. */
  onMove: (choice: { readonly beside: string | undefined; readonly direction: SplitDirection }) => void
}

export function MoveChatDialog({ chat, tab, panes, onOpenChange, onMove }: MoveChatDialogProps) {
  const [place, setPlace] = useState(focusedPlace)
  const [direction, setDirection] = useState<SplitDirection>('row')
  const beside = panes.find((p) => paneValue(p.id) === place)?.id
  return (
    <Dialog
      title={`Move ${chat} to ${tab}`}
      description="The pane keeps its chat and its terminal; the chat runs on in the other tab."
      open
      onOpenChange={onOpenChange}
      actions={
        <>
          <DialogClose>
            <Button size="sm" textSize="sm">
              Cancel
            </Button>
          </DialogClose>
          <Button
            size="sm"
            textSize="smStrong"
            variant="primary"
            onClick={() => {
              onMove({ beside, direction })
            }}
          >
            Move
          </Button>
        </>
      }
    >
      <Stack gap="12">
        <SelectField
          label="Place"
          options={[
            { value: focusedPlace, label: 'Beside the focused pane' },
            ...panes.map((p) => ({ value: paneValue(p.id), label: `Beside ${p.title}` })),
          ]}
          value={place}
          onValueChange={setPlace}
        />
        <ViewSwitch
          label="Side"
          items={sides}
          value={direction}
          onValueChange={(value) => {
            const side = sides.find((s) => s.value === value)
            if (side !== undefined) setDirection(side.value)
          }}
        />
      </Stack>
    </Dialog>
  )
}
