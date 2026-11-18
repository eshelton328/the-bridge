// One subagent or subtask in the subagents panel (D3 105:1322): the sparkle,
// the title and the status, the agent's meta line, a description, the last
// lines of its transcript when open, then Transcript and, while it runs,
// Stop. On the phone (M6 105:3187) a chevron after the status opens the full
// transcript (M12). The library has no subagent card (LIBRARY_GAPS.md:
// Subagent card), so it is a section `Panel` with no title. Props only.
import {
  Button,
  ChevronRightIcon,
  Inline,
  Panel,
  SparkleIcon,
  Stack,
  StatusPill,
  StopIcon,
} from '@eshelton328/component-library-1701'
import { css, cx } from '../../../../styled-system/css/index.js'
import type { Subagent } from '../types.ts'

const sparkle = css({ display: 'inline-flex', color: 'accent.discuss' })
const title = css({ textStyle: 'label', color: 'fg.default', flex: '1', minW: '[0]', m: '0' })
const meta = css({ textStyle: 'mono', color: 'fg.muted', m: '0' })
// On the phone Figma draws the meta line in Geist Mono 11 (M6 105:3232), so the subtask's fits on one line.
const metaPhone = css({ textStyle: 'monoSm', color: 'fg.muted', m: '0' })
const description = css({ textStyle: 'small', color: 'fg.muted', m: '0' })
// Figma draws the chevron bare and grey (M6 147:15), where a text button draws its icon in the accent colour. The
// 24 px button reaches 2 above and below so the title row keeps the status pill's 20 px; at the end it stays inside
// the Panel's body, which scrolls what passes its edge, so the icon ends 4 in from the button's end.
const chevron = css({ color: 'fg.muted', my: '-2' })
const icon = css({ display: 'flex' })
// The transcript's last lines in mono on the well, as a terminal shows them (LIBRARY_GAPS.md: Terminal output).
const transcript = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  py: '8',
  px: '10',
  bg: 'surface.well',
  borderRadius: 'md',
  color: 'fg.muted',
})
// The lines in Geist Mono 12 (D3); on the phone Figma draws them in Geist Mono 11, as the meta line (M6 105:3210).
const transcriptText = { pane: css({ textStyle: 'mono' }), phone: css({ textStyle: 'monoSm' }) }

export type SubagentCardProps = {
  item: Subagent
  labels: { showTranscript: string; hideTranscript: string; stop: string }
  transcriptOpen: boolean
  onTranscriptOpenChange?: ((open: boolean) => void) | undefined
  /** `phone` draws the meta line in the compact mono style (M6); `pane` (the default) as the desktop panel (D3). */
  size?: 'pane' | 'phone' | undefined
  /** The accessible name of the chevron that opens the full transcript (M6); not set, no chevron. */
  openLabel?: string | undefined
  onOpen?: (() => void) | undefined
  /** The subagent has no full transcript to open: the chevron stays in its place but is disabled (M12). */
  openDisabled?: boolean | undefined
  /** The Figma layer the card stands for, for the fidelity checks. */
  figma?: string | undefined
  /** The Figma layer of the chevron. */
  figmaOpen?: string | undefined
}

export function SubagentCard(props: SubagentCardProps) {
  const {
    item,
    labels,
    transcriptOpen,
    onTranscriptOpenChange,
    size,
    openLabel,
    onOpen,
    openDisabled,
    figma,
    figmaOpen,
  } = props
  const running = item.status.tone === 'running' || item.status.tone === 'working'
  return (
    <div data-figma={figma}>
      <Panel>
        {/* Figma's card parts are 6 apart (105:1322); the section Panel's body sets 8. */}
        <Stack gap="6">
          <Inline gap="8" align="center">
            <span className={sparkle}>
              <SparkleIcon size="16" />
            </span>
            <h3 className={title}>{item.title}</h3>
            <StatusPill label={item.status.label} tone={item.status.tone} dot />
            {openLabel === undefined ? null : (
              <Button
                variant="text"
                size="xs"
                iconOnly
                className={chevron}
                aria-label={openLabel}
                disabled={openDisabled}
                onClick={onOpen}
              >
                <span className={icon} data-figma={figmaOpen}>
                  <ChevronRightIcon size="16" />
                </span>
              </Button>
            )}
          </Inline>
          <p className={size === 'phone' ? metaPhone : meta}>{item.meta}</p>
          {item.description === undefined ? null : <p className={description}>{item.description}</p>}
          {transcriptOpen ? (
            <div className={cx(transcript, transcriptText[size ?? 'pane'])}>
              {item.transcript.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </div>
          ) : null}
          <Inline gap="6" align="center">
            <Button
              size="xs"
              textSize="xs"
              // A disclosure toggle keeps its own border while open (D3 105:1350, M6 105:3215).
              expandedBorder="default"
              aria-expanded={transcriptOpen}
              onClick={() => onTranscriptOpenChange?.(!transcriptOpen)}
            >
              {transcriptOpen ? labels.hideTranscript : labels.showTranscript}
            </Button>
            {running ? (
              <Button size="xs" textSize="xs" variant="secondaryDanger">
                <StopIcon size="12" />
                {labels.stop}
              </Button>
            ) : null}
          </Inline>
        </Stack>
      </Panel>
    </div>
  )
}
