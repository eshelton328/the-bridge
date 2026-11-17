// Where a next step runs: the recommended chat, and Change, which opens the
// Run in picker when the state has one. Props only.
import {
  Badge,
  Button,
  ChevronDownIcon,
  Inline,
  KindMark,
  Panel,
  Popover,
  Stack,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { InboxRunIn } from '../types.ts'
import { RunInPicker } from './RunInPicker.tsx'

const grow = css({ flex: '1' })
const title = css({ textStyle: 'label' })
const detail = css({ textStyle: 'mono', color: 'fg.muted' })

export type RunInCardProps = {
  runIn: InboxRunIn
  pickerOpen: boolean
}

export function RunInCard({ runIn, pickerOpen }: RunInCardProps) {
  const change = (
    <Button size="sm" pressed={pickerOpen ? true : undefined}>
      Change
      <ChevronDownIcon />
    </Button>
  )
  return (
    <Panel>
      <Inline gap="10" align="center">
        <KindMark kind="claude" size="16" />
        <div className={grow}>
          <Stack gap="4">
            <Inline gap="6" align="center">
              <span className={title}>{runIn.title}</span>
              <Badge variant="pill" tone="working" label={runIn.badge} />
            </Inline>
            <span className={detail}>{runIn.detail}</span>
          </Stack>
        </div>
        {runIn.picker === undefined ? (
          change
        ) : (
          <Popover
            trigger={change}
            label="Run in"
            open={pickerOpen}
            width="picker"
            note={runIn.picker.note}
            placement="bottom-end"
            flip={false}
            data-figma="run in picker"
          >
            <RunInPicker picker={runIn.picker} />
          </Popover>
        )}
      </Inline>
    </Panel>
  )
}
