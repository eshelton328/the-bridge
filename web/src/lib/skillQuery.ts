// The word before the caret in a message box, when it starts with "/": the skill Erik is typing.

const space = /\s/

/**
 * The word before the caret when it starts with "/", such as "/wri" at the end of M10's message; null otherwise.
 * It scans back from the caret to the last whitespace, so a long paste with no space costs one pass over it (a
 * `/\S*$/` search backtracks over it once per start, and stalled the box for seconds at 80,000 characters).
 */
export function skillQuery(text: string, caret: number): string | null {
  const end = Math.max(0, Math.min(caret, text.length))
  let start = end
  while (start > 0 && !space.test(text.charAt(start - 1))) start -= 1
  return text.charAt(start) === '/' && start < end ? text.slice(start, end) : null
}
