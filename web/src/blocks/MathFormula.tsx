// A formula of a message (`$…$` inline, `$$…$$` as a display block),
// drawn with KaTeX (lib/katexRender.ts). Until KaTeX loads, and when the
// formula does not parse, it shows its TeX source as code, so the text is
// never lost. A drawn display formula scrolls sideways in its own box
// (MarkdownView's `.katex-display`), which takes the focus, so the arrow keys
// scroll a wide one. Props only.
import { useEffect, useRef, useState } from 'react'
import { renderFormula } from '../lib/katexRender.ts'

export type MathFormulaProps = {
  /** The TeX source, without the dollar signs. */
  tex: string
  /** A display formula (`$$…$$`), drawn as its own block. */
  display: boolean
}

export function MathFormula({ tex, display }: MathFormulaProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [drawn, setDrawn] = useState<'loading' | 'ready' | 'error'>('loading')
  useEffect(() => {
    const into = ref.current
    if (into === null) return
    let live = true
    setDrawn('loading')
    void renderFormula(tex, display, into).then((result) => {
      if (!live) return
      if (result.ok && display) into.querySelector('.katex-display')?.setAttribute('tabindex', '0')
      setDrawn(result.ok ? 'ready' : 'error')
    })
    return () => {
      live = false
    }
  }, [tex, display])
  const source = display ? `$$${tex}$$` : `$${tex}$`
  const Box = display ? 'div' : 'span'
  return (
    <Box data-math={display ? 'display' : 'inline'} data-state={drawn}>
      <span ref={ref} hidden={drawn !== 'ready'} />
      {drawn === 'ready' ? null : <code>{source}</code>}
    </Box>
  )
}
