// What a live chat shows in place of a part the live source does not read
// yet (d-117): "Transcript not live yet" in a chat's transcript, "Terminal
// not live yet" in a shell's terminal, so a live chat never shows sample
// text. The library has no quiet empty state (LIBRARY_GAPS.md "Not live
// yet"): the closest part is ErrorState's `pane` build in the neutral tone.
// Props only.
import { ErrorState } from '../../../errors/ErrorState.tsx'

export type NotLiveProps = {
  /** What is not live yet, such as "Transcript not live yet". */
  text: string
}

export function NotLive({ text }: NotLiveProps) {
  return <ErrorState size="pane" tone="neutral" title={text} level={3} />
}
