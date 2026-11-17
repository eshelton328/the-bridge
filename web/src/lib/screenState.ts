// The shape of a page's mock data (decision d-082): one typed state file
// per Figma state, each with the frames that show it, the view model
// (`data`) and the first view state (`ui`). Storybook, the Claude Design
// canvas and the app all read the same state objects.
import type { ReactElement } from 'react'
import { z } from 'zod'
import { err, ok, type Result } from '@bridge/shared'

/** The frame sizes of the Figma design: 1512, 756 and 390 wide. */
export type Viewport = 'desktop' | 'tablet' | 'phone'

/** A Figma frame that shows a state, such as `{ id: 'D1', node: '266:3', viewport: 'desktop' }`. */
export type FigmaFrame = {
  readonly id: string
  readonly node: string
  readonly viewport: Viewport
}

/** One Figma state of a page: what it is called, where Figma draws it, and its props. */
export type ScreenState<Data, Ui> = {
  readonly title: string
  readonly frames: readonly FigmaFrame[]
  readonly data: Data
  readonly ui: Ui
}

/**
 * A page as the canvas and the state checks see it: its states, the Zod
 * schema of a state's data and ui, and how one state renders with no store
 * or router (the props-only screen).
 */
export type PageDefinition<Data, Ui, Key extends string> = {
  readonly id: string
  readonly title: string
  readonly schema: z.ZodType<{ data: Data; ui: Ui }>
  readonly states: Readonly<Record<Key, ScreenState<Data, Ui>>>
  readonly render: (state: ScreenState<Data, Ui>, viewport: Viewport) => ReactElement
}

/** Checks a state's data and ui against the page schema; the error is Zod's readable report. */
export function checkState<Data, Ui>(
  schema: z.ZodType<{ data: Data; ui: Ui }>,
  state: ScreenState<Data, Ui>,
): Result<{ data: Data; ui: Ui }, string> {
  const parsed = schema.safeParse({ data: state.data, ui: state.ui })
  return parsed.success ? ok(parsed.data) : err(z.prettifyError(parsed.error))
}
