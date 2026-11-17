// A board of the Claude Design canvas: one Figma state of one page, by an
// id such as 'inbox/nextStep'. design/registry.gen.ts lists every board.
import type { ReactElement } from 'react'
import type { Result } from '@bridge/shared'
import { checkState, type FigmaFrame, type PageDefinition, type Viewport } from './screenState.ts'

export type Board = {
  /** `<page>/<state>`, such as 'inbox/nextStep'. */
  readonly id: string
  /** The board name: page title, frame ids and state title, such as "Inbox D1: a next step". */
  readonly title: string
  readonly frames: readonly FigmaFrame[]
  /** Renders the state's screen at a frame size, with no store or router. */
  readonly render: (viewport: Viewport) => ReactElement
  /** Parses the state against its page schema. */
  readonly check: () => Result<unknown, string>
}

/** The board of one state of a page. The key is checked against the page's states. */
export function board<Data, Ui, Key extends string>(page: PageDefinition<Data, Ui, Key>, key: Key): Board {
  const state = page.states[key]
  const frameIds = state.frames.map((f) => f.id).join(' ')
  return {
    id: `${page.id}/${key}`,
    title: `${page.title} ${frameIds}: ${state.title}`,
    frames: state.frames,
    render: (viewport) => page.render(state, viewport),
    check: () => checkState(page.schema, state),
  }
}
