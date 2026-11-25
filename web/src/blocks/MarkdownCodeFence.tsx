// A fenced code block in Markdown text (chat rich text, 2026-11-25): the
// library's MarkdownCodeBlock, as MarkdownText's `pre`. It shows the
// fence's label, keeps each line on one line with sideways scroll, tints a
// diff, folds a long block, and colours the code of a fence whose label
// codeLanguages.ts knows. The highlighter (highlightCode.ts, lowlight) loads
// the first time such a fence shows; until then, and when it fails to load
// (reported, never with the code), the code is plain. Code longer than
// `maxColoured` stays plain, so a pasted log never blocks a render. Copy
// shows only when the page gives a copy (CopyCodeContext): the page's
// copyText, which reports a refusal without the text. A `pre` that is not
// a fence (a code element with text alone) draws as it was. Props only.
import { type CodeSegment, MarkdownCodeBlock } from '@eshelton328/component-library-1701'
import { createContext, type ReactNode, use, useEffect, useMemo, useState } from 'react'
import type { ExtraProps } from 'react-markdown'
import { report } from '../errors/reporter.ts'
import type { CopyTextResult } from '../lib/copyText.ts'
import { grammarOf, type CodeGrammar } from './codeLanguages.ts'

/** Writes a code block's code to the clipboard and says whether it did (the page's copyText). */
export type CopyCode = (code: string) => Promise<CopyTextResult>

/** The page's copy for the code blocks under it; none draws no copy button. */
export const CopyCodeContext = createContext<CopyCode | undefined>(undefined)

/** The longest code, in characters, that the block colours. */
const maxColoured = 20_000

type Highlighter = typeof import('./highlightCode.ts')

let loaded: Highlighter | undefined
let loading: Promise<Highlighter | undefined> | undefined

/** Loads the highlighter once; a failed load is reported, and the next fence tries again. */
function loadHighlighter(): Promise<Highlighter | undefined> {
  loading ??= import('./highlightCode.ts').then(
    (module) => {
      loaded = module
      return module
    },
    (error: unknown) => {
      report(error, 'handler')
      loading = undefined
      return undefined
    },
  )
  return loading
}

/** The highlighter once loaded; a fence with no grammar loads none. */
function useHighlighter(grammar: CodeGrammar | undefined): Highlighter | undefined {
  const [highlighter, setHighlighter] = useState(loaded)
  useEffect(() => {
    if (grammar === undefined || highlighter !== undefined) return undefined
    let live = true
    void loadHighlighter().then((module) => {
      if (live && module !== undefined) setHighlighter(module)
    })
    return () => {
      live = false
    }
  }, [grammar, highlighter])
  return highlighter
}

type Fence = { readonly code: string; readonly language: string | undefined }

/** The fence a `pre` holds: one `code` element of text alone, its label from its `language-<label>` class. */
function fenceOf(node: ExtraProps['node']): Fence | undefined {
  const [code, ...rest] = node?.children ?? []
  if (code === undefined || rest.length > 0 || code.type !== 'element' || code.tagName !== 'code') return undefined
  let text = ''
  for (const child of code.children) {
    if (child.type !== 'text') return undefined
    text += child.value
  }
  const className = code.properties.className
  const label = Array.isArray(className)
    ? className.map(String).find((name) => name.startsWith('language-'))
    : undefined
  return { code: text.endsWith('\n') ? text.slice(0, -1) : text, language: label?.slice('language-'.length) }
}

export type MarkdownCodeFenceProps = ExtraProps & { readonly children?: ReactNode }

export function MarkdownCodeFence({ node, children }: MarkdownCodeFenceProps) {
  const copy = use(CopyCodeContext)
  const fence = fenceOf(node)
  const code = fence?.code
  const grammar = code !== undefined && code.length <= maxColoured ? grammarOf(fence?.language) : undefined
  const highlighter = useHighlighter(grammar)
  const segments = useMemo<CodeSegment[][] | undefined>(
    () => (code === undefined || grammar === undefined ? undefined : highlighter?.highlightCode(code, grammar)),
    [code, grammar, highlighter],
  )
  const onCopy = useMemo(
    () => (copy === undefined ? undefined : (text: string) => copy(text).then((result) => result.ok)),
    [copy],
  )
  if (fence === undefined) return <pre>{children}</pre>
  return <MarkdownCodeBlock code={fence.code} language={fence.language} segments={segments} onCopy={onCopy} />
}
