// The top of an item's detail: the task bar (status, where it came from,
// Snooze and Dismiss) and the title block (title, meta chips and tags).
// Props only.
import {
  Button,
  CloseIcon,
  FeatureIcon,
  FileIcon,
  FolderIcon,
  Inline,
  LinearIcon,
  MetaChip,
  SnoozeIcon,
  Stack,
  StatusPill,
  TagIcon,
  TagsLine,
} from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { InboxDetailHead } from '../types.ts'

const origin = css({ textStyle: 'mono', color: 'fg.muted', flex: '1' })
const title = css({ textStyle: 'title', m: '0' })

const chipIcons = {
  folder: <FolderIcon />,
  feature: <FeatureIcon />,
  linear: <LinearIcon />,
  file: <FileIcon />,
} as const satisfies Record<InboxDetailHead['chips'][number]['icon'], ReactNode>

export function DetailHead({ head }: { head: InboxDetailHead }) {
  return (
    <>
      <Inline gap="8" align="center" data-figma="task bar">
        <StatusPill tone={head.status.tone} label={head.status.label} dot />
        <span className={origin}>{head.origin}</span>
        <Button size="sm">
          <SnoozeIcon />
          Snooze
        </Button>
        <Button size="sm">
          <CloseIcon />
          Dismiss
        </Button>
      </Inline>
      <Stack gap="10" data-figma="title block">
        <h1 className={title}>{head.title}</h1>
        <Inline gap="6" wrap>
          {head.chips.map((c) => (
            <MetaChip
              key={c.label}
              size="sm"
              label={c.label}
              icon={chipIcons[c.icon]}
              tone={c.issue ? 'issue' : undefined}
            />
          ))}
        </Inline>
        <TagsLine tags={head.tags} icon={<TagIcon />} />
      </Stack>
    </>
  )
}
