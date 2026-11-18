// One entry of a chat pane's transcript: Erik's message, a tool line, an
// agent's reply with Copy, progress lines or a command waiting for approval
// (D1 105:210 to 105:291), or a line that records an event, such as where a
// fork starts (D16 417:718). The caller names the entry's Figma layer. Props only.
import {
  Button,
  CopyIcon,
  Message,
  ProposalBlock,
  ProposalCommand,
  Stack,
  ToolLine,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ChatEntry } from '../types.ts'

// The progress lines keep their leading spaces, as a terminal does.
const progress = css({ textStyle: 'mono', color: 'fg.muted', whiteSpace: 'pre' })

export type ChatEntryViewProps = {
  entry: ChatEntry
  /** The Figma layer the entry stands for, for the fidelity checks. */
  figma?: string | undefined
  onAct?: ((action: string) => void) | undefined
}

export function ChatEntryView({ entry, figma, onAct }: ChatEntryViewProps) {
  switch (entry.type) {
    case 'user':
      return (
        <div data-figma={figma}>
          <Message from="user">{entry.text}</Message>
        </div>
      )
    case 'tool':
      return <ToolLine name={entry.name} target={entry.target} state={entry.running === true ? 'running' : 'done'} />
    case 'event':
      // Figma draws the event as a tool line: the done dot and the text in mono (D16 417:718).
      return <ToolLine name={entry.text} state="done" stateLabel={entry.label} />
    case 'assistant':
      return (
        <div data-figma={figma}>
          <Message
            kind={entry.kind}
            name={entry.name}
            actions={
              entry.copy === undefined ? undefined : (
                <Button size="xs" textSize="xs">
                  <CopyIcon size="12" />
                  {entry.copy}
                </Button>
              )
            }
          >
            {entry.text}
          </Message>
        </div>
      )
    case 'progress':
      return (
        <Stack gap="10">
          {entry.lines.map((line) => (
            <span key={line} className={progress}>
              {line}
            </span>
          ))}
        </Stack>
      )
    case 'approval':
      return (
        <div data-figma={figma}>
          <ProposalBlock
            tone="approval"
            label={entry.label}
            title={entry.title}
            actions={entry.actions.map((label, i) => ({
              label,
              // Figma draws Deny as a filled button with red text, like Always allow (D5 158:310).
              variant: i === 0 ? 'primary' : i === entry.actions.length - 1 ? 'secondaryDanger' : 'secondary',
              onClick: () => onAct?.(label),
            }))}
          >
            <ProposalCommand>{entry.command}</ProposalCommand>
          </ProposalBlock>
        </div>
      )
  }
}
