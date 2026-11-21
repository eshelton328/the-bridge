// A live Claude chat's "/" list (review R34): `GET /api/chats/:chat/skills`
// (backend #352), read each time the list opens, through the typed RPC
// client with the chat ID URL-encoded once, and checked against the
// contract's `ChatSkillsResponse`. Any miss gives no list, so the page lists
// its commands alone (blocks/skillLists.ts). An unknown chat (404) and an ID
// with no machine (400) are states the page expects: no report. report()
// gets a SkillsReadMissError for a 5xx and for a reply the contract
// refuses, with the miss's kind only: never the chat, a skill's name or
// description, or the server's message. A read the page stops (the list
// closed) ends quietly.
import { ChatSkillsResponse } from '@bridge/contract'
import { report } from '../../errors/reporter.ts'
import { api } from '../../lib/api.ts'
import type { LiveSkill } from './blocks/skillLists.ts'
import { type LiveMiss, liveReadTimeoutMs, readChecked } from './liveWorkspaces.ts'

/** A skills read that missed, for report(): its kind, and nothing else. */
class SkillsReadMissError extends Error {
  readonly miss: string

  constructor(kind: string) {
    super(`A chat's skills read missed: ${kind}`)
    this.name = 'SkillsReadMissError'
    this.miss = kind
  }
}

/** A miss of the server's side (a 5xx), which report() gets; a 404, a 400, a timeout or no answer it does not. */
const serverFault = (miss: LiveMiss) =>
  miss.kind === 'internal' ||
  miss.kind === 'herdr-unavailable' ||
  miss.kind === 'herdr-bad-reply' ||
  (miss.kind === 'unreachable' && miss.status !== undefined) ||
  (miss.kind === 'status' && miss.status >= 500)

/** The skills of the live chat `chat` (its server ID), or none when the read missed or `signal` stopped it. */
export async function readSkills(chat: string, signal: AbortSignal): Promise<readonly LiveSkill[] | undefined> {
  try {
    const read = await readChecked(
      (init) =>
        api.api.chats[':chat'].skills.$get({ param: { chat: encodeURIComponent(chat) } }, { init: { signal: init } }),
      (body) => ChatSkillsResponse.parse(body),
      AbortSignal.any([signal, AbortSignal.timeout(liveReadTimeoutMs)]),
    )
    if (read.ok) return read.value.skills
    if (serverFault(read.error)) report(new SkillsReadMissError(read.error.kind), 'live')
    return undefined
  } catch {
    // The list closed: nothing to show and nothing to report.
    if (signal.aborted) return undefined
    // A reply the contract refuses, or a body that is not JSON.
    report(new SkillsReadMissError('bad-reply'), 'live')
    return undefined
  }
}
