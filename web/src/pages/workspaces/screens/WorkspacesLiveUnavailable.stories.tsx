import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import type { ScreenState } from '../../../lib/screenState.ts'
import { workspacesStates } from '../states/index.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { WorkspacesScreen } from './WorkspacesScreen.tsx'

// The Workspaces page when the live source (`?source=live`) could not be read
// (audit W-2, P-2): M1's sample data, laid out by the width as the home is,
// with the notice over it until the owner dismisses it and the reason in the
// status bar, as withLiveWorkspaces gives them for a server that answered
// 502. Storybook's viewport menu shows the desktop, tablet and phone;
// LiveNotice.test.tsx runs the phone story's play at the phone's size. It is
// not a Figma state, so it is not under States and has no frame, board or
// fidelity check.
const liveUnavailable = {
  title: 'Workspaces with live data unavailable',
  frames: [],
  data: {
    ...workspacesStates.phoneHome.data,
    tabletList: true,
    status: {
      ...workspacesStates.phoneHome.data.status,
      alert: 'Live data is not available (the server answered 502); the page shows mock data.',
    },
    liveNotice: {
      title: 'Live data unavailable — showing sample data',
      description: 'The-bridge server did not answer (502). Start it or check the tailnet, then reload.',
    },
  },
  ui: workspacesStates.phoneHome.ui,
} satisfies ScreenState<WorkspacesData, WorkspacesUi>

const meta = {
  title: 'Pages/Workspaces/Live unavailable',
  component: WorkspacesScreen,
} satisfies Meta<typeof WorkspacesScreen>

export default meta
type Story = StoryObj<typeof meta>

const play: Story['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const notice = canvas.getByRole('alert')
  await expect(notice).toHaveTextContent('Live data unavailable — showing sample data')
  await expect(notice).toHaveTextContent(
    'The-bridge server did not answer (502). Start it or check the tailnet, then reload.',
  )
  await expect(notice).toBeVisible()
  // The sample data shows under it.
  await expect(canvas.getAllByText('release notes')[0]).toBeVisible()
  await userEvent.click(canvas.getByRole('button', { name: 'Dismiss' }))
  await expect(canvas.queryByRole('alert')).toBeNull()
}

export const Desktop: Story = {
  name: 'Live data unavailable on the desktop',
  args: { data: liveUnavailable.data, ui: liveUnavailable.ui, viewport: 'desktop' },
  play,
}

export const Phone: Story = {
  name: 'Live data unavailable on the phone',
  args: { data: liveUnavailable.data, ui: liveUnavailable.ui, viewport: 'phone' },
  play,
}
