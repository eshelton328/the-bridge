// The syntax colours of a fenced code block (chat rich text, 2026-11-25):
// lowlight runs highlight.js with the ten grammars of codeLanguages.ts, and
// each highlight.js class maps to one of the library's five code colours
// (CodeKind). A class with no map, such as a variable or a diff's added
// line, keeps the text's own colour: MarkdownCodeBlock tints a diff's lines
// itself. MarkdownCodeFence loads this module only when a fence names one
// of the grammars, so a page with no such fence loads no highlighter. Pure.
import type { CodeKind, CodeSegment } from '@eshelton328/component-library-1701'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import diff from 'highlight.js/lib/languages/diff'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import markdown from 'highlight.js/lib/languages/markdown'
import python from 'highlight.js/lib/languages/python'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'
import { createLowlight } from 'lowlight'
import type { CodeGrammar } from './codeLanguages.ts'

const lowlight = createLowlight({ bash, css, diff, javascript, json, markdown, python, typescript, xml, yaml })

// highlight.js classes by the code colour they take: words of the language, literal text, notes, numbers, and names
// (a function, a tag's or a key's name).
const kinds = new Map<string, CodeKind>([
  ['hljs-keyword', 'keyword'],
  ['hljs-built_in', 'keyword'],
  ['hljs-literal', 'keyword'],
  ['hljs-type', 'keyword'],
  ['hljs-meta', 'keyword'],
  ['hljs-name', 'keyword'],
  ['hljs-selector-tag', 'keyword'],
  ['hljs-section', 'keyword'],
  ['hljs-bullet', 'keyword'],
  ['hljs-string', 'string'],
  ['hljs-regexp', 'string'],
  ['hljs-code', 'string'],
  ['hljs-comment', 'comment'],
  ['hljs-quote', 'comment'],
  ['hljs-number', 'number'],
  ['hljs-title', 'function'],
  ['hljs-attr', 'function'],
  ['hljs-attribute', 'function'],
  ['hljs-selector-class', 'function'],
  ['hljs-selector-id', 'function'],
  ['hljs-property', 'function'],
])

/** The part of a lowlight tree this reads: text, and elements with their classes and children. */
type Node = {
  readonly type: string
  readonly value?: string
  readonly properties?: { readonly className?: unknown }
  readonly children?: readonly Node[]
}

function kindOf(className: unknown): CodeKind | undefined {
  if (!Array.isArray(className)) return undefined
  for (const name of className) {
    const kind = typeof name === 'string' ? kinds.get(name) : undefined
    if (kind !== undefined) return kind
  }
  return undefined
}

const piece = (text: string, kind: CodeKind | undefined): CodeSegment =>
  kind === undefined ? { text } : { text, kind }

// The text pieces in order, each with the kind of its nearest class that has one. A loop with its own stack, not
// recursion: a fence of deeply nested code (thousands of template interpolations) must not overflow the call stack.
function walk(root: Node): CodeSegment[] {
  const out: CodeSegment[] = []
  const stack: { node: Node; kind: CodeKind | undefined }[] = [{ node: root, kind: undefined }]
  for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
    const { node, kind } = next
    if (node.type === 'text') {
      if (node.value !== undefined && node.value !== '') out.push(piece(node.value, kind))
      continue
    }
    const own = node.type === 'element' ? kindOf(node.properties?.className) : undefined
    const children = node.children ?? []
    // Pushed last child first, so the pieces come off the stack in order.
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i]
      if (child !== undefined) stack.push({ node: child, kind: own ?? kind })
    }
  }
  return out
}

/** The pieces of `code`: highlight.js's, or the code as one plain piece when highlight.js itself cannot parse it. */
function piecesOf(code: string, grammar: CodeGrammar): CodeSegment[] {
  try {
    return walk(lowlight.highlight(grammar, code))
  } catch (error) {
    // highlight.js parses by recursion too: code nested past the call stack draws plain.
    if (error instanceof RangeError) return [{ text: code }]
    throw error
  }
}

/** Each line of `code` as its pieces, in order, for MarkdownCodeBlock's `segments`; the pieces join to the line. */
export function highlightCode(code: string, grammar: CodeGrammar): CodeSegment[][] {
  const pieces = piecesOf(code, grammar)
  let line: CodeSegment[] = []
  const lines = [line]
  for (const { text, kind } of pieces) {
    text.split('\n').forEach((part, i) => {
      if (i > 0) {
        line = []
        lines.push(line)
      }
      if (part !== '') line.push(piece(part, kind))
    })
  }
  return lines
}
