// The Subtask form on the phone (M20 422:520): the chat actions' Subtask opens
// a sheet over the chat, titled "Start a subtask" with ×, with D17's fields
// (the model, what the subtask should do, with the focus, and the line on
// what it gets and where its result goes) and Start subtask across the sheet
// at the bottom, as M18's Fork sheet. Start subtask starts nothing here. The
// sheet has no Cancel: × and the scrim close it. Figma's sheet has no grabber
// and a larger title (LIBRARY_GAPS.md: Phone fork sheet). Props only.
import { ArrowUpIcon, BottomSheet, Button } from '@eshelton328/component-library-1701'
import { useRef } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { SidebarLayers, SubtaskForm } from '../types.ts'
import { SubtaskFields } from './SubtaskFields.tsx'

// M20 422:581 to 422:599: as M18's sheet, the parts start 16 in from the screen's sides (the sheet pads 12 inside its
// border, these 4 more) and 16 apart, the model 16 under the title row. Start subtask spans the sheet, 40 high in
// Figma; no button is 40, and `lg` (36) keeps the fields nearer Figma's places (LIBRARY_GAPS.md: Phone fork sheet).
const body = css({ display: 'flex', flexDirection: 'column', gap: '16', px: '4', pt: '6' })

export type PhoneSubtaskProps = {
  form: SubtaskForm
  open: boolean
  onOpenChange?: ((open: boolean) => void) | undefined
  /** The sheet's Figma layers. */
  layers?: SidebarLayers['phoneSubtask']
}

export function PhoneSubtask({ form, open, onOpenChange, layers }: PhoneSubtaskProps) {
  const taskRef = useRef<HTMLDivElement>(null)
  return (
    <BottomSheet
      title={form.title}
      closeButton
      open={open}
      onOpenChange={onOpenChange}
      // The task has the focus, as Figma draws its cyan border (422:592), as D17 does.
      initialFocus={() => taskRef.current?.querySelector('textarea') ?? null}
    >
      <div className={body}>
        <SubtaskFields form={form} taskRef={taskRef} layers={layers} />
        <Button variant="primary" size="lg" textSize="smStrong" data-figma={layers?.submit}>
          <ArrowUpIcon size="16" />
          {form.submit}
        </Button>
      </div>
    </BottomSheet>
  )
}
