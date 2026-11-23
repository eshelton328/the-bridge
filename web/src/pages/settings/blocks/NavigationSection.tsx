// Settings' Navigation (d-038, d-119): each entry of the bar order with
// buttons that move it up or down, and a switch that shows or hides a page.
// Settings is an entry with no switch: when it is not in the tab bar it is
// in More (the rail's gear on the desktop), so it can never be lost. A line
// after the last entry that fits in this device's tab bar says that the
// rest are under More; the screen passes that entry as `cutAfter`, and no
// line shows on the desktop or when every shown entry fits. A switch the
// rules refuse to turn off (the last shown page besides Home) stays on,
// with its line. Props only.
import { ArrowDownIcon, ArrowUpIcon, Button, Panel, Switch } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { barPageItems } from '../../../blocks/navPages.ts'
import type { BarPage, NavPage } from '../../../lib/deviceSettings.ts'
import type { NavNotice, SettingsValues } from '../types.ts'
import { note, rowLabel, rows } from './settingsParts.ts'

const line = css({ display: 'flex', alignItems: 'center', gap: '8' })
const grow = css({ flex: '1', minW: '[0]', display: 'flex', flexDirection: 'column', gap: '4' })
const cut = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  pt: '8',
  borderTopWidth: 'default',
  borderTopStyle: 'solid',
  borderTopColor: 'border.default',
})

/** The line under a switch the owner could not turn off. */
const navNoticeText = 'Keep one page besides Home shown.'

export type NavigationSectionProps = {
  nav: SettingsValues['nav']
  notice?: NavNotice | undefined
  /** The last entry in this device's tab bar when More holds the rest; none on the desktop or when all fit. */
  cutAfter?: BarPage | undefined
  onVisibleChange?: ((page: NavPage, visible: boolean) => void) | undefined
  onMove?: ((page: BarPage, by: -1 | 1) => void) | undefined
}

export function NavigationSection({ nav, notice, cutAfter, onVisibleChange, onMove }: NavigationSectionProps) {
  return (
    <Panel variant="section" title="Navigation">
      <div className={rows}>
        <span className={note}>
          The pages in the rail and the tab bar, in order. The phone shows the first four, the iPad the first five; the
          others are under More. Home is the logo on the desktop.
        </span>
        {nav.map((entry, i) => {
          const { label } = barPageItems[entry.page]
          const { page } = entry
          return (
            <div key={page} className={rows}>
              <div className={line} data-nav-entry={page}>
                <div className={grow}>
                  {page === 'settings' ? (
                    <>
                      <span className={rowLabel}>{label}</span>
                      <span className={note}>Always shown: in the bar or under More.</span>
                    </>
                  ) : (
                    <Switch
                      label={label}
                      hint={notice?.page === page ? navNoticeText : undefined}
                      checked={entry.visible}
                      onCheckedChange={(visible) => {
                        onVisibleChange?.(page, visible)
                      }}
                    />
                  )}
                </div>
                <Button
                  variant="secondary"
                  size="md"
                  aria-label={`Move ${label} up`}
                  disabled={i === 0}
                  onClick={() => {
                    onMove?.(page, -1)
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
                    onMove?.(page, 1)
                  }}
                >
                  <ArrowDownIcon />
                </Button>
              </div>
              {page === cutAfter && (
                <div className={cut} role="separator" aria-label="Under More on this device">
                  <span className={note}>Under More on this device</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
