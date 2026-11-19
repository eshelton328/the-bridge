// A subagent's full transcript on the phone (M12 147:314), which the
// chevron of its card in the subagents opens (M6): the trail back to the
// chat and the subagents, the sparkle, the title and the status, the meta
// line and Stop over a rule; then the task the chat gave it, its tool calls
// and its messages; the read-only note at the foot. The header and the note
// stay put and only the transcript scrolls (d-107, `ScrollFrame`). Props
// only.
import {
  Button,
  Inline,
  PageHeader,
  Panel,
  ProposalBlock,
  ScrollFrame,
  SparkleIcon,
  StatusPill,
  StopIcon,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Subagent, SubagentTranscriptLayers } from '../types.ts'
import { ChatEntryView } from './ChatEntryView.tsx'
import { TranscriptTrail } from './TranscriptTrail.tsx'

// The detail slot is a flex column; the view fills it.
const column = css({ display: 'flex', flexDirection: 'column', flex: '1', minW: '[0]', minH: '[0]' })
// M12 147:345: the header is 16 in from the screen's sides, its parts 6 apart, 6 under the trail and 10 over the rule
// (147:366).
const header = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '6',
  px: '16',
  pt: '6',
  pb: '10',
  borderBottomWidth: 'default',
  borderBottomStyle: 'solid',
  borderBottomColor: 'border.default',
})
const sparkle = css({ display: 'inline-flex', color: 'accent.discuss' })
// The title is as wide as its text (147:349) and the status ends the row (147:351).
const title = css({ minW: '[0]' })
const status = css({ display: 'flex', ms: 'auto' })
// Figma draws the meta line in Geist Mono 11 (147:354), as the phone's subagent cards.
const meta = css({ alignSelf: 'flex-start', textStyle: 'monoSm', color: 'fg.muted', m: '0' })
// M12 147:356: Stop is 67 × 30, its 12 px icon 11 in from the start (147:357) and the label 6 after it (147:359), so
// it pads 10 inside its 1 px border; `Button size="sm"` pads 8 and puts its parts 4 apart.
const stop = css({ alignSelf: 'flex-start', px: '10', gap: '6' })
// M12 147:367: the transcript is 16 in from the sides, 12 under the rule, its parts 12 apart.
const body = css({ px: '16', pt: '12', pb: '12', gap: '12' })
// M12 147:370: the task is Geist Regular 13 on a 19 px line; `bodySm` is 13/20, its line on the 4 px grid (d-100).
const task = css({ textStyle: 'bodySm', color: 'fg.default', m: '0' })
// M12 147:387: the note is 16 in from the sides and ends 33 over the screen's end, where `AppShell` keeps a 34 px
// safe area with no tab bar, so the foot pads nothing under it.
const foot = css({ px: '16' })
// Figma's tool lines are as wide as their text (147:371); a message spans the transcript (147:377).
const hug = css({ alignSelf: 'flex-start', maxW: '[100%]' })
const note = css({ textStyle: 'small', color: 'fg.muted', m: '0' })

export type PhoneSubagentTranscriptProps = {
  item: Subagent
  /** The chat the subagent works for. */
  chat: string
  labels: { title: string; stop: string; trail: string; taskFrom: string; readOnly: string }
  /** The trail's chat: back to the chat. */
  onChat?: (() => void) | undefined
  /** The back chevron and Subagents: back to the subagents. */
  onSubagents?: (() => void) | undefined
  layers?: SubagentTranscriptLayers | undefined
}

export function PhoneSubagentTranscript({
  item,
  chat,
  labels,
  onChat,
  onSubagents,
  layers,
}: PhoneSubagentTranscriptProps) {
  const running = item.status.tone === 'running' || item.status.tone === 'working'
  const fill = (text: string) => text.replace('{chat}', chat)
  return (
    <section aria-label={item.title} className={column}>
      <ScrollFrame
        bodyClassName={body}
        header={
          <>
            <TranscriptTrail
              label={labels.trail}
              chat={chat}
              subagents={labels.title}
              onChat={onChat}
              onSubagents={onSubagents}
              layers={layers}
            />
            <div className={header} data-figma={layers?.header}>
              <Inline gap="8" align="center">
                <span className={sparkle}>
                  <SparkleIcon size="20" />
                </span>
                <div className={title} data-figma={layers?.title}>
                  <PageHeader size="page" title={item.title} />
                </div>
                <span className={status} data-figma={layers?.status}>
                  <StatusPill label={item.status.label} tone={item.status.tone} dot />
                </span>
              </Inline>
              <p className={meta} data-figma={layers?.meta}>
                {item.meta}
              </p>
              {running ? (
                <Button
                  size="sm"
                  textSize="sm"
                  variant="secondaryDanger"
                  keepIconSize
                  className={stop}
                  data-figma={layers?.stop}
                >
                  <StopIcon size="12" />
                  {labels.stop}
                </Button>
              ) : null}
            </div>
          </>
        }
        footer={
          <div className={foot}>
            <div data-figma={layers?.note}>
              <Panel variant="notice">
                <p className={note}>{fill(labels.readOnly)}</p>
              </Panel>
            </div>
          </div>
        }
      >
        {item.full === undefined ? null : (
          <>
            <div data-figma={layers?.task}>
              <ProposalBlock tone="update" label={fill(labels.taskFrom)} actions={[]}>
                <p className={task}>{item.full.task}</p>
              </ProposalBlock>
            </div>
            {item.full.entries.map((entry, i) => (
              <div
                key={`${entry.type}-${String(i)}`}
                className={entry.type === 'tool' ? hug : undefined}
                data-figma={layers?.entries?.[i]}
              >
                <ChatEntryView entry={entry} />
              </div>
            ))}
          </>
        )}
      </ScrollFrame>
    </section>
  )
}
