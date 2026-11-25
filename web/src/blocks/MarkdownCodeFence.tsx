// A fenced code block in Markdown text (chat rich text, 2026-11-25): the
// library's MarkdownCodeBlock, as MarkdownText's `pre`. It shows the
// fence's label, keeps each line on one line with sideways scroll, tints a
// diff, folds a long block, and colours the code of a fence whose label
// codeLanguages.ts knows. The highlighter (highlightCode.ts, lowlight) loads
// the first time such a fence shows; until then, and when it fails to load
// (reported, never with the code), the code is plain. Code longer than
// `maxColoured` stays plain, so a pasted log never blocks a render. Copy
// shows only with `onCopy`: the page's copyText, which reports a refusal
// without the text. It is a prop, never a context, as the Claude Design
// canvas runs React 18, which has no `use` (Codex review of #511). A `pre` that is not
// a fence (a code element with text alone) draws as it was. A `mermaid` fence
// is a diagram (MermaidDiagram.tsx), with the code block until its code loads;
// a `math` fence (`$…$`) is a KaTeX formula (MathFormula.tsx).
// Props only.
import { type CodeSegment, MarkdownCodeBlock } from '@eshelton328/component-library-1701'
import { lazy, type ReactNode, Suspense, useEffect, useMemo, useState } from 'react'
import type { ExtraProps } from 'react-markdown'
import { report } from '../errors/reporter.ts'
import type { CopyTextResult } from '../lib/copyText.ts'
import { grammarOf, type CodeGrammar } from './codeLanguages.ts'
import { fenceOf } from './fence.ts'
import { MathFormula } from './MathFormula.tsx'

// A `mermaid` fence draws as a diagram (MermaidDiagram.tsx). Its code (DiagramFrame, the draw queue, Mermaid) loads on
// the first such fence, so the first chat paint does not carry it; until then the fence shows as its code block.
const MermaidDiagram = lazy(() => import('./MermaidDiagram.tsx').then((module) => ({ default: module.MermaidDiagram })))

/** Writes a code block's code to the clipboard and says whether it did (the page's copyText). */
export type CopyCode = (code: string) => Promise<CopyTextResult>

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

export type MarkdownCodeFenceProps = ExtraProps & {
  readonly children?: ReactNode
  /** Copies the code (the page's copyText); without it the block has no copy button. */
  readonly onCopy?: CopyCode | undefined
}

export function MarkdownCodeFence({ node, children, onCopy: copy }: MarkdownCodeFenceProps) {
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
  // Display math (`$…$`, or a fence labelled math, as GitHub draws it) is a KaTeX formula.
  if (fence.language === 'math') return <MathFormula tex={fence.code} display />
  const block = <MarkdownCodeBlock code={fence.code} language={fence.language} segments={segments} onCopy={onCopy} />
  if (fence.language !== 'mermaid') return block
  return (
    <Suspense fallback={block}>
      <MermaidDiagram source={fence.code} />
    </Suspense>
  )
}
