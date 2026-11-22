import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { clearReports, getReports } from '../errors/reporter.ts'
import { artifactsError } from '../lib/fakeArtifactsServer.ts'
import { answerLateServerReads } from '../lib/lateServerReads.ts'
import { setViewport } from '../lib/rendering.ts'
import { unmountRendered } from '../lib/testRender.ts'
import { resetAllStores } from '../state/resetStores.ts'
import { type Device, devices, plan, shown, statusLine, tapArtifacts, withServer } from './artifactsLiveHelpers.ts'

// The live library's writes on the owner's path (pages/artifacts/useArtifactWrites.ts): the app with no URL
// parameters, Artifacts from the rail or More, then Add a link, a project pick and Remove, each sent to the
// contract-checked fake (lib/fakeArtifactsServer.ts). A write that misses shows one line by status. Every link,
// title and project is made up.
document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

answerLateServerReads()

afterEach(async () => {
  await unmountRendered()
  vi.unstubAllGlobals()
  clearReports()
  resetAllStores()
  await setViewport(1512, 982)
})

const phone = (device: Device) => device.item === 'artifact row'
const newLink = 'https://claude.ai/artifact/00000000-0000-0000-0000-0000000000aa'

/** Opens Add a link (D5's dialog, M6's sheet) and types `link` and `title`. */
async function fillAddLink(device: Device, link: string, title: string) {
  await userEvent.click(page.getByRole('button', { name: 'Add a link' }))
  const form = page.getByRole('dialog')
  await expect.element(form).toBeVisible()
  await userEvent.fill(form.getByRole('textbox', { name: 'Link' }), link)
  await userEvent.fill(form.getByRole('textbox', { name: 'Title' }), title)
  return { form, add: form.getByRole('button', { name: phone(device) ? 'Add' : 'Add artifact', exact: true }) }
}

/** Opens the artifact of the card or row titled `title`. */
async function openCard(device: Device, title: string) {
  const opener = () => document.querySelector(`[data-figma="${device.item} · ${title}"] button`)
  await expect.poll(opener).not.toBeNull()
  const button = opener()
  if (!(button instanceof HTMLElement)) throw new Error(`no ${device.item} for ${title}`)
  await userEvent.click(button)
  await expect.poll(() => document.querySelector('[data-figma="title block"] h2')?.textContent).toBe(title)
}

/** Picks `project` for the open artifact: from the project chip's menu, or the phone's File in a project sheet. */
async function pickProject(device: Device, project: string) {
  if (phone(device)) {
    await userEvent.click(page.getByRole('button', { name: 'File in a project', exact: true }))
    await userEvent.click(page.getByRole('dialog').getByText(project, { exact: true }))
    return
  }
  await userEvent.click(page.getByRole('button', { name: /^File in a project: / }))
  await userEvent.click(page.getByRole('menuitemradio', { name: project }))
}

/** Presses Remove on the open artifact: the bar's on the desktop, the sheet's on the phone. */
async function pressRemove(device: Device) {
  if (phone(device)) {
    await userEvent.click(page.getByRole('button', { name: 'File in a project', exact: true }))
    await userEvent.click(page.getByRole('button', { name: 'Remove from the library' }))
  } else await userEvent.click(page.getByRole('button', { name: 'Remove', exact: true }))
}

