// A workflow on a page of its own (D13): whether the open item shows so, and
// the ui changes of Open full page and of the breadcrumb's crumbs. Pure, so
// flowView.test.ts checks it without rendering; the flow's layout is in
// blocks/flowLayout.ts.
import type { ToolkitKind, ToolkitOpenItem, ToolkitUi } from '../types.ts'

/** Whether the open item fills the page (D13): a workflow with a page, opened with Open full page. */
export function isFullPage(open: ToolkitOpenItem | null, ui: Pick<ToolkitUi, 'flowFullPage'>): boolean {
  return ui.flowFullPage === true && canOpenFullPage(open)
}

/** Whether the open item has a page of its own, so Open full page can show it; without one the button does nothing. */
export function canOpenFullPage(open: ToolkitOpenItem | null): boolean {
  return open?.detail.flowPage !== undefined
}

/** The ui change of Open full page: the workflow fills the page on its How it works tab. */
export function openFullPage(): Partial<ToolkitUi> {
  return { flowFullPage: true, itemTab: 'how' }
}

/**
 * The ui change of a crumb on the full page: Toolkit (no kind) shows the whole list, a kind's crumb (Workflows) the
 * list narrowed to that kind.
 */
export function leaveFullPage(kind?: ToolkitKind): Partial<ToolkitUi> {
  return { open: null, from: null, flowFullPage: false, ...(kind === undefined ? {} : { filter: kind }) }
}
