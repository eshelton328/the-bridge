// The open Inbox item: a next step with its why, suggested prompt, where
// to run it, notes and sources. Props only.
import {
  Button,
  FeatureIcon,
  FileIcon,
  FolderIcon,
  Inline,
  KindMark,
  LinearIcon,
  MetaChip,
  Panel,
  Stack,
  StatusPill,
  TagIcon,
  TagsLine,
  TextArea,
} from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { InboxDetailView } from '../types.ts'

// The app shell's detail slot scrolls; this only pads it. Figma pads 36 px at the sides: the nearest token is 32 (d-072).
const main = css({ px: '32', pt: '24', pb: '40' })
const title = css({ textStyle: 'heading', m: '0' })
const muted = css({ textStyle: 'body', color: 'fg.muted', m: '0' })
const caption = css({ textStyle: 'small', color: 'fg.muted', flex: '1' })
const mono = css({ textStyle: 'mono', color: 'fg.muted' })
const runTitle = css({ textStyle: 'label' })
const grow = css({ flex: '1' })

const chipIcons = {
  folder: <FolderIcon />,
  feature: <FeatureIcon />,
  linear: <LinearIcon />,
  file: <FileIcon />,
} as const satisfies Record<InboxDetailView['chips'][number]['icon'], ReactNode>

const chip = (c: InboxDetailView['chips'][number]) => (
  <MetaChip key={c.label} label={c.label} icon={chipIcons[c.icon]} tone={c.issue ? 'issue' : undefined} />
)

export function InboxDetail({ detail }: { detail: InboxDetailView }) {
  return (
    <article className={main}>
      {/* Figma caps the article at 748 px; no size token has that width yet, a gap to raise in the library. */}
      <article>
        <Stack gap="24">
          <Inline gap="12" align="center" wrap>
            <StatusPill tone={detail.status.tone} label={detail.status.label} />
            <span className={caption}>{detail.suggested}</span>
            <Button size="sm">Snooze</Button>
            <Button size="sm">Dismiss</Button>
          </Inline>
          <Stack gap="10">
            <h1 className={title}>{detail.title}</h1>
            <Inline gap="6" wrap>
              {detail.chips.map(chip)}
            </Inline>
            <TagsLine tags={detail.tags} icon={<TagIcon />} />
          </Stack>
          <Panel title="Why">
            <p className={muted}>{detail.why}</p>
          </Panel>
          <Panel
            title="Suggested prompt"
            actions={
              <>
                <Button size="sm">Reset</Button>
                <Button size="sm">Edit</Button>
              </>
            }
          >
            <Stack gap="8">
              <p className={muted}>{detail.prompt}</p>
              <a href="#prompt">Read the whole prompt</a>
            </Stack>
          </Panel>
          <Panel title="Run in">
            <Inline gap="12" align="center" wrap>
              <KindMark kind="claude" size="20" />
              <div className={grow}>
                <Stack gap="4">
                  <Inline gap="8" align="center">
                    <span className={runTitle}>{detail.runIn.title}</span>
                    <StatusPill tone="done" label={detail.runIn.badge} />
                  </Inline>
                  <span className={mono}>{detail.runIn.detail}</span>
                </Stack>
              </div>
              <Button size="sm">Change</Button>
            </Inline>
          </Panel>
          <Inline gap="12" align="center" wrap>
            <Button variant="primary" size="lg">
              {detail.startLabel}
            </Button>
            <span className={caption}>{detail.startHint}</span>
          </Inline>
          <TextArea label="My notes" defaultValue={detail.notes} />
          <Panel title="Sources">
            <Inline gap="6" wrap>
              {detail.sources.map(chip)}
            </Inline>
          </Panel>
        </Stack>
      </article>
    </article>
  )
}
