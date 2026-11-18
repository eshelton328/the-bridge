// The subagents of a chat on the phone (M6 105:3176): the back row to the
// chat, the large title and the count line ("3 · 2 running"), then a card
// for each subagent and subtask (SubagentCard) with its state, time and
// tokens, its transcript and Stop, and a chevron that opens its full
// transcript (M12). The header stays at the top and only the cards scroll
// (d-107, `ScrollFrame`). At a tablet's width (T3 105:2020, `device="tablet"`)
// the view takes the tablet's inset, the count line can name the chat the
// subagents started from, and Start a subtask follows the cards. Props only.
import { BackRow, Button, PageHeader, ScrollFrame, SparkleIcon } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { SidebarLayers, SubagentsPanel } from '../types.ts'
import { SubagentCard } from './SubagentCard.tsx'

// The detail slot is a flex column; the view fills it.
const column = css({ display: 'flex', flexDirection: 'column', flex: '1', minW: '[0]', minH: '[0]' })
// M6 105:3176: the header is 16 in from the screen's sides and ends 8 under the count line. Figma's back row is 17
// high, 4 under the status bar, and `BackRow` is 28 (LIBRARY_GAPS.md: Phone back row), so it starts at the header's top
// and the title follows it with no gap, where Figma puts 4 between the parts.
const header = css({ display: 'flex', flexDirection: 'column', px: '16', pb: '8' })
// T3 105:2020: on the tablet the back row (105:2021, 18 high) is 12 under the status bar and the parts 22 in from the
// sides. The 28 px `BackRow` starts 8 under the bar so it is centred near Figma's, and the inset is the tablet
// Container's 24 (Figma's 22 is off the 4 px grid).
const tabletHeader = css({ display: 'flex', flexDirection: 'column', px: '24', pt: '8', pb: '8' })
// The back row's box is as wide as its button, as Figma's (105:3177).
const back = css({ display: 'flex', alignSelf: 'flex-start', maxW: '[100%]' })
// The title and the count line are as wide as their text, as Figma's (105:3181, 105:3185).
const hug = css({ alignSelf: 'flex-start' })
const countLine = css({ alignSelf: 'flex-start', textStyle: 'mono', color: 'fg.subtle', m: '0' })
// M6 105:3186: the cards are 16 in from the sides, 4 under the header and 10 apart.
const cards = css({ px: '16', pt: '4', pb: '16', gap: '10' })
// T3 105:2030: on the tablet the cards are 8 under the header and 12 apart, and Start a subtask follows them 12 under.
const tabletCards = css({ px: '24', pt: '8', pb: '20', gap: '12' })
// Start a subtask is as wide as its label (105:2087), with the sparkle in the discuss colour (105:2088). Figma's button
// is 30 high with a 14 px sparkle (LIBRARY_GAPS.md: Tablet subtask button); `Button size="sm"` is 28 with a 16 px one,
// which keeps its width at Figma's 129.
const start = css({ alignSelf: 'flex-start' })
const sparkle = css({ display: 'inline-flex', color: 'accent.discuss' })

export type PhoneSubagentsProps = {
  /** The device whose width the view has: the phone (the default) or a tablet (T3). */
  device?: 'phone' | 'tablet' | undefined
  panel: SubagentsPanel
  /** The chat the subagents work for: the back row's label. */
  chat: string
  /** The accessible name of the back button; "Back to" and the chat when not set. */
  backLabel?: string | undefined
  onBack?: (() => void) | undefined
  /** The subagents whose transcript is open. */
  open: readonly string[]
  onOpenChange?: ((open: string[]) => void) | undefined
  /** Opens a subagent's full transcript (M12); a subagent without one has its chevron disabled. */
  onOpenTranscript?: ((id: string) => void) | undefined
  /** Starts a subtask: Start a subtask under the cards, with `panel.startSubtask` (T3); none when not set. */
  onStartSubtask?: (() => void) | undefined
  /** The frame's Figma layers. */
  layers?: SidebarLayers | undefined
}

export function PhoneSubagents(props: PhoneSubagentsProps) {
  const { device = 'phone', panel, chat, backLabel, onBack, open, onOpenChange, onOpenTranscript, layers } = props
  const { onStartSubtask } = props
  const running = panel.items.filter((i) => i.status.tone === 'running' || i.status.tone === 'working').length
  const total = String(panel.items.length)
  const count = panel.running === undefined ? total : `${total} · ${String(running)} ${panel.running}`
  const summary = panel.startedFrom === undefined ? count : `${count} · ${panel.startedFrom} ${chat}`
  const tablet = device === 'tablet'
  return (
    <section aria-label={panel.title} className={column}>
      <ScrollFrame
        bodyClassName={tablet ? tabletCards : cards}
        header={
          <div className={tablet ? tabletHeader : header} data-figma={layers?.subagentsHeader}>
            <div className={back} data-figma={layers?.phoneBack}>
              <BackRow label={chat} backLabel={backLabel} onBack={onBack} />
            </div>
            <div className={hug} data-figma={layers?.subagentsTitle}>
              <PageHeader size="phone" title={panel.title} />
            </div>
            <p className={countLine} data-figma={layers?.subagentsCount}>
              {summary}
            </p>
          </div>
        }
      >
        {panel.items.map((item) => (
          <SubagentCard
            key={item.id}
            item={item}
            labels={panel}
            size="phone"
            figma={layers?.subagentCards?.[item.id]}
            figmaOpen={layers?.subagentChevrons?.[item.id]}
            transcriptOpen={open.includes(item.id)}
            onTranscriptOpenChange={(next) =>
              onOpenChange?.(next ? [...open, item.id] : open.filter((id) => id !== item.id))
            }
            openLabel={panel.openTranscript === undefined ? undefined : `${panel.openTranscript} ${item.title}`}
            // A subagent with no full transcript would open a blank screen, as the sidebar only selects a chat that
            // has a pane; without `onOpenTranscript` (M6) the chevrons stay as Figma draws them.
            openDisabled={onOpenTranscript !== undefined && item.full === undefined}
            onOpen={
              onOpenTranscript === undefined || item.full === undefined
                ? undefined
                : () => {
                    onOpenTranscript(item.id)
                  }
            }
          />
        ))}
        {panel.startSubtask === undefined || onStartSubtask === undefined ? null : (
          <div className={start} data-figma={layers?.subagentsStart}>
            <Button size="sm" textSize="sm" onClick={onStartSubtask}>
              <span className={sparkle}>
                <SparkleIcon size="16" />
              </span>
              {panel.startSubtask}
            </Button>
          </div>
        )}
      </ScrollFrame>
    </section>
  )
}
