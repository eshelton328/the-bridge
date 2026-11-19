// The play of each Toolkit tablet and phone state, at its frame size.
import { devicePlays } from '../../../.storybook/devicePlays.ts'
import * as stories from './screens/ToolkitScreen.stories.tsx'
import { toolkitStates } from './states/index.ts'

devicePlays(stories, toolkitStates)
