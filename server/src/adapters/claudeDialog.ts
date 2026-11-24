// A dialog on a Claude Code screen that hides the input box (R69, d-125), such as a skill's question menu or a tool's
// permission ask. Probe in a test herdr session (2026-11-24): the dialog starts below its top edge (a line of "─", or
// of "▔" for "Switch model?"), with a title line ("☐ Colour"), the question and then the numbered options; "❯" marks
// the picked one, and ↑ and ↓ move it one option at a time. Its text never goes to a log (d-110).
import { createHash } from 'node:crypto'
import { type DialogOption, maxDialogChars, type PaneDialog } from '@bridge/contract'
import { inputBoxOf } from './claudeInput.ts'

const esc = String.fromCharCode(27)
const sgr = new RegExp(`${esc}\\[[0-9;?]*[A-Za-z]`, 'g')
const edge = /^\s*(?:─{8,}|▔{8,})\s*$/
const option = /^\s*(❯\s+)?(\d)\.\s+(.+?)\s*$/
/** An option that asks for typed text or opens a chat: the page cannot type, so it is never offered. */
const typed = /^(?:Type something\.?|Chat about this)$/
/** An option of a multi-select dialog, where Enter only marks it: such a dialog offers no options. */
const checkbox = /^\[[ ✔x×]\]/

/** A dialog that a screen shows, and the number of its picked option when the screen marks one. */
export type ScreenDialog = { readonly dialog: PaneDialog; readonly picked: number | undefined }

const trimmed = (lines: readonly string[]) => {
  const from = lines.findIndex((line) => line.trim() !== '')
  const to = lines.findLastIndex((line) => line.trim() !== '')
  return from < 0 ? [] : lines.slice(from, to + 1)
}

/**
 * The dialog of a screen read with format "ansi"; null when the screen shows the input box (the words are then text
 * in the chat) or no text. `options` is there only for a dialog of one choice whose options are numbered from 1 with one
 * marked; else the dialog has only its text (`raw`): the part below the edge, or the whole screen with no edge.
 */
export function dialogOf(screen: string): ScreenDialog | null {
  if (inputBoxOf(screen) !== null) return null
  const lines = screen
    .replace(sgr, '')
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
  // The dialog is the last block on the screen: its "❯", its option 1 above that, and its top edge above option 1. An
  // edge inside it (above "Chat about this") has an option under it; a block with any other edge below is not the
  // dialog, as text above the dialog can quote "❯ 1." (review of #495).
  const marked = lines.findLastIndex((line) => /^\s*❯\s+\d\./.test(line))
  const first = lines.findLastIndex((line, at) => at <= marked && /^\s*(?:❯\s+)?1\.\s/.test(line))
  const after = (at: number) => lines.slice(at + 1).find((line) => line.trim() !== '') ?? ''
  const inner = lines.every((line, at) => at <= first || !edge.test(line) || option.test(after(at)))
  const mark = marked >= 0 && first >= 0 && inner ? marked : -1
  const top = lines.findLastIndex((line, at) => edge.test(line) && (mark < 0 || at < first))
  const part = trimmed(lines.slice(top + 1).filter((line) => !edge.test(line)))
  const text = part.join('\n')
  if (text === '') return null
  const id = createHash('sha256').update(text).digest('hex').slice(0, 32)
  const raw = text.slice(0, maxDialogChars)
  if (mark < 0) return { dialog: { id, raw }, picked: undefined }
  const items: { n: number; label: string; picked: boolean }[] = []
  const head: string[] = []
  for (const line of part) {
    const found = option.exec(line)
    const last = items.at(-1)
    if (found !== null) items.push({ n: Number(found[2]), label: found[3] ?? '', picked: found[1] !== undefined })
    else if (last === undefined) head.push(line.trim())
    else if (/^ {5,}\S/.test(line) && !line.trim().startsWith('Submit')) last.label += ` — ${line.trim()}`
    else if (line.trim() === 'Submit') last.label = '[ ]'
  }
  const [title = '', ...body] = trimmed(head)
  const shown = {
    id,
    raw,
    ...(title === '' ? {} : { title: title.replace(/^[\s←☐☒✔]+|[\s→]+$/g, '').slice(0, 500) }),
    ...(body.length === 0 ? {} : { body: trimmed(body).join('\n').slice(0, maxDialogChars) }),
  }
  const picked = items.filter((item) => item.picked)
  const single =
    picked.length === 1 &&
    items.every((item, at) => item.n === at + 1 && !checkbox.test(item.label)) &&
    !title.includes('✔ Submit')
  const options: DialogOption[] = items
    .filter((item) => !typed.test(item.label.split(' — ')[0] ?? ''))
    .map((item) => ({ n: item.n, label: item.label.slice(0, 500) }))
  return single && options.length > 0
    ? { dialog: { ...shown, options }, picked: picked[0]?.n }
    : { dialog: shown, picked: undefined }
}

/** The keys that pick option `n` of a dialog: ↑ or ↓ from the marked option, then Enter; null for no such option. */
export function dialogKeys(shown: ScreenDialog, n: number): string[] | null {
  const { picked } = shown
  if (picked === undefined || shown.dialog.options?.some((o) => o.n === n) !== true) return null
  return [...Array<string>(Math.abs(n - picked)).fill(n > picked ? 'down' : 'up'), 'enter']
}
