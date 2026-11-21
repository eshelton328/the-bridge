// A live Claude chat's "/" list (review R34): the page's own commands,
// /compact and /clear, then the chat's skills as the server reads them
// (`GET /api/chats/:chat/skills`, backend #352), never the Figma sample.
// The page reads the list each time it opens for the chat it is open for,
// and shows that chat's last list at once while the read runs; a read that
// answers after the list closed, or for another chat, changes nothing the
// owner sees. A list that missed, or a chat with no skills, lists the
// commands alone. The server's built-ins other than compact and clear
// (model, effort) never show: their pickers are on hold, and sending them
// changes the owner's own Claude Code settings. The owner filters the list
// by what he types after "/": the names that start with it, then the names
// that hold it, then the descriptions that hold it, each group in the
// server's order. The reads are the page's (useLiveSkills.ts); this file
// has no live code.
import type { ChatSkill, SkillSource } from '@bridge/contract'
import type { ChatCommandValue } from './chatCommands.ts'

/** What a chat's list shows now: its skills from the last read that answered, none before it or after a miss. */
export type SkillListView = { readonly skills: readonly ChatSkill[] }

/** The page's reads of each live chat's "/" list. */
export type SkillLists = {
  /** Calls `listener` after each change of any chat's list; the result stops it. */
  readonly subscribe: (listener: () => void) => () => void
  /** The list of `chat` (its server ID) now: one object until it changes. */
  readonly view: (chat: string) => SkillListView
  /** Reads the list of `chat` again; the result stops the read, and an answer after that changes nothing. */
  readonly read: (chat: string) => () => void
}

/**
 * Reads the skills of `chat` (its server ID): the list, or none when the read missed. It stops when `signal` aborts,
 * as a list that closed stops it.
 */
export type ReadSkills = (chat: string, signal: AbortSignal) => Promise<readonly ChatSkill[] | undefined>

const none: SkillListView = { skills: [] }

/** The reads of each chat's list, through `readSkills`. */
export function createSkillLists(readSkills: ReadSkills): SkillLists {
  const views = new Map<string, SkillListView>()
  const listeners = new Set<() => void>()
  // The newest read of each chat: an older read's answer changes nothing.
  const newest = new Map<string, object>()
  return {
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    view: (chat) => views.get(chat) ?? none,
    read: (chat) => {
      const abort = new AbortController()
      const token = {}
      newest.set(chat, token)
      readSkills(chat, abort.signal).then(
        (skills) => {
          if (abort.signal.aborted || newest.get(chat) !== token) return
          // A miss lists the commands alone, never an older list (R34 decision 6).
          views.set(chat, skills === undefined || skills.length === 0 ? none : { skills })
          for (const listener of listeners) listener()
        },
        () => undefined,
      )
      return () => {
        abort.abort()
      }
    },
  }
}

/** A row of the "/" list: a skill, or one of the page's commands, which opens its dialog. */
export type SkillRow = {
  /** The text a pick puts in the box, with its "/", such as "/writer". */
  readonly name: string
  readonly description: string
  /** A project's or a plugin's skill names its source in a badge; none for the others. */
  readonly source?: SkillSource | undefined
  /** One of the page's commands: a pick opens its dialog instead of typing it. */
  readonly command?: ChatCommandValue | undefined
  /** A command the chat does not take now (it works or waits for an answer): shown off, as its menu row is. */
  readonly disabled?: boolean | undefined
}

/**
 * The page's commands in a live Claude chat's list, in the server's order. Each pick opens its dialog (W5), as its menu
 * row does, so the line says what the command does, in words of its own.
 */
const commandRows: readonly { command: ChatCommandValue; description: string }[] = [
  { command: 'compact', description: 'Summarise the chat to free its context' },
  { command: 'clear', description: 'Start the chat over with an empty context' },
]

/**
 * The rows of a live Claude chat's list: /compact and /clear (off when the chat does not take commands now), then the
 * chat's skills in the server's order, without its built-ins.
 */
export function liveRows(view: SkillListView, takesCommands: boolean): SkillRow[] {
  const commands = commandRows.map(
    (c): SkillRow => ({
      name: `/${c.command}`,
      description: c.description,
      command: c.command,
      disabled: !takesCommands,
    }),
  )
  const skills = view.skills
    .filter((s) => s.source !== 'builtin')
    .map((s): SkillRow => ({ name: `/${s.name}`, description: s.description, source: s.source }))
  return [...commands, ...skills]
}

/**
 * The rows that match `query`, what the owner typed from the "/" (such as "/wri"): case aside, the names that start
 * with it, then the names that hold it, then the descriptions that hold it, each group in the list's order. A query of
 * "/" alone keeps every row.
 */
export function filterRows<T extends { readonly name: string; readonly description: string }>(
  rows: readonly T[],
  query: string,
): T[] {
  const typed = query.replace(/^\//, '').toLowerCase()
  if (typed === '') return [...rows]
  const bare = (row: T) => row.name.replace(/^\//, '').toLowerCase()
  const starts = rows.filter((r) => bare(r).startsWith(typed))
  const holds = rows.filter((r) => !bare(r).startsWith(typed) && bare(r).includes(typed))
  const described = rows.filter((r) => !bare(r).includes(typed) && r.description.toLowerCase().includes(typed))
  return [...starts, ...holds, ...described]
}
