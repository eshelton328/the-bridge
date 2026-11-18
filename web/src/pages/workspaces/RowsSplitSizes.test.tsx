import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../../index.css'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { testRender } from '../../lib/testRender.ts'
import { resizedPanes } from './states/resizedPanes.ts'
import type { WorkspacesUi } from './types.ts'
import { WorkbenchPanes } from './blocks/WorkbenchPanes.tsx'

document.documentElement.classList.add('dark')
document.documentElement.dataset.pandaTheme = 'viewscreen'

// The panes keep each change, as the screen does.
function Panes() {
  const [ui, setUi] = useState<WorkspacesUi>(resizedPanes.ui)
  return (
    <WorkbenchPanes
      data={resizedPanes.data}
      ui={ui}
      onUiChange={(change) => {
        setUi((was) => ({ ...was, ...change }))
      }}
    />
  )
}

let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
})

describe('the rows-first split', () => {
  it('keeps the top row at 60 : 40 when Erik resizes the rows', async () => {
    view = await testRender(<Panes />)
    const top = page.getByRole('separator', { name: 'Resize columns' })
    await expect.element(top).toHaveAttribute('aria-valuenow', '60')
    await userEvent.click(page.getByRole('separator', { name: 'Resize rows' }))
    await userEvent.keyboard('{ArrowDown}')
    await expect.element(page.getByText('60 : 40')).not.toBeInTheDocument()
    await expect.element(top).toHaveAttribute('aria-valuenow', '60')
  })
})
