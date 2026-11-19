// The play of each Artifacts tablet and phone state, at its frame size.
import { devicePlays } from '../../../.storybook/devicePlays.ts'
import * as stories from './screens/ArtifactsScreen.stories.tsx'
import { artifactsStates } from './states/index.ts'

devicePlays(stories, artifactsStates)
