// The trail over a subagent's full transcript on the phone (M12 147:339):
// a back chevron, the chat, "›" and Subagents. The chevron and Subagents
// return to the subagents, the chat returns to the chat. The library has no
// trail (LIBRARY_GAPS.md: Phone trail), so it is text `Button`s in a `nav`.
// Props only.
import { Button, ChevronLeftIcon, Inline } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { SubagentTranscriptLayers } from '../types.ts'

// Figma's trail is 26 high under the status bar, its 18 px chevron 12 in (147:340) and the chat 4 after it (147:342),
// "›" and Subagents 4 apart. The 24 px chevron button starts 8 in, so its 16 px icon starts at x 12 and ends 4 inside
// the button; the parts are 2 apart, and each text button's transparent border adds 1.
const row = css({ px: '8', pt: '2' })
// Figma draws the chat and Subagents in Geist Regular 14, cyan, with no padding (147:342, 147:344); a text button draws
// `labelLg` (Medium 16) and pads 8.
const crumb = css({ textStyle: 'body', px: '0' })
const separator = css({ textStyle: 'body', color: 'fg.muted' })
const icon = css({ display: 'flex' })

export type TranscriptTrailProps = {
  /** The trail's name for assistive technology. */
  label: string
  /** The chat the subagent works for. */
  chat: string
  /** The subagents view's title, "Subagents". */
  subagents: string
  onChat?: (() => void) | undefined
  onSubagents?: (() => void) | undefined
  /** The Figma layers of the trail, its chevron, the chat and Subagents. */
  layers?: SubagentTranscriptLayers | undefined
}

export function TranscriptTrail({ label, chat, subagents, onChat, onSubagents, layers }: TranscriptTrailProps) {
  return (
    <nav aria-label={label} className={row} data-figma={layers?.trail}>
      <Inline gap="2" align="center">
        <Button variant="text" size="xs" iconOnly aria-label={`Back to ${subagents}`} onClick={onSubagents}>
          <span className={icon} data-figma={layers?.back}>
            <ChevronLeftIcon size="16" />
          </span>
        </Button>
        <Button variant="text" size="xs" className={crumb} onClick={onChat}>
          <span data-figma={layers?.chat}>{chat}</span>
        </Button>
        <span className={separator} aria-hidden="true">
          ›
        </span>
        <Button variant="text" size="xs" className={crumb} onClick={onSubagents}>
          <span data-figma={layers?.subagents}>{subagents}</span>
        </Button>
      </Inline>
    </nav>
  )
}
