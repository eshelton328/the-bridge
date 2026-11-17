import type { Meta, StoryObj } from '@storybook/react-vite'
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import { expect } from 'storybook/test'
import { NotFound } from './NotFound.tsx'
import { RouteError } from './RouteError.tsx'

const control = { fail: true }

// A router with the app's defaults and one route whose loader fails while
// `control.fail` is true.
function storyRouter(path: string) {
  const root = createRootRoute()
  const broken = createRoute({
    getParentRoute: () => root,
    path: '/broken',
    loader: () => {
      if (control.fail) throw new Error('A loader failed on purpose')
      return 'loaded'
    },
    component: () => <p>Route recovered</p>,
  })
  return createRouter({
    routeTree: root.addChildren([broken]),
    history: createMemoryHistory({ initialEntries: [path] }),
    defaultErrorComponent: RouteError,
    defaultNotFoundComponent: NotFound,
  })
}

const meta = {
  title: 'Errors/Route fallbacks',
  component: RouterProvider,
  beforeEach: () => {
    control.fail = true
  },
} satisfies Meta<typeof RouterProvider>

export default meta
type Story = StoryObj<typeof meta>

export const Crashed: Story = {
  args: { router: storyRouter('/broken') },
  play: async ({ canvas, userEvent }) => {
    await expect(await canvas.findByRole('heading', { name: 'This page failed to load' })).toBeVisible()
    control.fail = false
    await userEvent.click(canvas.getByRole('button', { name: 'Retry' }))
    await expect(await canvas.findByText('Route recovered')).toBeVisible()
  },
}

export const NotFoundPage: Story = {
  args: { router: storyRouter('/nowhere') },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('heading', { name: 'Page not found' })).toBeVisible()
  },
}
