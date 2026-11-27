// The play of each Projects tablet and phone state, at its frame size: T10b at
// the landscape iPad's (states/screens.ts, the wide screen).
import { devicePlays } from '../../../.storybook/devicePlays.ts'
import * as stories from './screens/ProjectsScreen.stories.tsx'
import { projectsStates } from './states/index.ts'
import { projectsScreens } from './states/screens.ts'

devicePlays(stories, projectsStates, projectsScreens)
