import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import type { ScreenState } from '../../../lib/screenState.ts'
import { workspacesStates } from '../states/index.ts'
import type { WorkspacesData, WorkspacesUi } from '../types.ts'
import { WorkspacesScreen } from './WorkspacesScreen.tsx'

// The Workspaces page when the live source could not be read (audit W-2,
// P-2, d-117): no workspaces and none of the sample's, laid out by the width
// as the home is, with the notice and its Retry until the owner dismisses it
// and the reason in the status bar, as withLiveWorkspaces gives them for a
// server that answered 502. Storybook's viewport menu shows the desktop, tablet and phone;
// LiveNotice.test.tsx runs the phone story's play at the phone's size. It is
// not a Figma state, so it is not under States and has no frame, board or
// fidelity check.
const liveUnavailable = {
  title: 'Workspaces with live data unavailable',
  frames: [],
  data: {
    ...workspacesStates.phoneHome.data,
    tabletList: true,
    workspaces: [],
    current: null,
    panes: [],
    sideChat: undefined,
    subagents: undefined,
    folders: undefined,
    lastChats: undefined,
    status: {
      ...workspacesStates.phoneHome.data.status,
      alert: 'Live data is not available (the server answered 502); the page shows no workspaces.',
    },
    liveNotice: {
      title: 'Live data unavailable — no workspaces shown',
      description: 'The-bridge server did not answer (502). Start it or check the tailnet, then retry.',
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

const play: Story['play'] = async ({ canvasElement, args }) => {
  const canvas = within(canvasElement)
  const notice = canvas.getByRole('alert')
  await expect(notice).toHaveTextContent('Live data unavailable — no workspaces shown')
  await expect(notice).toHaveTextContent(
    'The-bridge server did not answer (502). Start it or check the tailnet, then retry.',
  )
  await expect(notice).toBeVisible()
  // No sample workspace shows under it.
  await expect(canvas.queryByText('release notes')).toBeNull()
  await expect(canvas.queryByText('omni-brain')).toBeNull()
  await userEvent.click(canvas.getByRole('button', { name: 'Retry' }))
  await expect(args.onRetry).toHaveBeenCalledTimes(1)
  await userEvent.click(canvas.getByRole('button', { name: 'Dismiss' }))
  await expect(canvas.queryByRole('alert')).toBeNull()
}

export const Desktop: Story = {
  name: 'Live data unavailable on the desktop',
  args: { data: liveUnavailable.data, ui: liveUnavailable.ui, viewport: 'desktop', onRetry: fn() },
  play,
}

export const Phone: Story = {
  name: 'Live data unavailable on the phone',
  args: { data: liveUnavailable.data, ui: liveUnavailable.ui, viewport: 'phone', onRetry: fn() },
  play,
}
