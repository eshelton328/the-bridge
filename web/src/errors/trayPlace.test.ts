import { describe, expect, it } from 'vitest'
import { trayBottom, trayInset } from './trayPlace.ts'

const phone = { width: 390, height: 844 }
const tray = { width: 77, height: 46 }
const box = (top: number, bottom: number, left = 16, right = 374) => ({ top, bottom, left, right })

describe('trayBottom', () => {
  it('keeps the tray at rest when nothing is in its corner', () => {
    expect(trayBottom(tray, phone, [])).toBe(trayInset)
    expect(trayBottom(tray, phone, [box(100, 200)])).toBe(trayInset)
    // A part to the left of the tray's column does not move it.
    expect(trayBottom(tray, phone, [box(780, 830, 16, 200)])).toBe(trayInset)
  })

  it('moves the tray above a composer and the error line under it, 8 px over the composer', () => {
    const composer = box(674, 752)
    const line = box(764, 810)
    const bottom = trayBottom(tray, phone, [line, composer])
    expect(bottom).toBe(844 - 674 + 8)
  })

  it('moves the tray above each part it would cover in turn', () => {
    // A transcript line right above the composer.
    const bottom = trayBottom(tray, phone, [box(764, 810), box(674, 752), box(620, 666)])
    expect(bottom).toBe(844 - 620 + 8)
  })

  it('stops at the window top when nothing above leaves room', () => {
    expect(trayBottom(tray, phone, [box(10, 830)])).toBe(844 - trayInset - tray.height)
  })

  it('reads the sides of a DOMRect, as the page measures them', () => {
    expect(trayBottom(tray, phone, [new DOMRect(16, 764, 358, 46)])).toBe(844 - 764 + 8)
  })
})
