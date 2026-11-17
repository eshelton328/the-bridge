// An open item's actions: Discuss and Show on map, 10 apart (D3 427:251). On
// the desktop they sit at the end of the meta row; on a tablet at the end of
// the back row, 8 apart (T3 428:543). Props only.
import { Button, ChatIcon, MapIcon } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'

// D3 427:258: Show on map is 36 high, but the lg button is 9 px wider than Figma's 136, so it takes the md size, as
// Discuss does (34 in Figma).
const actions = {
  '10': css({ display: 'flex', alignItems: 'center', gap: '10', ms: 'auto' }),
  '8': css({ display: 'flex', alignItems: 'center', gap: '8', ms: 'auto' }),
}

export type ToolkitItemActionsProps = {
  /** The space between the buttons: 10 in the desktop's meta row, 8 in the tablet's back row. */
  gap?: keyof typeof actions | undefined
  onDiscuss?: (() => void) | undefined
  /** Shows the item on the map. */
  onShowOnMap?: (() => void) | undefined
}

export function ToolkitItemActions({ gap = '10', onDiscuss, onShowOnMap }: ToolkitItemActionsProps) {
  return (
    <div className={actions[gap]}>
      <Button variant="primary" data-figma="button · Discuss" onClick={onDiscuss}>
        <ChatIcon />
        Discuss
      </Button>
      <Button variant="secondary" data-figma="button · Show on map" onClick={onShowOnMap}>
        <MapIcon />
        Show on map
      </Button>
    </div>
  )
}
