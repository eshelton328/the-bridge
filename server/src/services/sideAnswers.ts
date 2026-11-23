// Side questions about a Claude chat: the port asks a copy of the chat's session, and this service keeps each
// answer in memory as it comes, for the page to read and stream. One question of a chat at a time, at most
// `maxRunning` in all, each stopped after `timeoutMs`; the last `keep` answers stay. Nothing here logs.
import { randomBytes } from 'node:crypto'
import { type ChatId, maxEntryText, type SideAnswer, SideId } from '@bridge/contract'
import { ok, type Result } from '@bridge/shared'
import type { AgentPort, AgentPortError, SideChunk } from './agentPort.ts'

export type SideAsk = SideAnswer | 'notFound' | 'noSession' | 'busy'

export type SideAnswers = {
  /** Starts a side question: its first answer (`answering`, no text), or why not. */
  ask(chat: ChatId, question: string): Promise<Result<SideAsk, AgentPortError>>
  /** The answer as it is now; undefined when the server has no such answer of this chat. */
  get(chat: ChatId, side: SideId): SideAnswer | undefined
  /** Calls `listener` at each change of the answer; returns the stop, or undefined for no such answer. */
  watch(chat: ChatId, side: SideId, listener: (answer: SideAnswer) => void): (() => void) | undefined
  /** Stops an answer that is still answering as `stopped`; an answer that ended stays as it is. */
  stop(chat: ChatId, side: SideId): 'stopped' | 'ended' | 'notFound'
}

export type SideOptions = {
  readonly timeoutMs?: number
  readonly maxRunning?: number
  readonly keep?: number
  readonly newId?: () => string
}

export function createSideAnswers(
  agents: AgentPort,
  { timeoutMs = 120_000, maxRunning = 3, keep = 20, newId = () => randomBytes(8).toString('hex') }: SideOptions = {},
): SideAnswers {
  type Entry = {
    answer: SideAnswer
    readonly listeners: Set<(answer: SideAnswer) => void>
    readonly controller: AbortController
  }
  const change = (entry: Entry, next: Partial<SideAnswer>) => {
    entry.answer = { ...entry.answer, ...next }
    for (const listener of entry.listeners) listener(entry.answer)
  }
  // Insertion order is age order.
  const answers = new Map<SideId, Entry>()
  // Chats whose question the port has not answered yet; they count as running.
  const starting: ChatId[] = []
  const running = () => [
    ...[...answers.values()].filter((e) => e.answer.state === 'answering').map((e) => e.answer.chat),
    ...starting,
  ]
  const prune = () => {
    for (const [side, entry] of answers) {
      if (answers.size <= keep) break
      if (entry.answer.state !== 'answering') answers.delete(side)
    }
  }
  const follow = async (entry: Entry, chunks: AsyncIterable<SideChunk>) => {
    const { controller } = entry
    const timer = setTimeout(() => {
      if (entry.answer.state === 'answering') change(entry, { state: 'timedOut' })
      controller.abort()
    }, timeoutMs)
    let end: 'done' | 'failed' = 'failed'
    try {
      for await (const chunk of chunks) {
        if (entry.answer.state !== 'answering') break
        if ('end' in chunk) {
          end = chunk.end
          break
        }
        if (entry.answer.cut || chunk.text === '') continue
        const text = entry.answer.text + chunk.text
        const cut = text.length > maxEntryText
        change(entry, { text: cut ? text.slice(0, maxEntryText) : text, cut })
      }
    } catch {
      // The runner ends a fault as `failed` and does not throw; a throw anyway shows to the page as `failed`.
      end = 'failed'
    } finally {
      clearTimeout(timer)
      controller.abort()
    }
    if (entry.answer.state === 'answering') change(entry, { state: end })
  }
  return {
    async ask(chat, question) {
      const now = running()
      if (now.includes(chat) || now.length >= maxRunning) return ok('busy')
      const controller = new AbortController()
      starting.push(chat)
      const asked = await agents.askSide(chat, question, controller.signal)
      starting.splice(starting.indexOf(chat), 1)
      if (!asked.ok) return asked
      if (typeof asked.value === 'string') return ok(asked.value)
      const entry: Entry = {
        answer: { side: SideId.parse(newId()), chat, state: 'answering', text: '', cut: false },
        listeners: new Set(),
        controller,
      }
      answers.set(entry.answer.side, entry)
      prune()
      void follow(entry, asked.value)
      return ok(entry.answer)
    },
    get(chat, side) {
      const entry = answers.get(side)
      return entry?.answer.chat === chat ? entry.answer : undefined
    },
    watch(chat, side, listener) {
      const entry = answers.get(side)
      if (entry?.answer.chat !== chat) return undefined
      entry.listeners.add(listener)
      return () => entry.listeners.delete(listener)
    },
    stop(chat, side) {
      const entry = answers.get(side)
      if (entry?.answer.chat !== chat) return 'notFound'
      if (entry.answer.state !== 'answering') return 'ended'
      change(entry, { state: 'stopped' })
      entry.controller.abort()
      return 'stopped'
    },
  }
}
