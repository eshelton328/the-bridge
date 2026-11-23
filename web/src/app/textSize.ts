// Applies the text size setting (d-122). The library's type tokens are
// Small, the size of the designs, with no class; the text-default or
// text-large class on <html> picks the larger sizes (textSizeClass).
// index.html sets text-default and its inline script applies the saved
// size before the first paint with the same rule; this keeps it applied
// after each change (startSettingsStorage's onChange, main.ts). Only type
// changes: layouts still pick from the viewport width.
import { textSizeClass } from '@eshelton328/component-library-1701'
import { type TextSize, textSizes } from '../lib/deviceSettings.ts'

/** Sets the class of `size` on `root` and removes the classes of the other sizes. */
export function applyTextSize(size: TextSize, root: Pick<Element, 'classList'> = document.documentElement): void {
  for (const s of textSizes) {
    const name = textSizeClass[s]
    if (name !== null) root.classList.toggle(name, s === size)
  }
}
