// One file sent with a prompt, as a chip above the owner's message. The chip
// cuts a long name, and its tooltip shows only on hover, so a tap on the chip
// opens a popover with the whole name, wrapped (review of #332). The library
// has no sent-file chip (LIBRARY_GAPS.md: Sent file chips): the chip is a
// `MetaChipButton` with the composer's clip icon. Props only.
import { ClipIcon, MetaChipButton, Popover } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'

// The whole name in the chip's mono text, broken anywhere, so a name with no space never widens the popover.
const fullName = css({ display: 'block', textStyle: 'mono', color: 'fg.default', overflowWrap: 'anywhere' })

export type SentFileChipProps = {
  /** The file's name, as sent: never a path. */
  name: string
}

export function SentFileChip({ name }: SentFileChipProps) {
  return (
    <Popover
      label="File name"
      placement="bottom-start"
      width="sm"
      trigger={<MetaChipButton label={name} icon={<ClipIcon size="12" />} />}
    >
      <span className={fullName}>{name}</span>
    </Popover>
  )
}
