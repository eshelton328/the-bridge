// A fenced `mermaid` block of a message, drawn as a diagram in the
// library's DiagramFrame: a skeleton while Mermaid loads and draws, then
// the diagram as an <img> of a blob: URL (no script runs in it and it loads
// nothing; lib/mermaidSvg.ts), with "Show source" for the text. A block that
// does not parse shows the reason and the source. The diagram draws again
// in the new colours when the colour mode changes (the `dark` class on
// <html>, d-119). Props only.
import { DiagramFrame, type DiagramState } from '@eshelton328/component-library-1701'
import { useEffect, useState } from 'react'
import { diagramColours, drawMermaid } from '../lib/mermaidSvg.ts'

export type MermaidDiagramProps = {
  /** The text of the fenced block. */
  source: string
}

type Drawn =
  | { state: 'loading' }
  | { state: 'ready'; url: string; width: number; height: number }
  | { state: 'error'; reason: string }

const isDark = () => document.documentElement.classList.contains('dark')

/** Whether the page draws the dark values now; changes with the `dark` class on <html>. */
function useDarkMode(): boolean {
  const [dark, setDark] = useState(isDark)
  useEffect(() => {
    const watch = new MutationObserver(() => {
      setDark(isDark())
    })
    watch.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => {
      watch.disconnect()
    }
  }, [])
  return dark
}

export function MermaidDiagram({ source }: MermaidDiagramProps) {
  const dark = useDarkMode()
  const [drawn, setDrawn] = useState<Drawn>({ state: 'loading' })
  useEffect(() => {
    let url: string | undefined
    let live = true
    const colours = diagramColours(getComputedStyle(document.documentElement))
    void drawMermaid(source, colours, dark).then((result) => {
      if (!live) return
      if (!result.ok) {
        setDrawn({ state: 'error', reason: result.reason })
        return
      }
      url = URL.createObjectURL(new Blob([result.diagram.svg], { type: 'image/svg+xml' }))
      setDrawn({ state: 'ready', url, width: result.diagram.width, height: result.diagram.height })
    })
    return () => {
      live = false
      if (url !== undefined) URL.revokeObjectURL(url)
    }
  }, [source, dark])
  const state: DiagramState = drawn.state
  return (
    <DiagramFrame
      label="Mermaid"
      source={source}
      state={state}
      error={drawn.state === 'error' ? drawn.reason : undefined}
    >
      {drawn.state === 'ready' ? (
        <img
          src={drawn.url}
          width={drawn.width}
          height={drawn.height}
          alt="Mermaid diagram. Show source for its text."
        />
      ) : null}
    </DiagramFrame>
  )
}
