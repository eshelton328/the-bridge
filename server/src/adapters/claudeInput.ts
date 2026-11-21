// Claude Code's input box, read from its pane's screen (slice W1-3). The
// box is the lines between the last two rules (lines of "─", the top one with
// the chat's name at its end when the chat has a name), and its first
// line starts with "❯". An empty box shows "❯" alone or a dim placeholder
// (SGR 2); a long line wraps onto lines that start with two spaces. Screen
// text never leaves the adapters (d-110), and none of it goes to a log.

const esc = String.fromCharCode(27)
const sgr = new RegExp(`${esc}\\[[0-9;]*m`, 'g')
/** A dim run up to the next escape: the placeholder of an empty box. */
const dimRun = new RegExp(`${esc}\\[2m[^${esc}]*`, 'g')
/** A rule of "─"; a named chat (`claude -n`) draws its name near the end of the top rule: "──── name ─". */
const rule = /^─{8,}(?: [^─]+ ─+)?$/

/** The effort levels in the order that Claude Code's effort keys step through them; the keys stop at each end. */
const keyEfforts = ['low', 'medium', 'high', 'xhigh'] as const
type KeyLevel = (typeof keyEfforts)[number]
/** The effort mark on or above the box's top rule: "◐ medium · /effort". */
const effortMark = /[○◐●◉] (low|medium|high|xhigh|max) · \/effort/

/**
 * The effort that a Claude Code screen shows near its input box (probe in a test herdr session, 2026-11-21): a
 * level, `none` when the box shows and no mark (Claude Code can hide the mark at `low`), null with no box.
 */
export function effortOf(screen: string): KeyLevel | 'max' | 'none' | null {
  const lines = screen.split(/\r?\n/).map((line) => line.replace(sgr, ''))
  const rules = lines.flatMap((line, at) => (rule.test(line.trim()) ? [at] : []))
  const top = rules.at(-2)
  if (top === undefined || inputBoxOf(screen) === null) return null
  const found = effortMark.exec(`${lines[top - 1] ?? ''} ${lines[top] ?? ''}`)?.[1]
  return keyEfforts.find((level) => level === found) ?? (found === 'max' ? 'max' : 'none')
}

/**
 * The effort keys that move a chat from `shown` to `effort`: the difference when the screen shows a level the keys
 * reach, else down to `low` first (the keys stop there) and then up.
 */
export function effortKeys(shown: ReturnType<typeof effortOf>, effort: KeyLevel): string[] {
  const to = keyEfforts.indexOf(effort)
  const from = keyEfforts.findIndex((level) => level === shown)
  if (from === -1)
    return [...Array<string>(keyEfforts.length - 1).fill('shift+down'), ...Array<string>(to).fill('shift+up')]
  return Array<string>(Math.abs(to - from)).fill(to > from ? 'shift+up' : 'shift+down')
}

/** The text in the box, '' when it is empty, and how many screen lines the box has. */
export type InputBox = { readonly text: string; readonly lines: number }

/** The input box of a Claude Code screen read with its colours (format "ansi"); null when the screen shows none. */
export function inputBoxOf(screen: string): InputBox | null {
  const lines = screen.split(/\r?\n/)
  const rules = lines.flatMap((line, at) => (rule.test(line.replace(sgr, '').trim()) ? [at] : []))
  const top = rules.at(-2)
  const bottom = rules.at(-1)
  if (top === undefined || bottom === undefined) return null
  const box = lines.slice(top + 1, bottom)
  const first = box[0]?.replace(dimRun, '').replace(sgr, '')
  if (first?.startsWith('❯') !== true) return null
  const rest = box.slice(1).map((line) => line.replace(sgr, '').replace(/^ {2}/, ''))
  const text = [first.slice(1).replace(/^ /, ''), ...rest].join('\n')
  return { text: text.trim() === '' ? '' : text.trimEnd(), lines: box.length }
}

/**
 * Whether a screen shows Claude Code's "Switch model?" dialog, which `/model <name>` opens on a chat with history,
 * with its first choice ("Yes, switch to …") picked, so one Enter switches (probe in a test herdr session,
 * 2026-11-21).
 */
export function switchModelDialogOf(screen: string): boolean {
  // The dialog hides the input box; with a box on the screen, the words are only text in the chat.
  if (inputBoxOf(screen) !== null) return false
  const lines = screen
    .replace(sgr, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
  // The dialog is the part below its top edge, the last line of "▔".
  const top = lines.findLastIndex((line) => /^▔{8,}$/.test(line))
  const dialog = top < 0 ? [] : lines.slice(top + 1)
  return dialog[0] === 'Switch model?' && dialog.some((line) => /^❯ 1\. Yes, switch\b/.test(line))
}

/** A prompt as the box can show it: each run of white space one space, with none at the ends. */
export const promptKey = (text: string): string => text.replace(/\s+/g, ' ').trim()

/** The most line ends in a box that `boxKeys` reads: 2 ** 12 joins. */
const maxLineEnds = 12

/**
 * Each prompt that `box` can show, as `promptKey` gives it. At each line end the box either wrapped at a space,
 * which it dropped, or broke a word or showed a line break of the prompt; so each line end joins with a space or
 * with nothing. A box with more line ends gives none, and its text is never cleared.
 */
export function boxKeys(box: InputBox): string[] {
  const lines = box.text.split('\n')
  if (lines.length - 1 > maxLineEnds) return []
  const keys = new Set<string>()
  for (let joins = 0; joins < 2 ** (lines.length - 1); joins += 1)
    keys.add(promptKey(lines.reduce((text, line, at) => `${text}${(joins >> (at - 1)) & 1 ? ' ' : ''}${line}`)))
  return [...keys]
}
