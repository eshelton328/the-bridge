// Shared by the Markdown route tests (WorkspacesMarkdownTables, InboxMarkdownTables; review R51): a made-up text with
// GitHub's pipe table, strikethrough, task list and autolink, and the checks of how the app draws them on the owner's
// screen. Every value in the text is made up.
import { expect } from 'vitest'

/** The first column's longest word, which must never break inside the table. */
const longestFirstCell = 'checkout-gateway'

/** A table of six columns, wider than a phone, then a strikethrough, a task list and a bare link. */
export const gfmText = [
  'Sample rollout status:',
  '',
  '| Service | Region | Owner | Status | Latency p99 | Notes |',
  '| --- | --- | --- | --- | --- | --- |',
  `| ${longestFirstCell} | sample-east-1 | sample-team | healthy | 182 ms | a made-up note that runs long enough to need room |`,
  '| search-index | sample-west-2 | other-team | degraded | 951 ms | another made-up note, also long enough to need room |',
  '',
  'The ~~first sample plan~~ is gone.',
  '',
  '- [x] Write the sample tests',
  '- [ ] Ship the sample change',
  '',
  'See https://example.com/sample-rollout for more.',
].join('\n')

/** The table `scope` renders, after it shows. */
export function tableIn(scope: Element): HTMLTableElement {
  const table = scope.querySelector('table')
  if (!(table instanceof HTMLTableElement)) throw new Error('no table')
  return table
}

/** The nearest ancestor of `el` inside its Markdown view that scrolls sideways itself, or null with none. */
function sidewaysFrame(el: Element): HTMLElement | null {
  const view = el.closest('.markdown-view')
  for (let node = el.parentElement; node !== null && node !== view; node = node.parentElement) {
    const x = getComputedStyle(node).overflowX
    if (x === 'auto' || x === 'scroll') return node
  }
  return null
}

/**
 * Fails unless the table has its header and rows, sits in a frame of its own (inside its Markdown view) that scrolls
 * sideways inside `scope`,
 * nothing between that frame and `scope` is wider than its box, the first column's longest word stays on one line,
 * the frame has the text size `size`, and the page does not scroll sideways.
 */
export function expectReadableTable(table: HTMLTableElement, scope: Element, size: 'md' | 'sm') {
  expect([...table.querySelectorAll('thead th')].map((th) => th.textContent)).toEqual([
    'Service',
    'Region',
    'Owner',
    'Status',
    'Latency p99',
    'Notes',
  ])
  expect([...table.querySelectorAll('tbody tr')].map((tr) => tr.firstElementChild?.textContent)).toEqual([
    longestFirstCell,
    'search-index',
  ])
  const frame = sidewaysFrame(table)
  expect(frame, 'the table scrolls sideways in a frame of its own').not.toBeNull()
  if (frame === null) return
  // The table's text size is the MarkdownView's: `sm` in the Inbox record, `md` in a transcript.
  expect(frame.className).toContain(`table__frame--size_${size}`)
  const own = frame.getBoundingClientRect()
  const outer = scope.getBoundingClientRect()
  expect(own.left).toBeGreaterThanOrEqual(outer.left - 0.5)
  expect(own.right).toBeLessThanOrEqual(outer.right + 0.5)
  for (let node = frame.parentElement; node !== null && node !== scope; node = node.parentElement)
    expect(node.scrollWidth, `${node.tagName}.${node.className} is wider than its box`).toBeLessThanOrEqual(
      node.clientWidth,
    )
  // The first column's longest word is on one line: one box for the whole word.
  const cell = table.querySelector('tbody td')
  const text = cell?.firstChild
  if (!(text instanceof Text)) throw new Error('no first cell text')
  const range = document.createRange()
  range.setStart(text, 0)
  range.setEnd(text, longestFirstCell.length)
  expect(range.getClientRects()).toHaveLength(1)
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth)
}

/** Fails unless `scope` draws the strikethrough, the task list's two boxes and the bare link as a link. */
export function expectGfmInline(scope: Element) {
  expect([...scope.querySelectorAll('del')].map((el) => el.textContent)).toEqual(['first sample plan'])
  const boxes = [...scope.querySelectorAll('li input[type="checkbox"]')].filter((el) => el instanceof HTMLInputElement)
  expect(boxes.map((box) => [box.checked, box.disabled, box.getAttribute('aria-label')])).toEqual([
    [true, true, 'Task done'],
    [false, true, 'Task not done'],
  ])
  const link = [...scope.querySelectorAll('a')].find((a) => a.textContent === 'https://example.com/sample-rollout')
  expect(link?.getAttribute('href')).toBe('https://example.com/sample-rollout')
  expect(link?.getAttribute('target')).toBe('_blank')
  expect(scope.textContent).not.toContain('~~')
  expect(scope.textContent).not.toContain('[x]')
}
