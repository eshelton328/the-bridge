// The live transcripts of the Workspaces page (slice 3b), for its entry: in
// development, while the page reads live, it loads liveTranscript.ts, gives
// each chat pane the way to read its transcript while it shows
// (`TranscriptWatch`) and puts each read transcript in its pane. A build and
// the fixtures have no live code and no transcripts.
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import type { TranscriptWatch } from './blocks/ChatPane.tsx'
import type * as LiveTranscript from './liveTranscript.ts'
import type { WorkspacesData } from './types.ts'

const noViews: ReadonlyMap<string, LiveTranscript.TranscriptView> = new Map()
const noSubscribe = () => () => undefined
const getNoViews = () => noViews

/** `data` with the read transcripts in their panes, and the panes' TranscriptWatch; `on` false: `data` as it is. */
export function useLiveTranscripts(
  on: boolean,
  data: WorkspacesData,
): { data: WorkspacesData; transcripts: TranscriptWatch | undefined } {
  const [live, setLive] = useState<typeof LiveTranscript>()
  useEffect(() => {
    if (!on) return
    let gone = false
    void import('./liveTranscript.ts').then((loaded) => {
      if (!gone) setLive(loaded)
    })
    return () => {
      gone = true
    }
  }, [on])
  const shown = on ? live : undefined
  const views = useSyncExternalStore(shown?.subscribeTranscripts ?? noSubscribe, shown?.transcriptViews ?? getNoViews)
  const transcripts = useMemo(
    () => (shown === undefined ? undefined : { watch: shown.watchTranscript, retry: shown.retryTranscript }),
    [shown],
  )
  const withViews = useMemo(
    () => (shown === undefined ? data : shown.withTranscripts(data, views)),
    [shown, data, views],
  )
  return { data: withViews, transcripts }
}
