import { expect, test } from 'vitest'
import * as inboxStories from './InboxScreen.stories.tsx'
import preview, { viewports } from '../../../../.storybook/preview.ts'

// A story that sets globals.viewport locks Storybook's viewport menu and
// ignores a `&globals=viewport.value:phone` link, so the default lives in
// preview.initialGlobals and no story sets it.
test('Storybook opens at desktop and every Figma device is in the menu', () => {
  expect(preview.initialGlobals?.viewport).toEqual({ value: 'desktop', isRotated: false })
  expect(Object.keys(viewports)).toEqual(['desktop', 'tablet', 'phone'])
})

test('no Inbox story locks the viewport', () => {
  for (const [name, story] of Object.entries(inboxStories)) {
    if (name === 'default') continue
    expect('globals' in story ? story.globals : undefined, name).toBeUndefined()
  }
})
