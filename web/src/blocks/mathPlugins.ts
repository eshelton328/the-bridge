// The math parts that load only for a text with a `$` (useMathPlugins):
// remark-math, which reads `$…$` as inline math and `$$…$$` as a display
// formula, and `escapeLoneDollars`, which runs on the text before the parse.
// remark-math pairs any two `$`, so "$5 and $10" would be the formula
// "5 and " and Markdown between them (a link, emphasis) would be lost. So a
// one-dollar formula keeps Pandoc's rules: the opening `$` has no space
// after it, the closing one (the next `$`, as in TeX) no space before it and
// no digit after it. Each `$` that the rules cannot pair is escaped (`\$`),
// so it parses as text with the Markdown around it. Code, `$$…$$`, URLs and
// HTML keep their text.
import remarkMath from 'remark-math'

/** The remark plugins for math. */
export const mathPlugins = [remarkMath] as const

const fenceOpen = /^ {0,3}(`{3,}|~{3,})/

/** The length of the run of `char` that starts at `at`. */
function runAt(text: string, at: number, char: string): number {
  let end = at
  while (text[end] === char) end += 1
  return end - at
}

/** Marks as kept each span from a run of `char` to the next run of the same length, and an unpaired run itself. */
function markPairedRuns(text: string, kept: boolean[], char: string, min: number): void {
  for (let i = 0; i < text.length; ) {
    const n = text[i] === char && !kept[i] ? runAt(text, i, char) : 0
    if (n < min) {
      i += Math.max(n, 1)
      continue
    }
    let close = -1
    for (let j = i + n; j < text.length; ) {
      const m = text[j] === char ? runAt(text, j, char) : 0
      if (m === n) {
        close = j
        break
      }
      j += Math.max(m, 1)
    }
    const end = close === -1 ? i + n : close + n
    for (let k = i; k < end; k += 1) kept[k] = true
    i = end
  }
}

const isSpace = (char: string | undefined) => char === undefined || /\s/.test(char)
const escaped = (text: string, at: number) => {
  let count = 0
  for (let i = at - 1; i >= 0 && text[i] === '\\'; i -= 1) count += 1
  return count % 2 === 1
}

/** One block of text (no blank line, no fence) with each `$` that cannot pair escaped. */
function escapeBlock(text: string): string {
  const kept = Array.from({ length: text.length }, () => false)
  markPairedRuns(text, kept, '`', 1)
  for (const found of text.matchAll(/<[a-z][a-z0-9+.-]*:[^\s<>]*>|<\/?[a-z][^<>]*>|(?:https?:\/\/|www\.)[^\s<{}]*/gi)) {
    for (let k = found.index; k < found.index + found[0].length; k += 1) kept[k] = true
  }
  markPairedRuns(text, kept, '$', 2)
  const single = [...text.matchAll(/\$/g)].map((m) => m.index).filter((i) => !kept[i] && !escaped(text, i))
  const paired = new Set<number>()
  for (let k = 0; k < single.length; k += 1) {
    const open = single[k]
    if (open === undefined || isSpace(text[open + 1])) continue
    // Math ends at the next `$`, so a `$` pairs only with the next one, when that one can close.
    const close = single[k + 1]
    if (close !== undefined && !isSpace(text[close - 1]) && !/[0-9]/.test(text[close + 1] ?? '')) {
      paired.add(open)
      paired.add(close)
      k += 1
    }
  }
  let out = ''
  let from = 0
  for (const at of single) {
    if (paired.has(at)) continue
    out += `${text.slice(from, at)}\\`
    from = at
  }
  return out + text.slice(from)
}

/** `text` with each `$` that Pandoc's rules cannot pair escaped, outside code fences, code spans, `$$…$$`, URLs and HTML. */
export function escapeLoneDollars(text: string): string {
  const out: string[] = []
  let block: string[] = []
  let fence: { char: string; size: number } | undefined
  const flush = () => {
    if (block.length > 0) out.push(escapeBlock(block.join('\n')))
    block = []
  }
  for (const line of text.split('\n')) {
    if (fence !== undefined) {
      out.push(line)
      const run = /^ {0,3}(`+|~+)\s*$/.exec(line)?.[1]
      if (run?.startsWith(fence.char) === true && run.length >= fence.size) fence = undefined
      continue
    }
    const open = fenceOpen.exec(line)?.[1]
    if (open !== undefined) {
      flush()
      fence = { char: open[0] ?? '`', size: open.length }
      out.push(line)
    } else if (line.trim() === '') {
      flush()
      out.push(line)
    } else block.push(line)
  }
  flush()
  return out.join('\n')
}
