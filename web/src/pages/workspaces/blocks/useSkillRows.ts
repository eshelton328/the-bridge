// The rows of a composer's "/" list. A live Claude chat's list (review R34)
// is its own: the page reads it each time the list opens for the chat the
// pane shows then (`SkillLists.read`; the read stops when the list closes,
// the chat changes or the pane unmounts, so a late answer changes
// nothing), and shows that chat's last list at once while the read runs.
// The pane renders again when its own chat's list changes, never the page
// or a transcript. Its filter is R34's (skillLists.ts `filterRows`). A
// sample chat lists the state's Figma skills, and keeps Figma's filter: the
// names that start with what the owner typed (M10 lists /writer alone for
// "/wri").
import { useEffect, useMemo, useSyncExternalStore } from 'react'
import type { Skill, WorkbenchPane, WorkspacesUi } from '../types.ts'
import type { ChatCommandValue } from './chatCommands.ts'
import { filterRows, liveRows, type SkillLists, type SkillRow } from './skillLists.ts'

/** A live Claude chat's list: the page's reads, and its commands. */
export type LiveSkillList = {
  readonly lists: SkillLists
  /** The chat takes /compact and /clear now (idle or done); its command rows are off otherwise. */
  readonly takesCommands: boolean
  /** The owner picked /compact or /clear: the page opens its dialog for this chat. */
  readonly onCommand: (command: ChatCommandValue) => void
}

/** The skills that "/" lists in a composer. */
export type ChatSkills = {
  label: string
  /** The label once the owner has typed more than the "/", with {query} for what he typed (M10); `label` when not set. */
  matching?: string | undefined
  /** The state's skills: a sample chat's list, the Figma one. */
  items: readonly Skill[]
  value: string | null
  open: boolean
  /** A live Claude chat's own list (R34), in place of `items`; none for a sample chat. */
  live?: LiveSkillList | undefined
}

const noSubscribe = () => () => undefined
const noView = () => undefined

/** The rows `skills` lists for `query` (what the owner typed from the "/", or null for none). */
export function useSkillRows(
  skills: ChatSkills | undefined,
  liveChat: string | undefined,
  query: string | null,
): SkillRow[] {
  const live = liveChat === undefined ? undefined : skills?.live
  const lists = live?.lists
  const view = useSyncExternalStore(
    lists?.subscribe ?? noSubscribe,
    lists === undefined || liveChat === undefined ? noView : () => lists.view(liveChat),
  )
  const open = skills?.open === true
  // Each open reads the list again; a close, another chat or an unmount stops the read.
  useEffect(
    () => (open && lists !== undefined && liveChat !== undefined ? lists.read(liveChat) : undefined),
    [open, lists, liveChat],
  )
  const items = skills?.items
  const takesCommands = live?.takesCommands === true
  return useMemo(() => {
    if (view !== undefined) {
      const rows = liveRows(view, takesCommands)
      return query === null ? rows : filterRows(rows, query)
    }
    const sample = items ?? []
    return query === null ? [...sample] : sample.filter((s) => s.name.startsWith(query))
  }, [view, takesCommands, items, query])
}

/**
 * The live list of `pane`, a live Claude chat (`liveChat`): the page's reads, whether it takes commands now, and its
 * commands' dialogs, which `change` opens for it and which close the list. None for a sample chat, a Codex chat or
 * when the page shows fixtures (`lists` not set).
 */
export function liveSkillList(
  lists: SkillLists | undefined,
  pane: WorkbenchPane,
  change: ((next: Partial<WorkspacesUi>) => void) | undefined,
): LiveSkillList | undefined {
  if (lists === undefined || pane.type !== 'chat' || pane.liveChat === undefined) return undefined
  return {
    lists,
    takesCommands: pane.takesCommands === true,
    onCommand: (command) => {
      change?.({ skillsFor: null, chatDialog: command, commandFor: pane.id, menuFor: null, moveOpen: false })
    },
  }
}
