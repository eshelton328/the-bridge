// An idea record's text, split for its page (d-135, D09): the list under its
// "## Open questions" heading shows in its own panel, and the rest stays the
// page's text. A section that holds more than a list stays in the text, so no
// line is ever hidden.

/** The text less its Open questions list, and the list's items, each as one line. */
export type IdeaBody = { text: string; questions: string[] }

const questionsHeading = /^##[ \t]+open questions[ \t]*$/i
const nextHeading = /^#{1,2}[ \t]/
const item = /^[-*+][ \t]+(\S.*)$/
const continued = /^[ \t]+(\S.*)$/

/** Splits `text` at its first "## Open questions" heading; with none, or a section that is not only a list, it is all text. */
export function splitIdeaBody(text: string): IdeaBody {
  const lines = text.split('\n')
  const start = lines.findIndex((l) => questionsHeading.test(l.trim()))
  if (start < 0) return { text, questions: [] }
  const after = lines.findIndex((l, i) => i > start && nextHeading.test(l))
  const end = after < 0 ? lines.length : after
  const questions: string[] = []
  for (const line of lines.slice(start + 1, end)) {
    if (line.trim() === '') continue
    const first = item.exec(line)?.[1]
    const more = continued.exec(line)?.[1]
    const last = questions.pop()
    if (first !== undefined) {
      if (last !== undefined) questions.push(last)
      questions.push(first.trim())
    } else if (more !== undefined && last !== undefined) questions.push(`${last} ${more.trim()}`)
    else return { text, questions: [] }
  }
  if (questions.length === 0) return { text, questions: [] }
  const rest = [...lines.slice(0, start), ...lines.slice(end)].join('\n').replace(/\n{3,}/g, '\n\n')
  return { text: rest.trimEnd() === '' ? '' : `${rest.trimEnd()}\n`, questions }
}
