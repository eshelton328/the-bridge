// Each live Claude chat's effort picker (W10, liveEffort.ts). A pick posts
// the level to the chat, one at a time for each chat. After a 204 the chip
// shows the set level at once, until the page reads the list again (the
// server's `workspaces.changed` comes at once): from then on the list's
// level shows, as the server lists the set level until the chat's next turn.
import type { ChatEffort, KeyEffort } from '@bridge/contract'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { report } from '../../errors/reporter.ts'
import type { EffortAnswer, EffortControl } from './blocks/EffortPicker.tsx'

/** The line of a pick whose module did not load; the same as the server's other misses. */
const failedLine = 'Could not change the effort'

/**
 * The effort control of a live chat: `of(chat, liveChat, listed)` for the pane `chat`, whose server ID is `liveChat`
 * and whose list gives `listed`. `list` is the loaded list: a new one ends the level a 204 showed.
 */
export function useLiveEffort(on: boolean, list: unknown) {
  const [set, setSet] = useState<ReadonlyMap<string, { level: KeyEffort; list: unknown }>>(() => new Map())
  const listRef = useRef(list)
  useLayoutEffect(() => {
    listRef.current = list
  })
  const inFlightRef = useRef(new Set<string>())
  const pick = useCallback((chat: string, liveChat: string, level: KeyEffort): Promise<EffortAnswer> => {
    if (inFlightRef.current.has(chat)) return Promise.resolve({ line: failedLine })
    inFlightRef.current.add(chat)
    return import('./liveEffort.ts')
      .then(
        (m) => m.setEffort(liveChat, level),
        (error: unknown): EffortAnswer => {
          report(error, 'handler')
          return { line: failedLine }
        },
      )
      .then((answer) => {
        inFlightRef.current.delete(chat)
        if (answer === true) setSet((prev) => new Map(prev).set(chat, { level, list: listRef.current }))
        return answer
      })
  }, [])
  const of = (
    chat: string,
    liveChat: string | undefined,
    listed: ChatEffort | undefined,
  ): EffortControl | undefined => {
    if (!on || liveChat === undefined) return undefined
    const shown = set.get(chat)
    return {
      level: shown !== undefined && shown.list === list ? shown.level : listed,
      pick: (level) => pick(chat, liveChat, level),
    }
  }
  return { of }
}
