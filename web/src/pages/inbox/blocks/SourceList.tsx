// The sources of a next step: one link per line, with what it belongs to
// in mono after it. Props only.
import { Inline, LinkIcon, Stack } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { InboxNextStep } from '../types.ts'

const link = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6',
  textStyle: 'body',
  color: 'fg.accent',
  textDecoration: 'none',
  _hover: { textDecoration: 'underline' },
})
const detail = css({ textStyle: 'mono', color: 'fg.subtle' })

export function SourceList({ sources }: { sources: InboxNextStep['sources'] }) {
  return (
    <Stack gap="8">
      {sources.map((s) => (
        <Inline key={s.label} gap="6" align="center">
          <a className={link} href="#sources">
            <LinkIcon size="12" />
            {s.label}
          </a>
          <span className={detail}>{s.detail}</span>
        </Inline>
      ))}
    </Stack>
  )
}
