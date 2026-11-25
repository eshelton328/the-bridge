// Loads the math parts (mathPlugins.ts, with remark-math) the first time
// a text holds a `$`, so the first chat paint does not carry them. Until
// they load, the text renders without math, then once more with it, with
// each `$` that cannot pair escaped (`escapeLoneDollars`).
import { useEffect, useMemo, useState } from 'react'
import type { Options } from 'react-markdown'

type PluggableList = NonNullable<Options['remarkPlugins']>

type MathParts = { plugins: PluggableList; escape: (text: string) => string }

let loaded: MathParts | undefined
let loading: Promise<MathParts> | undefined

const load = (): Promise<MathParts> => {
  loading ??= import('./mathPlugins.ts').then(({ mathPlugins, escapeLoneDollars }) => {
    loaded = { plugins: [...mathPlugins], escape: escapeLoneDollars }
    return loaded
  })
  return loading
}

const none: PluggableList = []

/** Whether a text may hold math: it has a `$`. */
export const mayHoldMath = (text: string): boolean => text.includes('$')

/** The math plugins and the text to parse with them; no plugins and the text as it is until they load, or with no `$`. */
export function useMathPlugins(text: string): { plugins: PluggableList; text: string } {
  const wanted = mayHoldMath(text)
  const [parts, setParts] = useState<MathParts | undefined>(() => (wanted ? loaded : undefined))
  useEffect(() => {
    if (!wanted || parts !== undefined) return
    let live = true
    void load().then((next) => {
      if (live) setParts(next)
    })
    return () => {
      live = false
    }
  }, [wanted, parts])
  return useMemo(
    () =>
      wanted && parts !== undefined ? { plugins: parts.plugins, text: parts.escape(text) } : { plugins: none, text },
    [wanted, parts, text],
  )
}
