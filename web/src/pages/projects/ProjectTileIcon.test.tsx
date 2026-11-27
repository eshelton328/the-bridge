import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { testRender, unmountRendered } from '../../lib/testRender.ts'
import { ProjectTile } from './blocks/ProjectTile.tsx'

afterEach(unmountRendered)

// project.yaml's `icon` is the owner's text: a name such as "constructor" must not read an Object property.
describe('ProjectTile', () => {
  for (const icon of ['constructor', '__proto__', 'toString', 'no-such-icon']) {
    it(`draws the letter for the icon "${icon}"`, async () => {
      await testRender(<ProjectTile name="example" icon={icon} />)
      await expect.element(page.getByText('E', { exact: true })).toBeInTheDocument()
    })
  }
})
