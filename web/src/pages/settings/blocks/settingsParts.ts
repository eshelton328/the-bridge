// The shared styles of the Settings sections: the rows of a section, one
// setting's label, control and line, and the line's text.
import { css } from '../../../../styled-system/css/index.js'

export const rows = css({ display: 'flex', flexDirection: 'column', gap: '16' })
export const row = css({ display: 'flex', flexDirection: 'column', gap: '8' })
export const rowLabel = css({ textStyle: 'label', color: 'fg.default' })
export const note = css({ textStyle: 'small', color: 'fg.muted' })
