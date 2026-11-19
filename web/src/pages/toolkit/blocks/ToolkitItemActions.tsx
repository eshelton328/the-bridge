// An open item's actions: Discuss and Show on map, 10 apart (D3 427:251). On
// the desktop they sit at the end of the meta row; on a tablet at the end of
// the back row, 8 apart (T3 428:543). On the phone (M2 429:285) they are
// icon buttons, 8 apart: Discuss 28 high, Show on map 36 square. On the
// Files tab of the phone, when the item shows no path badge (M5 435:199, M6
// 435:483), a copy button comes first, as Show on map is drawn. Props only.
import { Button, ChatIcon, CopyIcon, MapIcon } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'

// D3 427:258: Show on map is 136 × 36; `lg` with `padding="compact"` draws it 136.7 × 36. Discuss (432:1086, 97 × 34)
// takes `md` with `padding="compact"`, 95.5 × 32: 34 is off the 4 px grid (LIBRARY_GAPS.md, Item action buttons).
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
  /** Icon buttons, as on the phone (M2), with the labels as their names. */
  iconOnly?: boolean | undefined
  /** On the phone, a copy button before Discuss (M5 `button · copy`): its name and what it does. */
  copy?: { label: string; onCopy: () => void } | undefined
}

export function ToolkitItemActions({
  gap = '10',
  onDiscuss,
  onShowOnMap,
  iconOnly = false,
  copy,
}: ToolkitItemActionsProps) {
  if (iconOnly) {
    // M2 496:2 is 36 × 28 with a 14 px icon and 429:291 36 × 36 with a 17 px icon: Discuss takes `sm` with
    // `iconOnlyWidth="lg"` (36 × 28) and Show on map `lg` (36 × 36), each with its 16 px icon (LIBRARY_GAPS.md, Item
    // action buttons).
    return (
      <div className={actions[gap]}>
        {copy === undefined ? null : (
          // M5 435:199: 36 × 36 with a 17 px icon, as Show on map (LIBRARY_GAPS.md, Item action buttons).
          <Button
            variant="secondary"
            size="lg"
            iconOnly
            aria-label={copy.label}
            data-figma="button · copy"
            onClick={copy.onCopy}
          >
            <CopyIcon />
          </Button>
        )}
        <Button
          variant="primary"
          size="sm"
          iconOnly
          iconOnlyWidth="lg"
          aria-label="Discuss"
          data-figma="button · Discuss"
          onClick={onDiscuss}
        >
          <ChatIcon />
        </Button>
        <Button
          variant="secondary"
          size="lg"
          iconOnly
          aria-label="Show on map"
          data-figma="button · map"
          onClick={onShowOnMap}
        >
          <MapIcon />
        </Button>
      </div>
    )
  }
  return (
    <div className={actions[gap]}>
      <Button variant="primary" padding="compact" data-figma="button · Discuss" onClick={onDiscuss}>
        <ChatIcon />
        Discuss
      </Button>
      <Button variant="secondary" size="lg" padding="compact" data-figma="button · Show on map" onClick={onShowOnMap}>
        <MapIcon />
        Show on map
      </Button>
    </div>
  )
}
