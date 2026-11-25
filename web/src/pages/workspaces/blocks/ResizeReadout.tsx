// The readout beside the pointer while the owner drags a handle of the split (D14
// 402:7151): the split as a ratio and what a double-click does, in cyan mono
// near the handle, over the pane before it. The library has no resize readout
// (LIBRARY_GAPS.md): it is the library's outline `Badge` in the working tone.
// Props only.
import { Badge } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'

// Over the pane, taking no pointer. A column handle's readout sits at the pane's end, centred on its height, 8 in
// (Figma 9, d-100); a row handle's at its bottom, centred on its width.
const places = {
  end: css({
    position: 'absolute',
    inset: '0',
    zIndex: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    pe: '8',
    pointerEvents: 'none',
  }),
  bottom: css({
    position: 'absolute',
    inset: '0',
    zIndex: '1',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    pb: '8',
    pointerEvents: 'none',
  }),
}

export type ResizeReadoutProps = {
  /** The text, such as "60 : 40  ·  double-click for 50 : 50". */
  label: string
  /** `end` beside a handle between columns, `bottom` above one between rows. */
  placement: keyof typeof places
  /** The Figma layer the readout stands for, for the fidelity checks. */
  figma?: string | undefined
}

export function ResizeReadout({ label, placement, figma }: ResizeReadoutProps) {
  return (
    <div className={places[placement]} data-drag-layer="resize-readout">
      <span role="status" data-figma={figma} className={css({ display: 'inline-flex' })}>
        <Badge variant="outline" tone="working" label={label} />
      </span>
    </div>
  )
}
