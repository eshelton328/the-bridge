// The play of each Inbox tablet and phone state, at its frame size.
import { devicePlays } from '../../../.storybook/devicePlays.ts'
import * as stories from './screens/InboxScreen.stories.tsx'
import { inboxStates } from './states/index.ts'

devicePlays(stories, inboxStates)
