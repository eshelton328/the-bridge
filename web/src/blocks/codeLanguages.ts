// The fence labels whose code the chat colours (chat rich text, 2026-11-25:
// "about 10 languages"), each to the highlight.js grammar that colours it.
// A fence with another label, or none, draws plain and loads no highlighter
// (MarkdownCodeFence.tsx). Pure.

/** A highlight.js grammar that highlightCode.ts registers. */
export type CodeGrammar =
  | 'bash'
  | 'css'
  | 'diff'
  | 'javascript'
  | 'json'
  | 'markdown'
  | 'python'
  | 'typescript'
  | 'xml'
  | 'yaml'

const grammars = new Map<string, CodeGrammar>([
  ['ts', 'typescript'],
  ['tsx', 'typescript'],
  ['typescript', 'typescript'],
  ['js', 'javascript'],
  ['jsx', 'javascript'],
  ['mjs', 'javascript'],
  ['cjs', 'javascript'],
  ['javascript', 'javascript'],
  ['json', 'json'],
  ['jsonc', 'json'],
  ['bash', 'bash'],
  ['sh', 'bash'],
  ['shell', 'bash'],
  ['zsh', 'bash'],
  ['python', 'python'],
  ['py', 'python'],
  ['css', 'css'],
  ['html', 'xml'],
  ['xml', 'xml'],
  ['svg', 'xml'],
  ['yaml', 'yaml'],
  ['yml', 'yaml'],
  ['markdown', 'markdown'],
  ['md', 'markdown'],
  ['diff', 'diff'],
  ['patch', 'diff'],
])

/** The grammar of a fence's label, in any case, or undefined when the chat does not colour it. */
export const grammarOf = (label: string | undefined): CodeGrammar | undefined =>
  label === undefined ? undefined : grammars.get(label.toLowerCase())
