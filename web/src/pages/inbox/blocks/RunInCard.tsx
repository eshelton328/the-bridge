// Where a next step runs: the recommended chat, and Change, which opens the
// Run in picker when the state has one. On the phone Change is a chevron,
// the folders stay out of the detail line and the picker opens as a sheet
// over the task, closed by Done (M2, M4). Props only.
import {
  Badge,
  BottomSheet,
  BottomSheetClose,
  Button,
  ChevronDownIcon,
  Inline,
  KindMark,
  Panel,
  Popover,
  Stack,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { InboxRunIn } from '../types.ts'
import { RunInPicker } from './RunInPicker.tsx'

const grow = css({ flex: '1' })
// Figma 403:1870: Geist Medium 13.
const title = css({ textStyle: 'labelSm' })
const detail = css({ textStyle: 'monoSm', color: 'fg.muted' })
// M4 346:9749: the picker 2 under the sheet's title row, its note at the end.
const sheetBody = css({ display: 'flex', flexDirection: 'column', gap: '2' })
const sheetNote = css({ textStyle: 'small', color: 'fg.muted', px: '8', py: '12' })

export type RunInCardProps = {
  runIn: InboxRunIn
  pickerOpen: boolean
  onPickerOpenChange?: ((open: boolean) => void) | undefined
  layout?: Viewport | undefined
}

function PickerSheet({ runIn, pickerOpen, onPickerOpenChange }: RunInCardProps) {
  if (runIn.picker === undefined) return null
  return (
    <BottomSheet
      title="Run in"
      open={pickerOpen}
      onOpenChange={onPickerOpenChange}
      actions={
        <BottomSheetClose>
          <Button variant="text" size="sm">
            Done
          </Button>
        </BottomSheetClose>
      }
    >
      <div className={sheetBody} data-figma="run in picker">
        <RunInPicker picker={runIn.picker} sheet />
        <span className={sheetNote}>{runIn.picker.note}</span>
      </div>
    </BottomSheet>
  )
}

export function RunInCard({ runIn, pickerOpen, onPickerOpenChange, layout = 'desktop' }: RunInCardProps) {
  const phone = layout === 'phone'
  const change = phone ? (
    <Button
      size="sm"
      iconOnly
      aria-label="Change"
      pressed={pickerOpen ? true : undefined}
      data-figma="button · Change"
      onClick={() => onPickerOpenChange?.(!pickerOpen)}
    >
      <ChevronDownIcon />
    </Button>
  ) : (
    <Button size="sm" pressed={pickerOpen ? true : undefined}>
      Change
      <ChevronDownIcon />
    </Button>
  )
  const where = phone || runIn.folders === undefined ? runIn.detail : `${runIn.detail} · ${runIn.folders}`
  return (
    <Panel>
      <Inline gap="10" align="center">
        <KindMark kind="claude" size="16" />
        <div className={grow}>
          {/* Figma T2 346:5761: the 20 px title row and the 14 px detail 3 apart. The Recommended pill makes the row
              24 high, so the detail follows with no gap. */}
          <Stack gap="0">
            <Inline gap="6" align="center">
              <span className={title}>{runIn.title}</span>
              <Badge variant="pill" tone="working" label={runIn.badge} />
            </Inline>
            <span className={detail}>{where}</span>
          </Stack>
        </div>
        {runIn.picker === undefined || phone ? (
          change
        ) : (
          <Popover
            trigger={change}
            label="Run in"
            open={pickerOpen}
            onOpenChange={onPickerOpenChange}
            width="picker"
            note={runIn.picker.note}
            placement="bottom-end"
            flip={false}
            data-figma={pickerOpen ? 'run in picker' : undefined}
          >
            <RunInPicker picker={runIn.picker} />
          </Popover>
        )}
      </Inline>
      {phone ? <PickerSheet runIn={runIn} pickerOpen={pickerOpen} onPickerOpenChange={onPickerOpenChange} /> : null}
    </Panel>
  )
}
