// The word before the caret in a message box, when it starts with "/": the skill the owner is typing.

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

/**
 * The text once the owner picks the skill `name` from the list, with the caret after it. The whole "/word" at the caret
 * (with any part of it after the caret, as "ter" in "/wri|ter"), or, when the caret is past it, the "/" word that starts
 * the message, becomes the skill and a space, so typing goes on after it; a space already after the word is kept, and
 * the caret goes after it. Without a "/" word the skill goes in at the caret.
 */
export function pickSkill(text: string, caret: number, name: string): { text: string; caret: number } {
  const end = Math.max(0, Math.min(caret, text.length))
  const query = skillQuery(text, end)
  const word = query !== null || text.startsWith('/')
  const start = query !== null ? end - query.length : word ? 0 : end
  let stop = start
  // The "/" word runs to the next whitespace; with no "/" word the skill goes in at the caret.
  while (word && stop < text.length && !space.test(text.charAt(stop))) stop += 1
  const after = text.slice(stop)
  const spaced = space.test(after.charAt(0))
  return { text: `${text.slice(0, start)}${name}${spaced ? '' : ' '}${after}`, caret: start + name.length + 1 }
}

/**
 * The text once the owner picks one of the page's commands from the list, such as /compact, which opens its dialog
 * instead of going into the message: the "/" word that `pickSkill` would replace leaves the box, with the space after
 * it, and the caret goes where it stood.
 */
export function dropSkillWord(text: string, caret: number): { text: string; caret: number } {
  const picked = pickSkill(text, caret, '')
  // `pickSkill` put an empty name and a space where the word was, or kept the space that followed it.
  const at = picked.caret - 1
  // A line break after the word stays; only a space goes.
  if (picked.text.charAt(at) !== ' ') return { text: picked.text, caret: at }
  return { text: `${picked.text.slice(0, at)}${picked.text.slice(at + 1)}`, caret: at }
}
