// The body of a richer push (bridge-coord, 2026-11-23, settings-page.md):
// what a chat did or waits on, in one short line of plain text. Done: the
// first sentence of the last assistant text. Needs you: the tool the chat
// waits on ("Wants to run: pnpm"), else the last question it asked. It reads
// only assistant text and a tool entry's name and target, never a tool
// result; it drops code blocks and Markdown, and gives null for a text that
// looks like a secret, so the push then shows today's line.
import { maxPushBody, type PushEvent, type TranscriptEntry } from '@bridge/contract'

/** A token, key or password shape: a push with one shows no preview at all. */
const secretShapes = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\b(?:sk|pk|rk)-[A-Za-z0-9_-]{16,}/,
  /\b(?:ghp|gho|ghu|ghs|ghr|github_pat)_[A-Za-z0-9_]{16,}/,
  /\bxox[abposr]-[A-Za-z0-9-]{10,}/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
  /\b(?:password|passwd|secret|token|api[_-]?key)\s*[:=]\s*\S+/i,
  /[A-Za-z0-9+/_-]{32,}/,
]

/** Whether `text` holds something that looks like a secret. */
export function looksSecret(text: string): boolean {
  return secretShapes.some((shape) => shape.test(text))
}

/** Markdown as plain text: no code blocks, no inline code marks, links as their text, no emphasis, headings or list marks. */
export function plainText(markdown: string): string {
  return markdown
    .replace(/(`{3,}|~{3,})[\s\S]*?(?:\1|$)/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/^\s{0,3}(?:#{1,6}\s+|>\s?|[-*+]\s+|\d+[.)]\s+|\|)/gm, '')
    .replace(/\|/g, ' ')
    .replace(/(\*\*|__|\*|_|~~)(\S(?:.*?\S)?)\1/g, '$2')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** The sentences of plain text, each with its end mark: a sentence ends only at a mark before a space or the end, so "SettingsPage.tsx" stays one word. */
const sentences = (text: string): string[] =>
  text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s !== '')

/** `text` cut to at most `maxPushBody` characters at a word, with "…" when cut. */
export function cutAtWord(text: string, max: number = maxPushBody): string {
  const chars = Array.from(text)
  if (chars.length <= max) return text
  const head = chars.slice(0, max - 1).join('')
  const space = head.lastIndexOf(' ')
  return `${(space > max / 2 ? head.slice(0, space) : head).trimEnd()}…`
}

/** A tool the chat waits on, as one line. */
function toolLine(entry: Extract<TranscriptEntry, { type: 'tool' }>): string {
  if (entry.kind === 'shell') return `Wants to run: ${entry.target === '' ? (entry.label ?? entry.name) : entry.target}`
  return entry.target === '' ? `Wants to use ${entry.name}` : `Wants to use ${entry.name}: ${entry.target}`
}

/** The text of the last assistant entry, plain; '' with none. */
function lastAssistant(entries: readonly TranscriptEntry[]): string {
  for (let i = entries.length - 1; i >= 0; i -= 1) {
    const entry = entries[i]
    if (entry?.type === 'assistant') return plainText(entry.text)
    if (entry?.type === 'user') return ''
  }
  return ''
}

/** The preview line of a push, or null for today's line. */
export function previewOf(event: PushEvent, entries: readonly TranscriptEntry[]): string | null {
  const last = entries.at(-1)
  // The secret check reads the whole text first, so a cut can never leave a part of a secret.
  const source = event === 'needsYou' && last?.type === 'tool' ? toolLine(last) : lastAssistant(entries)
  if (looksSecret(source)) return null
  const raw =
    event === 'done'
      ? (sentences(source)[0] ?? '')
      : last?.type === 'tool'
        ? source
        : (sentences(source).findLast((s) => s.endsWith('?')) ?? '')
  const line = raw.trim()
  if (line === '' || looksSecret(line)) return null
  return cutAtWord(line)
}
