import { expect, test } from 'vitest'
import { desktopMinWidth, tabletMinWidth, viewportForWidth } from './viewport.ts'

test('the widths come from the shell tokens: rail + list pane + detail, and one list pane', () => {
  expect(desktopMinWidth).toBe(64 + 420 + 748)
  expect(tabletMinWidth).toBe(420)
})

test('each Figma frame width picks its device layout', () => {
  expect(viewportForWidth(1512)).toBe('desktop')
  expect(viewportForWidth(756)).toBe('tablet')
  expect(viewportForWidth(390)).toBe('phone')
})

test('the edges belong to the larger layout', () => {
  expect(viewportForWidth(desktopMinWidth)).toBe('desktop')
  expect(viewportForWidth(desktopMinWidth - 1)).toBe('tablet')
  expect(viewportForWidth(tabletMinWidth)).toBe('tablet')
  expect(viewportForWidth(tabletMinWidth - 1)).toBe('phone')
})
