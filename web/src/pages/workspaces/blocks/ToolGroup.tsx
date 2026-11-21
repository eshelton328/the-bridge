// A run of two or more live tool calls as one row (R32): the library's
// `ToolLine` with the run's summary ("Ran 3 commands, read 2 files"), its dot
// in the running colour while a call runs, and its chevron. A tap opens the
// run's own rows (`ToolRow`) under it. The newest run of a working chat stays
// open (`live`) until an entry follows it; a tap decides for the run from then
// on. The open state is the group's own, so a tap renders no other entry.
// Memoised on its calls, so a change elsewhere does not render it. Props only.
import { ToolLine } from '@eshelton328/component-library-1701'
import { memo, useState } from 'react'
import { type KindedTool, toolSummary } from './toolGroups.ts'
import { ToolRow } from './ToolRow.tsx'

export type ToolGroupProps = {
  calls: readonly KindedTool[]
  /** The newest run while the chat works: open until the owner closes it or an entry follows. */
  live: boolean
}

function ToolGroupView({ calls, live }: ToolGroupProps) {
  const [chosen, setChosen] = useState<boolean>()
  const open = chosen ?? live
  return (
    <ToolLine
      name={toolSummary(calls)}
      state={calls.some((call) => call.running === true) ? 'running' : 'done'}
      open={open}
      onOpenChange={setChosen}
    >
      {calls.map((call, i) => (
        <ToolRow
          // A run's calls keep their order; a call's place keys it.
          key={`${String(i)}:${call.name}`}
          kind={call.kind}
          title={call.title ?? call.name}
          label={call.label ?? ''}
          name={call.name}
          running={call.running}
        />
      ))}
    </ToolLine>
  )
}

const sameCalls = (a: ToolGroupProps, b: ToolGroupProps) =>
  a.live === b.live && a.calls.length === b.calls.length && a.calls.every((call, i) => call === b.calls[i])

export const ToolGroup = memo(ToolGroupView, sameCalls)
