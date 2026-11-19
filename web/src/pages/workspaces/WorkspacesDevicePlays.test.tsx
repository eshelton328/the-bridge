// The play of each Workspaces tablet and phone state, at its frame size.
import { devicePlays } from '../../../.storybook/devicePlays.ts'
import * as stories from './screens/WorkspacesScreen.stories.tsx'
import { workspacesStates } from './states/index.ts'

devicePlays(stories, workspacesStates)
