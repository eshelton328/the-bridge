// The live flows (d-113): the server and the web dev server on free ports,
// the page at /workspaces?source=live in Chromium. Slice 1: the fake chat
// is in its list with its model and status. Slice 2: when the status
// chat's status changes in herdr, the page shows the new status with no
// reload.
import { chromium, type Browser } from 'playwright'
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest'
import { reportAgent } from './reportAgent.ts'
import { startStack, stopStack } from './stack.ts'

let browser: Browser | undefined
let web = ''

beforeAll(async () => {
  const { webPort } = await startStack()
  web = `http://localhost:${String(webPort)}`
  browser = await chromium.launch()
})

afterAll(async () => {
  await browser?.close()
  stopStack()
})

describe('/workspaces?source=live', () => {
  it('lists the fake chat of the herdr session with its model and status', async () => {
    if (!browser) throw new Error('no browser')
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    await page.goto(`${web}/workspaces?source=live`)
    const { workspace, title } = inject('fakeChat')
    await page.getByText(workspace, { exact: true }).first().waitFor({ timeout: 30_000 })
    const row = page.getByText(title, { exact: true }).first()
    await row.waitFor()
    const text = await page.locator('body').innerText()
    expect(text).toContain(title)
    expect(text).toContain('Opus 5.5')
    expect(text).toContain('Idle')
    expect(text).not.toContain('Live data is not available')
    // The mock workspaces are gone: the list is the herdr session's.
    expect(text).not.toContain('skill-evals')
    await page.close()
  })

  it("shows the status chat's new status when herdr changes it, with no reload", async () => {
    if (!browser) throw new Error('no browser')
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
    // The stream is open once the server has sent the headers of /api/events.
    const streamOpen = page.waitForResponse((r) => r.url().endsWith('/api/events') && r.status() === 200)
    await page.goto(`${web}/workspaces?source=live`)
    const { title } = inject('statusChat')
    // The status chat's row: the nearest box around its title that holds a status.
    const statuses = ['Idle', 'Working', 'Needs you'].map((s) => `normalize-space()="${s}"`).join(' or ')
    const row = page.getByText(title, { exact: true }).first().locator(`xpath=ancestor::*[.//*[${statuses}]][1]`)
    await row.waitFor({ timeout: 30_000 })
    await row.getByText('Idle', { exact: true }).waitFor()
    // A navigation would give the page a new marker; the same marker after the change shows no reload.
    await page.evaluate(() => {
      document.body.dataset.e2eMark = 'before'
    })
    await streamOpen
    try {
      await reportAgent('blocked')
      await row.getByText('Needs you', { exact: true }).waitFor({ timeout: 10_000 })
      await reportAgent('working')
      await row.getByText('Working', { exact: true }).waitFor({ timeout: 10_000 })
      expect(await page.evaluate(() => document.body.dataset.e2eMark)).toBe('before')
    } finally {
      await reportAgent('idle')
    }
    await page.close()
  })
})
