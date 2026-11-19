// The Fork form on the phone (M18 422:217): the chat actions' Fork opens a
// sheet over the chat, titled "Fork {chat}" with ×, with D15's fields (the
// copy's name, where it starts and the note) and Fork across the sheet at the
// bottom, within thumb reach. Fork starts nothing; the copy waits for the owner's
// next message. The sheet has no Cancel: × and the scrim close it. Figma's
// sheet has no grabber and a larger title (LIBRARY_GAPS.md: Phone fork sheet).
// Props only.
import { ArrowUpIcon, BottomSheet, Button } from '@eshelton328/component-library-1701'
import { useRef } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { ForkForm, SidebarLayers } from '../types.ts'
import { ForkFields } from './ForkFields.tsx'

// M18 422:224 to 422:296: the parts start 16 in from the screen's sides (the sheet pads 12 inside its border, these 4
// more) and 16 apart; the name sits 16 under the title row (its 8 below the title, the sheet's 2 and 6 here).
// M18 422:300: Fork spans the sheet, 40 high; no button is 40, and `lg` (36) is as near as `xl` (44) and keeps the
// fields above nearer Figma's places, as the sheet grows upward from the bottom (LIBRARY_GAPS.md: Phone fork sheet).
// Its label "Fork" (422:304) is Geist Medium 12, which is `textSize="xs"` (`labelXs`).
const body = css({ display: 'flex', flexDirection: 'column', gap: '16', px: '4', pt: '6' })

export type PhoneForkProps = {
  form: ForkForm
  /** The title of the chat to fork; it fills `{chat}` in the title and the name. */
  chat: string
  open: boolean
  onOpenChange?: ((open: boolean) => void) | undefined
  /** The sheet's Figma layers. */
  layers?: SidebarLayers['phoneFork']
}

export function PhoneFork({ form, chat, open, onOpenChange, layers }: PhoneForkProps) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <BottomSheet
      title={form.title.replace('{chat}', chat)}
      closeButton
      open={open}
      onOpenChange={onOpenChange}
      // The sheet itself takes the focus, so no control shows a focus ring when it opens, as Figma draws it (D15 too).
      initialFocus={() => {
        const sheet = ref.current?.closest('[role="dialog"]')
        return sheet instanceof HTMLElement ? sheet : null
      }}
    >
      <div ref={ref} className={body}>
        <ForkFields form={form} chat={chat} layers={layers} size="phone" />
        <Button variant="primary" size="lg" textSize="xs" data-figma={layers?.submit}>
          <ArrowUpIcon size="16" />
          {form.submit}
        </Button>
      </div>
    </BottomSheet>
  )
}
