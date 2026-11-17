// The Claude Design canvas bundle (`pnpm --filter @bridge/web build:canvas`):
// an IIFE that sets window.Bridge. A board calls
//   Bridge.mount(element, 'inbox/nextStep', 'D1')
// to render that Figma state at that frame's size, inside AppBoundary, so a
// broken state shows a fallback on the board, not a blank frame. React,
// ReactDOM and the library stay external: the canvas loads them
// (window.React, window.ReactDOM, window.CL1701 from ds/cl1701).
import '../canvas.css'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { AppError } from '../errors/appError.ts'
import { AppBoundary } from '../errors/AppBoundary.tsx'
import { rootErrorOptions } from '../errors/rootErrorOptions.ts'
import { boards, type BoardId } from './registry.gen.ts'

/** The board ids and titles, such as { id: 'inbox/nextStep', title: 'Inbox D1: a next step' }. */
export const boardList: readonly { id: string; title: string; frames: readonly string[] }[] = boards.map((b) => ({
  id: b.id,
  title: b.title,
  frames: b.frames.map((f) => f.id),
}))

/** Renders a board into `element` and returns its unmount. */
export function mount(element: Element, boardId: BoardId, frameId: string): () => void {
  const found = boards.find((b) => b.id === boardId)
  if (found === undefined)
    throw new AppError('bug', `No board "${boardId}". Boards: ${boards.map((b) => b.id).join(', ')}`)
  const frame = found.frames.find((f) => f.id === frameId)
  if (frame === undefined)
    throw new AppError(
      'bug',
      `Board "${boardId}" has no frame "${frameId}". Frames: ${found.frames.map((f) => f.id).join(', ')}`,
    )
  const root = createRoot(element, rootErrorOptions)
  root.render(createElement(AppBoundary, null, found.render(frame.viewport)))
  return () => {
    root.unmount()
  }
}
