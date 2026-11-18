// A dialog, sheet or popover of the library traps the focus with Zag's
// `trapFocus`, which moves the focus to its first or initial element in the
// first animation frame after it opens. A test that polls for that focus with
// `waitFor` counts clock time, not frames: on a busy CI runner the frame can
// come after `waitFor`'s 1 s and the check fails with the focus on `body`.
// `expectTrapFocus` waits for one frame asked for now, which runs after the
// trap's frame (the trap asked for it when the layer opened), and then checks
// the focus once. Call it after the layer is open, such as after `findByRole`.
import { expect } from 'storybook/test'

export async function expectTrapFocus(element: Element): Promise<void> {
  await new Promise((resolve) => requestAnimationFrame(resolve))
  await expect(element).toHaveFocus()
}
