// Draws a TeX formula with KaTeX. KaTeX and its CSS (with its fonts, which
// Vite bundles as local files) load with a dynamic import the first time a
// message holds math. `trust: false` turns off \\href, \\url, \\includegraphics
// and the HTML commands, so a formula loads nothing and links nowhere.
// `throwOnError` is on: a formula that does not parse comes back as the
// reason, and the caller shows its source as text, not KaTeX's red text.

/** The result of a draw: the formula as an element tree in `into`, or the reason it did not draw. */
export type FormulaResult = { ok: true } | { ok: false; reason: string }

/** Draws `tex` into `into`, inline or as a display formula. It never throws. */
export async function renderFormula(tex: string, display: boolean, into: HTMLElement): Promise<FormulaResult> {
  try {
    const [{ default: katex }] = await Promise.all([import('katex'), import('katex/dist/katex.min.css')])
    katex.render(tex, into, {
      displayMode: display,
      throwOnError: true,
      trust: false,
      strict: 'ignore',
      output: 'htmlAndMathml',
      maxSize: 20,
      maxExpand: 500,
    })
    return { ok: true }
  } catch (error) {
    into.replaceChildren()
    return { ok: false, reason: error instanceof Error ? error.message : 'the formula did not parse' }
  }
}
