// Settings' Navigation (d-038, d-119): each nav page with a switch that
// shows or hides it and buttons that move it up or down. The phone's tab
// bar shows the first four shown pages and the iPad's the first five; the
// rest are under More. Settings is not in the list: it is always in the
// rail and the More drawer. A switch the rules refuse to turn off (the last
// shown page besides Home) stays on, with its line. Props only.
import { ArrowDownIcon, ArrowUpIcon, Button, Panel, Switch } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { navPageItems } from '../../../blocks/navPages.ts'
import type { NavPage } from '../../../lib/deviceSettings.ts'
import type { NavNotice, SettingsValues } from '../types.ts'
import { note, rows } from './settingsParts.ts'

const line = css({ display: 'flex', alignItems: 'center', gap: '8' })
const grow = css({ flex: '1', minW: '[0]' })

/** The line under a switch the owner could not turn off. */
const navNoticeText = 'Keep one page besides Home shown.'

export type NavigationSectionProps = {
  nav: SettingsValues['nav']
  notice?: NavNotice | undefined
  onVisibleChange?: ((page: NavPage, visible: boolean) => void) | undefined
  onMove?: ((page: NavPage, by: -1 | 1) => void) | undefined
}

export function NavigationSection({ nav, notice, onVisibleChange, onMove }: NavigationSectionProps) {
  return (
    <Panel variant="section" title="Navigation">
      <div className={rows}>
        <span className={note}>
          The pages in the rail and the tab bar, in order. The phone shows the first four, the iPad the first five; the
          others are under More. Home is the logo on the desktop.
        </span>
        {nav.map((entry, i) => {
          const { label } = navPageItems[entry.page]
          return (
            <div key={entry.page} className={line}>
              <div className={grow}>
                <Switch
                  label={label}
                  hint={notice?.page === entry.page ? navNoticeText : undefined}
                  checked={entry.visible}
                  onCheckedChange={(visible) => {
                    onVisibleChange?.(entry.page, visible)
                  }}
                />
              </div>
              <Button
                variant="secondary"
                size="md"
                aria-label={`Move ${label} up`}
                disabled={i === 0}
                onClick={() => {
                  onMove?.(entry.page, -1)
                }}
              >
                <ArrowUpIcon />
              </Button>
              <Button
                variant="secondary"
                size="md"
                aria-label={`Move ${label} down`}
                disabled={i === nav.length - 1}
                onClick={() => {
                  onMove?.(entry.page, 1)
                }}
              >
                <ArrowDownIcon />
              </Button>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
