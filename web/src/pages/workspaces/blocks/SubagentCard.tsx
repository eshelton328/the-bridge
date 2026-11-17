// One subagent or subtask in the subagents panel (D3 105:1322): the sparkle,
// the title and the status, the agent's meta line, a description, the last
// lines of its transcript when open, then Transcript and, while it runs,
// Stop. The library has no subagent card (LIBRARY_GAPS.md: Subagent card),
// so it is a section `Panel` with no title. Props only.
import { Button, Inline, Panel, SparkleIcon, Stack, StatusPill, StopIcon } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Subagent } from '../types.ts'

const sparkle = css({ display: 'inline-flex', color: 'accent.discuss' })
const title = css({ textStyle: 'label', color: 'fg.default', flex: '1', minW: '[0]', m: '0' })
const meta = css({ textStyle: 'mono', color: 'fg.muted', m: '0' })
const description = css({ textStyle: 'small', color: 'fg.muted', m: '0' })
// The transcript's last lines in mono on the well, as a terminal shows them (LIBRARY_GAPS.md: Terminal output).
const transcript = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  py: '8',
  px: '10',
  bg: 'surface.well',
  borderRadius: 'md',
  textStyle: 'mono',
  color: 'fg.muted',
})

export type SubagentCardProps = {
  item: Subagent
  labels: { showTranscript: string; hideTranscript: string; stop: string }
  transcriptOpen: boolean
  onTranscriptOpenChange?: ((open: boolean) => void) | undefined
  /** The Figma layer the card stands for, for the fidelity checks. */
  figma?: string | undefined
}

export function SubagentCard({ item, labels, transcriptOpen, onTranscriptOpenChange, figma }: SubagentCardProps) {
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
          </Inline>
          <p className={meta}>{item.meta}</p>
          {item.description === undefined ? null : <p className={description}>{item.description}</p>}
          {transcriptOpen ? (
            <div className={transcript}>
              {item.transcript.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </div>
          ) : null}
          <Inline gap="6" align="center">
            <Button
              size="xs"
              textSize="xs"
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
