// The open item's main action pinned at the bottom of the phone's screen,
// above the tab bar, full width: Start (M2 346:9386) or the answer (M5).
// The page scrolls under it. Props only.
import { Button, PlayIcon } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'

// M2 346:9386: the button 13 below the bar's top edge (12 on the grid, d-072), 16 in and 12 above the tab bar.
const bar = css({
  position: 'sticky',
  bottom: '0',
  px: '16',
  py: '12',
  bg: 'surface.chrome',
  borderTopWidth: 'default',
  borderTopStyle: 'solid',
  borderTopColor: 'border.default',
})
const wide = css({ w: '[100%]' })

export function PinnedAction({ label, onPress }: { label: string; onPress?: (() => void) | undefined }) {
  return (
    <div className={bar} data-figma="sticky action">
      <Button variant="primary" size="xl" className={wide} onClick={onPress}>
        <PlayIcon />
        {label}
      </Button>
    </div>
  )
}
