// One entry of a running chat in the Inbox: Erik's message, the agent's
// reply with Copy, or a tool line. Props only.
import { Button, CopyIcon, Message, ToolLine } from '@eshelton328/component-library-1701'
import type { InboxChatEntry } from '../types.ts'

export function ChatEntry({ entry }: { entry: InboxChatEntry }) {
  switch (entry.type) {
    case 'user':
      return <Message from="user">{entry.text}</Message>
    case 'assistant':
      return (
        <Message
          kind={entry.agent}
          name={entry.name}
          actions={
            <Button size="xs" textSize="xs">
              <CopyIcon />
              Copy
            </Button>
          }
        >
          {entry.text}
        </Message>
      )
    case 'tool':
      return <ToolLine name={entry.name} target={entry.target} state={entry.state} />
  }
}