describe('the live library writes', () => {
  for (const device of devices) {
    it(`adds a new link (201), closes the form and lists it as found, on ${device.name}`, async () => {
      const server = withServer()
      await tapArtifacts(device)
      await expect.poll(() => shown(device)).toEqual(['Sample plan', 'Sample notes'])
      const { form, add } = await fillAddLink(device, newLink, 'Sample added')
      await userEvent.click(add)
      await expect.poll(() => shown(device)).toEqual(['Sample added', 'Sample plan', 'Sample notes'])
      await expect.element(form).not.toBeInTheDocument()
      expect(server.calls('add').map((c) => c.body)).toEqual([
        { link: newLink, source: 'claude', title: 'Sample added' },
      ])
      expect(getReports()).toEqual([])
    })

    it(`adds a link the library has (200), closes the form and opens that artifact, on ${device.name}`, async () => {
      const server = withServer()
      await tapArtifacts(device)
      await expect.poll(() => shown(device)).toEqual(['Sample plan', 'Sample notes'])
      const { form, add } = await fillAddLink(device, plan.link, 'Sample plan again')
      await userEvent.click(add)
      await expect.poll(() => document.querySelector('[data-figma="title block"] h2')?.textContent).toBe('Sample plan')
      await expect.element(form).not.toBeInTheDocument()
      expect(server.calls('add')).toHaveLength(1)
      expect(server.artifacts().map((a) => a.title)).toEqual(['Sample plan', 'Sample notes'])
    })

    if (!phone(device))
      it('adds a link from the list beside an open artifact (D2), on the desktop', async () => {
        const server = withServer()
        await tapArtifacts(device)
        await openCard(device, 'Sample plan')
        await userEvent.click(
          page.getByRole('region', { name: 'Artifacts list' }).getByRole('button', { name: 'Add a link' }),
        )
        const form = page.getByRole('dialog')
        await userEvent.fill(form.getByRole('textbox', { name: 'Link' }), newLink)
        await userEvent.fill(form.getByRole('textbox', { name: 'Title' }), 'Sample added')
        await userEvent.click(form.getByRole('button', { name: 'Add artifact', exact: true }))
        await expect.element(form).not.toBeInTheDocument()
        await expect
          .poll(() => server.artifacts().map((a) => a.title))
          .toEqual(['Sample added', 'Sample plan', 'Sample notes'])
        await expect.poll(() => document.querySelector('[data-figma="artifact row · Sample added"]')).not.toBeNull()
      })

    it(`adds a link in the project picked in the form, on ${device.name}`, async () => {
      const server = withServer()
      await tapArtifacts(device)
      await expect.poll(() => shown(device)).toEqual(['Sample plan', 'Sample notes'])
      const { form, add } = await fillAddLink(device, newLink, 'Sample added')
      await userEvent.click(
        form.getByRole('button', { name: /^Project/ }).or(form.getByRole('combobox', { name: 'Project' })),
      )
      await userEvent.click(
        page
          .getByRole('menuitemradio', { name: 'sample-project' })
          .or(page.getByRole('option', { name: 'sample-project' })),
      )
      await userEvent.click(add)
      await expect
        .poll(() => server.calls('add').map((c) => c.body))
        .toEqual([{ link: newLink, source: 'claude', title: 'Sample added', project: 'sample-project' }])
    })

    it(`keeps the form with a line when the server refuses the link, on ${device.name}`, async () => {
      const server = withServer()
      await tapArtifacts(device)
      const { form, add } = await fillAddLink(device, 'sample-site.example.com', '')
      await userEvent.click(add)
      await expect.element(form.getByText('Not added — check the link and the title')).toBeVisible()
      expect(server.calls('add').map((c) => c.body)).toEqual([
        { link: 'https://sample-site.example.com', source: 'codex', title: '' },
      ])
      expect(getReports()).toEqual([])
    })

    it(`files an artifact in no project and shows it, on ${device.name}`, async () => {
      const server = withServer()
      await tapArtifacts(device)
      await openCard(device, 'Sample plan')
      await pickProject(device, 'Not in a project')
      await expect.poll(() => server.calls('file').map((c) => c.body)).toEqual([{ project: null }])
      expect(server.artifacts().find((a) => a.id === plan.id)?.project).toBeNull()
      await expect.poll(() => server.calls('list').length).toBeGreaterThanOrEqual(2)
    })

    if (!phone(device))
      it('sends a second project pick made while the first is saving, on the desktop', async () => {
        const server = withServer()
        // The first pick's answer comes late and changes nothing; the second pick puts the artifact back in its project.
        server.answerNext(
          'file',
          () =>
            new Promise<Response>((resolve) => {
              setTimeout(() => {
                resolve(new Response(null, { status: 204 }))
              }, 600)
            }),
        )
        await tapArtifacts(device)
        await openCard(device, 'Sample plan')
        await pickProject(device, 'Not in a project')
        await expect.poll(() => server.calls('file').length).toBe(1)
        await pickProject(device, 'sample-project')
        await expect
          .poll(() => server.calls('file').map((c) => c.body))
          .toEqual([{ project: null }, { project: 'sample-project' }])
        await expect.poll(() => server.artifacts().find((a) => a.id === plan.id)?.project).toBe('sample-project')
      })

    it(`says in the artifact's line that filing failed, and reports its kind and status only, on ${device.name}`, async () => {
      const server = withServer()
      server.answerNext('file', () => artifactsError('internal', 500))
      await tapArtifacts(device)
      await openCard(device, 'Sample plan')
      await pickProject(device, 'Not in a project')
      await expect.element(statusLine('Not filed — the server answered 500').first()).toBeInTheDocument()
      expect(server.artifacts().find((a) => a.id === plan.id)?.project).toBe('sample-project')
      expect(getReports().map((r) => [r.error.name, r.error.message])).toEqual([
        ['ArtifactsMissError', 'An artifacts request missed: file internal 500'],
      ])
    })

    it(`removes an artifact from the library, on ${device.name}`, async () => {
      const server = withServer()
      await tapArtifacts(device)
      await openCard(device, 'Sample plan')
      await pressRemove(device)
      await expect.poll(() => shown(device)).toEqual(['Sample notes'])
      expect(server.calls('remove').map((c) => c.path)).toEqual([`/api/artifacts/${plan.id}`])
      expect(getReports()).toEqual([])
    })

    it(`keeps the artifact with a line when Remove fails, on ${device.name}`, async () => {
      const server = withServer()
      server.answerNext('remove', () => Promise.reject(new TypeError('Failed to fetch')))
      await tapArtifacts(device)
      await openCard(device, 'Sample plan')
      await pressRemove(device)
      await expect.element(statusLine('Not removed — the server did not answer').first()).toBeInTheDocument()
      expect(server.artifacts().map((a) => a.title)).toEqual(['Sample plan', 'Sample notes'])
      expect(getReports()).toEqual([])
    })
  }
})
