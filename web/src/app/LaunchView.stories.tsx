import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor } from 'storybook/test'
import indexHtml from '../../index.html?raw'
import { css } from '../../styled-system/css/index.js'

// The launch view (index.html's #launch): what shows from the first paint until the app draws, as a cold start
// paints it, with no script and no CSS file. The glow breathes; after 8 s a line says "Still connecting…".
const bare = (dark: boolean) =>
  indexHtml
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace('<html lang="en" class="dark"', dark ? '<html lang="en" class="dark"' : '<html lang="en"')

const frames = css({ display: 'flex', gap: '16', alignItems: 'flex-start' })
const phone = css({ w: '[390px]', h: '[844px]', borderWidth: 'default', borderColor: 'border.default' })
const tablet = css({ w: '[744px]', h: '[1133px]', borderWidth: 'default', borderColor: 'border.default' })

function LaunchFrames({ dark }: { dark: boolean }) {
  return (
    <div className={frames}>
      <iframe title="Phone" className={phone} srcDoc={bare(dark)} />
      <iframe title="Tablet" className={tablet} srcDoc={bare(dark)} />
    </div>
  )
}

const meta = { title: 'App/Launch view', component: LaunchFrames } satisfies Meta<typeof LaunchFrames>
export default meta
type Story = StoryObj<typeof meta>

const check: Story['play'] = async ({ canvas }) => {
  for (const name of ['Phone', 'Tablet']) {
    const frame = canvas.getByTitle(name)
    if (!(frame instanceof HTMLIFrameElement)) throw new Error('no frame')
    await waitFor(() => {
      if (frame.contentDocument?.getElementById('launch-mark') == null) throw new Error('not loaded')
    })
    const mark = frame.contentDocument?.getElementById('launch-mark')?.getBoundingClientRect()
    await expect(Math.abs((mark?.left ?? 0) + (mark?.width ?? 0) / 2 - frame.clientWidth / 2)).toBeLessThanOrEqual(1)
  }
}

/** Dark, the default: the Backdrop's stars and glow and the Logo at its centre, on the phone and the tablet. */
export const Dark: Story = { args: { dark: true }, play: check }

/** Light: the light canvas and glow; the Backdrop has no stars in light mode. */
export const Light: Story = { args: { dark: false }, play: check }
