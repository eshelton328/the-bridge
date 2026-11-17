// One section of an item's detail: an eyebrow heading ("WHY"), optional
// controls at its end, and its content. data-figma names the Figma layer
// ("section · WHY") for the position check. Props only.
import { Inline, Stack } from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'

const heading = css({ textStyle: 'eyebrow', textTransform: 'uppercase', color: 'fg.muted', m: '0' })

export type DetailSectionProps = {
  title: string
  /** Next to the heading, such as an "Edited" pill. */
  meta?: ReactNode
  /** Buttons at the end of the heading row, such as Reset and Edit. */
  actions?: ReactNode
  children: ReactNode
}

export function DetailSection({ title, meta, actions, children }: DetailSectionProps) {
  return (
    <section aria-label={title} data-figma={`section · ${title.toUpperCase()}`}>
      <Stack gap="8">
        <Inline gap="8" align="center" justify="between">
          <Inline gap="8" align="center">
            <h2 className={heading}>{title}</h2>
            {meta}
          </Inline>
          {actions === undefined ? null : (
            <Inline gap="8" align="center">
              {actions}
            </Inline>
          )}
        </Inline>
        {children}
      </Stack>
    </section>
  )
}
