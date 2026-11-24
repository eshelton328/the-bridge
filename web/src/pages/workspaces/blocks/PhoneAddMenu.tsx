// The + at the top of the phone's list and the menu it opens (M15 208:515):
// New chat and New workspace, under + at its end. Like every menu trigger, +
// draws border.active while the menu is open (the library default). The menu
// is 220 wide (`width="phone"`) with its icons in the label's colour
// (`iconTone="default"`), as Figma's; its rows are 44 with 20 px icons against
// Figma's 42 and 18, on the 4 px grid (d-100). Props only.
import { Button, GridIcon, Menu, PlusIcon } from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { PhoneText } from '../types.ts'

// The icon's box, so its place is the icon's.
const iconBox = css({ display: 'inline-flex' })

export type PhoneAddMenuProps = {
  /** The accessible name of +. */
  label: string
  /** The menu's labels; without them, + draws only. */
  text?: PhoneText['addMenu'] | undefined
  /** + is off, as in edit mode (M2 105:2510). */
  disabled?: boolean | undefined
  open: boolean
  onOpenChange?: ((open: boolean) => void) | undefined
  onSelect?: ((action: 'newChat' | 'newWorkspace') => void) | undefined
  /** The Figma layers of +, of the open menu and of its icons by action. */
  figma?:
    | { trigger?: string | undefined; menu?: string | undefined; icons?: Readonly<Record<string, string>> | undefined }
    | undefined
}

export function PhoneAddMenu({ label, text, disabled, open, onOpenChange, onSelect, figma }: PhoneAddMenuProps) {
  // M1 105:2335: + is 36 wide and 28 high, so not a square icon button.
  const trigger = (
    <Button size="sm" aria-label={label} disabled={disabled} data-figma={figma?.trigger}>
      <PlusIcon size="16" />
    </Button>
  )
  if (text === undefined) return trigger
  // `Menu` takes no `data-*` on a row, so each icon carries its row's place.
  const icon = (action: string, node: ReactNode) => (
    <span className={iconBox} data-figma={figma?.icons?.[action]}>
      {node}
    </span>
  )
  return (
    <Menu
      data-figma={open ? figma?.menu : undefined}
      open={open && disabled !== true}
      onOpenChange={onOpenChange}
      onSelect={(value) => {
        if (value === 'newChat' || value === 'newWorkspace') onSelect?.(value)
      }}
      placement="bottom-end"
      size="lg"
      width="phone"
      iconTone="default"
      trigger={trigger}
      // The live page lists New chat (W3) and New workspace (W4), which opens the live dialog.
      items={[
        { value: 'newChat', label: text.newChat, icon: icon('newChat', <PlusIcon size="20" />) },
        ...(text.newWorkspace === undefined
          ? []
          : [{ value: 'newWorkspace', label: text.newWorkspace, icon: icon('newWorkspace', <GridIcon size="20" />) }]),
      ]}
    />
  )
}
