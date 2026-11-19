import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../../index.css'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../../lib/testRender.ts'
import { ChatPane } from './ChatPane.tsx'

document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

const skillsLabel = 'SKILLS'
const skills = [
  { name: '/writer', description: 'Draft a doc from sources' },
  { name: '/readme', description: 'Write or check a README' },
]

// A chat whose skill list starts closed, with the open state kept as the screen keeps it.
function Chat({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <ChatPane
      figma={{ composer: 'composer' }}
      entries={[]}
      composer={{ placeholder: 'Message, or / for a skill', text, attachments: [], running: false }}
      skills={{ label: skillsLabel, items: skills, value: null, open }}
      onSkillsOpenChange={setOpen}
    />
  )
}

const box = () => page.getByRole('textbox', { name: 'Message, or / for a skill' })
const writer = () => page.getByRole('radio', { name: /\/writer/ })

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
})

describe('the skill list of a chat', () => {
  it('stays closed when the owner clicks the empty message box, and his typing goes into the box', async () => {
    view = await testRender(<Chat text="" />)
    await userEvent.click(box())
    await userEvent.keyboard('hello')
    await expect.element(box()).toHaveValue('hello')
    await expect.element(box()).toHaveFocus()
    await expect.element(writer()).not.toBeInTheDocument()
  })

  it('opens when the owner types "/" and keeps the focus in the box', async () => {
    view = await testRender(<Chat text="" />)
    await userEvent.click(box())
    await userEvent.keyboard('/')
    await expect.element(writer()).toBeVisible()
    await userEvent.keyboard('wr')
    await expect.element(box()).toHaveValue('/wr')
    await expect.element(box()).toHaveFocus()
  })

  it('closes when the message no longer starts with "/"', async () => {
    view = await testRender(<Chat text="" />)
    await userEvent.click(box())
    await userEvent.keyboard('/')
    await expect.element(writer()).toBeVisible()
    await userEvent.keyboard('{Backspace}')
    await expect.element(writer()).not.toBeInTheDocument()
    await expect.element(box()).toHaveFocus()
  })

  it('opens on a "/" after a space and keeps the skills that start with the word the owner types (M10)', async () => {
    view = await testRender(
      <ChatPane
        figma={{ composer: 'composer' }}
        entries={[]}
        composer={{ placeholder: 'Message, or / for a skill', text: '', attachments: [], running: false }}
        skills={{ label: skillsLabel, matching: 'SKILLS MATCHING {query}', items: skills, value: null, open: true }}
      />,
    )
    await expect.element(page.getByText('SKILLS', { exact: true })).toBeInTheDocument()
    await userEvent.click(box())
    await userEvent.keyboard('a doc with /wri')
    await expect.element(page.getByText('SKILLS MATCHING /wri')).toBeInTheDocument()
    await expect.element(writer()).toBeVisible()
    await expect.element(page.getByRole('radio', { name: /\/readme/ })).not.toBeInTheDocument()
  })

  it('draws the typed text in its own case after the capital label: SKILLS MATCHING /wri (M10 147:72)', async () => {
    view = await testRender(
      <ChatPane
        figma={{ composer: 'composer' }}
        entries={[]}
        composer={{ placeholder: 'Message, or / for a skill', text: '', attachments: [], running: false }}
        skills={{ label: skillsLabel, matching: 'SKILLS MATCHING {query}', items: skills, value: null, open: true }}
      />,
    )
    await userEvent.click(box())
    await userEvent.keyboard('a doc with /wri')
    const section = page.getByRole('group', { name: 'SKILLS MATCHING /wri' })
    await expect.element(section).toBeInTheDocument()
    const label = section.element().firstElementChild
    if (!(label instanceof HTMLElement)) throw new Error('The section has no label')
    // innerText is the text as drawn, after text-transform.
    expect(label.innerText).toBe('SKILLS MATCHING /wri')
  })

  it('stays closed while no word starts with "/"', async () => {
    view = await testRender(<Chat text="" />)
    await userEvent.click(box())
    await userEvent.keyboard('a doc with ')
    await expect.element(writer()).not.toBeInTheDocument()
    await userEvent.keyboard('/')
    await expect.element(writer()).toBeVisible()
    await expect.element(box()).toHaveFocus()
  })
})
